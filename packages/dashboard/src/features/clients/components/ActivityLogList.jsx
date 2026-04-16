import { useState, useEffect } from 'react';
import { collection, query, orderBy, where, onSnapshot, doc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "@/firebase/index.js";
import {
  Box, Paper, Typography, CircularProgress, Stack, Chip, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Alert
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ReplyIcon from '@mui/icons-material/Reply';
import SendIcon from '@mui/icons-material/Send';
import ActivityLogForm from './ActivityLogForm';
import { useCurrentUser } from '@/hooks/useCurrentUser';

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
  lost: '利用終了',
  line_message: 'LINE受信',
  line_reply: 'LINE送信',
  other: 'その他',
};

function ActivityLogList({ clientId, clientData }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingLog, setEditingLog] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const { companyId, loading: userLoading } = useCurrentUser();

  // LINE返信用state
  const [replyDialog, setReplyDialog] = useState(null); // 返信元のログ
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState(null); // { type: 'success'|'error', message }

  const hasLineLink = !!clientData?.lineUserId;

  useEffect(() => {
    if (userLoading) return;
    if (!clientId || !companyId) { setLoading(false); return; }
    const logsRef = collection(db, 'clients', clientId, 'activity_logs');
    const q = query(logsRef, where('companyId', '==', companyId), orderBy('createdAt', 'desc'));

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
  }, [clientId, companyId, userLoading]);

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

  // LINE返信送信
  const handleSendReply = async () => {
    if (!replyText.trim() || !clientId) return;
    setSending(true);
    setSendResult(null);
    try {
      const sendLineMessage = httpsCallable(functions, 'sendLineMessage');
      await sendLineMessage({ clientId, message: replyText.trim() });
      setSendResult({ type: 'success', message: 'LINEメッセージを送信しました' });
      setReplyText('');
      setReplyDialog(null);
    } catch (error) {
      console.error('LINE送信エラー:', error);
      const msg = error.message || 'LINE送信に失敗しました';
      setSendResult({ type: 'error', message: msg });
    } finally {
      setSending(false);
    }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress /></Box>;
  if (logs.length === 0) return <Typography sx={{ p: 3, color: 'text.secondary' }}>活動記録はまだありません。</Typography>;

  return (
    <>
      {/* 送信結果アラート */}
      {sendResult && (
        <Alert severity={sendResult.type} sx={{ mb: 2 }} onClose={() => setSendResult(null)}>
          {sendResult.message}
        </Alert>
      )}

      <Stack spacing={2}>
        {logs.map((log) => {
          const isLineReceived = log.type === 'line_message';
          const isLineReply = log.type === 'line_reply';
          const isLine = isLineReceived || isLineReply;

          return (
            <Paper
              key={log.id}
              variant="outlined"
              sx={{
                p: 2,
                position: 'relative',
                // LINE送信は右寄せ風にして色を変える
                ...(isLineReply && {
                  ml: 6,
                  borderColor: 'rgba(6, 199, 85, 0.4)',
                  bgcolor: 'rgba(6, 199, 85, 0.05)',
                }),
                // LINE受信は左寄せ風
                ...(isLineReceived && {
                  mr: 6,
                  borderColor: 'rgba(59, 130, 246, 0.4)',
                  bgcolor: 'rgba(59, 130, 246, 0.05)',
                }),
              }}
            >
              <Box sx={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 0.5 }}>
                {/* LINE受信メッセージに返信ボタン */}
                {isLineReceived && hasLineLink && (
                  <IconButton
                    size="small"
                    sx={{ color: '#06c755' }}
                    onClick={() => { setReplyDialog(log); setReplyText(''); setSendResult(null); }}
                    title="LINEで返信"
                  >
                    <ReplyIcon fontSize="small" />
                  </IconButton>
                )}
                {!isLine && (
                  <IconButton size="small" onClick={() => setEditingLog(log)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                )}
                <IconButton size="small" color="error" onClick={() => handleDelete(log.id)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>

              <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1, pr: 10 }}>
                <Typography variant="subtitle2">{formatDate(log.createdAt)}</Typography>
                <Chip
                  label={activityTypeMap[log.type] || log.type}
                  size="small"
                  sx={isLineReply
                    ? { bgcolor: '#06c755', color: '#fff' }
                    : isLineReceived
                      ? { bgcolor: '#3b82f6', color: '#fff' }
                      : { color: 'primary' }
                  }
                  {...(!isLine && { color: 'primary' })}
                />
              </Stack>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', mb: 1 }}>{log.content}</Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', textAlign: 'right', display: 'block' }}>
                記録者: {log.staffName || '不明'}
              </Typography>
            </Paper>
          );
        })}
      </Stack>

      {/* 編集ダイアログ */}
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

      {/* LINE返信ダイアログ */}
      <Dialog
        open={!!replyDialog}
        onClose={() => { if (!sending) setReplyDialog(null); }}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ReplyIcon sx={{ color: '#06c755' }} />
          LINEで返信
        </DialogTitle>
        <DialogContent>
          {replyDialog && (
            <Paper variant="outlined" sx={{ p: 1.5, mb: 2, bgcolor: 'rgba(59,130,246,0.05)', borderColor: 'rgba(59,130,246,0.3)' }}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>受信メッセージ:</Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{replyDialog.content}</Typography>
            </Paper>
          )}
          <TextField
            fullWidth
            multiline
            minRows={3}
            maxRows={8}
            placeholder="返信メッセージを入力..."
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            disabled={sending}
            autoFocus
          />
          {sendResult?.type === 'error' && (
            <Alert severity="error" sx={{ mt: 1 }}>{sendResult.message}</Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReplyDialog(null)} disabled={sending}>キャンセル</Button>
          <Button
            variant="contained"
            startIcon={sending ? <CircularProgress size={16} /> : <SendIcon />}
            onClick={handleSendReply}
            disabled={!replyText.trim() || sending}
            sx={{ bgcolor: '#06c755', '&:hover': { bgcolor: '#05a847' } }}
          >
            {sending ? '送信中...' : '送信'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default ActivityLogList;
