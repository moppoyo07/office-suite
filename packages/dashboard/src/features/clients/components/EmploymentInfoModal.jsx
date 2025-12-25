// src/features/clients/components/EmploymentInfoModal.jsx

import { useState, useEffect } from 'react';
import { Modal, Box, Typography, Button, Stack, TextField, Radio, RadioGroup, FormControlLabel, FormControl, FormLabel } from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import ja from 'date-fns/locale/ja';

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
  color: 'text.primary'
};

function EmploymentInfoModal({ open, onClose, onSubmit, initialData }) {
  // 卒業タイプ: 'employment'(就職) or 'other'(その他完了)
  const [type, setType] = useState('employment');
  const [companyName, setCompanyName] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [note, setNote] = useState(''); // その他の場合の理由メモ

  useEffect(() => {
    if (open) {
      if (initialData) {
        setCompanyName(initialData.companyName || '');
        setSelectedDate(initialData.employmentDate ? initialData.employmentDate.toDate() : new Date());
        setType('employment'); 
      } else {
        setCompanyName('');
        setSelectedDate(new Date());
        setType('employment');
        setNote('');
      }
    }
  }, [open, initialData]);

  const handleSubmit = () => {
    if (type === 'employment') {
      // 就職の場合：会社名は必須
      if (!companyName.trim()) {
        alert('就職先企業名を入力してください。');
        return;
      }
    }
    
    // データ送信
    onSubmit({
      type, // 'employment' または 'other'
      companyName: type === 'employment' ? companyName.trim() : '', // その他なら空
      employmentDate: selectedDate,
      note: type === 'other' ? note : '' // 理由メモ
    });
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={style}>
        <Typography variant="h6" component="h2" gutterBottom>
          卒業・完了処理
        </Typography>

        <Box sx={{ my: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          
          {/* 卒業区分の選択 */}
          <FormControl component="fieldset">
            <FormLabel component="legend">区分</FormLabel>
            <RadioGroup row value={type} onChange={(e) => setType(e.target.value)}>
              <FormControlLabel value="employment" control={<Radio />} label="就職" />
              <FormControlLabel value="other" control={<Radio />} label="その他完了" />
            </RadioGroup>
          </FormControl>

          {/* 就職の場合のみ表示 */}
          {type === 'employment' && (
            <TextField
              label="就職先企業名"
              fullWidth
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
              autoFocus
            />
          )}

          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ja}>
            <DatePicker
              label={type === 'employment' ? "就職日" : "完了日"}
              value={selectedDate}
              onChange={(newValue) => setSelectedDate(newValue)}
              renderInput={(params) => <TextField {...params} fullWidth />}
            />
          </LocalizationProvider>
          
          {/* その他の場合のみ表示 */}
          {type === 'other' && (
             <TextField
              label="完了理由・備考"
              fullWidth
              multiline
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="例: 進学のため、期間満了など"
            />
          )}
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

export default EmploymentInfoModal;