import { useState } from 'react';
import { Modal, Box, Typography, Button, Stack, TextField, RadioGroup, FormControlLabel, Radio, FormControl, FormLabel } from '@mui/material';

// ロスト理由の選択肢
const lostReasons = [
  '連絡がつかない',
  '他事業所に決定',
  '時期尚早・見送り',
  '条件が合わない',
  'その他',
];

// MUIモーダルのスタイル
const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
};

function LostReasonModal({ open, onClose, onSubmit }) {
  const [reason, setReason] = useState(lostReasons[0]);
  const [details, setDetails] = useState('');

  const handleSubmit = () => {
    // 選択された理由と詳細を、親コンポーネントに渡す
    onSubmit(reason, details);
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={style}>
        <Typography variant="h6" component="h2">
          ロスト理由の入力
        </Typography>
        <Stack spacing={2} sx={{ mt: 2 }}>
          <FormControl>
            <FormLabel>理由を選択</FormLabel>
            <RadioGroup value={reason} onChange={(e) => setReason(e.target.value)}>
              {lostReasons.map((opt) => (
                <FormControlLabel key={opt} value={opt} control={<Radio />} label={opt} />
              ))}
            </RadioGroup>
          </FormControl>
          <TextField
            label="詳細（任意）"
            multiline
            rows={3}
            value={details}
            onChange={(e) => setDetails(e.target.value)}
          />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button onClick={onClose}>キャンセル</Button>
            <Button variant="contained" color="error" onClick={handleSubmit}>
              ロストを確定
            </Button>
          </Box>
        </Stack>
      </Box>
    </Modal>
  );
}

export default LostReasonModal;