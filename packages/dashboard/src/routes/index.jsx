// src/routes/index.jsx (真の最終FIX版)

import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../features/auth/context/AuthContext.jsx";
import { ROLES } from "../constants/roles";
import Layout from "../features/layout/Layout.jsx";
import DashboardHome from "../features/dashboard/DashboardHome.jsx";

// 各機能のルートコンポーネントを、このファイルと同じ階層からインポート
import ClientRoutes from './client.routes.jsx';
import MonthlyPlannerRoutes from './monthlyPlanner.routes.jsx';
import SupportRoutes from './support.routes.jsx';
import AdminRoutes from './admin.routes.jsx';
import PlatformRoutes from './platform.routes.jsx';
import MonthlyAccountingPage from '../pages/MonthlyAccountingPage.jsx';
import AccountingPage from '../pages/AccountingPage.jsx';
import BatchAttendancePrintPage from '../pages/BatchAttendancePrintPage.jsx';
import WelfareTrainingPage from '../pages/WelfareTrainingPage.jsx';
import RetentionSupportPrintPage from '../pages/RetentionSupportPrintPage.jsx';
import AlertsListPage from '../pages/AlertsListPage.jsx';
import FollowUpListPage from '../pages/FollowUpListPage.jsx';
import RoleSetupPage from '../features/admin/RoleSetupPage.jsx';
import { useCurrentUser } from '../hooks/useCurrentUser';

// 印刷用ページ
import FaceSheetPrintPage from '../pages/FaceSheetPrintPage.jsx';
import AssessmentSheetPrintPage from '../pages/AssessmentSheetPrintPage.jsx';
import AssessmentSheetMentalPrintPage from '../pages/AssessmentSheetMentalPrintPage.jsx';
import ClientPrintPage from '../pages/ClientPrintPage.jsx';

// 認証が必要なルートを保護するコンポーネント
function ProtectedRoute() {
  const { currentUser, loading } = useAuth();
  if (loading) { return <h1>認証情報を確認中...</h1>; }
  if (!currentUser) { return <Navigate to="/login" replace />; }
  return <Outlet />;
}

// ロール制限付きルート: hotdog(HELPER)を月次計画から除外
function RoleGuardedMonthlyPlanner() {
  const { role } = useCurrentUser();
  if (role === ROLES.HELPER) {
    return <Navigate to="/" replace />;
  }
  return <MonthlyPlannerRoutes />;
}

// アプリケーション全体のルート定義
export const AppRoutes = () => {
  return (
    <Routes>
      {/* /portal/* は App.jsx で直接定義されているので、ここでは不要 */}
      <Route element={<ProtectedRoute />}>
        {/* 印刷用ルート（Layoutの外） */}
        <Route path="clients/:clientId/print" element={<ClientPrintPage />} />
        <Route path="clients/:clientId/print/face-sheet" element={<FaceSheetPrintPage />} />
        <Route path="clients/:clientId/print/assessment-sheet" element={<AssessmentSheetPrintPage />} />
        <Route path="clients/:clientId/print/assessment-mental" element={<AssessmentSheetMentalPrintPage />} />

        <Route element={<Layout />}>
          <Route path="/" element={<DashboardHome />} />
          <Route path="clients/*" element={<ClientRoutes />} />
          <Route path="monthly-planner/*" element={<RoleGuardedMonthlyPlanner />} />
          <Route path="support/*" element={<SupportRoutes />} />
          <Route path="monthly" element={<MonthlyAccountingPage />} />
          <Route path="monthly/batch-print" element={<BatchAttendancePrintPage />} />
          <Route path="monthly/welfare-training" element={<WelfareTrainingPage />} />
          <Route path="retention-support/print" element={<RetentionSupportPrintPage />} />
          <Route path="accounting" element={<AccountingPage />} />
          <Route path="alerts" element={<AlertsListPage />} />
          <Route path="follow-up-list" element={<FollowUpListPage />} />
          {/* 一時的なロール設定ページ（セットアップ完了後に削除） */}
          <Route path="role-setup" element={<RoleSetupPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
        {/* プラットフォーム管理画面（独自レイアウト） */}
        <Route path="platform/*" element={<PlatformRoutes />} />
        {/* 管理画面（独自レイアウト） */}
        <Route path="admin/*" element={<AdminRoutes />} />
      </Route>
    </Routes>
  );
};
