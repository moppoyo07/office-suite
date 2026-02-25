// src/pages/ReflectionLogPage.jsx
// 振り返りログ一覧ページ

import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    TextField,
    CircularProgress,
    Alert,
    InputAdornment,
    Chip,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import SearchIcon from '@mui/icons-material/Search';
import ForumIcon from '@mui/icons-material/Forum';
import { collection, query, where, getDocs, Timestamp, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { format, startOfDay, endOfDay, subDays } from 'date-fns';
import ja from 'date-fns/locale/ja';

export default function ReflectionLogPage() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [searchName, setSearchName] = useState('');

    // データ取得（名前検索時は過去30日、日付指定時は当日のみ）
    useEffect(() => {
        const fetchLogs = async () => {
            setLoading(true);
            setError(null);

            try {
                let q;

                if (searchName.trim()) {
                    // 名前検索時：過去30日分を取得
                    const start = subDays(new Date(), 30);
                    start.setHours(0, 0, 0, 0);
                    const end = new Date();
                    end.setHours(23, 59, 59, 999);

                    q = query(
                        collection(db, 'dailyCheckins'),
                        where('createdAt', '>=', Timestamp.fromDate(start)),
                        where('createdAt', '<=', Timestamp.fromDate(end))
                    );
                } else {
                    // 日付指定時：選択日のみ
                    const dayStart = startOfDay(selectedDate);
                    const dayEnd = endOfDay(selectedDate);

                    q = query(
                        collection(db, 'dailyCheckins'),
                        where('createdAt', '>=', Timestamp.fromDate(dayStart)),
                        where('createdAt', '<=', Timestamp.fromDate(dayEnd))
                    );
                }

                const snapshot = await getDocs(q);
                let data = snapshot.docs
                    .map(doc => {
                        const d = doc.data();
                        return {
                            id: doc.id,
                            clientId: d.clientId,
                            clientName: d.clientName || '不明',
                            date: d.createdAt?.toDate() || new Date(),
                            reflection: d.reflection || '',
                        };
                    })
                    .filter(item => item.reflection) // 振り返りがあるものだけ
                    .sort((a, b) => b.date - a.date); // 新しい順

                // 名前検索時はフィルタリング
                if (searchName.trim()) {
                    data = data.filter(log =>
                        log.clientName.toLowerCase().includes(searchName.toLowerCase())
                    );
                }

                setLogs(data);
            } catch (err) {
                console.error('データ取得エラー:', err);
                setError('データの取得に失敗しました');
            } finally {
                setLoading(false);
            }
        };

        fetchLogs();
    }, [selectedDate, searchName]);

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ja}>
            <Box sx={{ p: 2, maxWidth: 900, mx: 'auto' }}>
                {/* ヘッダー */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                    <ForumIcon sx={{ color: '#8b5cf6', fontSize: 28 }} />
                    <Typography variant="h5" sx={{ color: '#fff', fontWeight: 'bold' }}>
                        振り返りログ
                    </Typography>
                </Box>

                {/* フィルター */}
                <Paper sx={{ p: 2, mb: 3, bgcolor: '#1e1e2e' }}>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        <DatePicker
                            label="日付"
                            value={selectedDate}
                            onChange={(date) => date && setSelectedDate(date)}
                            format="yyyy/MM/dd (E)"
                            slotProps={{
                                textField: {
                                    size: 'small',
                                    sx: {
                                        minWidth: 180,
                                        '& .MuiOutlinedInput-root': { color: '#fff' },
                                        '& .MuiInputLabel-root': { color: '#94a3b8' },
                                    }
                                }
                            }}
                        />
                        <TextField
                            placeholder="利用者名で検索..."
                            size="small"
                            value={searchName}
                            onChange={(e) => setSearchName(e.target.value)}
                            slotProps={{
                                input: {
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon sx={{ color: '#94a3b8' }} />
                                        </InputAdornment>
                                    ),
                                }
                            }}
                            sx={{
                                minWidth: 200,
                                '& .MuiOutlinedInput-root': { color: '#fff' },
                            }}
                        />
                        <Chip
                            label={`${logs.length}件`}
                            sx={{ bgcolor: 'rgba(139, 92, 246, 0.2)', color: '#a78bfa', alignSelf: 'center' }}
                        />
                        {searchName.trim() && (
                            <Typography variant="caption" sx={{ color: '#94a3b8', alignSelf: 'center' }}>
                                ※過去30日間から検索
                            </Typography>
                        )}
                    </Box>
                </Paper>

                {/* コンテンツ */}
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : error ? (
                    <Alert severity="error">{error}</Alert>
                ) : logs.length === 0 ? (
                    <Paper sx={{ p: 4, textAlign: 'center', bgcolor: '#1e1e2e' }}>
                        <Typography color="#94a3b8">
                            {searchName ? '該当する振り返りがありません' : 'この日の振り返りはありません'}
                        </Typography>
                    </Paper>
                ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {logs.map(log => (
                            <Paper
                                key={log.id}
                                sx={{
                                    p: 2,
                                    bgcolor: '#1e1e2e',
                                    borderLeft: '4px solid #8b5cf6',
                                }}
                            >
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                    <Typography variant="subtitle1" sx={{ color: '#fff', fontWeight: 'bold' }}>
                                        {log.clientName}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                                        {format(log.date, 'M/d(E)', { locale: ja })}
                                    </Typography>
                                </Box>
                                <Typography
                                    sx={{
                                        color: '#e2e8f0',
                                        whiteSpace: 'pre-wrap',
                                        lineHeight: 1.7,
                                    }}
                                >
                                    {log.reflection}
                                </Typography>
                            </Paper>
                        ))}
                    </Box>
                )}
            </Box>
        </LocalizationProvider>
    );
}
