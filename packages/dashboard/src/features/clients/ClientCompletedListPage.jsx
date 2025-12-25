// src/features/clients/ClientCompletedListPage.jsx

import { useState, useEffect } from 'react';
import {
  Box, Container, Typography, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, CircularProgress, Grid, Chip,
  FormControl, InputLabel, Select, MenuItem, Stack, Divider,
} from '@mui/material';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/firebase'; 
import { addMonths, format, getYear, getMonth } from 'date-fns';
import useRetentionRate from '@/hooks/useRetentionRate';

// --- ヘルパー関数 ---
const formatDate = (timestamp) => {
  if (!timestamp) return '---';
  try {
      // FirestoreのTimestamp型ならtoDate()、JSのDate型ならそのまま使う
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return format(date, 'yyyy/MM/dd');
  } catch (e) {
      return '---';
  }
};

const getStatusInfo = (client) => {
  // ★重要★ ここで確実にデータを拾う
  const { status, employmentDate, retirementDate } = client;
  
  // 定着支援の完了日は、followUpCompletionDate を最優先で見る
  const completionDate = client.followUpCompletionDate || client.completionDate;
  
  // 定着支援中の判定
  if (status && (status.startsWith('follow-up') || status === 'employed')) {
      const estimatedDate = employmentDate?.toDate() ? addMonths(employmentDate.toDate(), 6) : null;
      return {
        label: '定着支援中', color: 'info', relatedDateLabel: '達成予定日',
        relatedDateValue: estimatedDate ? format(estimatedDate, 'yyyy/MM/dd') : '---',
      };
  }

  switch (status) {
    case 'completed':
      return {
        label: '定着完了', color: 'success', relatedDateLabel: '達成日',
        relatedDateValue: formatDate(completionDate), // ここで正しい日付を表示
      };
    case 'retired':
    case 'closed-lost':
      return {
        label: '離職/終了', color: 'error', relatedDateLabel: '離職日',
        relatedDateValue: formatDate(retirementDate || client.lostAt),
      };
    default:
      return {
        label: '不明', color: 'default', relatedDateLabel: '関連日',
        relatedDateValue: '---',
      };
  }
};

const ClientCompletedListPage = () => {
  const [targetClients, setTargetClients] = useState([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [targetYear, setTargetYear] = useState(() => {
     const d = new Date();
     return d.getMonth() < 3 ? d.getFullYear() - 1 : d.getFullYear();
  });

  const { rate, numerator, denominator, details, loading: loadingRate, rule } = useRetentionRate(targetClients, targetYear);
  
  useEffect(() => {
    const fetchTargetClients = async () => {
      try {
        const targetStatuses = [
            'completed', 'retired', 'closed-lost', 'employed', 'follow-up',
            'follow-up-m1', 'follow-up-m2', 'follow-up-m3', 'follow-up-m4', 'follow-up-m5'
        ];
        const q = query(collection(db, 'clients'), where('status', 'in', targetStatuses), orderBy('employmentDate', 'desc'));
        const querySnapshot = await getDocs(q);
        setTargetClients(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error("データ取得失敗:", error);
      } finally {
        setLoadingClients(false);
      }
    };
    fetchTargetClients();
  }, []);

  // 年度選択肢作成
  const currentFiscalYear = new Date().getMonth() < 3 ? new Date().getFullYear() - 1 : new Date().getFullYear();
  const yearOptions = [];
  for (let y = currentFiscalYear + 1; y >= 2022; y--) { // 来年度も見れるように+1
    yearOptions.push(y);
  }

  return (
    <Container maxWidth="xl">
      <Box>
        <Grid container spacing={3} sx={{ mt: 2 }}>
          {/* 左カラム: リスト */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Typography variant="h6" gutterBottom>対象者リスト</Typography>
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
                            <TableCell>{client.employmentCompany || client.companyName || client.employmentInfo?.companyName || '---'}</TableCell>
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
          
          {/* 右カラム: 定着率 */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Typography variant="h6" gutterBottom>就労定着率</Typography>
            <Paper sx={{ p: 2 }}>
              <Stack spacing={2}>
                <FormControl fullWidth>
                  <InputLabel>対象年度</InputLabel>
                  <Select value={targetYear} label="対象年度" onChange={(e) => setTargetYear(e.target.value)}>
                    {yearOptions.map(y => <MenuItem key={y} value={y}>{y}年度</MenuItem>)}
                  </Select>
                </FormControl>
                <Divider />
                {loadingRate ? <CircularProgress sx={{ mx: 'auto', my: 2 }} /> : (
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h3" color="primary.main" fontWeight="bold">{rate.toFixed(1)}%</Typography>
                    <Typography color="text.secondary">({numerator}人 / {denominator}人)</Typography>
                    <Box sx={{ mt: 3, textAlign: 'left', bgcolor: 'rgba(0,0,0,0.05)', p: 1.5, borderRadius: 1 }}>
                      <Typography variant="caption" display="block">ルール: {rule}</Typography>
                      {Object.entries(details).map(([k, v]) => <Typography key={k} variant="caption" display="block">- {k}: {v}</Typography>)}
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