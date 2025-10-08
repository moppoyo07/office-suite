import { Grid, Stack, TextField, Typography, Box, Button } from '@mui/material';
import { format } from 'date-fns';

// データを安全に表示するためのヘルパーコンポーネント
const DisplayItem = ({ label, value, sm, xs }) => (
  <Grid item sm={sm} xs={xs || 12}>
    <Typography variant="caption" color="text.secondary">{label}</Typography>
    <Typography>{value || '未設定'}</Typography>
  </Grid>
);
const DisplayRow = ({ children }) => (
  <Grid container spacing={2}>{children}</Grid>
);

// 日付をフォーマットする安全な関数
const formatDate = (date) => {
  try {
    if (date && typeof date.toDate === 'function') {
      return format(date.toDate(), 'yyyy/MM/dd');
    }
    if (date) {
      return format(new Date(date), 'yyyy/MM/dd');
    }
    return '';
  } catch (error) {
    return '日付形式エラー';
  }
};

// --- ここからが本体のコンポーネント ---

const WelfareContractSection = ({ isEditing, data, handleChange, handleSave, handleCancelEdit }) => {

  // 表示モードのJSX
  const renderDisplayMode = () => (
    <Stack spacing={2}>
      <DisplayRow>
        <DisplayItem label="診断名" value={data?.diagnosisName} />
      </DisplayRow>
      <DisplayRow>
        <DisplayItem label="障害者手帳" value={data?.disabilityHandbook} sm={6} />
        <DisplayItem label="受給者証番号" value={data?.recipientId} sm={6} />
      </DisplayRow>
      <DisplayRow>
        <DisplayItem label="契約日" value={formatDate(data?.contractDate)} sm={4} />
        <DisplayItem label="利用開始日" value={formatDate(data?.serviceStartDate)} sm={4} />
        <DisplayItem label="利用終了日" value={formatDate(data?.serviceEndDate)} sm={4} />
      </DisplayRow>
    </Stack>
  );

  // 編集モードのJSX
  const renderEditMode = () => (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <TextField size="small" name="diagnosisName" label="診断名" value={data?.diagnosisName || ''} onChange={handleChange} fullWidth />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField size="small" name="disabilityHandbook" label="障害者手帳" value={data?.disabilityHandbook || ''} onChange={handleChange} fullWidth />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField size="small" name="recipientId" label="受給者証番号" value={data?.recipientId || ''} onChange={handleChange} fullWidth />
      </Grid>
      <Grid item xs={12} sm={4}>
        <TextField 
          size="small" 
          name="contractDate" 
          label="契約日" 
          type="date" 
          value={data?.contractDate ? format(new Date(data.contractDate.seconds ? data.contractDate.toDate() : data.contractDate), 'yyyy-MM-dd') : ''} 
          onChange={handleChange} 
          fullWidth
          // ★ 非推奨警告 修正点 1 ★
          slotProps={{ inputLabel: { shrink: true } }}
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <TextField 
          size="small" 
          name="serviceStartDate" 
          label="利用開始日" 
          type="date" 
          value={data?.serviceStartDate ? format(new Date(data.serviceStartDate.seconds ? data.serviceStartDate.toDate() : data.serviceStartDate), 'yyyy-MM-dd') : ''} 
          onChange={handleChange} 
          fullWidth
          // ★ 非推奨警告 修正点 2 ★
          slotProps={{ inputLabel: { shrink: true } }}
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <TextField 
          size="small" 
          name="serviceEndDate" 
          label="利用終了日" 
          type="date" 
          value={data?.serviceEndDate ? format(new Date(data.serviceEndDate.seconds ? data.serviceEndDate.toDate() : data.serviceEndDate), 'yyyy-MM-dd') : ''} 
          onChange={handleChange} 
          fullWidth
          // ★ 非推奨警告 修正点 3 ★
          slotProps={{ inputLabel: { shrink: true } }}
        />
      </Grid>
    </Grid>
  );

  return (
    <Box>
      <Typography variant="h5" gutterBottom>福祉・契約</Typography>
      {isEditing ? renderEditMode() : renderDisplayMode()}
      {isEditing && (
        <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
          <Button variant="contained" color="success" onClick={() => handleSave(data)}>このセクションを保存</Button>
          <Button variant="outlined" onClick={handleCancelEdit}>キャンセル</Button>
        </Stack>
      )}
    </Box>
  );
};

export default WelfareContractSection;