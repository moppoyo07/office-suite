import { useState, useMemo, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Tabs,
    Tab,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Chip,
    Stack,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    Snackbar,
    Alert,
    Tooltip,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { format, differenceInDays, startOfDay } from 'date-fns';
import { ja } from 'date-fns/locale';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase/index';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import HistoryIcon from '@mui/icons-material/History';
import PhoneAndroidIcon from '@mui/icons-material/PhoneAndroid';
import { CLIENT_STATUS } from '../constants/clientStatus';
import ActivityLogForm from '../features/clients/components/ActivityLogForm.jsx';
import { useActivityLog } from '../hooks/useActivityLog';

// 活動種別ラベル
const ACTIVITY_TYPE_LABELS = {
    phone_call: '📞 電話',
    email: '✉️ メール',
    meeting_office: '🏢 面談（事業所）',
    meeting_external: '🚗 面談（外）',
    visit_home: '🏠 家庭訪問',
    visit_company: '🏭 職場訪問',
    accompany: '🤝 同行支援',
    lost: '❌ 利用終了',
    other: '📝 その他',
};

// タブ定義
const TABS = [
    { id: 'inquiry', label: '問合せ', statuses: [CLIENT_STATUS.INQUIRY] },
    { id: 'interview', label: '見学予定', statuses: [CLIENT_STATUS.INTERVIEW] },
    { id: 'trial', label: '体験中', statuses: [CLIENT_STATUS.TRIAL] },
    { id: 'followUp', label: '定着支援', statuses: ['follow-up-m1', 'follow-up-m2', 'follow-up-m3', 'follow-up-m4', 'follow-up-m5', 'follow-up-m6'] },
    { id: 'reminder', label: 'リマインダー', statuses: [] }, // 特殊：前日リマインダー専用
];

export default function FollowUpListPage() {
    const navigate = useNavigate();
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('inquiry');

    // 活動履歴モーダル用のステート
    const [activityModalOpen, setActivityModalOpen] = useState(false);
    const [activityTarget, setActivityTarget] = useState(null);
    const [activityLogs, setActivityLogs] = useState([]);
    const [activityLogsLoading, setActivityLogsLoading] = useState(false);

    // クイックアクション用のステート
    const [logModalOpen, setLogModalOpen] = useState(false);
    const [logTarget, setLogTarget] = useState(null); // { clientId, clientName, presetType }
    const { saveLog, isSaving: isSavingLog } = useActivityLog();
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    // クライアントデータ取得
    useEffect(() => {
        const fetchClients = async () => {
            setLoading(true);
            try {
                // 追客対象のステータスを全て取得
                const targetStatuses = [
                    CLIENT_STATUS.INQUIRY,
                    CLIENT_STATUS.INTERVIEW,
                    CLIENT_STATUS.TRIAL,
                    'follow-up-m1',
                    'follow-up-m2',
                    'follow-up-m3',
                    'follow-up-m4',
                    'follow-up-m5',
                    'follow-up-m6',
                ];

                const q = query(
                    collection(db, 'clients'),
                    where('status', 'in', targetStatuses)
                );
                const snapshot = await getDocs(q);
                const clientsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setClients(clientsData);
            } catch (error) {
                console.error('クライアント取得エラー:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchClients();
    }, []);

    // タブごとにクライアントをフィルタリング
    const filteredClients = useMemo(() => {
        const today = startOfDay(new Date());
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const currentTab = TABS.find(t => t.id === activeTab);
        if (!currentTab) return [];

        // リマインダータブの場合
        if (activeTab === 'reminder') {
            const reminders = [];

            clients.forEach(client => {
                // 見学前日リマインダー
                if (client.status === CLIENT_STATUS.INTERVIEW && client.interviewDate) {
                    const interviewDate = client.interviewDate.toDate ? client.interviewDate.toDate() : new Date(client.interviewDate);
                    const daysUntil = differenceInDays(startOfDay(interviewDate), today);

                    if (daysUntil === 1) {
                        reminders.push({
                            ...client,
                            reminderType: 'interview',
                            reminderLabel: '見学前日',
                            targetDate: interviewDate,
                        });
                    }
                }

                // 体験前日リマインダー
                if (client.status === CLIENT_STATUS.TRIAL && client.trialStartDate) {
                    const trialDate = client.trialStartDate.toDate ? client.trialStartDate.toDate() : new Date(client.trialStartDate);
                    const daysUntil = differenceInDays(startOfDay(trialDate), today);

                    if (daysUntil === 1) {
                        reminders.push({
                            ...client,
                            reminderType: 'trial',
                            reminderLabel: '体験前日',
                            targetDate: trialDate,
                        });
                    }
                }

                // 追客 次回連絡日の前日リマインダー
                if (client.nextContactDate) {
                    const nextDate = client.nextContactDate.toDate
                        ? client.nextContactDate.toDate()
                        : client.nextContactDate instanceof Date
                            ? client.nextContactDate
                            : null;
                    if (nextDate) {
                        const daysUntil = differenceInDays(startOfDay(nextDate), today);
                        if (daysUntil === 1) {
                            reminders.push({
                                ...client,
                                reminderType: 'next_contact',
                                reminderLabel: '追客 前日',
                                targetDate: nextDate,
                            });
                        }
                    }
                }
            });

            return reminders;
        }

        // 通常タブの場合
        return clients.filter(client => currentTab.statuses.includes(client.status));
    }, [clients, activeTab]);

    // 活動履歴モーダルを開く
    const handleOpenActivityModal = async (client, e) => {
        e.stopPropagation();
        setActivityTarget(client);
        setActivityLogs([]);
        setActivityLogsLoading(true);
        setActivityModalOpen(true);
        try {
            const q = query(
                collection(db, 'clients', client.id, 'activity_logs'),
                orderBy('createdAt', 'desc')
            );
            const snap = await getDocs(q);
            setActivityLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (err) {
            console.error('活動ログ取得エラー:', err);
        } finally {
            setActivityLogsLoading(false);
        }
    };

    // 顧客詳細へ遷移
    const handleNavigateToClient = (clientId) => {
        navigate(`/clients/${clientId}`);
    };

    // クイックアクション: 電話記録
    const handleQuickCall = (client) => {
        setLogTarget({ clientId: client.id, clientName: client.name, presetType: 'phone_call', clientData: client });
        setLogModalOpen(true);
    };

    // クイックアクション: メール記録
    const handleQuickEmail = (client) => {
        setLogTarget({ clientId: client.id, clientName: client.name, presetType: 'email', clientData: client });
        setLogModalOpen(true);
    };

    // 活動ログ保存
    const handleSaveLog = async (logData) => {
        if (!logTarget?.clientId) return { success: false };

        const result = await saveLog(logTarget.clientId, logData, logTarget.clientName || '', logTarget.clientData || null);
        if (result && result.success) {
            // クライアントリストの nextContactDate をローカルでも更新
            setClients(prev => prev.map(c => {
                if (c.id !== logTarget.clientId) return c;
                const isContact = ['phone_call', 'email'].includes(logData.type);
                if (!isContact) return c;
                // 日曜なら月曜にずらす
                const skipSun = (d) => { if (d.getDay() === 0) d.setDate(d.getDate() + 1); return d; };
                if (c.status === 'inquiry') {
                    const newAttempts = (c.contactAttempts || 0) + 1;
                    const intervals = [1, 1, 3, 7, 12, 30, 31];
                    const days = intervals[Math.min(newAttempts - 1, intervals.length - 1)];
                    const next = new Date();
                    next.setDate(next.getDate() + days);
                    return { ...c, contactAttempts: newAttempts, nextContactDate: skipSun(next) };
                } else {
                    const next = new Date();
                    next.setDate(next.getDate() + 2);
                    return { ...c, nextContactDate: skipSun(next) };
                }
            }));
            setLogModalOpen(false);
            setLogTarget(null);
            setSnackbar({
                open: true,
                message: `${logTarget.clientName || '顧客'}の活動記録を保存しました`,
                severity: 'success',
            });
        } else {
            setSnackbar({
                open: true,
                message: '保存に失敗しました: ' + (result?.error || '不明なエラー'),
                severity: 'error',
            });
        }
        return result;
    };

    // 次回予定日を取得
    const getNextDate = (client) => {
        if (client.reminderType) {
            return client.targetDate;
        }

        // nextContactDate（電話/メール記録後に自動セット）があれば最優先
        if (client.nextContactDate) {
            if (client.nextContactDate.toDate) return client.nextContactDate.toDate();
            if (client.nextContactDate instanceof Date) return client.nextContactDate;
        }

        switch (client.status) {
            case CLIENT_STATUS.INTERVIEW:
                return client.interviewDate?.toDate ? client.interviewDate.toDate() : null;
            case CLIENT_STATUS.TRIAL:
                return client.trialStartDate?.toDate ? client.trialStartDate.toDate() : null;
            default:
                return null;
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 1 }}>
            {/* ヘッダー */}
            <Stack direction="row" alignItems="center" spacing={2} mb={2}>
                <PhoneIcon sx={{ fontSize: 32, color: '#f59e0b' }} />
                <Typography variant="h5" fontWeight="bold">
                    追客リスト
                </Typography>
                <Chip
                    label={`${filteredClients.length}件`}
                    color="warning"
                    size="small"
                />
            </Stack>

            {/* タブ */}
            <Paper sx={{ mb: 3 }}>
                <Tabs
                    value={activeTab}
                    onChange={(e, newValue) => setActiveTab(newValue)}
                    variant="fullWidth"
                    sx={{
                        borderBottom: 1,
                        borderColor: 'divider',
                        '& .MuiTab-root': {
                            fontWeight: 'bold',
                        },
                    }}
                >
                    {TABS.map(tab => (
                        <Tab
                            key={tab.id}
                            label={tab.label}
                            value={tab.id}
                            icon={tab.id === 'reminder' ? <NotificationsActiveIcon /> : null}
                            iconPosition="start"
                        />
                    ))}
                </Tabs>
            </Paper>

            {/* テーブル */}
            <TableContainer component={Paper} sx={{ width: '100%', overflowX: 'hidden' }}>
                <Table size="small" sx={{ tableLayout: 'fixed', width: '100%' }}>
                    <colgroup>
                        <col style={{ width: '30%' }} />
                        <col style={{ width: '18%' }} />
                        <col style={{ width: '20%' }} />
                        <col style={{ width: '32%' }} />
                    </colgroup>
                    <TableHead>
                        <TableRow sx={{ bgcolor: 'rgba(30, 41, 59, 0.8)' }}>
                            <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>顧客名</TableCell>
                            <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>ステータス</TableCell>
                            <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>次回予定</TableCell>
                            <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>操作</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredClients.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                                    <Typography color="text.secondary">
                                        {activeTab === 'reminder'
                                            ? '明日のリマインダーはありません'
                                            : '該当する顧客はいません'}
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredClients.map((client) => {
                                const nextDate = getNextDate(client);

                                // ステータス表示
                                let statusLabel = client.status;
                                let statusColor = 'default';

                                if (client.reminderType) {
                                    statusLabel = client.reminderLabel;
                                    statusColor = 'warning';
                                } else if (client.status === CLIENT_STATUS.INQUIRY) {
                                    statusLabel = '問合せ';
                                    statusColor = 'info';
                                } else if (client.status === CLIENT_STATUS.INTERVIEW) {
                                    statusLabel = '見学予定';
                                    statusColor = 'primary';
                                } else if (client.status === CLIENT_STATUS.TRIAL) {
                                    statusLabel = '体験中';
                                    statusColor = 'secondary';
                                } else if (client.status.startsWith('follow-up')) {
                                    statusLabel = `定着${client.status.replace('follow-up-m', '')}ヶ月`;
                                    statusColor = 'success';
                                }

                                return (
                                    <TableRow
                                        key={client.id}
                                        hover
                                        sx={{
                                            cursor: 'pointer',
                                            '&:hover': {
                                                bgcolor: 'rgba(59, 130, 246, 0.1)',
                                            },
                                        }}
                                        onClick={() => handleNavigateToClient(client.id)}
                                    >
                                        <TableCell>
                                            <Typography fontWeight="bold">{client.name || '名前なし'}</Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip label={statusLabel} color={statusColor} size="small" />
                                        </TableCell>
                                        <TableCell>
                                            {nextDate ? (
                                                <Typography variant="body2" color="text.secondary">
                                                    {format(nextDate, 'M/d(E)', { locale: ja })}
                                                </Typography>
                                            ) : (
                                                <Typography variant="body2" color="text.secondary">
                                                    未設定
                                                </Typography>
                                            )}
                                        </TableCell>
                                        <TableCell onClick={(e) => e.stopPropagation()}>
                                            <Stack direction="row" spacing={0.5} alignItems="center">
                                                <Tooltip title="電話記録">
                                                    <IconButton size="small" onClick={() => handleQuickCall(client)} sx={{ color: '#3b82f6' }}>
                                                        <PhoneIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="メール記録">
                                                    <IconButton size="small" onClick={() => handleQuickEmail(client)} sx={{ color: '#8b5cf6' }}>
                                                        <EmailIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="活動履歴">
                                                    <IconButton size="small" onClick={(e) => handleOpenActivityModal(client, e)} sx={{ color: '#f59e0b' }}>
                                                        <HistoryIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="詳細へ">
                                                    <IconButton size="small" onClick={() => handleNavigateToClient(client.id)} sx={{ color: '#64748b' }}>
                                                        <ArrowForwardIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </Stack>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* 活動記録モーダル */}
            <Dialog open={logModalOpen} onClose={() => { setLogModalOpen(false); setLogTarget(null); }} fullWidth maxWidth="md">
                <DialogTitle>
                    {logTarget?.clientName ? `${logTarget.clientName} — 活動記録` : '活動記録の追加'}
                </DialogTitle>
                <DialogContent sx={{ pt: '16px !important' }}>
                    <ActivityLogForm
                        initialData={logTarget ? { type: logTarget.presetType, content: '' } : null}
                        onSubmit={handleSaveLog}
                        onCancel={() => { setLogModalOpen(false); setLogTarget(null); }}
                        isSaving={isSavingLog}
                    />
                </DialogContent>
            </Dialog>

            {/* 活動履歴モーダル */}
            <Dialog
                open={activityModalOpen}
                onClose={() => { setActivityModalOpen(false); setActivityTarget(null); }}
                fullWidth
                maxWidth="sm"
            >
                <DialogTitle sx={{ pb: 1 }}>
                    <Typography variant="h6" fontWeight="bold">
                        {activityTarget?.name} — 活動履歴
                    </Typography>
                    {/* 電話番号表示 */}
                    <Stack direction="row" spacing={2} mt={1}>
                        {activityTarget?.phone && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <PhoneIcon sx={{ fontSize: 16, color: '#3b82f6' }} />
                                <Typography
                                    component="a"
                                    href={`tel:${activityTarget.phone}`}
                                    variant="body2"
                                    sx={{ color: '#3b82f6', textDecoration: 'none', fontWeight: 'bold' }}
                                >
                                    {activityTarget.phone}
                                </Typography>
                            </Box>
                        )}
                        {activityTarget?.mobilePhone && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <PhoneAndroidIcon sx={{ fontSize: 16, color: '#10b981' }} />
                                <Typography
                                    component="a"
                                    href={`tel:${activityTarget.mobilePhone}`}
                                    variant="body2"
                                    sx={{ color: '#10b981', textDecoration: 'none', fontWeight: 'bold' }}
                                >
                                    {activityTarget.mobilePhone}
                                </Typography>
                            </Box>
                        )}
                        {!activityTarget?.phone && !activityTarget?.mobilePhone && (
                            <Typography variant="body2" color="text.secondary">電話番号未登録</Typography>
                        )}
                    </Stack>
                </DialogTitle>
                <DialogContent dividers sx={{ p: 0 }}>
                    {activityLogsLoading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                            <CircularProgress size={24} />
                        </Box>
                    ) : activityLogs.length === 0 ? (
                        <Box sx={{ p: 3, textAlign: 'center' }}>
                            <Typography color="text.secondary">活動記録がありません</Typography>
                        </Box>
                    ) : (
                        <Box>
                            {activityLogs.map((log, index) => (
                                <Box
                                    key={log.id}
                                    sx={{
                                        p: 2,
                                        borderBottom: index < activityLogs.length - 1 ? '1px solid rgba(255,255,255,0.08)' : 'none',
                                    }}
                                >
                                    <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                                        <Chip
                                            label={ACTIVITY_TYPE_LABELS[log.type] || log.type}
                                            size="small"
                                            sx={{ fontSize: '0.7rem', height: 20 }}
                                        />
                                        <Typography variant="caption" color="text.secondary">
                                            {log.createdAt?.toDate
                                                ? format(log.createdAt.toDate(), 'M/d(E) HH:mm', { locale: ja })
                                                : '日付不明'}
                                        </Typography>
                                        {log.staffName && (
                                            <Typography variant="caption" color="text.secondary">
                                                {log.staffName}
                                            </Typography>
                                        )}
                                    </Stack>
                                    {log.content && (
                                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', color: '#e2e8f0' }}>
                                            {log.content}
                                        </Typography>
                                    )}
                                </Box>
                            ))}
                        </Box>
                    )}
                </DialogContent>
            </Dialog>

            {/* スナックバー */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
                    severity={snackbar.severity}
                    variant="filled"
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}
