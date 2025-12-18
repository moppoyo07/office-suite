// src/routes/index.jsx (真の最終FIX版)

import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../features/auth/context/AuthContext.jsx";
import Layout from "../features/layout/Layout.jsx";
import DashboardHome from "../features/dashboard/DashboardHome.jsx";

// 各機能のルートコンポーネントを、このファイルと同じ階層からインポート
import ClientRoutes from './client.routes.jsx';
import MonthlyPlannerRoutes from './monthlyPlanner.routes.jsx';
import SupportRoutes from './support.routes.jsx';

// 認証が必要なルートを保護するコンポーネント
function ProtectedRoute() {
  const { currentUser, loading } = useAuth();
  if (loading) { return <h1>認証情報を確認中...</h1>; }
  if (!currentUser) { return <Navigate to="/login" replace />; }
  return <Outlet />;
}

// アプリケーション全体のルート定義
export const AppRoutes = () => {
  return (
    <Routes>
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<DashboardHome />} />
          <Route path="clients/*" element={<ClientRoutes />} />
          <Route path="monthly-planner/*" element={<MonthlyPlannerRoutes />} />
          <Route path="support/*" element={<SupportRoutes />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Route>
    </Routes>
  );
};