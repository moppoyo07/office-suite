import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/firebase/index.js";
import { Box, Paper, Typography, CircularProgress, Stack, Chip } from '@mui/material';

// 日付を読みやすい形式に変換するヘルパー関数
const formatDate = (timestamp) => {
  if (!timestamp || !timestamp.toDate) return '日付不明';
  const date = timestamp.toDate();
  return date.toLocaleString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// 活動種別の翻訳辞書
const activityTypeMap = {
  phone_call: '電話連絡',
  email: 'メール連絡',
  meeting_office: '面談（事業所内）',
  meeting_external: '面談（事業所外）',
  visit_home: '家庭訪問',
  visit_company: '職場訪問',
  other: 'その他',
};

function ActivityLogList({ clientId }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clientId) {
      setLoading(false);
      return;
    }

    const logsRef = collection(db, 'clients', clientId, 'activity_logs');
    const q = query(logsRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const logsData = [];
      querySnapshot.forEach((doc) => {
        logsData.push({ id: doc.id, ...doc.data() });
      });
      setLogs(logsData);
      setLoading(false);
    }, (error) => {
      console.error("活動記録の取得に失敗:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [clientId]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (logs.length === 0) {
    return (
      <Typography sx={{ p: 3, color: 'text.secondary' }}>
        活動記録はまだありません。
      </Typography>
    );
  }

  return (
    <Stack spacing={2}>
      {logs.map((log) => (
        <Paper key={log.id} variant="outlined" sx={{ p: 2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2} sx={{ mb: 1 }}>
            <Typography variant="subtitle2" component="div">
              {formatDate(log.createdAt)}
            </Typography>
            <Chip label={activityTypeMap[log.type] || log.type} color="primary" size="small" />
          </Stack>
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', mb: 1 }}>
            {log.content}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', textAlign: 'right', display: 'block' }}>
            記録者: {log.staffName || '不明'}
          </Typography>
        </Paper>
      ))}
    </Stack>
  );
}

export default ActivityLogList;