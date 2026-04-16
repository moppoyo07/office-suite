import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/index.js';
import { useActivityLog } from '../hooks/useActivityLog.js';
import ActivityLogList from '../features/clients/components/ActivityLogList.jsx';
import ActivityLogForm from '../features/clients/components/ActivityLogForm.jsx';
import {
  Box, Typography, Button, Dialog, DialogTitle, DialogContent, IconButton, Chip, Stack
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';

export default function ActivityLogPage() {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const { saveLog, isSaving } = useActivityLog();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openForm, setOpenForm] = useState(false);

  useEffect(() => {
    if (!clientId) return;
    const fetch = async () => {
      try {
        const snap = await getDoc(doc(db, 'clients', clientId));
        if (snap.exists()) setClient({ id: snap.id, ...snap.data() });
      } catch (e) {
        console.error('クライアント取得エラー:', e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [clientId]);

  const handleSave = async (logData) => {
    if (!client) return;
    const result = await saveLog(client.id, logData, client.name, client);
    if (result?.success) setOpenForm(false);
    return result;
  };

  if (loading) return <Box sx={{ p: 3 }}><Typography>読み込み中...</Typography></Box>;
  if (!client) return <Box sx={{ p: 3 }}><Typography>利用者が見つかりません</Typography></Box>;

  return (
    <Box sx={{ p: 3, maxWidth: 900, mx: 'auto' }}>
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
        <IconButton onClick={() => navigate(-1)}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          {client.name}
        </Typography>
        <Chip label="活動記録" size="small" color="primary" />
        <Box sx={{ flexGrow: 1 }} />
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenForm(true)}>
          活動記録を追加
        </Button>
      </Stack>

      <ActivityLogList clientId={clientId} clientData={client} />

      <Dialog open={openForm} onClose={() => setOpenForm(false)} fullWidth maxWidth="md">
        <DialogTitle>活動記録の追加</DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          <ActivityLogForm onSubmit={handleSave} onCancel={() => setOpenForm(false)} isSaving={isSaving} />
        </DialogContent>
      </Dialog>
    </Box>
  );
}
