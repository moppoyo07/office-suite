// src/pages/AverageUsersSheetPage.jsx
// 平均利用者数算定シート（スプレッドシート形式）

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
    Box, Typography, Paper, CircularProgress, Alert,
    FormControl, InputLabel, Select, MenuItem, Button,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    TextField, Tooltip, IconButton
} from '@mui/material';
import { collection, query, where, getDocs, Timestamp, doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../features/auth/context/AuthContext';
import SaveIcon from '@mui/icons-material/Save';
import RefreshIcon from '@mui/icons-material/Refresh';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import PrintIcon from '@mui/icons-material/Print';

// 月（4月始まり）
const FISCAL_MONTHS = [4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3];
const MONTH_LABELS = ['4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月', '1月', '2月', '3月'];

// 年度リスト生成
const generateFiscalYears = () => {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const currentFiscalYear = currentMonth >= 4 ? currentYear : currentYear - 1;
    const years = [];
    for (let y = 2022; y <= currentFiscalYear; y++) {
        years.push(y);
    }
    return years.reverse();
};

export default function AverageUsersSheetPage() {
    const { currentUser } = useAuth();
    const companyId = currentUser?.companyId || null;
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const [fiscalYear, setFiscalYear] = useState(() => {
        const now = new Date();
        return now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
    });

    const [clients, setClients] = useState([]);
    // { clientId: { 4: 22, 5: 18, ... } } 形式
    const [attendanceData, setAttendanceData] = useState({});
    // 開所日数 { 4: 22, 5: 22, ... }
    const [operatingDays, setOperatingDays] = useState({});

    const fiscalYears = useMemo(() => generateFiscalYears(), []);

    // データ読み込み
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                // 利用者一覧取得（ステータスに関わらず全員取得）
                const companyFilter = companyId ? [where('companyId', '==', companyId)] : [];
                const clientsSnap = await getDocs(companyFilter.length ? query(collection(db, 'clients'), ...companyFilter) : collection(db, 'clients'));
                const clientList = clientsSnap.docs
                    .map(doc => ({ id: doc.id, ...doc.data() }))
                    .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ja'));
                setClients(clientList);

                // 保存されたデータを取得（companyId付きdocId）
                const sheetDocId = companyId ? `${companyId}_${fiscalYear}` : String(fiscalYear);
                const sheetDocRef = doc(db, 'averageUsersSheets', sheetDocId);
                const sheetSnap = await getDoc(sheetDocRef);

                if (sheetSnap.exists()) {
                    const data = sheetSnap.data();
                    setAttendanceData(data.attendanceData || {});
                    setOperatingDays(data.operatingDays || {});
                } else {
                    // 新規の場合、出席記録から自動計算
                    await autoCalculateFromRecords();
                }
            } catch (err) {
                console.error('データ取得エラー:', err);
                setError('データの取得に失敗しました');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [fiscalYear, companyId]);

    // 出席記録から自動計算
    const autoCalculateFromRecords = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // 年度の日付範囲
            const startDate = new Date(fiscalYear, 3, 1); // 4月1日
            const endDate = new Date(fiscalYear + 1, 2, 31, 23, 59, 59); // 翌年3月31日

            console.log('自動計算開始:', fiscalYear, '年度', startDate, '〜', endDate);

            // 出席記録取得
            const companyFilter = companyId ? [where('companyId', '==', companyId)] : [];
            const recordsQuery = query(
                collection(db, 'attendanceRecords'),
                ...companyFilter,
                where('date', '>=', Timestamp.fromDate(startDate)),
                where('date', '<=', Timestamp.fromDate(endDate))
            );
            const recordsSnap = await getDocs(recordsQuery);
            console.log('取得したレコード数:', recordsSnap.size);

            // 利用者別・月別に集計（status='present'のもののみ）
            const data = {};
            const daysSet = {}; // 月ごとの営業日をカウント
            recordsSnap.docs.forEach(docSnap => {
                const record = docSnap.data();
                // presentのみ集計
                if (record.status !== 'present') return;

                const clientId = record.clientId;
                const dateObj = record.date?.toDate();
                if (!clientId || !dateObj) return;

                const month = dateObj.getMonth() + 1;
                const dateStr = dateObj.toISOString().split('T')[0];

                if (!data[clientId]) data[clientId] = {};
                data[clientId][month] = (data[clientId][month] || 0) + 1;

                // 営業日をカウント（重複しないように）
                if (!daysSet[month]) daysSet[month] = new Set();
                daysSet[month].add(dateStr);
            });

            console.log('集計結果:', Object.keys(data).length, '名の利用者');

            setAttendanceData(data);

            // 開所日数を設定
            const opDays = {};
            FISCAL_MONTHS.forEach(m => {
                opDays[m] = daysSet[m]?.size || 0;
            });
            setOperatingDays(opDays);

            setSuccess('出席記録から自動計算しました');
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            console.error('自動計算エラー:', err);
            setError('自動計算に失敗しました: ' + err.message);
        } finally {
            setLoading(false);
        }
    }, [fiscalYear]);

    // 出席日数変更
    const handleAttendanceChange = (clientId, month, value) => {
        setAttendanceData(prev => ({
            ...prev,
            [clientId]: {
                ...prev[clientId],
                [month]: value === '' ? 0 : parseInt(value) || 0,
            },
        }));
    };

    // 開所日数変更
    const handleOperatingDaysChange = (month, value) => {
        setOperatingDays(prev => ({
            ...prev,
            [month]: value === '' ? 0 : parseInt(value) || 0,
        }));
    };

    // 保存
    const handleSave = async () => {
        setSaving(true);
        setError(null);
        try {
            const sheetDocId = companyId ? `${companyId}_${fiscalYear}` : String(fiscalYear);
            const sheetDocRef = doc(db, 'averageUsersSheets', sheetDocId);
            await setDoc(sheetDocRef, {
                fiscalYear,
                companyId: companyId || null,
                attendanceData,
                operatingDays,
                updatedAt: Timestamp.now(),
            });
            setSuccess('保存しました');
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            console.error('保存エラー:', err);
            setError('保存に失敗しました');
        } finally {
            setSaving(false);
        }
    };

    // 印刷処理
    const handlePrint = () => {
        window.print();
    };

    // 月別延べ利用者数
    const monthlyTotals = useMemo(() => {
        const totals = {};
        FISCAL_MONTHS.forEach(m => {
            totals[m] = Object.values(attendanceData).reduce((sum, clientData) => sum + (clientData?.[m] || 0), 0);
        });
        return totals;
    }, [attendanceData]);

    // 利用者別年間合計
    const clientTotals = useMemo(() => {
        const totals = {};
        clients.forEach(client => {
            const clientData = attendanceData[client.id] || {};
            totals[client.id] = FISCAL_MONTHS.reduce((sum, m) => sum + (clientData[m] || 0), 0);
        });
        return totals;
    }, [clients, attendanceData]);

    // 年間延べ利用者数
    const grandTotal = useMemo(() => {
        return Object.values(monthlyTotals).reduce((sum, v) => sum + v, 0);
    }, [monthlyTotals]);

    // 年間開所日数
    const totalOperatingDays = useMemo(() => {
        return FISCAL_MONTHS.reduce((sum, m) => sum + (operatingDays[m] || 0), 0);
    }, [operatingDays]);

    // 前年度平均利用者数
    const averageUsers = useMemo(() => {
        if (totalOperatingDays === 0) return 0;
        return grandTotal / totalOperatingDays;
    }, [grandTotal, totalOperatingDays]);

    // 利用実績のある利用者
    const activeClients = useMemo(() => {
        return clients.filter(client => clientTotals[client.id] > 0);
    }, [clients, clientTotals]);

    return (
        <Box sx={{ pb: 4 }}>
            <style>
                {`
                    @media print {
                        @page {
                            size: A4 landscape;
                            margin: 10mm;
                        }
                        body {
                            background: white !important;
                            color: black !important;
                        }
                        /* サイドバーやヘッダー、操作ボタンを非表示 */
                        header, nav, aside, .MuiDrawer-root, .MuiAppBar-root, 
                        .no-print, .MuiButton-root {
                            display: none !important;
                        }
                        /* 背景色を印刷でも有効に（適宜調整） */
                        .MuiPaper-root {
                            background-color: white !important;
                            color: black !important;
                            box-shadow: none !important;
                            border: none !important;
                        }
                        .MuiTableCell-root {
                            color: black !important;
                            border-bottom: 1px solid #ccc !important;
                            padding: 4px 2px !important;
                            background-color: transparent !important;
                        }
                        .MuiInputBase-root {
                            color: black !important;
                            font-size: 0.8rem !important;
                        }
                        .MuiInput-underline:before, .MuiInput-underline:after {
                            display: none !important;
                        }
                        /* 表の固定ヘッダーなどを解除 */
                        .MuiTableContainer-root {
                            overflow: visible !important;
                        }
                        .MuiTableCell-stickyLeft {
                            position: static !important;
                            background-color: transparent !important;
                        }
                        /* 入力フィールドの枠線を消す */
                        input {
                            border: none !important;
                            text-align: center !important;
                            padding: 0 !important;
                            -moz-appearance: textfield;
                        }
                        input::-webkit-outer-spin-button,
                        input::-webkit-inner-spin-button {
                            -webkit-appearance: none;
                            margin: 0;
                        }
                        /* 印刷専用のタイトル */
                        .print-title {
                            display: block !important;
                            margin-bottom: 20px;
                            text-align: center;
                        }
                    }
                    /* 画面上では非表示 */
                    .print-title {
                        display: none;
                    }
                `}
            </style>

            <div className="print-title">
                <Typography variant="h5" align="center">平均利用者数算定シート（{fiscalYear}年度）</Typography>
            </div>
            {/* ヘッダー */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                <Typography variant="h4">
                    📊 平均利用者数算定シート
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <FormControl size="small" sx={{ minWidth: 120 }} className="no-print">
                        <InputLabel>年度</InputLabel>
                        <Select
                            value={fiscalYear}
                            label="年度"
                            onChange={(e) => setFiscalYear(e.target.value)}
                        >
                            {fiscalYears.map(y => (
                                <MenuItem key={y} value={y}>{y}年度</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <Tooltip title="出席記録から自動計算">
                        <span>
                            <Button
                                variant="outlined"
                                startIcon={<AutoFixHighIcon />}
                                onClick={autoCalculateFromRecords}
                                disabled={loading}
                                className="no-print"
                            >
                                自動計算
                            </Button>
                        </span>
                    </Tooltip>
                    <Button
                        variant="contained"
                        startIcon={<SaveIcon />}
                        onClick={handleSave}
                        disabled={saving}
                        className="no-print"
                    >
                        {saving ? '保存中...' : '保存'}
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<PrintIcon />}
                        onClick={handlePrint}
                        sx={{ bgcolor: '#ec4899', '&:hover': { bgcolor: '#db2777' } }}
                        className="no-print"
                    >
                        印刷
                    </Button>
                </Box>
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                （生活介護・共同生活援助・就労定着支援・自立生活援助を除く）
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
            ) : (
                <>
                    <Paper sx={{ overflowX: 'auto', mb: 3 }}>
                        <TableContainer>
                            <Table size="small" sx={{ minWidth: 1000 }}>
                                <TableHead>
                                    <TableRow sx={{ bgcolor: 'rgba(255,255,255,0.05)' }}>
                                        <TableCell sx={{ fontWeight: 'bold', minWidth: 50 }}>No.</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', minWidth: 100 }}>受給者番号</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', minWidth: 100, position: 'sticky', left: 0, bgcolor: '#1e1e1e', zIndex: 2 }}>氏名</TableCell>
                                        {MONTH_LABELS.map((label, idx) => (
                                            <TableCell key={idx} colSpan={1} sx={{ textAlign: 'center', fontWeight: 'bold', minWidth: 55, bgcolor: 'rgba(100, 180, 100, 0.15)' }}>
                                                {label}
                                            </TableCell>
                                        ))}
                                        <TableCell sx={{ textAlign: 'center', fontWeight: 'bold', borderLeft: '2px solid rgba(6, 182, 212, 0.5)', minWidth: 60 }}>
                                            合計
                                        </TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {activeClients.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={15} sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                                                利用者データがありません。「自動計算」ボタンで出席記録から取得するか、手入力してください。
                                            </TableCell>
                                        </TableRow>
                                    )}
                                    {activeClients.map((client, idx) => {
                                        const clientData = attendanceData[client.id] || {};
                                        return (
                                            <TableRow key={client.id} hover>
                                                <TableCell>{idx + 1}</TableCell>
                                                <TableCell sx={{ fontSize: '0.8rem' }}>{client.recipientId || '-'}</TableCell>
                                                <TableCell sx={{ position: 'sticky', left: 0, bgcolor: '#1e1e1e', zIndex: 1, fontWeight: 500 }}>
                                                    {client.name}
                                                </TableCell>
                                                {FISCAL_MONTHS.map(month => (
                                                    <TableCell key={month} sx={{ p: 0.5 }}>
                                                        <TextField
                                                            size="small"
                                                            type="number"
                                                            value={clientData[month] || ''}
                                                            onChange={(e) => handleAttendanceChange(client.id, month, e.target.value)}
                                                            sx={{ width: 50 }}
                                                            inputProps={{ min: 0, max: 31, style: { fontSize: '0.8rem', padding: '4px', textAlign: 'center' } }}
                                                        />
                                                    </TableCell>
                                                ))}
                                                <TableCell sx={{ textAlign: 'center', fontWeight: 'bold', borderLeft: '2px solid rgba(6, 182, 212, 0.5)', color: '#06b6d4' }}>
                                                    {clientTotals[client.id]}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}

                                    {/* 空行（新規入力用のプレースホルダー表示は省略） */}

                                    {/* 開所日数行 */}
                                    <TableRow sx={{ bgcolor: 'rgba(255, 200, 100, 0.1)', borderTop: '2px solid rgba(255, 200, 100, 0.5)' }}>
                                        <TableCell colSpan={2} sx={{ fontWeight: 'bold' }}>開　所</TableCell>
                                        <TableCell sx={{ position: 'sticky', left: 0, bgcolor: '#2a2a1e', zIndex: 1, fontWeight: 'bold' }}>日　数</TableCell>
                                        {FISCAL_MONTHS.map(month => (
                                            <TableCell key={month} sx={{ p: 0.5 }}>
                                                <TextField
                                                    size="small"
                                                    type="number"
                                                    value={operatingDays[month] || ''}
                                                    onChange={(e) => handleOperatingDaysChange(month, e.target.value)}
                                                    sx={{ width: 50 }}
                                                    inputProps={{ min: 0, max: 31, style: { fontSize: '0.8rem', padding: '4px', textAlign: 'center' } }}
                                                />
                                            </TableCell>
                                        ))}
                                        <TableCell sx={{ textAlign: 'center', fontWeight: 'bold', borderLeft: '2px solid rgba(6, 182, 212, 0.5)', color: '#fbbf24' }}>
                                            {totalOperatingDays}日
                                        </TableCell>
                                    </TableRow>

                                    {/* 延べ利用者数行 */}
                                    <TableRow sx={{ bgcolor: 'rgba(6, 182, 212, 0.1)' }}>
                                        <TableCell colSpan={3} sx={{ position: 'sticky', left: 0, bgcolor: '#1a2e3e', zIndex: 1, fontWeight: 'bold' }}>
                                            【延べ利用者数】
                                        </TableCell>
                                        {FISCAL_MONTHS.map(month => (
                                            <TableCell key={month} sx={{ textAlign: 'center', fontWeight: 'bold' }}>
                                                {monthlyTotals[month] || 0}
                                            </TableCell>
                                        ))}
                                        <TableCell sx={{ textAlign: 'center', fontWeight: 'bold', borderLeft: '2px solid rgba(6, 182, 212, 0.5)', color: '#06b6d4', fontSize: '1.1rem' }}>
                                            {grandTotal.toLocaleString()}
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>

                    {/* 計算結果 */}
                    <Paper sx={{ p: 3, bgcolor: 'rgba(6, 182, 212, 0.1)', border: '1px solid rgba(6, 182, 212, 0.3)', mb: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                            <Box>
                                <Typography variant="h6" gutterBottom>前年度平均利用者数</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    延べ利用者数 {grandTotal.toLocaleString()}人日 ÷ 開所日数 {totalOperatingDays}日
                                </Typography>
                            </Box>
                            <Box sx={{ textAlign: 'right' }}>
                                <Typography variant="h3" sx={{ color: '#06b6d4', fontWeight: 'bold' }}>
                                    {averageUsers.toFixed(1)}
                                </Typography>
                                <Typography variant="h6" sx={{ color: '#06b6d4' }}>人</Typography>
                            </Box>
                        </Box>
                    </Paper>

                    {/* 必要人員計算 */}
                    <Paper sx={{ p: 3, bgcolor: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
                        <Typography variant="h6" gutterBottom sx={{ color: '#22c55e' }}>
                            📋 就労移行支援 必要人員（常勤換算）
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            前年度平均利用者数 {averageUsers.toFixed(1)}人 に基づく配置基準
                        </Typography>

                        <TableContainer>
                            <Table size="small" sx={{ maxWidth: 600 }}>
                                <TableHead>
                                    <TableRow sx={{ bgcolor: 'rgba(34, 197, 94, 0.15)' }}>
                                        <TableCell sx={{ fontWeight: 'bold' }}>職種</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>配置基準</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>計算式</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>必要人員</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {/* 職業指導員 + 生活支援員 */}
                                    <TableRow>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight={500}>職業指導員 + 生活支援員</Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                ※1名以上は常勤
                                            </Typography>
                                        </TableCell>
                                        <TableCell sx={{ textAlign: 'center' }}>6：1</TableCell>
                                        <TableCell sx={{ textAlign: 'center', fontSize: '0.85rem' }}>
                                            {averageUsers.toFixed(1)} ÷ 6
                                        </TableCell>
                                        <TableCell sx={{ textAlign: 'center', fontWeight: 'bold', color: '#22c55e', fontSize: '1.1rem' }}>
                                            {(averageUsers / 6).toFixed(2)}人
                                        </TableCell>
                                    </TableRow>

                                    {/* 就労支援員 */}
                                    <TableRow>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight={500}>就労支援員</Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                ※1名以上は常勤
                                            </Typography>
                                        </TableCell>
                                        <TableCell sx={{ textAlign: 'center' }}>15：1</TableCell>
                                        <TableCell sx={{ textAlign: 'center', fontSize: '0.85rem' }}>
                                            {averageUsers.toFixed(1)} ÷ 15
                                        </TableCell>
                                        <TableCell sx={{ textAlign: 'center', fontWeight: 'bold', color: '#22c55e', fontSize: '1.1rem' }}>
                                            {(averageUsers / 15).toFixed(2)}人
                                        </TableCell>
                                    </TableRow>

                                    {/* サービス管理責任者 */}
                                    <TableRow>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight={500}>サービス管理責任者</Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                ※常勤専従
                                            </Typography>
                                        </TableCell>
                                        <TableCell sx={{ textAlign: 'center' }}>60：1</TableCell>
                                        <TableCell sx={{ textAlign: 'center', fontSize: '0.85rem' }}>
                                            {averageUsers <= 60 ? '60人以下' : `${averageUsers.toFixed(1)} ÷ 60`}
                                        </TableCell>
                                        <TableCell sx={{ textAlign: 'center', fontWeight: 'bold', color: '#22c55e', fontSize: '1.1rem' }}>
                                            {Math.ceil(averageUsers / 60)}人
                                        </TableCell>
                                    </TableRow>

                                    {/* 管理者 */}
                                    <TableRow sx={{ bgcolor: 'rgba(255,255,255,0.03)' }}>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight={500}>管理者</Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                ※兼務可
                                            </Typography>
                                        </TableCell>
                                        <TableCell sx={{ textAlign: 'center' }}>—</TableCell>
                                        <TableCell sx={{ textAlign: 'center', fontSize: '0.85rem' }}>
                                            1事業所につき
                                        </TableCell>
                                        <TableCell sx={{ textAlign: 'center', fontWeight: 'bold', color: '#22c55e', fontSize: '1.1rem' }}>
                                            1人
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </TableContainer>

                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
                            ※ 常勤換算は、事業所の常勤職員の勤務時間数を週40時間として算出
                        </Typography>
                    </Paper>
                </>
            )}
        </Box>
    );
}
