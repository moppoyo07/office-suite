// src/features/admin/users/UserListPage.jsx
// ユーザー一覧ページ（強化版）
// 企業・支店名表示、検索・フィルタ機能付き

import React, { useState, useEffect, useMemo } from 'react';
import { Link as RouterLink } from 'react-router-dom';
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
    Button,
    CircularProgress,
    Chip,
    IconButton,
    Avatar,
    TextField,
    InputAdornment,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Stack,
    Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import PersonIcon from '@mui/icons-material/Person';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import BusinessIcon from '@mui/icons-material/Business';
import StoreIcon from '@mui/icons-material/Store';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../../firebase/index';
import { ROLE_METADATA } from '../../../constants/roles';
import { useCurrentUser } from '../../../hooks/useCurrentUser';

// ロールごとの色（ROLE_METADATAから動的生成）
const ROLE_COLORS = Object.fromEntries(
    Object.entries(ROLE_METADATA).map(([k, v]) => [k, v.color])
);

export default function UserListPage() {
    const [users, setUsers] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);
    const { isPlatform } = useCurrentUser();

    // フィルタ状態
    const [searchQuery, setSearchQuery] = useState('');
    const [filterRole, setFilterRole] = useState('');
    const [filterCompany, setFilterCompany] = useState('');
    const [filterStatus, setFilterStatus] = useState(''); // active, pending, resigned

    // データ取得
    useEffect(() => {
        const fetchData = async () => {
            try {
                // ユーザー、企業、支店を並列取得
                // orderBy('createdAt')を使うとcreatedAtがないドキュメントが除外されるため、
                // 全件取得してからメモリ内でソートする
                const [usersSnap, companiesSnap, branchesSnap] = await Promise.all([
                    getDocs(collection(db, 'users')),
                    getDocs(collection(db, 'companies')),
                    getDocs(collection(db, 'branches')),
                ]);

                const fetchedUsers = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                // 作成日時で降順ソート（createdAtがない場合は最後にする）
                fetchedUsers.sort((a, b) => {
                    const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0);
                    const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0);
                    return dateB - dateA;
                });

                setUsers(fetchedUsers);
                setCompanies(companiesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
                setBranches(branchesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            } catch (error) {
                console.error('データ取得エラー:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // 企業名・支店名のルックアップ
    const companyMap = useMemo(() => {
        const map = {};
        companies.forEach(c => { map[c.id] = c.name; });
        return map;
    }, [companies]);

    const branchMap = useMemo(() => {
        const map = {};
        branches.forEach(b => { map[b.id] = b.name; });
        return map;
    }, [branches]);

    // フィルタ適用
    const filteredUsers = useMemo(() => {
        return users.filter(user => {
            // 検索クエリ（名前、メール、社員番号）
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                const matchName = user.displayName?.toLowerCase().includes(q);
                const matchEmail = user.email?.toLowerCase().includes(q);
                const matchKana = user.kanaName?.toLowerCase().includes(q);
                const matchEmpNo = user.employeeNumber?.toLowerCase().includes(q);
                if (!matchName && !matchEmail && !matchKana && !matchEmpNo) return false;
            }

            // ロールフィルタ
            if (filterRole && user.role !== filterRole) return false;

            // 企業フィルタ
            if (filterCompany && user.companyId !== filterCompany) return false;

            // ステータスフィルタ
            if (filterStatus === 'active' && (user.invitePending || user.isActive === false)) return false;
            if (filterStatus === 'pending' && !user.invitePending) return false;
            if (filterStatus === 'resigned' && user.isActive !== false) return false;

            return true;
        });
    }, [users, searchQuery, filterRole, filterCompany, filterStatus]);

    const clearFilters = () => {
        setSearchQuery('');
        setFilterRole('');
        setFilterCompany('');
        setFilterStatus('');
    };

    const hasActiveFilters = searchQuery || filterRole || filterCompany || filterStatus;

    return (
        <Box>
            {/* ヘッダー */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" sx={{ color: '#fff' }}>
                    ユーザー管理
                </Typography>
                <Button
                    component={RouterLink}
                    to="/admin/users/new"
                    variant="contained"
                    startIcon={<AddIcon />}
                    sx={{ bgcolor: '#8b5cf6', '&:hover': { bgcolor: '#7c3aed' } }}
                >
                    ユーザーを招待
                </Button>
            </Box>

            {/* 検索・フィルタ */}
            <Paper sx={{ p: 2, mb: 2, backgroundColor: '#1a1a2e', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
                    {/* 検索ボックス */}
                    <TextField
                        placeholder="名前・メール・社員番号で検索..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        size="small"
                        sx={{ minWidth: 280 }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon sx={{ color: '#64748b' }} />
                                </InputAdornment>
                            ),
                        }}
                    />

                    {/* ロールフィルタ */}
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                        <InputLabel>ロール</InputLabel>
                        <Select
                            value={filterRole}
                            label="ロール"
                            onChange={(e) => setFilterRole(e.target.value)}
                        >
                            <MenuItem value="">すべて</MenuItem>
                            {Object.entries(ROLE_METADATA).map(([value, meta]) => (
                                <MenuItem key={value} value={value}>{meta.badge}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {/* 企業フィルタ */}
                    {isPlatform && (
                        <FormControl size="small" sx={{ minWidth: 180 }}>
                            <InputLabel>企業</InputLabel>
                            <Select
                                value={filterCompany}
                                label="企業"
                                onChange={(e) => setFilterCompany(e.target.value)}
                            >
                                <MenuItem value="">すべて</MenuItem>
                                {companies.map(company => (
                                    <MenuItem key={company.id} value={company.id}>{company.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    )}

                    {/* ステータスフィルタ */}
                    <FormControl size="small" sx={{ minWidth: 130 }}>
                        <InputLabel>ステータス</InputLabel>
                        <Select
                            value={filterStatus}
                            label="ステータス"
                            onChange={(e) => setFilterStatus(e.target.value)}
                        >
                            <MenuItem value="">すべて</MenuItem>
                            <MenuItem value="active">有効</MenuItem>
                            <MenuItem value="pending">招待中</MenuItem>
                            <MenuItem value="resigned">退職済</MenuItem>
                        </Select>
                    </FormControl>

                    {/* フィルタクリア */}
                    {hasActiveFilters && (
                        <Button
                            startIcon={<ClearIcon />}
                            onClick={clearFilters}
                            size="small"
                            sx={{ color: '#94a3b8' }}
                        >
                            クリア
                        </Button>
                    )}

                    {/* 件数表示 */}
                    <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto' }}>
                        {filteredUsers.length} / {users.length} 件
                    </Typography>
                </Stack>
            </Paper>

            {/* テーブル */}
            <Paper sx={{ backgroundColor: '#1a1a2e', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ color: '#94a3b8', fontWeight: 'bold' }}>ユーザー</TableCell>
                                <TableCell sx={{ color: '#94a3b8', fontWeight: 'bold' }}>所属</TableCell>
                                <TableCell sx={{ color: '#94a3b8', fontWeight: 'bold' }}>ロール</TableCell>
                                <TableCell sx={{ color: '#94a3b8', fontWeight: 'bold' }}>ステータス</TableCell>
                                <TableCell sx={{ color: '#94a3b8', fontWeight: 'bold' }} align="right">操作</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                                        <CircularProgress size={24} />
                                    </TableCell>
                                </TableRow>
                            ) : filteredUsers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ py: 4, color: '#94a3b8' }}>
                                        {hasActiveFilters
                                            ? '条件に一致するユーザーが見つかりません'
                                            : '登録されているユーザーはいません'
                                        }
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredUsers.map((user) => (
                                    <TableRow key={user.id} hover>
                                        {/* ユーザー情報 */}
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                <Avatar sx={{ bgcolor: ROLE_COLORS[user.role] || '#64748b', width: 36, height: 36 }}>
                                                    {user.displayName?.[0] || <PersonIcon fontSize="small" />}
                                                </Avatar>
                                                <Box>
                                                    <Typography sx={{ color: '#fff', fontWeight: 'bold' }}>
                                                        {user.displayName || '名前未設定'}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {user.email}
                                                    </Typography>
                                                    {user.employeeNumber && (
                                                        <Typography variant="caption" color="text.secondary" display="block">
                                                            社員番号: {user.employeeNumber}
                                                        </Typography>
                                                    )}
                                                </Box>
                                            </Box>
                                        </TableCell>

                                        {/* 所属 */}
                                        <TableCell>
                                            {user.companyId ? (
                                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                                    <Tooltip title="企業">
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                            <BusinessIcon sx={{ fontSize: 14, color: '#06b6d4' }} />
                                                            <Typography variant="body2" sx={{ color: '#fff' }}>
                                                                {companyMap[user.companyId] || '不明'}
                                                            </Typography>
                                                        </Box>
                                                    </Tooltip>
                                                    {user.branchId && (
                                                        <Tooltip title="支店">
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                                <StoreIcon sx={{ fontSize: 14, color: '#10b981' }} />
                                                                <Typography variant="caption" color="text.secondary">
                                                                    {branchMap[user.branchId] || '不明'}
                                                                </Typography>
                                                            </Box>
                                                        </Tooltip>
                                                    )}
                                                </Box>
                                            ) : (
                                                <Typography variant="body2" color="text.secondary">
                                                    -
                                                </Typography>
                                            )}
                                        </TableCell>

                                        {/* ロール */}
                                        <TableCell>
                                            <Chip
                                                label={ROLE_METADATA[user.role]?.badge || user.role || '未設定'}
                                                size="small"
                                                sx={{
                                                    bgcolor: `${ROLE_COLORS[user.role] || '#64748b'}20`,
                                                    color: ROLE_COLORS[user.role] || '#64748b',
                                                    fontWeight: 'bold',
                                                }}
                                            />
                                        </TableCell>

                                        {/* ステータス */}
                                        <TableCell>
                                            {user.isActive === false ? (
                                                <Chip label="退職済" size="small" sx={{ bgcolor: 'rgba(100,116,139,0.2)', color: '#64748b' }} />
                                            ) : user.invitePending ? (
                                                <Chip label="招待中" size="small" color="warning" variant="outlined" />
                                            ) : (
                                                <Chip label="有効" size="small" color="success" variant="outlined" />
                                            )}
                                        </TableCell>

                                        {/* 操作 */}
                                        <TableCell align="right">
                                            <Tooltip title="詳細・編集">
                                                <IconButton
                                                    component={RouterLink}
                                                    to={`/admin/users/${user.id}`}
                                                    size="small"
                                                    sx={{ color: '#8b5cf6' }}
                                                >
                                                    <EditIcon />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Box>
    );
}
