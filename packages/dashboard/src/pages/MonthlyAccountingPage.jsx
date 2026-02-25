// src/pages/MonthlyAccountingPage.jsx
// 月次経理作業ページ - 出欠確認表・厚生訓練費など

import React, { useState, useEffect } from 'react';
import {
    Box, Container, Typography, Paper, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, CircularProgress, Button,
    FormControl, InputLabel, Select, MenuItem, Stack, Chip
} from '@mui/material';
import { Print, PeopleAlt } from '@mui/icons-material';
import { collection, query, where, getDocs, or, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { CLIENT_STATUS, getStatusInfo } from '../constants/clientStatus';

export default function MonthlyAccountingPage() {
    const navigate = useNavigate();
    const [clients, setClients] = useState([]);
    const [attendanceCounts, setAttendanceCounts] = useState({});
    const [loading, setLoading] = useState(true);

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
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const monthStart = startOfMonth(new Date(selectedYear, selectedMonth - 1));
                const monthEnd = endOfMonth(new Date(selectedYear, selectedMonth - 1));

                // 1. 対象月の全出席記録を取得（実績ベースで抽出するため）
                const recordsQuery = query(
                    collection(db, 'attendanceRecords'),
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
                const clientsQuery = query(collection(db, 'clients'));
                const clientsSnap = await getDocs(clientsQuery);

                const clientsData = [];
                clientsSnap.docs.forEach(doc => {
                    if (activeClientIds.has(doc.id)) {
                        clientsData.push({
                            id: doc.id,
                            ...doc.data()
                        });
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
    }, [selectedYear, selectedMonth]);



    const handleMonthChange = (e) => {
        const [year, month] = e.target.value.split('-').map(Number);
        setSelectedYear(year);
        setSelectedMonth(month);
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

                    {/* 厚生訓練費請求書カード */}
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
                                厚生訓練費請求書
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                                自治体別の請求書を作成
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


    );
}
