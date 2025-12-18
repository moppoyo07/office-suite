import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/firebase/index.js";
import { Box, Paper, Typography, CircularProgress, Stack, Chip, IconButton, Dialog, DialogTitle, DialogContent } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ActivityLogForm from './ActivityLogForm';

const formatDate = (timestamp) => {
  if (!timestamp || !timestamp.toDate) return '日付不明';
  return timestamp.toDate().toLocaleString('ja-JP', {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
};

const activityTypeMap = {
  phone_call: '電話連絡',
  email: 'メール連絡',
  meeting_office: '面談（事業所内）',
  meeting_external: '面談（事業所外）',
  visit_home: '家庭訪問',
  visit_company: '職場訪問',
  accompany: '同行支援',
  other: 'その他',
};

function ActivityLogList({ clientId }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingLog, setEditingLog] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!clientId) { setLoading(false); return; }
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
      console.error("取得失敗:", error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [clientId]);

  const handleDelete = async (logId) => {
    if (!window.confirm('この記録を削除しますか？（取り消せません）')) return;
    try {
      await deleteDoc(doc(db, 'clients', clientId, 'activity_logs', logId));
    } catch (error) {
      console.error("削除エラー:", error);
      alert("削除に失敗しました。");
    }
  };

  const handleUpdate = async (data) => {
    if (!clientId || !data.id) return;
    setIsSaving(true);
    try {
      const logRef = doc(db, 'clients', clientId, 'activity_logs', data.id);
      await updateDoc(logRef, {
        type: data.type,
        content: data.content,
        updatedAt: serverTimestamp()
      });
      setEditingLog(null);
    } catch (error) {
      console.error("更新エラー:", error);
      alert("更新に失敗しました。");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress /></Box>;
  if (logs.length === 0) return <Typography sx={{ p: 3, color: 'text.secondary' }}>活動記録はまだありません。</Typography>;

  return (
    <>
      <Stack spacing={2}>
        {logs.map((log) => (
          <Paper key={log.id} variant="outlined" sx={{ p: 2, position: 'relative' }}>
            <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
              <IconButton size="small" onClick={() => setEditingLog(log)}>
                <EditIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" color="error" onClick={() => handleDelete(log.id)}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>

            <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1, pr: 8 }}>
              <Typography variant="subtitle2">{formatDate(log.createdAt)}</Typography>
              <Chip label={activityTypeMap[log.type] || log.type} color="primary" size="small" />
            </Stack>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', mb: 1 }}>{log.content}</Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', textAlign: 'right', display: 'block' }}>記録者: {log.staffName || '不明'}</Typography>
          </Paper>
        ))}
      </Stack>

      {/* 
         ★★★ 修正：maxWidth="md" にして幅を広げました ★★★ 
         (xs=極小, sm=スマホ, md=タブレット, lg=PC, xl=最大)
      */}
      <Dialog open={!!editingLog} onClose={() => setEditingLog(null)} fullWidth maxWidth="md">
        <DialogTitle>活動記録の編集</DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          {editingLog && (
            <ActivityLogForm 
              initialData={editingLog} 
              onSubmit={handleUpdate} 
              onCancel={() => setEditingLog(null)}
              isSaving={isSaving}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export default ActivityLogList;