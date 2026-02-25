// src/routes/platform.routes.jsx
// プラットフォームオーナー専用ルート

import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../features/auth/context/AuthContext';

// 既存の管理画面コンポーネントを流用
import AdminLayout from '../features/admin/AdminLayout';
import CompanyListPage from '../features/admin/companies/CompanyListPage';
import CompanyCreatePage from '../features/admin/companies/CompanyCreatePage';
import CompanyDetailPage from '../features/admin/companies/CompanyDetailPage';
import PlatformDashboard from '../features/admin/PlatformDashboard';
import BusinessDiagnosticsDashboard from '../features/admin/BusinessDiagnosticsDashboard';

// プラットフォームガード - platform_owner, platform_staff のみアクセス可能
function PlatformGuard() {
    const { currentUser, loading } = useAuth();

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#fff' }}>
                読み込み中...
            </div>
        );
    }

    const role = currentUser?.role;
    const allowedRoles = ['platform_owner', 'platform_staff'];

    if (!allowedRoles.includes(role)) {
        console.log('[PlatformGuard] Unauthorized role:', role);
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
}

// プラットフォーム管理画面用レイアウト（企業オーナーとは別のナビゲーション）
function PlatformLayout() {
    const navItems = [
        { path: '/platform', label: 'ダッシュボード', icon: '📊' },
        { path: '/platform/diagnostics', label: '経営診断', icon: '🔍' },
        { path: '/platform/companies', label: '企業管理', icon: '🏢' },
    ];

    return <AdminLayout title="プラットフォーム管理" navItems={navItems} basePath="/platform" />;
}

export default function PlatformRoutes() {
    return (
        <Routes>
            <Route element={<PlatformGuard />}>
                <Route element={<PlatformLayout />}>
                    <Route index element={<PlatformDashboard />} />
                    <Route path="diagnostics" element={<BusinessDiagnosticsDashboard />} />
                    <Route path="companies" element={<CompanyListPage />} />
                    <Route path="companies/new" element={<CompanyCreatePage />} />
                    <Route path="companies/:companyId" element={<CompanyDetailPage />} />
                    <Route path="*" element={<Navigate to="/platform" replace />} />
                </Route>
            </Route>
        </Routes>
    );
}
