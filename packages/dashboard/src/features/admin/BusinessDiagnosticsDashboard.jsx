// src/features/admin/BusinessDiagnosticsDashboard.jsx
// プラットフォームオーナー向け経営診断ダッシュボード

import { useState } from 'react';
import {
    Box,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Collapse,
    IconButton,
    Chip,
    LinearProgress,
    Tooltip,
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ErrorIcon from '@mui/icons-material/Error';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import GroupsIcon from '@mui/icons-material/Groups';

// =========================================
// モックデータ（3つのシナリオ企業）
// =========================================
const mockCompanies = [
    {
        id: 'company-1',
        name: '株式会社ハリボテサービス',
        type: 'facade', // 見かけ倒し型
        branches: [
            {
                id: 'branch-1-1',
                name: '広島本店',
                capacity: 20,
                enrolled: 20,        // 在籍数（定員100%）
                monthlySlots: 240,   // 月間コマ数（実績）
                maxMonthlySlots: 400, // 月間最大コマ数（定員×営業日20日）
                unitPrice: 8500,     // 算定単価
                staffCount: 4,
                requiredStaff: 3,    // 必要スタッフ数
                funnel: { inquiry: 15, visit: 12, trial: 8, started: 6 },
                revenueHistory: [180, 195, 210, 240], // 過去3ヶ月+当月
                riskLevel: 'warning',
            },
        ],
        summary: {
            totalCapacity: 20,
            totalEnrolled: 20,
            totalSlots: 240,
            maxSlots: 400,
            estimatedRevenue: 2040000,
            enrollmentRate: 100,
            attendanceRate: 60,
        },
    },
    {
        id: 'company-2',
        name: '株式会社ギリギリ支援',
        type: 'staffRisk', // 配置リスク型
        branches: [
            {
                id: 'branch-2-1',
                name: '東京事業所',
                capacity: 20,
                enrolled: 17,
                monthlySlots: 312,
                maxMonthlySlots: 340,
                unitPrice: 9200,
                staffCount: 2,       // スタッフ不足！
                requiredStaff: 3,
                funnel: { inquiry: 20, visit: 18, trial: 15, started: 12 },
                revenueHistory: [280, 295, 305, 312],
                riskLevel: 'critical',
            },
            {
                id: 'branch-2-2',
                name: '横浜支店',
                capacity: 20,
                enrolled: 18,
                monthlySlots: 324,
                maxMonthlySlots: 360,
                unitPrice: 8800,
                staffCount: 2,
                requiredStaff: 3,
                funnel: { inquiry: 18, visit: 15, trial: 12, started: 10 },
                revenueHistory: [260, 280, 300, 324],
                riskLevel: 'critical',
            },
        ],
        summary: {
            totalCapacity: 40,
            totalEnrolled: 35,
            totalSlots: 636,
            maxSlots: 700,
            estimatedRevenue: 5731200,
            enrollmentRate: 87.5,
            attendanceRate: 91,
        },
    },
    {
        id: 'company-3',
        name: '株式会社エクセレント福祉',
        type: 'excellent', // 優良経営型
        branches: [
            {
                id: 'branch-3-1',
                name: '名古屋本社',
                capacity: 20,
                enrolled: 18,
                monthlySlots: 342,
                maxMonthlySlots: 360,
                unitPrice: 9500,
                staffCount: 4,
                requiredStaff: 3,
                funnel: { inquiry: 25, visit: 23, trial: 20, started: 18 },
                revenueHistory: [320, 335, 340, 342],
                riskLevel: 'healthy',
            },
            {
                id: 'branch-3-2',
                name: '大阪支店',
                capacity: 20,
                enrolled: 19,
                monthlySlots: 361,
                maxMonthlySlots: 380,
                unitPrice: 9200,
                staffCount: 4,
                requiredStaff: 3,
                funnel: { inquiry: 22, visit: 20, trial: 18, started: 16 },
                revenueHistory: [300, 320, 345, 361],
                riskLevel: 'healthy',
            },
        ],
        summary: {
            totalCapacity: 40,
            totalEnrolled: 37,
            totalSlots: 703,
            maxSlots: 740,
            estimatedRevenue: 6570100,
            enrollmentRate: 92.5,
            attendanceRate: 95,
        },
    },
];

// =========================================
// サブコンポーネント
// =========================================

// ファネル表示コンポーネント
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
                            <Chip
                                label={step.value}
                                size="small"
                                sx={{
                                    bgcolor: isHighDrop && index > 0 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                                    color: isHighDrop && index > 0 ? '#ef4444' : '#3b82f6',
                                    fontWeight: 'bold',
                                    fontSize: '0.7rem',
                                    height: 24,
                                    minWidth: 32,
                                }}
                            />
                        </Tooltip>
                        {index < steps.length - 1 && (
                            <Typography
                                sx={{
                                    mx: 0.5,
                                    fontSize: '0.65rem',
                                    color: isHighDrop ? '#ef4444' : '#64748b',
                                    fontWeight: isHighDrop ? 'bold' : 'normal',
                                }}
                            >
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
    const getColor = (rate) => {
        if (rate >= 80) return '#10b981';
        if (rate >= 60) return '#f59e0b';
        return '#ef4444';
    };

    return (
        <Box sx={{ width: '100%', minWidth: 120 }}>
            {/* 在籍率 */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                <Typography sx={{ fontSize: '0.6rem', color: '#94a3b8', width: 40 }}>在籍</Typography>
                <Box sx={{ flexGrow: 1, mr: 1 }}>
                    <LinearProgress
                        variant="determinate"
                        value={enrollmentRate}
                        sx={{
                            height: 6,
                            borderRadius: 1,
                            bgcolor: 'rgba(148, 163, 184, 0.2)',
                            '& .MuiLinearProgress-bar': {
                                bgcolor: '#3b82f6',
                                borderRadius: 1,
                            },
                        }}
                    />
                </Box>
                <Typography sx={{ fontSize: '0.7rem', color: '#3b82f6', fontWeight: 'bold', width: 35 }}>
                    {enrollmentRate}%
                </Typography>
            </Box>
            {/* 出席率 */}
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography sx={{ fontSize: '0.6rem', color: '#94a3b8', width: 40 }}>出席</Typography>
                <Box sx={{ flexGrow: 1, mr: 1 }}>
                    <LinearProgress
                        variant="determinate"
                        value={attendanceRate}
                        sx={{
                            height: 6,
                            borderRadius: 1,
                            bgcolor: 'rgba(148, 163, 184, 0.2)',
                            '& .MuiLinearProgress-bar': {
                                bgcolor: getColor(attendanceRate),
                                borderRadius: 1,
                            },
                        }}
                    />
                </Box>
                <Typography sx={{ fontSize: '0.7rem', color: getColor(attendanceRate), fontWeight: 'bold', width: 35 }}>
                    {attendanceRate}%
                </Typography>
            </Box>
        </Box>
    );
};

// スパークライン（SVGで簡易実装）
const Sparkline = ({ data, width = 80, height = 24 }) => {
    if (!data || data.length === 0) return null;

    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;

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
                <polyline
                    points={points}
                    fill="none"
                    stroke={color}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                {/* 最後の点を強調 */}
                <circle
                    cx={width}
                    cy={height - ((data[data.length - 1] - min) / range) * (height - 4) - 2}
                    r="3"
                    fill={color}
                />
            </svg>
            {trend ? (
                <TrendingUpIcon sx={{ fontSize: 16, color: '#10b981' }} />
            ) : (
                <TrendingDownIcon sx={{ fontSize: 16, color: '#ef4444' }} />
            )}
        </Box>
    );
};

// リスクバッジ
const RiskBadge = ({ riskLevel, staffCount, requiredStaff, attendanceRate }) => {
    const badges = [];

    // 人員配置リスク
    if (staffCount < requiredStaff) {
        badges.push(
            <Tooltip key="staff" title={`スタッフ ${staffCount}名 / 必要 ${requiredStaff}名`}>
                <Chip
                    icon={<ErrorIcon sx={{ fontSize: 14 }} />}
                    label="人員欠如"
                    size="small"
                    sx={{
                        bgcolor: 'rgba(239, 68, 68, 0.15)',
                        color: '#ef4444',
                        fontSize: '0.65rem',
                        height: 22,
                        '& .MuiChip-icon': { color: '#ef4444' },
                    }}
                />
            </Tooltip>
        );
    }

    // 算定ダウン警告（出席率70%以下）
    if (attendanceRate < 70) {
        badges.push(
            <Tooltip key="rating" title="出席率低下による算定ランクダウンリスク">
                <Chip
                    icon={<WarningAmberIcon sx={{ fontSize: 14 }} />}
                    label="算定↓"
                    size="small"
                    sx={{
                        bgcolor: 'rgba(245, 158, 11, 0.15)',
                        color: '#f59e0b',
                        fontSize: '0.65rem',
                        height: 22,
                        '& .MuiChip-icon': { color: '#f59e0b' },
                    }}
                />
            </Tooltip>
        );
    }

    // 健全
    if (badges.length === 0 && riskLevel === 'healthy') {
        badges.push(
            <Chip
                key="ok"
                icon={<CheckCircleIcon sx={{ fontSize: 14 }} />}
                label="良好"
                size="small"
                sx={{
                    bgcolor: 'rgba(16, 185, 129, 0.15)',
                    color: '#10b981',
                    fontSize: '0.65rem',
                    height: 22,
                    '& .MuiChip-icon': { color: '#10b981' },
                }}
            />
        );
    }

    return <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>{badges}</Box>;
};

// 企業行コンポーネント
const CompanyRow = ({ company }) => {
    const [open, setOpen] = useState(false);
    const { summary } = company;

    // 企業全体のリスク判定
    const hasStaffRisk = company.branches.some(b => b.staffCount < b.requiredStaff);
    const hasRatingRisk = summary.attendanceRate < 70;

    return (
        <>
            {/* 親行（企業計） */}
            <TableRow
                hover
                onClick={() => setOpen(!open)}
                sx={{
                    cursor: 'pointer',
                    bgcolor: open ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                    '&:hover': { bgcolor: 'rgba(59, 130, 246, 0.15)' },
                }}
            >
                {/* 展開アイコン */}
                <TableCell sx={{ width: 40, p: 1 }}>
                    <IconButton size="small" sx={{ color: '#94a3b8' }}>
                        {open ? <KeyboardArrowDownIcon /> : <KeyboardArrowRightIcon />}
                    </IconButton>
                </TableCell>

                {/* 企業名・拠点数 */}
                <TableCell>
                    <Box>
                        <Typography sx={{ fontWeight: 'bold', color: '#f8fafc', fontSize: '0.9rem' }}>
                            {company.name}
                        </Typography>
                        <Typography sx={{ fontSize: '0.7rem', color: '#64748b' }}>
                            <GroupsIcon sx={{ fontSize: 12, mr: 0.5, verticalAlign: 'middle' }} />
                            {company.branches.length} 拠点
                        </Typography>
                    </Box>
                </TableCell>

                {/* ファネル（企業合計は非表示） */}
                <TableCell>
                    <Typography sx={{ fontSize: '0.7rem', color: '#64748b' }}>
                        ─
                    </Typography>
                </TableCell>

                {/* 稼働状況 */}
                <TableCell>
                    <DualProgressBar
                        enrollmentRate={summary.enrollmentRate}
                        attendanceRate={summary.attendanceRate}
                    />
                </TableCell>

                {/* 月間コマ数 */}
                <TableCell align="right">
                    <Typography sx={{ fontSize: '0.85rem', color: '#f8fafc', fontWeight: 'bold' }}>
                        {summary.totalSlots.toLocaleString()}
                    </Typography>
                    <Typography sx={{ fontSize: '0.65rem', color: '#64748b' }}>
                        / {summary.maxSlots.toLocaleString()} コマ
                    </Typography>
                </TableCell>

                {/* 売上推移 */}
                <TableCell>
                    <Sparkline data={company.branches[0]?.revenueHistory || []} />
                </TableCell>

                {/* 推定売上 */}
                <TableCell align="right">
                    <Typography sx={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 'bold' }}>
                        ¥{(summary.estimatedRevenue / 10000).toFixed(0)}万
                    </Typography>
                </TableCell>

                {/* リスク */}
                <TableCell>
                    <RiskBadge
                        riskLevel={hasStaffRisk || hasRatingRisk ? 'warning' : 'healthy'}
                        staffCount={hasStaffRisk ? 0 : 1}
                        requiredStaff={hasStaffRisk ? 1 : 0}
                        attendanceRate={summary.attendanceRate}
                    />
                </TableCell>
            </TableRow>

            {/* 子行（支店詳細）- アコーディオン */}
            <TableRow>
                <TableCell colSpan={8} sx={{ p: 0, border: 0 }}>
                    <Collapse in={open} timeout="auto" unmountOnExit>
                        <Box sx={{ bgcolor: 'rgba(15, 23, 42, 0.8)', py: 1, px: 2 }}>
                            {company.branches.map((branch) => {
                                const branchEnrollmentRate = Math.round((branch.enrolled / branch.capacity) * 100);
                                const branchAttendanceRate = Math.round((branch.monthlySlots / branch.maxMonthlySlots) * 100);

                                return (
                                    <Box
                                        key={branch.id}
                                        sx={{
                                            display: 'grid',
                                            gridTemplateColumns: '40px 1fr 200px 140px 80px 100px 80px 120px',
                                            alignItems: 'center',
                                            py: 1,
                                            borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
                                            '&:last-child': { borderBottom: 0 },
                                        }}
                                    >
                                        {/* スペーサー */}
                                        <Box />

                                        {/* 支店名 + 算定区分 */}
                                        <Box>
                                            <Typography sx={{ fontSize: '0.85rem', color: '#cbd5e1' }}>
                                                └ {branch.name}
                                            </Typography>
                                            <Typography sx={{ fontSize: '0.65rem', color: '#8b5cf6' }}>
                                                算定単価: ¥{branch.unitPrice.toLocaleString()}
                                            </Typography>
                                        </Box>

                                        {/* ファネル */}
                                        <FunnelDisplay funnel={branch.funnel} />

                                        {/* 稼働状況 */}
                                        <DualProgressBar
                                            enrollmentRate={branchEnrollmentRate}
                                            attendanceRate={branchAttendanceRate}
                                        />

                                        {/* コマ数 */}
                                        <Typography sx={{ fontSize: '0.8rem', color: '#94a3b8', textAlign: 'right' }}>
                                            {branch.monthlySlots}
                                        </Typography>

                                        {/* スパークライン */}
                                        <Sparkline data={branch.revenueHistory} width={60} height={20} />

                                        {/* 売上 */}
                                        <Typography sx={{ fontSize: '0.8rem', color: '#94a3b8', textAlign: 'right' }}>
                                            ¥{((branch.monthlySlots * branch.unitPrice) / 10000).toFixed(0)}万
                                        </Typography>

                                        {/* リスク */}
                                        <RiskBadge
                                            riskLevel={branch.riskLevel}
                                            staffCount={branch.staffCount}
                                            requiredStaff={branch.requiredStaff}
                                            attendanceRate={branchAttendanceRate}
                                        />
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

// =========================================
// メインコンポーネント
// =========================================
export default function BusinessDiagnosticsDashboard() {
    return (
        <Box sx={{ p: 3 }}>
            <Typography
                variant="h4"
                sx={{
                    mb: 4,
                    fontWeight: 'bold',
                    background: 'linear-gradient(90deg, #8b5cf6, #06b6d4)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                }}
            >
                🔍 経営診断ダッシュボード
            </Typography>

            {/* サマリーカード */}
            <Box sx={{ display: 'flex', gap: 2, mb: 4, flexWrap: 'wrap' }}>
                <Paper sx={{ p: 2, bgcolor: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', minWidth: 150 }}>
                    <Typography sx={{ fontSize: '0.75rem', color: '#94a3b8' }}>登録企業数</Typography>
                    <Typography sx={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#3b82f6' }}>
                        {mockCompanies.length}
                    </Typography>
                </Paper>
                <Paper sx={{ p: 2, bgcolor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', minWidth: 150 }}>
                    <Typography sx={{ fontSize: '0.75rem', color: '#94a3b8' }}>優良企業</Typography>
                    <Typography sx={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>
                        {mockCompanies.filter(c => c.type === 'excellent').length}
                    </Typography>
                </Paper>
                <Paper sx={{ p: 2, bgcolor: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', minWidth: 150 }}>
                    <Typography sx={{ fontSize: '0.75rem', color: '#94a3b8' }}>要観察企業</Typography>
                    <Typography sx={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f59e0b' }}>
                        {mockCompanies.filter(c => c.type === 'facade').length}
                    </Typography>
                </Paper>
                <Paper sx={{ p: 2, bgcolor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', minWidth: 150 }}>
                    <Typography sx={{ fontSize: '0.75rem', color: '#94a3b8' }}>リスク企業</Typography>
                    <Typography sx={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ef4444' }}>
                        {mockCompanies.filter(c => c.type === 'staffRisk').length}
                    </Typography>
                </Paper>
            </Box>

            {/* 経営診断テーブル */}
            <Paper sx={{ bgcolor: 'rgba(30, 41, 59, 0.8)', border: '1px solid rgba(6, 182, 212, 0.3)' }}>
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: 'rgba(6, 182, 212, 0.1)' }}>
                                <TableCell sx={{ width: 40 }} />
                                <TableCell sx={{ color: '#94a3b8', fontWeight: 'bold', fontSize: '0.75rem' }}>
                                    企業名 / 拠点
                                </TableCell>
                                <TableCell sx={{ color: '#94a3b8', fontWeight: 'bold', fontSize: '0.75rem' }}>
                                    ファネル (問合せ→利用開始)
                                </TableCell>
                                <TableCell sx={{ color: '#94a3b8', fontWeight: 'bold', fontSize: '0.75rem', minWidth: 140 }}>
                                    稼働状況 (在籍/出席)
                                </TableCell>
                                <TableCell align="right" sx={{ color: '#94a3b8', fontWeight: 'bold', fontSize: '0.75rem' }}>
                                    月間コマ
                                </TableCell>
                                <TableCell sx={{ color: '#94a3b8', fontWeight: 'bold', fontSize: '0.75rem' }}>
                                    売上推移
                                </TableCell>
                                <TableCell align="right" sx={{ color: '#94a3b8', fontWeight: 'bold', fontSize: '0.75rem' }}>
                                    推定売上
                                </TableCell>
                                <TableCell sx={{ color: '#94a3b8', fontWeight: 'bold', fontSize: '0.75rem' }}>
                                    リスク
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {mockCompanies.map((company) => (
                                <CompanyRow key={company.id} company={company} />
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            {/* 凡例 */}
            <Box sx={{ mt: 3, display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 12, height: 12, bgcolor: '#10b981', borderRadius: 0.5 }} />
                    <Typography sx={{ fontSize: '0.75rem', color: '#94a3b8' }}>健全（80%以上）</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 12, height: 12, bgcolor: '#f59e0b', borderRadius: 0.5 }} />
                    <Typography sx={{ fontSize: '0.75rem', color: '#94a3b8' }}>注意（60-80%）</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 12, height: 12, bgcolor: '#ef4444', borderRadius: 0.5 }} />
                    <Typography sx={{ fontSize: '0.75rem', color: '#94a3b8' }}>警告（60%未満）</Typography>
                </Box>
            </Box>
        </Box>
    );
}
