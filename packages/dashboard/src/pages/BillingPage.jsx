// src/pages/BillingPage.jsx
// 利用料管理 — 年間テーブル（金額編集 + 入金管理）

import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Container, Typography, Paper, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Button, CircularProgress,
    Stack, Chip, Alert, Dialog, DialogTitle, DialogContent,
    DialogActions, TextField, FormControl, InputLabel, Select, MenuItem,
    Tooltip, IconButton, Badge,
} from '@mui/material';
import {
    CheckCircle, Edit, ReceiptLong, Undo,
} from '@mui/icons-material';
import {
    collection, query, where, getDocs, doc, updateDoc, Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { useTenant } from '../context/TenantContext';
import { format } from 'date-fns';

// 年度の月リスト（4月〜3月）を生成
function getFiscalYearMonths(fiscalYear) {
    const months = [];
    for (let m = 4; m <= 12; m++) {
        months.push(`${fiscalYear}-${String(m).padStart(2, '0')}`);
    }
    for (let m = 1; m <= 3; m++) {
        months.push(`${fiscalYear + 1}-${String(m).padStart(2, '0')}`);
    }
    return months;
}

function formatMonth(ym) {
    const m = Number(ym.split('-')[1]);
    return `${m}月`;
}

// 現在の年度を取得（4月始まり）
function getCurrentFiscalYear() {
    const now = new Date();
    return now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
}

export default function BillingPage() {
    const { activeCompanyId: companyId, loading: tenantLoading } = useTenant();
    const [loading, setLoading] = useState(true);
    const [records, setRecords] = useState([]);

    // 年度選択
    const currentFY = getCurrentFiscalYear();
    const [fiscalYear, setFiscalYear] = useState(currentFY);
    const fyMonths = getFiscalYearMonths(fiscalYear);

    // 金額編集
    const [editingCell, setEditingCell] = useState(null); // { recordId, clientName, yearMonth }
    const [editAmount, setEditAmount] = useState('');
    const [savingEdit, setSavingEdit] = useState(false);

    // 入金確認ダイアログ
    const [confirmDialog, setConfirmDialog] = useState(null);
    const [paidDate, setPaidDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [savingPaid, setSavingPaid] = useState(false);

    const fetchRecords = useCallback(async () => {
        if (tenantLoading) return;
        if (!companyId) { setLoading(false); return; }
        setLoading(true);
        try {
            const q = query(
                collection(db, 'billingRecords'),
                where('companyId', '==', companyId),
            );
            const snap = await getDocs(q);
            const data = snap.docs
                .map(d => ({ id: d.id, ...d.data() }))
                .sort((a, b) => b.yearMonth.localeCompare(a.yearMonth));
            setRecords(data);
        } catch (e) {
            console.error('billingRecords取得エラー:', e);
        } finally {
            setLoading(false);
        }
    }, [companyId, tenantLoading]);

    useEffect(() => { fetchRecords(); }, [fetchRecords]);

    // 年度内のレコードだけ抽出
    const fyRecords = records.filter(r => fyMonths.includes(r.yearMonth));

    // クライアント一覧（名前順）
    const clientMap = {};
    fyRecords.forEach(r => {
        if (!clientMap[r.clientId]) {
            clientMap[r.clientId] = { name: r.clientName, months: {} };
        }
        clientMap[r.clientId].months[r.yearMonth] = r;
    });
    const clientList = Object.entries(clientMap)
        .sort((a, b) => (a[1].name || '').localeCompare(b[1].name || '', 'ja'));

    // 未入金件数
    const unpaidCount = fyRecords.filter(r => r.status === 'pending').length;

    // 金額編集の保存
    const handleSaveAmount = async () => {
        if (!editingCell) return;
        const newAmount = Number(editAmount);
        if (isNaN(newAmount) || newAmount < 0) return;
        setSavingEdit(true);
        try {
            await updateDoc(doc(db, 'billingRecords', editingCell.recordId), {
                amount: newAmount,
            });
            await fetchRecords();
            setEditingCell(null);
        } catch (e) {
            console.error('金額更新エラー:', e);
        } finally {
            setSavingEdit(false);
        }
    };

    const startEdit = (record) => {
        setEditingCell({
            recordId: record.id,
            clientName: record.clientName,
            yearMonth: record.yearMonth,
        });
        setEditAmount(String(record.amount || 0));
    };

    // 入金確認
    const handleConfirmPaid = async () => {
        if (!confirmDialog) return;
        setSavingPaid(true);
        try {
            await updateDoc(doc(db, 'billingRecords', confirmDialog.record.id), {
                status: 'paid',
                paidAt: Timestamp.fromDate(new Date(paidDate)),
            });
            await fetchRecords();
            setConfirmDialog(null);
        } catch (e) {
            console.error('入金確認エラー:', e);
        } finally {
            setSavingPaid(false);
        }
    };

    // 入金取消
    const handleUndoPaid = async (record) => {
        try {
            await updateDoc(doc(db, 'billingRecords', record.id), {
                status: 'pending',
                paidAt: null,
            });
            await fetchRecords();
        } catch (e) {
            console.error('入金取消エラー:', e);
        }
    };

    // 年度選択肢（過去3年分）
    const fyOptions = [];
    for (let i = 0; i < 3; i++) {
        const fy = currentFY - i;
        fyOptions.push({ value: fy, label: `${fy}年度（${fy}.4〜${fy + 1}.3）` });
    }

    // 月ごとの合計
    const monthTotals = {};
    fyMonths.forEach(ym => {
        monthTotals[ym] = fyRecords
            .filter(r => r.yearMonth === ym)
            .reduce((s, r) => s + (r.amount || 0), 0);
    });

    return (
        <Container maxWidth="xl">
            <Box sx={{ py: 3 }}>
                {/* ヘッダー */}
                <Paper
                    elevation={0}
                    sx={{
                        p: 4, mb: 4,
                        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
                        borderRadius: 3, border: '1px solid rgba(59,130,246,0.3)',
                    }}
                >
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Box>
                            <Typography variant="h3" sx={{ fontWeight: 800, color: 'white', mb: 1 }}>
                                💳 利用料管理
                            </Typography>
                            <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                                金額訂正・入金管理
                            </Typography>
                        </Box>
                        <Stack direction="row" spacing={2} alignItems="center">
                            {unpaidCount > 0 && (
                                <Chip
                                    label={`未入金 ${unpaidCount}件`}
                                    color="error"
                                    sx={{ fontSize: '0.9rem', py: 2, fontWeight: 'bold' }}
                                />
                            )}
                            <FormControl size="small" sx={{ minWidth: 200 }}>
                                <Select
                                    value={fiscalYear}
                                    onChange={e => setFiscalYear(e.target.value)}
                                    sx={{
                                        bgcolor: 'rgba(255,255,255,0.1)',
                                        color: 'white',
                                        '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.3)' },
                                        '& .MuiSelect-icon': { color: 'white' },
                                    }}
                                >
                                    {fyOptions.map(opt => (
                                        <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Stack>
                    </Stack>
                </Paper>

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                        <CircularProgress />
                    </Box>
                ) : clientList.length === 0 ? (
                    <Alert severity="info">
                        {fiscalYear}年度の請求データがありません。月次処理から「請求書発行」を行ってください。
                    </Alert>
                ) : (
                    <Paper sx={{ borderRadius: 2, overflow: 'hidden', bgcolor: 'white', color: '#1e293b' }}>
                        <Box sx={{ p: 2, bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                            <Stack direction="row" spacing={3} alignItems="center">
                                <Typography variant="body2" sx={{ color: '#334155' }}>
                                    対象者: <strong>{clientList.length}名</strong>
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#334155' }}>
                                    年間合計: <strong>¥{Object.values(monthTotals).reduce((s, v) => s + v, 0).toLocaleString()}</strong>
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                                    金額をクリックして訂正 ／ ステータスをクリックして入金切替
                                </Typography>
                            </Stack>
                        </Box>
                        <TableContainer sx={{ maxHeight: 'calc(100vh - 320px)' }}>
                            <Table size="small" stickyHeader>
                                <TableHead>
                                    <TableRow>
                                        <TableCell
                                            sx={{
                                                fontWeight: 'bold', minWidth: 120,
                                                position: 'sticky', left: 0, zIndex: 3,
                                                bgcolor: '#f1f5f9', color: '#334155',
                                            }}
                                        >
                                            利用者名
                                        </TableCell>
                                        {fyMonths.map(ym => (
                                            <TableCell
                                                key={ym}
                                                align="center"
                                                sx={{
                                                    fontWeight: 'bold', minWidth: 100,
                                                    bgcolor: '#f1f5f9', color: '#334155',
                                                    borderLeft: '1px solid #e2e8f0',
                                                }}
                                            >
                                                {formatMonth(ym)}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {clientList.map(([clientId, data]) => (
                                        <TableRow key={clientId} hover>
                                            <TableCell
                                                sx={{
                                                    fontWeight: 'bold',
                                                    position: 'sticky', left: 0, zIndex: 1,
                                                    bgcolor: 'white',
                                                    borderRight: '2px solid #e2e8f0',
                                                }}
                                            >
                                                <Typography variant="body2" fontWeight="bold" noWrap sx={{ color: '#1e293b' }}>
                                                    {data.name}
                                                </Typography>
                                            </TableCell>
                                            {fyMonths.map(ym => {
                                                const rec = data.months[ym];
                                                if (!rec) {
                                                    return (
                                                        <TableCell
                                                            key={ym}
                                                            align="center"
                                                            sx={{ borderLeft: '1px solid #f0f0f0', color: '#cbd5e1' }}
                                                        >
                                                            —
                                                        </TableCell>
                                                    );
                                                }
                                                const isPaid = rec.status === 'paid';
                                                return (
                                                    <TableCell
                                                        key={ym}
                                                        align="center"
                                                        sx={{
                                                            borderLeft: '1px solid #f0f0f0',
                                                            bgcolor: isPaid ? '#f0fdf4' : '#fffbeb',
                                                            cursor: 'pointer',
                                                            '&:hover': { bgcolor: isPaid ? '#dcfce7' : '#fef3c7' },
                                                            p: '4px 8px',
                                                        }}
                                                    >
                                                        {/* 金額（クリックで編集） */}
                                                        <Tooltip title="クリックで金額訂正">
                                                            <Typography
                                                                variant="body2"
                                                                fontWeight="bold"
                                                                onClick={() => startEdit(rec)}
                                                                sx={{ cursor: 'pointer', color: '#1e293b', '&:hover': { textDecoration: 'underline' } }}
                                                            >
                                                                ¥{(rec.amount || 0).toLocaleString()}
                                                            </Typography>
                                                        </Tooltip>
                                                        {/* ステータス（クリックで切替） */}
                                                        {isPaid ? (
                                                            <Tooltip title={`${rec.paidAt?.toDate ? format(rec.paidAt.toDate(), 'M/d') : ''}入金済 — クリックで取消`}>
                                                                <Chip
                                                                    label="入金済"
                                                                    size="small"
                                                                    color="success"
                                                                    icon={<CheckCircle sx={{ fontSize: 14 }} />}
                                                                    onClick={() => handleUndoPaid(rec)}
                                                                    sx={{ mt: 0.5, fontSize: '0.7rem', height: 20, cursor: 'pointer' }}
                                                                />
                                                            </Tooltip>
                                                        ) : (
                                                            <Tooltip title="クリックで入金確認">
                                                                <Chip
                                                                    label="未入金"
                                                                    size="small"
                                                                    color="warning"
                                                                    variant="outlined"
                                                                    onClick={() => {
                                                                        setPaidDate(format(new Date(), 'yyyy-MM-dd'));
                                                                        setConfirmDialog({ record: rec });
                                                                    }}
                                                                    sx={{ mt: 0.5, fontSize: '0.7rem', height: 20, cursor: 'pointer' }}
                                                                />
                                                            </Tooltip>
                                                        )}
                                                    </TableCell>
                                                );
                                            })}
                                        </TableRow>
                                    ))}
                                    {/* 合計行 */}
                                    <TableRow sx={{ bgcolor: '#f8fafc' }}>
                                        <TableCell
                                            sx={{
                                                fontWeight: 'bold', color: '#334155',
                                                position: 'sticky', left: 0, zIndex: 1,
                                                bgcolor: '#f8fafc',
                                                borderRight: '2px solid #e2e8f0',
                                                borderTop: '2px solid #cbd5e1',
                                            }}
                                        >
                                            合計
                                        </TableCell>
                                        {fyMonths.map(ym => (
                                            <TableCell
                                                key={ym}
                                                align="center"
                                                sx={{
                                                    fontWeight: 'bold', color: '#334155',
                                                    borderLeft: '1px solid #e2e8f0',
                                                    borderTop: '2px solid #cbd5e1',
                                                }}
                                            >
                                                {monthTotals[ym] > 0
                                                    ? `¥${monthTotals[ym].toLocaleString()}`
                                                    : '—'
                                                }
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                )}
            </Box>

            {/* 金額編集ダイアログ */}
            <Dialog open={!!editingCell} onClose={() => setEditingCell(null)} maxWidth="xs" fullWidth>
                <DialogTitle>請求額の訂正</DialogTitle>
                <DialogContent>
                    {editingCell && (
                        <Stack spacing={2} sx={{ pt: 1 }}>
                            <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                                <Typography variant="body2" color="text.secondary">利用者</Typography>
                                <Typography fontWeight="bold">{editingCell.clientName}</Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>対象月</Typography>
                                <Typography fontWeight="bold">
                                    {editingCell.yearMonth.split('-')[0]}年{Number(editingCell.yearMonth.split('-')[1])}月
                                </Typography>
                            </Box>
                            <TextField
                                label="請求額（円）"
                                type="number"
                                value={editAmount}
                                onChange={e => setEditAmount(e.target.value)}
                                fullWidth
                                size="small"
                                slotProps={{ input: { startAdornment: '¥' } }}
                                autoFocus
                            />
                        </Stack>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditingCell(null)}>キャンセル</Button>
                    <Button
                        variant="contained"
                        onClick={handleSaveAmount}
                        disabled={savingEdit}
                        startIcon={savingEdit ? <CircularProgress size={16} /> : <Edit />}
                    >
                        保存
                    </Button>
                </DialogActions>
            </Dialog>

            {/* 入金確認ダイアログ */}
            <Dialog open={!!confirmDialog} onClose={() => setConfirmDialog(null)} maxWidth="xs" fullWidth>
                <DialogTitle>入金確認</DialogTitle>
                <DialogContent>
                    {confirmDialog && (
                        <Stack spacing={2} sx={{ pt: 1 }}>
                            <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                                <Typography variant="body2" color="text.secondary">利用者</Typography>
                                <Typography fontWeight="bold">{confirmDialog.record.clientName}</Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>対象月 / 請求額</Typography>
                                <Typography fontWeight="bold">
                                    {confirmDialog.record.yearMonth.split('-')[0]}年
                                    {Number(confirmDialog.record.yearMonth.split('-')[1])}月
                                    ／ ¥{(confirmDialog.record.amount || 0).toLocaleString()}
                                </Typography>
                            </Box>
                            <TextField
                                label="入金日"
                                type="date"
                                value={paidDate}
                                onChange={e => setPaidDate(e.target.value)}
                                fullWidth
                                size="small"
                                slotProps={{ inputLabel: { shrink: true } }}
                            />
                        </Stack>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmDialog(null)}>キャンセル</Button>
                    <Button
                        variant="contained"
                        color="success"
                        onClick={handleConfirmPaid}
                        disabled={savingPaid || !paidDate}
                        startIcon={savingPaid ? <CircularProgress size={16} /> : <CheckCircle />}
                    >
                        入金済みにする
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}
