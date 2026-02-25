// src/features/monthly-planner/monthlyPlanner.routes.jsx

import { Routes, Route } from 'react-router-dom';
import MonthlyPlannerPage from '../pages/MonthlyPlannerPage.jsx';


const MonthlyPlannerRoutes = () => {
  return (
    <Routes>
      {/* /monthly-planner のルートパスに MonthlyPlannerPage を割り当て */}
      <Route path="/" element={<MonthlyPlannerPage />} />

      {/* 今後、月次計画に関連するページが増えたらここに追加していく */}
      {/* 例: <Route path="/summary" element={<SummaryPage />} /> */}
    </Routes>
  );
};

export default MonthlyPlannerRoutes;