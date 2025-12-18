import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Grid, Card, CardContent, CardActionArea, CircularProgress, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Link
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import PeopleIcon from '@mui/icons-material/People';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ChecklistIcon from '@mui/icons-material/Checklist';
import DescriptionIcon from '@mui/icons-material/Description';
import { useTheme } from '@mui/material/styles';
import { useDashboardStats } from '../hooks/useDashboardStats';
import { collectionGroup, query, where, getCountFromServer, getDocs, orderBy, Timestamp, getDoc } from 'firebase/firestore';
import { db } from '@/firebase';

// 活動種別の翻訳マップ
const activityTypeMap = {
  phone_call: '電話', email: 'メール', meeting_office: '面談(内)', meeting_external: '面談(外)',
  visit_home: '訪問(家)', visit_company: '訪問(職)', accompany: '同行', other: 'その他',
};

const SupportWorkPage = () => {
  const theme = useTheme();
  const { stats, loading: statsLoading } = useDashboardStats();
  
  const [activityCount, setActivityCount] = useState(null);
  const [loadingCount, setLoadingCount] = useState(true);
  const [indexError, setIndexError] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dailyLogs, setDailyLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // ★★★ 修正点：対象期間を「今日」から「直近3日間」に変更 ★★★
  const getTargetPeriod = () => {
    const end = new Date();
    end.setHours(23, 59, 59, 999); // 今日の終わり

    const start = new Date();
    start.setDate(start.getDate() - 3); // 3日前まで遡る
    start.setHours(0, 0, 0, 0); // その日の始まり

    return { start, end };
  };

  // 1. 件数取得
  useEffect(() => {
    const fetchActivityCount = async () => {
      try {
        const { start, end } = getTargetPeriod();
        const q = query(
          collectionGroup(db, 'activity_logs'),
          where('createdAt', '>=', Timestamp.fromDate(start)),
          where('createdAt', '<=', Timestamp.fromDate(end))
        );
        const snapshot = await getCountFromServer(q);
        setActivityCount(snapshot.data().count);
      } catch (error) {
        if (error.message.includes('index')) setIndexError(true);
      } finally {
        setLoadingCount(false);
      }
    };
    fetchActivityCount();
  }, []);

  // 2. 詳細リスト取得
  const handleOpenModal = async () => {
    setIsModalOpen(true);
    setLoadingLogs(true);
    try {
      const { start, end } = getTargetPeriod();
      const q = query(
        collectionGroup(db, 'activity_logs'),
        where('createdAt', '>=', Timestamp.fromDate(start)),
        where('createdAt', '<=', Timestamp.fromDate(end)),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      
      const logsWithClientName = await Promise.all(snapshot.docs.map(async (logDoc) => {
        const logData = logDoc.data();
        const clientRef = logDoc.ref.parent.parent;
        let clientName = '不明';
        if (clientRef) {
          const clientSnap = await getDoc(clientRef);
          if (clientSnap.exists()) clientName = clientSnap.data().name;
        }
        return { id: logDoc.id, clientId: clientRef ? clientRef.id : null, clientName, ...logData };
      }));
      setDailyLogs(logsWithClientName);
    } catch (error) {
      console.error("詳細取得エラー:", error);
    } finally {
      setLoadingLogs(false);
    }
  };

  // カードウィジェット
  const CardWidget = ({ to, onClick, icon, title, value, unit, description, color, isLoading }) => (
    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
      <Card sx={{ height: '100%' }}>
        <CardActionArea component={to ? RouterLink : 'button'} to={to} onClick={onClick} sx={{ height: '100%' }}>
          <CardContent sx={{ display: 'flex', flexDirection: 'column', height: '100%', p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box>
                <Typography variant="h6" component="div" sx={{ fontSize: '1rem', fontWeight: 'bold' }}>{title}</Typography>
                <Typography variant="caption" color="text.secondary">{description}</Typography>
              </Box>
              <Box sx={{ color: color || 'primary.main', ml: 1 }}>{React.cloneElement(icon, { sx: { fontSize: 32 } })}</Box>
            </Box>
            <Box sx={{ mt: 'auto', pt: 2, alignSelf: 'flex-end' }}>
              {isLoading ? <CircularProgress size={24} /> : (
                <Typography variant="h4" component="p" sx={{ fontWeight: 'bold' }}>
                  {value ?? '-'} <span style={{ fontSize: '0.9rem', marginLeft: '1px' }}>{unit}</span>
                </Typography>
              )}
            </Box>
          </CardContent>
        </CardActionArea>
      </Card>
    </Grid>
  );

  return (
    <Box sx={{ pb: 5 }}>
      <Typography variant="h4" gutterBottom>支援作業ダッシュボード</Typography>
      {indexError && <Alert severity="warning" sx={{ mb: 2 }}>インデックス作成が必要です。F12コンソールを確認してください。</Alert>}

      <Grid container spacing={3}>
        <CardWidget to="/clients/all" icon={<PeopleIcon />} title="全利用者" value={stats.totalClients} unit="名" description="利用者管理へ" color="primary.main" isLoading={statsLoading} />
        <CardWidget to="/support/monthly-planner" icon={<CalendarMonthIcon />} title="月次計画" value={stats.totalSlotsThisMonth} unit="コマ" description="今月の予定総数" color="success.main" isLoading={statsLoading} />
        <CardWidget to="/support/daily-checkin" icon={<ChecklistIcon />} title="日次出欠" value={stats.checkinToday} unit="名" description="本日の出席者" color="secondary.main" isLoading={statsLoading} />
        
        {/* ★変更：説明文を「直近3日間の記録」に変更★ */}
        <CardWidget onClick={handleOpenModal} icon={<DescriptionIcon />} title="活動記録" value={activityCount} unit="件" description="直近3日間の記録" color="warning.main" isLoading={loadingCount} />
      </Grid>

      {/* 詳細モーダル（ダークモード対応版） */}
      <Dialog 
        open={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        maxWidth="md" 
        fullWidth
        PaperProps={{ sx: { backgroundImage: 'none', backgroundColor: '#1e1e1e' } }}
      >
        <DialogTitle sx={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
          直近3日間の活動記録
        </DialogTitle>
        
        <DialogContent sx={{ p: 0 }}>
          {loadingLogs ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
          ) : dailyLogs.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="text.secondary">記録はありません。</Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead sx={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
                  <TableRow>
                    <TableCell align="center" sx={{ color: '#fff', fontWeight: 'bold', width: '80px', borderBottom: '1px solid rgba(255, 255, 255, 0.2)' }}>日付・時間</TableCell>
                    <TableCell align="left" sx={{ color: '#fff', fontWeight: 'bold', width: '140px', borderBottom: '1px solid rgba(255, 255, 255, 0.2)' }}>利用者</TableCell>
                    <TableCell align="center" sx={{ color: '#fff', fontWeight: 'bold', width: '100px', borderBottom: '1px solid rgba(255, 255, 255, 0.2)' }}>種別</TableCell>
                    <TableCell align="left" sx={{ color: '#fff', fontWeight: 'bold', borderBottom: '1px solid rgba(255, 255, 255, 0.2)' }}>内容</TableCell>
                    <TableCell align="right" sx={{ color: '#fff', fontWeight: 'bold', width: '100px', borderBottom: '1px solid rgba(255, 255, 255, 0.2)' }}>担当</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dailyLogs.map((log) => (
                    <TableRow key={log.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                      {/* 日付・時間：3日間表示なので日付も出す */}
                      <TableCell align="center" sx={{ verticalAlign: 'top', color: '#bbb', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', pt: 1.5, whiteSpace: 'pre-line' }}>
                        {log.createdAt?.toDate ? log.createdAt.toDate().toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' }) + '\n' + log.createdAt.toDate().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }) : '--/--\n--:--'}
                      </TableCell>
                      
                      <TableCell align="left" sx={{ verticalAlign: 'top', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', pt: 1.5 }}>
                        <Link component={RouterLink} to={`/clients/${log.clientId}`} underline="hover" sx={{ fontWeight: 'bold', color: '#90caf9', display: 'block' }}>
                          {log.clientName}
                        </Link>
                      </TableCell>
                      <TableCell align="center" sx={{ verticalAlign: 'top', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', pt: 1.5 }}>
                        <Chip label={activityTypeMap[log.type] || log.type} size="small" color="primary" variant="outlined" sx={{ fontSize: '0.75rem' }} />
                      </TableCell>
                      <TableCell align="left" sx={{ verticalAlign: 'top', whiteSpace: 'pre-wrap', color: '#fff', lineHeight: 1.6, borderBottom: '1px solid rgba(255, 255, 255, 0.1)', pt: 1.5, pb: 1.5 }}>
                        {log.content}
                      </TableCell>
                      <TableCell align="right" sx={{ verticalAlign: 'top', fontSize: '0.8rem', color: '#bbb', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', pt: 1.5 }}>
                        {log.staffName}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', p: 2 }}>
          <Button onClick={() => setIsModalOpen(false)} variant="outlined" color="inherit">閉じる</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SupportWorkPage;