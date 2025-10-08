// src/features/clients/components/CompletionModal.jsx (新規作成)
import { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import ja from 'date-fns/locale/ja';

function CompletionModal({ open, onClose, onSubmit }) {
  const [completionDate, setCompletionDate] = useState(new Date()); // 初期値は今日

  const handleSubmit = () => {
    onSubmit(completionDate);
    setCompletionDate(new Date()); // リセット
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>定着支援完了</DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ja}>
          <DatePicker
            label="完了日"
            value={completionDate}
            onChange={(newValue) => setCompletionDate(newValue)}
            renderInput={(params) => <TextField {...params} fullWidth />}
          />
        </LocalizationProvider>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>キャンセル</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          完了を確定
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default CompletionModal;