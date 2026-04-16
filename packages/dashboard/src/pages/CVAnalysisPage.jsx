// src/pages/CVAnalysisPage.jsx
// CV分析ダッシュボード

import React, { useState, useEffect, useMemo } from 'react';
import {
    Box,
    Typography,
    Paper,
    Grid,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    CircularProgress,
    Alert,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    ListItemIcon,
    Chip,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PersonIcon from '@mui/icons-material/Person';
import WarningIcon from '@mui/icons-material/Warning';
import { Link as RouterLink } from 'react-router-dom';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase/index';
import { useAuth } from '../features/auth/context/AuthContext';
import { CLIENT_STATUS, STATUS_CONFIG, CLOSED_REASONS } from '../constants/clientStatus';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ja } from 'date-fns/locale';

export default function CVAnalysisPage() {
    const { currentUser } = useAuth();
    const companyId = currentUser?.companyId || null;

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [clients, setClients] = useState([]);
    const [selectedMonth, setSelectedMonth] = useState(new Date());

    // 月の選択肢を生成（過去12ヶ月）
    const monthOptions = useMemo(() => {
        const options = [];
        for (let i = 0; i < 12; i++) {
            const date = subMonths(new Date(), i);
            options.push({
                value: format(date, 'yyyy-MM'),
                label: format(date, 'yyyy年M月', { locale: ja }),
                date: date,
            });
        }
        return options;
    }, []);

    // データ取得
    useEffect(() => {
        const fetchClients = async () => {
            setLoading(true);
            setError(null);
            try {
                const companyFilter = companyId ? [where('companyId', '==', companyId)] : [];
                const snapshot = await getDocs(companyFilter.length ? query(collection(db, 'clients'), ...companyFilter) : collection(db, 'clients'));
                const data = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                }));
                setClients(data);
            } catch (err) {
                console.error('クライアント取得エラー:', err);
                setError('データの取得に失敗しました');
            } finally {
                setLoading(false);
            }
        };
        fetchClients();
    }, [companyId]);

    // 日付ヘルパー
    const toDate = (v) => {
        if (!v) return null;
        if (v.toDate) return v.toDate();
        if (v.seconds) return new Date(v.seconds * 1000);
        const d = new Date(v);
        return isNaN(d) ? null : d;
    };
    const isInMonth = (v, start, end) => {
        const d = toDate(v);
        return d && d >= start && d <= end;
    };

    // 選択月のデータをフィルタリング（累積ファネル方式）
    const { monthlyStats, lostClients } = useMemo(() => {
        const monthStart = startOfMonth(selectedMonth);
        const monthEnd = endOfMonth(selectedMonth);

        // 関係者を除外
        const activeClients = clients.filter(c => c.status !== 'family');

        // その月に問合せが入った人（createdAtベース）＝ コホート
        const cohort = activeClients.filter(c => isInMonth(c.createdAt, monthStart, monthEnd));

        // 累積ファネル: その月の問合せ者のうち、各マイルストーンに到達した人数
        // 日付フィールドがあれば到達済み、なくても現在ステータスが先なら到達済み
        const STAGE_ORDER = ['inquiry', 'interview', 'trial', 'pre_contract', 'active_onsite', 'active_remote'];
        const stageIndex = (s) => {
            const i = STAGE_ORDER.indexOf(s);
            return i >= 0 ? i : (s?.startsWith('follow') || s === 'completed' || s === 'graduated' || s === 'expired_graduation') ? 99 : -1;
        };

        const reachedInterview = cohort.filter(c => c.interviewDate || stageIndex(c.status) >= 1).length;
        const reachedTrial = cohort.filter(c => c.trialStartDate || stageIndex(c.status) >= 2).length;
        const reachedContract = cohort.filter(c => c.contractDate || stageIndex(c.status) >= 3).length;
        const reachedActive = cohort.filter(c => c.serviceStartDate || stageIndex(c.status) >= 4).length;

        // ロスト: その月にロストした人（closedDateベース）
        // ※ updatedAtへのフォールバックは誤カウントの元なので使わない
        const lost = activeClients.filter(c =>
            (c.status === CLIENT_STATUS.CLOSED || c.status === 'closed-lost') &&
            isInMonth(c.closedDate, monthStart, monthEnd)
        );

        const totalInquiries = cohort.length;

        return {
            monthlyStats: {
                totalInquiries,
                counts: {
                    interview: reachedInterview,
                    trial: reachedTrial,
                    preContract: reachedContract,
                    active: reachedActive,
                    lost: lost.length,
                },
                cvRates: {
                    interview: totalInquiries > 0 ? Math.round(reachedInterview / totalInquiries * 100) : 0,
                    trial: totalInquiries > 0 ? Math.round(reachedTrial / totalInquiries * 100) : 0,
                    preContract: totalInquiries > 0 ? Math.round(reachedContract / totalInquiries * 100) : 0,
                    active: totalInquiries > 0 ? Math.round(reachedActive / totalInquiries * 100) : 0,
                },
            },
            lostClients: lost,
        };
    }, [clients, selectedMonth]);

    const handleMonthChange = (event) => {
        const selected = monthOptions.find(m => m.value === event.target.value);
        if (selected) {
            setSelectedMonth(selected.date);
        }
    };

    // 年間推移データを計算（過去12ヶ月・累積ファネル方式）
    const yearlyStats = useMemo(() => {
        const stats = [];
        const now = new Date();
        const activeClients = clients.filter(c => c.status !== 'family');

        const STAGE_ORDER = ['inquiry', 'interview', 'trial', 'pre_contract', 'active_onsite', 'active_remote'];
        const stageIdx = (s) => {
            const i = STAGE_ORDER.indexOf(s);
            return i >= 0 ? i : (s?.startsWith('follow') || s === 'completed' || s === 'graduated' || s === 'expired_graduation') ? 99 : -1;
        };

        for (let i = 11; i >= 0; i--) {
            const targetMonth = subMonths(now, i);
            const monthStart = startOfMonth(targetMonth);
            const monthEnd = endOfMonth(targetMonth);

            // その月の問合せコホート
            const cohort = activeClients.filter(c => isInMonth(c.createdAt, monthStart, monthEnd));

            stats.push({
                month: format(targetMonth, 'M月', { locale: ja }),
                fullMonth: format(targetMonth, 'yyyy年M月', { locale: ja }),
                inquiry: cohort.length,
                interview: cohort.filter(c => c.interviewDate || stageIdx(c.status) >= 1).length,
                trial: cohort.filter(c => c.trialStartDate || stageIdx(c.status) >= 2).length,
                active: cohort.filter(c => c.serviceStartDate || stageIdx(c.status) >= 4).length,
            });
        }

        return stats;
    }, [clients]);

    // ロスト理由のラベルを取得
    const getLostReasonLabel = (reason) => {
        const found = Object.values(CLOSED_REASONS).find(r => r.id === reason);
        return found ? found.label : reason || '不明';
    };

    // ロストフェーズのラベルを取得
    const getLostPhaseLabel = (phase) => {
        return STATUS_CONFIG[phase]?.label || phase || '不明';
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            {/* ヘッダー */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <TrendingUpIcon sx={{ color: '#10b981', fontSize: 32 }} />
                    <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#fff' }}>
                        CV分析
                    </Typography>
                </Box>

                <FormControl size="small" sx={{ minWidth: 150 }}>
                    <InputLabel sx={{ color: '#94a3b8' }}>月を選択</InputLabel>
                    <Select
                        value={format(selectedMonth, 'yyyy-MM')}
                        onChange={handleMonthChange}
                        label="月を選択"
                        sx={{
                            color: '#fff',
                            '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' },
                            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.3)' },
                        }}
                    >
                        {monthOptions.map(option => (
                            <MenuItem key={option.value} value={option.value}>
                                {option.label}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {/* メインコンテンツ: 左ファネル / 右ロストリスト */}
            <Grid container spacing={3}>
                {/* 左: ファネル表示 */}
                <Grid item xs={12} md={7}>
                    <Paper sx={{ p: 3, bgcolor: '#1e293b', height: '100%' }}>
                        <Typography variant="h6" sx={{ color: '#fff', mb: 2 }}>
                            {format(selectedMonth, 'yyyy年M月', { locale: ja })} のコンバージョン
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#94a3b8', mb: 3 }}>
                            問合せ数: {monthlyStats.totalInquiries}件
                        </Typography>

                        {/* ファネルバー（累積方式） */}
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
                            <FunnelBar label="問合せ" count={monthlyStats.totalInquiries} rate={100} color="#06b6d4" />
                            <FunnelBar
                                label="見学到達"
                                count={monthlyStats.counts.interview}
                                rate={monthlyStats.cvRates.interview}
                                color="#3b82f6"
                            />
                            <FunnelBar
                                label="体験到達"
                                count={monthlyStats.counts.trial}
                                rate={monthlyStats.cvRates.trial}
                                color="#8b5cf6"
                            />
                            <FunnelBar
                                label="契約到達"
                                count={monthlyStats.counts.preContract}
                                rate={monthlyStats.cvRates.preContract}
                                color="#f59e0b"
                            />
                            <FunnelBar
                                label="利用開始"
                                count={monthlyStats.counts.active}
                                rate={monthlyStats.cvRates.active}
                                color="#10b981"
                            />
                        </Box>
                    </Paper>
                </Grid>

                {/* 右: ロストメンバーリスト */}
                <Grid item xs={12} md={5}>
                    <Paper sx={{ p: 3, bgcolor: '#1e293b', height: '100%' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                            <WarningIcon sx={{ color: '#ef4444' }} />
                            <Typography variant="h6" sx={{ color: '#ef4444' }}>
                                ロスト: {lostClients.length}件
                            </Typography>
                        </Box>

                        {lostClients.length === 0 ? (
                            <Typography variant="body2" sx={{ color: '#94a3b8', textAlign: 'center', py: 4 }}>
                                この月のロストはありません 🎉
                            </Typography>
                        ) : (
                            <List sx={{ p: 0 }}>
                                {lostClients.map(client => (
                                    <ListItem key={client.id} disablePadding sx={{ mb: 1 }}>
                                        <ListItemButton
                                            component={RouterLink}
                                            to={`/clients/${client.id}`}
                                            sx={{
                                                bgcolor: 'rgba(239, 68, 68, 0.1)',
                                                borderRadius: 1,
                                                '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.2)' },
                                            }}
                                        >
                                            <ListItemIcon>
                                                <PersonIcon sx={{ color: '#ef4444' }} />
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={client.name || '名前なし'}
                                                secondary={
                                                    <Box component="span">
                                                        <Box sx={{ display: 'flex', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                                                            <Chip
                                                                label={getLostPhaseLabel(client.lostAtPhase)}
                                                                size="small"
                                                                sx={{
                                                                    fontSize: '0.7rem',
                                                                    height: 20,
                                                                    bgcolor: 'rgba(255,255,255,0.1)',
                                                                    color: '#94a3b8',
                                                                }}
                                                            />
                                                            <Chip
                                                                label={getLostReasonLabel(client.lostReason)}
                                                                size="small"
                                                                sx={{
                                                                    fontSize: '0.7rem',
                                                                    height: 20,
                                                                    bgcolor: 'rgba(239, 68, 68, 0.2)',
                                                                    color: '#fca5a5',
                                                                }}
                                                            />
                                                        </Box>
                                                        {client.lostReasonDetails && (
                                                            <Box
                                                                sx={{
                                                                    mt: 1,
                                                                    p: 1,
                                                                    bgcolor: 'rgba(0,0,0,0.2)',
                                                                    borderRadius: 1,
                                                                    borderLeft: '3px solid #ef4444',
                                                                }}
                                                            >
                                                                <Typography
                                                                    variant="body2"
                                                                    component="span"
                                                                    sx={{
                                                                        color: '#d1d5db',
                                                                        fontSize: '0.8rem',
                                                                        display: 'block',
                                                                    }}
                                                                >
                                                                    {client.lostReasonDetails}
                                                                </Typography>
                                                            </Box>
                                                        )}
                                                    </Box>
                                                }
                                                primaryTypographyProps={{ sx: { color: '#fff', fontWeight: 'bold' } }}
                                            />
                                        </ListItemButton>
                                    </ListItem>
                                ))}
                            </List>
                        )}
                    </Paper>
                </Grid>
            </Grid>

            {/* 年間推移テーブル */}
            <Paper sx={{ p: 3, bgcolor: '#1e293b', mt: 3 }}>
                <Typography variant="h6" sx={{ color: '#fff', mb: 2 }}>
                    📊 年間推移（過去12ヶ月）
                </Typography>
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: 'rgba(6, 182, 212, 0.1)' }}>
                                <TableCell sx={{ color: '#94a3b8', fontWeight: 'bold', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>月</TableCell>
                                <TableCell align="center" sx={{ color: '#06b6d4', fontWeight: 'bold', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>問合せ</TableCell>
                                <TableCell align="center" sx={{ color: '#3b82f6', fontWeight: 'bold', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>見学</TableCell>
                                <TableCell align="center" sx={{ color: '#8b5cf6', fontWeight: 'bold', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>体験</TableCell>
                                <TableCell align="center" sx={{ color: '#10b981', fontWeight: 'bold', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>利用開始</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {yearlyStats.map((row, index) => (
                                <TableRow key={index} hover sx={{ '&:last-child td': { border: 0 } }}>
                                    <TableCell sx={{ color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.05)', py: 1 }}>
                                        {row.month}
                                    </TableCell>
                                    <TableCell align="center" sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)', py: 1 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                                            <Box sx={{ width: Math.min(row.inquiry * 10, 80), height: 16, bgcolor: '#06b6d4', borderRadius: 0.5 }} />
                                            <Typography variant="body2" sx={{ color: '#fff', minWidth: 24 }}>{row.inquiry}</Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell align="center" sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)', py: 1 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                                            <Box sx={{ width: Math.min(row.interview * 10, 80), height: 16, bgcolor: '#3b82f6', borderRadius: 0.5 }} />
                                            <Typography variant="body2" sx={{ color: '#fff', minWidth: 24 }}>{row.interview}</Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell align="center" sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)', py: 1 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                                            <Box sx={{ width: Math.min(row.trial * 10, 80), height: 16, bgcolor: '#8b5cf6', borderRadius: 0.5 }} />
                                            <Typography variant="body2" sx={{ color: '#fff', minWidth: 24 }}>{row.trial}</Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell align="center" sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)', py: 1 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                                            <Box sx={{ width: Math.min(row.active * 15, 80), height: 16, bgcolor: '#10b981', borderRadius: 0.5 }} />
                                            <Typography variant="body2" sx={{ color: '#fff', minWidth: 24 }}>{row.active}</Typography>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
                <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mt: 2 }}>
                    ※ 問合せ・見学・体験は問合せ月ベース、利用開始は利用開始日ベースでカウント
                </Typography>
            </Paper>
        </Box>
    );
}

// ファネルバーコンポーネント
function FunnelBar({ label, count, rate, color }) {
    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2" sx={{ color: '#fff' }}>{label}</Typography>
                <Typography variant="body2" sx={{ color: '#fff' }}>
                    {count}件 ({rate}%)
                </Typography>
            </Box>
            <Box sx={{ height: 24, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 1, overflow: 'hidden' }}>
                <Box
                    sx={{
                        width: `${rate}%`,
                        height: '100%',
                        bgcolor: color,
                        transition: 'width 0.3s ease',
                    }}
                />
            </Box>
        </Box>
    );
}
