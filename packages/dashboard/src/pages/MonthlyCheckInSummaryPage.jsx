// src/pages/MonthlyCheckInSummaryPage.jsx
// 月間チェックインサマリーページ

import { useState, useEffect, useRef } from 'react';
import {
    Box, Typography, Paper, Grid, CircularProgress, Alert,
    FormControl, InputLabel, Select, MenuItem, Chip, Card, CardContent,
    IconButton, Button, ListSubheader
} from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import PrintIcon from '@mui/icons-material/Print';
import { collection, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    AreaChart, Area, BarChart, Bar, Cell, ReferenceLine
} from 'recharts';
import { useReactToPrint } from 'react-to-print';

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

// ステータスラベル
const STATUS_LABELS = {
    active_onsite: '通所中',
    active_remote: '在宅中',
    graduated: '就職済み',
    dropped: '退所済み',
    suspended: '休止中',
};

export default function MonthlyCheckInSummaryPage() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [clients, setClients] = useState([]);
    const [selectedClientId, setSelectedClientId] = useState('');
    const [monthlyData, setMonthlyData] = useState([]);
    const [summary, setSummary] = useState(null);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const printRef = useRef(null);

    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth() + 1;

    // 月の切り替え
    const handlePrevMonth = () => {
        setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    };
    const handleNextMonth = () => {
        setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    };

    // 印刷実行
    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: `月間サマリー_${selectedClient?.name || ''}_${year}年${month}月`,
    });

    // 利用者一覧を取得（退所者・就職者も含む）
    useEffect(() => {
        const fetchClients = async () => {
            try {
                const snapshot = await getDocs(collection(db, 'clients'));
                const clientList = snapshot.docs
                    .map(doc => ({ id: doc.id, ...doc.data() }))
                    .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ja'));
                setClients(clientList);
                // アクティブな利用者を優先的に選択
                const activeClient = clientList.find(c => c.status === 'active_onsite' || c.status === 'active_remote');
                if (activeClient) {
                    setSelectedClientId(activeClient.id);
                } else if (clientList.length > 0) {
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
                // dailyCheckinsから選択された利用者のデータを取得
                const q = query(
                    collection(db, 'dailyCheckins'),
                    where('clientId', '==', selectedClientId)
                );
                const snapshot = await getDocs(q);

                // 選択された月のデータのみフィルタリングし、ローカルでソート
                const data = snapshot.docs
                    .map(doc => ({ id: doc.id, ...doc.data() }))
                    .filter(record => {
                        const dateStr = record.date;
                        if (!dateStr || typeof dateStr !== 'string') return false;
                        const [y, m] = dateStr.split('-').map(Number);
                        return y === year && m === month;
                    })
                    .map(record => ({
                        ...record,
                        day: parseInt(record.date?.split('-')[2] || '0'),
                    }))
                    .sort((a, b) => a.day - b.day);

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
    }, [selectedClientId, year, month]);

    const selectedClient = clients.find(c => c.id === selectedClientId);

    // 利用者をグループ分け
    const activeClients = clients.filter(c => c.status === 'active_onsite' || c.status === 'active_remote');
    const inactiveClients = clients.filter(c => c.status !== 'active_onsite' && c.status !== 'active_remote');

    // サマリーコンテンツ（画面表示と印刷で共用）
    const SummaryContent = ({ forPrint = false }) => (
        <Grid container spacing={forPrint ? 2 : 3}>
            {/* 概要カード */}
            <Grid size={{ xs: 12 }}>
                <Paper sx={{ p: 2, display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'center', ...(forPrint && { boxShadow: 'none', border: '1px solid #ddd' }) }}>
                    <Typography variant="h6" sx={{ mr: 2, ...(forPrint && { color: '#000' }) }}>{selectedClient?.name}</Typography>
                    <Chip label={`出席 ${summary.totalDays} 日`} color="primary" />
                    <Chip label={`通所 ${summary.onsiteDays} 日`} sx={{ bgcolor: forPrint ? '#e8f5e9' : 'rgba(16, 185, 129, 0.2)', color: forPrint ? '#2e7d32' : '#10b981' }} />
                    <Chip label={`在宅 ${summary.remoteDays} 日`} sx={{ bgcolor: forPrint ? '#ede7f6' : 'rgba(139, 92, 246, 0.2)', color: forPrint ? '#5e35b1' : '#8b5cf6' }} />
                </Paper>
            </Grid>

            {/* 体温グラフ */}
            <Grid size={{ xs: 12, md: 6 }}>
                <Paper sx={{ p: 2, height: 280, ...(forPrint && { boxShadow: 'none', border: '1px solid #ddd' }) }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, color: forPrint ? '#0097a7' : COLORS.primary }}>
                        {forPrint ? '' : '🌡️ '}体温推移
                    </Typography>
                    {summary.temperatures.length === 0 ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: 'text.secondary' }}>データなし</Box>
                    ) : (
                        <ResponsiveContainer width="100%" height={220}>
                            <LineChart data={summary.temperatures}>
                                <CartesianGrid strokeDasharray="3 3" stroke={forPrint ? '#ccc' : '#333'} />
                                <XAxis dataKey="day" tick={{ fill: forPrint ? '#333' : '#94a3b8', fontSize: 12 }} />
                                <YAxis domain={[35, 39]} tick={{ fill: forPrint ? '#333' : '#94a3b8', fontSize: 12 }} />
                                <Tooltip />
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
                <Paper sx={{ p: 2, height: 280, ...(forPrint && { boxShadow: 'none', border: '1px solid #ddd' }) }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, color: forPrint ? '#7b1fa2' : COLORS.purple }}>
                        {forPrint ? '' : '😊 '}気分推移
                    </Typography>
                    {summary.moodData.length === 0 ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: 'text.secondary' }}>データなし</Box>
                    ) : (
                        <ResponsiveContainer width="100%" height={220}>
                            <AreaChart data={summary.moodData}>
                                <CartesianGrid strokeDasharray="3 3" stroke={forPrint ? '#ccc' : '#333'} />
                                <XAxis dataKey="day" tick={{ fill: forPrint ? '#333' : '#94a3b8', fontSize: 12 }} />
                                <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fill: forPrint ? '#333' : '#94a3b8', fontSize: 12 }} />
                                <Tooltip />
                                <Area type="monotone" dataKey="level" stroke={COLORS.purple} fill={COLORS.purple} fillOpacity={0.3} />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </Paper>
            </Grid>

            {/* 睡眠の質グラフ */}
            <Grid size={{ xs: 12, md: 6 }}>
                <Paper sx={{ p: 2, height: 280, ...(forPrint && { boxShadow: 'none', border: '1px solid #ddd' }) }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, color: forPrint ? '#2e7d32' : COLORS.success }}>
                        {forPrint ? '' : '😴 '}睡眠の質
                    </Typography>
                    {summary.sleepData.length === 0 ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: 'text.secondary' }}>データなし</Box>
                    ) : (
                        <ResponsiveContainer width="100%" height={220}>
                            <AreaChart data={summary.sleepData}>
                                <CartesianGrid strokeDasharray="3 3" stroke={forPrint ? '#ccc' : '#333'} />
                                <XAxis dataKey="day" tick={{ fill: forPrint ? '#333' : '#94a3b8', fontSize: 12 }} />
                                <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fill: forPrint ? '#333' : '#94a3b8', fontSize: 12 }} />
                                <Tooltip />
                                <Area type="monotone" dataKey="quality" stroke={COLORS.success} fill={COLORS.success} fillOpacity={0.3} />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </Paper>
            </Grid>

            {/* 疲労度グラフ */}
            <Grid size={{ xs: 12, md: 6 }}>
                <Paper sx={{ p: 2, height: 280, ...(forPrint && { boxShadow: 'none', border: '1px solid #ddd' }) }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, color: forPrint ? '#e65100' : COLORS.warning }}>
                        {forPrint ? '' : '😓 '}疲労度（退所時）
                    </Typography>
                    {summary.fatigueData.length === 0 ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: 'text.secondary' }}>データなし</Box>
                    ) : (
                        <ResponsiveContainer width="100%" height={220}>
                            <AreaChart data={summary.fatigueData}>
                                <CartesianGrid strokeDasharray="3 3" stroke={forPrint ? '#ccc' : '#333'} />
                                <XAxis dataKey="day" tick={{ fill: forPrint ? '#333' : '#94a3b8', fontSize: 12 }} />
                                <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fill: forPrint ? '#333' : '#94a3b8', fontSize: 12 }} />
                                <Tooltip />
                                <Area type="monotone" dataKey="fatigue" stroke={COLORS.warning} fill={COLORS.warning} fillOpacity={0.3} />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </Paper>
            </Grid>

            {/* 活動TOP5 */}
            <Grid size={{ xs: 12, md: 6 }}>
                <Paper sx={{ p: 2, height: 280, ...(forPrint && { boxShadow: 'none', border: '1px solid #ddd' }) }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, color: forPrint ? '#0097a7' : COLORS.primary }}>
                        {forPrint ? '' : '📋 '}活動TOP5
                    </Typography>
                    {summary.topActivities.length === 0 ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: 'text.secondary' }}>データなし</Box>
                    ) : (
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={summary.topActivities} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke={forPrint ? '#ccc' : '#333'} />
                                <XAxis type="number" tick={{ fill: forPrint ? '#333' : '#94a3b8', fontSize: 12 }} />
                                <YAxis dataKey="name" type="category" tick={{ fill: forPrint ? '#333' : '#94a3b8', fontSize: 12 }} width={80} />
                                <Tooltip />
                                <Bar dataKey="count" fill={COLORS.primary} radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </Paper>
            </Grid>

            {/* 服薬状況 */}
            <Grid size={{ xs: 12, md: 6 }}>
                <Paper sx={{ p: 2, height: 280, ...(forPrint && { boxShadow: 'none', border: '1px solid #ddd' }) }}>
                    <Typography variant="subtitle2" sx={{ mb: 2, color: forPrint ? '#0097a7' : COLORS.primary }}>
                        {forPrint ? '' : '💊 '}服薬状況
                    </Typography>
                    <Grid container spacing={1}>
                        {['morning', 'noon', 'evening', 'bedtime'].map(time => {
                            const stats = summary.medicationStats[time];
                            const total = stats.taken + stats.not_taken + stats.not_prescribed;
                            const takenRate = total > 0 ? Math.round((stats.taken / total) * 100) : 0;
                            const label = { morning: '朝', noon: '昼', evening: '夜', bedtime: '就寝前' }[time];
                            return (
                                <Grid size={{ xs: 6, sm: 3 }} key={time}>
                                    <Card sx={{ bgcolor: forPrint ? '#f5f5f5' : 'rgba(30, 41, 59, 0.5)', textAlign: 'center', ...(forPrint && { boxShadow: 'none', border: '1px solid #ddd' }) }}>
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
    );

    return (
        <Box sx={{ pb: 4 }}>
            {/* ヘッダー */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="h5" sx={{ color: '#fff', fontWeight: 'bold' }}>
                        月間チェックインサマリー
                    </Typography>

                    {/* 月切り替え */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 1 }}>
                        <IconButton size="small" onClick={handlePrevMonth} sx={{ color: '#fff' }}>
                            <ArrowBackIosNewIcon fontSize="small" />
                        </IconButton>
                        <Typography variant="subtitle1" sx={{ color: '#fff', minWidth: 120, textAlign: 'center', fontWeight: 'bold' }}>
                            {year}年 {month}月
                        </Typography>
                        <IconButton size="small" onClick={handleNextMonth} sx={{ color: '#fff' }}>
                            <ArrowForwardIosIcon fontSize="small" />
                        </IconButton>
                    </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {/* 利用者選択（グループ分け） */}
                    <FormControl size="small" sx={{ minWidth: 220 }}>
                        <InputLabel>利用者を選択</InputLabel>
                        <Select
                            value={selectedClientId}
                            label="利用者を選択"
                            onChange={(e) => setSelectedClientId(e.target.value)}
                        >
                            {activeClients.length > 0 && <ListSubheader sx={{ bgcolor: '#1e293b', color: '#10b981', fontWeight: 'bold' }}>利用中</ListSubheader>}
                            {activeClients.map(client => (
                                <MenuItem key={client.id} value={client.id}>
                                    {client.name}
                                </MenuItem>
                            ))}
                            {inactiveClients.length > 0 && <ListSubheader sx={{ bgcolor: '#1e293b', color: '#94a3b8', fontWeight: 'bold' }}>退所・就職済み</ListSubheader>}
                            {inactiveClients.map(client => (
                                <MenuItem key={client.id} value={client.id}>
                                    {client.name}
                                    <Chip
                                        label={STATUS_LABELS[client.status] || client.status}
                                        size="small"
                                        sx={{ ml: 1, fontSize: '0.65rem', height: 18 }}
                                    />
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {/* 印刷ボタン */}
                    <Button
                        variant="contained"
                        startIcon={<PrintIcon />}
                        onClick={() => handlePrint()}
                        disabled={!summary || summary.totalDays === 0}
                        sx={{
                            background: summary?.totalDays > 0
                                ? 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)'
                                : 'rgba(100, 116, 139, 0.3)',
                            color: '#fff',
                            fontWeight: 'bold',
                            px: 3,
                            borderRadius: 2,
                            '&:hover': {
                                background: 'linear-gradient(135deg, #059669 0%, #0891b2 100%)',
                            },
                        }}
                    >
                        印刷
                    </Button>
                </Box>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
            ) : !summary || summary.totalDays === 0 ? (
                <Alert severity="info">{year}年{month}月のチェックインデータがありません。</Alert>
            ) : (
                <SummaryContent />
            )}

            {/* 印刷用ビュー（非表示） */}
            <Box sx={{ display: 'none' }}>
                <Box
                    ref={printRef}
                    sx={{
                        p: 3,
                        bgcolor: '#fff',
                        color: '#000',
                        '@media print': {
                            '& *': { color: '#000 !important' },
                        },
                    }}
                >
                    {/* 印刷ヘッダー */}
                    <Box sx={{ textAlign: 'center', mb: 3, borderBottom: '2px solid #333', pb: 2 }}>
                        <Typography variant="h4" sx={{ color: '#000', fontWeight: 'bold' }}>
                            月間チェックインサマリー
                        </Typography>
                        <Typography variant="h5" sx={{ color: '#333', mt: 1 }}>
                            {selectedClient?.name} - {year}年{month}月
                        </Typography>
                    </Box>

                    {summary && summary.totalDays > 0 && <SummaryContent forPrint />}
                </Box>
            </Box>
        </Box>
    );
}
