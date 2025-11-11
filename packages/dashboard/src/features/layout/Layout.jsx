import { Outlet, NavLink } from "react-router-dom";
import { Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Toolbar, Typography, AppBar, Button } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted'; // ★ 1. 新しいアイコンをインポート
import { useAuth } from "@/features/auth/context/AuthContext.jsx";

const drawerWidth = 240;

function Layout() {
  const { logout } = useAuth();
  return (
    <Box sx={{ display: 'flex' }}>
      {/* AppBar (ヘッダー) 部分は変更ありません */}
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, backgroundColor: 'rgba(30, 41, 59, 0.7)', borderBottom: '1px solid rgba(6, 182, 212, 0.5)', boxShadow: '0 2px 5px rgba(6, 182, 212, 0.3)' }}>
        <Toolbar>
          <Typography variant="h6" noWrap>Office Suite :: Cockpit</Typography>
        </Toolbar>
      </AppBar>
      
      {/* Drawer (左メニュー) 部分 */}
      <Drawer variant="permanent" sx={{ width: drawerWidth, flexShrink: 0, '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box', backgroundColor: 'rgba(30, 41, 59, 0.5)', backdropFilter: 'blur(4px)', borderRight: '1px solid #06b6d4', boxShadow: '1px 0 5px #06b6d4' } }}>
        <Toolbar />
        <Box sx={{ overflow: 'auto', p: 1 }}>
          {/* ★ 2. ここのリスト内容を修正しました */}
          <List>
            <ListItem disablePadding>
              <ListItemButton component={NavLink} to="/">
                <ListItemIcon><DashboardIcon /></ListItemIcon>
                <ListItemText primary="ダッシュボード" />
              </ListItemButton>
            </ListItem>
            
            <ListItem disablePadding>
              {/* to="/clients" は client.routes.jsx の設定により自動でカンバン表示に遷移します */}
              <ListItemButton component={NavLink} to="/clients"> 
                <ListItemIcon><PeopleIcon /></ListItemIcon>
                <ListItemText primary="CRMボード" />
              </ListItemButton>
            </ListItem>
            
            <ListItem disablePadding>
              <ListItemButton component={NavLink} to="/clients/all">
                <ListItemIcon><FormatListBulletedIcon /></ListItemIcon>
                <ListItemText primary="全利用者一覧" />
              </ListItemButton>
            </ListItem>
          </List>
        </Box>
        <Box sx={{ marginTop: 'auto', p: 2 }}>
           <Button variant="contained" color="error" fullWidth startIcon={<PowerSettingsNewIcon />} onClick={logout}>Shutdown</Button>
        </Box>
      </Drawer>

      {/* Main Content (メインコンテンツ) 部分は変更ありません */}
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          height: '100vh',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <Toolbar /> 
        <Box sx={{ flexGrow: 1, overflow: 'auto', p: 3 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}

export default Layout;