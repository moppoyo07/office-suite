// src/pages/AttendanceRecordPrintPage.jsx
// 出席帳票印刷ページ（window.open方式）

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
    Box, Container, Typography, Button, CircularProgress,
    FormControl, InputLabel, Select, MenuItem, Paper, Stack
} from '@mui/material';
import { Print, ArrowBack } from '@mui/icons-material';
import { collection, query, where, getDocs, doc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { startOfMonth, endOfMonth, format, getDaysInMonth, addDays, getDay } from 'date-fns';

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

// 印刷用HTML生成（1人分）
const generateAttendanceHTML = (clientName, recipientId, year, month, records) => {
    const daysInMonth = getDaysInMonth(new Date(year, month - 1));
    const firstDay = startOfMonth(new Date(year, month - 1));

    // 日別レコードマップ
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

    // テーブル行を生成
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

// 完全なHTML文書を生成
const generateFullHTML = (title, bodyContent) => `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${title}</title>
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
<body>${bodyContent}</body>
</html>`;

export default function AttendanceRecordPrintPage() {
    const { clientId } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const [client, setClient] = useState(null);
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);

    const currentDate = new Date();
    const defaultYear = parseInt(searchParams.get('year')) || currentDate.getFullYear();
    const defaultMonth = parseInt(searchParams.get('month')) || (currentDate.getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(defaultYear);
    const [selectedMonth, setSelectedMonth] = useState(defaultMonth);

    const monthOptions = [];
    for (let i = 0; i < 12; i++) {
        const d = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        monthOptions.push({
            year: d.getFullYear(),
            month: d.getMonth() + 1,
            label: format(d, 'yyyy年M月'),
        });
    }

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
                setRecords(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            } catch (error) {
                console.error('出席記録取得エラー:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchRecords();
    }, [clientId, selectedYear, selectedMonth]);

    // window.open 印刷
    const handlePrint = () => {
        const body = generateAttendanceHTML(
            client?.name || '', client?.recipientId || '',
            selectedYear, selectedMonth, records
        );
        const html = generateFullHTML(
            `出欠確認表_${client?.name || ''}_${selectedYear}年${selectedMonth}月`,
            body
        );
        const printWindow = window.open('', '_blank', 'width=900,height=700');
        if (printWindow) {
            printWindow.document.write(html);
            printWindow.document.close();
            setTimeout(() => printWindow.print(), 500);
        } else {
            alert('ポップアップがブロックされました。ブラウザの設定を確認してください。');
        }
    };

    const handleMonthChange = (e) => {
        const [year, month] = e.target.value.split('-').map(Number);
        setSelectedYear(year);
        setSelectedMonth(month);
    };

    return (
        <Container maxWidth="lg">
            <Box sx={{ py: 2 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                    <Stack direction="row" alignItems="center" spacing={2}>
                        <Button startIcon={<ArrowBack />} onClick={() => navigate(-1)} variant="outlined" size="small">
                            戻る
                        </Button>
                        <Typography variant="h5" fontWeight="bold">
                            出欠確認表 - {client?.name || '読み込み中...'}
                        </Typography>
                    </Stack>
                    <Stack direction="row" spacing={2} alignItems="center">
                        <FormControl size="small" sx={{ minWidth: 150 }}>
                            <InputLabel>月を選択</InputLabel>
                            <Select value={`${selectedYear}-${selectedMonth}`} label="月を選択" onChange={handleMonthChange}>
                                {monthOptions.map(opt => (
                                    <MenuItem key={`${opt.year}-${opt.month}`} value={`${opt.year}-${opt.month}`}>{opt.label}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <Button variant="contained" color="primary" startIcon={<Print />} onClick={handlePrint} disabled={loading}>
                            印刷
                        </Button>
                    </Stack>
                </Stack>

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <Paper sx={{ p: 2, bgcolor: '#fff', color: '#000', overflow: 'auto' }}>
                        <Typography variant="h6" align="center" sx={{ fontWeight: 'bold', mb: 2, color: '#000' }}>
                            出欠確認表
                        </Typography>
                        <Typography sx={{ mb: 1, color: '#000' }}>
                            {selectedYear}年{selectedMonth}月分 ／ {client?.name} ／ 受給者証: {client?.recipientId || '未登録'}
                        </Typography>
                        <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem',
                            '& td, & th': { border: '1px solid #ccc', p: 0.5, textAlign: 'center' },
                            '& th': { bgcolor: '#f5f5f5', fontWeight: 'bold' }
                        }}>
                            <thead>
                                <tr><th>日</th><th>曜</th><th>出欠</th><th>開始</th><th>終了</th><th>加算等</th></tr>
                            </thead>
                            <tbody>
                                {(() => {
                                    const daysInMonth = getDaysInMonth(new Date(selectedYear, selectedMonth - 1));
                                    const firstDay = startOfMonth(new Date(selectedYear, selectedMonth - 1));
                                    const recordsByDay = new Map();
                                    records.forEach(r => {
                                        if (r.date) {
                                            const d = r.date.toDate ? r.date.toDate() : new Date(r.date);
                                            recordsByDay.set(d.getDate(), r);
                                        }
                                    });
                                    return Array.from({ length: daysInMonth }, (_, i) => {
                                        const dayNum = i + 1;
                                        const date = addDays(firstDay, i);
                                        const dow = getDay(date);
                                        const rec = recordsByDay.get(dayNum);
                                        return (
                                            <tr key={dayNum} style={{ background: dow === 0 || dow === 6 ? '#fafafa' : undefined }}>
                                                <td>{dayNum}</td>
                                                <td style={{ color: dow === 0 ? '#dc2626' : dow === 6 ? '#2563eb' : undefined }}>{DAY_LABELS[dow]}</td>
                                                <td>{rec?.status === 'present' ? '○' : rec?.status === 'absent' ? '×' : ''}</td>
                                                <td>{rec?.status === 'present' ? rec.startTime || '' : ''}</td>
                                                <td>{rec?.status === 'present' ? rec.endTime || '' : ''}</td>
                                                <td style={{ textAlign: 'left' }}>{rec?.status === 'present' ? getAdditions(rec) : ''}</td>
                                            </tr>
                                        );
                                    });
                                })()}
                            </tbody>
                        </Box>
                    </Paper>
                )}
            </Box>
        </Container>
    );
}
