// src/features/layout/Layout.jsx

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import {
  Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Toolbar, Typography, AppBar, Button, CircularProgress,
  InputBase
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import AssignmentIcon from '@mui/icons-material/Assignment';
import SettingsIcon from '@mui/icons-material/Settings';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import PhoneInTalkIcon from '@mui/icons-material/PhoneInTalk';
import SearchIcon from '@mui/icons-material/Search';
import EditNoteIcon from '@mui/icons-material/EditNote';
import { useAuth } from "../auth/context/AuthContext.jsx";
import DevModeIndicator from "../../components/DevModeIndicator.jsx";
import NotificationTicker from "../../components/NotificationTicker.jsx";
import { doc, getDoc, collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../firebase/index.js";
import { useCurrentUser } from "../../hooks/useCurrentUser.js";
import { ROLES, ROLE_METADATA, isPlatformRole, isManagerRole } from "../../constants/roles.js";
import { useTenant } from "../../context/TenantContext.jsx";

const drawerWidth = 240;

// ユーザー情報パネル
const UserInfoPanel = ({ role, profile }) => {
  const meta = ROLE_METADATA[role] || ROLE_METADATA[ROLES.BRANCH_STAFF];

  return (
    <Box sx={{ mb: 2, textAlign: 'center' }}>
      <Typography variant="body2" sx={{ color: '#fff', fontWeight: 'bold' }}>
        {profile?.displayName || profile?.email || 'ゲスト'}
      </Typography>
      <Typography variant="caption" sx={{ color: meta.color, fontWeight: 'bold', display: 'block', mt: 0.5 }}>
        {meta.userLabel}
      </Typography>
    </Box>
  );
};

function Layout() {
  const { logout, currentUser } = useAuth();
  const { role, profile, companyId } = useCurrentUser();
  const { isEmulating, emulatingCompany, exitEmulatorMode } = useTenant();
  const navigate = useNavigate();
  const [branchServices, setBranchServices] = useState([]);
  const [loadingBranch, setLoadingBranch] = useState(false);

  // --- 活動記録クイック検索 ---
  const [searchText, setSearchText] = useState('');
  const [allClients, setAllClients] = useState([]);
  const searchInputRef = useRef(null);

  // クライアント一覧を一度だけ取得
  useEffect(() => {
    if (!companyId) return;
    const fetchClients = async () => {
      try {
        const q = query(collection(db, 'clients'), where('companyId', '==', companyId));
        const snap = await getDocs(q);
        setAllClients(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) {
        console.error('クライアント取得エラー:', e);
      }
    };
    fetchClients();
  }, [companyId]);

  // カタカナ→ひらがな変換
  const toHiragana = useCallback((str) => str.replace(/[\u30A1-\u30F6]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0x60)), []);

  // onInput でIME変換中でもリアルタイムに検索テキストを更新
  const handleSearchInput = useCallback((e) => {
    setSearchText(e.target.value);
  }, []);

  const filteredClients = useMemo(() => {
    if (!searchText) return [];
    const lower = searchText.toLowerCase();
    const hira = toHiragana(searchText);
    return allClients.filter(c =>
      c.name?.toLowerCase().includes(lower) ||
      c.nameKana?.includes(hira) ||
      toHiragana(c.nameKana || '').includes(hira)
    ).slice(0, 8);
  }, [searchText, allClients, toHiragana]);

  const handleSelectClient = useCallback((client) => {
    navigate(`/activity-log/${client.id}`);
    // ナビゲーション後にクリア
    setTimeout(() => {
      setSearchText('');
      if (searchInputRef.current) searchInputRef.current.value = '';
    }, 0);
  }, [navigate]);

  const handleClearSearch = useCallback(() => {
    setSearchText('');
    if (searchInputRef.current) searchInputRef.current.value = '';
    searchInputRef.current?.focus();
  }, []);

  // 現在のロールのメタデータを取得
  const meta = ROLE_METADATA[role] || ROLE_METADATA[ROLES.BRANCH_STAFF];
  const isManager = isManagerRole(role);
  const isPlatformOwner = isPlatformRole(role);

  // ダッシュボード名決定
  const dashboardName = meta.dashboard;

  // 支店のサービス種別を取得
  useEffect(() => {
    const fetchBranchInfo = async () => {
      if (profile?.branchId) {
        setLoadingBranch(true);
        try {
          const docRef = doc(db, 'branches', profile.branchId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setBranchServices(data.serviceTypes || []);
          }
        } catch (error) {
          console.error('支店情報取得エラー:', error);
        } finally {
          setLoadingBranch(false);
        }
      }
    };
    fetchBranchInfo();
  }, [profile?.branchId]);

  // メニュー表示条件の判定
  const hasService = (type) => branchServices.includes(type) || isPlatformOwner;

  return (
    <Box sx={{ display: 'flex' }}>
      {/* AppBar (ヘッダー) */}
      <AppBar position="fixed" sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        backdropFilter: 'blur(8px)',
        borderBottom: `1px solid ${meta.color}44`,
        boxShadow: `0 2px 10px ${meta.color}11`
      }}>
        <Toolbar sx={{ minHeight: '48px !important' }}>
          {/* ロゴ */}
          <Typography
            variant="h6"
            noWrap
            sx={{ fontWeight: 'bold', background: 'linear-gradient(90deg, #8b5cf6, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', flexShrink: 0 }}
          >
            Manecto
          </Typography>

          {/* 階級バッジ */}
          <Box sx={{ ml: 1.5, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            <Box
              sx={{
                px: 1.2, py: 0.2, borderRadius: '4px', fontSize: '0.65rem', fontWeight: '900', letterSpacing: '0.1em', textTransform: 'uppercase',
                border: '1px solid',
                bgcolor: `${meta.color}11`,
                color: meta.color,
                borderColor: meta.color,
                boxShadow: `0 0 10px ${meta.color}33`,
              }}
            >
              {meta.badge}
            </Box>
          </Box>

          {/* エリア名 */}
          <Typography variant="caption" sx={{ ml: 1.5, color: 'rgba(148, 163, 184, 0.6)', fontWeight: 'bold', letterSpacing: '0.1em' }}>
            {dashboardName}
          </Typography>

          <NotificationTicker />
        </Toolbar>
      </AppBar>

      {/* Drawer */}
      <Drawer variant="permanent" sx={{
        width: drawerWidth,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          backgroundColor: 'rgba(15, 23, 42, 0.9)',
          borderRight: `1px solid ${meta.color}33`,
        }
      }}>
        <Toolbar sx={{ minHeight: '48px !important' }} />
        <Box sx={{ overflow: 'auto', p: 1 }}>
          {/* 検索中：結果リスト / 通常：メニュー */}
          {searchText ? (
            <List>
              {filteredClients.length > 0 ? filteredClients.map((c) => (
                <ListItem key={c.id} disablePadding>
                  <ListItemButton
                    onClick={() => handleSelectClient(c)}
                    sx={{
                      borderRadius: '8px', mb: 0.3,
                      transition: 'all 0.15s ease',
                      '&:hover': { bgcolor: 'rgba(34,211,238,0.12)', pl: 2.5 },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <EditNoteIcon sx={{ color: '#22d3ee', fontSize: '1.1rem', filter: 'drop-shadow(0 0 3px rgba(34,211,238,0.4))' }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={c.name}
                      secondary={c.nameKana || null}
                      primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: 600, color: '#e2e8f0' }}
                      secondaryTypographyProps={{ fontSize: '0.65rem', color: 'rgba(148,163,184,0.5)' }}
                    />
                  </ListItemButton>
                </ListItem>
              )) : (
                <Typography sx={{ px: 2, py: 1, fontSize: '0.8rem', color: 'rgba(148,163,184,0.5)' }}>
                  該当なし
                </Typography>
              )}
            </List>
          ) : (
          <List>
            <ListItem disablePadding>
              <ListItemButton component={NavLink} to="/">
                <ListItemIcon><DashboardIcon sx={{ color: meta.color }} /></ListItemIcon>
                <ListItemText primary={dashboardName} />
              </ListItemButton>
            </ListItem>

            {/* 基本機能 */}
            <ListItem disablePadding>
              <ListItemButton component={NavLink} to="/clients">
                <ListItemIcon><PeopleIcon /></ListItemIcon>
                <ListItemText primary="CRMボード" />
              </ListItemButton>
            </ListItem>

            {/* アラート一覧 */}
            <ListItem disablePadding>
              <ListItemButton component={NavLink} to="/alerts">
                <ListItemIcon><NotificationsActiveIcon sx={{ color: '#f59e0b' }} /></ListItemIcon>
                <ListItemText primary="アラート一覧" />
              </ListItemButton>
            </ListItem>

            {/* 追客リスト */}
            <ListItem disablePadding>
              <ListItemButton component={NavLink} to="/follow-up-list">
                <ListItemIcon><PhoneInTalkIcon sx={{ color: '#06b6d4' }} /></ListItemIcon>
                <ListItemText primary="追客リスト" />
              </ListItemButton>
            </ListItem>

            {/* 支援作業（サービス共通、または種別ごとに中身出し分け） */}
            <ListItem disablePadding>
              <ListItemButton component={NavLink} to="/support">
                <ListItemIcon><AssignmentIcon /></ListItemIcon>
                <ListItemText primary="支援作業" />
              </ListItemButton>
            </ListItem>

            {/* 就労移行支援 メニュー */}
            {(hasService('transition') || [ROLES.BRANCH_MANAGER, ROLES.BRANCH_STAFF].includes(role)) && role !== ROLES.HELPER && (
              <ListItem disablePadding>
                <ListItemButton component={NavLink} to="/monthly">
                  <ListItemIcon><AssignmentIcon color="primary" /></ListItemIcon>
                  <ListItemText primary="月次処理 (移行)" />
                </ListItemButton>
              </ListItem>
            )}

            {/* 今後追加予定：B型用メニュー
            {hasService('b_type') && (
              <ListItem disablePadding>
                <ListItemButton component={NavLink} to="/wage-management">
                  <ListItemIcon><ReceiptLongIcon color="secondary" /></ListItemIcon>
                  <ListItemText primary="工賃管理 (B型)" />
                </ListItemButton>
              </ListItem>
            )}
            */}

            {/* 年次処理（移行）— 支店長のみ */}
            {(role === ROLES.BRANCH_MANAGER || isPlatformOwner) && (
              <ListItem disablePadding>
                <ListItemButton component={NavLink} to="/annual">
                  <ListItemIcon><CalendarMonthIcon sx={{ color: '#f59e0b' }} /></ListItemIcon>
                  <ListItemText primary="年次処理 (移行)" />
                </ListItemButton>
              </ListItem>
            )}

            {/* 管理者・経営者向けメニュー */}
            {isManager && (
              <>
                <ListItem disablePadding>
                  <ListItemButton component={NavLink} to="/accounting">
                    <ListItemIcon><ReceiptLongIcon /></ListItemIcon>
                    <ListItemText primary="経理" />
                  </ListItemButton>
                </ListItem>
                {isPlatformOwner && (
                  <ListItem disablePadding>
                    <ListItemButton component={NavLink} to="/platform">
                      <ListItemIcon><SettingsIcon sx={{ color: meta.color }} /></ListItemIcon>
                      <ListItemText primary="Platform Bridge" sx={{ '& .MuiListItemText-primary': { color: meta.color } }} />
                    </ListItemButton>
                  </ListItem>
                )}

                <ListItem disablePadding>
                  <ListItemButton component={NavLink} to="/admin">
                    <ListItemIcon><SettingsIcon /></ListItemIcon>
                    <ListItemText primary={meta.adminArea} />
                  </ListItemButton>
                </ListItem>
              </>
            )}

          </List>
          )}
        </Box>
        <Box sx={{ marginTop: 'auto', borderTop: `1px solid ${meta.color}22` }}>
          {/* 活動記録クイック検索 — サイドバー下部 */}
          <Box sx={{ px: 1.5, pt: 1.5, pb: 1 }}>
            <Typography
              sx={{
                fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase',
                color: '#22d3ee', mb: 0.5, pl: 0.5,
                textShadow: '0 0 8px rgba(34,211,238,0.4)',
              }}
            >
              Activity Log
            </Typography>
            <Box
              sx={{
                display: 'flex', alignItems: 'center', gap: 1,
                px: 1.5, py: 1,
                borderRadius: '10px',
                background: 'linear-gradient(135deg, rgba(6,182,212,0.1), rgba(34,211,238,0.05))',
                border: '1px solid',
                borderColor: searchText ? '#22d3ee' : 'rgba(6,182,212,0.25)',
                boxShadow: searchText
                  ? '0 0 20px rgba(34,211,238,0.25), inset 0 0 12px rgba(34,211,238,0.05)'
                  : '0 0 6px rgba(6,182,212,0.08)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  borderColor: 'rgba(34,211,238,0.6)',
                  boxShadow: '0 0 14px rgba(34,211,238,0.2), inset 0 0 8px rgba(34,211,238,0.03)',
                },
              }}
            >
              <SearchIcon sx={{ color: '#22d3ee', fontSize: '1.2rem', filter: 'drop-shadow(0 0 4px rgba(34,211,238,0.5))' }} />
              <InputBase
                inputRef={searchInputRef}
                placeholder="利用者を検索..."
                onInput={handleSearchInput}
                autoComplete="off"
                sx={{
                  flex: 1, fontSize: '0.85rem', color: '#e2e8f0', fontWeight: 500,
                  '& input::placeholder': { color: 'rgba(34,211,238,0.4)', opacity: 1 },
                }}
              />
              {searchText && (
                <Box
                  onClick={handleClearSearch}
                  sx={{ cursor: 'pointer', color: 'rgba(148,163,184,0.5)', fontSize: '0.75rem', '&:hover': { color: '#22d3ee' } }}
                >
                  ✕
                </Box>
              )}
            </Box>
          </Box>
          <Box sx={{ px: 2, pb: 2 }}>
            <UserInfoPanel role={role} profile={profile} />
            <Button variant="contained" color="error" fullWidth startIcon={<PowerSettingsNewIcon />} onClick={logout}>Shutdown</Button>
          </Box>
        </Box>
      </Drawer>

      {/* Main Content */}
      <Box component="main" sx={{ flexGrow: 1, height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#0f172a' }}>
        <Toolbar sx={{ minHeight: '48px !important' }} />

        {/* エミュレーターバナー */}
        {isEmulating && (
          <Box sx={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            px: 2, py: 0.5,
            bgcolor: 'rgba(139, 92, 246, 0.15)',
            borderBottom: '1px solid rgba(139, 92, 246, 0.4)',
          }}>
            <Typography variant="caption" sx={{ color: '#a78bfa', fontWeight: 'bold', letterSpacing: '0.05em' }}>
              🔍 {emulatingCompany?.name || '企業'} として表示中
            </Typography>
            <Button
              size="small"
              onClick={exitEmulatorMode}
              sx={{ color: '#a78bfa', fontSize: '0.7rem', py: 0, minWidth: 'auto', '&:hover': { bgcolor: 'rgba(139, 92, 246, 0.2)' } }}
            >
              ← 戻る
            </Button>
          </Box>
        )}

        <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
          <Outlet />
        </Box>
      </Box>

      <DevModeIndicator />
    </Box>
  );
}

export default Layout;