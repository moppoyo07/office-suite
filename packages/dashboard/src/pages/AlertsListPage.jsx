import { useState, useMemo } from 'react';
import {
    Box,
    Paper,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TableSortLabel,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip,
    IconButton,
    Stack,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { useNotificationAlerts } from '../hooks/useNotificationAlerts';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import FilterListIcon from '@mui/icons-material/FilterList';

// アラート種別のラベルマップ
const ALERT_TYPE_LABELS = {
    followUp1: '定着1ヶ月面談',
    followUp2: '定着2ヶ月面談',
    followUp3: '定着3ヶ月面談',
    followUp4: '定着4ヶ月面談',
    followUp5: '定着5ヶ月面談',
    followUp6: '定着6ヶ月面談',
    interview: '見学予定',
    trial: '体験開始',
    recipientExpiry: '受給者証期限',
    provisionalPeriod: '暫定期間終了',
    quest: '本日のクエスト',
};

// 色設定
const COLOR_CONFIG = {
    red: { bg: '#ef4444', text: '#fff', label: '緊急' },
    yellow: { bg: '#f59e0b', text: '#000', label: '警告' },
    blue: { bg: '#3b82f6', text: '#fff', label: '通知' },
    purple: { bg: '#a855f7', text: '#fff', label: 'タスク' },
};

export default function AlertsListPage() {
    const navigate = useNavigate();
    const { alerts, loading } = useNotificationAlerts();
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [sortBy, setSortBy] = useState('daysUntil'); // daysUntil or clientName
    const [sortOrder, setSortOrder] = useState('asc'); // asc or desc

    // フィルタリング・ソート処理
    const filteredAlerts = useMemo(() => {
        let result = [...alerts];

        // 検索フィルタ
        if (searchQuery) {
            result = result.filter(alert =>
                alert.clientName.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // 種別フィルタ
        if (typeFilter !== 'all') {
            result = result.filter(alert => alert.type === typeFilter);
        }

        // ソート
        result.sort((a, b) => {
            let compareValue = 0;
            if (sortBy === 'daysUntil') {
                compareValue = a.daysUntil - b.daysUntil;
            } else if (sortBy === 'clientName') {
                compareValue = a.clientName.localeCompare(b.clientName, 'ja');
            }
            return sortOrder === 'asc' ? compareValue : -compareValue;
        });

        return result;
    }, [alerts, searchQuery, typeFilter, sortBy, sortOrder]);

    // ソート変更ハンドラ
    const handleSort = (column) => {
        if (sortBy === column) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(column);
            setSortOrder('asc');
        }
    };

    // 顧客詳細へ遷移
    const handleNavigateToClient = (clientId) => {
        if (clientId === 'system') return; // システムアラートはスキップ
        navigate(`/clients/${clientId}`);
    };

    // アラート種別のユニークリスト
    const alertTypes = useMemo(() => {
        const types = new Set(alerts.map(a => a.type));
        return Array.from(types);
    }, [alerts]);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <Typography>読み込み中...</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            {/* ヘッダー */}
            <Stack direction="row" alignItems="center" spacing={2} mb={3}>
                <NotificationsActiveIcon sx={{ fontSize: 32, color: '#3b82f6' }} />
                <Typography variant="h5" fontWeight="bold">
                    アラート一覧
                </Typography>
                <Chip
                    label={`${filteredAlerts.length}件`}
                    color="primary"
                    size="small"
                />
            </Stack>

            {/* フィルタ・検索バー */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
                    <FilterListIcon sx={{ color: '#64748b' }} />
                    <TextField
                        size="small"
                        label="顧客名で検索"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        sx={{ minWidth: 200 }}
                    />
                    <FormControl size="small" sx={{ minWidth: 200 }}>
                        <InputLabel>種別</InputLabel>
                        <Select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            label="種別"
                        >
                            <MenuItem value="all">すべて</MenuItem>
                            {alertTypes.map(type => (
                                <MenuItem key={type} value={type}>
                                    {ALERT_TYPE_LABELS[type] || type}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Stack>
            </Paper>

            {/* アラート一覧テーブル */}
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ bgcolor: 'rgba(30, 41, 59, 0.8)' }}>
                            <TableCell sx={{ color: '#fff', fontWeight: 'bold', width: 80 }}>
                                優先度
                            </TableCell>
                            <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>
                                <TableSortLabel
                                    active={sortBy === 'clientName'}
                                    direction={sortBy === 'clientName' ? sortOrder : 'asc'}
                                    onClick={() => handleSort('clientName')}
                                    sx={{
                                        color: '#fff !important',
                                        '&:hover': { color: '#60a5fa !important' },
                                        '& .MuiTableSortLabel-icon': { color: '#fff !important' }
                                    }}
                                >
                                    顧客名
                                </TableSortLabel>
                            </TableCell>
                            <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>
                                内容
                            </TableCell>
                            <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>
                                期日
                            </TableCell>
                            <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>
                                <TableSortLabel
                                    active={sortBy === 'daysUntil'}
                                    direction={sortBy === 'daysUntil' ? sortOrder : 'asc'}
                                    onClick={() => handleSort('daysUntil')}
                                    sx={{
                                        color: '#fff !important',
                                        '&:hover': { color: '#60a5fa !important' },
                                        '& .MuiTableSortLabel-icon': { color: '#fff !important' }
                                    }}
                                >
                                    残り日数
                                </TableSortLabel>
                            </TableCell>
                            <TableCell sx={{ color: '#fff', fontWeight: 'bold', width: 80 }}>
                                操作
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredAlerts.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                                    <Typography color="text.secondary">
                                        アラートはありません
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredAlerts.map((alert) => {
                                const colorConfig = COLOR_CONFIG[alert.color] || COLOR_CONFIG.blue;
                                const daysText = alert.daysUntil === 0
                                    ? '本日'
                                    : alert.daysUntil === 1
                                        ? '明日'
                                        : `あと${alert.daysUntil}日`;

                                return (
                                    <TableRow
                                        key={alert.id}
                                        hover
                                        sx={{
                                            cursor: alert.clientId !== 'system' ? 'pointer' : 'default',
                                            '&:hover': {
                                                bgcolor: alert.clientId !== 'system' ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                                            },
                                        }}
                                        onClick={() => handleNavigateToClient(alert.clientId)}
                                    >
                                        <TableCell>
                                            <Chip
                                                label={colorConfig.label}
                                                size="small"
                                                sx={{
                                                    bgcolor: colorConfig.bg,
                                                    color: colorConfig.text,
                                                    fontWeight: 'bold',
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Typography fontWeight="bold">{alert.clientName}</Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">{alert.label}</Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" color="text.secondary">
                                                {format(alert.targetDate, 'M/d(E)', { locale: ja })}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={daysText}
                                                size="small"
                                                sx={{
                                                    bgcolor: `${colorConfig.bg}22`,
                                                    color: colorConfig.bg,
                                                    fontWeight: 'bold',
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            {alert.clientId !== 'system' && (
                                                <IconButton
                                                    size="small"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleNavigateToClient(alert.clientId);
                                                    }}
                                                    sx={{ color: '#3b82f6' }}
                                                >
                                                    <ArrowForwardIcon />
                                                </IconButton>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
}
