import React from 'react';
import {
    Box,
    Typography,
    Paper,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Avatar,
    Chip,
    Grid,
    Divider,
    CircularProgress,
} from '@mui/material';
import {
    Phone as PhoneIcon,
    Email as EmailIcon,
    Groups as VisitIcon,
    TrendingUp as TrendingUpIcon,
    Schedule as ScheduleIcon,
    Timeline as TimelineIcon,
    HomeWork as HomeWorkIcon,
    DirectionsWalk as AccompanyIcon,
    Business as CompanyIcon,
    EmojiEvents as TrophyIcon,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';
import { isManagerRole } from '../../constants/roles';
import { useActivityFeed } from '../../hooks/useActivityFeed';

// 活動種別の表示設定
const ACTION_CONFIG = {
    phone_call: { label: '電話連絡', icon: <PhoneIcon fontSize="small" />, color: 'info' },
    email: { label: 'メール連絡', icon: <EmailIcon fontSize="small" />, color: 'info' },
    meeting_office: { label: '面談（事業所内）', icon: <VisitIcon fontSize="small" />, color: 'secondary' },
    meeting_external: { label: '面談（事業所外）', icon: <VisitIcon fontSize="small" />, color: 'secondary' },
    visit_home: { label: '家庭訪問', icon: <HomeWorkIcon fontSize="small" />, color: 'warning' },
    visit_company: { label: '職場訪問', icon: <CompanyIcon fontSize="small" />, color: 'warning' },
    accompany: { label: '同行支援', icon: <AccompanyIcon fontSize="small" />, color: 'success' },
    inquiry: { label: '問合せ', icon: <PhoneIcon fontSize="small" />, color: 'success' },
    tour: { label: '見学', icon: <VisitIcon fontSize="small" />, color: 'primary' },
    trial: { label: '体験利用', icon: <VisitIcon fontSize="small" />, color: 'primary' },
    contract_prep: { label: '利用準備', icon: <ScheduleIcon fontSize="small" />, color: 'warning' },
    retention_support: { label: '定着支援', icon: <VisitIcon fontSize="small" />, color: 'secondary' },
    other: { label: 'その他', icon: <ScheduleIcon fontSize="small" />, color: 'default' },
    quest_complete: { label: 'クエスト完了', icon: <TrophyIcon fontSize="small" />, color: 'warning' },
};

const ActionMessage = ({ activity }) => {
    const { staffName, clientName, type, content, isCompanyActivity } = activity;
    const config = ACTION_CONFIG[type] || ACTION_CONFIG.other;

    // 社内活動（クエスト完了など）の表示
    if (isCompanyActivity || type === 'quest_complete') {
        return (
            <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
                    <Typography variant="subtitle2" fontWeight="bold">
                        {staffName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">が</Typography>
                    <Chip
                        icon={config.icon}
                        label={config.label}
                        size="small"
                        color={config.color}
                        variant="outlined"
                        sx={{ height: 20, fontSize: '0.7rem' }}
                    />
                </Box>
                {content && (
                    <Typography variant="body2" sx={{ bgcolor: 'rgba(0,0,0,0.03)', p: 1, borderRadius: 1, borderLeft: '3px solid #f59e0b', fontSize: '0.85rem' }}>
                        {content.length > 80 ? content.substring(0, 80) + '…' : content}
                    </Typography>
                )}
            </Box>
        );
    }

    // クライアント活動の表示
    return (
        <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
                <Typography variant="subtitle2" fontWeight="bold">
                    {staffName}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                    が
                </Typography>
                <Typography variant="subtitle2" fontWeight="bold" color="primary">
                    {clientName || '顧客'}様
                </Typography>
                <Typography variant="caption" color="text.secondary">
                    に
                </Typography>
                <Chip
                    icon={config.icon}
                    label={config.label}
                    size="small"
                    color={config.color}
                    variant="outlined"
                    sx={{ height: 20, fontSize: '0.7rem' }}
                />
            </Box>
            {content && (
                <Typography variant="body2" sx={{ bgcolor: 'rgba(0,0,0,0.03)', p: 1, borderRadius: 1, borderLeft: '3px solid #ccc', fontSize: '0.85rem' }}>
                    {content.length > 80 ? content.substring(0, 80) + '…' : content}
                </Typography>
            )}
        </Box>
    );
};

// ヘルパー関数: 名前から色を生成
function stringToColor(string) {
    let hash = 0;
    let i;
    for (i = 0; i < string.length; i += 1) {
        hash = string.charCodeAt(i) + ((hash << 5) - hash);
    }
    let color = '#';
    for (i = 0; i < 3; i += 1) {
        const value = (hash >> (i * 8)) & 0xff;
        color += `00${value.toString(16)}`.slice(-2);
    }
    return color;
}

export default function ActivityLogBoard({ currentUser }) {
    const isAdmin = isManagerRole(currentUser?.role);
    const { activities, staffStats, loading, error } = useActivityFeed(30);

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>

            {/* タイムラインヘッダー */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexShrink: 0 }}>
                <TimelineIcon color="primary" />
                <Typography variant="h6" fontWeight="bold">
                    全社リアルタイム活動フィード
                </Typography>
                <Chip label="LIVE" color="error" size="small" sx={{ animation: 'pulse 2s infinite', height: 20, fontSize: '0.65rem' }} />
            </Box>

            <Grid container spacing={2} sx={{ flexGrow: 1, overflow: 'hidden', height: '100%' }}>
                {/* タイムラインリスト */}
                <Grid size={{ xs: 12, md: isAdmin ? 8 : 12 }} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <Paper elevation={0} sx={{ border: '1px solid #e0e0e0', flexGrow: 1, overflow: 'auto', p: 0, borderRadius: 2 }}>
                        {loading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', p: 4 }}>
                                <CircularProgress size={32} />
                                <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>活動フィードを読み込み中...</Typography>
                            </Box>
                        ) : error ? (
                            <Box sx={{ p: 3, textAlign: 'center' }}>
                                <Typography variant="body2" color="error">
                                    フィード取得エラー: {error}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                                    Firestore のインデックス設定が必要な場合があります。コンソールをご確認ください。
                                </Typography>
                            </Box>
                        ) : activities.length === 0 ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', p: 4 }}>
                                <Typography variant="body2" color="text.secondary">
                                    まだ活動記録がありません。クライアント詳細ページや追客リストから記録を追加してください。
                                </Typography>
                            </Box>
                        ) : (
                            <List sx={{ p: 0 }}>
                                {activities.map((activity, index) => (
                                    <React.Fragment key={activity.id}>
                                        <ListItem alignItems="flex-start" sx={{ py: 1.5 }}>
                                            <ListItemAvatar>
                                                <Avatar sx={{ bgcolor: stringToColor(activity.staffName), width: 36, height: 36, fontSize: '0.9rem' }}>
                                                    {activity.staffName[0]}
                                                </Avatar>
                                            </ListItemAvatar>
                                            <ListItemText
                                                primary={<ActionMessage activity={activity} />}
                                                secondary={
                                                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                                                        {formatDistanceToNow(activity.timestamp, { addSuffix: true, locale: ja })}
                                                    </Typography>
                                                }
                                                sx={{ m: 0 }}
                                            />
                                        </ListItem>
                                        {index < activities.length - 1 && <Divider variant="inset" component="li" sx={{ ml: 7 }} />}
                                    </React.Fragment>
                                ))}
                            </List>
                        )}
                    </Paper>
                </Grid>

                {/* サイドバー（ランキング） - 管理者のみ表示 */}
                {isAdmin && (
                    <Grid size={{ xs: 12, md: 4 }} sx={{ height: '100%', overflow: 'auto' }}>
                        {/* 今日の活動量ランキング */}
                        <Paper sx={{ p: 2, mb: 2, border: '1px solid #e0e0e0', borderRadius: 2 }}>
                            <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <TrendingUpIcon color="success" fontSize="small" /> 本日の活動量
                            </Typography>
                            {staffStats.length === 0 ? (
                                <Typography variant="body2" color="text.secondary">本日の記録はまだありません</Typography>
                            ) : (
                                <List dense sx={{ p: 0 }}>
                                    {staffStats.map((staff, index) => (
                                        <ListItem key={staff.name} disablePadding sx={{ mb: 1 }}>
                                            <ListItemAvatar sx={{ minWidth: 30 }}>
                                                <Typography variant="body2" color="text.secondary" sx={{ width: 20, textAlign: 'center', fontWeight: 'bold' }}>
                                                    {index + 1}
                                                </Typography>
                                            </ListItemAvatar>
                                            <ListItemText
                                                primary={staff.name}
                                                primaryTypographyProps={{ fontSize: '0.85rem' }}
                                            />
                                            <Chip label={`${staff.count}件`} size="small" color={index === 0 ? 'primary' : 'default'} sx={{ height: 20, fontSize: '0.7rem' }} />
                                        </ListItem>
                                    ))}
                                </List>
                            )}
                        </Paper>
                    </Grid>
                )}
            </Grid>
        </Box>
    );
}
