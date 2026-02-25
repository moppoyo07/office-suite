// components/ScheduleModal.jsx (新規作成)

import React, { useState, useEffect } from 'react';
import { Box, Typography, Divider, Stack, TextField, Button, Modal, Paper, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

// モーダルのスタイル
const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 450,
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
};

// 親から受け取るpropsに、モーダルの開閉を制御するものを追加
const ScheduleModal = ({ open, onClose, data, onSave }) => {

  // ★ 1. モーダル内で編集中のデータを管理するstateを追加
  const [editData, setEditData] = useState(data);

  // ★ 2. 親から渡されるdataが変わったら、編集データも更新する
  useEffect(() => {
    setEditData(data);
  }, [data]);

  // ★ 3. 編集用のヘルパー関数をモーダル内に移動
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (e.target.type === 'date') {
        const dateValue = value ? new Date(value) : null;
        setEditData(prev => ({ ...prev, [name]: dateValue }));
    } else {
        setEditData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSaveClick = () => {
    onSave(editData); // ★ 親に保存処理を依頼
    onClose();      // モーダルを閉じる
  };
  
  // (日付フォーマット関数は変更なし)
  const formatEditDate = (dateValue) => { /* ... */ };

  return (
    <Modal
      open={open}
      onClose={onClose}
    >
      <Paper sx={style}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" component="h2">日程管理</Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
        <Divider sx={{ my: 2 }} />
        
        {/* 元のScheduleSectionの編集モードの中身をほぼそのまま持ってくる */}
        <Stack spacing={2} sx={{ mt: 2 }}>
          <TextField name="consultingScheduledDate" label="見学・相談 予定日" type="date" value={formatEditDate(editData?.consultingScheduledDate)} onChange={handleChange} InputLabelProps={{ shrink: true }} />
          <TextField name="trialScheduledDate" label="体験利用 開始予定日" type="date" value={formatEditDate(editData?.trialScheduledDate)} onChange={handleChange} InputLabelProps={{ shrink: true }} />
          <TextField name="contractScheduledDate" label="契約手続き 予定日" type="date" value={formatEditDate(editData?.contractScheduledDate)} onChange={handleChange} InputLabelProps={{ shrink: true }} />
          <TextField name="serviceStartDate" label="本利用 開始予定日" type="date" value={formatEditDate(editData?.serviceStartDate)} onChange={handleChange} InputLabelProps={{ shrink: true }} />
          <Box sx={{ display: 'flex', gap: 1, pt: 2, justifyContent: 'flex-end' }}>
            <Button variant="outlined" onClick={onClose}>キャンセル</Button>
            <Button variant="contained" onClick={handleSaveClick}>保存</Button>
          </Box>
        </Stack>
      </Paper>
    </Modal>
  );
};

// formatEditDate関数の完全な実装
const formatEditDate = (dateValue) => {
  let date;
  if (dateValue?.toDate) { date = dateValue.toDate(); } 
  else if (dateValue instanceof Date) { date = dateValue; } 
  else { return ''; }
  if (isNaN(date.getTime())) { return ''; }
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};


export default ScheduleModal;