// src/hooks/useDashboardStats.js (完全修正版)

import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useTenant } from '../context/TenantContext';

export const useDashboardStats = () => {
  const { activeCompanyId: companyId } = useTenant();
  const [stats, setStats] = useState({
    activeClients: 0,  // アクティブ利用者数（利用中）
    totalClients: 0,   // 累計登録者数
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

      // companyId フィルタ条件
      const companyFilter = companyId ? [where('companyId', '==', companyId)] : [];

      // 1. アクティブな利用者数を取得（施設内利用 + 施設外利用）
      const activeClientsQuery = query(
        collection(db, 'clients'),
        ...companyFilter,
        where('status', 'in', ['active_onsite', 'active_remote'])
      );
      const activeClientsSnapshot = await getDocs(activeClientsQuery);
      const activeClients = activeClientsSnapshot.size;

      // 2. 累計登録者数を取得
      const allClientsQuery = query(collection(db, 'clients'), ...companyFilter);
      const allClientsSnapshot = await getDocs(allClientsQuery);
      const totalClients = allClientsSnapshot.size;

      // 3. 今月の総コマ数を取得
      const plansQuery = query(collection(db, 'attendancePlans'), ...companyFilter, where('year', '==', year), where('month', '==', month));
      const plansSnapshot = await getDocs(plansQuery);
      let totalSlotsThisMonth = 0;
      plansSnapshot.forEach(doc => {
        const planData = doc.data();
        if (planData.plannedDates && Array.isArray(planData.plannedDates)) {
          totalSlotsThisMonth += planData.plannedDates.length;
        }
      });

      // 4. 今日の利用予定者数を取得
      const todayPlansQuery = query(collection(db, 'attendancePlans'), ...companyFilter, where('plannedDates', 'array-contains', todayTimestamp));
      const todayPlansSnapshot = await getDocs(todayPlansQuery);
      const checkinToday = todayPlansSnapshot.size;

      setStats({ activeClients, totalClients, totalSlotsThisMonth, checkinToday });
    } catch (error) {
      console.error("ダッシュボードデータの取得に失敗:", error);
      setStats({ activeClients: 0, totalClients: 0, totalSlotsThisMonth: 0, checkinToday: 0 });
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]); // ★★★ ここも、念のため元の形に戻します。useCallbackの修正でループしないはずです。

  return { stats, loading, refreshStats: fetchStats };
};