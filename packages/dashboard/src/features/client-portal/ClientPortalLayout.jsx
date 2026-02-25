// src/features/client-portal/ClientPortalLayout.jsx
// 利用者ポータル用レイアウト（スマホ最適化）

import { Outlet, useNavigate } from 'react-router-dom';
import { Box, AppBar, Toolbar, Typography, IconButton } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import { useClientAuth } from './context/ClientAuthContext';

export default function ClientPortalLayout() {
    const { client, logout } = useClientAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/portal/login');
    };

    return (
        <Box sx={{
            minHeight: '100vh',
            bgcolor: '#0f0f1a',
            display: 'flex',
            flexDirection: 'column',
        }}>
            {/* ヘッダー */}
            <AppBar
                position="fixed"
                sx={{
                    bgcolor: 'rgba(30, 41, 59, 0.95)',
                    borderBottom: '1px solid #06b6d4',
                }}
            >
                <Toolbar sx={{ justifyContent: 'space-between' }}>
                    <Typography
                        variant="h6"
                        sx={{
                            fontWeight: 'bold',
                            background: 'linear-gradient(90deg, #8b5cf6, #06b6d4)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }}
                    >
                        Manecto
                    </Typography>
                    {client && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" sx={{ color: '#fff' }}>
                                {client.name}
                            </Typography>
                            <IconButton color="error" onClick={handleLogout} size="small">
                                <LogoutIcon />
                            </IconButton>
                        </Box>
                    )}
                </Toolbar>
            </AppBar>

            {/* メインコンテンツ */}
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    pt: 8,
                    pb: 2,
                    px: 2,
                    maxWidth: 480,
                    mx: 'auto',
                    width: '100%',
                }}
            >
                <Outlet />
            </Box>
        </Box>
    );
}
