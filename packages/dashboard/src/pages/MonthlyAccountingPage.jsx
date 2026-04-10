// src/pages/MonthlyAccountingPage.jsx
// 月次経理作業ページ - 出欠確認表・厚生訓練費など

import React, { useState, useEffect } from 'react';
import {
    Box, Container, Typography, Paper, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, CircularProgress, Button,
    FormControl, InputLabel, Select, MenuItem, Stack, Chip, Dialog,
    DialogTitle, DialogContent, DialogActions, Alert,
} from '@mui/material';
import { Print, PeopleAlt, CreditCard, CheckCircle } from '@mui/icons-material';
import { collection, query, where, getDocs, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { useTenant } from '../context/TenantContext';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { CLIENT_STATUS, getStatusInfo } from '../constants/clientStatus';

export default function MonthlyAccountingPage() {
    const navigate = useNavigate();
    const { activeCompanyId: companyId, currentTenant } = useTenant();
    const welfareTrainingType = currentTenant?.company?.welfareTrainingType ?? 'both'; // 未設定の場合は後方互換でboth扱い
    const hasWelfareTraining = welfareTrainingType !== 'none';
    const [clients, setClients] = useState([]);
    const [attendanceCounts, setAttendanceCounts] = useState({});
    const [loading, setLoading] = useState(true);

    // 利用料請求書発行
    const [billingTargets, setBillingTargets] = useState([]); // usageFee > 0 の施設内利用者
    const [issuingBilling, setIssuingBilling] = useState(false);
    const [billingResult, setBillingResult] = useState(null); // { issued, skipped }
    const [billingDialog, setBillingDialog] = useState(false);

    // 月選択
    const currentDate = new Date();
    const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);

    // 月選択オプション（過去12ヶ月）
    const monthOptions = [];
    for (let i = 0; i < 12; i++) {
        const d = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        monthOptions.push({
            year: d.getFullYear(),
            month: d.getMonth() + 1,
            label: format(d, 'yyyy年M月'),
        });
    }

    // 利用実績のあるクライアントを取得
    // 請求対象者は出席に関係なく常に取得（companyIdが変わった時だけ再取得）
    useEffect(() => {
        const fetchBillingTargets = async () => {
            try {
                const companyFilter = companyId ? [where('companyId', '==', companyId)] : [];
                const snap = await getDocs(
                    companyFilter.length
                        ? query(collection(db, 'clients'), ...companyFilter)
                        : collection(db, 'clients')
                );
                const targets = snap.docs
                    .map(d => ({ id: d.id, ...d.data() }))
                    .filter(c => c.status === CLIENT_STATUS.ACTIVE_ONSITE && Number(c.usageFee) > 0)
                    .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ja'));
                setBillingTargets(targets);
            } catch (e) {
                console.error('請求対象者取得エラー:', e);
            }
        };
        fetchBillingTargets();
    }, [companyId]);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const monthStart = startOfMonth(new Date(selectedYear, selectedMonth - 1));
                const monthEnd = endOfMonth(new Date(selectedYear, selectedMonth - 1));

                // 1. 対象月の全出席記録を取得（実績ベースで抽出するため）
                const companyFilter = companyId ? [where('companyId', '==', companyId)] : [];
                const recordsQuery = query(
                    collection(db, 'attendanceRecords'),
                    ...companyFilter,
                    where('date', '>=', Timestamp.fromDate(monthStart)),
                    where('date', '<=', Timestamp.fromDate(monthEnd))
                );
                const recordsSnap = await getDocs(recordsQuery);

                // 2. 実績を集計し、ユニークなclientIdリストを作成
                const counts = {};
                const activeClientIds = new Set();

                recordsSnap.docs.forEach(doc => {
                    const data = doc.data();
                    if (data.status === 'present') {
                        counts[data.clientId] = (counts[data.clientId] || 0) + 1;
                        activeClientIds.add(data.clientId);
                    }
                });
                setAttendanceCounts(counts);

                if (activeClientIds.size === 0) {
                    setClients([]);
                    setLoading(false);
                    return;
                }

                // 3. クライアント情報を取得（全件取得してからフィルタ）
                const clientsQuery = query(collection(db, 'clients'), ...companyFilter);
                const clientsSnap = await getDocs(clientsQuery);

                const clientsData = [];
                clientsSnap.docs.forEach(doc => {
                    if (activeClientIds.has(doc.id)) {
                        clientsData.push({ id: doc.id, ...doc.data() });
                    }
                });

                // 名前順にソート
                clientsData.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ja'));
                setClients(clientsData);

            } catch (error) {
                console.error('データ取得エラー:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [selectedYear, selectedMonth, companyId]);



    const handleMonthChange = (e) => {
        const [year, month] = e.target.value.split('-').map(Number);
        setSelectedYear(year);
        setSelectedMonth(month);
    };

    // 利用料請求書発行（billingRecords に未発行の人だけ登録）
    const handleIssueBilling = async () => {
        if (!companyId || billingTargets.length === 0) return;
        setIssuingBilling(true);
        const yearMonth = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
        try {
            // 既発行チェック
            const existingSnap = await getDocs(query(
                collection(db, 'billingRecords'),
                where('companyId', '==', companyId),
                where('yearMonth', '==', yearMonth),
            ));
            const issuedClientIds = new Set(existingSnap.docs.map(d => d.data().clientId));

            let issued = 0, skipped = 0;
            for (const client of billingTargets) {
                if (issuedClientIds.has(client.id)) { skipped++; continue; }
                await addDoc(collection(db, 'billingRecords'), {
                    companyId,
                    clientId: client.id,
                    clientName: client.name,
                    yearMonth,
                    amount: Number(client.usageFee),
                    status: 'pending',
                    issuedAt: Timestamp.now(),
                    paidAt: null,
                });
                issued++;
            }
            setBillingResult({ issued, skipped });
        } catch (e) {
            console.error('請求書発行エラー:', e);
        } finally {
            setIssuingBilling(false);
        }
    };

    // 個別印刷
    const handlePrintAttendance = (clientId) => {
        navigate(`/support/attendance-print/${clientId}?year=${selectedYear}&month=${selectedMonth}`);
    };

    // 一括印刷ページへ遷移
    const handleBatchPrint = (type) => {
        navigate(`/monthly/batch-print?year=${selectedYear}&month=${selectedMonth}&type=${type}`);
    };

    // 施設内/施設外のクライアント数をカウント
    const onsiteClients = clients.filter(c => c.status === CLIENT_STATUS.ACTIVE_ONSITE);
    const remoteClients = clients.filter(c => c.status === CLIENT_STATUS.ACTIVE_REMOTE);

    return (
        <>
        <Container maxWidth="lg">
            <Box sx={{ py: 3 }}>
                {/* ヒーローヘッダー */}
                <Paper
                    elevation={0}
                    sx={{
                        p: 4,
                        mb: 4,
                        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
                        borderRadius: 3,
                        position: 'relative',
                        overflow: 'hidden',
                        border: '1px solid rgba(139, 92, 246, 0.3)',
                        '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'radial-gradient(circle at 20% 50%, rgba(139, 92, 246, 0.15) 0%, transparent 50%)',
                        },
                    }}
                >
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Box sx={{ position: 'relative', zIndex: 1 }}>
                            <Typography
                                variant="h3"
                                sx={{
                                    fontWeight: 800,
                                    color: 'white',
                                    textShadow: '0 2px 10px rgba(0,0,0,0.3)',
                                    mb: 1,
                                }}
                            >
                                📅 月次処理センター
                            </Typography>
                            <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                                {selectedYear}年{selectedMonth}月の処理
                            </Typography>
                        </Box>
                        <FormControl
                            size="medium"
                            sx={{
                                minWidth: 180,
                                '& .MuiOutlinedInput-root': {
                                    bgcolor: 'rgba(255,255,255,0.1)',
                                    color: 'white',
                                    '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                                    '&:hover fieldset': { borderColor: 'rgba(139, 92, 246, 0.5)' },
                                },
                                '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' },
                                '& .MuiSelect-icon': { color: 'rgba(255,255,255,0.7)' },
                            }}
                        >
                            <InputLabel>対象月</InputLabel>
                            <Select
                                value={`${selectedYear}-${selectedMonth}`}
                                label="対象月"
                                onChange={handleMonthChange}
                            >
                                {monthOptions.map(opt => (
                                    <MenuItem key={`${opt.year}-${opt.month}`} value={`${opt.year}-${opt.month}`}>
                                        {opt.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Stack>
                </Paper>

                {/* 月次処理メニューカード */}
                <Stack direction="row" spacing={3} sx={{ mb: 4 }}>
                    {/* 出欠確認表カード */}
                    <Paper
                        elevation={4}
                        sx={{
                            flex: 1,
                            p: 3,
                            borderRadius: 3,
                            background: 'linear-gradient(145deg, #064e3b 0%, #047857 100%)',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                            '&:hover': {
                                transform: 'translateY(-8px) scale(1.02)',
                                boxShadow: '0 20px 40px rgba(16, 185, 129, 0.4)',
                            },
                        }}
                        onClick={() => { }}
                    >
                        <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h1" sx={{ mb: 2 }}>📊</Typography>
                            <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold', mb: 1 }}>
                                出欠確認表
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                                利用者別の出欠一覧を印刷
                            </Typography>
                            <Chip
                                label={`${clients.length}名対象`}
                                size="small"
                                sx={{
                                    mt: 2,
                                    bgcolor: 'rgba(255,255,255,0.2)',
                                    color: 'white',
                                    fontWeight: 'bold',
                                }}
                            />
                        </Box>
                    </Paper>

                    {/* 利用料請求書カード */}
                    <Paper
                        elevation={4}
                        sx={{
                            flex: 1,
                            p: 3,
                            borderRadius: 3,
                            background: 'linear-gradient(145deg, #1e3a5f 0%, #1d4ed8 100%)',
                            border: '1px solid rgba(59,130,246,0.3)',
                        }}
                    >
                        <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h1" sx={{ mb: 2 }}>💳</Typography>
                            <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold', mb: 1 }}>
                                利用料請求書
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mb: 2 }}>
                                上限月額設定済み {billingTargets.length}名対象
                            </Typography>
                            <Stack spacing={1}>
                                <Button
                                    variant="contained"
                                    size="small"
                                    startIcon={issuingBilling ? <CircularProgress size={14} color="inherit" /> : <CreditCard />}
                                    disabled={billingTargets.length === 0 || issuingBilling}
                                    onClick={() => { setBillingResult(null); setBillingDialog(true); }}
                                    sx={{ bgcolor: 'rgba(255,255,255,0.25)', color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.35)' } }}
                                >
                                    請求書発行
                                </Button>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    startIcon={<Print />}
                                    onClick={() => navigate(`/monthly/billing-print?year=${selectedYear}&month=${selectedMonth}`)}
                                    sx={{ borderColor: 'rgba(255,255,255,0.5)', color: 'white', '&:hover': { borderColor: 'white' } }}
                                >
                                    一括印刷
                                </Button>
                                <Button
                                    variant="text"
                                    size="small"
                                    onClick={() => navigate('/accounting/billing')}
                                    sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}
                                >
                                    消し込み画面へ →
                                </Button>
                            </Stack>
                        </Box>
                    </Paper>

                {/* 厚生訓練費請求書カード（対象外の事業所には非表示） */}
                    {hasWelfareTraining ? (
                        <Paper
                            elevation={4}
                            sx={{
                                flex: 1,
                                p: 3,
                                borderRadius: 3,
                                background: 'linear-gradient(145deg, #5b21b6 0%, #7c3aed 100%)',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                border: '1px solid rgba(139, 92, 246, 0.3)',
                                '&:hover': {
                                    transform: 'translateY(-8px) scale(1.02)',
                                    boxShadow: '0 20px 40px rgba(139, 92, 246, 0.4)',
                                },
                            }}
                            onClick={() => navigate(`/monthly/welfare-training`)}
                        >
                            <Box sx={{ textAlign: 'center' }}>
                                <Typography variant="h1" sx={{ mb: 2 }}>💰</Typography>
                                <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold', mb: 1 }}>
                                    {welfareTrainingType === 'transport_only' ? '交通費請求書' : '厚生訓練費請求書'}
                                </Typography>
                                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                                    {welfareTrainingType === 'transport_only' ? '交通費のみ' : '訓練費・交通費の請求書を作成'}
                                </Typography>
                                <Chip
                                    label="作成する →"
                                    size="small"
                                    sx={{
                                        mt: 2,
                                        bgcolor: 'rgba(255,255,255,0.2)',
                                        color: 'white',
                                        fontWeight: 'bold',
                                    }}
                                />
                            </Box>
                        </Paper>
                    ) : (
                        <Paper
                            elevation={0}
                            sx={{
                                flex: 1,
                                p: 3,
                                borderRadius: 3,
                                background: 'rgba(30,41,59,0.4)',
                                border: '1px dashed rgba(148,163,184,0.3)',
                            }}
                        >
                            <Box sx={{ textAlign: 'center' }}>
                                <Typography variant="h1" sx={{ mb: 2, opacity: 0.3 }}>💰</Typography>
                                <Typography variant="h5" sx={{ color: 'text.disabled', fontWeight: 'bold', mb: 1 }}>
                                    厚生訓練費請求書
                                </Typography>
                                <Typography variant="body2" color="text.disabled">
                                    この事業所は対象外です
                                </Typography>
                                <Chip
                                    label="管理画面で設定 →"
                                    size="small"
                                    variant="outlined"
                                    onClick={() => navigate('/admin/companies')}
                                    sx={{ mt: 2, cursor: 'pointer' }}
                                />
                            </Box>
                        </Paper>
                    )}
                </Stack>

                {/* 出欠確認表セクション */}
                <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
                    <Box sx={{
                        p: 2,
                        background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
                        color: 'white',
                    }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Typography variant="h6" fontWeight="bold">
                                📊 出欠確認表 - {selectedYear}年{selectedMonth}月
                            </Typography>
                            <Stack direction="row" spacing={1}>
                                <Chip
                                    icon={<PeopleAlt sx={{ color: 'white !important' }} />}
                                    label={`施設内: ${onsiteClients.length}名`}
                                    size="small"
                                    sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                                />
                                <Chip
                                    icon={<PeopleAlt sx={{ color: 'white !important' }} />}
                                    label={`施設外: ${remoteClients.length}名`}
                                    size="small"
                                    sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                                />
                            </Stack>
                        </Stack>
                    </Box>

                    {/* 一括印刷ボタン */}
                    <Box sx={{ p: 2, bgcolor: 'grey.50' }}>
                        <Stack direction="row" spacing={2}>
                            <Button
                                variant="contained"
                                color="success"
                                size="large"
                                startIcon={<Print />}
                                onClick={() => handleBatchPrint('onsite')}
                                disabled={onsiteClients.length === 0}
                                sx={{ flex: 1, py: 1.5 }}
                            >
                                施設内 全員印刷 ({onsiteClients.length}名)
                            </Button>
                            <Button
                                variant="contained"
                                color="info"
                                size="large"
                                startIcon={<Print />}
                                onClick={() => handleBatchPrint('remote')}
                                disabled={remoteClients.length === 0}
                                sx={{ flex: 1, py: 1.5 }}
                            >
                                施設外 全員印刷 ({remoteClients.length}名)
                            </Button>
                        </Stack>
                    </Box>

                    {loading ? (

                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                            <CircularProgress />
                        </Box>
                    ) : (
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold' }}>氏名</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>受給者証番号</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>利用形態</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }} align="center">利用日数</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 'bold' }}>個別印刷</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {clients.map(client => (
                                        <TableRow key={client.id} hover>
                                            <TableCell>
                                                <Typography variant="body2" fontWeight="bold">{client.name}</Typography>
                                                <Typography variant="caption" color="text.secondary">{client.nameKana}</Typography>
                                            </TableCell>
                                            <TableCell>{client.recipientId || '-'}</TableCell>
                                            <TableCell>
                                                {(() => {
                                                    const statusInfo = getStatusInfo(client.status);
                                                    return (
                                                        <Chip
                                                            label={statusInfo.label}
                                                            size="small"
                                                            sx={{
                                                                bgcolor: statusInfo.bg,
                                                                color: statusInfo.text,
                                                                fontWeight: 'bold'
                                                            }}
                                                        />
                                                    );
                                                })()}
                                            </TableCell>
                                            <TableCell align="center">
                                                <Typography
                                                    variant="body2"
                                                    fontWeight="bold"
                                                    color={attendanceCounts[client.id] > 0 ? 'text.primary' : 'text.secondary'}
                                                >
                                                    {attendanceCounts[client.id] || 0}日
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="center">
                                                <Button
                                                    size="small"
                                                    variant="outlined"
                                                    startIcon={<Print />}
                                                    onClick={() => handlePrintAttendance(client.id)}
                                                >
                                                    印刷
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {clients.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                                                利用中の方がいません
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </Paper>
            </Box>
        </Container>

        {/* 請求書発行確認ダイアログ */}
        <Dialog open={billingDialog} onClose={() => setBillingDialog(false)} maxWidth="sm" fullWidth>
            <DialogTitle>利用料請求書 発行確認</DialogTitle>
            <DialogContent>
                {billingResult ? (
                    <Stack spacing={2} sx={{ pt: 1 }}>
                        <Alert severity="success" icon={<CheckCircle />}>
                            <Typography fontWeight="bold">発行完了</Typography>
                            <Typography variant="body2">
                                新規発行: {billingResult.issued}件 ／ 既発行スキップ: {billingResult.skipped}件
                            </Typography>
                        </Alert>
                        <Typography variant="body2" color="text.secondary">
                            一括印刷ボタンから請求書を印刷して利用者に渡してください。
                        </Typography>
                    </Stack>
                ) : (
                    <Stack spacing={2} sx={{ pt: 1 }}>
                        {selectedYear === currentDate.getFullYear() && selectedMonth === (currentDate.getMonth() + 1) && (
                            <Alert severity="warning" sx={{ fontWeight: 'bold' }}>
                                当月（{selectedYear}年{selectedMonth}月）分の請求書を発行しようとしています。
                                通常、請求書は翌月以降に発行します。対象月を確認してください。
                            </Alert>
                        )}
                        <Typography>
                            <strong>{selectedYear}年{selectedMonth}月分</strong> の利用料請求書を発行します。
                        </Typography>
                        <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                            <Typography variant="body2" gutterBottom sx={{ color: '#666' }}>対象利用者（施設内・上限月額設定済み）</Typography>
                            {billingTargets.map(c => (
                                <Typography key={c.id} variant="body2" sx={{ color: '#222' }}>
                                    ・{c.name}　¥{Number(c.usageFee).toLocaleString()}
                                </Typography>
                            ))}
                        </Box>
                        <Alert severity="info" sx={{ fontSize: '0.8rem' }}>
                            既に発行済みの方はスキップされます。
                        </Alert>
                    </Stack>
                )}
            </DialogContent>
            <DialogActions>
                {billingResult ? (
                    <>
                        <Button onClick={() => setBillingDialog(false)}>閉じる</Button>
                        <Button
                            variant="contained"
                            startIcon={<Print />}
                            onClick={() => {
                                setBillingDialog(false);
                                navigate(`/monthly/billing-print?year=${selectedYear}&month=${selectedMonth}`);
                            }}
                        >
                            一括印刷へ
                        </Button>
                    </>
                ) : (
                    <>
                        <Button onClick={() => setBillingDialog(false)}>キャンセル</Button>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleIssueBilling}
                            disabled={issuingBilling}
                            startIcon={issuingBilling ? <CircularProgress size={16} /> : <CreditCard />}
                        >
                            発行する
                        </Button>
                    </>
                )}
            </DialogActions>
        </Dialog>
        </>
    );
}
