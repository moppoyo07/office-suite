// App.jsx

import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthProvider, useAuth } from "@/features/auth/context/AuthContext.jsx";
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from '@/theme.js';
import LoginPage from "@/features/auth/LoginPage.jsx";
import Layout from "@/features/layout/Layout.jsx";
import DashboardHome from "@/features/dashboard/DashboardHome.jsx";
// import ClientListPage from "@/features/clients/ClientListPage.jsx"; // ← 古いのでもう使わない
// import ClientCreatePage from "@/features/clients/ClientCreatePage.jsx"; // ← ClientRoutes の中で読み込むので不要
// import ClientDetailPage from "@/features/clients/ClientDetailPage.jsx"; // ← ClientRoutes の中で読み込むので不要
import CompanyRegistrationPage from "@/features/clients/CompanyRegistrationPage.jsx";
import SurveyPage from "@/features/clients/SurveyPage.jsx";

// ★ 1. 作成した ClientRoutes をインポート
import ClientRoutes from "@/features/clients/client.routes.jsx";

function ProtectedRoute() {
  const { currentUser, loading } = useAuth();
  if (loading) { return <h1>認証情報を確認中...</h1>; }
  if (!currentUser) { return <Navigate to="/login" replace />; }
  return <Outlet />;
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* --- 認証が不要な公開ルート --- */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/survey/:clientId" element={<SurveyPage />} />

            {/* --- 認証が必要なルート --- */}
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/" element={<DashboardHome />} />

                {/* ★ 2. ここを ClientRoutes に差し替える */}
                {/* 以前の3行をこの1行にまとめる */}
                <Route path="clients/*" element={<ClientRoutes />} />

                {/* 元のルート定義 (参考用・削除してOK)
                <Route path="clients" element={<ClientListPage />} />
                <Route path="clients/new" element={<ClientCreatePage />} />
                <Route path="clients/:clientId" element={<ClientDetailPage />} />
                */}

                <Route path="register-company" element={<CompanyRegistrationPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
export default App;