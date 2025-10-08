// src/features/clients/client.routes.jsx (最終修正版)

import { Route, Routes, Navigate } from 'react-router-dom';
import ClientsLayout from './ClientsLayout';
import ClientKanbanPage from './ClientKanbanPage';
import ClientOnsitePage from './ClientOnsitePage';
import ClientRemotePage from './ClientRemotePage';
import ClientFollowUpPage from './ClientFollowUpPage';
import ClientCompletedListPage from './ClientCompletedListPage';
import ClientCreatePage from './ClientCreatePage';
import ClientDetailPage from './ClientDetailPage'; // あなたの素晴らしい詳細ページをインポートします
import CardTestPage from './CardTestPage'; // ★ インポート

const ClientRoutes = () => {
  return (
    <Routes>
      {/* --- タブやヘッダーがあるメインのレイアウト --- */}
      {/* このブロックは /clients というパスの下に表示されるページ群です */}
      <Route path="/" element={<ClientsLayout />}>
        <Route index element={<Navigate to="new" replace />} />
        <Route path="new" element={<ClientKanbanPage />} />
        <Route path="onsite" element={<ClientOnsitePage />} />
        <Route path="remote" element={<ClientRemotePage />} />
        <Route path="follow-up" element={<ClientFollowUpPage />} />
        <Route path="completed" element={<ClientCompletedListPage />} />
        <Route path="/card-test" element={<CardTestPage />} />
      </Route>
      
      {/* --- レイアウトの外に表示するページ --- */}
      {/* 新規作成ページ */}
      <Route path="/create" element={<ClientCreatePage />} />
      
      {/* ★★★ ここを修正しました！★★★ */}
      {/* 「/clients/〇〇」というURLで詳細ページを表示するように設定 */}
      <Route path="/:clientId" element={<ClientDetailPage />} />
    </Routes>
  );
};

export default ClientRoutes;