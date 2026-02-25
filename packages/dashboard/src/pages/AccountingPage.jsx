// src/pages/AccountingPage.jsx
// 経理ページ：厚生訓練費 消込（マッチング）モックアップ v2

import React, { useState } from 'react';
import {
    Box, Container, Typography, Paper, Grid, List, ListItem,
    ListItemText, ListItemButton, Checkbox, Divider, Button,
    Stack, Chip, Card, CardContent, Tabs, Tab
} from '@mui/material';
import {
    ReceiptLong, AccountBalanceWallet, CheckCircle,
    Description, Send, Print
} from '@mui/icons-material';

// --- モックデータ初期値 ---
const INITIAL_PAYMENTS = [
    { id: 'p1', date: '2026-02-15', payer: 'ナカク フクシカ', amount: 30040 },
    { id: 'p2', date: '2026-02-20', payer: 'ミヨシシ ヤクショ', amount: 48500 },
    { id: 'p3', date: '2026-02-25', payer: 'ヒガシク ヤクショ', amount: 12000 },
    { id: 'p4', date: '2026-02-26', payer: 'ミナミク フクシカ', amount: 15000 },
    { id: 'p5', date: '2026-02-27', payer: 'ニシク フクシカ', amount: 22000 },
];

const INITIAL_CLAIMS = [
    { id: 'c1', month: '2026-01', municipality: '広島市中区', client: '川崎 かずみ', type: 'fees', amount: 3150 },
    { id: 'c2', month: '2026-01', municipality: '広島市中区', client: '川崎 かずみ', type: 'transport', amount: 2400 },
    { id: 'c3', month: '2026-01', municipality: '広島市中区', client: '田村 翔', type: 'fees', amount: 3150 },
    { id: 'c4', month: '2026-01', municipality: '広島市中区', client: '田村 翔', type: 'transport', amount: 2400 },
    { id: 'c5', month: '2026-01', municipality: '広島市中区', client: '山田 花子', type: 'fees', amount: 3150 },
    { id: 'c6', month: '2026-01', municipality: '広島市中区', client: '山田 花子', type: 'transport', amount: 15790 },

    { id: 'c10', month: '2025-10', municipality: '三次市', client: '佐藤 次郎', type: 'fees+trans', amount: 16000 },
    { id: 'c11', month: '2025-11', municipality: '三次市', client: '佐藤 次郎', type: 'fees+trans', amount: 16500 },
    { id: 'c12', month: '2025-12', municipality: '三次市', client: '佐藤 次郎', type: 'fees+trans', amount: 16000 },
];

