import { Typography, Box, Grid, Paper } from '@mui/material';
import { useAuth } from '../auth/context/AuthContext.jsx';
import DailyQuestBoard from './DailyQuestBoard';
import ActivityLogBoard from '../activity-log/ActivityLogBoard';
import { format } from 'date-fns';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { isPlatformRole } from '../../constants/roles';

function DashboardHome() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // プラットフォームオーナーは専用ダッシュボード（Control Tower）へ転送
  // ★ 2026-02-12: 強制リダイレクトを削除。両方のダッシュボードに自由にアクセス可能にする
  // useEffect(() => {
  //   if (currentUser?.role && isPlatformRole(currentUser.role)) {
  //     navigate('/platform');
  //   }
  // }, [currentUser, navigate]);

  // リダイレクト中は何も表示しない
  // if (currentUser?.role && isPlatformRole(currentUser.role)) {
  //   return null;
  // }

  return (
    // 親コンテナ: 画面いっぱいに広げる (Layout側で高さ調整されている前提だが、確実にするため100%)
    <Box sx={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      p: { xs: 1, md: 2 }, // レスポンシブパディング (スマホは小さく)
      overflow: 'hidden',
      position: 'relative', // Scroll container context
    }}>
      {/* Welcome Header (Compact) - 固定高さ */}
      <Paper
        elevation={0}
        sx={{
          p: 1.5,
          mb: 1.5,
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          borderRadius: 2,
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0 // ヘッダーは縮ませない
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 2, overflow: 'hidden' }}>
          <Typography variant="h6" fontWeight="bold" noWrap sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }}>
            Welcome back, {currentUser?.displayName || 'Staff'}!
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.8, display: { xs: 'none', sm: 'block' } }}>
            今日も一日、プロフェッショナルな支援を。
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'right', display: 'flex', alignItems: 'baseline', gap: 1, flexShrink: 0 }}>
          <Typography variant="caption" sx={{ opacity: 0.7, display: { xs: 'none', sm: 'block' } }}>
            {format(new Date(), 'yyyy.MM.dd(EEE)')}
          </Typography>
          <Typography variant="h6" fontWeight="bold" sx={{ color: '#3b82f6' }}>
            {format(new Date(), 'H:mm')}
          </Typography>
        </Box>
      </Paper>

      {/* Main Content Area (Fill remaining height) */}
      <Box sx={{ flexGrow: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <Grid container spacing={2} sx={{ height: '100%' }}>
          {/* Left Column: Activity Timeline */}
          {/* PCでは高さ100%でスクロール内包、スマホでは高さ自動 */}
          <Grid size={{ xs: 12, md: 8 }} sx={{ height: { xs: 'auto', md: '100%' }, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <ActivityLogBoard currentUser={currentUser} />
          </Grid>

          {/* Right Sidebar: Daily Quests */}
          {/* PCでは高さ100%でスクロール内包、スマホでは高さ自動（下に積まれる） */}
          <Grid size={{ xs: 12, md: 4 }} sx={{ height: { xs: 'auto', md: '100%' }, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <DailyQuestBoard currentUser={currentUser} />
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
export default DashboardHome;