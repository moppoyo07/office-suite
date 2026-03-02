// src/pages/BatchAttendancePrintPage.jsx
// 一括出席帳票印刷ページ（window.open方式）

import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
    Box, Container, Typography, Button, CircularProgress,
    Stack, Alert, Paper
} from '@mui/material';
import { Print, ArrowBack } from '@mui/icons-material';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { startOfMonth, endOfMonth, getDaysInMonth, addDays, getDay } from 'date-fns';
import { CLIENT_STATUS } from '../constants/clientStatus';

// 曜日ラベル
const DAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'];

// 加算項目
const getAdditions = (record) => {
    if (!record) return '-';
    const additions = [];
    if (record.attendanceType === 'remote') additions.push('在宅');
    if (record.serviceDetails?.mealSupport) additions.push('食事');
    if (record.serviceDetails?.transportGoing) additions.push('送迎往');
    if (record.serviceDetails?.transportReturning) additions.push('送迎復');
    if (record.serviceDetails?.homeVisit) additions.push('訪問');
    return additions.length > 0 ? additions.join('・') : '-';
};

// 1人分の出欠確認表HTMLを生成
const generateOneClientHTML = (clientName, recipientId, year, month, records) => {
    const daysInMonth = getDaysInMonth(new Date(year, month - 1));
    const firstDay = startOfMonth(new Date(year, month - 1));

    const recordsByDay = new Map();
    if (Array.isArray(records)) {
        records.forEach(record => {
            if (record.date) {
                const date = record.date.toDate ? record.date.toDate() : new Date(record.date);
                recordsByDay.set(date.getDate(), record);
            }
        });
    }

    let attendanceCount = 0;
    recordsByDay.forEach(r => { if (r.status === 'present') attendanceCount++; });

    let tableRows = '';
    for (let i = 0; i < daysInMonth; i++) {
        const dayNum = i + 1;
        const date = addDays(firstDay, i);
        const dayOfWeek = getDay(date);
        const record = recordsByDay.get(dayNum);
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const dayColor = dayOfWeek === 0 ? 'color:#dc2626;' : dayOfWeek === 6 ? 'color:#2563eb;' : '';
        const rowBg = isWeekend ? 'background-color:#fafafa;' : '';

        const status = record?.status === 'present' ? '○' : record?.status === 'absent' ? '×' : '';
        const startTime = record?.status === 'present' ? (record.startTime || '') : '';
        const endTime = record?.status === 'present' ? (record.endTime || '') : '';
        const additions = record?.status === 'present' ? getAdditions(record) : '';

        tableRows += `<tr style="${rowBg}">
            <td style="width:8%;text-align:center;">${dayNum}</td>
            <td style="width:8%;text-align:center;${dayColor}">${DAY_LABELS[dayOfWeek]}</td>
            <td style="width:8%;text-align:center;">${status}</td>
            <td style="width:12%;text-align:center;">${startTime}</td>
            <td style="width:12%;text-align:center;">${endTime}</td>
            <td style="width:20%;text-align:left;padding-left:3mm;">${additions}</td>
            <td style="width:24%;"></td>
        </tr>`;
    }

    return `
        <div style="margin-bottom:5mm;">
            <h1 style="font-size:16pt;font-weight:bold;text-align:center;margin:0 0 5mm 0;">出欠確認表</h1>
            <div style="display:flex;justify-content:space-between;margin-bottom:2mm;">
                <div style="font-size:12pt;font-weight:bold;">${year}年${month}月分</div>
                <div><span style="font-size:9pt;color:#333;">利用者氏名：</span><span style="font-weight:bold;border-bottom:1px solid #000;min-width:30mm;padding:0 2mm;">${clientName}</span></div>
            </div>
            <div style="display:flex;justify-content:space-between;margin-bottom:2mm;">
                <div><span style="font-size:9pt;color:#333;">受給者証番号：</span><span style="font-weight:bold;border-bottom:1px solid #000;min-width:30mm;padding:0 2mm;">${recipientId || '未登録'}</span></div>
                <div><span style="font-size:9pt;color:#333;">出席日数：</span><span style="font-weight:bold;text-align:center;">${attendanceCount}日</span></div>
            </div>
        </div>
        <table>
            <thead>
                <tr>
                    <th style="width:8%;">日付</th>
                    <th style="width:8%;">曜日</th>
                    <th style="width:8%;">出欠</th>
                    <th style="width:12%;">開始時刻</th>
                    <th style="width:12%;">終了時刻</th>
                    <th style="width:20%;">加算等</th>
                    <th style="width:24%;">備考</th>
                </tr>
            </thead>
            <tbody>${tableRows}</tbody>
        </table>
        <div style="display:flex;justify-content:flex-end;gap:10mm;margin-top:8mm;">
            <div style="text-align:center;">
                <div style="font-size:8pt;margin-bottom:2mm;">利用者確認印</div>
                <div style="width:25mm;height:20mm;border:1px solid #000;"></div>
            </div>
            <div style="text-align:center;">
                <div style="font-size:8pt;margin-bottom:2mm;">事業所確認印</div>
                <div style="width:25mm;height:20mm;border:1px solid #000;"></div>
            </div>
        </div>`;
};

