// src/pages/ScheduleCreationPage.jsx
// 利用スケジュール作成ページ
// 3列レイアウト: 左=未予約者、中央=カレンダー、右=予約済み

import React, { useState, useEffect, useMemo } from 'react';
import {
    Box,
    Typography,
    Paper,
    IconButton,
    CircularProgress,
    Avatar,
    Chip,
    Tooltip,
    Divider,
} from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PersonIcon from '@mui/icons-material/Person';
import EventIcon from '@mui/icons-material/Event';
import HomeIcon from '@mui/icons-material/Home';
import BusinessIcon from '@mui/icons-material/Business';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import PendingIcon from '@mui/icons-material/Pending';
import { collection, query, where, getDocs, doc, getDoc, setDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { format, startOfMonth, startOfWeek, addMonths, subMonths, isSameMonth, isToday, isSameDay } from 'date-fns';
import ja from 'date-fns/locale/ja';
import { getUpcomingHolidays, isHoliday } from '../utils/japaneseHolidays';
import CelebrationIcon from '@mui/icons-material/Celebration';

// 5行7列（35マス）のコンパクトカレンダーデータを生成
const generateCalendarDays = (monthDate) => {
    const startD = startOfWeek(startOfMonth(monthDate), { weekStartsOn: 0 });
    const days = [];
    for (let i = 0; i < 35; i++) {
        days.push(new Date(startD.getFullYear(), startD.getMonth(), startD.getDate() + i));
    }
    return days;
};

export default function ScheduleCreationPage() {
    const { companyId, isPlatform, loading: userLoading } = useCurrentUser();
    const [clients, setClients] = useState([]);
    const [clientPlans, setClientPlans] = useState({}); // clientId -> 予定日数
    const [selectedClient, setSelectedClient] = useState(null);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [plannedDates, setPlannedDates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const calendarDays = useMemo(() => generateCalendarDays(currentMonth), [currentMonth]);

    // 利用者一覧を取得
    useEffect(() => {
        if (userLoading) return;
        if (!isPlatform && !companyId) return;
        const fetchClients = async () => {
            try {
                const companyFilter = !isPlatform ? [where('companyId', '==', companyId)] : [];
                const q = query(
                    collection(db, 'clients'),
                    ...companyFilter,
                    where('status', 'in', ['active_onsite', 'active_remote'])
                );
                const snapshot = await getDocs(q);
                const clientList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                clientList.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ja'));
                setClients(clientList);
            } catch (error) {
                console.error('利用者取得エラー:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchClients();
    }, [isPlatform, companyId, userLoading]);

    // 全員の今月の予定日数を取得（1クエリで全員分）
    useEffect(() => {
        const fetchAllPlans = async () => {
            const year = currentMonth.getFullYear();
            const month = currentMonth.getMonth() + 1;

            try {
                // 1回のクエリで全員の予定を取得
                const companyFilter = !isPlatform ? [where('companyId', '==', companyId)] : [];
                const q = query(
                    collection(db, 'attendancePlans'),
                    ...companyFilter,
                    where('year', '==', year),
                    where('month', '==', month)
                );
                const snapshot = await getDocs(q);

                const plans = {};
                // 全員を0で初期化
                clients.forEach(c => { plans[c.id] = 0; });
                // 取得したデータで上書き
                snapshot.docs.forEach(doc => {
                    const data = doc.data();
                    if (data.clientId) {
                        plans[data.clientId] = (data.plannedDates || []).length;
                    }
                });
                setClientPlans(plans);
            } catch (error) {
                console.error('予定取得エラー:', error);
            }
        };

        if (clients.length > 0) {
            fetchAllPlans();
        }
    }, [clients, currentMonth]);

    // 選択した利用者の予定を取得
    useEffect(() => {
        if (!selectedClient) return;

        const fetchPlannedDates = async () => {
            const year = currentMonth.getFullYear();
            const month = currentMonth.getMonth() + 1;
            const planId = `${selectedClient.id}_${year}_${month}`;

            try {
                const planDoc = await getDoc(doc(db, 'attendancePlans', planId));
                if (planDoc.exists()) {
                    const data = planDoc.data();
                    const dates = (data.plannedDates || []).map(ts => ts.toDate());
                    setPlannedDates(dates);
                } else {
                    setPlannedDates([]);
                }
            } catch (error) {
                console.error('予定取得エラー:', error);
                setPlannedDates([]);
            }
        };
        fetchPlannedDates();
    }, [selectedClient, currentMonth]);

    // 日付をトグル
    const toggleDate = async (date) => {
        if (!selectedClient || !isSameMonth(date, currentMonth)) return;

        setSaving(true);
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth() + 1;
        const planId = `${selectedClient.id}_${year}_${month}`;

        const isSelected = plannedDates.some(d => isSameDay(d, date));
        let newDates = isSelected
            ? plannedDates.filter(d => !isSameDay(d, date))
            : [...plannedDates, date];

        setPlannedDates(newDates);

        try {
            const planRef = doc(db, 'attendancePlans', planId);
            const planDoc = await getDoc(planRef);

            const planData = {
                clientId: selectedClient.id,
                companyId: selectedClient.companyId || companyId,
                year,
                month,
                plannedDates: newDates.map(d => Timestamp.fromDate(d)),
                updatedAt: Timestamp.now(),
            };

            if (planDoc.exists()) {
                await updateDoc(planRef, planData);
            } else {
                await setDoc(planRef, { ...planData, createdAt: Timestamp.now() });
            }

            // 予定日数を更新
            setClientPlans(prev => ({ ...prev, [selectedClient.id]: newDates.length }));
        } catch (error) {
            console.error('保存エラー:', error);
            setPlannedDates(plannedDates);
        } finally {
            setSaving(false);
        }
    };

    // 未予約/予約済みで分類
    const unscheduledClients = clients.filter(c => (clientPlans[c.id] || 0) === 0);
    const scheduledClients = clients.filter(c => (clientPlans[c.id] || 0) > 0);
    const selectedDaysCount = plannedDates.filter(d => isSameMonth(d, currentMonth)).length;

    // クライアントカードコンポーネント
    const ClientCard = ({ client, showDays = false }) => (
        <Paper
            onClick={() => setSelectedClient(client)}
            sx={{
                p: 1,
                mb: 0.5,
                cursor: 'pointer',
                backgroundColor: selectedClient?.id === client.id
                    ? 'rgba(139, 92, 246, 0.3)'
                    : 'rgba(255, 255, 255, 0.05)',
                border: selectedClient?.id === client.id
                    ? '2px solid #8b5cf6'
                    : '1px solid transparent',
                transition: 'all 0.2s',
                '&:hover': { backgroundColor: 'rgba(139, 92, 246, 0.2)' },
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0 }}>
                    <Avatar sx={{
                        width: 24,
                        height: 24,
                        bgcolor: client.status === 'active_onsite' ? '#10b981' : '#3b82f6',
                        fontSize: '0.7rem'
                    }}>
                        {client.status === 'active_onsite' ? <HomeIcon sx={{ fontSize: 14 }} /> : <BusinessIcon sx={{ fontSize: 14 }} />}
                    </Avatar>
                    <Typography
                        sx={{
                            color: '#fff',
                            fontWeight: selectedClient?.id === client.id ? 'bold' : 'normal',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            fontSize: '0.85rem',
                        }}
                    >
                        {client.name || '名前なし'}
                    </Typography>
                </Box>
                {showDays && (
                    <Chip
                        label={`${clientPlans[client.id] || 0}日`}
                        size="small"
                        sx={{ fontSize: '0.7rem', height: 20, bgcolor: 'rgba(16, 185, 129, 0.3)', color: '#10b981' }}
                    />
                )}
            </Box>
        </Paper>
    );

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 2, height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
            {/* ヘッダー */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <EventIcon sx={{ color: '#8b5cf6', mr: 1, fontSize: 28 }} />
                    <Typography variant="h5" sx={{ color: '#fff' }}>
                        利用スケジュール作成
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <IconButton onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} sx={{ color: '#fff' }}>
                        <ArrowBackIosNewIcon />
                    </IconButton>
                    <Typography variant="h6" sx={{ color: '#fff', minWidth: 120, textAlign: 'center' }}>
                        {format(currentMonth, 'yyyy年 M月', { locale: ja })}
                    </Typography>
                    <IconButton onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} sx={{ color: '#fff' }}>
                        <ArrowForwardIosIcon />
                    </IconButton>
                </Box>
            </Box>

            {/* 3列レイアウト */}
            <Box sx={{ display: 'flex', gap: 2, flex: 1, minHeight: 0, overflow: 'hidden' }}>
                {/* 左: 未予約 */}
                <Paper sx={{
                    width: 220,
                    flexShrink: 0,
                    backgroundColor: '#1a1a2e',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                }}>
                    <Box sx={{ p: 1, borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <PendingIcon sx={{ fontSize: 18, color: '#f59e0b' }} />
                        <Typography variant="subtitle2" sx={{ color: '#f59e0b', fontWeight: 'bold' }}>
                            未予約（{unscheduledClients.length}名）
                        </Typography>
                    </Box>
                    <Box sx={{ flex: 1, overflow: 'auto', p: 0.5 }}>
                        {unscheduledClients.length === 0 ? (
                            <Typography sx={{ color: '#94a3b8', fontSize: '0.8rem', textAlign: 'center', p: 2 }}>
                                全員予約済み 🎉
                            </Typography>
                        ) : (
                            unscheduledClients.map(client => <ClientCard key={client.id} client={client} />)
                        )}
                    </Box>
                </Paper>

                {/* 中央: カレンダー */}
                <Paper sx={{
                    flex: 1,
                    backgroundColor: '#1a1a2e',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                }}>
                    {/* カレンダーヘッダー */}
                    <Box sx={{ p: 1.5, borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="subtitle1" sx={{ color: '#fff', fontWeight: 'bold' }}>
                            {selectedClient ? `${selectedClient.name} さん` : '利用者を選択'}
                        </Typography>
                        {selectedClient && (
                            <>
                                <Chip
                                    label={`${selectedDaysCount}日`}
                                    size="small"
                                    sx={{ bgcolor: 'rgba(139, 92, 246, 0.3)', color: '#8b5cf6' }}
                                />
                                {saving && <CircularProgress size={16} />}
                            </>
                        )}
                    </Box>

                    {/* カレンダー本体 */}
                    <Box sx={{ p: 1.5, overflow: 'hidden' }}>
                        {/* 曜日ヘッダー */}
                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5, mb: 0.5 }}>
                            {['日', '月', '火', '水', '木', '金', '土'].map((day, i) => (
                                <Typography
                                    key={day}
                                    align="center"
                                    sx={{
                                        fontWeight: 'bold',
                                        fontSize: '0.75rem',
                                        color: i === 0 ? '#ef4444' : i === 6 ? '#3b82f6' : '#94a3b8',
                                        py: 0.25,
                                    }}
                                >
                                    {day}
                                </Typography>
                            ))}
                        </Box>

                        {/* 日付グリッド - 固定高さ */}
                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridTemplateRows: 'repeat(5, 56px)', gap: 0.5 }}>
                            {calendarDays.map((day) => {
                                const dateKey = format(day, 'yyyy-MM-dd');
                                const isCurrentMonth = isSameMonth(day, currentMonth);
                                const isSelected = selectedClient && plannedDates.some(d => isSameDay(d, day));
                                const dayOfWeek = day.getDay();
                                const isClickable = isCurrentMonth && selectedClient;

                                return (
                                    <Tooltip key={dateKey} title={isClickable ? (isSelected ? '解除' : '追加') : ''}>
                                        <Paper
                                            onClick={() => isClickable && toggleDate(day)}
                                            sx={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                cursor: isClickable ? 'pointer' : 'default',
                                                backgroundColor: isSelected
                                                    ? 'rgba(139, 92, 246, 0.4)'
                                                    : 'rgba(255, 255, 255, 0.03)',
                                                border: isToday(day)
                                                    ? '2px solid #8b5cf6'
                                                    : isSelected
                                                        ? '1px solid #8b5cf6'
                                                        : '1px solid rgba(255,255,255,0.1)',
                                                opacity: isCurrentMonth ? 1 : 0.3,
                                                transition: 'all 0.1s',
                                                '&:hover': isClickable ? {
                                                    backgroundColor: isSelected
                                                        ? 'rgba(139, 92, 246, 0.5)'
                                                        : 'rgba(139, 92, 246, 0.2)',
                                                } : {},
                                            }}
                                        >
                                            <Typography
                                                sx={{
                                                    fontSize: '0.9rem',
                                                    color: !isCurrentMonth
                                                        ? '#64748b'
                                                        : dayOfWeek === 0
                                                            ? '#ef4444'
                                                            : dayOfWeek === 6
                                                                ? '#3b82f6'
                                                                : '#fff',
                                                    fontWeight: isToday(day) ? 'bold' : 'normal',
                                                }}
                                            >
                                                {format(day, 'd')}
                                            </Typography>
                                            {isSelected && isCurrentMonth && (
                                                <CheckCircleIcon sx={{ color: '#8b5cf6', fontSize: 14 }} />
                                            )}
                                        </Paper>
                                    </Tooltip>
                                );
                            })}
                        </Box>
                    </Box>

                    {/* 祈日セクション */}
                    <Box sx={{
                        p: 1.5,
                        borderTop: '1px solid rgba(255,255,255,0.1)',
                        flex: 1,
                        overflow: 'auto',
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                            <CelebrationIcon sx={{ fontSize: 16, color: '#f59e0b' }} />
                            <Typography variant="caption" sx={{ color: '#f59e0b', fontWeight: 'bold' }}>
                                今後1年の祝日
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                            {getUpcomingHolidays(11).map((monthData) => (
                                <Box key={`${monthData.year}-${monthData.month}`} sx={{ minWidth: 100 }}>
                                    <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 'bold' }}>
                                        {monthData.month}月
                                    </Typography>
                                    {monthData.holidays.map((h, i) => (
                                        <Typography
                                            key={i}
                                            variant="caption"
                                            sx={{
                                                display: 'block',
                                                color: '#ef4444',
                                                fontSize: '0.7rem',
                                                lineHeight: 1.4,
                                            }}
                                        >
                                            {h.day}日 {h.name}
                                        </Typography>
                                    ))}
                                </Box>
                            ))}
                        </Box>
                    </Box>
                </Paper>

                {/* 右: 予約済み */}
                <Paper sx={{
                    width: 220,
                    flexShrink: 0,
                    backgroundColor: '#1a1a2e',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                }}>
                    <Box sx={{ p: 1, borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <EventAvailableIcon sx={{ fontSize: 18, color: '#10b981' }} />
                        <Typography variant="subtitle2" sx={{ color: '#10b981', fontWeight: 'bold' }}>
                            予約済み（{scheduledClients.length}名）
                        </Typography>
                    </Box>
                    <Box sx={{ flex: 1, overflow: 'auto', p: 0.5 }}>
                        {scheduledClients.length === 0 ? (
                            <Typography sx={{ color: '#94a3b8', fontSize: '0.8rem', textAlign: 'center', p: 2 }}>
                                まだ予約がありません
                            </Typography>
                        ) : (
                            scheduledClients.map(client => <ClientCard key={client.id} client={client} showDays />)
                        )}
                    </Box>
                </Paper>
            </Box>
        </Box>
    );
}
