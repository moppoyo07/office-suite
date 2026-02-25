// src/routes/admin.routes.jsx
// 管理画面用ルート定義

import { Routes, Route, Navigate } from 'react-router-dom';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { isPlatformRole } from '../constants/roles';

// 管理画面コンポーネント
import AdminLayout from '../features/admin/AdminLayout.jsx';
import AdminDashboard from '../features/admin/AdminDashboard.jsx';
import CompanyListPage from '../features/admin/companies/CompanyListPage.jsx';
import CompanyCreatePage from '../features/admin/companies/CompanyCreatePage.jsx';
import CompanyDetailPage from '../features/admin/companies/CompanyDetailPage.jsx';
import BranchListPage from '../features/admin/branches/BranchListPage.jsx';
import BranchCreatePage from '../features/admin/branches/BranchCreatePage.jsx';
import BranchDetailPage from '../features/admin/branches/BranchDetailPage.jsx';
import UserListPage from '../features/admin/users/UserListPage.jsx';
import UserCreatePage from '../features/admin/users/UserCreatePage.jsx';
import UserDetailPage from '../features/admin/users/UserDetailPage.jsx';
import AdminCleanupPage from '../pages/AdminCleanupPage.jsx';
import NewApplicationChecklistPage from '../pages/NewApplicationChecklistPage.jsx';
import ApplicationForm1Page from '../pages/forms/ApplicationForm1Page.jsx';
import StaffWorkSchedulePage from '../pages/StaffWorkSchedulePage.jsx';
import AverageUsersSheetPage from '../pages/AverageUsersSheetPage.jsx';
import RoleControlPanel from '../features/admin/rbac/RoleControlPanel.jsx';
import QuestCategoryPage from '../features/admin/quests/QuestCategoryPage.jsx';

/**
 * 管理画面へのアクセス制限コンポーネント
 * company_admin, branch_manager, platform_owner, platform_staff がアクセス可能
 */
function AdminGuard({ children }) {
    const { role, loading } = useCurrentUser();

    if (loading) {
        return <div>読込中...</div>;
    }

    // プラットフォームオーナーは全てにアクセス可能
    if (isPlatformRole(role)) {
        return children;
    }

    // 企業アドミン、支店管理者も許可
    const allowedRoles = ['company_admin', 'branch_manager'];

    if (!allowedRoles.includes(role)) {
        console.log('[AdminGuard] Unauthorized role:', role);
        return <Navigate to="/" replace />;
    }

    return children;
}

/**
 * 管理画面ルート
 */
export default function AdminRoutes() {
    return (
        <AdminGuard>
            <Routes>
                <Route element={<AdminLayout />}>
                    {/* ダッシュボード */}
                    <Route index element={<AdminDashboard />} />

                    {/* 企業管理 */}
                    <Route path="companies" element={<CompanyListPage />} />
                    <Route path="companies/new" element={<CompanyCreatePage />} />
                    <Route path="companies/:companyId" element={<CompanyDetailPage />} />

                    {/* 支店管理 */}
                    <Route path="branches" element={<BranchListPage />} />
                    <Route path="branches/new" element={<BranchCreatePage />} />
                    <Route path="branches/:branchId" element={<BranchDetailPage />} />

                    {/* ユーザー管理 */}
                    <Route path="users" element={<UserListPage />} />
                    <Route path="users/new" element={<UserCreatePage />} />
                    <Route path="users/:userId" element={<UserDetailPage />} />

                    {/* 申請書類管理 */}
                    <Route path="applications/new" element={<NewApplicationChecklistPage />} />
                    <Route path="applications/form1" element={<ApplicationForm1Page />} />

                    {/* 人員配置関連 */}
                    <Route path="average-users-sheet" element={<AverageUsersSheetPage />} />
                    <Route path="staff-schedule" element={<StaffWorkSchedulePage />} />

                    {/* システムツール */}
                    <Route path="cleanup" element={<AdminCleanupPage />} />

                    {/* クエストカテゴリ管理 */}
                    <Route path="quest-categories" element={<QuestCategoryPage />} />

                    {/* RBAC管理 (Grand Admiral専用) */}
                    <Route path="rbac" element={<RoleControlPanel />} />

                    {/* 不明なパスはダッシュボードへ */}
                    <Route path="*" element={<Navigate to="/admin" replace />} />
                </Route>
            </Routes>
        </AdminGuard>
    );
}
