// src/features/client-portal/ClientHomePage.jsx
// 利用者ホーム画面

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Paper, Typography, Button, Chip } from '@mui/material';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase/index';
import { useClientAuth } from './context/ClientAuthContext';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

export default function ClientHomePage() {
    const { client } = useClientAuth();
    const navigate = useNavigate();
    const [todayCheckin, setTodayCheckin] = useState(null);
    const [loading, setLoading] = useState(true);

    const today = format(new Date(), 'yyyy-MM-dd');
    const todayDisplay = format(new Date(), 'M月d日 (E)', { locale: ja });

    useEffect(() => {
        const fetchTodayCheckin = async () => {
            if (!client?.id) return;
            try {
                const q = query(
                    collection(db, 'dailyCheckins'),
                    where('clientId', '==', client.id),
                    where('date', '==', today)
                );
                const snapshot = await getDocs(q);
                if (!snapshot.empty) {
                    setTodayCheckin({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
                }
            } catch (err) {
                console.error('チェックイン取得エラー:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchTodayCheckin();
    }, [client, today]);

    const hasArrival = todayCheckin?.arrivalTime;
    const hasDeparture = todayCheckin?.departureTime;

    return (
        <Box sx={{ py: 2 }}>
            {/* 日付表示 */}
            <Typography variant="h5" align="center" sx={{ mb: 3, color: '#fff', fontWeight: 'bold' }}>
                {todayDisplay}
            </Typography>

            {/* ステータス表示 */}
            <Paper sx={{
                p: 3,
                mb: 3,
                bgcolor: 'rgba(30, 41, 59, 0.9)',
                borderRadius: 2,
                textAlign: 'center',
            }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                    本日のステータス
                </Typography>
                {loading ? (
                    <Typography>読み込み中...</Typography>
                ) : (
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 2 }}>
                        <Chip
                            icon={hasArrival ? <CheckCircleIcon /> : <LoginIcon />}
                            label={hasArrival ? `通所済 ${format(todayCheckin.arrivalTime.toDate(), 'HH:mm')}` : '未通所'}
                            color={hasArrival ? 'success' : 'default'}
                            variant={hasArrival ? 'filled' : 'outlined'}
                        />
                        <Chip
                            icon={hasDeparture ? <CheckCircleIcon /> : <LogoutIcon />}
                            label={hasDeparture ? `退所済 ${format(todayCheckin.departureTime.toDate(), 'HH:mm')}` : '未退所'}
                            color={hasDeparture ? 'info' : 'default'}
                            variant={hasDeparture ? 'filled' : 'outlined'}
                        />
                    </Box>
                )}
            </Paper>

            {/* アクションボタン */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {/* 通所ボタン */}
                <Button
                    variant="contained"
                    size="large"
                    fullWidth
                    startIcon={<LoginIcon />}
                    onClick={() => navigate('/portal/checkin')}
                    disabled={hasArrival}
                    sx={{
                        py: 2.5,
                        fontSize: '1.1rem',
                        bgcolor: hasArrival ? '#4a5568' : '#10b981',
                        '&:hover': { bgcolor: hasArrival ? '#4a5568' : '#059669' },
                    }}
                >
                    {hasArrival ? '通所済み' : '通所する'}
                </Button>

                {/* 退所ボタン */}
                <Button
                    variant="contained"
                    size="large"
                    fullWidth
                    startIcon={<LogoutIcon />}
                    onClick={() => navigate('/portal/checkout')}
                    disabled={!hasArrival || hasDeparture}
                    sx={{
                        py: 2.5,
                        fontSize: '1.1rem',
                        bgcolor: hasDeparture ? '#4a5568' : !hasArrival ? '#374151' : '#3b82f6',
                        '&:hover': { bgcolor: hasDeparture || !hasArrival ? '#4a5568' : '#2563eb' },
                    }}
                >
                    {hasDeparture ? '退所済み' : '退所する'}
                </Button>
            </Box>

            {/* 注意書き */}
            {!hasArrival && (
                <Typography variant="caption" sx={{ display: 'block', mt: 3, textAlign: 'center', color: '#6b7280' }}>
                    通所ボタンを押すと、健康状態の入力画面に進みます
                </Typography>
            )}
        </Box>
    );
}
