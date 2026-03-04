import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Paper, List, ListItem, CircularProgress, Divider, Stack, Button, Alert, Grid, ToggleButtonGroup, ToggleButton, Chip } from '@mui/material';
import { collection, query, where, getDocs, Timestamp, addDoc, serverTimestamp, doc, updateDoc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/index';
import { useAuth } from "../features/auth/context/AuthContext";
import { format } from 'date-fns';
import HomeIcon from '@mui/icons-material/Home';
import BusinessIcon from '@mui/icons-material/Business';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { CHARGE_FIELD_MAP } from '../constants/chargeFields';

const DailyCheckinPage = () => {
  const { currentUser } = useAuth();
  const [todaysPlans, setTodaysPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [records, setRecords] = useState(new Map());
  const [healthData, setHealthData] = useState(new Map());
  const [serviceCharges, setServiceCharges] = useState(new Map()); // 加算状態
  const [enabledCharges, setEnabledCharges] = useState([]); // 支店設定から読み込んだ有効な加算項目


  const fetchTodaysData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      // 0. 支店設定を読み込み（TODO: 現在のユーザーの支店IDを使用）
      // 仮で最初の支店設定を取得、後でuser.branchIdから取得するよう修正
      const branchesSnapshot = await getDocs(collection(db, 'branches'));
      console.log('=== 支店設定デバッグ ===');
      console.log('支店数:', branchesSnapshot.size);
      if (!branchesSnapshot.empty) {
        const branchData = branchesSnapshot.docs[0].data();
        console.log('支店データ:', branchData);

        // 支店設定から有効な加算項目を抽出
        const charges = Object.entries(CHARGE_FIELD_MAP)
          .filter(([fieldKey, _]) => {
            const isEnabled = branchData[fieldKey] === true;
            console.log(`${fieldKey}: ${branchData[fieldKey]} -> ${isEnabled ? '有効' : '無効'}`);
            return isEnabled;
          })
          .map(([_, mapping]) => mapping);

        console.log('有効な加算項目:', charges);

        // 有効な加算項目がある場合のみセット、なければデフォルト
        if (charges.length > 0) {
          setEnabledCharges(charges);
        } else {
          console.log('加算項目がないのでデフォルトを使用');
          // 支店で何も設定されていない場合はデフォルト（食事、送迎）を表示
          setEnabledCharges([
            CHARGE_FIELD_MAP.attendanceMealSupport,
            CHARGE_FIELD_MAP.attendanceTransportGoing,
            CHARGE_FIELD_MAP.attendanceTransportReturning,
          ]);
        }
      } else {
        console.log('支店設定がないのでデフォルトを使用');
        // 支店設定がない場合はデフォルト（食事、送迎）
        setEnabledCharges([
          CHARGE_FIELD_MAP.attendanceMealSupport,
          CHARGE_FIELD_MAP.attendanceTransportGoing,
          CHARGE_FIELD_MAP.attendanceTransportReturning,
        ]);
      }


      // 1. 今日の既存の出欠記録を取得
      const recordsQuery = query(collection(db, 'attendanceRecords'), where('date', '>=', Timestamp.fromDate(todayStart)), where('date', '<=', Timestamp.fromDate(todayEnd)));
      const recordsSnapshot = await getDocs(recordsQuery);
      const existingRecords = new Map();
      const chargesMap = new Map();
      recordsSnapshot.forEach(d => {
        const data = d.data();
        existingRecords.set(data.clientId, {
          recordId: d.id,
          status: data.status,
          attendanceType: data.attendanceType || 'onsite',
          isPortalEntry: data.staffId === 'portal-checkin' // ポータル入力済みフラグ
        });
        // serviceDetailsを加算状態として保存
        if (data.serviceDetails) {
          chargesMap.set(data.clientId, data.serviceDetails);
        }
      });
      setRecords(existingRecords);
      setServiceCharges(chargesMap);

      // 2. 今日の既存の体調記録を取得（省略可能）
      setHealthData(new Map());

      // 3. クライアントマスター情報を取得
      const clientsSnapshot = await getDocs(collection(db, 'clients'));
      const clientMap = new Map(clientsSnapshot.docs.map(d => [d.id, { name: d.data().name, data: d.data() }]));

      // 4. 今日の利用計画を取得
      const plansQuery = query(collection(db, 'attendancePlans'), where('plannedDates', 'array-contains', Timestamp.fromDate(todayStart)));
      const plansSnapshot = await getDocs(plansQuery);
      const plannedClients = plansSnapshot.docs.map(doc => {
        const clientId = doc.data().clientId;
        return { clientId, clientName: clientMap.get(clientId)?.name || '不明な利用者', clientData: clientMap.get(clientId)?.data || null };
      });
      setTodaysPlans(plannedClients);


    } catch (err) {
      console.error("Failed to fetch today's data:", err);
      setError('本日のデータ取得に失敗しました。');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTodaysData();
  }, [fetchTodaysData]);

  const handleRecordAttendance = async (clientId, clientData, newAttendanceType) => {
    if (!currentUser || !clientData) return;
    const existingRecord = records.get(clientId);

    // newAttendanceType: 'onsite' | 'remote' | 'absent'
    const newStatus = newAttendanceType === 'absent' ? 'absent' : 'present';
    const attendanceType = newAttendanceType === 'absent' ? null : newAttendanceType;

    setRecords(prev => new Map(prev).set(clientId, { ...prev.get(clientId), status: 'loading' }));
    try {
      if (existingRecord?.recordId) {
        const recordRef = doc(db, 'attendanceRecords', existingRecord.recordId);
        await updateDoc(recordRef, {
          status: newStatus,
          attendanceType: attendanceType,
          updatedAt: serverTimestamp()
        });
      } else {
        // 新規作成時は統一されたドキュメントIDを使用
        const today = format(new Date(), 'yyyy-MM-dd');
        const docId = `${clientId}_${today}`;
        const newRecordData = {
          clientId: clientId,
          date: Timestamp.fromDate(new Date()),
          staffId: currentUser.uid,
          clientName: clientData.name,
          staffName: currentUser.displayName || '不明な職員',
          status: newStatus,
          attendanceType: attendanceType,
          startTime: newStatus === 'present' ? "10:00" : "",
          endTime: newStatus === 'present' ? "16:00" : "",
          serviceDetails: {
            mealSupport: false,
            transportGoing: false,
            transportReturning: false,
            homeVisit: false,
          },
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        await setDoc(doc(db, 'attendanceRecords', docId), newRecordData, { merge: true });
      }
      await fetchTodaysData();
    } catch (error) {
      console.error("記録の保存/更新に失敗しました:", error);
      alert('記録の処理に失敗しました。');
      await fetchTodaysData();
    }
  };

  const handleTemperatureChange = async (clientId, temperature) => {
    const record = records.get(clientId);
    if (!record || !record.recordId) {
      alert('先に出欠を記録してください。');
      return;
    }
    setHealthData(prev => new Map(prev).set(clientId, { ...prev.get(clientId), temperature }));
    try {
      const healthDocRef = doc(db, 'healthRecords', record.recordId);
      await setDoc(healthDocRef, { temperature, updatedAt: serverTimestamp() }, { merge: true });
    } catch (err) {
      console.error('体温の記録に失敗しました:', err);
      alert('体温の記録に失敗しました。');
      await fetchTodaysData(); // エラー時はデータを再同期
    }
  };

  // 加算チップのトグル処理
  const handleChargeToggle = async (clientId, chargeKey) => {
    const record = records.get(clientId);
    if (!record || !record.recordId) {
      alert('先に出欠を記録してください。');
      return;
    }

    const currentCharges = serviceCharges.get(clientId) || {};
    const newValue = !currentCharges[chargeKey];
    const newCharges = { ...currentCharges, [chargeKey]: newValue };

    // ローカル状態を即時更新
    setServiceCharges(prev => new Map(prev).set(clientId, newCharges));

    try {
      const recordRef = doc(db, 'attendanceRecords', record.recordId);
      await updateDoc(recordRef, {
        [`serviceDetails.${chargeKey}`]: newValue,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error('加算の更新に失敗しました:', err);
      alert('加算の更新に失敗しました。');
      await fetchTodaysData();
    }
  };


  const renderPlanList = (plans) => (
    <Paper elevation={3} sx={{ height: '100%' }}>
      <List sx={{ p: 0 }}>
        {plans.map((plan, index) => {
          const record = records.get(plan.clientId);
          const status = record?.status;
          const attendanceType = record?.attendanceType;
          const isPortalEntry = record?.isPortalEntry;

          // 現在の選択状態を決定
          let currentValue = null;
          if (status === 'absent') {
            currentValue = 'absent';
          } else if (status === 'present') {
            currentValue = attendanceType || 'onsite';
          }

          return (
            <React.Fragment key={plan.clientId}>
              <ListItem sx={{ py: 1.5, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
                <Grid container alignItems="center" spacing={{ xs: 1, sm: 2 }}>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography
                        variant="h6"
                        noWrap
                        sx={{
                          fontWeight: status ? 'bold' : 'normal',
                          color: status === 'absent' ? 'text.disabled' : 'text.primary'
                        }}
                      >
                        {plan.clientName}
                      </Typography>
                      {/* ポータル入力済みバッジ */}
                      {isPortalEntry && (
                        <Chip
                          icon={<CheckCircleIcon sx={{ fontSize: 14 }} />}
                          label="済"
                          size="small"
                          sx={{
                            bgcolor: 'rgba(16, 185, 129, 0.2)',
                            color: '#10b981',
                            fontSize: '0.7rem',
                            height: 22,
                          }}
                        />
                      )}
                      {attendanceType === 'remote' && status === 'present' && (
                        <Chip
                          icon={<HomeIcon sx={{ fontSize: 14 }} />}
                          label="在宅"
                          size="small"
                          sx={{
                            bgcolor: 'rgba(139, 92, 246, 0.2)',
                            color: '#a78bfa',
                            fontSize: '0.7rem',
                          }}
                        />
                      )}
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 8 }}>
                    <ToggleButtonGroup
                      value={currentValue}
                      exclusive
                      size="small"
                      onChange={(e, newValue) => { if (newValue) handleRecordAttendance(plan.clientId, plan.clientData, newValue) }}
                      fullWidth
                      sx={{
                        '& .MuiToggleButton-root': {
                          py: 1,
                        }
                      }}
                    >
                      <ToggleButton
                        value="onsite"
                        sx={{
                          color: '#10b981',
                          '&.Mui-selected': {
                            bgcolor: 'rgba(16, 185, 129, 0.2)',
                            color: '#10b981',
                            '&:hover': { bgcolor: 'rgba(16, 185, 129, 0.3)' }
                          }
                        }}
                      >
                        <BusinessIcon sx={{ mr: 0.5, fontSize: 18 }} />
                        通所
                      </ToggleButton>
                      <ToggleButton
                        value="remote"
                        sx={{
                          color: '#8b5cf6',
                          '&.Mui-selected': {
                            bgcolor: 'rgba(139, 92, 246, 0.2)',
                            color: '#8b5cf6',
                            '&:hover': { bgcolor: 'rgba(139, 92, 246, 0.3)' }
                          }
                        }}
                      >
                        <HomeIcon sx={{ mr: 0.5, fontSize: 18 }} />
                        在宅
                      </ToggleButton>
                      <ToggleButton
                        value="absent"
                        sx={{
                          color: '#ef4444',
                          '&.Mui-selected': {
                            bgcolor: 'rgba(239, 68, 68, 0.2)',
                            color: '#ef4444',
                            '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.3)' }
                          }
                        }}
                      >
                        <EventBusyIcon sx={{ mr: 0.5, fontSize: 18 }} />
                        欠席
                      </ToggleButton>
                    </ToggleButtonGroup>
                  </Grid>
                </Grid>

                {/* 加算チップエリア - 常に表示、出席時のみ有効 */}
                {enabledCharges.length > 0 && (
                  <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {enabledCharges.map(charge => {
                      const isActive = serviceCharges.get(plan.clientId)?.[charge.key] || false;
                      const isDisabled = status !== 'present';
                      return (
                        <Chip
                          key={charge.key}
                          label={charge.label}
                          size="small"
                          clickable={!isDisabled}
                          disabled={isDisabled}
                          onClick={() => !isDisabled && handleChargeToggle(plan.clientId, charge.key)}
                          sx={{
                            fontSize: '0.7rem',
                            height: 24,
                            bgcolor: isDisabled
                              ? 'transparent'
                              : (isActive ? `${charge.color}30` : 'transparent'),
                            color: isDisabled
                              ? '#4a556850'
                              : (isActive ? charge.color : '#94a3b8'),
                            border: '1px solid',
                            borderColor: isDisabled
                              ? '#4a556820'
                              : (isActive ? `${charge.color}50` : '#4a556830'),
                            opacity: isDisabled ? 0.5 : 1,
                            cursor: isDisabled ? 'default' : 'pointer',
                            '&:hover': {
                              bgcolor: isDisabled
                                ? 'transparent'
                                : (isActive ? `${charge.color}40` : '#4a556820'),
                            },
                            '&.Mui-disabled': {
                              opacity: 0.5,
                            },
                          }}
                        />
                      );
                    })}
                  </Box>
                )}
              </ListItem>
              {index < plans.length - 1 && <Divider />}
            </React.Fragment>
          );
        })}
      </List>
    </Paper>
  );



  const midIndex = Math.ceil(todaysPlans.length / 2);
  const leftColumnPlans = todaysPlans.slice(0, midIndex);
  const rightColumnPlans = todaysPlans.slice(midIndex);

  return (
    <Box sx={{ p: 1 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        日次 出欠記録 ({new Date().toLocaleDateString('ja-JP')})
      </Typography>

      {loading ? (

        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : todaysPlans.length === 0 ? (
        <Paper elevation={3} sx={{ p: 2 }}><Typography>本日の利用予定者はいません。</Typography></Paper>
      ) : (
        <Grid container spacing={3}>
          {/* ▼▼▼ 修正箇所: Gridのitemを削除し、sizeに変更 ▼▼▼ */}
          <Grid size={{ xs: 12, md: 6 }}>
            {renderPlanList(leftColumnPlans)}
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            {rightColumnPlans.length > 0 && renderPlanList(rightColumnPlans)}
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default DailyCheckinPage;