// src/features/clients/ClientsLayout.jsx (タイポ修正済みの最終完成版)

import { Outlet, useLocation, Link as RouterLink } from 'react-router-dom';
import { Box, Tabs, Tab, Button } from '@mui/material';
import { useMemo } from 'react';
import LostCounter from './LostCounter';

const tabs = [
  { label: '新規', path: '/clients/new' },
  { label: '施設内利用', path: '/clients/onsite' },
  { label: '施設外利用', path: '/clients/remote' },
  { label: '定着支援', path: '/clients/follow-up' },
  { label: '完了者一覧', path: '/clients/completed' },
];

function ClientsLayout() {
  const location = useLocation();
  
  const currentTabValue = useMemo(() => {
    const currentPath = location.pathname === '/clients' || location.pathname === '/clients/' 
      ? '/clients/new' 
      : location.pathname;
    const activeTabIndex = tabs.findIndex(tab => currentPath.startsWith(tab.path));
    return activeTabIndex === -1 ? false : activeTabIndex;
  }, [location.pathname]);

  const showLostCounter = location.pathname.startsWith('/clients/new') || location.pathname === '/clients' || location.pathname === '/clients/';

  return (
    // 1. 全体を囲む親Box。Flexboxで縦積みレイアウトの土台を作る。
    <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(96vh - 80px)' /* Office Suiteヘッダーが約64pxと仮定 */ }}>
      
      {/* --- ヘッダーエリア --- */}
      {/* 2. ヘッダーは固定。flexShrink: 0 で縮まないようにする。上下左右にpaddingを設定して隙間を確保。 */}
      <Box sx={{ 
        flexShrink: 0, 
        borderBottom: 1, 
        borderColor: 'divider', 
        //p: 1, 
        px: 2, 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center' 
      }}>
          <Tabs value={currentTabValue} variant="scrollable" scrollButtons="auto" allowScrollButtonsMobile>
            {tabs.map((tab) => (
              <Tab key={tab.path} label={tab.label} component={RouterLink} to={tab.path} />
            ))}
          </Tabs>
          <Button 
            variant="contained" 
            color="primary" 
            component={RouterLink} // ★★★ ここのタイポを修正しました ★★★
            to="/clients/create"
          >
            新規利用者を追加
          </Button>
      </Box>

      {/* --- メインコンテンツエリア（ここがスクロールする！） --- */}
      {/* 3. このエリアが残りのスペースを全て使い、中身がはみ出たらスクロールする。 */}
      <Box sx={{ flex: '1 1 auto', overflowY: 'auto', p: 2 }}>
        <Outlet />
      </Box>

      {/* --- フッターエリア（ロストカウンター） --- */}
      {/* 4. フッターも固定。flexShrink: 0 で縮まないようにする。 */}
      {showLostCounter && (
        <Box sx={{ flexShrink: 0, p: 2, pt: 0 }}>
          <LostCounter />
        </Box>
      )}
    </Box>
  );
}

export default ClientsLayout;