import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Paper, List, ListItem, CircularProgress, Divider, Stack, Button, Alert, Grid, ToggleButtonGroup, ToggleButton } from '@mui/material';
import { collection, query, where, getDocs, Timestamp, addDoc, serverTimestamp, doc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '@/firebase'; // パス調整済み
import { useAuth } from "@/features/auth/context/AuthContext";

// 体温ボタンの選択肢を定義
const temperatures = ['6.0', '6.2', '6.4', '6.6', '6.8', '7.0', '7.2', '7.4'];
const highTemp = '37.5+';

const DailyCheckinPage = () => {
  const { currentUser } = useAuth();
  const [todaysPlans, setTodaysPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [records, setRecords] = useState(new Map());
  const [healthData, setHealthData] = useState(new Map());

  const fetchTodaysData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      // 1. 今日の既存の出欠記録を取得
      const recordsQuery = query(collection(db, 'attendanceRecords'), where('date', '>=', Timestamp.fromDate(todayStart)), where('date', '<=', Timestamp.fromDate(todayEnd)));
      const recordsSnapshot = await getDocs(recordsQuery);
      const existingRecords = new Map();
      const recordIds = [];
      recordsSnapshot.forEach(d => {
        const data = d.data();
        existingRecords.set(data.clientId, { recordId: d.id, status: data.status });
        recordIds.push(d.id);
      });
      setRecords(existingRecords);

      // 2. 今日の既存の体調記録を取得
      if (recordIds.length > 0) {
        const healthQuery = query(collection(db, 'healthRecords'), where('__name__', 'in', recordIds));
        const healthSnapshot = await getDocs(healthQuery);
        const existingHealthData = new Map();
        healthSnapshot.forEach(d => {
          // recordIdからclientIdを逆引きする
          for (const [clientId, recordValue] of existingRecords.entries()) {
            if (recordValue.recordId === d.id) {
              existingHealthData.set(clientId, d.data());
              break;
            }
          }
        });
        setHealthData(existingHealthData);
      } else {
        setHealthData(new Map());
      }
      
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

  const handleRecordAttendance = async (clientId, clientData, newStatus) => {
    if (!currentUser || !clientData) return;
    const existingRecord = records.get(clientId);
    setRecords(prev => new Map(prev).set(clientId, { ...prev.get(clientId), status: 'loading' }));
    try {
      if (existingRecord?.recordId) {
        const recordRef = doc(db, 'attendanceRecords', existingRecord.recordId);
        await updateDoc(recordRef, { status: newStatus, updatedAt: serverTimestamp() });
      } else {
        const newRecordData = {
          clientId: clientId, date: Timestamp.fromDate(new Date()), staffId: currentUser.uid,
          clientName: clientData.name, staffName: currentUser.displayName || '不明な職員',
          status: newStatus, startTime: newStatus === 'present' ? "10:00" : "", endTime: newStatus === 'present' ? "16:00" : "",
          serviceDetails: {
            mealSupport: clientData.billingInfo?.hasMealSupport || false,
            transportSupport: clientData.billingInfo?.defaultTransport || 'none',
            homeVisitSupport: clientData.billingInfo?.hasHomeVisitSupport || false,
          },
          createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
        };
        await addDoc(collection(db, 'attendanceRecords'), newRecordData);
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

  const renderPlanList = (plans) => (
    <Paper elevation={3} sx={{ height: '100%' }}>
      <List sx={{ p: 0 }}>
        {plans.map((plan, index) => {
          const record = records.get(plan.clientId);
          const status = record?.status;
          const currentTemp = healthData.get(plan.clientId)?.temperature;

          return (
            <React.Fragment key={plan.clientId}>
              <ListItem sx={{ py: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
                {/* ▼▼▼ 修正箇所: Gridのitemを削除し、sizeに変更 ▼▼▼ */}
                <Grid container alignItems="center" spacing={{ xs: 1, sm: 2 }}>
                  <Grid size={{ xs: 10, sm: 3 }}>
                    <Typography 
                      variant="h6" 
                      noWrap 
                      sx={{ fontWeight: status ? 'bold' : 'normal', color: status === 'absent' ? 'text.disabled' : 'text.primary' }}
                    >
                      {plan.clientName}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 5, sm: 3 }}>
                    <ToggleButtonGroup
                      value={status}
                      exclusive
                      size="small"
                      onChange={(e, newStatus) => { if (newStatus) handleRecordAttendance(plan.clientId, plan.clientData, newStatus) }}
                      fullWidth
                    >
                      <ToggleButton value="present" color="success">出席</ToggleButton>
                      <ToggleButton value="absent" color="error">欠席</ToggleButton>
                    </ToggleButtonGroup>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 5 }} container justifyContent="flex-end">
                    <ToggleButtonGroup
                      value={currentTemp}
                      exclusive
                      size="small"
                      onChange={(e, newTemp) => handleTemperatureChange(plan.clientId, newTemp)}
                      disabled={!status}
                      sx={{ flexWrap: 'wrap', justifyContent: 'flex-end' }}
                    >
                      {temperatures.map(t => <ToggleButton key={t} value={t} sx={{ px: 1, py: 0.5 }}>{t}</ToggleButton>)}
                      <ToggleButton value={highTemp} color="warning" sx={{ px: 1, py: 0.5 }}>{highTemp}</ToggleButton>
                    </ToggleButtonGroup>
                  </Grid>
                </Grid>
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