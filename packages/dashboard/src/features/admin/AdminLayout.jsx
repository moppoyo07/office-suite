// src/features/admin/AdminLayout.jsx
// 管理画面用レイアウト

import React from 'react';
import { Outlet, useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import {
    Box,
    Drawer,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Typography,
    Divider,
    Toolbar,
    AppBar,
    IconButton,
    Chip,
    Button,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DashboardIcon from '@mui/icons-material/Dashboard';
import BusinessIcon from '@mui/icons-material/Business';
import StoreIcon from '@mui/icons-material/Store';
import PeopleIcon from '@mui/icons-material/People';
import BuildIcon from '@mui/icons-material/Build';
import MergeTypeIcon from '@mui/icons-material/MergeType';
import ScheduleIcon from '@mui/icons-material/Schedule';
import TableChartIcon from '@mui/icons-material/TableChart';
import SecurityIcon from '@mui/icons-material/Security';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { ROLE_METADATA, isPlatformRole } from '../../constants/roles';
import { useTenant } from '../../context/TenantContext';

const drawerWidth = 240;

// ロール別メニュー定義
// roles: 表示を許可するロール（空配列なら全員に表示）
const menuItems = [
    { path: '/admin', label: 'ダッシュボード', icon: <DashboardIcon />, exact: true, roles: [] },
    { path: '/admin/companies', label: '企業管理', icon: <BusinessIcon />, roles: ['company_admin'] },
    { path: '/admin/branches', label: '支店管理', icon: <StoreIcon />, roles: ['company_admin', 'branch_manager'] },
    { path: '/admin/users', label: 'ユーザー管理', icon: <PeopleIcon />, roles: ['company_admin', 'branch_manager'] },
    { path: '/admin/staff-schedule', label: '勤務形態一覧', icon: <ScheduleIcon />, roles: ['branch_manager'] },
    { path: '/admin/average-users-sheet', label: '平均利用者算定', icon: <TableChartIcon />, roles: ['branch_manager'] },
    { path: '/admin/quest-categories', label: 'クエスト管理', icon: <EmojiEventsIcon />, roles: ['company_admin', 'branch_manager'] },
    { path: '/admin/cleanup', label: 'データ整合性', icon: <BuildIcon />, roles: ['company_admin'] },
    { path: '/admin/data-migration', label: 'データ移行・整理', icon: <MergeTypeIcon />, roles: ['company_admin', 'platform_owner'] },
    { path: '/admin/rbac', label: 'Role Control Panel', icon: <SecurityIcon />, roles: ['platform_owner'] },
];

export default function AdminLayout() {
    const navigate = useNavigate();
    const location = useLocation();
    const { role, profile } = useCurrentUser();
    const { isEmulating, emulatingCompany, exitEmulatorMode } = useTenant();

    const isActive = (path, exact = false) => {
        if (exact) return location.pathname === path;
        return location.pathname.startsWith(path);
    };

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
            {/* ヘッダー */}
            <AppBar
                position="fixed"
                sx={{
                    zIndex: (theme) => theme.zIndex.drawer + 1,
                    backgroundColor: '#1a1a2e',
                    backgroundImage: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                }}
            >
                <Toolbar>
                    <IconButton
                        color="inherit"
                        edge="start"
                        onClick={() => navigate('/')}
                        sx={{ mr: 2 }}
                    >
                        <ArrowBackIcon />
                    </IconButton>
                    <BuildIcon sx={{ mr: 1, color: '#06b6d4' }} />
                    <Typography
                        variant="h6"
                        component={RouterLink}
                        to="/"
                        sx={{
                            flexGrow: 1,
                            textDecoration: 'none',
                            color: 'inherit',
                            cursor: 'pointer',
                            '&:hover': {
                                opacity: 0.8
                            }
                        }}
                    >
                        管理画面
                    </Typography>
                    <Chip
                        label={ROLE_METADATA[role]?.badge || role}
                        size="small"
                        sx={{
                            bgcolor: `${ROLE_METADATA[role]?.color}22` || 'rgba(6, 182, 212, 0.2)',
                            color: ROLE_METADATA[role]?.color || '#06b6d4',
                            fontWeight: 'bold'
                        }}
                    />
                </Toolbar>
            </AppBar>

            {/* サイドナビゲーション */}
            <Drawer
                variant="permanent"
                sx={{
                    width: drawerWidth,
                    flexShrink: 0,
                    '& .MuiDrawer-paper': {
                        width: drawerWidth,
                        boxSizing: 'border-box',
                        backgroundColor: '#0f0f1a',
                        borderRight: '1px solid rgba(6, 182, 212, 0.2)',
                    },
                }}
            >
                <Toolbar />
                <Box sx={{ overflow: 'auto', p: 1 }}>
                    {/* ユーザー情報 */}
                    <Box sx={{ p: 2, mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                            ログイン中
                        </Typography>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#fff' }}>
                            {profile?.displayName || profile?.email || 'Unknown'}
                        </Typography>
                    </Box>

                    <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', mb: 1 }} />

                    {/* メニュー */}
                    <List>
                        {menuItems
                            .filter((item) => {
                                // roles が空配列なら全員に表示
                                if (!item.roles || item.roles.length === 0) return true;
                                // 上位ロールは下位ロールのメニューもすべて表示（ロール階層）
                                // platform_owner/platform_staff → 全メニュー
                                if (isPlatformRole(role)) return true;
                                // company_admin → platform_owner専用以外すべて
                                if (role === 'company_admin') return !item.roles.every(r => r === 'platform_owner' || r === 'platform_staff');
                                // それ以外 → ロールに合致すれば表示
                                return item.roles.includes(role);
                            })
                            .map((item) => (
                                <ListItem key={item.path} disablePadding>
                                    <ListItemButton
                                        component={RouterLink}
                                        to={item.path}
                                        selected={isActive(item.path, item.exact)}
                                        sx={{
                                            borderRadius: 1,
                                            mb: 0.5,
                                            '&.Mui-selected': {
                                                backgroundColor: 'rgba(6, 182, 212, 0.15)',
                                                '&:hover': {
                                                    backgroundColor: 'rgba(6, 182, 212, 0.25)',
                                                },
                                            },
                                        }}
                                    >
                                        <ListItemIcon sx={{ color: isActive(item.path, item.exact) ? '#06b6d4' : 'inherit', minWidth: 40 }}>
                                            {item.icon}
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={item.label}
                                            primaryTypographyProps={{
                                                fontWeight: isActive(item.path, item.exact) ? 'bold' : 'normal',
                                            }}
                                        />
                                    </ListItemButton>
                                </ListItem>
                            ))}
                    </List>
                </Box>
            </Drawer>

            {/* メインコンテンツ */}
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: 3,
                    backgroundColor: '#0a0a14',
                    minHeight: '100vh',
                }}
            >
                <Toolbar />
                {/* エミュレーターバナー */}
                {isEmulating && (
                    <Box sx={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        px: 2, py: 0.5, mb: 2,
                        bgcolor: 'rgba(139, 92, 246, 0.15)',
                        border: '1px solid rgba(139, 92, 246, 0.4)',
                        borderRadius: 1,
                    }}>
                        <Typography variant="caption" sx={{ color: '#a78bfa', fontWeight: 'bold' }}>
                            🔍 {emulatingCompany?.name || '企業'} として表示中
                        </Typography>
                        <Button size="small" onClick={exitEmulatorMode} sx={{ color: '#a78bfa', fontSize: '0.7rem', py: 0, minWidth: 'auto' }}>
                            ← 戻る
                        </Button>
                    </Box>
                )}
                <Outlet />
            </Box>
        </Box>
    );
}
