// src/features/admin/PlatformDashboard.jsx
// プラットフォーム全体ダッシュボード（経営診断統合版）

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
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/index';

// =========================================
// モックデータ（3つのシナリオ企業）
// =========================================
const mockCompanies = [
    {
        id: 'company-1',
        name: '株式会社ハリボテサービス',
        type: 'facade',
        branches: [
            {
                id: 'branch-1-1', name: '広島本店', capacity: 20, enrolled: 20,
                monthlySlots: 240, maxMonthlySlots: 400, unitPrice: 8500,
                staffCount: 4, requiredStaff: 3,
                funnel: { inquiry: 15, visit: 12, trial: 8, started: 6 },
                revenueHistory: [180, 195, 210, 240], riskLevel: 'warning',
            },
        ],
        summary: {
            totalCapacity: 20, totalEnrolled: 20, totalSlots: 240, maxSlots: 400,
            estimatedRevenue: 2040000, enrollmentRate: 100, attendanceRate: 60
        },
    },
    {
        id: 'company-2',
        name: '株式会社ギリギリ支援',
        type: 'staffRisk',
        branches: [
            {
                id: 'branch-2-1', name: '東京事業所', capacity: 20, enrolled: 17,
                monthlySlots: 312, maxMonthlySlots: 340, unitPrice: 9200,
                staffCount: 2, requiredStaff: 3,
                funnel: { inquiry: 20, visit: 18, trial: 15, started: 12 },
                revenueHistory: [280, 295, 305, 312], riskLevel: 'critical',
            },
            {
                id: 'branch-2-2', name: '横浜支店', capacity: 20, enrolled: 18,
                monthlySlots: 324, maxMonthlySlots: 360, unitPrice: 8800,
                staffCount: 2, requiredStaff: 3,
                funnel: { inquiry: 18, visit: 15, trial: 12, started: 10 },
                revenueHistory: [260, 280, 300, 324], riskLevel: 'critical',
            },
        ],
        summary: {
            totalCapacity: 40, totalEnrolled: 35, totalSlots: 636, maxSlots: 700,
            estimatedRevenue: 5731200, enrollmentRate: 87.5, attendanceRate: 91
        },
    },
    {
        id: 'company-3',
        name: '株式会社エクセレント福祉',
        type: 'excellent',
        branches: [
            {
                id: 'branch-3-1', name: '名古屋本社', capacity: 20, enrolled: 18,
                monthlySlots: 342, maxMonthlySlots: 360, unitPrice: 9500,
                staffCount: 4, requiredStaff: 3,
                funnel: { inquiry: 25, visit: 23, trial: 20, started: 18 },
                revenueHistory: [320, 335, 340, 342], riskLevel: 'healthy',
            },
            {
                id: 'branch-3-2', name: '大阪支店', capacity: 20, enrolled: 19,
                monthlySlots: 361, maxMonthlySlots: 380, unitPrice: 9200,
                staffCount: 4, requiredStaff: 3,
                funnel: { inquiry: 22, visit: 20, trial: 18, started: 16 },
                revenueHistory: [300, 320, 345, 361], riskLevel: 'healthy',
            },
        ],
        summary: {
            totalCapacity: 40, totalEnrolled: 37, totalSlots: 703, maxSlots: 740,
            estimatedRevenue: 6570100, enrollmentRate: 92.5, attendanceRate: 95
        },
    },
];

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

