// src/pages/ClientAttendanceGanttPage.jsx
// 利用者出席状況ガントチャート（年度：4月〜翌3月）

import { useState, useEffect, useMemo } from 'react';
import {
    Box, Typography, Paper, CircularProgress, Alert,
    FormControl, InputLabel, Select, MenuItem,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../features/auth/context/AuthContext';

// 月（4月始まり）
const FISCAL_MONTHS = [4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3];
const MONTH_LABELS = ['4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月', '1月', '2月', '3月'];

// 年度リスト生成（2022年度〜現在年度）
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

export default function ClientAttendanceGanttPage() {
    const { currentUser } = useAuth();
    const companyId = currentUser?.companyId || null;

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [fiscalYear, setFiscalYear] = useState(() => {
        const now = new Date();
        return now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
    });

    const [clients, setClients] = useState([]);
    const [attendanceData, setAttendanceData] = useState({}); // { clientId: { 4: 22, 5: 18, ... } }

    const fiscalYears = useMemo(() => generateFiscalYears(), []);

    // データ読み込み
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                // 利用者一覧取得
                const companyFilter = companyId ? [where('companyId', '==', companyId)] : [];
                const clientsSnap = await getDocs(companyFilter.length ? query(collection(db, 'clients'), ...companyFilter) : collection(db, 'clients'));
                const clientList = clientsSnap.docs
                    .map(doc => ({ id: doc.id, ...doc.data() }))
                    .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ja'));
                setClients(clientList);

                // 年度の日付範囲
                const startDate = new Date(fiscalYear, 3, 1); // 4月1日
                const endDate = new Date(fiscalYear + 1, 2, 31, 23, 59, 59); // 翌年3月31日

                // 出席記録取得
                const recordsQuery = query(
                    collection(db, 'attendanceRecords'),
                    ...companyFilter,
                    where('date', '>=', Timestamp.fromDate(startDate)),
                    where('date', '<=', Timestamp.fromDate(endDate)),
                    where('status', '==', 'present')
                );
                const recordsSnap = await getDocs(recordsQuery);

                // 利用者別・月別に集計
                const data = {};
                recordsSnap.docs.forEach(doc => {
                    const record = doc.data();
                    const clientId = record.clientId;
                    const dateObj = record.date?.toDate();
                    if (!clientId || !dateObj) return;

                    const month = dateObj.getMonth() + 1; // 1-12

                    if (!data[clientId]) data[clientId] = {};
                    data[clientId][month] = (data[clientId][month] || 0) + 1;
                });

                setAttendanceData(data);
            } catch (err) {
                console.error('データ取得エラー:', err);
                setError('データの取得に失敗しました');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [fiscalYear, companyId]);

    // 月別合計
    const monthlyTotals = useMemo(() => {
        const totals = {};
        FISCAL_MONTHS.forEach(m => {
            totals[m] = Object.values(attendanceData).reduce((sum, clientData) => sum + (clientData[m] || 0), 0);
        });
        return totals;
    }, [attendanceData]);

    // 利用者別合計
    const clientTotals = useMemo(() => {
        const totals = {};
        clients.forEach(client => {
            const clientData = attendanceData[client.id] || {};
            totals[client.id] = FISCAL_MONTHS.reduce((sum, m) => sum + (clientData[m] || 0), 0);
        });
        return totals;
    }, [clients, attendanceData]);

    // 年度合計
    const grandTotal = useMemo(() => {
        return Object.values(monthlyTotals).reduce((sum, v) => sum + v, 0);
    }, [monthlyTotals]);

    // 利用実績のある利用者のみフィルター
    const activeClients = useMemo(() => {
        return clients.filter(client => clientTotals[client.id] > 0);
    }, [clients, clientTotals]);

    return (
        <Box sx={{ pb: 4 }}>
            {/* ヘッダー */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                <Typography variant="h4">
                    📅 利用者出席状況
                </Typography>
                <FormControl size="small" sx={{ minWidth: 120 }}>
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
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
            ) : (
                <>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {fiscalYear}年4月〜{fiscalYear + 1}年3月 | 利用者数: {activeClients.length}名 | 延べ利用者数: {grandTotal.toLocaleString()}人日
                    </Typography>

                    <Paper sx={{ overflowX: 'auto' }}>
                        <TableContainer>
                            <Table size="small" sx={{ minWidth: 800 }}>
                                <TableHead>
                                    <TableRow sx={{ bgcolor: 'rgba(255,255,255,0.05)' }}>
                                        <TableCell sx={{ fontWeight: 'bold', position: 'sticky', left: 0, bgcolor: '#1e1e1e', zIndex: 2, minWidth: 120 }}>
                                            利用者名
                                        </TableCell>
                                        {MONTH_LABELS.map((label, idx) => (
                                            <TableCell key={idx} sx={{ textAlign: 'center', fontWeight: 'bold', minWidth: 50 }}>
                                                {label}
                                            </TableCell>
                                        ))}
                                        <TableCell sx={{ textAlign: 'center', fontWeight: 'bold', borderLeft: '2px solid rgba(6, 182, 212, 0.5)', minWidth: 60 }}>
                                            合計
                                        </TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {activeClients.map(client => {
                                        const clientData = attendanceData[client.id] || {};
                                        return (
                                            <TableRow key={client.id} hover>
                                                <TableCell sx={{ position: 'sticky', left: 0, bgcolor: '#1e1e1e', zIndex: 1, fontWeight: 500 }}>
                                                    {client.name}
                                                </TableCell>
                                                {FISCAL_MONTHS.map(month => {
                                                    const value = clientData[month] || 0;
                                                    return (
                                                        <TableCell
                                                            key={month}
                                                            sx={{
                                                                textAlign: 'center',
                                                                bgcolor: value > 0 ? 'rgba(34, 197, 94, 0.3)' : 'transparent',
                                                                color: value > 0 ? '#22c55e' : '#6b7280',
                                                                fontWeight: value > 0 ? 'bold' : 'normal',
                                                            }}
                                                        >
                                                            {value > 0 ? value : '-'}
                                                        </TableCell>
                                                    );
                                                })}
                                                <TableCell sx={{ textAlign: 'center', fontWeight: 'bold', borderLeft: '2px solid rgba(6, 182, 212, 0.5)', color: '#06b6d4' }}>
                                                    {clientTotals[client.id]}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                    {/* 合計行 */}
                                    <TableRow sx={{ bgcolor: 'rgba(6, 182, 212, 0.1)' }}>
                                        <TableCell sx={{ position: 'sticky', left: 0, bgcolor: '#1a2e3e', zIndex: 1, fontWeight: 'bold' }}>
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

                    {/* データがない場合 */}
                    {activeClients.length === 0 && (
                        <Alert severity="info" sx={{ mt: 2 }}>
                            {fiscalYear}年度の出席データがありません。
                        </Alert>
                    )}
                </>
            )}
        </Box>
    );
}
