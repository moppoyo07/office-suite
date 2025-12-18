// src/hooks/useDashboardStats.js (完全修正版)

import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';

export const useDashboardStats = () => {
  const [stats, setStats] = useState({
    totalClients: 0,
    totalSlotsThisMonth: 0,
    checkinToday: 0,
  });
  const [loading, setLoading] = useState(true);

  // useCallbackの依存配列は空でOK。初回のみ関数を生成する。
  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const today = new Date();
      const year = today.getFullYear();
      const month = today.getMonth() + 1;
      today.setHours(0, 0, 0, 0);
      const todayTimestamp = Timestamp.fromDate(today);

      // --- ▼▼▼ ここを修正 ▼▼▼ ---
      // 1. 総利用者数を取得 (ステータスが 'graduated' と 'closed-lost' ではない利用者)
      const clientsQuery = query(collection(db, 'clients'), where('status', 'not-in', ['graduated', 'closed-lost']));
      const clientsSnapshot = await getDocs(clientsQuery);
      const totalClients = clientsSnapshot.size;
      // --- ▲▲▲ 修正完了 ▲▲▲ ---

      // 2. 今月の総コマ数を取得 (ロジックは正しいので変更なし)
      const plansQuery = query(collection(db, 'attendancePlans'), where('year', '==', year), where('month', '==', month));
      const plansSnapshot = await getDocs(plansQuery);
      let totalSlotsThisMonth = 0;
      plansSnapshot.forEach(doc => {
        const planData = doc.data();
        if (planData.plannedDates && Array.isArray(planData.plannedDates)) {
          totalSlotsThisMonth += planData.plannedDates.length;
        }
      });
      
      // 3. 今日の利用予定者数を取得 (ロジックは正しいので変更なし)
      const todayPlansQuery = query(collection(db, 'attendancePlans'), where('plannedDates', 'array-contains', todayTimestamp));
      const todayPlansSnapshot = await getDocs(todayPlansQuery);
      const checkinToday = todayPlansSnapshot.size;

      setStats({ totalClients, totalSlotsThisMonth, checkinToday });
    } catch (error) {
      console.error("ダッシュボードデータの取得に失敗:", error);
      setStats({ totalClients: 0, totalSlotsThisMonth: 0, checkinToday: 0 });
    } finally {
      setLoading(false);
    }
  }, []); // 依存配列は空

  useEffect(() => {
    fetchStats();
  }, [fetchStats]); // ★★★ ここも、念のため元の形に戻します。useCallbackの修正でループしないはずです。

  return { stats, loading, refreshStats: fetchStats };
};