// App.jsx (真の最終FIX版)

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/features/auth/context/AuthContext.jsx";
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from '@/theme.js';
import LoginPage from "@/features/auth/LoginPage.jsx";
import SurveyPage from "@/features/clients/SurveyPage.jsx";
import CompanyRegistrationPage from "@/features/clients/CompanyRegistrationPage.jsx"; // 念のため追加

// ★★★ 全てのルート定義を、'routes'フォルダからインポート ★★★
import { AppRoutes } from '@/routes';

import AdminCleanupPage from "./pages/AdminCleanupPage";

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* --- 公開ルート --- */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/survey/:clientId" element={<SurveyPage />} />
            <Route path="/register-company" element={<CompanyRegistrationPage />} /> {/* 公開ルートにないと仮定 */}
            <Route path="/cleanup" element={<AdminCleanupPage />} />
            {/* --- それ以外の全ての認証済みルートはAppRoutesに委任 --- */}
            <Route path="/*" element={<AppRoutes />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
export default App;