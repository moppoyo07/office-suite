// src/features/clients/components/EmploymentDateModal.jsx

import { useState } from 'react';
import { Modal, Box, Typography, Button, Stack, TextField } from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import ja from 'date-fns/locale/ja'; // 日本語ロケールをインポート

// モーダルのスタイル
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
  color: 'text.primary' // ダークモードでもテキストが見えるように
};

function EmploymentDateModal({ open, onClose, onSubmit }) {
  const [selectedDate, setSelectedDate] = useState(new Date());

  const handleSubmit = () => {
    if (selectedDate) {
      onSubmit(selectedDate);
      onClose(); // 成功したらモーダルを閉じる
    } else {
      alert('日付を選択してください。');
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="employment-date-modal-title"
    >
      <Box sx={style}>
        <Typography id="employment-date-modal-title" variant="h6" component="h2">
          就職日を選択
        </Typography>

        <Box sx={{ my: 2 }}>
          {/* 日付選択カレンダー */}
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ja}>
            <DatePicker
              label="就職日"
              value={selectedDate}
              onChange={(newValue) => {
                setSelectedDate(newValue);
              }}
              renderInput={(params) => <TextField {...params} fullWidth />}
            />
          </LocalizationProvider>
        </Box>
        
        <Stack direction="row" spacing={2} justifyContent="flex-end">
          <Button onClick={onClose}>キャンセル</Button>
          <Button variant="contained" onClick={handleSubmit}>
            決定
          </Button>
        </Stack>
      </Box>
    </Modal>
  );
}

export default EmploymentDateModal;