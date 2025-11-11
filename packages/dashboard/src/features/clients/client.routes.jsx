import { Route, Routes, Navigate } from 'react-router-dom';
import ClientsLayout from './ClientsLayout';
import ClientKanbanPage from './ClientKanbanPage';
import ClientOnsitePage from './ClientOnsitePage';
import ClientRemotePage from './ClientRemotePage';
import ClientFollowUpPage from './ClientFollowUpPage';
import ClientCompletedListPage from './ClientCompletedListPage';
import ClientCreatePage from './ClientCreatePage';
import ClientDetailPage from './ClientDetailPage';
import CardTestPage from './CardTestPage';

// ★ 1. 作成した AllClientsListPage をインポートします
import AllClientsListPage from './AllClientsListPage';

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
        
        {/* ★ 2. ここに新しいページのルートを追加します */}
        <Route path="all" element={<AllClientsListPage />} />

        {/* CardTestPageは特別なルートのようなので、このままにしておきます */}
        <Route path="/card-test" element={<CardTestPage />} />
      </Route>
      
      {/* --- レイアウトの外に表示するページ --- */}
      <Route path="/create" element={<ClientCreatePage />} />
      <Route path="/:clientId" element={<ClientDetailPage />} />
    </Routes>
  );
};

export default ClientRoutes;