export default function BatchAttendancePrintPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const year = parseInt(searchParams.get('year'));
    const month = parseInt(searchParams.get('month'));
    const type = searchParams.get('type');

    const [clients, setClients] = useState([]);
    const [recordsByClient, setRecordsByClient] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!year || !month || !type) return;
            setLoading(true);
            try {
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
                    if (!recordsMap[data.clientId]) recordsMap[data.clientId] = [];
                    recordsMap[data.clientId].push({ id: doc.id, ...data });
                    activeClientIds.add(data.clientId);
                });

                if (activeClientIds.size === 0) {
                    setClients([]);
                    setLoading(false);
                    return;
                }

                const clientsSnap = await getDocs(query(collection(db, 'clients')));
                const clientsData = [];

                clientsSnap.docs.forEach(doc => {
                    const client = { id: doc.id, ...doc.data() };
                    if (activeClientIds.has(client.id)) {
                        const records = recordsMap[client.id] || [];
                        const hasOnsite = records.some(r => r.attendanceType === 'onsite');
                        const hasRemote = records.some(r => r.attendanceType === 'remote');

                        let isMatch = false;
                        if (type === 'onsite') {
                            isMatch = client.status === CLIENT_STATUS.ACTIVE_ONSITE || hasOnsite;
                        } else {
                            isMatch = client.status === CLIENT_STATUS.ACTIVE_REMOTE || hasRemote;
                        }
                        if (isMatch) clientsData.push(client);
                    }
                });

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

    // window.open 一括印刷
    const handlePrint = () => {
        const pages = clients.map((client, index) => {
            const pageBreak = index > 0 ? '<div class="page-break"></div>' : '';
            return pageBreak + generateOneClientHTML(
                client.name, client.recipientId, year, month,
                recordsByClient[client.id] || []
            );
        }).join('');

        const html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>一括出欠確認表_${type === 'onsite' ? '施設内' : '施設外'}_${year}年${month}月</title>
    <style>
        @page { size: A4 portrait; margin: 5mm; }
        body {
            font-family: 'Hiragino Kaku Gothic ProN', 'Yu Gothic', 'Meiryo', sans-serif;
            font-size: 10pt;
            color: #000;
            background: #fff;
            margin: 0;
            padding: 8mm 8mm 8mm 12mm;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }
        table { width: 100%; border-collapse: collapse; font-size: 9pt; }
        td, th { border: 1px solid #000; padding: 1.5mm 2mm; text-align: center; vertical-align: middle; }
        th { background-color: #f0f0f0; font-weight: bold; font-size: 8pt; }
        .page-break { page-break-before: always; }
    </style>
</head>
<body>${pages}</body>
</html>`;

        const printWindow = window.open('', '_blank', 'width=900,height=700');
        if (printWindow) {
            printWindow.document.write(html);
            printWindow.document.close();
            setTimeout(() => printWindow.print(), 500);
        } else {
            alert('ポップアップがブロックされました。ブラウザの設定を確認してください。');
        }
    };

    if (!year || !month || !type) {
        return <Container><Alert severity="error">パラメータが不正です</Alert></Container>;
    }

    const typeLabel = type === 'onsite' ? '施設内' : '施設外';

    return (
        <Container maxWidth="lg">
            <Box sx={{ py: 2 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                    <Stack direction="row" alignItems="center" spacing={2}>
                        <Button startIcon={<ArrowBack />} onClick={() => navigate(-1)} variant="outlined" size="small">
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
                        onClick={handlePrint}
                        disabled={loading || clients.length === 0}
                    >
                        一括印刷
                    </Button>
                </Stack>

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                        <CircularProgress />
                    </Box>
                ) : clients.length === 0 ? (
                    <Paper sx={{ p: 4, textAlign: 'center' }}>
                        <Typography>対象の利用者がいません</Typography>
                    </Paper>
                ) : (
                    <Stack spacing={2}>
                        {clients.map(client => (
                            <Paper key={client.id} sx={{ p: 2, bgcolor: '#fff', color: '#000' }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#000' }}>
                                    {client.name} - {(recordsByClient[client.id] || []).filter(r => r.status === 'present').length}日出席
                                </Typography>
                            </Paper>
                        ))}
                    </Stack>
                )}
            </Box>
        </Container>
    );
}
