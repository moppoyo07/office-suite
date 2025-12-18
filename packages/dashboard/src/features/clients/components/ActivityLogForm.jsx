import { useState, useEffect } from 'react';
import { TextField, Button, Stack, Select, MenuItem, FormControl, InputLabel, Divider, Typography } from '@mui/material';

const ActivityLogForm = ({ initialData, onSubmit, onCancel, isSaving }) => {
  // 初期値がない場合は 'retention_support' (定着支援) をデフォルトにするか、'meeting_office' にするか
  const [type, setType] = useState(initialData?.type || 'meeting_office');
  const [content, setContent] = useState(initialData?.content || '');

  useEffect(() => {
    if (initialData) {
      setType(initialData.type);
      setContent(initialData.content);
    }
  }, [initialData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 親コンポーネントの処理結果を受け取る
    const result = await onSubmit({ 
      id: initialData?.id,
      type, 
      content 
    });
    
    // ★重要修正: 保存に成功した場合のみ、フォームをリセットする
    // (resultが返ってこない古い実装の場合も考慮して、エラーが出てなければリセットしないようにする)
    if (result && result.success && !initialData) {
      setType('meeting_office');
      setContent('');
    }
  };

  const isSubmitDisabled = !type || !content || isSaving;

  return (
    <form onSubmit={handleSubmit}>
      <Stack spacing={2}>
        <FormControl fullWidth>
          <InputLabel id="log-type-label">活動種別</InputLabel>
          <Select 
            labelId="log-type-label" 
            value={type} 
            label="活動種別" 
            onChange={(e) => setType(e.target.value)}
          >
            {/* ★ご要望の項目を追加★ */}
            <MenuItem value="tour" sx={{ color: '#0288d1', fontWeight: 'bold' }}>見学</MenuItem>
            <MenuItem value="trial" sx={{ color: '#0288d1', fontWeight: 'bold' }}>体験利用</MenuItem>
            <MenuItem value="contract_prep" sx={{ color: '#ed6c02', fontWeight: 'bold' }}>利用準備</MenuItem>
            <MenuItem value="retention_support" sx={{ color: '#9c27b0', fontWeight: 'bold' }}>定着支援</MenuItem>
            
            <Divider />
            <Typography variant="caption" sx={{ pl: 2, py: 0.5, color: 'text.secondary' }}>通常業務</Typography>
            
            <MenuItem value="meeting_office">面談（事業所内）</MenuItem>
            <MenuItem value="meeting_external">面談（事業所外）</MenuItem>
            <MenuItem value="phone_call">電話連絡</MenuItem>
            <MenuItem value="email">メール連絡</MenuItem>
            <MenuItem value="visit_home">家庭訪問</MenuItem>
            <MenuItem value="visit_company">職場訪問</MenuItem>
            <MenuItem value="accompany">同行支援</MenuItem>
            <MenuItem value="other">その他</MenuItem>
          </Select>
        </FormControl>
        
        <TextField 
          label="活動内容" 
          multiline 
          minRows={15} 
          value={content} 
          onChange={(e) => setContent(e.target.value)} 
          fullWidth 
          required 
          placeholder="支援の内容や様子を詳しく入力してください"
        />
        
        <Stack direction="row" justifyContent="flex-end" spacing={1} sx={{ mt: 2 }}>
          <Button onClick={onCancel} disabled={isSaving} size="large">キャンセル</Button>
          <Button type="submit" variant="contained" disabled={isSubmitDisabled} size="large">
            {isSaving ? '保存中...' : (initialData ? '更新する' : '保存する')}
          </Button>
        </Stack>
      </Stack>
    </form>
  );
};

export default ActivityLogForm;