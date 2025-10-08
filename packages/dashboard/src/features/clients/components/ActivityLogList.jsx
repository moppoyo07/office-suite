// src/features/clients/components/ActivityLogList.jsx
import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase';
import { Box, Paper, Typography, CircularProgress, Stack, Divider } from '@mui/material';
import { format } from 'date-fns';
import ja from 'date-fns/locale/ja';

function ActivityLogList({ clientId }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clientId) return;

    const logsRef = collection(db, 'clients', clientId, 'activity_logs');
    const q = query(logsRef, orderBy('createdAt', 'desc')); // 新しい順に並べる

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setLogs(logsData);
      setLoading(false);
    }, (error) => {
      console.error("活動記録の取得に失敗:", error);
      setLoading(false);
    });

    return () => unsubscribe(); // クリーンアップ
  }, [clientId]);

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
  }
  
  if (logs.length === 0) {
    return <Typography sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>まだ活動記録はありません。</Typography>;
  }

  return (
    <Stack spacing={2}>
      {logs.map(log => (
        <Paper key={log.id} variant="outlined" sx={{ p: 2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2} sx={{ mb: 1 }}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                {log.createdAt ? format(log.createdAt.toDate(), 'yyyy/MM/dd HH:mm', { locale: ja }) : '日付不明'}
              </Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                種別: {log.type}
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              担当: {log.staffName || '不明'}
            </Typography>
          </Stack>
          <Divider sx={{ my: 1 }} />
          <Typography sx={{ whiteSpace: 'pre-wrap' }}>
            {log.content}
          </Typography>
        </Paper>
      ))}
    </Stack>
  );
}

export default ActivityLogList;