// ステージ移動時の日付入力モーダル（必須入力）
import { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogContentText,
  DialogActions, Button, TextField, Typography
} from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

export default function StageTransitionModal({ open, fromLabel, toLabel, dateLabel, onConfirm, onCancel }) {
  const [date, setDate] = useState('');

  // ダイアログが開くたびにリセット
  useEffect(() => {
    if (open) setDate('');
  }, [open]);

  const handleConfirm = () => {
    if (!date) return;
    onConfirm(date);
  };

  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography component="span" fontWeight="bold">{fromLabel}</Typography>
        <ArrowForwardIcon fontSize="small" />
        <Typography component="span" fontWeight="bold" color="primary">{toLabel}</Typography>
      </DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          ステージを進める前に<strong>{dateLabel}</strong>を入力してください。
        </DialogContentText>
        <TextField
          label={dateLabel}
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          fullWidth
          required
          InputLabelProps={{ shrink: true }}
          autoFocus
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} color="inherit">キャンセル</Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          disabled={!date}
        >
          確定して進む
        </Button>
      </DialogActions>
    </Dialog>
  );
}
