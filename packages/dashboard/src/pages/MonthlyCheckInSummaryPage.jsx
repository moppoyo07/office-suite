// src/pages/MonthlyCheckInSummaryPage.jsx
// 月間チェックインサマリーページ

import { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Grid, CircularProgress, Alert,
    FormControl, InputLabel, Select, MenuItem, Chip, Card, CardContent
} from '@mui/material';
import { collection, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    AreaChart, Area, BarChart, Bar, Cell, ReferenceLine
} from 'recharts';

// 色定義
const COLORS = {
    primary: '#06b6d4',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    purple: '#8b5cf6',
    gray: '#94a3b8',
};

// 服薬状態の色
const MEDICATION_COLORS = {
    taken: '#10b981',       // 緑
    not_taken: '#ef4444',   // 赤
    not_prescribed: '#4a5568', // グレー
};

export default function MonthlyCheckInSummaryPage() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [clients, setClients] = useState([]);
    const [selectedClientId, setSelectedClientId] = useState('');
    const [monthlyData, setMonthlyData] = useState([]);
    const [summary, setSummary] = useState(null);

    // 今月の範囲を取得
    const getMonthRange = () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        return { start, end, year: now.getFullYear(), month: now.getMonth() + 1 };
    };

    // 利用者一覧を取得
    useEffect(() => {
        const fetchClients = async () => {
            try {
                const snapshot = await getDocs(collection(db, 'clients'));
                const clientList = snapshot.docs
                    .map(doc => ({ id: doc.id, ...doc.data() }))
                    .filter(c => c.status === 'active_onsite' || c.status === 'active_remote')
                    .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ja'));
                setClients(clientList);
                if (clientList.length > 0) {
                    setSelectedClientId(clientList[0].id);
                }
            } catch (err) {
                console.error('利用者取得エラー:', err);
                setError('利用者の取得に失敗しました');
            }
        };
        fetchClients();
    }, []);

    // 選択された利用者の月間データを取得
    useEffect(() => {
        if (!selectedClientId) return;

        const fetchMonthlyData = async () => {
            setLoading(true);
            setError(null);
            try {
                const { year: currentYear, month: currentMonth } = getMonthRange();

                // dailyCheckinsから選択された利用者のデータを取得（orderByを削除してインデックス問題を回避）
                const q = query(
                    collection(db, 'dailyCheckins'),
                    where('clientId', '==', selectedClientId)
                );
                const snapshot = await getDocs(q);

                console.log('=== 月間サマリーデバッグ ===');
                console.log('選択された利用者ID:', selectedClientId);
                console.log('取得したドキュメント数:', snapshot.size);

                // 今月のデータのみフィルタリングし、ローカルでソート
                const data = snapshot.docs
                    .map(doc => {
                        const docData = doc.data();
                        console.log('ドキュメント:', doc.id, docData);
                        return { id: doc.id, ...docData };
                    })
                    .filter(record => {
                        const dateStr = record.date;
                        if (!dateStr) {
                            console.log('日付なしレコード:', record.id);
                            return false;
                        }
                        // 日付が文字列形式（'2026-01-29'）でない場合の対応
                        let year, month;
                        if (typeof dateStr === 'string') {
                            [year, month] = dateStr.split('-').map(Number);
                        } else {
                            console.log('日付がstring形式ではない:', dateStr);
                            return false;
                        }
                        const isMatch = year === currentYear && month === currentMonth;
                        console.log(`日付チェック: ${dateStr} -> year=${year}, month=${month}, isMatch=${isMatch}`);
                        return isMatch;
                    })
                    .map(record => ({
                        ...record,
                        day: parseInt(record.date?.split('-')[2] || '0'),
                    }))
                    .sort((a, b) => a.day - b.day); // ローカルでソート

                console.log('フィルタ後のデータ:', data);
                setMonthlyData(data);

                // サマリー計算
                const totalDays = data.length;
                const onsiteDays = data.filter(d => d.attendanceType === 'onsite').length;
                const remoteDays = data.filter(d => d.attendanceType === 'remote').length;

                // 体温データ
                const temperatures = data
                    .filter(d => d.temperature)
                    .map(d => ({
                        day: d.day,
                        temp: parseFloat(d.temperature),
                        high: parseFloat(d.temperature) >= 37.5,
                    }));

                // 服薬データ
                const medicationStats = {
                    morning: { taken: 0, not_taken: 0, not_prescribed: 0 },
                    noon: { taken: 0, not_taken: 0, not_prescribed: 0 },
                    evening: { taken: 0, not_taken: 0, not_prescribed: 0 },
                    bedtime: { taken: 0, not_taken: 0, not_prescribed: 0 },
                };
                data.forEach(d => {
                    if (d.medication) {
                        ['morning', 'noon', 'evening', 'bedtime'].forEach(time => {
                            const status = d.medication[time] || 'not_prescribed';
                            medicationStats[time][status]++;
                        });
                    }
                });

                // 睡眠データ
                const sleepData = data
                    .filter(d => d.sleep?.quality)
                    .map(d => ({
                        day: d.day,
                        quality: d.sleep.quality,
                    }));

                // 気分データ
                const moodData = data
                    .filter(d => d.mood?.level)
                    .map(d => ({
                        day: d.day,
                        level: d.mood.level,
                    }));

                // 活動集計
                const activityCounts = {};
                data.forEach(d => {
                    const activities = [...(d.activities?.am || []), ...(d.activities?.pm || [])];
                    activities.forEach(act => {
                        activityCounts[act] = (activityCounts[act] || 0) + 1;
                    });
                });
                const topActivities = Object.entries(activityCounts)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
                    .map(([name, count]) => ({ name, count }));

                // 疲労度
                const fatigueData = data
                    .filter(d => d.fatigue)
                    .map(d => ({
                        day: d.day,
                        fatigue: d.fatigue,
                    }));

                setSummary({
                    totalDays,
                    onsiteDays,
                    remoteDays,
                    temperatures,
                    medicationStats,
                    sleepData,
                    moodData,
                    topActivities,
                    fatigueData,
                });
            } catch (err) {
                console.error('月間データ取得エラー:', err);
                setError('月間データの取得に失敗しました');
            } finally {
                setLoading(false);
            }
        };

        fetchMonthlyData();
    }, [selectedClientId]);

    const { year, month } = getMonthRange();
    const selectedClient = clients.find(c => c.id === selectedClientId);

    return (
        <Box sx={{ pb: 4 }}>
            {/* ヘッダー */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                <Typography variant="h4">
                    📊 月間チェックインサマリー ({year}年{month}月)
                </Typography>
                <FormControl size="small" sx={{ minWidth: 200 }}>
                    <InputLabel>利用者を選択</InputLabel>
                    <Select
                        value={selectedClientId}
                        label="利用者を選択"
                        onChange={(e) => setSelectedClientId(e.target.value)}
                    >
                        {clients.map(client => (
                            <MenuItem key={client.id} value={client.id}>{client.name}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
            ) : !summary ? (
                <Alert severity="info">今月のチェックインデータがありません。</Alert>
            ) : (
                <Grid container spacing={3}>
                    {/* 概要カード */}
                    <Grid size={{ xs: 12 }}>
                        <Paper sx={{ p: 2, display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'center' }}>
                            <Typography variant="h6" sx={{ mr: 2 }}>{selectedClient?.name}</Typography>
                            <Chip label={`出席 ${summary.totalDays} 日`} color="primary" />
                            <Chip label={`通所 ${summary.onsiteDays} 日`} sx={{ bgcolor: 'rgba(16, 185, 129, 0.2)', color: '#10b981' }} />
                            <Chip label={`在宅 ${summary.remoteDays} 日`} sx={{ bgcolor: 'rgba(139, 92, 246, 0.2)', color: '#8b5cf6' }} />
                        </Paper>
                    </Grid>

                    {/* 体温グラフ */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Paper sx={{ p: 2, height: 280 }}>
                            <Typography variant="subtitle2" sx={{ mb: 1, color: COLORS.primary }}>🌡️ 体温推移</Typography>
                            {summary.temperatures.length === 0 ? (
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: 'text.secondary' }}>データなし</Box>
                            ) : (
                                <ResponsiveContainer width="100%" height={220}>
                                    <LineChart data={summary.temperatures}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                        <XAxis dataKey="day" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                        <YAxis domain={[35, 39]} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                        <Tooltip contentStyle={{ backgroundColor: '#1e1e1e', border: '1px solid #333' }} />
                                        <ReferenceLine y={37.5} stroke={COLORS.danger} strokeDasharray="3 3" />
                                        <Line
                                            type="monotone"
                                            dataKey="temp"
                                            stroke={COLORS.primary}
                                            strokeWidth={2}
                                            dot={({ cx, cy, payload }) => (
                                                <circle cx={cx} cy={cy} r={4} fill={payload.high ? COLORS.danger : COLORS.primary} />
                                            )}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            )}
                        </Paper>
                    </Grid>

                    {/* 気分推移グラフ */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Paper sx={{ p: 2, height: 280 }}>
                            <Typography variant="subtitle2" sx={{ mb: 1, color: COLORS.purple }}>😊 気分推移</Typography>
                            {summary.moodData.length === 0 ? (
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: 'text.secondary' }}>データなし</Box>
                            ) : (
                                <ResponsiveContainer width="100%" height={220}>
                                    <AreaChart data={summary.moodData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                        <XAxis dataKey="day" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                        <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                        <Tooltip contentStyle={{ backgroundColor: '#1e1e1e', border: '1px solid #333' }} />
                                        <Area type="monotone" dataKey="level" stroke={COLORS.purple} fill={COLORS.purple} fillOpacity={0.3} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            )}
                        </Paper>
                    </Grid>

                    {/* 睡眠の質グラフ */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Paper sx={{ p: 2, height: 280 }}>
                            <Typography variant="subtitle2" sx={{ mb: 1, color: COLORS.success }}>😴 睡眠の質</Typography>
                            {summary.sleepData.length === 0 ? (
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: 'text.secondary' }}>データなし</Box>
                            ) : (
                                <ResponsiveContainer width="100%" height={220}>
                                    <AreaChart data={summary.sleepData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                        <XAxis dataKey="day" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                        <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                        <Tooltip contentStyle={{ backgroundColor: '#1e1e1e', border: '1px solid #333' }} />
                                        <Area type="monotone" dataKey="quality" stroke={COLORS.success} fill={COLORS.success} fillOpacity={0.3} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            )}
                        </Paper>
                    </Grid>

                    {/* 疲労度グラフ */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Paper sx={{ p: 2, height: 280 }}>
                            <Typography variant="subtitle2" sx={{ mb: 1, color: COLORS.warning }}>😓 疲労度（退所時）</Typography>
                            {summary.fatigueData.length === 0 ? (
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: 'text.secondary' }}>データなし</Box>
                            ) : (
                                <ResponsiveContainer width="100%" height={220}>
                                    <AreaChart data={summary.fatigueData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                        <XAxis dataKey="day" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                        <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                        <Tooltip contentStyle={{ backgroundColor: '#1e1e1e', border: '1px solid #333' }} />
                                        <Area type="monotone" dataKey="fatigue" stroke={COLORS.warning} fill={COLORS.warning} fillOpacity={0.3} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            )}
                        </Paper>
                    </Grid>

                    {/* 活動TOP5 */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Paper sx={{ p: 2, height: 280 }}>
                            <Typography variant="subtitle2" sx={{ mb: 1, color: COLORS.primary }}>📋 活動TOP5</Typography>
                            {summary.topActivities.length === 0 ? (
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: 'text.secondary' }}>データなし</Box>
                            ) : (
                                <ResponsiveContainer width="100%" height={220}>
                                    <BarChart data={summary.topActivities} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                        <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                        <YAxis dataKey="name" type="category" tick={{ fill: '#94a3b8', fontSize: 12 }} width={80} />
                                        <Tooltip contentStyle={{ backgroundColor: '#1e1e1e', border: '1px solid #333' }} />
                                        <Bar dataKey="count" fill={COLORS.primary} radius={[0, 4, 4, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </Paper>
                    </Grid>

                    {/* 服薬状況 */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Paper sx={{ p: 2, height: 280 }}>
                            <Typography variant="subtitle2" sx={{ mb: 2, color: COLORS.primary }}>💊 服薬状況</Typography>
                            <Grid container spacing={1}>
                                {['morning', 'noon', 'evening', 'bedtime'].map(time => {
                                    const stats = summary.medicationStats[time];
                                    const total = stats.taken + stats.not_taken + stats.not_prescribed;
                                    const takenRate = total > 0 ? Math.round((stats.taken / total) * 100) : 0;
                                    const label = { morning: '朝', noon: '昼', evening: '夜', bedtime: '就寝前' }[time];
                                    return (
                                        <Grid size={{ xs: 6, sm: 3 }} key={time}>
                                            <Card sx={{ bgcolor: 'rgba(30, 41, 59, 0.5)', textAlign: 'center' }}>
                                                <CardContent sx={{ py: 1.5 }}>
                                                    <Typography variant="caption" color="text.secondary">{label}</Typography>
                                                    <Typography variant="h5" sx={{ color: takenRate >= 80 ? COLORS.success : takenRate >= 50 ? COLORS.warning : COLORS.danger }}>
                                                        {takenRate}%
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {stats.taken}/{stats.taken + stats.not_taken}
                                                    </Typography>
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                    );
                                })}
                            </Grid>
                        </Paper>
                    </Grid>
                </Grid>
            )}
        </Box>
    );
}
