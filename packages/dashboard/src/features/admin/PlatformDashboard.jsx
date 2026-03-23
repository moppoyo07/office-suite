// src/features/admin/PlatformDashboard.jsx
// プラットフォーム全体ダッシュボード（実データ版）

import { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Grid,
    CircularProgress,
    Card,
    CardContent,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    Collapse,
    IconButton,
    LinearProgress,
    Tooltip,
    Button,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import BusinessIcon from '@mui/icons-material/Business';
import PeopleIcon from '@mui/icons-material/People';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ErrorIcon from '@mui/icons-material/Error';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import GroupsIcon from '@mui/icons-material/Groups';
import HomeIcon from '@mui/icons-material/Home';
import ApartmentIcon from '@mui/icons-material/Apartment';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase/index';
import { startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { useTenant } from '../../context/TenantContext';
import { CLIENT_STATUS } from '../../constants/clientStatus';

// ファネル表示
const FunnelDisplay = ({ funnel }) => {
    const steps = [
        { key: 'inquiry', label: '問合せ', value: funnel.inquiry },
        { key: 'visit', label: '見学', value: funnel.visit },
        { key: 'trial', label: '体験', value: funnel.trial },
        { key: 'started', label: '利用開始', value: funnel.started },
    ];
    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {steps.map((step, index) => {
                const prevValue = index > 0 ? steps[index - 1].value : step.value;
                const dropRate = prevValue > 0 ? ((prevValue - step.value) / prevValue * 100).toFixed(0) : 0;
                const isHighDrop = dropRate > 30;
                return (
                    <Box key={step.key} sx={{ display: 'flex', alignItems: 'center' }}>
                        <Tooltip title={`${step.label}: ${step.value}件`}>
                            <Chip label={step.value} size="small" sx={{
                                bgcolor: isHighDrop && index > 0 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                                color: isHighDrop && index > 0 ? '#ef4444' : '#3b82f6',
                                fontWeight: 'bold', fontSize: '0.7rem', height: 24, minWidth: 32,
                            }} />
                        </Tooltip>
                        {index < steps.length - 1 && (
                            <Typography sx={{ mx: 0.5, fontSize: '0.65rem', color: isHighDrop ? '#ef4444' : '#64748b', fontWeight: isHighDrop ? 'bold' : 'normal' }}>
                                →{isHighDrop && <span style={{ color: '#ef4444' }}>-{dropRate}%</span>}
                            </Typography>
                        )}
                    </Box>
                );
            })}
        </Box>
    );
};

// 二重プログレスバー（在籍率 / 出席率）
const DualProgressBar = ({ enrollmentRate, attendanceRate }) => {
    const getColor = (rate) => rate >= 80 ? '#10b981' : rate >= 60 ? '#f59e0b' : '#ef4444';
    return (
        <Box sx={{ width: '100%', minWidth: 120 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                <Typography sx={{ fontSize: '0.6rem', color: '#94a3b8', width: 40 }}>在籍</Typography>
                <Box sx={{ flexGrow: 1, mr: 1 }}>
                    <LinearProgress variant="determinate" value={Math.min(enrollmentRate, 100)} sx={{
                        height: 6, borderRadius: 1, bgcolor: 'rgba(148, 163, 184, 0.2)',
                        '& .MuiLinearProgress-bar': { bgcolor: '#3b82f6', borderRadius: 1 },
                    }} />
                </Box>
                <Typography sx={{ fontSize: '0.7rem', color: '#3b82f6', fontWeight: 'bold', width: 35 }}>{enrollmentRate}%</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography sx={{ fontSize: '0.6rem', color: '#94a3b8', width: 40 }}>出席</Typography>
                <Box sx={{ flexGrow: 1, mr: 1 }}>
                    <LinearProgress variant="determinate" value={Math.min(attendanceRate, 100)} sx={{
                        height: 6, borderRadius: 1, bgcolor: 'rgba(148, 163, 184, 0.2)',
                        '& .MuiLinearProgress-bar': { bgcolor: getColor(attendanceRate), borderRadius: 1 },
                    }} />
                </Box>
                <Typography sx={{ fontSize: '0.7rem', color: getColor(attendanceRate), fontWeight: 'bold', width: 35 }}>{attendanceRate}%</Typography>
            </Box>
        </Box>
    );
};

// スパークライン（コマ数推移）
const Sparkline = ({ data, width = 80, height = 24 }) => {
    if (!data || data.length < 2) return <Typography sx={{ fontSize: '0.7rem', color: '#475569' }}>─</Typography>;
    const max = Math.max(...data); const min = Math.min(...data); const range = max - min || 1;
    const points = data.map((value, index) => {
        const x = (index / (data.length - 1)) * width;
        const y = height - ((value - min) / range) * (height - 4) - 2;
        return `${x},${y}`;
    }).join(' ');
    const trend = data[data.length - 1] >= data[0];
    const color = trend ? '#10b981' : '#ef4444';
    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <svg width={width} height={height} style={{ overflow: 'visible' }}>
                <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx={width} cy={height - ((data[data.length - 1] - min) / range) * (height - 4) - 2} r="3" fill={color} />
            </svg>
            {trend ? <TrendingUpIcon sx={{ fontSize: 16, color: '#10b981' }} /> : <TrendingDownIcon sx={{ fontSize: 16, color: '#ef4444' }} />}
        </Box>
    );
};

// リスクバッジ
const RiskBadge = ({ attendanceRate, enrollmentRate }) => {
    const badges = [];
    if (attendanceRate < 60) {
        badges.push(<Tooltip key="rating" title="出席率低下による算定ランクダウンリスク">
            <Chip icon={<WarningAmberIcon sx={{ fontSize: 14 }} />} label="算定↓" size="small" sx={{
                bgcolor: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', fontSize: '0.65rem', height: 22, '& .MuiChip-icon': { color: '#f59e0b' },
            }} />
        </Tooltip>);
    }
    if (enrollmentRate >= 90) {
        badges.push(<Tooltip key="max" title="定員MAX近し：新規受入余裕なし">
            <Chip icon={<ErrorIcon sx={{ fontSize: 14 }} />} label="MAX近" size="small" sx={{
                bgcolor: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', fontSize: '0.65rem', height: 22, '& .MuiChip-icon': { color: '#ef4444' },
            }} />
        </Tooltip>);
    }
    if (badges.length === 0) {
        badges.push(<Chip key="ok" icon={<CheckCircleIcon sx={{ fontSize: 14 }} />} label="良好" size="small" sx={{
            bgcolor: 'rgba(16, 185, 129, 0.15)', color: '#10b981', fontSize: '0.65rem', height: 22, '& .MuiChip-icon': { color: '#10b981' },
        }} />);
    }
    return <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>{badges}</Box>;
};

// 企業行
const CompanyRow = ({ company, onEnter }) => {
    const [open, setOpen] = useState(false);
    const { summary } = company;
    return (
        <>
            <TableRow hover onClick={() => setOpen(!open)} sx={{ cursor: 'pointer', bgcolor: open ? 'rgba(59, 130, 246, 0.1)' : 'transparent', '&:hover': { bgcolor: 'rgba(59, 130, 246, 0.15)' } }}>
                <TableCell sx={{ width: 40, p: 1 }}>
                    <IconButton size="small" sx={{ color: '#94a3b8' }}>{open ? <KeyboardArrowDownIcon /> : <KeyboardArrowRightIcon />}</IconButton>
                </TableCell>
                <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                        <Box>
                            <Typography sx={{ fontWeight: 'bold', color: '#f8fafc', fontSize: '0.9rem' }}>{company.name}</Typography>
                            <Box sx={{ display: 'flex', gap: 1, mt: 0.3 }}>
                                <Typography sx={{ fontSize: '0.7rem', color: '#64748b' }}>
                                    <GroupsIcon sx={{ fontSize: 12, mr: 0.5, verticalAlign: 'middle' }} />{company.branches.length} 拠点
                                </Typography>
                                <Tooltip title="施設内利用者">
                                    <Typography sx={{ fontSize: '0.7rem', color: '#10b981' }}>
                                        <ApartmentIcon sx={{ fontSize: 11, mr: 0.3, verticalAlign: 'middle' }} />{summary.totalOnsite}
                                    </Typography>
                                </Tooltip>
                                <Tooltip title="施設外利用者">
                                    <Typography sx={{ fontSize: '0.7rem', color: '#8b5cf6' }}>
                                        <HomeIcon sx={{ fontSize: 11, mr: 0.3, verticalAlign: 'middle' }} />{summary.totalRemote}
                                    </Typography>
                                </Tooltip>
                            </Box>
                        </Box>
                        <Button
                            size="small"
                            variant="outlined"
                            onClick={(e) => { e.stopPropagation(); onEnter(company.id); }}
                            sx={{ fontSize: '0.65rem', py: 0.3, px: 1, minWidth: 'auto', color: '#8b5cf6', borderColor: 'rgba(139, 92, 246, 0.5)', whiteSpace: 'nowrap', '&:hover': { bgcolor: 'rgba(139, 92, 246, 0.1)', borderColor: '#8b5cf6' } }}
                        >
                            入る →
                        </Button>
                    </Box>
                </TableCell>
                <TableCell><FunnelDisplay funnel={summary.funnel} /></TableCell>
                <TableCell><DualProgressBar enrollmentRate={summary.enrollmentRate} attendanceRate={summary.attendanceRate} /></TableCell>
                <TableCell align="right">
                    <Typography sx={{ fontSize: '0.85rem', color: '#f8fafc', fontWeight: 'bold' }}>{summary.totalSlots.toLocaleString()}</Typography>
                    <Typography sx={{ fontSize: '0.65rem', color: '#64748b' }}>コマ / 前月 {summary.prevSlots}</Typography>
                </TableCell>
                <TableCell><Sparkline data={summary.revenueHistory} /></TableCell>
                <TableCell align="right">
                    {summary.estimatedRevenue > 0
                        ? <Typography sx={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 'bold' }}>¥{(summary.estimatedRevenue / 10000).toFixed(0)}万</Typography>
                        : <Typography sx={{ fontSize: '0.75rem', color: '#475569' }}>単価未設定</Typography>
                    }
                </TableCell>
                <TableCell><RiskBadge enrollmentRate={summary.enrollmentRate} attendanceRate={summary.attendanceRate} /></TableCell>
            </TableRow>
            <TableRow>
                <TableCell colSpan={8} sx={{ p: 0, border: 0 }}>
                    <Collapse in={open} timeout="auto" unmountOnExit>
                        <Box sx={{ bgcolor: 'rgba(15, 23, 42, 0.8)', py: 1, px: 2 }}>
                            {company.branches.map((branch) => (
                                <Box key={branch.id} sx={{ display: 'grid', gridTemplateColumns: '40px 1fr 140px 80px 80px 120px', alignItems: 'center', py: 1, borderBottom: '1px solid rgba(148, 163, 184, 0.1)', '&:last-child': { borderBottom: 0 } }}>
                                    <Box />
                                    <Box>
                                        <Typography sx={{ fontSize: '0.85rem', color: '#cbd5e1' }}>└ {branch.name}</Typography>
                                        {branch.unitPrice > 0 && (
                                            <Typography sx={{ fontSize: '0.65rem', color: '#8b5cf6' }}>算定単価: ¥{branch.unitPrice.toLocaleString()}</Typography>
                                        )}
                                    </Box>
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                        <Chip size="small" label={`施設内 ${branch.activeOnsite}`} sx={{ bgcolor: 'rgba(16, 185, 129, 0.15)', color: '#10b981', fontSize: '0.65rem', height: 20 }} />
                                        <Chip size="small" label={`施設外 ${branch.activeRemote}`} sx={{ bgcolor: 'rgba(139, 92, 246, 0.15)', color: '#a78bfa', fontSize: '0.65rem', height: 20 }} />
                                    </Box>
                                    <Typography sx={{ fontSize: '0.8rem', color: '#94a3b8', textAlign: 'right' }}>{branch.monthlySlots} コマ</Typography>
                                    <Sparkline data={branch.revenueHistory} width={60} height={20} />
                                    {branch.estimatedRevenue > 0
                                        ? <Typography sx={{ fontSize: '0.8rem', color: '#94a3b8', textAlign: 'right' }}>¥{(branch.estimatedRevenue / 10000).toFixed(0)}万</Typography>
                                        : <Typography sx={{ fontSize: '0.75rem', color: '#475569', textAlign: 'right' }}>─</Typography>
                                    }
                                </Box>
                            ))}
                        </Box>
                    </Collapse>
                </TableCell>
            </TableRow>
        </>
    );
};

export default function PlatformDashboard() {
    const navigate = useNavigate();
    const { enterEmulatorMode } = useTenant();
    const [loading, setLoading] = useState(true);
    const [companies, setCompanies] = useState([]);
    const [stats, setStats] = useState({ totalCompanies: 0, totalBranches: 0, totalClients: 0, totalUsers: 0 });

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const now = new Date();
                const currentMonthStart = startOfMonth(now);
                const currentMonthEnd = endOfMonth(now);
                const prevMonthStart = startOfMonth(subMonths(now, 1));
                const prevMonthEnd = endOfMonth(subMonths(now, 1));

                // 1. 企業・支店・利用者・出席を並列取得
                const [companiesSnap, branchesSnap, clientsSnap, usersSnap, attendanceCurrentSnap, attendancePrevSnap] = await Promise.all([
                    getDocs(collection(db, 'companies')),
                    getDocs(collection(db, 'branches')),
                    getDocs(collection(db, 'clients')),
                    getDocs(collection(db, 'users')),
                    getDocs(query(
                        collection(db, 'attendanceRecords'),
                        where('date', '>=', Timestamp.fromDate(currentMonthStart)),
                        where('date', '<=', Timestamp.fromDate(currentMonthEnd))
                    )),
                    getDocs(query(
                        collection(db, 'attendanceRecords'),
                        where('date', '>=', Timestamp.fromDate(prevMonthStart)),
                        where('date', '<=', Timestamp.fromDate(prevMonthEnd))
                    )),
                ]);

                // 2. 支店をcompanyIdでグループ化
                const branchesByCompany = {};
                branchesSnap.docs.forEach(d => {
                    const data = { id: d.id, ...d.data() };
                    if (!branchesByCompany[data.companyId]) branchesByCompany[data.companyId] = [];
                    branchesByCompany[data.companyId].push(data);
                });

                // 3. 利用者をcompanyIdでグループ化
                const clientsByCompany = {};
                clientsSnap.docs.forEach(d => {
                    const data = d.data();
                    if (!clientsByCompany[data.companyId]) clientsByCompany[data.companyId] = [];
                    clientsByCompany[data.companyId].push(data);
                });

                // 4. 出席数（present のみ）をcompanyIdでカウント
                const attendanceCurrent = {};
                attendanceCurrentSnap.docs.forEach(d => {
                    const data = d.data();
                    if (data.status === 'present') {
                        attendanceCurrent[data.companyId] = (attendanceCurrent[data.companyId] || 0) + 1;
                    }
                });
                const attendancePrev = {};
                attendancePrevSnap.docs.forEach(d => {
                    const data = d.data();
                    if (data.status === 'present') {
                        attendancePrev[data.companyId] = (attendancePrev[data.companyId] || 0) + 1;
                    }
                });

                // 5. 企業ごとに集計
                const companiesData = companiesSnap.docs.map(d => {
                    const company = { id: d.id, ...d.data() };
                    const clients = clientsByCompany[company.id] || [];
                    const branches = branchesByCompany[company.id] || [];

                    // ファネル
                    const inquiry = clients.filter(c => c.status === CLIENT_STATUS.INQUIRY).length;
                    const visit = clients.filter(c => c.status === CLIENT_STATUS.INTERVIEW).length;
                    const trial = clients.filter(c => c.status === CLIENT_STATUS.TRIAL).length;
                    const activeOnsite = clients.filter(c => c.status === CLIENT_STATUS.ACTIVE_ONSITE).length;
                    const activeRemote = clients.filter(c => c.status === CLIENT_STATUS.ACTIVE_REMOTE).length;
                    const preContract = clients.filter(c => c.status === CLIENT_STATUS.PRE_CONTRACT).length;
                    const totalActive = activeOnsite + activeRemote;

                    // コマ数
                    const monthlySlots = attendanceCurrent[company.id] || 0;
                    const prevMonthlySlots = attendancePrev[company.id] || 0;

                    // 定員・単価（企業 or 支店のフィールドから）
                    const totalCapacity = branches.reduce((sum, b) => sum + (b.capacity || 0), 0) || (company.capacity || 0);
                    const unitPrice = company.unitPrice || branches[0]?.unitPrice || 0;

                    // 在籍率・出席率
                    const enrollmentRate = totalCapacity > 0 ? Math.round((totalActive / totalCapacity) * 100) : 0;
                    const maxMonthlySlots = totalCapacity > 0 ? totalCapacity * 22 : 0;
                    const attendanceRate = maxMonthlySlots > 0 ? Math.min(Math.round((monthlySlots / maxMonthlySlots) * 100), 100) : 0;

                    // 推定売上
                    const estimatedRevenue = unitPrice > 0 ? monthlySlots * unitPrice : 0;

                    // 支店別集計
                    const formattedBranches = branches.length > 0 ? branches.map(b => {
                        const branchClients = clients.filter(c => c.branchId === b.id);
                        const bOnsite = branchClients.filter(c => c.status === CLIENT_STATUS.ACTIVE_ONSITE).length;
                        const bRemote = branchClients.filter(c => c.status === CLIENT_STATUS.ACTIVE_REMOTE).length;
                        const bSlots = Math.round(monthlySlots * (branches.length > 0 ? 1 / branches.length : 1));
                        const bPrevSlots = Math.round(prevMonthlySlots * (branches.length > 0 ? 1 / branches.length : 1));
                        const bUnitPrice = b.unitPrice || unitPrice;
                        return {
                            id: b.id,
                            name: b.name,
                            activeOnsite: bOnsite,
                            activeRemote: bRemote,
                            monthlySlots: bSlots,
                            unitPrice: bUnitPrice,
                            estimatedRevenue: bUnitPrice > 0 ? bSlots * bUnitPrice : 0,
                            revenueHistory: [bPrevSlots, bSlots],
                        };
                    }) : [{
                        id: company.id + '-default',
                        name: '(支店未設定)',
                        activeOnsite,
                        activeRemote,
                        monthlySlots,
                        unitPrice,
                        estimatedRevenue,
                        revenueHistory: [prevMonthlySlots, monthlySlots],
                    }];

                    return {
                        id: company.id,
                        name: company.name,
                        branches: formattedBranches,
                        summary: {
                            totalOnsite: activeOnsite,
                            totalRemote: activeRemote,
                            totalEnrolled: totalActive,
                            totalCapacity,
                            totalSlots: monthlySlots,
                            prevSlots: prevMonthlySlots,
                            maxSlots: maxMonthlySlots,
                            estimatedRevenue,
                            enrollmentRate,
                            attendanceRate,
                            revenueHistory: [prevMonthlySlots, monthlySlots],
                            funnel: { inquiry, visit, trial, started: totalActive },
                        },
                    };
                });

                // 同名企業が複数ある場合、データ（利用者数）が最も多い方だけ残す
                const deduped = Object.values(
                    companiesData.reduce((acc, c) => {
                        const key = c.name;
                        if (!acc[key] || c.summary.totalEnrolled > acc[key].summary.totalEnrolled) {
                            acc[key] = c;
                        }
                        return acc;
                    }, {})
                );
                setCompanies(deduped);
                setStats({
                    totalCompanies: companiesSnap.size,
                    totalBranches: branchesSnap.size,
                    totalClients: clientsSnap.size,
                    totalUsers: usersSnap.size,
                });
            } catch (error) {
                console.error('データ取得エラー:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;

    const StatCard = ({ icon, label, value, color }) => (
        <Card sx={{ bgcolor: 'rgba(30, 41, 59, 0.8)', border: `1px solid ${color}30` }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ color, fontSize: 28 }}>{icon}</Box>
                    <Box>
                        <Typography variant="caption" color="text.secondary">{label}</Typography>
                        <Typography variant="h5" sx={{ color, fontWeight: 'bold' }}>{value}</Typography>
                    </Box>
                </Box>
            </CardContent>
        </Card>
    );

    // 要注意企業の分類
    const needsAttention = companies.filter(c => c.summary.attendanceRate < 60 || c.summary.enrollmentRate >= 90).length;
    const healthy = companies.filter(c => c.summary.attendanceRate >= 80 && c.summary.enrollmentRate < 90).length;

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold', background: 'linear-gradient(90deg, #8b5cf6, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                📊 プラットフォームダッシュボード
            </Typography>

            {/* サマリーカード */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={{ xs: 6, sm: 3 }}><StatCard icon={<BusinessIcon fontSize="inherit" />} label="登録企業数" value={stats.totalCompanies} color="#8b5cf6" /></Grid>
                <Grid size={{ xs: 6, sm: 3 }}><StatCard icon={<BusinessIcon fontSize="inherit" />} label="支店数" value={stats.totalBranches} color="#06b6d4" /></Grid>
                <Grid size={{ xs: 6, sm: 3 }}><StatCard icon={<PeopleIcon fontSize="inherit" />} label="利用者数" value={stats.totalClients} color="#10b981" /></Grid>
                <Grid size={{ xs: 6, sm: 3 }}><StatCard icon={<TrendingUpIcon fontSize="inherit" />} label="ユーザー数" value={stats.totalUsers} color="#f59e0b" /></Grid>
            </Grid>

            {/* ステータスサマリー */}
            <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                <Paper sx={{ p: 1.5, bgcolor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', minWidth: 120 }}>
                    <Typography sx={{ fontSize: '0.7rem', color: '#94a3b8' }}>良好企業</Typography>
                    <Typography sx={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#10b981' }}>{healthy}</Typography>
                </Paper>
                <Paper sx={{ p: 1.5, bgcolor: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', minWidth: 120 }}>
                    <Typography sx={{ fontSize: '0.7rem', color: '#94a3b8' }}>要テコ入れ</Typography>
                    <Typography sx={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#f59e0b' }}>{needsAttention}</Typography>
                </Paper>
            </Box>

            {/* 企業一覧テーブル */}
            <Paper sx={{ bgcolor: 'rgba(30, 41, 59, 0.8)', border: '1px solid rgba(6, 182, 212, 0.3)' }}>
                <Box sx={{ p: 2, borderBottom: '1px solid rgba(6, 182, 212, 0.2)' }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>🔍 企業別状況</Typography>
                    <Typography variant="caption" color="text.secondary">企業行をクリックで支店詳細 / 「入る →」でその企業として操作</Typography>
                </Box>
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: 'rgba(6, 182, 212, 0.1)' }}>
                                <TableCell sx={{ width: 40 }} />
                                <TableCell sx={{ color: '#94a3b8', fontWeight: 'bold', fontSize: '0.75rem' }}>企業名</TableCell>
                                <TableCell sx={{ color: '#94a3b8', fontWeight: 'bold', fontSize: '0.75rem' }}>ファネル（問合→見学→体験→利用）</TableCell>
                                <TableCell sx={{ color: '#94a3b8', fontWeight: 'bold', fontSize: '0.75rem', minWidth: 140 }}>稼働状況</TableCell>
                                <TableCell align="right" sx={{ color: '#94a3b8', fontWeight: 'bold', fontSize: '0.75rem' }}>月間コマ</TableCell>
                                <TableCell sx={{ color: '#94a3b8', fontWeight: 'bold', fontSize: '0.75rem' }}>推移</TableCell>
                                <TableCell align="right" sx={{ color: '#94a3b8', fontWeight: 'bold', fontSize: '0.75rem' }}>推定売上</TableCell>
                                <TableCell sx={{ color: '#94a3b8', fontWeight: 'bold', fontSize: '0.75rem' }}>状態</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {companies.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} sx={{ textAlign: 'center', py: 4, color: '#64748b' }}>
                                        企業データがありません
                                    </TableCell>
                                </TableRow>
                            ) : (
                                companies.map((company) => (
                                    <CompanyRow
                                        key={company.id}
                                        company={company}
                                        onEnter={(companyId) => {
                                            enterEmulatorMode(companyId);
                                            navigate('/');
                                        }}
                                    />
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            {/* 推定売上の注記 */}
            <Typography variant="caption" sx={{ color: '#475569', display: 'block', mt: 1 }}>
                ※ 推定売上 = 月間コマ数 × 基本単価（企業設定より）。単価未設定の場合は表示されません。
            </Typography>
        </Box>
    );
}
