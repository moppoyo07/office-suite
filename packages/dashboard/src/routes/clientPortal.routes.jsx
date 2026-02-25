// src/routes/clientPortal.routes.jsx
// 利用者ポータル用ルート

import { Routes, Route, Navigate } from 'react-router-dom';
import { ClientAuthProvider, useClientAuth } from '../features/client-portal/context/ClientAuthContext';
import ClientPortalLayout from '../features/client-portal/ClientPortalLayout';
import ClientLoginPage from '../features/client-portal/ClientLoginPage';
import ClientHomePage from '../features/client-portal/ClientHomePage';
import ClientCheckinPage from '../features/client-portal/ClientCheckinPage';
import ClientCheckoutPage from '../features/client-portal/ClientCheckoutPage';

// 認証ガード
function ClientGuard({ children }) {
    const { client, loading } = useClientAuth();

    if (loading) {
        return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#fff' }}>読み込み中...</div>;
    }

    if (!client) {
        return <Navigate to="/portal/login" replace />;
    }

    return children;
}

export default function ClientPortalRoutes() {
    return (
        <ClientAuthProvider>
            <Routes>
                {/* ログイン画面（認証なし） */}
                <Route path="login" element={<ClientLoginPage />} />

                {/* 認証が必要な画面 */}
                <Route element={<ClientGuard><ClientPortalLayout /></ClientGuard>}>
                    <Route path="home" element={<ClientHomePage />} />
                    <Route path="checkin" element={<ClientCheckinPage />} />
                    <Route path="checkout" element={<ClientCheckoutPage />} />
                </Route>

                {/* デフォルトリダイレクト */}
                <Route path="*" element={<Navigate to="/portal/login" replace />} />
            </Routes>
        </ClientAuthProvider>
    );
}
