// src/pages/AttendanceRecordPrintPage.jsx
// 出席帳票印刷ページ

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
    Box, Container, Typography, Button, CircularProgress,
    FormControl, InputLabel, Select, MenuItem, Paper, Stack
} from '@mui/material';
import { Print, ArrowBack } from '@mui/icons-material';
import { collection, query, where, getDocs, doc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useReactToPrint } from 'react-to-print';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import AttendanceRecordPrintView from '../features/attendance/AttendanceRecordPrintView';

export default function AttendanceRecordPrintPage() {
    const { clientId } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const printRef = useRef(null);

    const [client, setClient] = useState(null);
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);

    // 月選択（URLパラメータまたはデフォルト）
    const currentDate = new Date();
    const defaultYear = parseInt(searchParams.get('year')) || currentDate.getFullYear();
    const defaultMonth = parseInt(searchParams.get('month')) || (currentDate.getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(defaultYear);
    const [selectedMonth, setSelectedMonth] = useState(defaultMonth);

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

    // クライアント情報を取得
    useEffect(() => {
        const fetchClient = async () => {
            if (!clientId) return;
            try {
                const docSnap = await getDoc(doc(db, 'clients', clientId));
                if (docSnap.exists()) {
                    setClient({ id: docSnap.id, ...docSnap.data() });
                }
            } catch (error) {
                console.error('クライアント情報取得エラー:', error);
            }
        };
        fetchClient();
    }, [clientId]);

    // 出席記録を取得
    useEffect(() => {
        const fetchRecords = async () => {
            if (!clientId) return;
            setLoading(true);
            try {
                const monthStart = startOfMonth(new Date(selectedYear, selectedMonth - 1));
                const monthEnd = endOfMonth(new Date(selectedYear, selectedMonth - 1));

                const q = query(
                    collection(db, 'attendanceRecords'),
                    where('clientId', '==', clientId),
                    where('date', '>=', Timestamp.fromDate(monthStart)),
                    where('date', '<=', Timestamp.fromDate(monthEnd))
                );
                const snapshot = await getDocs(q);
                const recordsData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setRecords(recordsData);
            } catch (error) {
                console.error('出席記録取得エラー:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchRecords();
    }, [clientId, selectedYear, selectedMonth]);

    // 印刷ハンドラ
    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: `出欠確認表_${client?.name || 'unknown'}_${selectedYear}年${selectedMonth}月`,
    });

    // 月変更ハンドラ
    const handleMonthChange = (e) => {
        const [year, month] = e.target.value.split('-').map(Number);
        setSelectedYear(year);
        setSelectedMonth(month);
    };

    return (
        <Container maxWidth="lg">
            <Box sx={{ py: 2 }}>
                {/* ヘッダー */}
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                    <Stack direction="row" alignItems="center" spacing={2}>
                        <Button
                            startIcon={<ArrowBack />}
                            onClick={() => navigate(-1)}
                            variant="outlined"
                            size="small"
                        >
                            戻る
                        </Button>
                        <Typography variant="h5" fontWeight="bold">
                            出欠確認表 - {client?.name || '読み込み中...'}
                        </Typography>
                    </Stack>
                    <Stack direction="row" spacing={2} alignItems="center">
                        <FormControl size="small" sx={{ minWidth: 150 }}>
                            <InputLabel>月を選択</InputLabel>
                            <Select
                                value={`${selectedYear}-${selectedMonth}`}
                                label="月を選択"
                                onChange={handleMonthChange}
                            >
                                {monthOptions.map(opt => (
                                    <MenuItem key={`${opt.year}-${opt.month}`} value={`${opt.year}-${opt.month}`}>
                                        {opt.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <Button
                            variant="contained"
                            color="primary"
                            startIcon={<Print />}
                            onClick={() => handlePrint()}
                            disabled={loading}
                        >
                            印刷
                        </Button>
                    </Stack>
                </Stack>

                {/* ローディング表示 */}
                {loading && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                        <CircularProgress />
                    </Box>
                )}

                {/* 印刷コンテンツ（常にマウント - refが常に有効になるように） */}
                <Paper sx={{ p: 2, bgcolor: '#fff', display: loading ? 'none' : 'block' }}>
                    <AttendanceRecordPrintView
                        ref={printRef}
                        clientName={client?.name || ''}
                        recipientId={client?.recipientId || ''}
                        year={selectedYear}
                        month={selectedMonth}
                        records={records}
                    />
                </Paper>
            </Box>
        </Container>
    );
}
