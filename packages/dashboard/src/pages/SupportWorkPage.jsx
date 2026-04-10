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
import EventNoteIcon from '@mui/icons-material/EventNote';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SettingsIcon from '@mui/icons-material/Settings';
import AssignmentIcon from '@mui/icons-material/Assignment';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import InsightsIcon from '@mui/icons-material/Insights';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';

import { useTheme } from '@mui/material/styles';

import { useDashboardStats } from '../hooks/useDashboardStats';
import { useAuth } from '../features/auth/context/AuthContext.jsx';
import { useTenant } from '../context/TenantContext';
import { ROLES } from '../constants/roles';
import { collection, collectionGroup, query, where, getDocs, orderBy, Timestamp, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

// 活動種別の翻訳マップ
const activityTypeMap = {
  phone_call: '電話', email: 'メール', meeting_office: '面談(内)', meeting_external: '面談(外)',
  visit_home: '訪問(家)', visit_company: '訪問(職)', accompany: '同行', other: 'その他',
};

const SupportWorkPage = () => {
  const theme = useTheme();
  const { currentUser } = useAuth();
  const { activeCompanyId: companyId } = useTenant();
  const isHotdog = currentUser?.role === ROLES.HELPER;
  const { stats, loading: statsLoading } = useDashboardStats();

  const [activityCount, setActivityCount] = useState(null);
  const [loadingCount, setLoadingCount] = useState(true);
  const [indexError, setIndexError] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dailyLogs, setDailyLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // 未予約者数
  const [unscheduledCount, setUnscheduledCount] = useState(null);
  const [loadingUnscheduled, setLoadingUnscheduled] = useState(true);

  // 月間実績コマ数
  const [monthlyActual, setMonthlyActual] = useState(null);

  // 本日の予定/実績
  const [todayPlanned, setTodayPlanned] = useState(null);
  const [todayActual, setTodayActual] = useState(null);
  const [loadingToday, setLoadingToday] = useState(true);

  // 振り返り一覧
  const [isReflectionModalOpen, setIsReflectionModalOpen] = useState(false);
  const [reflections, setReflections] = useState([]);
  const [reflectionCount, setReflectionCount] = useState(null);
  const [loadingReflections, setLoadingReflections] = useState(false);
  const [loadingReflectionCount, setLoadingReflectionCount] = useState(true);

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
        const companyFilter = companyId ? [where('companyId', '==', companyId)] : [];
        const q = query(
          collectionGroup(db, 'activity_logs'),
          ...companyFilter,
          where('createdAt', '>=', Timestamp.fromDate(start)),
          where('createdAt', '<=', Timestamp.fromDate(end))
        );
        const snapshot = await getDocs(q);
        setActivityCount(snapshot.size);
      } catch (error) {
        if (error.message.includes('index')) setIndexError(true);
      } finally {
        setLoadingCount(false);
      }
    };
    fetchActivityCount();
  }, []);

  // 未予約者数を取得
  useEffect(() => {
    const fetchUnscheduledCount = async () => {
      try {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;

        // アクティブな利用者を取得
        const companyFilter = companyId ? [where('companyId', '==', companyId)] : [];
        const clientsQuery = query(
          collection(db, 'clients'),
          ...companyFilter,
          where('status', 'in', ['active_onsite', 'active_remote'])
        );
        const clientsSnap = await getDocs(clientsQuery);
        const totalClients = clientsSnap.docs.length;

        // 今月の予定がある利用者を取得
        const plansQuery = query(
          collection(db, 'attendancePlans'),
          ...companyFilter,
          where('year', '==', year),
          where('month', '==', month)
        );
        const plansSnap = await getDocs(plansQuery);

        // 予定がある利用者をカウント（plannedDatesが1つ以上あるもの）
        const scheduledClientIds = new Set();
        plansSnap.docs.forEach(doc => {
          const data = doc.data();
          if (data.plannedDates && data.plannedDates.length > 0) {
            scheduledClientIds.add(data.clientId);
          }
        });

        const unscheduled = totalClients - scheduledClientIds.size;
        setUnscheduledCount(unscheduled);
      } catch (error) {
        console.error('未予約者数取得エラー:', error);
      } finally {
        setLoadingUnscheduled(false);
      }
    };
    fetchUnscheduledCount();
  }, []);

  // 月間実績コマ数を取得
  useEffect(() => {
    const fetchMonthlyActual = async () => {
      try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

        const companyFilter2 = companyId ? [where('companyId', '==', companyId)] : [];
        const recordsQuery = query(
          collection(db, 'attendanceRecords'),
          ...companyFilter2,
          where('date', '>=', Timestamp.fromDate(startOfMonth)),
          where('date', '<=', Timestamp.fromDate(endOfMonth))
        );
        const snapshot = await getDocs(recordsQuery);
        // ローカルでpresentをフィルタリング
        const presentCount = snapshot.docs.filter(doc => doc.data().status === 'present').length;
        setMonthlyActual(presentCount);
      } catch (error) {
        console.error('月間実績取得エラー:', error);
        setMonthlyActual(0);
      }
    };
    fetchMonthlyActual();
  }, []);

  // 本日の予定者数と出席者数を取得
  useEffect(() => {
    const fetchTodayStats = async () => {
      setLoadingToday(true);
      try {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        const day = now.getDate();
        const todayStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

        // 今日の予定を取得
        const todayCompanyFilter = companyId ? [where('companyId', '==', companyId)] : [];
        const plansQuery = query(
          collection(db, 'attendancePlans'),
          ...todayCompanyFilter,
          where('year', '==', year),
          where('month', '==', month)
        );
        const plansSnap = await getDocs(plansQuery);
        let plannedCount = 0;
        plansSnap.docs.forEach(doc => {
          const data = doc.data();
          if (data.plannedDates) {
            data.plannedDates.forEach(ts => {
              const d = ts.toDate();
              const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
              if (dateStr === todayStr) plannedCount++;
            });
          }
        });
        setTodayPlanned(plannedCount);

        // 今日の出席を取得
        const todayStart = new Date(year, month - 1, day, 0, 0, 0);
        const todayEnd = new Date(year, month - 1, day, 23, 59, 59);
        const recordsQuery = query(
          collection(db, 'attendanceRecords'),
          ...todayCompanyFilter,
          where('date', '>=', Timestamp.fromDate(todayStart)),
          where('date', '<=', Timestamp.fromDate(todayEnd))
        );
        const recordsSnap = await getDocs(recordsQuery);
        const actualCount = recordsSnap.docs.filter(doc => doc.data().status === 'present').length;
        setTodayActual(actualCount);
      } catch (error) {
        console.error('本日の出欠取得エラー:', error);
        setTodayPlanned(0);
        setTodayActual(0);
      } finally {
        setLoadingToday(false);
      }
    };
    fetchTodayStats();
  }, []);

  // 2. 詳細リスト取得
  const handleOpenModal = async () => {
    setIsModalOpen(true);
    setLoadingLogs(true);
    try {
      const { start, end } = getTargetPeriod();
      const companyFilter = companyId ? [where('companyId', '==', companyId)] : [];
      const q = query(
        collectionGroup(db, 'activity_logs'),
        ...companyFilter,
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
        return { id: logDoc.id, ...logData, clientId: clientRef ? clientRef.id : null, clientName: logData.clientName || clientName };
      }));
      setDailyLogs(logsWithClientName);
    } catch (error) {
      console.error("詳細取得エラー:", error);
    } finally {
      setLoadingLogs(false);
    }
  };

  // 今日の振り返り件数を取得
  useEffect(() => {
    const fetchReflectionCount = async () => {
      try {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const reflCountFilter = companyId ? [where('companyId', '==', companyId)] : [];
        const q = query(
          collection(db, 'attendanceRecords'),
          ...reflCountFilter,
          where('date', '>=', Timestamp.fromDate(todayStart)),
          where('date', '<=', Timestamp.fromDate(todayEnd))
        );
        const snapshot = await getDocs(q);
        // reflectionが空でないものだけカウント
        const count = snapshot.docs.filter(doc => {
          const data = doc.data();
          return data.reflection && data.reflection.trim() !== '';
        }).length;
        setReflectionCount(count);
      } catch (error) {
        console.error('振り返り件数取得エラー:', error);
        setReflectionCount(0);
      } finally {
        setLoadingReflectionCount(false);
      }
    };
    fetchReflectionCount();
  }, []);

  // 振り返り一覧モーダルを開く
  const handleOpenReflectionModal = async () => {
    setIsReflectionModalOpen(true);
    setLoadingReflections(true);
    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      const reflFilter = companyId ? [where('companyId', '==', companyId)] : [];
      const q = query(
        collection(db, 'attendanceRecords'),
        ...reflFilter,
        where('date', '>=', Timestamp.fromDate(todayStart)),
        where('date', '<=', Timestamp.fromDate(todayEnd)),
        orderBy('date', 'desc')
      );
      const snapshot = await getDocs(q);

      const reflectionData = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(record => record.reflection && record.reflection.trim() !== '');

      setReflections(reflectionData);
    } catch (error) {
      console.error('振り返り取得エラー:', error);
    } finally {
      setLoadingReflections(false);
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
        <CardWidget to="/clients/all" icon={<PeopleIcon />} title="全利用者" value={`${stats.activeClients}/${stats.totalClients}`} unit="名" description="利用中/累計登録" color="primary.main" isLoading={statsLoading} />
        <CardWidget
          to="/support/schedule-creation"
          icon={unscheduledCount === 0 ? <CheckCircleIcon /> : <EventNoteIcon />}
          title="スケジュール作成"
          value={unscheduledCount === 0 ? '完了' : unscheduledCount}
          unit={unscheduledCount === 0 ? '' : '名'}
          description={unscheduledCount === 0 ? '全員予約済み！' : '未予約の利用者'}
          color={unscheduledCount === 0 ? 'success.main' : 'info.main'}
          isLoading={loadingUnscheduled}
        />
        {!isHotdog && (
          <CardWidget
            to="/support/monthly-planner"
            icon={<CalendarMonthIcon />}
            title="月次計画"
            value={`${monthlyActual || 0}/${stats.totalSlotsThisMonth || 0}`}
            unit=""
            description="実績/予定"
            color="success.main"
            isLoading={statsLoading}
          />
        )}
        <CardWidget
          to="/support/daily-checkin"
          icon={<ChecklistIcon />}
          title="日次出欠"
          value={`${todayActual || 0}/${todayPlanned || 0}`}
          unit=""
          description="出席/予定"
          color="secondary.main"
          isLoading={loadingToday}
        />

        {/* サービス記録 */}
        <CardWidget
          to="/support/service-records"
          icon={<AssignmentIcon />}
          title="サービス記録"
          value="📋"
          unit=""
          description="未入力一覧・印刷"
          color="info.main"
          isLoading={false}
        />

        {/* CV分析 */}
        <CardWidget
          to="/support/cv-analysis"
          icon={<TrendingUpIcon />}
          title="CV分析"
          value="📊"
          unit=""
          description="月別コンバージョン率"
          color="success.main"
          isLoading={false}
        />

        {/* ★変更：説明文を「直近3日間の記録」に変更★ */}
        <CardWidget onClick={handleOpenModal} icon={<DescriptionIcon />} title="活動記録" value={activityCount} unit="件" description="直近3日間の記録" color="warning.main" isLoading={loadingCount} />

        {/* 振り返りログ */}
        <CardWidget
          to="/support/reflection-log"
          icon={<ChatBubbleOutlineIcon />}
          title="振り返りログ"
          value={reflectionCount}
          unit="件"
          description="振り返り一覧・検索"
          color="info.main"
          isLoading={loadingReflectionCount}
        />

        {/* 月間サマリー */}
        <CardWidget
          to="/support/monthly-checkin-summary"
          icon={<InsightsIcon />}
          title="月間サマリー"
          value="📊"
          unit=""
          description="チェックイン分析"
          color="secondary.main"
          isLoading={false}
        />

        {/* 利用料管理 */}
        <CardWidget
          to="/accounting/billing"
          icon={<ReceiptLongIcon />}
          title="利用料管理"
          value="💳"
          unit=""
          description="金額訂正・入金管理"
          color="#3b82f6"
          isLoading={false}
        />

        {/* 設定 */}
        <CardWidget
          to="/support/settings"
          icon={<SettingsIcon />}
          title="支援業務設定"
          value="⚙️"
          unit=""
          description="選択肢のカスタマイズ"
          color="grey.500"
          isLoading={false}
        />
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

      {/* 振り返り一覧モーダル */}
      <Dialog
        open={isReflectionModalOpen}
        onClose={() => setIsReflectionModalOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { backgroundImage: 'none', backgroundColor: '#1e1e1e' } }}
      >
        <DialogTitle sx={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
          💭 今日の振り返り一覧
        </DialogTitle>

        <DialogContent sx={{ p: 0 }}>
          {loadingReflections ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
          ) : reflections.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="text.secondary">今日の振り返りはまだありません。</Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead sx={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
                  <TableRow>
                    <TableCell align="left" sx={{ color: '#fff', fontWeight: 'bold', width: '140px', borderBottom: '1px solid rgba(255, 255, 255, 0.2)' }}>利用者</TableCell>
                    <TableCell align="left" sx={{ color: '#fff', fontWeight: 'bold', borderBottom: '1px solid rgba(255, 255, 255, 0.2)' }}>振り返り内容</TableCell>
                    <TableCell align="center" sx={{ color: '#fff', fontWeight: 'bold', width: '80px', borderBottom: '1px solid rgba(255, 255, 255, 0.2)' }}>退所時間</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reflections.map((record) => (
                    <TableRow key={record.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                      <TableCell align="left" sx={{ verticalAlign: 'top', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', pt: 1.5 }}>
                        <Typography sx={{ fontWeight: 'bold', color: '#90caf9' }}>
                          {record.clientName || '不明'}
                        </Typography>
                      </TableCell>
                      <TableCell align="left" sx={{ verticalAlign: 'top', whiteSpace: 'pre-wrap', color: '#fff', lineHeight: 1.6, borderBottom: '1px solid rgba(255, 255, 255, 0.1)', pt: 1.5, pb: 1.5 }}>
                        {record.reflection}
                      </TableCell>
                      <TableCell align="center" sx={{ verticalAlign: 'top', color: '#bbb', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', pt: 1.5 }}>
                        {record.endTime || '--:--'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', p: 2 }}>
          <Button onClick={() => setIsReflectionModalOpen(false)} variant="outlined" color="inherit">閉じる</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SupportWorkPage;