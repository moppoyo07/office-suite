import { useState, useEffect } from 'react';
import {
  collection, query, where, onSnapshot, doc, updateDoc, deleteDoc,
  getDocs, serverTimestamp, writeBatch, deleteField
} from 'firebase/firestore';
import { db } from '@/firebase/index.js';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import {
  Box, Typography, Paper, Stack, Button, Chip, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, List, ListItem, ListItemButton, ListItemText,
  Alert, IconButton, Divider, Tabs, Tab
} from '@mui/material';
import LinkIcon from '@mui/icons-material/Link';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { getStatusInfo } from '@/constants/clientStatus';

function LineLinkPage() {
  const { companyId, loading: userLoading } = useCurrentUser();
  const [unlinkedMessages, setUnlinkedMessages] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [linkDialog, setLinkDialog] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [linking, setLinking] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [tab, setTab] = useState(0); // 0: 未紐付き, 1: 紐付け済み

  // 未紐付きメッセージをリアルタイム取得
  useEffect(() => {
    if (userLoading) return;
    const q = query(
      collection(db, 'unlinkedLineMessages'),
      where('linked', '==', false)
    );
    const unsubscribe = onSnapshot(q, (snap) => {
      const msgs = [];
      snap.forEach((doc) => msgs.push({ id: doc.id, ...doc.data() }));

      const grouped = {};
      msgs.forEach((msg) => {
        if (!grouped[msg.lineUserId]) {
          grouped[msg.lineUserId] = { ...msg, messageCount: 1, allMessages: [msg] };
        } else {
          grouped[msg.lineUserId].messageCount++;
          grouped[msg.lineUserId].allMessages.push(msg);
        }
      });
      setUnlinkedMessages(Object.values(grouped));
      setLoading(false);
    });
    return () => unsubscribe();
  }, [userLoading]);

  // クライアント一覧を取得
  useEffect(() => {
    if (!companyId) return;
    const q = query(
      collection(db, 'clients'),
      where('companyId', '==', companyId)
    );
    const unsubscribe = onSnapshot(q, (snap) => {
      const list = [];
      snap.forEach((doc) => list.push({ id: doc.id, ...doc.data() }));
      setClients(list);
    });
    return () => unsubscribe();
  }, [companyId]);

  // 紐付け済みクライアント一覧
  const linkedClients = clients.filter((c) => c.lineUserId);

  // 紐付け実行
  const handleLink = async (clientDoc) => {
    if (!linkDialog) return;
    setLinking(true);
    try {
      const { lineUserId, allMessages } = linkDialog;

      await updateDoc(doc(db, 'clients', clientDoc.id), {
        lineUserId: lineUserId,
        updatedAt: serverTimestamp(),
      });

      const batch = writeBatch(db);
      for (const msg of allMessages) {
        const activityRef = doc(collection(db, 'clients', clientDoc.id, 'activity_logs'));
        batch.set(activityRef, {
          type: 'line_message',
          content: msg.message,
          clientName: clientDoc.name || '',
          staffUid: 'line_bot',
          staffName: 'LINE自動記録',
          companyId: companyId,
          createdAt: msg.receivedAt || serverTimestamp(),
          source: 'line',
          lineUserId: lineUserId,
        });
        batch.update(doc(db, 'unlinkedLineMessages', msg.id), { linked: true });
      }
      await batch.commit();

      setSuccessMessage(`${clientDoc.name || 'クライアント'} とLINEを紐付けました（${allMessages.length}件の過去メッセージも活動記録に反映）`);
      setLinkDialog(null);
      setSearchText('');
    } catch (e) {
      console.error('紐付けエラー:', e);
      alert('紐付けに失敗しました: ' + e.message);
    } finally {
      setLinking(false);
    }
  };

  // 紐付け解除
  const handleUnlink = async (client) => {
    if (!window.confirm(`${client.name || 'クライアント'} のLINE紐付けを解除しますか？\n（過去の活動記録は残ります）`)) return;
    try {
      await updateDoc(doc(db, 'clients', client.id), {
        lineUserId: deleteField(),
        updatedAt: serverTimestamp(),
      });
      setSuccessMessage(`${client.name || 'クライアント'} のLINE紐付けを解除しました`);
    } catch (e) {
      console.error('解除エラー:', e);
      alert('解除に失敗しました: ' + e.message);
    }
  };

  // メッセージ削除
  const handleDelete = async (group) => {
    if (!window.confirm(`${group.displayName} の未紐付きメッセージ ${group.messageCount}件 を削除しますか？`)) return;
    try {
      const batch = writeBatch(db);
      for (const msg of group.allMessages) {
        batch.delete(doc(db, 'unlinkedLineMessages', msg.id));
      }
      await batch.commit();
    } catch (e) {
      console.error('削除エラー:', e);
      alert('削除に失敗しました');
    }
  };

  // クライアント検索フィルタ（ロスト含む全員）
  const filteredClients = clients.filter((c) => {
    if (!searchText) return true;
    const name = (c.name || '').toLowerCase();
    const kana = (c.nameKana || '').toLowerCase();
    const s = searchText.toLowerCase();
    return name.includes(s) || kana.includes(s);
  });

  if (loading || userLoading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}><CircularProgress /></Box>;
  }

  return (
    <Box sx={{ p: 3, maxWidth: 900, mx: 'auto' }}>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold', color: '#e2e8f0' }}>
        LINE 紐付け管理
      </Typography>

      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMessage('')}>
          {successMessage}
        </Alert>
      )}

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label={`未紐付き (${unlinkedMessages.length})`} />
        <Tab label={`紐付け済み (${linkedClients.length})`} />
      </Tabs>

      {/* タブ0: 未紐付きメッセージ */}
      {tab === 0 && (
        <>
          {unlinkedMessages.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'rgba(30,41,59,0.8)' }}>
              <CheckCircleIcon sx={{ fontSize: 48, color: '#22c55e', mb: 1 }} />
              <Typography sx={{ color: '#94a3b8' }}>
                未紐付きのLINEメッセージはありません
              </Typography>
            </Paper>
          ) : (
            <Stack spacing={2}>
              {unlinkedMessages.map((group) => (
                <Paper
                  key={group.lineUserId}
                  sx={{ p: 2, bgcolor: 'rgba(30,41,59,0.8)', border: '1px solid rgba(59,130,246,0.3)' }}
                >
                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#e2e8f0' }}>
                          {group.displayName}
                        </Typography>
                        <Chip label={`${group.messageCount}件`} size="small" color="info" />
                      </Stack>
                      <Typography variant="body2" sx={{ color: '#94a3b8', mb: 1 }}>
                        最新: {group.message}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748b' }}>
                        受信: {group.receivedAt?.toDate?.()
                          ? group.receivedAt.toDate().toLocaleString('ja-JP')
                          : '不明'}
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={1}>
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<LinkIcon />}
                        onClick={() => setLinkDialog(group)}
                      >
                        紐付ける
                      </Button>
                      <IconButton size="small" color="error" onClick={() => handleDelete(group)}>
                        <DeleteIcon />
                      </IconButton>
                    </Stack>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          )}
        </>
      )}

      {/* タブ1: 紐付け済み一覧 */}
      {tab === 1 && (
        <>
          {linkedClients.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'rgba(30,41,59,0.8)' }}>
              <Typography sx={{ color: '#94a3b8' }}>
                LINE紐付け済みのクライアントはいません
              </Typography>
            </Paper>
          ) : (
            <Stack spacing={1}>
              {linkedClients.map((client) => {
                const statusInfo = getStatusInfo(client.status);
                return (
                  <Paper
                    key={client.id}
                    sx={{ p: 2, bgcolor: 'rgba(30,41,59,0.8)', border: '1px solid rgba(34,197,94,0.3)' }}
                  >
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                      <Box>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#e2e8f0' }}>
                            {client.name || '名前なし'}
                          </Typography>
                          <Chip label={statusInfo.label} size="small" sx={{ bgcolor: statusInfo.bg, color: statusInfo.text }} />
                          <Chip label="LINE連携中" size="small" color="success" variant="outlined" />
                        </Stack>
                      </Box>
                      <Button
                        variant="outlined"
                        size="small"
                        color="error"
                        startIcon={<LinkOffIcon />}
                        onClick={() => handleUnlink(client)}
                      >
                        解除
                      </Button>
                    </Stack>
                  </Paper>
                );
              })}
            </Stack>
          )}
        </>
      )}

      {/* 紐付けダイアログ */}
      <Dialog open={!!linkDialog} onClose={() => { setLinkDialog(null); setSearchText(''); }} fullWidth maxWidth="sm">
        <DialogTitle>
          「{linkDialog?.displayName}」をクライアントと紐付ける
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            placeholder="クライアント名で検索..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            sx={{ mb: 2, mt: 1 }}
            autoFocus
          />
          <Divider sx={{ mb: 1 }} />
          <List sx={{ maxHeight: 400, overflow: 'auto' }}>
            {filteredClients.map((client) => {
              const statusInfo = getStatusInfo(client.status);
              return (
                <ListItem key={client.id} disablePadding>
                  <ListItemButton
                    onClick={() => handleLink(client)}
                    disabled={linking}
                  >
                    <ListItemText
                      primary={client.name || '名前なし'}
                      secondary={client.lineUserId ? '(LINE連携済み)' : null}
                    />
                    <Chip label={statusInfo.label} size="small" sx={{ bgcolor: statusInfo.bg, color: statusInfo.text, mr: 1 }} />
                    {client.lineUserId && (
                      <Chip label="連携済み" size="small" color="warning" />
                    )}
                  </ListItemButton>
                </ListItem>
              );
            })}
            {filteredClients.length === 0 && (
              <Typography sx={{ p: 2, color: 'text.secondary', textAlign: 'center' }}>
                該当するクライアントがありません
              </Typography>
            )}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setLinkDialog(null); setSearchText(''); }}>キャンセル</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default LineLinkPage;
