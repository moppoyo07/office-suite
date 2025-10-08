// src/features/clients/components/ActivityLogForm.jsx
import { useState } from 'react';
import { Box, Button, TextField, Select, MenuItem, FormControl, InputLabel, Stack } from '@mui/material';

const activityTypes = ["面談", "電話", "来所時", "その他"];

function ActivityLogForm({ onSubmit, onCancel, initialData = {} }) {
  const [type, setType] = useState(initialData.type || "面談");
  const [content, setContent] = useState(initialData.content || "");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!content.trim()) {
      alert("内容を入力してください。");
      return;
    }
    onSubmit({ type, content });
    // フォームをリセット
    setType("面談");
    setContent("");
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Stack spacing={2}>
        <FormControl fullWidth>
          <InputLabel>種別</InputLabel>
          <Select value={type} label="種別" onChange={(e) => setType(e.target.value)}>
            {activityTypes.map((t) => (
              <MenuItem key={t} value={t}>{t}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          label="活動内容"
          multiline
          rows={5}
          fullWidth
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <Stack direction="row" spacing={1} justifyContent="flex-end">
          <Button onClick={onCancel}>キャンセル</Button>
          <Button type="submit" variant="contained">保存</Button>
        </Stack>
      </Stack>
    </Box>
  );
}

export default ActivityLogForm;