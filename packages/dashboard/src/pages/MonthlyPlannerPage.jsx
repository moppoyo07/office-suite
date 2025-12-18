// src/pages/MonthlyPlannerPage.jsx (全ての過ちを正した、真の最終FIX版)

import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebase';
import { format, startOfMonth, startOfWeek, eachDayOfInterval, isSameMonth, isToday, addMonths, subMonths } from 'date-fns';
import ja from 'date-fns/locale/ja';

// MUIコンポーネント
import { Box, Typography, Grid, Paper, IconButton, CircularProgress } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';

// ★ 常に6行7列 (42マス) のデータ構造を生成するヘルパー関数
const generateCalendarMatrix = (monthDate) => {
  const startD = startOfWeek(startOfMonth(monthDate), { weekStartsOn: 0 }); // 週の始まりを日曜日に固定
  const days = [];
  for (let i = 0; i < 42; i++) {
    days.push(new Date(startD.getFullYear(), startD.getMonth(), startD.getDate() + i));
  }
  return days;
};

const MonthlyPlannerPage = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [plans, setPlans] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const theme = useTheme();
  const [totalSlots, setTotalSlots] = useState(0);

  const calendarDays = useMemo(() => generateCalendarMatrix(currentMonth), [currentMonth]);

  useEffect(() => {
    // データ取得ロジック
    const fetchMonthlyPlans = async () => {
      setIsLoading(true);
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth() + 1;
      try {
        const plansRef = collection(db, 'attendancePlans');
        const q = query(plansRef, where('year', '==', year), where('month', '==', month));
        const querySnapshot = await getDocs(q);
        const monthlyPlanCounts = {};
        let monthTotal = 0;
        querySnapshot.forEach((doc) => {
          const planData = doc.data();
          if (planData.plannedDates && Array.isArray(planData.plannedDates)) {
            monthTotal += planData.plannedDates.length;
            planData.plannedDates.forEach((timestampObject) => {
              if (timestampObject && typeof timestampObject.toDate === 'function') {
                const date = timestampObject.toDate();
                const dateKey = format(date, 'yyyy-MM-dd');
                if (!monthlyPlanCounts[dateKey]) { monthlyPlanCounts[dateKey] = 0; }
                monthlyPlanCounts[dateKey]++;
              }
            });
          }
        });
        setPlans(monthlyPlanCounts);
        setTotalSlots(monthTotal);
      } catch (error) {
        console.error("データ取得中にエラーが発生しました: ", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMonthlyPlans();
  }, [currentMonth]);
  
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        月次利用計画サマリー
      </Typography>

      {/* 2カラムのボックス形成 */}
      <Grid container spacing={3}>
        
        {/* --- 左カラム: カレンダーのボックス --- */}
        {/* ▼▼▼ 修正: itemを削除し、sizeプロパティに変更 ▼▼▼ */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column' }}>
            {/* カレンダーヘッダー */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h5">{format(currentMonth, 'yyyy年 M月', { locale: ja })}</Typography>
              <Box>
                <IconButton onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}><ArrowBackIosNewIcon /></IconButton>
                <IconButton onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}><ArrowForwardIosIcon /></IconButton>
              </Box>
            </Box>
            
            {/* カレンダー本体のコンテナ */}
            <Box sx={{ position: 'relative' }}>
              {isLoading && <CircularProgress sx={{ position: 'absolute', top: '50%', left: '50%', mt: -2, ml: -2, zIndex: 1 }} />}
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1.5, opacity: isLoading ? 0.3 : 1 }}>
                {['日', '月', '火', '水', '木', '金', '土'].map(day => (
                  <Typography key={day} align="center" sx={{ fontWeight: 'bold', color: theme.palette.text.secondary }}>{day}</Typography>
                ))}
                {calendarDays.map((day) => {
                  const dateKey = format(day, 'yyyy-MM-dd');
                  const userCount = plans[dateKey] || 0;
                  
                  return (
                    <Paper
                      key={dateKey}
                      variant="outlined"
                      sx={{
                        aspectRatio: '1 / 1',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: isSameMonth(day, currentMonth) ? theme.palette.text.primary : theme.palette.text.disabled,
                        border: isToday(day) ? `2px solid ${theme.palette.primary.main}` : '1px solid rgba(255, 255, 255, 0.12)',
                        transition: 'background-color 0.2s',
                        '&:hover': {
                          backgroundColor: 'rgba(255, 255, 255, 0.08)'
                        }
                      }}
                    >
                      <Typography variant="h6" component="div">{format(day, 'd')}</Typography>
                      {userCount > 0 && isSameMonth(day, currentMonth) && (
                        <Box sx={{ width: 24, height: 24, borderRadius: '50%', backgroundColor: theme.palette.success.main, color: '#fff', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '0.8rem', mt: 0.5 }}>
                          {userCount}
                        </Box>
                      )}
                    </Paper>
                  );
                })}
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* --- 右カラム: サマリーのボックス --- */}
        {/* ▼▼▼ 修正: itemを削除し、sizeプロパティに変更 ▼▼▼ */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>{format(currentMonth, 'yyyy年 M月', { locale: ja })} のサマリー</Typography>
            <Box sx={{ mt: 3 }}>
              <Typography variant="h4" component="p" sx={{ fontWeight: 'bold' }}>
                {isLoading ? <CircularProgress size={30} /> : `${totalSlots} コマ`}
              </Typography>
              <Typography variant="body1" color="text.secondary">月間総利用予定コマ数</Typography>
            </Box>
            <Box sx={{ mt: 4 }}>
              <Typography variant="subtitle1" color="text.secondary">（今後ここに詳細情報を追加予定）</Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default MonthlyPlannerPage;