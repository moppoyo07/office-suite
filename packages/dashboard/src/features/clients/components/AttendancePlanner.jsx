import { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Button, Badge, CircularProgress } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { PickersDay } from '@mui/x-date-pickers/PickersDay';
import ja from 'date-fns/locale/ja';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '@/firebase/index.js';
// ▼▼▼ date-fnsからヘルパー関数をインポートします ▼▼▼
import { format, startOfMonth } from 'date-fns';

const CustomDay = (props) => {
  const { day, selectedDates = [], ...other } = props;
  const isSelected = selectedDates.some(d => 
    d && day &&
    day.getFullYear() === d.getFullYear() &&
    day.getMonth() === d.getMonth() &&
    day.getDate() === d.getDate()
  );
  return (
    <Badge key={day.toString()} overlap="circular" badgeContent={isSelected ? '✔️' : undefined}>
      <PickersDay {...other} day={day} />
    </Badge>
  );
};

function AttendancePlanner({ clientId }) {
  const [selectedDates, setSelectedDates] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  // ▼▼▼ 表示月を管理するステート。月の初日に正規化します ▼▼▼
  const [displayMonth, setDisplayMonth] = useState(startOfMonth(new Date()));

  const fetchPlan = useCallback(async (date) => {
    setIsLoading(true);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const docId = `${clientId}_${year}_${month}`;
    try {
      const planRef = doc(db, 'attendancePlans', docId);
      const docSnap = await getDoc(planRef);
      if (docSnap.exists()) {
        const planData = docSnap.data();
        const dates = planData.plannedDates.map(ts => ts.toDate());
        setSelectedDates(dates);
      } else {
        setSelectedDates([]);
      }
    } catch (error) {
      console.error("計画データの読み込みに失敗しました:", error);
      setSelectedDates([]);
    } finally {
      setIsLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    fetchPlan(displayMonth);
  }, [displayMonth, fetchPlan]);

  const handleDateChange = (date) => {
    const normalizedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const foundIndex = selectedDates.findIndex(d => d.getTime() === normalizedDate.getTime());
    if (foundIndex > -1) {
      setSelectedDates(selectedDates.filter((_, index) => index !== foundIndex));
    } else {
      setSelectedDates([...selectedDates, normalizedDate]);
    }
  };

  // ▼▼▼ [ここから省略なし] handleSavePlan関数の完全なコードです ▼▼▼
  const handleSavePlan = async () => {
    if (!clientId) {
      alert("エラー: 利用者IDが見つかりません。");
      return;
    }
    setIsSaving(true);
    const year = displayMonth.getFullYear();
    const month = displayMonth.getMonth() + 1;
    const docId = `${clientId}_${year}_${month}`;
    
    const planData = {
      clientId,
      year,
      month,
      plannedDates: selectedDates.map(date => Timestamp.fromDate(date)),
      status: 'approved',
      updatedAt: serverTimestamp(),
    };

    try {
      const planRef = doc(db, 'attendancePlans', docId);
      const docSnap = await getDoc(planRef);
      
      await setDoc(planRef, planData, { merge: true });
      
      // ドキュメントが新規作成された場合のみcreatedAtを追加
      if (!docSnap.exists()) {
          await updateDoc(planRef, { createdAt: serverTimestamp() });
      }

      alert(`${format(displayMonth, 'yyyy年M月')}の利用計画を保存/更新しました。`);
    } catch (error) {
      console.error("利用計画の保存に失敗しました:", error);
      alert("エラーが発生し、計画を保存できませんでした。");
    } finally {
      setIsSaving(false);
    }
  };
  // ▲▲▲ [ここまで省略なし] ▲▲▲
  
  return (
    <Box sx={{ p: 2, border: '1px solid grey', borderRadius: 2 }}>
      <Typography variant="h6" gutterBottom>
        利用計画
      </Typography>
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ja}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 320 }}>
            <CircularProgress />
          </Box>
        ) : (
          <DateCalendar
            referenceDate={displayMonth}
            views={['day']}
            onChange={handleDateChange}
            onMonthChange={(date) => setDisplayMonth(startOfMonth(date))}
            slots={{ day: CustomDay }}
            slotProps={{
              day: { selectedDates },
            }}
          />
        )}
      </LocalizationProvider>
      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <Button 
          variant="contained" 
          onClick={handleSavePlan}
          disabled={isSaving || isLoading}
        >
          {isSaving ? <CircularProgress size={24} /> : `${format(displayMonth, 'yyyy年M月')}の計画を保存/更新`}
        </Button>
      </Box>
    </Box>
  );
}

export default AttendancePlanner;