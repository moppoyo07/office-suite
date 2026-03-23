// src/pages/AdminDataMigrationPage.jsx
// 既存データへの companyId 付与ツール（初回セットアップ用）

import { useState, useEffect } from 'react';
import {
    Box, Typography, Button, Paper, Alert, LinearProgress,
    List, ListItem, ListItemText, Chip, Divider,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress,
    Select, MenuItem, FormControl,
} from '@mui/material';
import { collection, getDocs, writeBatch, doc, query, where, getDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../features/auth/context/AuthContext';

const COLLECTIONS_TO_MIGRATE = [
    { name: 'clients', label: '利用者' },
    { name: 'attendanceRecords', label: '出席記録' },
    { name: 'attendancePlans', label: '出席計画' },
    { name: 'serviceRecords', label: 'サービス記録' },
];

export default function AdminDataMigrationPage() {
    const { currentUser } = useAuth();
    const companyId = currentUser?.companyId;
    const branchId = currentUser?.branchId;

    const [results, setResults] = useState([]);
    const [running, setRunning] = useState(false);
    const [done, setDone] = useState(false);

    const [portalResults, setPortalResults] = useState([]);
    const [portalRunning, setPortalRunning] = useState(false);
    const [portalDone, setPortalDone] = useState(false);

    const [activityResults, setActivityResults] = useState([]);
    const [activityRunning, setActivityRunning] = useState(false);
    const [activityDone, setActivityDone] = useState(false);

    const runMigration = async () => {
        if (!companyId) {
            alert('companyId が設定されていません。ログインユーザーを確認してください。');
            return;
        }
        if (!window.confirm(`このアカウントの法人ID (${companyId}) を、companyId が未設定の全レコードに付与します。よろしいですか？`)) return;

        setRunning(true);
        setDone(false);
        setResults([]);

        const newResults = [];

        for (const col of COLLECTIONS_TO_MIGRATE) {
            try {
                // companyId が未設定のドキュメントを取得
                const snapshot = await getDocs(
                    query(collection(db, col.name), where('companyId', '==', null))
                );

                // null で保存されていないもの（フィールド自体がないもの）も取得
                const allSnapshot = await getDocs(collection(db, col.name));
                const orphans = allSnapshot.docs.filter(d => !d.data().companyId);

                if (orphans.length === 0) {
                    newResults.push({ col: col.label, count: 0, status: 'skip' });
                    continue;
                }

                // Firestore writeBatch は500件まで
                const batches = [];
                let batch = writeBatch(db);
                let batchCount = 0;

                for (const docSnap of orphans) {
                    batch.update(doc(db, col.name, docSnap.id), {
                        companyId,
                        ...(branchId && !docSnap.data().branchId ? { branchId } : {}),
                    });
                    batchCount++;
                    if (batchCount === 499) {
                        batches.push(batch);
                        batch = writeBatch(db);
                        batchCount = 0;
                    }
                }
                if (batchCount > 0) batches.push(batch);

                for (const b of batches) await b.commit();

                newResults.push({ col: col.label, count: orphans.length, status: 'ok' });
            } catch (err) {
                console.error(`${col.name} 移行エラー:`, err);
                newResults.push({ col: col.label, count: 0, status: 'error', error: err.message });
            }
        }

        setResults(newResults);
        setRunning(false);
        setDone(true);
    };

    // ポータル経由データ修正: clientIdからcompanyIdを自動判定
    const runPortalMigration = async () => {
        if (!window.confirm('ポータル経由の出席記録・チェックインに、利用者の法人IDを自動で付与します。よろしいですか？')) return;

        setPortalRunning(true);
        setPortalDone(false);
        setPortalResults([]);

        const newResults = [];

        // clientsのcompanyIdキャッシュ
        const clientCache = {};
        const getClientCompanyId = async (clientId) => {
            if (!clientId) return null;
            if (clientCache[clientId] !== undefined) return clientCache[clientId];
            const snap = await getDoc(doc(db, 'clients', clientId));
            const cid = snap.exists() ? snap.data().companyId || null : null;
            clientCache[clientId] = cid;
            return cid;
        };

        for (const colName of ['attendanceRecords', 'dailyCheckins']) {
            try {
                const allSnap = await getDocs(collection(db, colName));
                const orphans = allSnap.docs.filter(d => !d.data().companyId);

                if (orphans.length === 0) {
                    newResults.push({ col: colName, count: 0, status: 'skip' });
                    continue;
                }

                let updated = 0;
                let skipped = 0;
                let batch = writeBatch(db);
                let batchCount = 0;

                for (const docSnap of orphans) {
                    const clientId = docSnap.data().clientId;
                    const clientCompanyId = await getClientCompanyId(clientId);

                    if (!clientCompanyId) {
                        skipped++;
                        continue;
                    }

                    batch.update(doc(db, colName, docSnap.id), { companyId: clientCompanyId });
                    batchCount++;
                    updated++;

                    if (batchCount === 499) {
                        await batch.commit();
                        batch = writeBatch(db);
                        batchCount = 0;
                    }
                }
                if (batchCount > 0) await batch.commit();

                newResults.push({ col: colName, count: updated, skipped, status: 'ok' });
            } catch (err) {
                console.error(`${colName} ポータル移行エラー:`, err);
                newResults.push({ col: colName, count: 0, status: 'error', error: err.message });
            }
        }

        setPortalResults(newResults);
        setPortalRunning(false);
        setPortalDone(true);
    };

    // activity_logs サブコレクションへの companyId 付与
    const runActivityLogMigration = async () => {
        if (!window.confirm('clients配下の activity_logs に companyId を付与します。よろしいですか？')) return;

        setActivityRunning(true);
        setActivityDone(false);
        setActivityResults([]);

        let updated = 0;
        let skipped = 0;

        try {
            const clientsSnap = await getDocs(query(collection(db, 'clients'), where('companyId', '==', companyId)));

            let batch = writeBatch(db);
            let batchCount = 0;

            for (const clientDoc of clientsSnap.docs) {
                const logsSnap = await getDocs(collection(db, 'clients', clientDoc.id, 'activity_logs'));
                const orphans = logsSnap.docs.filter(d => !d.data().companyId);

                for (const logDoc of orphans) {
                    batch.update(doc(db, 'clients', clientDoc.id, 'activity_logs', logDoc.id), { companyId });
                    batchCount++;
                    updated++;

                    if (batchCount === 499) {
                        await batch.commit();
                        batch = writeBatch(db);
                        batchCount = 0;
                    }
                }
                skipped += logsSnap.docs.length - orphans.length;
            }

            if (batchCount > 0) await batch.commit();
            setActivityResults([{ count: updated, skipped, status: 'ok' }]);
        } catch (err) {
            console.error('activity_logs 移行エラー:', err);
            setActivityResults([{ count: 0, status: 'error', error: err.message }]);
        } finally {
            setActivityRunning(false);
            setActivityDone(true);
        }
    };

    // --- 自治体への会社割り当て ---
    const [muniList, setMuniList] = useState(null); // null=未ロード
    const [muniCompanies, setMuniCompanies] = useState([]); // 全社リスト
    const [muniAssignments, setMuniAssignments] = useState({}); // { muniId: companyId }
    const [muniLoading, setMuniLoading] = useState(false);
    const [muniSaving, setMuniSaving] = useState(false);
    const [muniSaved, setMuniSaved] = useState(false);

    const loadMunicipalitiesForAssign = async () => {
        setMuniLoading(true);
        try {
            const [muniSnap, compSnap] = await Promise.all([
                getDocs(collection(db, 'municipalities')),
                getDocs(collection(db, 'companies')),
            ]);
            const munis = muniSnap.docs.map(d => ({ id: d.id, ...d.data() }));
            const comps = compSnap.docs.map(d => ({ id: d.id, ...d.data() }));
            setMuniList(munis);
            setMuniCompanies(comps);
            // 既存のcompanyIdを初期値に
            const init = {};
            munis.forEach(m => { init[m.id] = m.companyId || ''; });
            setMuniAssignments(init);
        } catch (err) {
            console.error('自治体ロードエラー:', err);
        } finally {
            setMuniLoading(false);
        }
    };

    const saveMuniAssignments = async () => {
        if (!window.confirm('各自治体に選択した会社IDを保存します。よろしいですか？')) return;
        setMuniSaving(true);
        setMuniSaved(false);
        try {
            const batch = writeBatch(db);
            muniList.forEach(m => {
                const cid = muniAssignments[m.id];
                if (cid) {
                    batch.update(doc(db, 'municipalities', m.id), { companyId: cid });
                }
            });
            await batch.commit();
            setMuniSaved(true);
        } catch (err) {
            console.error('保存エラー:', err);
            alert('保存に失敗しました: ' + err.message);
        } finally {
            setMuniSaving(false);
        }
    };

    // --- 重複企業の検出・整理 ---
    const [duplicateLoading, setDuplicateLoading] = useState(false);
    const [duplicateGroups, setDuplicateGroups] = useState(null); // null=未実行

    const checkDuplicateCompanies = async () => {
        setDuplicateLoading(true);
        setDuplicateGroups(null);
        try {
            const [companiesSnap, branchesSnap, clientsSnap, usersSnap] = await Promise.all([
                getDocs(collection(db, 'companies')),
                getDocs(collection(db, 'branches')),
                getDocs(collection(db, 'clients')),
                getDocs(collection(db, 'users')),
            ]);

            // 名前でグループ化
            const byName = {};
            companiesSnap.docs.forEach(d => {
                const name = d.data().name || '(名前なし)';
                if (!byName[name]) byName[name] = [];
                byName[name].push({ id: d.id, ...d.data() });
            });

            // 重複があるもののみ
            const dups = Object.entries(byName).filter(([, list]) => list.length > 1);

            // 各企業のリンクデータ数を集計
            const enriched = dups.map(([name, list]) => ({
                name,
                companies: list.map(c => ({
                    ...c,
                    branchCount: branchesSnap.docs.filter(d => d.data().companyId === c.id).length,
                    clientCount: clientsSnap.docs.filter(d => d.data().companyId === c.id).length,
                    userCount: usersSnap.docs.filter(d => d.data().companyId === c.id).length,
                })),
            }));

            setDuplicateGroups(enriched);
        } catch (err) {
            console.error('重複チェックエラー:', err);
            alert('エラーが発生しました: ' + err.message);
        } finally {
            setDuplicateLoading(false);
        }
    };

    const deleteCompany = async (companyToDelete) => {
        const linked = companyToDelete.branchCount + companyToDelete.clientCount + companyToDelete.userCount;
        const msg = linked > 0
            ? `「${companyToDelete.name}」(ID: ${companyToDelete.id}) には支店${companyToDelete.branchCount}件・利用者${companyToDelete.clientCount}件・ユーザー${companyToDelete.userCount}件が紐づいています。\n\n本当に削除しますか？（紐づいたデータは残ります）`
            : `「${companyToDelete.name}」(ID: ${companyToDelete.id}) を削除します。よろしいですか？`;
        if (!window.confirm(msg)) return;

        try {
            await deleteDoc(doc(db, 'companies', companyToDelete.id));
            alert('削除しました。再度チェックを実行してください。');
            setDuplicateGroups(null);
        } catch (err) {
            alert('削除エラー: ' + err.message);
        }
    };

    if (!companyId) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error">このページはログインユーザーに companyId が必要です。</Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3, maxWidth: 700, mx: 'auto' }}>
            <Typography variant="h5" fontWeight="bold" gutterBottom>
                データ移行ツール
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                マルチテナント対応のため、既存データにこのアカウントの法人IDを付与します。<br />
                新規法人を追加する前に、既存法人のアカウントで一度だけ実行してください。
            </Typography>

            <Paper sx={{ p: 2, mb: 3, bgcolor: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)' }}>
                <Typography variant="body2">
                    <strong>付与する法人ID：</strong> {companyId}
                </Typography>
                {branchId && (
                    <Typography variant="body2">
                        <strong>付与する支店ID：</strong> {branchId}（未設定レコードのみ）
                    </Typography>
                )}
            </Paper>

            {running && <LinearProgress sx={{ mb: 2 }} />}

            {!done && (
                <Button
                    variant="contained"
                    color="warning"
                    onClick={runMigration}
                    disabled={running}
                    size="large"
                >
                    {running ? '実行中...' : '移行を実行する'}
                </Button>
            )}

            {results.length > 0 && (
                <Box sx={{ mt: 3 }}>
                    <Typography variant="h6" gutterBottom>実行結果</Typography>
                    <List dense>
                        {results.map((r) => (
                            <ListItem key={r.col} sx={{ px: 0 }}>
                                <ListItemText
                                    primary={r.col}
                                    secondary={r.error || `${r.count} 件を更新`}
                                />
                                <Chip
                                    label={r.status === 'ok' ? `✓ ${r.count}件` : r.status === 'skip' ? 'スキップ' : 'エラー'}
                                    color={r.status === 'ok' ? 'success' : r.status === 'skip' ? 'default' : 'error'}
                                    size="small"
                                />
                            </ListItem>
                        ))}
                    </List>
                    {done && (
                        <Alert severity="success" sx={{ mt: 2 }}>
                            移行が完了しました。このページはもう使用しなくても構いません。
                        </Alert>
                    )}
                </Box>
            )}

            <Divider sx={{ my: 4 }} />

            {/* ポータルデータ修正セクション */}
            <Typography variant="h6" fontWeight="bold" gutterBottom>
                ポータルデータ修正
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                利用者ポータルから作成された出席記録・デイリーチェックインに、利用者の法人IDを自動で付与します。<br />
                利用者の所属法人を元に正しい法人IDを判定するため、複数法人が混在していても安全です。
            </Typography>

            {portalRunning && <LinearProgress sx={{ mb: 2 }} />}

            {!portalDone && (
                <Button
                    variant="contained"
                    color="info"
                    onClick={runPortalMigration}
                    disabled={portalRunning}
                    size="large"
                >
                    {portalRunning ? '実行中...' : 'ポータルデータを修正する'}
                </Button>
            )}

            {portalResults.length > 0 && (
                <Box sx={{ mt: 3 }}>
                    <Typography variant="h6" gutterBottom>実行結果</Typography>
                    <List dense>
                        {portalResults.map((r) => (
                            <ListItem key={r.col} sx={{ px: 0 }}>
                                <ListItemText
                                    primary={r.col}
                                    secondary={r.error || `${r.count} 件を更新${r.skipped ? `（${r.skipped}件はクライアント不明のためスキップ）` : ''}`}
                                />
                                <Chip
                                    label={r.status === 'ok' ? `✓ ${r.count}件` : r.status === 'skip' ? 'スキップ' : 'エラー'}
                                    color={r.status === 'ok' ? 'success' : r.status === 'skip' ? 'default' : 'error'}
                                    size="small"
                                />
                            </ListItem>
                        ))}
                    </List>
                    {portalDone && (
                        <Alert severity="success" sx={{ mt: 2 }}>
                            ポータルデータの修正が完了しました。
                        </Alert>
                    )}
                </Box>
            )}

            <Divider sx={{ my: 4 }} />

            {/* 活動ログ修正セクション */}
            <Typography variant="h6" fontWeight="bold" gutterBottom>
                活動ログ修正（全社リアルタイムフィード用）
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                clients配下の activity_logs サブコレクションに companyId を付与します。<br />
                これにより、ダッシュボードの「全社リアルタイム活動フィード」に過去の記録が表示されます。
            </Typography>

            {activityRunning && <LinearProgress sx={{ mb: 2 }} />}

            {!activityDone && (
                <Button
                    variant="contained"
                    color="secondary"
                    onClick={runActivityLogMigration}
                    disabled={activityRunning}
                    size="large"
                >
                    {activityRunning ? '実行中...' : '活動ログを修正する'}
                </Button>
            )}

            {activityResults.length > 0 && (
                <Box sx={{ mt: 3 }}>
                    {activityResults.map((r, i) => (
                        <Box key={i}>
                            <Chip
                                label={r.status === 'ok' ? `✓ ${r.count}件を更新（${r.skipped}件はスキップ）` : `エラー: ${r.error}`}
                                color={r.status === 'ok' ? 'success' : 'error'}
                            />
                        </Box>
                    ))}
                    {activityDone && activityResults[0]?.status === 'ok' && (
                        <Alert severity="success" sx={{ mt: 2 }}>
                            活動ログの修正が完了しました。
                        </Alert>
                    )}
                </Box>
            )}

            <Divider sx={{ my: 4 }} />

            {/* 自治体への会社割り当て */}
            <Typography variant="h6" fontWeight="bold" gutterBottom>
                自治体への会社割り当て
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                municipalitiesコレクションの各ドキュメントに companyId を設定します。<br />
                各自治体がどの事業所のものかを選択して保存してください。
            </Typography>

            {muniList === null ? (
                <Button variant="contained" color="primary" onClick={loadMunicipalitiesForAssign} disabled={muniLoading} size="large">
                    {muniLoading ? '読み込み中...' : '自治体一覧を読み込む'}
                </Button>
            ) : (
                <Box>
                    <TableContainer component={Paper} sx={{ mb: 2 }}>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>自治体名</TableCell>
                                    <TableCell>テンプレート</TableCell>
                                    <TableCell>現在のcompanyId</TableCell>
                                    <TableCell>割り当て先</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {muniList.map(m => (
                                    <TableRow key={m.id}>
                                        <TableCell>{m.name || m.id}</TableCell>
                                        <TableCell>
                                            <Chip label={m.template || '未設定'} size="small" variant="outlined" />
                                        </TableCell>
                                        <TableCell sx={{ fontSize: '0.7rem', fontFamily: 'monospace', color: m.companyId ? 'success.main' : 'error.main' }}>
                                            {m.companyId || '未設定'}
                                        </TableCell>
                                        <TableCell>
                                            <FormControl size="small" sx={{ minWidth: 200 }}>
                                                <Select
                                                    value={muniAssignments[m.id] || ''}
                                                    onChange={e => setMuniAssignments(prev => ({ ...prev, [m.id]: e.target.value }))}
                                                    displayEmpty
                                                >
                                                    <MenuItem value=""><em>未割り当て</em></MenuItem>
                                                    {muniCompanies.map(c => (
                                                        <MenuItem key={c.id} value={c.id}>{c.name || c.id}</MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <Button variant="contained" color="success" onClick={saveMuniAssignments} disabled={muniSaving} size="large">
                        {muniSaving ? '保存中...' : '割り当てを保存する'}
                    </Button>
                    {muniSaved && <Alert severity="success" sx={{ mt: 2 }}>保存しました。自治体への会社割り当てが完了しました。</Alert>}
                </Box>
            )}

            <Divider sx={{ my: 4 }} />

            {/* 重複企業の検出・整理 */}
            <Typography variant="h6" fontWeight="bold" gutterBottom>
                重複企業の検出・整理
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                同じ名前の企業が複数登録されている場合に検出します。<br />
                データが少ない方（支店・利用者・ユーザーが0件）を削除して整理できます。
            </Typography>

            <Button
                variant="contained"
                color="error"
                onClick={checkDuplicateCompanies}
                disabled={duplicateLoading}
                size="large"
            >
                {duplicateLoading ? '検索中...' : '重複企業をチェックする'}
            </Button>
            {duplicateLoading && <LinearProgress sx={{ mt: 2 }} />}

            {duplicateGroups !== null && (
                <Box sx={{ mt: 3 }}>
                    {duplicateGroups.length === 0 ? (
                        <Alert severity="success">重複している企業はありませんでした。</Alert>
                    ) : (
                        duplicateGroups.map((group) => (
                            <Paper key={group.name} sx={{ mb: 3, p: 2, border: '1px solid rgba(239,68,68,0.4)', bgcolor: 'rgba(239,68,68,0.05)' }}>
                                <Typography fontWeight="bold" sx={{ mb: 1, color: '#ef4444' }}>
                                    ⚠ 重複: {group.name} ({group.companies.length}件)
                                </Typography>
                                <TableContainer>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>会社ID</TableCell>
                                                <TableCell align="center">支店</TableCell>
                                                <TableCell align="center">利用者</TableCell>
                                                <TableCell align="center">ユーザー</TableCell>
                                                <TableCell align="center">操作</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {group.companies.map((c) => {
                                                const isEmpty = c.branchCount === 0 && c.clientCount === 0 && c.userCount === 0;
                                                return (
                                                    <TableRow key={c.id} sx={{ bgcolor: isEmpty ? 'rgba(239,68,68,0.08)' : 'transparent' }}>
                                                        <TableCell>
                                                            <Typography sx={{ fontSize: '0.75rem', fontFamily: 'monospace' }}>{c.id}</Typography>
                                                            {isEmpty && <Chip label="データなし" size="small" color="error" sx={{ height: 18, fontSize: '0.65rem' }} />}
                                                        </TableCell>
                                                        <TableCell align="center">{c.branchCount}</TableCell>
                                                        <TableCell align="center">{c.clientCount}</TableCell>
                                                        <TableCell align="center">{c.userCount}</TableCell>
                                                        <TableCell align="center">
                                                            <Button
                                                                size="small"
                                                                color="error"
                                                                variant="outlined"
                                                                onClick={() => deleteCompany(c)}
                                                                sx={{ fontSize: '0.7rem' }}
                                                            >
                                                                削除
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Paper>
                        ))
                    )}
                </Box>
            )}
        </Box>
    );
}