// 二重プログレスバー
const DualProgressBar = ({ enrollmentRate, attendanceRate }) => {
    const getColor = (rate) => rate >= 80 ? '#10b981' : rate >= 60 ? '#f59e0b' : '#ef4444';
    return (
        <Box sx={{ width: '100%', minWidth: 120 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                <Typography sx={{ fontSize: '0.6rem', color: '#94a3b8', width: 40 }}>在籍</Typography>
                <Box sx={{ flexGrow: 1, mr: 1 }}>
                    <LinearProgress variant="determinate" value={enrollmentRate} sx={{
                        height: 6, borderRadius: 1, bgcolor: 'rgba(148, 163, 184, 0.2)',
                        '& .MuiLinearProgress-bar': { bgcolor: '#3b82f6', borderRadius: 1 },
                    }} />
                </Box>
                <Typography sx={{ fontSize: '0.7rem', color: '#3b82f6', fontWeight: 'bold', width: 35 }}>{enrollmentRate}%</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography sx={{ fontSize: '0.6rem', color: '#94a3b8', width: 40 }}>出席</Typography>
                <Box sx={{ flexGrow: 1, mr: 1 }}>
                    <LinearProgress variant="determinate" value={attendanceRate} sx={{
                        height: 6, borderRadius: 1, bgcolor: 'rgba(148, 163, 184, 0.2)',
                        '& .MuiLinearProgress-bar': { bgcolor: getColor(attendanceRate), borderRadius: 1 },
                    }} />
                </Box>
                <Typography sx={{ fontSize: '0.7rem', color: getColor(attendanceRate), fontWeight: 'bold', width: 35 }}>{attendanceRate}%</Typography>
            </Box>
        </Box>
    );
};

// スパークライン
const Sparkline = ({ data, width = 80, height = 24 }) => {
    if (!data || data.length === 0) return null;
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
const RiskBadge = ({ staffCount, requiredStaff, attendanceRate }) => {
    const badges = [];
    if (staffCount < requiredStaff) {
        badges.push(<Tooltip key="staff" title={`スタッフ ${staffCount}名 / 必要 ${requiredStaff}名`}>
            <Chip icon={<ErrorIcon sx={{ fontSize: 14 }} />} label="人員欠如" size="small" sx={{
                bgcolor: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', fontSize: '0.65rem', height: 22, '& .MuiChip-icon': { color: '#ef4444' },
            }} />
        </Tooltip>);
    }
    if (attendanceRate < 70) {
        badges.push(<Tooltip key="rating" title="出席率低下による算定ランクダウンリスク">
            <Chip icon={<WarningAmberIcon sx={{ fontSize: 14 }} />} label="算定↓" size="small" sx={{
                bgcolor: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', fontSize: '0.65rem', height: 22, '& .MuiChip-icon': { color: '#f59e0b' },
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
const CompanyRow = ({ company }) => {
    const [open, setOpen] = useState(false);
    const { summary } = company;
    const hasStaffRisk = company.branches.some(b => b.staffCount < b.requiredStaff);
    return (
        <>
            <TableRow hover onClick={() => setOpen(!open)} sx={{ cursor: 'pointer', bgcolor: open ? 'rgba(59, 130, 246, 0.1)' : 'transparent', '&:hover': { bgcolor: 'rgba(59, 130, 246, 0.15)' } }}>
                <TableCell sx={{ width: 40, p: 1 }}>
                    <IconButton size="small" sx={{ color: '#94a3b8' }}>{open ? <KeyboardArrowDownIcon /> : <KeyboardArrowRightIcon />}</IconButton>
                </TableCell>
                <TableCell>
                    <Box>
                        <Typography sx={{ fontWeight: 'bold', color: '#f8fafc', fontSize: '0.9rem' }}>{company.name}</Typography>
                        <Typography sx={{ fontSize: '0.7rem', color: '#64748b' }}><GroupsIcon sx={{ fontSize: 12, mr: 0.5, verticalAlign: 'middle' }} />{company.branches.length} 拠点</Typography>
                    </Box>
                </TableCell>
                <TableCell><Typography sx={{ fontSize: '0.7rem', color: '#64748b' }}>─</Typography></TableCell>
                <TableCell><DualProgressBar enrollmentRate={summary.enrollmentRate} attendanceRate={summary.attendanceRate} /></TableCell>
                <TableCell align="right">
                    <Typography sx={{ fontSize: '0.85rem', color: '#f8fafc', fontWeight: 'bold' }}>{summary.totalSlots.toLocaleString()}</Typography>
                    <Typography sx={{ fontSize: '0.65rem', color: '#64748b' }}>/ {summary.maxSlots.toLocaleString()} コマ</Typography>
                </TableCell>
                <TableCell><Sparkline data={company.branches[0]?.revenueHistory || []} /></TableCell>
                <TableCell align="right"><Typography sx={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 'bold' }}>¥{(summary.estimatedRevenue / 10000).toFixed(0)}万</Typography></TableCell>
                <TableCell><RiskBadge staffCount={hasStaffRisk ? 0 : 1} requiredStaff={hasStaffRisk ? 1 : 0} attendanceRate={summary.attendanceRate} /></TableCell>
            </TableRow>
            <TableRow>
                <TableCell colSpan={8} sx={{ p: 0, border: 0 }}>
                    <Collapse in={open} timeout="auto" unmountOnExit>
                        <Box sx={{ bgcolor: 'rgba(15, 23, 42, 0.8)', py: 1, px: 2 }}>
                            {company.branches.map((branch) => {
                                const branchEnrollmentRate = Math.round((branch.enrolled / branch.capacity) * 100);
                                const branchAttendanceRate = Math.round((branch.monthlySlots / branch.maxMonthlySlots) * 100);
                                return (
                                    <Box key={branch.id} sx={{ display: 'grid', gridTemplateColumns: '40px 1fr 200px 140px 80px 100px 80px 120px', alignItems: 'center', py: 1, borderBottom: '1px solid rgba(148, 163, 184, 0.1)', '&:last-child': { borderBottom: 0 } }}>
                                        <Box />
                                        <Box>
                                            <Typography sx={{ fontSize: '0.85rem', color: '#cbd5e1' }}>└ {branch.name}</Typography>
                                            <Typography sx={{ fontSize: '0.65rem', color: '#8b5cf6' }}>算定単価: ¥{branch.unitPrice.toLocaleString()}</Typography>
                                        </Box>
                                        <FunnelDisplay funnel={branch.funnel} />
                                        <DualProgressBar enrollmentRate={branchEnrollmentRate} attendanceRate={branchAttendanceRate} />
                                        <Typography sx={{ fontSize: '0.8rem', color: '#94a3b8', textAlign: 'right' }}>{branch.monthlySlots}</Typography>
                                        <Sparkline data={branch.revenueHistory} width={60} height={20} />
                                        <Typography sx={{ fontSize: '0.8rem', color: '#94a3b8', textAlign: 'right' }}>¥{((branch.monthlySlots * branch.unitPrice) / 10000).toFixed(0)}万</Typography>
                                        <RiskBadge staffCount={branch.staffCount} requiredStaff={branch.requiredStaff} attendanceRate={branchAttendanceRate} />
                                    </Box>
                                );
                            })}
                        </Box>
                    </Collapse>
                </TableCell>
            </TableRow>
        </>
    );
};

export default function PlatformDashboard() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [companies, setCompanies] = useState([]);
    const [expandedCompanies, setExpandedCompanies] = useState({});
    const [stats, setStats] = useState({ totalCompanies: 0, totalBranches: 0, totalClients: 0, totalUsers: 0 });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const companiesSnap = await getDocs(collection(db, 'companies'));
                const branchesSnap = await getDocs(collection(db, 'branches'));
                const clientsQuery = query(collection(db, 'clients'), where('status', 'in', ['active_onsite', 'active_remote']));
                const clientsSnap = await getDocs(clientsQuery);
                const usersSnap = await getDocs(collection(db, 'users'));
                setStats({ totalCompanies: companiesSnap.size, totalBranches: branchesSnap.size, totalClients: clientsSnap.size, totalUsers: usersSnap.size });
            } catch (error) { console.error('データ取得エラー:', error); }
            finally { setLoading(false); }
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

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold', background: 'linear-gradient(90deg, #8b5cf6, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                📊 プラットフォームダッシュボード
            </Typography>

            {/* サマリーカード */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6} sm={3}><StatCard icon={<BusinessIcon fontSize="inherit" />} label="登録企業数" value={stats.totalCompanies} color="#8b5cf6" /></Grid>
                <Grid item xs={6} sm={3}><StatCard icon={<BusinessIcon fontSize="inherit" />} label="支店数" value={stats.totalBranches} color="#06b6d4" /></Grid>
                <Grid item xs={6} sm={3}><StatCard icon={<PeopleIcon fontSize="inherit" />} label="利用者数" value={stats.totalClients} color="#10b981" /></Grid>
                <Grid item xs={6} sm={3}><StatCard icon={<TrendingUpIcon fontSize="inherit" />} label="ユーザー数" value={stats.totalUsers} color="#f59e0b" /></Grid>
            </Grid>

            {/* 経営診断セクション */}
            <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                <Paper sx={{ p: 1.5, bgcolor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', minWidth: 120 }}>
                    <Typography sx={{ fontSize: '0.7rem', color: '#94a3b8' }}>優良企業</Typography>
                    <Typography sx={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#10b981' }}>{mockCompanies.filter(c => c.type === 'excellent').length}</Typography>
                </Paper>
                <Paper sx={{ p: 1.5, bgcolor: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', minWidth: 120 }}>
                    <Typography sx={{ fontSize: '0.7rem', color: '#94a3b8' }}>要観察企業</Typography>
                    <Typography sx={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#f59e0b' }}>{mockCompanies.filter(c => c.type === 'facade').length}</Typography>
                </Paper>
                <Paper sx={{ p: 1.5, bgcolor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', minWidth: 120 }}>
                    <Typography sx={{ fontSize: '0.7rem', color: '#94a3b8' }}>リスク企業</Typography>
                    <Typography sx={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#ef4444' }}>{mockCompanies.filter(c => c.type === 'staffRisk').length}</Typography>
                </Paper>
            </Box>

            {/* 経営診断テーブル */}
            <Paper sx={{ bgcolor: 'rgba(30, 41, 59, 0.8)', border: '1px solid rgba(6, 182, 212, 0.3)' }}>
                <Box sx={{ p: 2, borderBottom: '1px solid rgba(6, 182, 212, 0.2)' }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>🔍 経営診断リスト</Typography>
                    <Typography variant="caption" color="text.secondary">企業行をクリックで支店詳細を展開</Typography>
                </Box>
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: 'rgba(6, 182, 212, 0.1)' }}>
                                <TableCell sx={{ width: 40 }} />
                                <TableCell sx={{ color: '#94a3b8', fontWeight: 'bold', fontSize: '0.75rem' }}>企業名 / 拠点</TableCell>
                                <TableCell sx={{ color: '#94a3b8', fontWeight: 'bold', fontSize: '0.75rem' }}>ファネル</TableCell>
                                <TableCell sx={{ color: '#94a3b8', fontWeight: 'bold', fontSize: '0.75rem', minWidth: 140 }}>稼働状況</TableCell>
                                <TableCell align="right" sx={{ color: '#94a3b8', fontWeight: 'bold', fontSize: '0.75rem' }}>月間コマ</TableCell>
                                <TableCell sx={{ color: '#94a3b8', fontWeight: 'bold', fontSize: '0.75rem' }}>売上推移</TableCell>
                                <TableCell align="right" sx={{ color: '#94a3b8', fontWeight: 'bold', fontSize: '0.75rem' }}>推定売上</TableCell>
                                <TableCell sx={{ color: '#94a3b8', fontWeight: 'bold', fontSize: '0.75rem' }}>リスク</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {mockCompanies.map((company) => <CompanyRow key={company.id} company={company} />)}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            {/* 凡例 */}
            <Box sx={{ mt: 2, display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Box sx={{ width: 10, height: 10, bgcolor: '#10b981', borderRadius: 0.5 }} /><Typography sx={{ fontSize: '0.7rem', color: '#64748b' }}>健全（80%以上）</Typography></Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Box sx={{ width: 10, height: 10, bgcolor: '#f59e0b', borderRadius: 0.5 }} /><Typography sx={{ fontSize: '0.7rem', color: '#64748b' }}>注意（60-80%）</Typography></Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Box sx={{ width: 10, height: 10, bgcolor: '#ef4444', borderRadius: 0.5 }} /><Typography sx={{ fontSize: '0.7rem', color: '#64748b' }}>警告（60%未満）</Typography></Box>
            </Box>
        </Box>
    );
}
