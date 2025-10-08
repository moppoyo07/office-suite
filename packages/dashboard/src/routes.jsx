import { useRoutes, Navigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/context/AuthContext.jsx';
import Layout from '@/features/layout/Layout.jsx';
import DashboardHome from '@/features/dashboard/DashboardHome.jsx';
import ClientRoutes from '@/features/clients/client.routes.jsx';

const getRoutesForRole = (role) => {
  // ... (ここは変更なし)
};
function ProtectedRoutes() {
  // ... (ここは変更なし)
}
export default ProtectedRoutes;