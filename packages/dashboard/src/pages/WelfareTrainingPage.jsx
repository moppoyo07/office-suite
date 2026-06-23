// src/pages/WelfareTrainingPage.jsx
import React, { useState, useRef, useEffect } from 'react';
import { collection, query, where, getDocs, Timestamp, orderBy, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../features/auth/context/AuthContext';
import {
    Box, Container, Typography, Paper, TextField, Button,
    Table, TableBody, TableCell, TableHead, TableRow,
    FormControl, InputLabel, Select, MenuItem, Stack,
    CircularProgress, Alert, Chip
} from '@mui/material';
import { Print, Save, Refresh, People, School, DirectionsBus, TrendingUp } from '@mui/icons-material';
import { getTemplate, getConfig } from '../templates';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { useTenant } from '../context/TenantContext';

export default function WelfareTrainingPage() {
    const { currentUser } = useAuth();
    const { currentTenant } = useTenant();
    const isPlatform = ['platform_owner', 'platform_staff'].includes(currentUser?.role);

    // platform_ownerは会社を選んで切り替え可能
    const [selectedCompanyId, setSelectedCompanyId] = useState(null);
    const [companies, setCompanies] = useState([]);

    const companyId = isPlatform ? selectedCompanyId : (currentUser?.companyId || null);

    // 選択中企業のwelfareTrainingType（platform_ownerが企業切り替えした場合はそちらを優先）
    const activeCompany = isPlatform
        ? companies.find(c => c.id === selectedCompanyId) || null
        : currentTenant?.company || null;
    const welfareTrainingType = activeCompany?.welfareTrainingType ?? 'both';

    const [year, setYear] = useState(new Date().getFullYear());
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [municipality, setMunicipality] = useState('');
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(false);
    const [municipalities, setMunicipalities] = useState([]); // DBから取得するリスト
    const [error, setError] = useState(null);

    // 動的テンプレート用のstate
    const [TemplateComponent, setTemplateComponent] = useState(null);
    const [templateConfig, setTemplateConfig] = useState(null);
    const [templateLoading, setTemplateLoading] = useState(false);

    // platform_owner用: 会社一覧を取得
    useEffect(() => {
        if (!isPlatform) return;
        const fetchCompanies = async () => {
            try {
                const snap = await getDocs(query(collection(db, 'companies'), orderBy('createdAt', 'desc')));
                const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                setCompanies(list);
                if (list.length > 0 && !selectedCompanyId) {
                    setSelectedCompanyId(list[0].id);
                }
            } catch (err) {
                console.error('企業一覧取得エラー:', err);
            }
        };
        fetchCompanies();
    }, [isPlatform]);

    // 自治体リストを取得（companyIdでフィルタリング）
    useEffect(() => {
        if (!companyId) return; // companyIdが確定するまで待つ
        const fetchMunicipalities = async () => {
            try {
                const q = query(
                    collection(db, 'municipalities'),
                    where('companyId', '==', companyId),
                    where('isActive', '==', true)
                );
                const snapshot = await getDocs(q);
                const list = snapshot.docs
                    .map(doc => ({ id: doc.id, ...doc.data() }))
                    .filter(m => m.template); // テンプレートがあるもの限定

                list.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ja'));
                setMunicipalities(list);
                setMunicipality(''); // 会社が変わったらリセット

                // 初期選択（もしあれば）
                if (list.length > 0) {
                    setMunicipality(list[0].billingName);
                }
            } catch (err) {
                console.error('自治体取得エラー:', err);
            }
        };
        fetchMunicipalities();
    }, [companyId]); // companyIdが変わるたびに再取得

    // 自治体変更時にテンプレートを動的ロード
    useEffect(() => {
        const loadTemplate = async () => {
            if (!municipality || municipalities.length === 0) return;

            // 選択された自治体のtemplate名を取得
            const selectedMuni = municipalities.find(m => m.billingName === municipality);
            const templateName = selectedMuni?.template;

            if (!templateName) {
                setTemplateComponent(null);
                setTemplateConfig(null);
                return;
            }

            setTemplateLoading(true);
            try {
                const [component, config] = await Promise.all([
                    getTemplate(templateName, 'welfareTraining'),
                    getConfig(templateName),
                ]);
                setTemplateComponent(() => component);
                setTemplateConfig(config);
            } catch (err) {
                console.error('テンプレート読み込みエラー:', err);
                setTemplateComponent(null);
                setTemplateConfig(null);
            } finally {
                setTemplateLoading(false);
            }
        };
        loadTemplate();
    }, [municipality, municipalities]);

    // 印刷用Ref
    const printRef = useRef(null);

    // データ取得
    const fetchData = async () => {
        if (!municipality) return;

        setLoading(true);
        setError(null);

        try {
            // 【重要】ステータスで弾かない。対象月に出席実績があった利用者を対象にする。
            // 月途中で卒業・就職した利用者も、その月の更生訓練費請求が必要なため。
            const companyFilter = companyId ? [where('companyId', '==', companyId)] : [];

            // 1. 対象月のattendanceRecordsを取得して実績のあったclientIdを集める
            // ※ status フィルタは複合インデックスを増やさないためメモリ側で実施
            const monthStart = new Date(year, month - 1, 1);
            const monthEnd = new Date(year, month, 0, 23, 59, 59);
            const attendanceQ = query(
                collection(db, 'attendanceRecords'),
                ...companyFilter,
                where('date', '>=', Timestamp.fromDate(monthStart)),
                where('date', '<=', Timestamp.fromDate(monthEnd)),
            );
            const attendanceSnap = await getDocs(attendanceQ);
            const activeClientIds = new Set();
            attendanceSnap.docs.forEach(d => {
                const data = d.data();
                if (data.status !== 'present') return;
                if (data.clientId) activeClientIds.add(data.clientId);
            });

            // 2. clientsコレクションを全件取得（ステータス無視）→ 実績があったクライアントのみ抽出
            const q = query(collection(db, 'clients'), ...companyFilter);
            const snapshot = await getDocs(q);

            // 自治体 + 出席実績 の両方でフィルタリング
            const filteredDocs = snapshot.docs.filter(doc => {
                const data = doc.data();
                if (!activeClientIds.has(doc.id)) return false;
                return data.billingInfo?.municipalityName === municipality;
            });


            const clientData = [];
            for (const doc of filteredDocs) {
                const client = { id: doc.id, ...doc.data() };

                // 月間の出勤実績を取得
                const attendanceData = await fetchAttendanceForClient(client.id, year, month);

                // 交通費日額を計算
                // 1. 行政認定単価がある場合（廿日市など）はそれを使用
                // 2. それ以外は経路の運賃（片道×2）を計算
                let dailyAmount = 0;
                const adminDayCost = Number(client.commuteAdminDayCost) || 0;
                const monthlyPass = Number(client.commuteMonthlyPass) || 0;
                const routes = client.commuteRoutes || [];

                // 経路を「日額払い」と「定期払い」に分離
                const dailyRoutes = routes.filter(r => !r.paymentMethod || r.paymentMethod === 'daily');
                const passRoutes = routes.filter(r => r.paymentMethod === 'pass');

                // 1. 日額分の計算
                // 行政認定単価がある場合はそれを使用（全額日額扱いとする）
                // 送迎・徒歩・自転車は交通実費が発生しないため運賃集計から除外
                const noFareTypes = ['service', 'walk', 'bicycle'];
                const dailyUnit = adminDayCost > 0
                    ? adminDayCost
                    : dailyRoutes.reduce((sum, r) => noFareTypes.includes(r.type) ? sum : sum + Number(r.costDiscounted || r.cost || 0), 0) * 2;

                // 2. 定期分の計算
                // monthlyPassに値があれば、経路設定に関係なく加算（広島市方式）
                const passCost = monthlyPass;

                // --- 行の生成 ---
                // 以前の分割ロジックを廃止し、1行で「日額(単価) + 定期(上乗せ)」の形にする
                // ユーザー要望:
                // Unit = Daily Unit (e.g. 420)
                // Amount = (Unit * Days) + PassCost (e.g. 420*22 + 5940)

                // 注意: attendanceData変数はループのスコープ外（constで定義）だが、
                // 前回の修正でループの閉じカッコ位置が変わったため、ここで使用可能か確認が必要。
                // fetchAttendanceForClientはループ内で呼ばれているため、
                // attendanceDataはこのスコープで有効なはず。

                const commuteAmount = (dailyUnit * attendanceData.commuteDays) + passCost;
                // ただし、定期のみ(dailyUnit=0)の場合は、commuteAmount = passCost になる。
                // この場合、Unitはどうする？ -> null or 0 ?
                // ユーザー例では「単価420」があるので日額がある前提だが、定期のみの場合は単価なしか？
                // とりあえず日額がある場合はそれをUnit、ない場合はnullとする（定期代のみなら金額だけでよい）

                // 他事業所で更生訓練費を請求しているケース
                // 訓練費・訓練日数は0にして、交通費のみ請求する
                const byOther = !!client.welfareTrainingByOther;

                const clientRow = {
                    id: client.id,
                    name: client.name,
                    trainDays: byOther ? 0 : attendanceData.totalDays, // 訓練日数（他事業所請求なら0）
                    trainAmount: 0, // 後で計算
                    commuteDays: attendanceData.commuteDays,  // 通所日数
                    onsiteDays: attendanceData.onsiteDays,    // 出席日数（通所）
                    remoteDays: attendanceData.remoteDays,    // 在宅日数
                    commuteUnit: dailyUnit > 0 ? dailyUnit : null, // 単価は日額分のみ
                    commuteAmount: commuteAmount, // 金額は合計
                    transportNote: buildTransportNote(client, attendanceData, routes, false), // Noteは全ルート混在で作成
                    welfareTrainingByOther: byOther, // UI表示用
                };

                clientData.push(clientRow);
            } // End of loop over filteredDocs

            setClients(clientData);
        } catch (err) {
            console.error('データ取得エラー:', err);
            setError('データの取得に失敗しました');
        } finally {
            setLoading(false);
        }
    };

    // 月間出勤実績を取得（在宅/通所を区別）
    const fetchAttendanceForClient = async (clientId, year, month) => {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);

        const attendanceRef = collection(db, 'attendanceRecords');
        const q = query(
            attendanceRef,
            where('clientId', '==', clientId),
            where('date', '>=', Timestamp.fromDate(startDate)),
            where('date', '<=', Timestamp.fromDate(endDate)),
            where('status', '==', 'present')
        );
        const snapshot = await getDocs(q);

        // 通所/在宅で区別して集計（attendanceTypeを正とし、workTypeは旧データ用フォールバック）
        let onsiteDays = 0;
        let remoteDays = 0;
        snapshot.docs.forEach(doc => {
            const data = doc.data();
            const mode = data.attendanceType || data.workType;
            if (mode === 'remote') {
                remoteDays++;
            } else {
                onsiteDays++;
            }
        });

        const totalDays = onsiteDays + remoteDays; // 訓練日数（在宅含む）
        const commuteDays = onsiteDays;             // 通所日数（在宅除く）

        return { totalDays, commuteDays, onsiteDays, remoteDays };
    };

    // 交通費備考を構築
    const buildTransportNote = (client, attendanceData, routes, isPassRow) => {
        const parts = [];

        // 共通: 在宅利用の注記
        if (attendanceData.totalDays !== attendanceData.commuteDays) {
            parts.push(`※在宅利用あり(通所${attendanceData.commuteDays}日/訓練${attendanceData.totalDays}日)`);
        }

        // 経路情報の構築
        if (routes.length > 0) {
            routes.forEach(r => {
                const typeLabels = { 'public': '公共交通', 'train': '電車', 'bus': 'バス', 'private': '自家用車', 'walk': '徒歩', 'bicycle': '自転車', 'service': '事業所送迎' };
                // 不明・レガシー種別(例:'other')は生コードを出さず「その他」、未設定は公共交通扱い
                const typeLabel = typeLabels[r.type] || (r.type ? 'その他' : '公共交通');
                // 駅～駅表記をする手段（公共交通系のみ）。それ以外は駅表記しない
                const useStationNotation = ['public', 'train', 'bus'].includes(r.type) || !r.type;
                const isService = r.type === 'service';

                let routeInfo = '';
                if (isService) {
                    // 事業所送迎: 自治体向けに「事業所送迎」と明記（駅・運賃は出さない）
                    const fromTo = (r.from && r.to) ? `(${r.from}～${r.to})` : '';
                    routeInfo = `事業所送迎${fromTo}`;
                } else if (useStationNotation) {
                    const companyInfo = r.company ? `【${r.company}】` : '';
                    routeInfo = `${companyInfo}${r.from || ''}駅～${r.to || ''}駅(${typeLabel})`;
                } else {
                    // 徒歩/自転車/自家用車/その他: 駅表記しない
                    const fromTo = (r.from && r.to) ? `${r.from}～${r.to}` : '';
                    routeInfo = fromTo ? `${fromTo}(${typeLabel})` : `(${typeLabel})`;
                }

                // 運賃情報
                let costInfo = '';
                // 支払い方法で分岐
                if (isService) {
                    // 送迎は交通実費が発生しないため運賃表記なし
                    costInfo = '';
                } else if (r.paymentMethod === 'pass') {
                    // 定期の場合：定期購入文言はここでは出さず、後でまとめて出すか、ここで出すか。
                    // ユーザー要望例: 【JR】... [1ヶ月定期券(5940円)購入]
                    // なので、ここで出すのが自然。ただし金額は全体の定期代(monthlyPass)を使う必要があるが、
                    // 複数定期ルートがある場合どうする？ -> 通常は1ルートのみ定期。
                    // ここではシンプルに「定期対象ルート」に対して「1ヶ月定期券(X円)購入」をつける。
                    // ただし、X円は client.commuteMonthlyPass なので、複数の定期ルートがあると重複して表示されてしまう。
                    // 例: JRと広電どちらも定期扱いの場合 -> どちらにも「購入」とつくと変。
                    // とはいえ、定期代が1つだけなら、最初の定期ルート、あるいはメインの路線につけるべき。
                    // 暫定対応: 全ての定期ルートに「[定期対象]」などをつけ、最後にまとめて「定期代XXX円」とするか、
                    // ルートごとに表示するか。
                    // ユーザー提示例を見る限り、当該路線の横に書いてある。
                    costInfo = `[1ヶ月定期券(${Number(client.commuteMonthlyPass || 0).toLocaleString()}円)購入]`;
                } else {
                    // 日額の場合: 片道運賃を表示
                    costInfo = r.costDiscounted
                        ? `片道${Number(r.costDiscounted).toLocaleString()}円(割引適用)`
                        : (r.cost ? `片道${Number(r.cost).toLocaleString()}円` : '');
                }

                const skipNoteKeywords = ['徒歩', '自転車', '電車', 'バス', '公共交通', '自家用車', '送迎'];
                const noteInfo = (r.note && !skipNoteKeywords.some(kw => r.note === kw)) ? ` [${r.note}]` : '';

                parts.push(`${routeInfo} ${costInfo}${noteInfo}`.trim());
            });
        }

        // 障害者手帳割引（該当経路があれば）
        const hasDiscount = routes.some(r => r.costDiscounted > 0);
        if (hasDiscount) {
            parts.push(`[障害者手帳割引有]`);
        }

        // 行政認定単価
        if (client.commuteAdminDayCost) {
            parts.push(`行政認定単価:${client.commuteAdminDayCost}円/日`);
        }

        return parts.join(' ');
    };

    // 年月・自治体・会社変更時に自動取得
    useEffect(() => {
        if (municipality && (companyId || !isPlatform)) {
            fetchData();
        }
    }, [year, month, municipality, companyId]);

    // ブラウザの印刷機能を使用
    const handlePrint = () => {
        const printContent = printRef.current;
        if (!printContent) return;

        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>更生訓練費支給申請書_${municipality}_${year}年${month}月</title>
                <style>
                    @page { size: A4 portrait; margin: 10mm; }
                    body { margin: 0; padding: 0; }
                </style>
            </head>
            <body>
                ${printContent.innerHTML}
            </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 250);
    };

    // 計算結果を左側リストに表示するための処理
    const calculateSummary = (clientList) => {
        return clientList
            .map(c => {
                // 行1（訓練費あり）と行2（定期のみ）で計算を分ける
                // trainAmountは行に数値が入っていれば計算
                const trainAmount = (Number(c.trainDays) || 0) >= 15 ? 3150 : ((Number(c.trainDays) || 0) > 0 ? 1600 : 0);

                // commuteAmountは既にfetchDataで計算計算済み（Unit*Days + Pass）
                // 以前のロジックでは再計算していたが、今回はそのまま使う
                return { ...c, trainAmount };
            })
            // 出席している（訓練費が発生する）または定期代の請求がある行を表示
            // 訓練日数0の行（定期専用行など）も表示する必要があるためフィルタ条件を緩和
            .filter(c => (Number(c.trainDays) || 0) > 0 || (Number(c.commuteAmount) || 0) > 0);
    };

    const summaryData = calculateSummary(clients);

    // 更生訓練費が対象外の事業所はアクセス不可
    if (welfareTrainingType === 'none') {
        return (
            <Container maxWidth="sm" sx={{ py: 6, textAlign: 'center' }}>
                <Typography variant="h1" sx={{ mb: 2 }}>🚫</Typography>
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                    この事業所は更生訓練費の対象外です
                </Typography>
                <Typography color="text.secondary" sx={{ mb: 3 }}>
                    更生訓練費が発生する場合は、管理画面の企業設定で「更生訓練費の種別」を変更してください。
                </Typography>
                <Button variant="outlined" onClick={() => window.history.back()}>戻る</Button>
            </Container>
        );
    }

    return (
        <Container maxWidth="xl" sx={{ py: 3 }}>
            {/* GrandAdmin用: 会社切り替えバー */}
            {isPlatform && (
                <Paper sx={{ p: 1.5, mb: 2, bgcolor: 'rgba(255,152,0,0.1)', border: '1px solid rgba(255,152,0,0.3)' }}>
                    <Stack direction="row" alignItems="center" spacing={2}>
                        <Typography variant="body2" fontWeight="bold" color="warning.main">
                            🔑 閲覧会社:
                        </Typography>
                        <FormControl size="small" sx={{ minWidth: 240 }}>
                            <Select
                                value={selectedCompanyId || ''}
                                onChange={(e) => setSelectedCompanyId(e.target.value)}
                                displayEmpty
                            >
                                <MenuItem value="" disabled>会社を選択してください</MenuItem>
                                {companies.map(c => (
                                    <MenuItem key={c.id} value={c.id}>
                                        {c.name || c.id}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <Typography variant="caption" color="text.secondary">
                            platform_ownerはここで会社を切り替えて閲覧できます
                        </Typography>
                    </Stack>
                </Paper>
            )}

            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                <Typography variant="h5" fontWeight="bold">厚生訓練費 請求管理</Typography>
                <Stack direction="row" spacing={2}>
                    <Button
                        variant="outlined"
                        startIcon={<Refresh />}
                        onClick={fetchData}
                        disabled={loading}
                    >
                        再読込
                    </Button>
                    <Button variant="outlined" startIcon={<Save />}>データを保存</Button>
                    <Button variant="contained" startIcon={<Print />} onClick={handlePrint}>印刷</Button>
                </Stack>
            </Stack>

            <Box sx={{ display: 'flex', gap: 3 }}>
                {/* 左カラム：設定・入力（モダンUI） */}
                <Box sx={{ width: '380px', flexShrink: 0 }}>
                    {/* サマリーカード */}
                    <Paper
                        sx={{
                            p: 2,
                            mb: 2,
                            background: 'linear-gradient(135deg, #1a237e 0%, #283593 100%)',
                            color: 'white',
                            borderRadius: 2,
                        }}
                    >
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                            <Typography variant="subtitle2" sx={{ opacity: 0.9 }}>
                                {year}年{month}月 | {municipality || '未選択'}
                            </Typography>
                            {loading && <CircularProgress size={16} sx={{ color: 'white' }} />}
                        </Stack>
                        <Stack direction="row" spacing={2}>
                            <Box sx={{ flex: 1, textAlign: 'center' }}>
                                <People sx={{ fontSize: 28, opacity: 0.8 }} />
                                <Typography variant="h4" fontWeight="bold">{clients.length}</Typography>
                                <Typography variant="caption" sx={{ opacity: 0.8 }}>対象者</Typography>
                            </Box>
                            <Box sx={{ flex: 1, textAlign: 'center' }}>
                                <School sx={{ fontSize: 28, opacity: 0.8 }} />
                                <Typography variant="h6" fontWeight="bold">
                                    ¥{summaryData.reduce((sum, c) => sum + (c.trainAmount || 0), 0).toLocaleString()}
                                </Typography>
                                <Typography variant="caption" sx={{ opacity: 0.8 }}>訓練費</Typography>
                            </Box>
                            <Box sx={{ flex: 1, textAlign: 'center' }}>
                                <DirectionsBus sx={{ fontSize: 28, opacity: 0.8 }} />
                                <Typography variant="h6" fontWeight="bold">
                                    ¥{summaryData.reduce((sum, c) => sum + (c.commuteAmount || 0), 0).toLocaleString()}
                                </Typography>
                                <Typography variant="caption" sx={{ opacity: 0.8 }}>交通費</Typography>
                            </Box>
                        </Stack>
                        <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(255,255,255,0.2)', textAlign: 'center' }}>
                            <Typography variant="caption" sx={{ opacity: 0.7 }}>合計申請額</Typography>
                            <Typography variant="h5" fontWeight="bold">
                                ¥{summaryData.reduce((sum, c) => sum + (c.trainAmount || 0) + (c.commuteAmount || 0), 0).toLocaleString()}
                            </Typography>
                        </Box>
                    </Paper>

                    {/* 設定パネル */}
                    <Paper sx={{ p: 2, mb: 2, borderRadius: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            対象期間・自治体
                        </Typography>
                        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                            <TextField
                                label="年" type="number" size="small"
                                value={year} onChange={e => setYear(parseInt(e.target.value))}
                                sx={{ width: '80px' }}
                            />
                            <FormControl size="small" sx={{ width: '80px' }}>
                                <InputLabel>月</InputLabel>
                                <Select value={month} label="月" onChange={e => setMonth(e.target.value)}>
                                    {[...Array(12)].map((_, i) => (
                                        <MenuItem key={i + 1} value={i + 1}>{i + 1}月</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <FormControl size="small" sx={{ flex: 1 }}>
                                <InputLabel>自治体</InputLabel>
                                <Select
                                    value={municipality}
                                    label="自治体"
                                    onChange={(e) => setMunicipality(e.target.value)}
                                >
                                    {municipalities.map(m => (
                                        <MenuItem key={m.id} value={m.billingName}>{m.name}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Stack>
                    </Paper>

                    {/* 利用者リスト */}
                    <Paper sx={{ p: 2, borderRadius: 2, maxHeight: '400px', overflow: 'auto' }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                            <Typography variant="subtitle2" color="text.secondary">
                                対象者一覧
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {clients.length}名
                            </Typography>
                        </Stack>

                        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                        {clients.length === 0 && !loading && (
                            <Box sx={{ py: 4, textAlign: 'center' }}>
                                <People sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                                <Typography color="text.secondary">
                                    該当する利用者がいません
                                </Typography>
                            </Box>
                        )}

                        {summaryData.map((client, index) => (
                            <Box
                                key={client.id}
                                sx={{
                                    p: 1.5,
                                    mb: 1,
                                    borderRadius: 1,
                                    bgcolor: '#ffffff',
                                    border: '1px solid',
                                    borderColor: 'grey.300',
                                    '&:hover': { borderColor: 'primary.main', bgcolor: 'grey.50' },
                                }}
                            >
                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                    <Stack direction="row" alignItems="center" spacing={0.75}>
                                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                                            {client.name}
                                        </Typography>
                                        {client.welfareTrainingByOther && (
                                            <Chip
                                                label="他事業所請求"
                                                size="small"
                                                color="warning"
                                                variant="outlined"
                                                sx={{ height: 18, fontSize: '10px' }}
                                            />
                                        )}
                                    </Stack>
                                    <Typography variant="body2" sx={{ color: '#1976d2', fontWeight: 'bold' }}>
                                        ¥{((client.trainAmount || 0) + (client.commuteAmount || 0)).toLocaleString()}
                                    </Typography>
                                </Stack>
                                <Stack direction="row" spacing={1} sx={{ mt: 0.5, flexWrap: 'wrap' }}>
                                    <Typography variant="caption" sx={{ color: '#333333' }}>
                                        出席:{client.onsiteDays || 0}日
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: '#333333' }}>
                                        在宅:{client.remoteDays || 0}日
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: '#333333' }}>
                                        訓練:¥{(client.trainAmount || 0).toLocaleString()}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: '#333333' }}>
                                        交通:¥{(client.commuteAmount || 0).toLocaleString()}
                                    </Typography>
                                </Stack>
                            </Box>
                        ))}

                    </Paper>
                </Box>

                {/* 右カラム：プレビュー */}
                <Box sx={{ flex: 1, overflow: 'auto' }}>
                    <Paper sx={{ p: 2, bgcolor: '#f5f5f5' }}>
                        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                            プレビュー（印刷ボタンで印刷できます）
                            {templateLoading && <CircularProgress size={14} sx={{ ml: 1 }} />}
                        </Typography>
                        <Box
                            ref={printRef}
                            sx={{
                                background: 'white',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                transform: 'scale(0.95)',
                                transformOrigin: 'top left',
                            }}
                        >
                            {TemplateComponent ? (
                                <TemplateComponent
                                    year={year}
                                    month={month}
                                    municipalityName={municipality}
                                    clients={summaryData}
                                />
                            ) : (
                                <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
                                    {templateLoading ? 'テンプレート読み込み中...' : 'テンプレートが見つかりません'}
                                </Box>
                            )}
                        </Box>
                    </Paper>
                </Box>
            </Box>
        </Container>
    );
}
