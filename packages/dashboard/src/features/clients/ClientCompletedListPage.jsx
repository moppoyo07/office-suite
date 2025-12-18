import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Grid,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Divider,
} from '@mui/material';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/firebase'; // パスを修正 (@を使用)
import { addMonths, format, getYear, getMonth } from 'date-fns';
import useRetentionRate from '@/hooks/useRetentionRate'; // パスを修正 (@を使用)

// --- ヘルパー関数群 ---
const formatDate = (timestamp) => {
  if (!timestamp || !timestamp.toDate) return '---';
  return format(timestamp.toDate(), 'yyyy/MM/dd');
};

const getFiscalYear = (date) => {
  if (!date) return null;
  const year = getYear(date);
  const month = getMonth(date);
  return month < 3 ? year - 1 : year;
};

const getStatusInfo = (client) => {
  const { status, employmentDate, completionDate, retirementDate } = client;
  switch (status) {
    case 'completed':
      return {
        label: '定着完了', color: 'success', relatedDateLabel: '達成日',
        relatedDateValue: formatDate(completionDate),
      };
    case 'employed':
      const estimatedDate = employmentDate?.toDate() ? addMonths(employmentDate.toDate(), 6) : null;
      return {
        label: '支援中', color: 'info', relatedDateLabel: '達成予定日',
        relatedDateValue: estimatedDate ? format(estimatedDate, 'yyyy/MM/dd') : '---',
      };
    case 'retired':
      return {
        label: '離職', color: 'error', relatedDateLabel: '離職日',
        relatedDateValue: formatDate(retirementDate),
      };
    default:
      return {
        label: '不明', color: 'default', relatedDateLabel: '関連日',
        relatedDateValue: '---',
      };
  }
};

// --- メインコンポーネント ---
const ClientCompletedListPage = () => {
  const [targetClients, setTargetClients] = useState([]);
  const [loadingClients, setLoadingClients] = useState(true);
  
  // 現在の会計年度を初期値として設定
  const [targetYear, setTargetYear] = useState(getFiscalYear(new Date()));

  // カスタムフックを呼び出し
  const { rate, numerator, denominator, details, loading: loadingRate, rule } = useRetentionRate(targetClients, targetYear);
  
  useEffect(() => {
    const fetchTargetClients = async () => {
      try {
        const targetStatuses = ['completed', 'employed', 'retired'];
        const q = query(
          collection(db, 'clients'),
          where('status', 'in', targetStatuses),
          orderBy('employmentDate', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const clientsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        setTargetClients(clientsData);
      } catch (error) {
        console.error("対象者のデータ取得に失敗しました:", error);
      } finally {
        setLoadingClients(false);
      }
    };
    fetchTargetClients();
  }, []);

  // 年度選択の選択肢を生成
  const yearOptions = [];
  const startYear = 2022; // 事業開始年度
  const currentYear = getFiscalYear(new Date());
  for (let y = currentYear; y >= startYear; y--) {
    yearOptions.push(y);
  }

  return (
    <Container maxWidth="xl">
      <Box>
        <Grid container spacing={3} sx={{ mt: 2 }}>
          {/* 左カラム */}
          {/* ▼▼▼ 修正: itemを削除し、sizeプロパティに変更 ▼▼▼ */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Typography variant="h6" component="h2" gutterBottom>対象者リスト</Typography>
            <Paper>
              <TableContainer sx={{ maxHeight: 600 }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>氏名</TableCell><TableCell>ステータス</TableCell>
                      <TableCell>就職先企業名</TableCell><TableCell>就職日</TableCell>
                      <TableCell>関連日</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loadingClients ? (
                      <TableRow><TableCell colSpan={5} align="center"><CircularProgress /></TableCell></TableRow>
                    ) : (
                      targetClients.map((client) => {
                        const statusInfo = getStatusInfo(client);
                        return (
                          <TableRow key={client.id} hover>
                            <TableCell>{client.name || '---'}</TableCell>
                            <TableCell><Chip label={statusInfo.label} color={statusInfo.color} size="small" /></TableCell>
                            <TableCell>{client.companyName || '---'}</TableCell>
                            <TableCell>{formatDate(client.employmentDate)}</TableCell>
                            <TableCell>{`${statusInfo.relatedDateLabel}: ${statusInfo.relatedDateValue}`}</TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
          
          {/* 右カラム: 就労定着率ダッシュボード */}
          {/* ▼▼▼ 修正: itemを削除し、sizeプロパティに変更 ▼▼▼ */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Typography variant="h6" component="h2" gutterBottom>就労定着率</Typography>
            <Paper sx={{ p: 2 }}>
              <Stack spacing={2}>
                <FormControl fullWidth>
                  <InputLabel id="year-select-label">対象年度</InputLabel>
                  <Select
                    labelId="year-select-label"
                    value={targetYear}
                    label="対象年度"
                    onChange={(e) => setTargetYear(e.target.value)}
                  >
                    {yearOptions.map(y => <MenuItem key={y} value={y}>{y}年度</MenuItem>)}
                  </Select>
                </FormControl>
                
                <Divider />

                {loadingRate ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h3" component="p" color="primary.main" sx={{ fontWeight: 'bold' }}>
                      {rate.toFixed(1)}%
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      ({numerator}人 / {denominator}人)
                    </Typography>
                    
                    <Box sx={{ mt: 3, textAlign: 'left', bgcolor: 'action.hover', p: 1.5, borderRadius: 1 }}>
                      <Typography variant="caption" display="block">適用ルール: {rule}</Typography>
                      <Typography variant="caption" display="block">計算内訳:</Typography>
                      {Object.entries(details).map(([key, value]) => (
                        <Typography variant="caption" display="block" key={key} sx={{ pl: 1 }}>
                          - {key}: {value}
                        </Typography>
                      ))}
                    </Box>
                  </Box>
                )}
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default ClientCompletedListPage;