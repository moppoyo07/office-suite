// src/components/DevModeIndicator.jsx
// 開発モード表示インジケーター
// 本番環境では表示されません

import React, { useState } from 'react';
import {
    Box,
    Chip,
    Collapse,
    Paper,
    Typography,
    IconButton,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
} from '@mui/material';
import BugReportIcon from '@mui/icons-material/BugReport';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useCurrentUser } from '../hooks/useCurrentUser';

/**
 * 開発モードインジケーター
 * 開発中のみ表示され、現在有効になっている開発用設定を表示
 */
export default function DevModeIndicator() {
    const [expanded, setExpanded] = useState(false);
    const { profile, role, isPlatform } = useCurrentUser();

    // 本番環境では何も表示しない
    const isDev = import.meta.env.DEV;
    if (!isDev) return null;

    const devFeatures = [
        {
            label: '管理画面アクセス',
            description: 'ロールに関係なく /admin にアクセス可能',
            enabled: true,
        },
        {
            label: 'プラットフォーム権限',
            description: `role を platform_owner としてシミュレート中（実際: ${profile?.role || '未設定'}）`,
            enabled: isPlatform,
        },
        {
            label: '全企業・支店の操作',
            description: '企業・支店の選択と登録が可能',
            enabled: true,
        },
    ];

    return (
        <Box
            sx={{
                position: 'fixed',
                bottom: 16,
                right: 16,
                zIndex: 9999,
            }}
        >
            {/* 展開パネル */}
            <Collapse in={expanded}>
                <Paper
                    sx={{
                        p: 2,
                        mb: 1,
                        backgroundColor: 'rgba(251, 146, 60, 0.95)',
                        backdropFilter: 'blur(8px)',
                        color: '#000',
                        minWidth: 300,
                        maxWidth: 400,
                    }}
                >
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                        🛠️ 開発モード有効
                    </Typography>
                    <Typography variant="caption" display="block" sx={{ mb: 2, opacity: 0.8 }}>
                        以下の設定が開発用に上書きされています。
                        本番デプロイ前に必ず確認してください。
                    </Typography>

                    <List dense disablePadding>
                        {devFeatures.map((feature, idx) => (
                            <ListItem key={idx} disableGutters sx={{ py: 0.5 }}>
                                <ListItemIcon sx={{ minWidth: 32 }}>
                                    <CheckCircleIcon sx={{ fontSize: 18, color: feature.enabled ? '#22c55e' : '#666' }} />
                                </ListItemIcon>
                                <ListItemText
                                    primary={feature.label}
                                    secondary={feature.description}
                                    primaryTypographyProps={{ fontWeight: 'bold', fontSize: '0.875rem' }}
                                    secondaryTypographyProps={{ fontSize: '0.75rem', color: 'rgba(0,0,0,0.7)' }}
                                />
                            </ListItem>
                        ))}
                    </List>

                    <Box sx={{ mt: 2, p: 1.5, backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: 1 }}>
                        <Typography variant="caption" fontWeight="bold">
                            現在のユーザー情報:
                        </Typography>
                        <Typography variant="caption" display="block" sx={{ fontFamily: 'monospace' }}>
                            email: {profile?.email || 'N/A'}<br />
                            実際のrole: {profile?.role || '未設定'}<br />
                            シミュレート中: {role}
                        </Typography>
                    </Box>
                </Paper>
            </Collapse>

            {/* トグルボタン */}
            <Chip
                icon={<BugReportIcon />}
                label={expanded ? '閉じる' : 'DEV MODE'}
                onClick={() => setExpanded(!expanded)}
                onDelete={() => setExpanded(!expanded)}
                deleteIcon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                sx={{
                    backgroundColor: '#fb923c',
                    color: '#000',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    '&:hover': {
                        backgroundColor: '#f97316',
                    },
                    '& .MuiChip-icon': {
                        color: '#000',
                    },
                    '& .MuiChip-deleteIcon': {
                        color: '#000',
                    },
                }}
            />
        </Box>
    );
}
