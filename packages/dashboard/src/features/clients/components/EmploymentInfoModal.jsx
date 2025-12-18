// src/features/clients/components/EmploymentInfoModal.jsx (ファイル名変更後)

// 1. useEffect をreactからインポートします
import { useState, useEffect } from 'react';
import { Modal, Box, Typography, Button, Stack, TextField } from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import ja from 'date-fns/locale/ja';

// モーダルのスタイル (変更なし)
const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  // ... (以下、変更なし)
  p: 4,
  color: 'text.primary'
};

// 2. propsに initialData を追加します（編集機能のため）
function EmploymentInfoModal({ open, onClose, onSubmit, initialData }) {
  // 3. 会社名を管理するためのstateを追加します
  const [companyName, setCompanyName] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());

  // 4. モーダルが開かれた時に初期値を設定するロジックを追加します
  useEffect(() => {
    // モーダルが表示されていて、かつ初期データがある場合（編集時）
    if (open && initialData) {
      setCompanyName(initialData.companyName || '');
      // FirestoreのTimestampをJavaScriptのDateオブジェクトに変換
      setSelectedDate(initialData.employmentDate ? initialData.employmentDate.toDate() : new Date());
    } else if (open) {
      // モーダルが表示されたが初期データがない場合（新規作成時）は値をリセット
      setCompanyName('');
      setSelectedDate(new Date());
    }
    // openかinitialDataが変わるたびにこのeffectを実行
  }, [open, initialData]);

  const handleSubmit = () => {
    // 5. バリデーションを強化し、会社名もチェックします
    if (companyName.trim() && selectedDate) {
      // 6. onSubmitには日付だけでなく、会社名も含むオブジェクトを渡します
      onSubmit({
        companyName: companyName.trim(),
        employmentDate: selectedDate,
      });
      onClose();
    } else {
      alert('就職先企業名と就職日の両方を入力してください。');
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="employment-info-modal-title" // ID名を変更
    >
      <Box sx={style}>
        {/* 7. タイトルを変更します */}
        <Typography id="employment-info-modal-title" variant="h6" component="h2">
          就職情報の登録
        </Typography>

        {/* 8. 入力欄をまとめるため、Boxで囲みレイアウトを調整します */}
        <Box sx={{ my: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* ▼▼▼ [新規追加] 会社名を入力するためのTextFieldです ▼▼▼ */}
          <TextField
            label="就職先企業名"
            variant="outlined"
            fullWidth
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            required
            autoFocus // モーダルが開いたらすぐに文字入力できるように
          />

          {/* 日付選択カレンダー (既存のものをそのまま利用) */}
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

export default EmploymentInfoModal;