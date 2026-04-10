// src/pages/MonthlyPlannerPage.jsx
// 月次出欠一覧表（予定・実績マトリックス）

import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  IconButton,
  CircularProgress,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Chip,
} from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import BusinessIcon from '@mui/icons-material/Business';
import HomeIcon from '@mui/icons-material/Home';
import { collection, query, where, getDocs, getDoc, doc, setDoc, deleteDoc, Timestamp, or } from 'firebase/firestore';
import { db } from '../firebase';
import { format, getDaysInMonth, addMonths, subMonths, getDay } from 'date-fns';
import ja from 'date-fns/locale/ja';
import { isHoliday } from '../utils/japaneseHolidays';
import { useCurrentUser } from '../hooks/useCurrentUser';

// 施設定員（仮）
const FACILITY_CAPACITY = 20;

// 活動内容のデフォルト（Firestoreから取得できない場合のフォールバック）
const DEFAULT_ACTIVITY_OPTIONS = [
  'PC作業', '軽作業', '事務作業', 'ビジネスマナー',
  '就職活動', 'グループワーク', '面談', '運動',
  '清掃', '調理', '自習', '外出訓練',
];

export default function MonthlyPlannerPage() {
  const { companyId, isPlatform, loading: userLoading } = useCurrentUser();
  const [clients, setClients] = useState([]);
  const [plans, setPlans] = useState({}); // clientId -> Set of date strings (yyyy-MM-dd)
  const [records, setRecords] = useState({}); // clientId -> { dateStr: { status, recordId } }
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activityOptions, setActivityOptions] = useState(DEFAULT_ACTIVITY_OPTIONS);

  // 出席入力モーダル用のstate
  const [modalOpen, setModalOpen] = useState(false);
  const [modalClient, setModalClient] = useState(null);
  const [modalDayInfo, setModalDayInfo] = useState(null);
  const [modalForm, setModalForm] = useState({
    attendanceType: 'onsite', // 通所 or 在宅
    startTime: '10:00',
    endTime: '16:00',
    activities: [],
  });

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth() + 1;
  const daysInMonth = getDaysInMonth(currentMonth);

  // 日付配列を生成
  const days = useMemo(() => {
    const arr = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month - 1, d);
      arr.push({
        day: d,
        date,
        dateStr: format(date, 'yyyy-MM-dd'),
        dayOfWeek: getDay(date),
        holiday: isHoliday(date),
      });
    }
    return arr;
  }, [year, month, daysInMonth]);

  // 支援業務設定から活動内容の選択肢を取得
  useEffect(() => {
    const fetchActivityOptions = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'systemSettings', 'supportConfig'));
        if (docSnap.exists() && docSnap.data().activityOptions?.length > 0) {
          setActivityOptions(docSnap.data().activityOptions);
        }
      } catch (err) {
        console.error('活動内容設定の取得エラー:', err);
      }
    };
    fetchActivityOptions();
  }, []);

  // 予定・実績・利用者を取得
  // ※月の途中で卒業・就職になりステータスが変わった利用者も、その月に実績や予定があれば表示する
  useEffect(() => {
    if (userLoading) return;
    if (!isPlatform && !companyId) return;
    const fetchData = async () => {
      setLoading(true);
      const companyFilter = !isPlatform ? [where('companyId', '==', companyId)] : [];
      try {
        // 予定を取得
        const plansQuery = query(
          collection(db, 'attendancePlans'),
          ...companyFilter,
          where('year', '==', year),
          where('month', '==', month)
        );
        const plansSnap = await getDocs(plansQuery);
        const plansMap = {};
        plansSnap.docs.forEach(doc => {
          const data = doc.data();
          if (data.clientId && data.plannedDates) {
            const dateSet = new Set();
            data.plannedDates.forEach(ts => {
              const d = ts.toDate();
              dateSet.add(format(d, 'yyyy-MM-dd'));
            });
            plansMap[data.clientId] = dateSet;
          }
        });
        setPlans(plansMap);

        // 実績を取得
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);
        const recordsQuery = query(
          collection(db, 'attendanceRecords'),
          ...companyFilter,
          where('date', '>=', Timestamp.fromDate(startDate)),
          where('date', '<=', Timestamp.fromDate(endDate))
        );
        const recordsSnap = await getDocs(recordsQuery);
        const recordsMap = {};
        recordsSnap.docs.forEach(doc => {
          const data = doc.data();
          if (data.clientId && data.date) {
            const dateStr = format(data.date.toDate(), 'yyyy-MM-dd');
            if (!recordsMap[data.clientId]) {
              recordsMap[data.clientId] = {};
            }
            // 既に同じ日のレコードがあれば上書きしない（重複防止）
            if (!recordsMap[data.clientId][dateStr]) {
              recordsMap[data.clientId][dateStr] = {
                status: data.status,
                workType: data.workType || 'onsite', // 通所/在宅
                recordId: doc.id,
              };
            } else {
              console.warn(`重複レコード検出: clientId=${data.clientId}, date=${dateStr}, 既存ID=${recordsMap[data.clientId][dateStr].recordId}, 重複ID=${doc.id}`);
            }
          }
        });
        setRecords(recordsMap);

        // 利用者一覧を取得（ステータスで絞らない）
        // 月内に予定 or 実績があった利用者 + 現在アクティブな利用者 を対象とする
        const clientsQuery = query(collection(db, 'clients'), ...companyFilter);
        const clientsSnap = await getDocs(clientsQuery);
        const monthClientIds = new Set([
          ...Object.keys(plansMap),
          ...Object.keys(recordsMap),
        ]);
        const list = clientsSnap.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(c => {
            if (monthClientIds.has(c.id)) return true;
            return c.status === 'active_onsite' || c.status === 'active_remote';
          });
        list.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ja'));
        setClients(list);
      } catch (error) {
        console.error('データ取得エラー:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [year, month, isPlatform, companyId, userLoading]);

  // 日別の出席者数を計算
  const dailyTotals = useMemo(() => {
    const totals = {};
    days.forEach(dayInfo => {
      let count = 0;
      clients.forEach(client => {
        const record = records[client.id]?.[dayInfo.dateStr];
        if (record?.status === 'present') count++;
      });
      totals[dayInfo.dateStr] = count;
    });
    return totals;
  }, [days, clients, records]);

  // 月間実績コマ合計を計算
  const monthlyActualTotal = useMemo(() => {
    return Object.values(dailyTotals).reduce((sum, count) => sum + count, 0);
  }, [dailyTotals]);

  // 月間予定コマ合計を計算
  const monthlyPlannedTotal = useMemo(() => {
    let total = 0;
    clients.forEach(client => {
      const clientPlans = plans[client.id];
      if (clientPlans) {
        total += clientPlans.size;
      }
    });
    return total;
  }, [clients, plans]);

  // 利用者別の月間実績を計算
  const clientTotals = useMemo(() => {
    const totals = {};
    const defaultLimit = daysInMonth - 8; // 月-8がデフォルト
    clients.forEach(client => {
      let presentCount = 0;
      days.forEach(dayInfo => {
        const record = records[client.id]?.[dayInfo.dateStr];
        if (record?.status === 'present') presentCount++;
      });
      // 利用者に個別設定があればそれを使う、なければ月-8
      const limit = client.monthlyLimit || defaultLimit;
      totals[client.id] = { present: presentCount, limit };
    });
    return totals;
  }, [clients, days, records, daysInMonth]);

  // 実績をトグル（4段階: なし → モーダル → 在宅 → 欠席 → 削除）
  const toggleRecord = async (client, dayInfo) => {
    if (saving) return;

    const dateStr = dayInfo.dateStr;
    const clientRecords = records[client.id] || {};
    const currentRecord = clientRecords[dateStr];

    // 新規作成の場合はモーダルを開く
    if (!currentRecord) {
      setModalClient(client);
      setModalDayInfo(dayInfo);
      setModalForm({
        attendanceType: 'onsite',
        startTime: '10:00',
        endTime: '16:00',
        activities: [],
      });
      setModalOpen(true);
      return;
    }

    // 既存レコードの場合はトグル（通所→在宅→欠席→削除）
    setSaving(true);
    try {
      if (currentRecord.status === 'present' && currentRecord.workType === 'onsite') {
        // 通所 → 在宅
        await setDoc(doc(db, 'attendanceRecords', currentRecord.recordId), {
          workType: 'remote',
          attendanceType: 'remote',
          updatedAt: Timestamp.now(),
        }, { merge: true });
        setRecords(prev => ({
          ...prev,
          [client.id]: {
            ...(prev[client.id] || {}),
            [dateStr]: { ...currentRecord, workType: 'remote' },
          },
        }));
      } else if (currentRecord.status === 'present' && currentRecord.workType === 'remote') {
        // 在宅 → 欠席
        await setDoc(doc(db, 'attendanceRecords', currentRecord.recordId), {
          status: 'absent',
          workType: null,
          attendanceType: null,
          updatedAt: Timestamp.now(),
        }, { merge: true });
        setRecords(prev => ({
          ...prev,
          [client.id]: {
            ...(prev[client.id] || {}),
            [dateStr]: { ...currentRecord, status: 'absent', workType: null },
          },
        }));
      } else {
        // 欠席 → 削除
        await deleteDoc(doc(db, 'attendanceRecords', currentRecord.recordId));
        setRecords(prev => {
          const newClientRecords = { ...(prev[client.id] || {}) };
          delete newClientRecords[dateStr];
          return { ...prev, [client.id]: newClientRecords };
        });
      }
    } catch (error) {
      console.error('更新エラー:', error);
    } finally {
      setSaving(false);
    }
  };

  // モーダルから出席を保存
  const handleSaveAttendance = async () => {
    if (!modalClient || !modalDayInfo) return;
    setSaving(true);

    try {
      const dateStr = modalDayInfo.dateStr;
      // 統一されたドキュメントID
      const docId = `${modalClient.id}_${dateStr}`;

      const newRecord = {
        clientId: modalClient.id,
        clientName: modalClient.name || '',
        companyId: modalClient.companyId || companyId,
        date: Timestamp.fromDate(modalDayInfo.date),
        status: 'present',
        workType: modalForm.attendanceType,
        attendanceType: modalForm.attendanceType, // DailyCheckinPageとの互換性
        staffId: 'monthly-planner',
        staffName: '月次計画入力',
        startTime: modalForm.startTime,
        endTime: modalForm.endTime,
        activitiesAm: modalForm.activities, // 活動内容
        activitiesPm: [],
        serviceDetails: {
          mealSupport: false,
          transportGoing: false,
          transportReturning: false,
          homeVisit: false,
        },
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      await setDoc(doc(db, 'attendanceRecords', docId), newRecord, { merge: true });

      setRecords(prev => ({
        ...prev,
        [modalClient.id]: {
          ...(prev[modalClient.id] || {}),
          [dateStr]: { status: 'present', workType: modalForm.attendanceType, recordId: docId },
        },
      }));

      setModalOpen(false);
    } catch (error) {
      console.error('保存エラー:', error);
    } finally {
      setSaving(false);
    }
  };

  // 活動内容のトグル
  const handleActivityToggle = (activity) => {
    setModalForm(prev => ({
      ...prev,
      activities: prev.activities.includes(activity)
        ? prev.activities.filter(a => a !== activity)
        : [...prev.activities, activity],
    }));
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // セルスタイル
  const cellBase = {
    minWidth: 28,
    height: 28,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.7rem',
    borderRight: '1px solid rgba(255,255,255,0.1)',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
  };

  return (
    <Box sx={{ p: 2, height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* ヘッダー */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1, flexShrink: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <CalendarMonthIcon sx={{ color: '#8b5cf6', mr: 1, fontSize: 24 }} />
          <Typography variant="h6" sx={{ color: '#fff' }}>
            月次出欠一覧
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5, bgcolor: 'rgba(245, 158, 11, 0.2)', px: 1.5, py: 0.5, borderRadius: 1 }}>
            <Typography variant="caption" sx={{ color: '#94a3b8' }}>
              予定
            </Typography>
            <Typography variant="h6" sx={{ color: '#f59e0b', fontWeight: 'bold' }}>
              {monthlyPlannedTotal}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5, bgcolor: 'rgba(16, 185, 129, 0.2)', px: 1.5, py: 0.5, borderRadius: 1 }}>
            <Typography variant="caption" sx={{ color: '#94a3b8' }}>
              実績
            </Typography>
            <Typography variant="h6" sx={{ color: '#10b981', fontWeight: 'bold' }}>
              {monthlyActualTotal}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton size="small" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} sx={{ color: '#fff' }}>
            <ArrowBackIosNewIcon fontSize="small" />
          </IconButton>
          <Typography variant="subtitle1" sx={{ color: '#fff', minWidth: 100, textAlign: 'center' }}>
            {format(currentMonth, 'yyyy年 M月', { locale: ja })}
          </Typography>
          <IconButton size="small" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} sx={{ color: '#fff' }}>
            <ArrowForwardIosIcon fontSize="small" />
          </IconButton>
          {saving && <CircularProgress size={16} />}
        </Box>
      </Box>

      {/* 凡例 */}
      <Box sx={{ display: 'flex', gap: 2, mb: 1, fontSize: '0.75rem', flexShrink: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#f59e0b' }} />
          <Typography variant="caption" sx={{ color: '#94a3b8' }}>予定</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Typography sx={{ color: '#3b82f6', fontWeight: 'bold', fontSize: '0.75rem' }}>✓</Typography>
          <Typography variant="caption" sx={{ color: '#94a3b8' }}>通所</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Typography sx={{ color: '#10b981', fontWeight: 'bold', fontSize: '0.75rem' }}>▲</Typography>
          <Typography variant="caption" sx={{ color: '#94a3b8' }}>在宅</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Typography sx={{ color: '#ef4444', fontWeight: 'bold', fontSize: '0.75rem' }}>✗</Typography>
          <Typography variant="caption" sx={{ color: '#94a3b8' }}>欠席</Typography>
        </Box>
        <Typography variant="caption" sx={{ color: '#94a3b8', ml: 2 }}>
          定員: {FACILITY_CAPACITY}名
        </Typography>
      </Box>

      {/* テーブル */}
      <Paper sx={{ flex: 1, backgroundColor: '#1a1a2e', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {/* 日別合計行（最上部固定） */}
        <Box sx={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.2)', flexShrink: 0, backgroundColor: '#0f0f1a' }}>
          <Box sx={{ minWidth: 100, p: 0.5, borderRight: '1px solid rgba(255,255,255,0.2)', color: '#f59e0b', fontWeight: 'bold', fontSize: '0.7rem' }}>
            日別合計
          </Box>
          {days.map(dayInfo => {
            const total = dailyTotals[dayInfo.dateStr];
            const isOver = total > FACILITY_CAPACITY;
            return (
              <Box
                key={dayInfo.day}
                sx={{
                  ...cellBase,
                  fontWeight: 'bold',
                  color: isOver ? '#ef4444' : total > 0 ? '#10b981' : '#64748b',
                  backgroundColor: isOver ? 'rgba(239, 68, 68, 0.3)' : 'transparent',
                }}
              >
                {total}
              </Box>
            );
          })}
          <Box sx={{ minWidth: 50, p: 0.5, borderLeft: '2px solid rgba(255,255,255,0.2)' }} />
        </Box>

        {/* 日付ヘッダー行 */}
        <Box sx={{ display: 'flex', borderBottom: '2px solid rgba(255,255,255,0.2)', flexShrink: 0 }}>
          <Box sx={{ minWidth: 100, p: 0.5, borderRight: '1px solid rgba(255,255,255,0.2)', color: '#fff', fontWeight: 'bold', fontSize: '0.75rem' }}>
            利用者
          </Box>
          {days.map(dayInfo => (
            <Box
              key={dayInfo.day}
              sx={{
                ...cellBase,
                fontWeight: 'bold',
                color: dayInfo.holiday || dayInfo.dayOfWeek === 0 ? '#ef4444' : dayInfo.dayOfWeek === 6 ? '#3b82f6' : '#fff',
                backgroundColor: dayInfo.holiday || dayInfo.dayOfWeek === 0 ? 'rgba(239, 68, 68, 0.15)' : dayInfo.dayOfWeek === 6 ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
              }}
            >
              {dayInfo.day}
            </Box>
          ))}
          <Box sx={{ minWidth: 50, p: 0.5, borderLeft: '2px solid rgba(255,255,255,0.2)', color: '#fff', fontWeight: 'bold', fontSize: '0.7rem', textAlign: 'center' }}>
            合計
          </Box>
        </Box>

        {/* データ行（スクロール） */}
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          {clients.map(client => {
            const clientTotal = clientTotals[client.id];
            const isOverLimit = clientTotal.present > clientTotal.limit;

            return (
              <Box key={client.id} sx={{ display: 'flex', '&:hover': { backgroundColor: 'rgba(139, 92, 246, 0.1)' } }}>
                <Box sx={{
                  minWidth: 100,
                  maxWidth: 100,
                  p: 0.5,
                  borderRight: '1px solid rgba(255,255,255,0.2)',
                  borderBottom: '1px solid rgba(255,255,255,0.1)',
                  color: '#fff',
                  fontSize: '0.75rem',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {client.name || '名前なし'}
                </Box>
                {days.map(dayInfo => {
                  const hasPlan = plans[client.id]?.has(dayInfo.dateStr);
                  const record = records[client.id]?.[dayInfo.dateStr];
                  const bgColor = dayInfo.holiday || dayInfo.dayOfWeek === 0 ? 'rgba(239, 68, 68, 0.08)' : dayInfo.dayOfWeek === 6 ? 'rgba(59, 130, 246, 0.08)' : 'transparent';

                  return (
                    <Tooltip key={dayInfo.day} title={`${dayInfo.day}日: クリックで切替`}>
                      <Box
                        onClick={() => toggleRecord(client, dayInfo)}
                        sx={{
                          ...cellBase,
                          cursor: 'pointer',
                          backgroundColor: bgColor,
                          '&:hover': { backgroundColor: 'rgba(139, 92, 246, 0.3)' },
                        }}
                      >
                        {hasPlan && <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#f59e0b' }} />}
                        {record?.status === 'present' && record?.workType === 'onsite' && <Typography sx={{ color: '#3b82f6', fontWeight: 'bold', fontSize: '0.7rem', lineHeight: 1 }}>✓</Typography>}
                        {record?.status === 'present' && record?.workType === 'remote' && <Typography sx={{ color: '#10b981', fontWeight: 'bold', fontSize: '0.7rem', lineHeight: 1 }}>▲</Typography>}
                        {record?.status === 'present' && !record?.workType && <Typography sx={{ color: '#3b82f6', fontWeight: 'bold', fontSize: '0.7rem', lineHeight: 1 }}>✓</Typography>}
                        {record?.status === 'absent' && <Typography sx={{ color: '#ef4444', fontWeight: 'bold', fontSize: '0.7rem', lineHeight: 1 }}>✗</Typography>}
                      </Box>
                    </Tooltip>
                  );
                })}
                <Box sx={{
                  minWidth: 50,
                  p: 0.5,
                  borderLeft: '2px solid rgba(255,255,255,0.2)',
                  borderBottom: '1px solid rgba(255,255,255,0.1)',
                  textAlign: 'center',
                  fontSize: '0.7rem',
                  color: isOverLimit ? '#ef4444' : '#10b981',
                  fontWeight: 'bold',
                  backgroundColor: isOverLimit ? 'rgba(239, 68, 68, 0.2)' : 'transparent',
                }}>
                  {clientTotal.present}/{clientTotal.limit}
                </Box>
              </Box>
            );
          })}
        </Box>
      </Paper>

      {/* 出席入力モーダル */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: '#1e1e2e', color: '#fff' }}>
          出席入力
          {modalClient && modalDayInfo && (
            <Typography variant="subtitle2" sx={{ color: '#94a3b8' }}>
              {modalClient.name} - {modalDayInfo.day}日
            </Typography>
          )}
        </DialogTitle>
        <DialogContent sx={{ bgcolor: '#1e1e2e', pt: 2 }}>
          {/* 通所/在宅切替 */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ color: '#94a3b8', mb: 1 }}>出席タイプ</Typography>
            <ToggleButtonGroup
              value={modalForm.attendanceType}
              exclusive
              fullWidth
              onChange={(e, value) => value && setModalForm(prev => ({ ...prev, attendanceType: value }))}
            >
              <ToggleButton value="onsite" sx={{ color: '#3b82f6', '&.Mui-selected': { bgcolor: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6' } }}>
                <BusinessIcon sx={{ mr: 1 }} /> 通所
              </ToggleButton>
              <ToggleButton value="remote" sx={{ color: '#10b981', '&.Mui-selected': { bgcolor: 'rgba(16, 185, 129, 0.2)', color: '#10b981' } }}>
                <HomeIcon sx={{ mr: 1 }} /> 在宅
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {/* 時間入力 */}
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <TextField
              label="開始時刻"
              type="time"
              value={modalForm.startTime}
              onChange={(e) => setModalForm(prev => ({ ...prev, startTime: e.target.value }))}
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ '& .MuiOutlinedInput-root': { color: '#fff' }, '& .MuiInputLabel-root': { color: '#94a3b8' } }}
            />
            <TextField
              label="終了時刻"
              type="time"
              value={modalForm.endTime}
              onChange={(e) => setModalForm(prev => ({ ...prev, endTime: e.target.value }))}
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ '& .MuiOutlinedInput-root': { color: '#fff' }, '& .MuiInputLabel-root': { color: '#94a3b8' } }}
            />
          </Box>

          {/* 活動内容 */}
          <Box>
            <Typography variant="subtitle2" sx={{ color: '#94a3b8', mb: 1 }}>活動内容</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {activityOptions.map(activity => (
                <Chip
                  key={activity}
                  label={activity}
                  clickable
                  onClick={() => handleActivityToggle(activity)}
                  sx={{
                    bgcolor: modalForm.activities.includes(activity) ? 'rgba(139, 92, 246, 0.3)' : 'transparent',
                    color: modalForm.activities.includes(activity) ? '#a78bfa' : '#94a3b8',
                    border: '1px solid',
                    borderColor: modalForm.activities.includes(activity) ? '#8b5cf6' : '#4a5568',
                  }}
                />
              ))}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ bgcolor: '#1e1e2e', p: 2 }}>
          <Button onClick={() => setModalOpen(false)} sx={{ color: '#94a3b8' }}>
            キャンセル
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveAttendance}
            disabled={saving}
            sx={{ bgcolor: '#8b5cf6', '&:hover': { bgcolor: '#7c3aed' } }}
          >
            {saving ? <CircularProgress size={20} /> : '保存'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}