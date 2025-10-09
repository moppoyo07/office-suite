import { useState } from 'react';
import { TextField, Button, Stack, Select, MenuItem, FormControl, InputLabel } from '@mui/material';

const ActivityLogForm = ({ onSubmit, onCancel, isSaving }) => {
  const [type, setType] = useState('meeting_office');
  const [content, setContent] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ type, content });
    // 送信後にフォームをクリア
    setType('meeting_office');
    setContent('');
  };

  const isSubmitDisabled = !type || !content || isSaving;

  return (
    <form onSubmit={handleSubmit}>
      <Stack spacing={2}>
        <FormControl fullWidth>
          <InputLabel id="log-type-label">活動種別</InputLabel>
          {/* ★★★ 変更点：選択肢を統一！ ★★★ */}
          <Select labelId="log-type-label" value={type} label="活動種別" onChange={(e) => setType(e.target.value)}>
            <MenuItem value="meeting_office">面談（事業所内）</MenuItem>
            <MenuItem value="meeting_external">面談（事業所外）</MenuItem>
            <MenuItem value="phone_call">電話連絡</MenuItem>
            <MenuItem value="email">メール連絡</MenuItem>
            <MenuItem value="visit_home">家庭訪問</MenuItem>
            <MenuItem value="visit_company">職場訪問</MenuItem>
            <MenuItem value="other">その他</MenuItem>
          </Select>
        </FormControl>
        <TextField label="活動内容" multiline rows={5} value={content} onChange={(e) => setContent(e.target.value)} fullWidth required />
        <Stack direction="row" justifyContent="flex-end" spacing={1} sx={{ mt: 2 }}>
          <Button onClick={onCancel} disabled={isSaving}>キャンセル</Button>
          <Button type="submit" variant="contained" disabled={isSubmitDisabled}>
            {isSaving ? '保存中...' : '保存する'}
          </Button>
        </Stack>
      </Stack>
    </form>
  );
};

export default ActivityLogForm;