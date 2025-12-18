import { Grid, Stack, TextField, Typography, Box, Button } from '@mui/material';
import { format } from 'date-fns';

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

const BasicInfoSection = ({ isEditing, data, handleChange, handleSave, handleCancelEdit }) => {
  // 編集モードではない（表示モード）の場合のJSX
  const renderDisplayMode = () => (
    <Stack spacing={4}>
      {/* --- 基本情報セクション --- */}
      <Box>
        <Typography variant="subtitle1" gutterBottom>基本情報</Typography>
        <Grid container spacing={2} rowSpacing={3}>
          {/* 1行目 */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography variant="caption" color="text.secondary">氏名</Typography>
            <Typography>{data?.name || '未設定'}</Typography>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography variant="caption" color="text.secondary">フリガナ</Typography>
            <Typography>{data?.nameKana || '未設定'}</Typography>
          </Grid>
          {/* 2行目 */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography variant="caption" color="text.secondary">生年月日</Typography>
            <Typography>{formatDate(data?.birthDate)}</Typography>
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Typography variant="caption" color="text.secondary">性別</Typography>
            <Typography>{data?.gender || '未設定'}</Typography>
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Typography variant="caption" color="text.secondary">血液型</Typography>
            <Typography>{data?.bloodType || '未設定'}</Typography>
          </Grid>
          {/* 3行目 */}
          <Grid size={{ xs: 12 }}>
            <Typography variant="caption" color="text.secondary">住所</Typography>
            <Typography>{(data?.postalCode ? `〒${data.postalCode} ` : '') + (data?.address || '未設定')}</Typography>
          </Grid>
          {/* 4行目 */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography variant="caption" color="text.secondary">電話番号</Typography>
            <Typography>{data?.phone || '未設定'}</Typography>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography variant="caption" color="text.secondary">携帯電話</Typography>
            <Typography>{data?.mobilePhone || '未設定'}</Typography>
          </Grid>
          {/* 5行目 */}
          <Grid size={{ xs: 12 }}>
            <Typography variant="caption" color="text.secondary">メールアドレス</Typography>
            <Typography>{data?.email || '未設定'}</Typography>
          </Grid>
        </Grid>
      </Box>

      {/* --- 通所経路セクション --- */}
      <Box>
        <Typography variant="subtitle1" gutterBottom>通所経路</Typography>
        <Grid container spacing={2} rowSpacing={3}>
          <Grid size={{ xs: 12 }}>
            <Typography variant="caption" color="text.secondary">交通手段</Typography>
            <Typography>{data?.commuteMethod || '未設定'}</Typography>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography variant="caption" color="text.secondary">自宅～事業所までの距離(km)</Typography>
            <Typography>{data?.commuteDistance || '未設定'}</Typography>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography variant="caption" color="text.secondary">交通費 片道合計(円)</Typography>
            <Typography>{data?.commuteTotalFare || '未設定'}</Typography>
          </Grid>
        </Grid>
      </Box>
    </Stack>
  );

  // 編集モードの場合のJSX
  const renderEditMode = () => (
    <Grid container spacing={3}>
      {/* 左カラム */}
      <Grid size={{ xs: 12, md: 7 }}>
        <Typography variant="subtitle1" gutterBottom>基本情報</Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}><TextField size="small" name="name" label="氏名" value={data?.name || ''} onChange={handleChange} fullWidth /></Grid>
          <Grid size={{ xs: 12, sm: 6 }}><TextField size="small" name="nameKana" label="フリガナ" value={data?.nameKana || ''} onChange={handleChange} fullWidth /></Grid>
          <Grid size={{ xs: 12, sm: 6 }}><TextField size="small" name="birthDate" label="生年月日" type="date" value={data?.birthDate ? format(new Date(data.birthDate.seconds ? data.birthDate.toDate() : data.birthDate), 'yyyy-MM-dd') : ''} onChange={handleChange} fullWidth InputLabelProps={{ shrink: true }} /></Grid>
          <Grid size={{ xs: 12, sm: 3 }}><TextField size="small" name="gender" label="性別" value={data?.gender || ''} onChange={handleChange} fullWidth /></Grid>
          <Grid size={{ xs: 12, sm: 3 }}><TextField size="small" name="bloodType" label="血液型" value={data?.bloodType || ''} onChange={handleChange} fullWidth /></Grid>
          <Grid size={{ xs: 12, sm: 4 }}><TextField size="small" name="postalCode" label="郵便番号" value={data?.postalCode || ''} onChange={handleChange} fullWidth /></Grid>
          <Grid size={{ xs: 12, sm: 8 }}><TextField size="small" name="address" label="住所" value={data?.address || ''} onChange={handleChange} fullWidth /></Grid>
          <Grid size={{ xs: 12, sm: 6 }}><TextField size="small" name="phone" label="電話番号" value={data?.phone || ''} onChange={handleChange} fullWidth /></Grid>
          <Grid size={{ xs: 12, sm: 6 }}><TextField size="small" name="mobilePhone" label="携帯電話" value={data?.mobilePhone || ''} onChange={handleChange} fullWidth /></Grid>
          <Grid size={{ xs: 12 }}><TextField size="small" name="email" label="メールアドレス" type="email" value={data?.email || ''} onChange={handleChange} fullWidth /></Grid>
        </Grid>
      </Grid>
      
      {/* 右カラム */}
      <Grid size={{ xs: 12, md: 5 }}>
        <Typography variant="subtitle1" gutterBottom>通所経路</Typography>
        <Stack spacing={2}>
            <TextField size="small" name="commuteMethod" label="交通手段" value={data?.commuteMethod || ''} onChange={handleChange} fullWidth />
            <TextField size="small" name="commuteDistance" label="自宅～事業所までの距離(km)" type="number" value={data?.commuteDistance || ''} onChange={handleChange} fullWidth />
            <TextField size="small" name="commuteTotalFare" label="交通費 片道合計(円)" type="number" value={data?.commuteTotalFare || ''} onChange={handleChange} fullWidth />
        </Stack>
      </Grid>
    </Grid>
  );

  return (
    <Box>
      {isEditing ? renderEditMode() : renderDisplayMode()}
      {isEditing && (
        <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
          <Button variant="contained" onClick={() => handleSave(data)}>保存</Button>
          <Button variant="outlined" onClick={handleCancelEdit}>キャンセル</Button>
        </Stack>
      )}
    </Box>
  );
};

export default BasicInfoSection;