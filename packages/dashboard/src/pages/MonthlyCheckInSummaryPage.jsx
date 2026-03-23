// src/pages/MonthlyCheckInSummaryPage.jsx
// 月間チェックインサマリーページ

import { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Grid, CircularProgress, Alert,
    FormControl, InputLabel, Select, MenuItem, Chip, Card, CardContent,
    IconButton, Button, ListSubheader
} from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import PrintIcon from '@mui/icons-material/Print';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../features/auth/context/AuthContext';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    AreaChart, Area, BarChart, Bar, ReferenceLine
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

// ステータスラベル
const STATUS_LABELS = {
    active_onsite: '通所中',
    active_remote: '在宅中',
    graduated: '就職済み',
    dropped: '退所済み',
    suspended: '休止中',
};

export default function MonthlyCheckInSummaryPage() {
    const { currentUser } = useAuth();
    const companyId = currentUser?.companyId || null;

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [clients, setClients] = useState([]);
    const [selectedClientId, setSelectedClientId] = useState('');
    const [monthlyData, setMonthlyData] = useState([]);
    const [summary, setSummary] = useState(null);
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth() + 1;

    const selectedClient = clients.find(c => c.id === selectedClientId);

    // 月の切り替え
    const handlePrevMonth = () => {
        setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    };
    const handleNextMonth = () => {
        setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    };

    // 印刷実行（新ウィンドウ・カスタムHTML方式 / A4 1枚）
    const handlePrint = () => {
        if (!summary) return;

        const printWindow = window.open('', '_blank', 'width=900,height=700');
        if (!printWindow) {
            alert('ポップアップがブロックされています。ブラウザのポップアップを許可してください。');
            return;
        }

        // data-chart 属性でSVGを取得し、テキストを黒・フォントサイズ統一してから埋め込む
        const getChartSvg = (chartName) => {
            const container = document.querySelector(`[data-chart="${chartName}"]`);
            if (!container) return '<p style="color:#aaa;text-align:center;padding:30px 0;font-size:11px;">データなし</p>';
            const svg = container.querySelector('svg');
            if (!svg) return '<p style="color:#aaa;text-align:center;padding:30px 0;font-size:11px;">データなし</p>';
            const clone = svg.cloneNode(true);
            const w = parseFloat(svg.getAttribute('width')) || svg.getBoundingClientRect().width || 400;
            const h = parseFloat(svg.getAttribute('height')) || svg.getBoundingClientRect().height || 180;
            if (!clone.getAttribute('viewBox')) clone.setAttribute('viewBox', `0 0 ${w} ${h}`);
            clone.setAttribute('width', '100%');
            clone.setAttribute('height', '100%');
            clone.style.cssText = 'display:block;';
            // SVG内のテキストをすべて黒・サイズ統一（インラインstyleを直接書き換え）
            clone.querySelectorAll('text, tspan').forEach(el => {
                el.style.fill = '#000';
                el.style.fontSize = '11px';
                el.removeAttribute('fill');
            });
            return clone.outerHTML;
        };

        // 服薬状況：横棒グラフで生成
        const medLabels = { morning: '朝', noon: '昼', evening: '夜', bedtime: '就寝前' };
        const medHtml = ['morning', 'noon', 'evening', 'bedtime'].map(time => {
            const s = summary.medicationStats[time];
            const total = s.taken + s.not_taken + s.not_prescribed;
            const rate = total > 0 ? Math.round((s.taken / total) * 100) : 0;
            const col = rate >= 80 ? '#10b981' : rate >= 50 ? '#f59e0b' : '#ef4444';
            return `<div style="margin-bottom:9px;">
                <div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:2px;">
                    <span style="font-weight:bold;">${medLabels[time]}</span>
                    <span style="color:#666;">${s.taken}/${s.taken + s.not_taken}</span>
                </div>
                <div style="height:14px;background:#eee;border-radius:7px;overflow:hidden;">
                    <div style="height:100%;width:${rate}%;background:${col};border-radius:7px;"></div>
                </div>
                <div style="text-align:right;font-size:11px;font-weight:bold;color:${col};margin-top:1px;">${rate}%</div>
            </div>`;
        }).join('');

        const css = `
            @page { size: A4 portrait; margin: 8mm; }
            * { box-sizing: border-box; margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            body { font-family: 'Hiragino Sans', 'Yu Gothic', 'Meiryo', Arial, sans-serif; background: #fff; color: #000; font-size: 13px; }
            .hdr { text-align: center; border-bottom: 2px solid #06b6d4; padding-bottom: 6px; margin-bottom: 8px; }
            .hdr h1 { font-size: 16px; font-weight: bold; }
            .hdr h2 { font-size: 13px; color: #333; margin-top: 3px; }
            .chips { display: flex; gap: 6px; margin-bottom: 8px; }
            .chip { border-radius: 14px; padding: 2px 10px; font-size: 12px; font-weight: bold; }
            .c-blue  { background:#e0f2fe; color:#0284c7; border:1px solid #7dd3fc; }
            .c-green { background:#dcfce7; color:#16a34a; border:1px solid #86efac; }
            .c-purple{ background:#f3e8ff; color:#7c3aed; border:1px solid #c4b5fd; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 7px; }
            .box { border: 1px solid #e2e8f0; border-radius: 5px; padding: 6px; background: #fff; }
            .box-title { font-size: 11px; font-weight: bold; color: #333; margin-bottom: 3px; padding-bottom: 3px; border-bottom: 1px solid #e2e8f0; }
            .chart-area { height: 148px; overflow: hidden; }
            .chart-area svg { display: block; }
            .med-area { padding-top: 4px; }

            /* SVGテキストを黒・読みやすいサイズに強制 */
            svg text { fill: #000 !important; font-size: 11px !important; }
            svg tspan { fill: #000 !important; font-size: 11px !important; }
            svg .recharts-text { fill: #000 !important; }
            svg .recharts-cartesian-axis-tick-value tspan { fill: #000 !important; font-size: 11px !important; }
            /* グリッド線を薄いグレーに */
            svg .recharts-cartesian-grid line { stroke: #ccc !important; }
        `;

        printWindow.document.write(`<!DOCTYPE html>
<html lang="ja"><head>
    <meta charset="UTF-8">
    <title>月間サマリー_${selectedClient?.name || ''}_${year}年${month}月</title>
    <style>${css}</style>
</head><body>
    <div class="hdr">
        <h1>月間チェックインサマリー</h1>
        <h2>${selectedClient?.name || ''} &mdash; ${year}年${month}月</h2>
    </div>
    <div class="chips">
        <span class="chip c-blue">出席 ${summary.totalDays}日</span>
        <span class="chip c-green">通所 ${summary.onsiteDays}日</span>
        <span class="chip c-purple">在宅 ${summary.remoteDays}日</span>
    </div>
    <div class="grid">
        <div class="box"><div class="box-title">🌡 体温推移</div><div class="chart-area">${getChartSvg('temp')}</div></div>
        <div class="box"><div class="box-title">😊 気分推移</div><div class="chart-area">${getChartSvg('mood')}</div></div>
        <div class="box"><div class="box-title">😴 睡眠の質</div><div class="chart-area">${getChartSvg('sleep')}</div></div>
        <div class="box"><div class="box-title">😓 疲労度（退所時）</div><div class="chart-area">${getChartSvg('fatigue')}</div></div>
        <div class="box"><div class="box-title">📋 活動 TOP5</div><div class="chart-area">${getChartSvg('activities')}</div></div>
        <div class="box"><div class="box-title">💊 服薬状況</div><div class="med-area">${medHtml}</div></div>
    </div>
    <script>window.onload=function(){setTimeout(function(){window.print();},800);};</script>
</body></html>`);
        printWindow.document.close();
    };

    // 利用者一覧を取得（退所者・就職者も含む）
    useEffect(() => {
        const fetchClients = async () => {
            try {
                const companyFilter = companyId ? [where('companyId', '==', companyId)] : [];
                const snapshot = await getDocs(companyFilter.length ? query(collection(db, 'clients'), ...companyFilter) : collection(db, 'clients'));
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
    }, [companyId]);

    // 選択された利用者の月間データを取得
    useEffect(() => {
        if (!selectedClientId) return;

        const fetchMonthlyData = async () => {
            setLoading(true);
            setError(null);
            try {
                const q = query(
                    collection(db, 'dailyCheckins'),
                    where('clientId', '==', selectedClientId)
                );
                const snapshot = await getDocs(q);

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

                const totalDays = data.length;
                const onsiteDays = data.filter(d => d.attendanceType === 'onsite').length;
                const remoteDays = data.filter(d => d.attendanceType === 'remote').length;

                const temperatures = data
                    .filter(d => d.temperature)
                    .map(d => ({
                        day: d.day,
                        temp: parseFloat(d.temperature),
                        high: parseFloat(d.temperature) >= 37.5,
                    }));

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

                const sleepData = data
                    .filter(d => d.sleep?.quality)
                    .map(d => ({ day: d.day, quality: d.sleep.quality }));

                const moodData = data
                    .filter(d => d.mood?.level)
                    .map(d => ({ day: d.day, level: d.mood.level }));

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

                const fatigueData = data
                    .filter(d => d.fatigue)
                    .map(d => ({ day: d.day, fatigue: d.fatigue }));

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

    // 利用者をグループ分け
    const activeClients = clients.filter(c => c.status === 'active_onsite' || c.status === 'active_remote');
    const inactiveClients = clients.filter(c => c.status !== 'active_onsite' && c.status !== 'active_remote');

    const SummaryContent = () => (
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
                <Paper data-chart="temp" sx={{ p: 2, height: 280 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, color: COLORS.primary }}>🌡️ 体温推移</Typography>
                    {summary.temperatures.length === 0 ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: 'text.secondary' }}>データなし</Box>
                    ) : (
                        <ResponsiveContainer width="100%" height={220}>
                            <LineChart data={summary.temperatures}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                <XAxis dataKey="day" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                <YAxis domain={[35, 39]} tick={{ fill: '#94a3b8', fontSize: 12 }} />
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
                <Paper data-chart="mood" sx={{ p: 2, height: 280 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, color: COLORS.purple }}>😊 気分推移</Typography>
                    {summary.moodData.length === 0 ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: 'text.secondary' }}>データなし</Box>
                    ) : (
                        <ResponsiveContainer width="100%" height={220}>
                            <AreaChart data={summary.moodData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                <XAxis dataKey="day" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                <Tooltip />
                                <Area type="monotone" dataKey="level" stroke={COLORS.purple} fill={COLORS.purple} fillOpacity={0.3} />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </Paper>
            </Grid>

            {/* 睡眠の質グラフ */}
            <Grid size={{ xs: 12, md: 6 }}>
                <Paper data-chart="sleep" sx={{ p: 2, height: 280 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, color: COLORS.success }}>😴 睡眠の質</Typography>
                    {summary.sleepData.length === 0 ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: 'text.secondary' }}>データなし</Box>
                    ) : (
                        <ResponsiveContainer width="100%" height={220}>
                            <AreaChart data={summary.sleepData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                <XAxis dataKey="day" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                <Tooltip />
                                <Area type="monotone" dataKey="quality" stroke={COLORS.success} fill={COLORS.success} fillOpacity={0.3} />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </Paper>
            </Grid>

            {/* 疲労度グラフ */}
            <Grid size={{ xs: 12, md: 6 }}>
                <Paper data-chart="fatigue" sx={{ p: 2, height: 280 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, color: COLORS.warning }}>😓 疲労度（退所時）</Typography>
                    {summary.fatigueData.length === 0 ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: 'text.secondary' }}>データなし</Box>
                    ) : (
                        <ResponsiveContainer width="100%" height={220}>
                            <AreaChart data={summary.fatigueData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                <XAxis dataKey="day" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                <Tooltip />
                                <Area type="monotone" dataKey="fatigue" stroke={COLORS.warning} fill={COLORS.warning} fillOpacity={0.3} />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </Paper>
            </Grid>

            {/* 活動TOP5 */}
            <Grid size={{ xs: 12, md: 6 }}>
                <Paper data-chart="activities" sx={{ p: 2, height: 280 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, color: COLORS.primary }}>📋 活動TOP5</Typography>
                    {summary.topActivities.length === 0 ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: 'text.secondary' }}>データなし</Box>
                    ) : (
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={summary.topActivities} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                <YAxis dataKey="name" type="category" tick={{ fill: '#94a3b8', fontSize: 12 }} width={80} />
                                <Tooltip />
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
    );

    return (
        <Box sx={{ pb: 4 }}>
                {/* ヘッダー（印刷時非表示） */}
                <Box className="no-print" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
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
                        {/* 利用者選択 */}
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
                            onClick={handlePrint}
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
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : !summary || summary.totalDays === 0 ? (
                    <Alert severity="info">{year}年{month}月のチェックインデータがありません。</Alert>
                ) : (
                    <div id="monthly-summary-content">
                        <SummaryContent />
                    </div>
                )}
        </Box>
    );
}
