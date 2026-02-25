// src/features/admin/AdminDashboard.jsx
// 管理画面ダッシュボード

import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
    Box,
    Grid,
    Paper,
    Typography,
    Card,
    CardContent,
    CardActionArea,
    CircularProgress,
} from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';
import StoreIcon from '@mui/icons-material/Store';
import PeopleIcon from '@mui/icons-material/People';
import { collection, getCountFromServer /* query, where */ } from 'firebase/firestore';
import { db } from '../../firebase/index';
import { useCurrentUser } from '../../hooks/useCurrentUser';

export default function AdminDashboard() {
    const { isPlatform, role } = useCurrentUser();
    const [stats, setStats] = useState({
        companies: null,
        branches: null,
        users: null,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [companiesSnap, branchesSnap, usersSnap] = await Promise.all([
                    getCountFromServer(collection(db, 'companies')),
                    getCountFromServer(collection(db, 'branches')),
                    getCountFromServer(collection(db, 'users')),
                ]);

                setStats({
                    companies: companiesSnap.data().count,
                    branches: branchesSnap.data().count,
                    users: usersSnap.data().count,
                });
            } catch (error) {
                console.error('統計情報取得エラー:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const cards = [
        {
            title: '企業数',
            value: stats.companies,
            icon: <BusinessIcon sx={{ fontSize: 48, color: '#06b6d4' }} />,
            link: '/admin/companies',
            description: '登録企業の管理',
            visible: isPlatform,
        },
        {
            title: '支店数',
            value: stats.branches,
            icon: <StoreIcon sx={{ fontSize: 48, color: '#10b981' }} />,
            link: '/admin/branches',
            description: '事業所・支店の管理',
            visible: true,
        },
        {
            title: 'ユーザー数',
            value: stats.users,
            icon: <PeopleIcon sx={{ fontSize: 48, color: '#8b5cf6' }} />,
            link: '/admin/users',
            description: 'スタッフ・権限の管理',
            visible: true,
        },
    ];

    return (
        <Box>
            <Typography variant="h4" gutterBottom sx={{ color: '#fff', mb: 4 }}>
                管理ダッシュボード
            </Typography>

            <Grid container spacing={3}>
                {cards
                    .filter((card) => card.visible)
                    .map((card) => (
                        <Grid key={card.title} size={{ xs: 12, sm: 6, md: 4 }}>
                            <Card
                                sx={{
                                    backgroundColor: '#1a1a2e',
                                    border: '1px solid rgba(6, 182, 212, 0.2)',
                                    '&:hover': {
                                        borderColor: 'rgba(6, 182, 212, 0.5)',
                                    },
                                }}
                            >
                                <CardActionArea component={RouterLink} to={card.link}>
                                    <CardContent sx={{ p: 3 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <Box>
                                                <Typography variant="h6" sx={{ color: '#fff', mb: 1 }}>
                                                    {card.title}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {card.description}
                                                </Typography>
                                            </Box>
                                            {card.icon}
                                        </Box>
                                        <Box sx={{ mt: 3 }}>
                                            {loading ? (
                                                <CircularProgress size={24} />
                                            ) : (
                                                <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#fff' }}>
                                                    {card.value ?? 0}
                                                </Typography>
                                            )}
                                        </Box>
                                    </CardContent>
                                </CardActionArea>
                            </Card>
                        </Grid>
                    ))}
            </Grid>

            {/* クイックアクション */}
            <Box sx={{ mt: 4 }}>
                <Typography variant="h6" sx={{ color: '#fff', mb: 2 }}>
                    クイックアクション
                </Typography>
                <Paper sx={{ p: 3, backgroundColor: '#1a1a2e', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    <Grid container spacing={2}>
                        {isPlatform && (
                            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                <CardActionArea
                                    component={RouterLink}
                                    to="/admin/companies/new"
                                    sx={{ p: 2, borderRadius: 1, border: '1px dashed rgba(6, 182, 212, 0.3)' }}
                                >
                                    <Typography variant="body1" sx={{ color: '#06b6d4' }}>
                                        + 新規企業を登録
                                    </Typography>
                                </CardActionArea>
                            </Grid>
                        )}
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <CardActionArea
                                component={RouterLink}
                                to="/admin/branches/new"
                                sx={{ p: 2, borderRadius: 1, border: '1px dashed rgba(16, 185, 129, 0.3)' }}
                            >
                                <Typography variant="body1" sx={{ color: '#10b981' }}>
                                    + 新規支店を登録
                                </Typography>
                            </CardActionArea>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <CardActionArea
                                component={RouterLink}
                                to="/admin/users/new"
                                sx={{ p: 2, borderRadius: 1, border: '1px dashed rgba(139, 92, 246, 0.3)' }}
                            >
                                <Typography variant="body1" sx={{ color: '#8b5cf6' }}>
                                    + 新規ユーザーを登録
                                </Typography>
                            </CardActionArea>
                        </Grid>
                    </Grid>
                </Paper>
            </Box>
        </Box>
    );
}
