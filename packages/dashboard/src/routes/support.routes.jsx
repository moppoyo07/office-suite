import { Routes, Route, Navigate } from 'react-router-dom';

// ▼▼▼ 修正点: ファイルはすべて src/pages にあるので、そこを指定します ▼▼▼
import SupportWorkPage from '@/pages/SupportWorkPage.jsx';
import DailyCheckinPage from '@/pages/DailyCheckinPage.jsx';
import MonthlyPlannerPage from '@/pages/MonthlyPlannerPage.jsx';

const SupportRoutes = () => {
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
      <Route path="monthly-planner" element={<MonthlyPlannerPage />} />

      {/* 
        無限ループ防止のため、一時的にエラーメッセージを表示
      */}
      <Route path="*" element={<div style={{ padding: 20 }}>ページが見つかりません (Path mismatch)</div>} />

    </Routes>
  );
};

export default SupportRoutes;