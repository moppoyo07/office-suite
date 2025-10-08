import { useState, useEffect } from 'react';
import { Modal, Box, Typography, TextField, Button, Stack, Select, MenuItem, FormControl, InputLabel, Divider, CircularProgress } from '@mui/material';
import { doc, getDoc } from "firebase/firestore"; // ★ getDoc をインポート
import { db } from "@/firebase/index.js"; // ★ db をインポート

// ★ propsを clientId に変更
const FollowUpModal = ({ open, onClose, onSubmit, clientId }) => {
  const [actionType, setActionType] = useState('phone_call');
  const [memo, setMemo] = useState('');
  
  // ★★★ ここからが新しい部分 ★★★
  const [clientInfo, setClientInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // モーダルが開かれ、かつclientIdが渡された時に、データを取得する
    const fetchClientInfo = async () => {
      if (open && clientId) {
        setLoading(true);
        try {
          const docRef = doc(db, "clients", clientId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            // 必要な情報（nameとphoneNumber）だけをstateに保存
            setClientInfo({
              name: docSnap.data().name,
              phoneNumber: docSnap.data().phoneNumber,
            });
          }
        } catch (error) {
          console.error("利用者情報の取得エラー:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchClientInfo();

    // モーダルが開くたびにフォームをリセット
    if (open) {
      setActionType('phone_call');
      setMemo('');
    } else {
      // 閉じるときに取得した情報をクリア
      setClientInfo(null);
    }
  }, [open, clientId]); // ★ openとclientIdが変わるたびに実行

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(actionType, memo);
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={{
        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        width: 400, bgcolor: 'background.paper', border: '2px solid #000', boxShadow: 24, p: 4,
      }}>
        <Typography variant="h5" component="h2">活動記録</Typography>
        
        {/* ★★★ ここから表示部分を修正 ★★★ */}
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
        {/* ★★★ ここまで ★★★ */}
        
        <form onSubmit={handleSubmit}>
          <Stack spacing={2}>
            {/* ... (フォーム部分は変更なし) ... */}
            <FormControl fullWidth>
              <InputLabel id="action-type-label">活動種別</InputLabel>
              <Select labelId="action-type-label" value={actionType} label="活動種別" onChange={(e) => setActionType(e.target.value)}>
                <MenuItem value="phone_call">電話</MenuItem><MenuItem value="email">メール</MenuItem>
                <MenuItem value="meeting">面談</MenuItem><MenuItem value="other">その他</MenuItem>
              </Select>
            </FormControl>
            <TextField label="活動メモ" multiline rows={4} value={memo} onChange={(e) => setMemo(e.target.value)} fullWidth />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
              <Button onClick={onClose}>キャンセル</Button>
              <Button type="submit" variant="contained">記録する</Button>
            </Box>
          </Stack>
        </form>
      </Box>
    </Modal>
  );
};

export default FollowUpModal;