import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../features/auth/context/AuthContext.jsx';
import { ROLES } from '../constants/roles';

// ▼▼▼ 修正点: ファイルはすべて src/pages にあるので、そこを指定します ▼▼▼
import SupportWorkPage from '../pages/SupportWorkPage.jsx';
import DailyCheckinPage from '../pages/DailyCheckinPage.jsx';
import MonthlyPlannerPage from '../pages/MonthlyPlannerPage.jsx';
import ScheduleCreationPage from '../pages/ScheduleCreationPage.jsx';
import SupportSettingsPage from '../pages/SupportSettingsPage.jsx';
import ServiceRecordListPage from '../pages/ServiceRecordListPage.jsx';
import CVAnalysisPage from '../pages/CVAnalysisPage.jsx';
import AttendanceRecordPrintPage from '../pages/AttendanceRecordPrintPage.jsx';
import MonthlyCheckInSummaryPage from '../pages/MonthlyCheckInSummaryPage.jsx';
import ReflectionLogPage from '../pages/ReflectionLogPage.jsx';
import LineLinkPage from '../pages/LineLinkPage.jsx';

const SupportRoutes = () => {
  const { currentUser } = useAuth();
  const isHotdog = currentUser?.role === ROLES.HELPER;

  return (
    <Routes>
      {/* 
        index ( /support/ ) にアクセスしたら、
        明確に "/support/dashboard" へ移動させます（絶対パスに変更） 
      */}
      <Route index element={<Navigate to="/support/dashboard" replace />} />

      {/* 各ページのルート定義 */}
      <Route path="dashboard" element={<SupportWorkPage />} />
      <Route path="daily-checkin" element={<DailyCheckinPage />} />
      <Route path="attendance" element={<DailyCheckinPage />} />
      <Route path="monthly-planner" element={
        isHotdog ? <Navigate to="/support/dashboard" replace /> : <MonthlyPlannerPage />
      } />
      <Route path="schedule-creation" element={<ScheduleCreationPage />} />
      <Route path="settings" element={<SupportSettingsPage />} />
      <Route path="service-records" element={<ServiceRecordListPage />} />
      <Route path="cv-analysis" element={<CVAnalysisPage />} />
      <Route path="attendance-print/:clientId" element={<AttendanceRecordPrintPage />} />
      <Route path="monthly-checkin-summary" element={<MonthlyCheckInSummaryPage />} />
      <Route path="reflection-log" element={<ReflectionLogPage />} />
      <Route path="line-link" element={<LineLinkPage />} />


      {/* 
        無限ループ防止のため、一時的にエラーメッセージを表示
      */}
      <Route path="*" element={<div style={{ padding: 20 }}>ページが見つかりません (Path mismatch)</div>} />

    </Routes>
  );
};

export default SupportRoutes;
