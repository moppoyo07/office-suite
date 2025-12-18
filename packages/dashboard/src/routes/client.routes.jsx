// src/routes/client.routes.jsx (あなたのディレクトリ構造に完全に合わせた最終FIX版)

import { Route, Routes, Navigate } from 'react-router-dom';

// ▼▼▼ ここから、全てのパスを 'src/routes/' から見た正しい相対パスに修正 ▼▼▼

// あなたのプロジェクト構造に基づき、これらのコンポーネントは全て 'src/features/clients/' にあると判断しました。
import ClientsLayout from '../features/clients/ClientsLayout.jsx';
import ClientKanbanPage from '../features/clients/ClientKanbanPage.jsx';
import ClientOnsitePage from '../features/clients/ClientOnsitePage.jsx';
import ClientRemotePage from '../features/clients/ClientRemotePage.jsx';
import ClientFollowUpPage from '../features/clients/ClientFollowUpPage.jsx';
import ClientCompletedListPage from '../features/clients/ClientCompletedListPage.jsx';
import ClientCreatePage from '../features/clients/ClientCreatePage.jsx'; // ★ パスを修正
import ClientDetailPage from '../features/clients/ClientDetailPage.jsx'; // ★ パスを修正
import CardTestPage from '../features/clients/CardTestPage.jsx'; // ★ パスを修正
import AllClientsListPage from '../features/clients/AllClientsListPage.jsx'; // ★ パスを修正

// ▲▲▲ ここまで、全てのパスを修正 ▲▲▲


const ClientRoutes = () => {
  return (
    <Routes>
      {/* --- タブやヘッダーがあるメインのレイアウト --- */}
      <Route path="/" element={<ClientsLayout />}>
        <Route index element={<Navigate to="new" replace />} />
        <Route path="new" element={<ClientKanbanPage />} />
        <Route path="onsite" element={<ClientOnsitePage />} />
        <Route path="remote" element={<ClientRemotePage />} />
        <Route path="follow-up" element={<ClientFollowUpPage />} />
        <Route path="completed" element={<ClientCompletedListPage />} />
        <Route path="all" element={<AllClientsListPage />} />
        <Route path="card-test" element={<CardTestPage />} />
      </Route>
      
      {/* --- レイアウトの外に表示するページ --- */}
      <Route path="create" element={<ClientCreatePage />} />
      <Route path=":clientId" element={<ClientDetailPage />} />
    </Routes>
  );
};

export default ClientRoutes;