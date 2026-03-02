// src/pages/BatchAttendancePrintPage.jsx
// 一括出席帳票印刷ページ

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
    Box, Container, Typography, Button, CircularProgress,
    Stack, Alert
} from '@mui/material';
import { Print, ArrowBack } from '@mui/icons-material';
import { collection, query, where, getDocs, Timestamp, or } from 'firebase/firestore';
import { db } from '../firebase';
import { useReactToPrint } from 'react-to-print';
import { startOfMonth, endOfMonth } from 'date-fns';
import AttendanceRecordPrintView from '../features/attendance/AttendanceRecordPrintView';
import { CLIENT_STATUS } from '../constants/clientStatus';

export default function BatchAttendancePrintPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const printRef = useRef(null);

    const year = parseInt(searchParams.get('year'));
    const month = parseInt(searchParams.get('month'));
    const type = searchParams.get('type'); // 'onsite' or 'remote'

    const [clients, setClients] = useState([]);
    const [recordsByClient, setRecordsByClient] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!year || !month || !type) return;
            setLoading(true);
            try {
                // 1. 対象月の全出席記録を取得
                const monthStart = startOfMonth(new Date(year, month - 1));
                const monthEnd = endOfMonth(new Date(year, month - 1));

                const recordsQuery = query(
                    collection(db, 'attendanceRecords'),
                    where('date', '>=', Timestamp.fromDate(monthStart)),
                    where('date', '<=', Timestamp.fromDate(monthEnd))
                );

                const recordsSnap = await getDocs(recordsQuery);
                const recordsMap = {};
                const activeClientIds = new Set();

                recordsSnap.docs.forEach(doc => {
                    const data = doc.data();
                    if (!recordsMap[data.clientId]) {
                        recordsMap[data.clientId] = [];
                    }
                    recordsMap[data.clientId].push({
                        id: doc.id,
                        ...data
                    });
                    activeClientIds.add(data.clientId);
                });

                if (activeClientIds.size === 0) {
                    setClients([]);
                    setLoading(false);
                    return;
                }

                // 2. クライアント情報を取得
                const clientsQuery = query(collection(db, 'clients'));
                const clientsSnap = await getDocs(clientsQuery);

                const clientsData = [];

                clientsSnap.docs.forEach(doc => {
                    const client = { id: doc.id, ...doc.data() };

                    if (activeClientIds.has(client.id)) {
                        const records = recordsMap[client.id] || [];
                        const hasOnsite = records.some(r => r.attendanceType === 'onsite');
                        const hasRemote = records.some(r => r.attendanceType === 'remote');

                        let isMatch = false;
                        if (type === 'onsite') {
                            if (client.status === CLIENT_STATUS.ACTIVE_ONSITE) {
                                isMatch = true;
                            } else if (hasOnsite) {
                                isMatch = true;
                            }
                        } else {
                            if (client.status === CLIENT_STATUS.ACTIVE_REMOTE) {
                                isMatch = true;
                            } else if (hasRemote) {
                                isMatch = true;
                            }
                        }

                        if (isMatch) {
                            clientsData.push(client);
                        }
                    }
                });

                // 名前順にソート
                clientsData.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ja'));

                setClients(clientsData);
                setRecordsByClient(recordsMap);

            } catch (error) {
                console.error('データ取得エラー:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [year, month, type]);

    // 印刷ハンドラ
    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: `一括出欠確認表_${type === 'onsite' ? '施設内' : '施設外'}_${year}年${month}月`,
    });

    if (!year || !month || !type) {
        return <Container><Alert severity="error">パラメータが不正です</Alert></Container>;
    }

    const typeLabel = type === 'onsite' ? '施設内' : '施設外';

    return (
        <Container maxWidth="lg">
            <Box sx={{ py: 2 }}>
                {/* ヘッダー (印刷時は非表示) */}
                <Box sx={{ '@media print': { display: 'none' } }}>
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
                                {typeLabel} 一括印刷プレビュー ({clients.length}名)
                            </Typography>
                        </Stack>
                        <Button
                            variant="contained"
                            color="success"
                            size="large"
                            startIcon={<Print />}
                            onClick={() => handlePrint()}
                            disabled={loading || clients.length === 0}
                        >
                            一括印刷
                        </Button>
                    </Stack>
                </Box>

                {/* ローディング表示 */}
                {loading && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                        <CircularProgress />
                    </Box>
                )}

                {/* 印刷エリア（常にマウント - refが常に有効になるように） */}
                <Box
                    ref={printRef}
                    sx={{
                        bgcolor: '#fff',
                        p: 0,
                        display: loading ? 'none' : 'block',
                        '@media screen': {
                            bgcolor: '#f5f5f5',
                            p: 2,
                            display: loading ? 'none' : 'flex',
                            flexDirection: 'column',
                            gap: 4,
                            maxHeight: '80vh',
                            overflow: 'auto'
                        }
                    }}
                >
                    {clients.map((client, index) => (
                        <Box
                            key={client.id}
                            sx={{
                                '@media screen': {
                                    bgcolor: '#fff',
                                    boxShadow: 1,
                                    p: 2,
                                },
                                pageBreakAfter: 'always',
                                breakAfter: 'page',
                                '&:last-child': {
                                    pageBreakAfter: 'auto',
                                    breakAfter: 'auto'
                                }
                            }}
                        >
                            <AttendanceRecordPrintView
                                clientName={client.name}
                                recipientId={client.recipientId}
                                year={year}
                                month={month}
                                records={recordsByClient[client.id] || []}
                            />
                        </Box>
                    ))}

                    {!loading && clients.length === 0 && (
                        <Box sx={{ p: 4, textAlign: 'center' }}>
                            <Typography>対象の利用者がいません</Typography>
                        </Box>
                    )}
                </Box>
            </Box>
        </Container>
    );
}
