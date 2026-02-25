// src/components/NotificationTicker.jsx
// 電光掲示板コンポーネント

import React from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { useNotificationAlerts } from '../hooks/useNotificationAlerts';
import './NotificationTicker.css';

// 色の設定
const COLORS = {
    blue: { bg: 'rgba(59, 130, 246, 0.2)', text: '#60a5fa', border: '#3b82f6' },
    yellow: { bg: 'rgba(245, 158, 11, 0.2)', text: '#fbbf24', border: '#f59e0b' },
    red: { bg: 'rgba(239, 68, 68, 0.2)', text: '#f87171', border: '#ef4444' },
    purple: { bg: 'rgba(139, 92, 246, 0.2)', text: '#c084fc', border: '#a855f7' },
};

// アラートアイテムコンポーネント
const AlertItem = ({ alert }) => {
    const colorConfig = COLORS[alert.color] || COLORS.blue;
    const dateStr = format(alert.targetDate, 'M/d(E)', { locale: ja });

    const daysText = alert.daysUntil === 0
        ? '本日'
        : alert.daysUntil === 1
            ? '明日'
            : `あと${alert.daysUntil}日`;

    return (
        <Box
            component="span"
            sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 1,
                px: 2,
                py: 0.5,
                mx: 2,
                borderRadius: 1,
                bgcolor: colorConfig.bg,
                border: `1px solid ${colorConfig.border}`,
                whiteSpace: 'nowrap',
            }}
        >
            <Typography
                component="span"
                sx={{ color: colorConfig.text, fontWeight: 'bold', fontSize: '0.85rem' }}
            >
                {alert.clientName}
            </Typography>
            <Typography
                component="span"
                sx={{ color: '#fff', fontSize: '0.8rem' }}
            >
                {alert.label}
            </Typography>
            <Typography
                component="span"
                sx={{ color: '#94a3b8', fontSize: '0.75rem' }}
            >
                {dateStr}
            </Typography>
            <Typography
                component="span"
                sx={{
                    color: colorConfig.text,
                    fontWeight: 'bold',
                    fontSize: '0.8rem',
                    bgcolor: 'rgba(0,0,0,0.3)',
                    px: 1,
                    py: 0.25,
                    borderRadius: 0.5,
                }}
            >
                {daysText}
            </Typography>
        </Box>
    );
};

export default function NotificationTicker() {
    const { alerts, loading } = useNotificationAlerts();

    // アラートがない場合はデフォルトメッセージを表示
    if (!loading && alerts.length === 0) {
        return (
            <Box
                sx={{
                    flexGrow: 1,
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    ml: 2,
                    mr: 2,
                    borderLeft: '1px solid #06b6d4',
                    borderRight: '1px solid #06b6d4',
                    px: 2,
                }}
            >
                <Typography
                    variant="body2"
                    sx={{
                        color: '#06b6d4',
                        fontWeight: 'bold',
                        textShadow: '0 0 8px rgba(6, 182, 212, 0.5)',
                    }}
                >
                    ✨ 今日も一日がんばりましょう！
                </Typography>
            </Box>
        );
    }

    return (
        <Box
            sx={{
                flexGrow: 1,
                overflow: 'hidden',
                ml: 2,
                mr: 2,
                borderLeft: '1px solid #06b6d4',
                borderRight: '1px solid #06b6d4',
                px: 1,
            }}
        >
            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 0.5 }}>
                    <CircularProgress size={16} sx={{ color: '#06b6d4' }} />
                </Box>
            ) : (
                <Box className="ticker-wrapper">
                    <Box className="ticker-content">
                        {/* アラートを2回繰り返してシームレスなループを実現 */}
                        {alerts.map((alert) => (
                            <AlertItem key={alert.id} alert={alert} />
                        ))}
                        {alerts.map((alert) => (
                            <AlertItem key={`${alert.id}-dup`} alert={alert} />
                        ))}
                    </Box>
                </Box>
            )}
        </Box>
    );
}