export default function AccountingPage() {
    const [tabValue, setTabValue] = useState(0);

    // データState
    const [payments, setPayments] = useState(INITIAL_PAYMENTS);
    const [claims, setClaims] = useState(INITIAL_CLAIMS);
    const [matchedData, setMatchedData] = useState([]); // 消込済みデータ（送金指示用）

    // 選択State
    const [selectedPaymentId, setSelectedPaymentId] = useState(null);
    const [selectedClaimIds, setSelectedClaimIds] = useState([]);

    const selectedPayment = payments.find(p => p.id === selectedPaymentId);

    const selectedClaimsTotal = selectedClaimIds.reduce((sum, id) => {
        const claim = claims.find(c => c.id === id);
        return sum + (claim ? claim.amount : 0);
    }, 0);

    const diff = selectedPayment ? (selectedPayment.amount - selectedClaimsTotal) : 0;
    const isMatch = selectedPayment && diff === 0;

    // ハンドラ
    const handlePaymentClick = (id) => {
        if (selectedPaymentId === id) {
            setSelectedPaymentId(null);
        } else {
            setSelectedPaymentId(id);
        }
    };

    const handleClaimToggle = (id) => {
        if (selectedClaimIds.includes(id)) {
            setSelectedClaimIds(prev => prev.filter(cid => cid !== id));
        } else {
            setSelectedClaimIds(prev => [...prev, id]);
        }
    };

    const handleConfirmMatch = () => {
        if (!selectedPayment) return;

        // 1. 消込データを保存（送金指示用）
        const matchedClaims = claims.filter(c => selectedClaimIds.includes(c.id));
        const newMatch = {
            payment: selectedPayment,
            claims: matchedClaims,
            matchedAt: new Date().toISOString()
        };
        setMatchedData(prev => [...prev, newMatch]);

        // 2. リストから削除
        setPayments(prev => prev.filter(p => p.id !== selectedPaymentId));
        setClaims(prev => prev.filter(c => !selectedClaimIds.includes(c.id)));

        // 3. 選択リセット
        setSelectedPaymentId(null);
        setSelectedClaimIds([]);

        // 4. 通知など
        // alert('消込完了！リストから削除しました。');
    };

    const handleReset = () => {
        setPayments(INITIAL_PAYMENTS);
        setClaims(INITIAL_CLAIMS);
        setMatchedData([]);
        setSelectedPaymentId(null);
        setSelectedClaimIds([]);
    };

    // 請求データのグループ化
    const groupedClaims = claims.reduce((acc, claim) => {
        if (!acc[claim.municipality]) acc[claim.municipality] = {};
        if (!acc[claim.municipality][claim.month]) acc[claim.municipality][claim.month] = [];
        acc[claim.municipality][claim.month].push(claim);
        return acc;
    }, {});

    return (
        <Container maxWidth="xl" sx={{ height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
                    <Tab label="💰 消込作業 (Matching)" />
                    <Tab label={`📄 送金指示書 (${matchedData.length})`} />
                </Tabs>
            </Box>

            {/* タブ1: 消込作業 */}
            {tabValue === 0 && (
                <>
                    <Box sx={{ mb: 1, display: 'flex', justifyContent: 'flex-end' }}>
                        <Button size="small" onClick={handleReset}>データをリセット(デモ用)</Button>
                    </Box>

                    <Grid container spacing={2} sx={{ flex: 1, overflow: 'hidden' }}>
                        {/* 左：入金リスト */}
                        <Grid item xs={12} md={4} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <Paper sx={{ p: 1, mb: 1, bgcolor: '#e3f2fd', color: '#0d47a1', fontWeight: 'bold' }}>
                                <AccountBalanceWallet sx={{ verticalAlign: 'middle', mr: 1 }} />
                                入金リスト ({payments.length}件)
                            </Paper>
                            <Box sx={{ overflow: 'auto', flex: 1, pr: 1 }}>
                                <Stack spacing={1}>
                                    {payments.length === 0 ? (
                                        <Typography color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                                            未処理の入金はありません
                                        </Typography>
                                    ) : (
                                        payments.map(payment => {
                                            const isSelected = selectedPaymentId === payment.id;
                                            return (
                                                <Card
                                                    key={payment.id}
                                                    onClick={() => handlePaymentClick(payment.id)}
                                                    elevation={isSelected ? 8 : 1}
                                                    sx={{
                                                        cursor: 'pointer',
                                                        border: isSelected ? '3px solid #1976d2' : '1px solid #ddd',
                                                        bgcolor: isSelected ? '#e3f2fd' : '#fff',
                                                        transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                                                        transition: 'all 0.2s',
                                                        position: 'relative',
                                                        overflow: 'visible'
                                                    }}
                                                >
                                                    {isSelected && (
                                                        <Box sx={{
                                                            position: 'absolute', top: -10, right: -10,
                                                            bgcolor: '#1976d2', color: '#fff', borderRadius: '50%',
                                                            width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            zIndex: 1
                                                        }}>
                                                            <CheckCircle sx={{ fontSize: 16 }} />
                                                        </Box>
                                                    )}
                                                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                                        <Stack direction="row" justifyContent="space-between">
                                                            <Typography variant="caption" color="text.secondary">{payment.date}</Typography>
                                                            <Chip label="未処理" size="small" color="warning" variant="outlined" sx={{ height: 20 }} />
                                                        </Stack>
                                                        <Typography variant="h6" fontWeight="bold" sx={{ mt: 0.5 }}>
                                                            {payment.payer}
                                                        </Typography>
                                                        <Typography variant="h5" color="primary" align="right" fontWeight="bold">
                                                            ¥{payment.amount.toLocaleString()}
                                                        </Typography>
                                                    </CardContent>
                                                </Card>
                                            );
                                        })
                                    )}
                                </Stack>
                            </Box>
                        </Grid>

                        {/* 右：請求リスト */}
                        <Grid item xs={12} md={8} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <Paper sx={{ p: 1, mb: 1, bgcolor: '#f3e5f5', color: '#4a148c', fontWeight: 'bold' }}>
                                <ReceiptLong sx={{ verticalAlign: 'middle', mr: 1 }} />
                                未収請求データ
                            </Paper>

                            <Box sx={{ overflow: 'auto', flex: 1, border: '1px solid #eee', borderRadius: 1, bgcolor: '#fff' }}>
                                {Object.keys(groupedClaims).length === 0 ? (
                                    <Typography color="text.secondary" sx={{ p: 4, textAlign: 'center' }}>
                                        未収データはありません
                                    </Typography>
                                ) : (
                                    Object.entries(groupedClaims).map(([municipality, months]) => (
                                        <Box key={municipality} sx={{ mb: 2 }}>
                                            <Box sx={{ p: 1.5, bgcolor: '#f3e5f5', borderBottom: '1px solid #e1bee7', fontWeight: 'bold', color: '#4a148c' }}>
                                                🏢 {municipality}
                                            </Box>
                                            {Object.entries(months).map(([month, claims]) => (
                                                <Box key={month} sx={{ borderBottom: '1px solid #eee' }}>
                                                    <Box sx={{ px: 2, py: 0.5, bgcolor: '#fafafa', color: 'text.secondary', fontSize: '0.8rem' }}>
                                                        {month}分
                                                    </Box>
                                                    <List disablePadding>
                                                        {claims.map(claim => {
                                                            const isSelected = selectedClaimIds.includes(claim.id);
                                                            return (
                                                                <ListItem
                                                                    key={claim.id}
                                                                    disablePadding
                                                                    sx={{ bgcolor: isSelected ? '#f3e5f5' : 'transparent' }}
                                                                >
                                                                    <ListItemButton onClick={() => handleClaimToggle(claim.id)} dense>
                                                                        <Checkbox
                                                                            edge="start"
                                                                            checked={isSelected}
                                                                            tabIndex={-1}
                                                                            disableRipple
                                                                            sx={{ color: isSelected ? '#9c27b0' : undefined }}
                                                                        />
                                                                        <ListItemText
                                                                            primary={
                                                                                <Stack direction="row" spacing={2} alignItems="center">
                                                                                    <Typography variant="body2" fontWeight="bold" sx={{ width: 120 }}>{claim.client}</Typography>
                                                                                    <Typography variant="body2" fontWeight="bold">¥{claim.amount.toLocaleString()}</Typography>
                                                                                </Stack>
                                                                            }
                                                                            secondary={claim.type === 'transport' ? '交通費' : '訓練費等'}
                                                                        />
                                                                    </ListItemButton>
                                                                </ListItem>
                                                            );
                                                        })}
                                                    </List>
                                                </Box>
                                            ))}
                                        </Box>
                                    ))
                                )}
                            </Box>
                        </Grid>
                    </Grid>

                    {/* フッター */}
                    <Paper elevation={4} sx={{ mt: 2, p: 2, borderTop: '1px solid #ddd', bgcolor: '#fff' }}>
                        <Grid container alignItems="center" spacing={2}>
                            <Grid item xs={3}>
                                <Typography variant="caption" color="text.secondary">選択した入金</Typography>
                                <Typography variant="h6" color="primary">¥{selectedPayment ? selectedPayment.amount.toLocaleString() : 0}</Typography>
                            </Grid>
                            <Grid item xs={1} sx={{ textAlign: 'center' }}><Typography variant="h5">-</Typography></Grid>
                            <Grid item xs={3}>
                                <Typography variant="caption" color="text.secondary">選択した請求</Typography>
                                <Typography variant="h6" color="secondary">¥{selectedClaimsTotal.toLocaleString()}</Typography>
                            </Grid>
                            <Grid item xs={1} sx={{ textAlign: 'center' }}><Typography variant="h5">=</Typography></Grid>
                            <Grid item xs={2}>
                                <Typography variant="caption" color="text.secondary">差額</Typography>
                                <Typography
                                    variant="h5"
                                    fontWeight="bold"
                                    color={diff === 0 && selectedPayment ? 'success.main' : diff !== 0 ? 'error.main' : 'text.disabled'}
                                >
                                    ¥{diff.toLocaleString()}
                                </Typography>
                            </Grid>
                            <Grid item xs={2}>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    size="large"
                                    disabled={!isMatch}
                                    startIcon={<CheckCircle />}
                                    onClick={handleConfirmMatch}
                                    fullWidth
                                >
                                    消込確定
                                </Button>
                            </Grid>
                        </Grid>
                    </Paper>
                </>
            )}

            {/* タブ2: 送金指示書 */}
            {tabValue === 1 && (
                <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
                    {matchedData.length === 0 ? (
                        <Typography color="text.secondary" align="center" sx={{ mt: 4 }}>
                            まだ消込されたデータはありません。
                        </Typography>
                    ) : (
                        <Stack spacing={3}>
                            {matchedData.map((data, index) => (
                                <Paper key={index} sx={{ p: 3, border: '1px solid #ddd' }}>
                                    <Stack direction="row" justifyContent="space-between" sx={{ mb: 2, borderBottom: '1px solid #eee', pb: 1 }}>
                                        <Typography variant="h6">送金指示書 (プレビュー)</Typography>
                                        <Typography color="text.secondary">作成日: {data.matchedAt.split('T')[0]}</Typography>
                                    </Stack>

                                    <Grid container spacing={4}>
                                        <Grid item xs={6}>
                                            <Typography variant="subtitle2" color="text.secondary">入金元</Typography>
                                            <Typography variant="h6">{data.payment.payer}</Typography>
                                            <Typography>入金額: ¥{data.payment.amount.toLocaleString()}</Typography>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Typography variant="subtitle2" color="text.secondary">支払対象者</Typography>
                                            <Box sx={{ mt: 1 }}>
                                                {data.claims.map(c => (
                                                    <Stack key={c.id} direction="row" justifyContent="space-between" sx={{ borderBottom: '1px dashed #eee', py: 0.5 }}>
                                                        <Typography>{c.client} ({c.type === 'transport' ? '交通費' : '訓練費'})</Typography>
                                                        <Typography>¥{c.amount.toLocaleString()}</Typography>
                                                    </Stack>
                                                ))}
                                                <Divider sx={{ my: 1 }} />
                                                <Stack direction="row" justifyContent="space-between">
                                                    <Typography fontWeight="bold">支払い合計</Typography>
                                                    <Typography fontWeight="bold">¥{data.claims.reduce((s, c) => s + c.amount, 0).toLocaleString()}</Typography>
                                                </Stack>
                                            </Box>
                                        </Grid>
                                    </Grid>

                                    <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                                        <Button variant="outlined" startIcon={<Print />}>印刷プレビュー</Button>
                                        <Button variant="contained" color="success" startIcon={<Send />}>送金を指示する</Button>
                                    </Box>
                                </Paper>
                            ))}
                        </Stack>
                    )}
                </Box>
            )}
        </Container>
    );
}
