import { useState, useEffect } from 'react';
import { Modal, Box, Typography, TextField, Button, Stack, Select, MenuItem, FormControl, InputLabel, Divider, CircularProgress, Paper } from '@mui/material'; // ★ Paperを追加
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase/index.js";

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 450, // 少し幅を広げる
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
  borderRadius: 2, // 角を少し丸める
};

const FollowUpModal = ({ open, onClose, onSubmit, clientId, isSaving }) => { 
  const [actionType, setActionType] = useState('phone_call');
  const [memo, setMemo] = useState('');
  
  const [clientInfo, setClientInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchClientInfo = async () => {
      if (open && clientId) {
        setLoading(true);
        try {
          const docRef = doc(db, "clients", clientId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setClientInfo({
              name: docSnap.data().name,
              phoneNumber: docSnap.data().phoneNumber,
            });
          }
        } catch (error) { console.error("利用者情報の取得エラー:", error); }
        finally { setLoading(false); }
      }
    };
    fetchClientInfo();

    if (open) {
      setActionType('phone_call');
      setMemo('');
    } else {
      setClientInfo(null);
    }
  }, [open, clientId]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ type: actionType, content: memo });
  };

  const isSubmitDisabled = !actionType || !memo || isSaving;

  return (
    // ★★★ 変更点： <Box> の代わりに <Paper> を使うことで、背景が白くなります ★★★
    <Modal open={open} onClose={onClose}>
      <Paper sx={modalStyle}>
        <Typography variant="h5" component="h2">活動記録</Typography>
        
        {loading ? (
          <CircularProgress sx={{ my: 2 }} />
        ) : clientInfo ? (
          <>
            <Typography variant="h6" sx={{ mt: 1 }}>{clientInfo.name}</Typography>
            {clientInfo.phoneNumber && (
              <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                TEL: {clientInfo.phoneNumber}
              </Typography>
            )}
          </>
        ) : (
          <Typography sx={{ my: 2 }}>利用者情報を読み込めませんでした。</Typography>
        )}
        <Divider sx={{ my: 2 }} />
        
        <form onSubmit={handleSubmit}>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <FormControl fullWidth>
              <InputLabel id="action-type-label">活動種別</InputLabel>
              <Select labelId="action-type-label" value={actionType} label="活動種別" onChange={(e) => setActionType(e.target.value)}>
                <MenuItem value="phone_call">電話</MenuItem>
                <MenuItem value="email">メール</MenuItem>
                <MenuItem value="meeting">面談</MenuItem>
                <MenuItem value="other">その他</MenuItem>
              </Select>
            </FormControl>
            <TextField label="活動メモ" multiline rows={4} value={memo} onChange={(e) => setMemo(e.target.value)} fullWidth required />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2 }}>
              <Button onClick={onClose} disabled={isSaving}>キャンセル</Button>
              <Button type="submit" variant="contained" disabled={isSubmitDisabled}>
                {isSaving ? <CircularProgress size={24} /> : '記録する'}
              </Button>
            </Box>
          </Stack>
        </form>
      </Paper>
    </Modal>
  );
};

export default FollowUpModal;