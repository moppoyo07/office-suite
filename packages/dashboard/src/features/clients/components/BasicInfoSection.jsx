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
    // dateがDateオブジェクトか、有効なTimestampオブジェクトであることを期待
    if (date && typeof date.toDate === 'function') {
      return format(date.toDate(), 'yyyy/MM/dd');
    }
    // 文字列やDateオブジェクトの場合
    if (date) {
      return format(new Date(date), 'yyyy/MM/dd');
    }
    return ''; // nullやundefinedの場合は空文字
  } catch (error) {
    return '日付形式エラー'; // 無効な日付の場合
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
        <Stack spacing={2}>
          <DisplayRow>
            <DisplayItem label="氏名" value={data?.name} sm={6} />
            <DisplayItem label="フリガナ" value={data?.nameKana} sm={6} />
          </DisplayRow>
          <DisplayRow>
            <DisplayItem label="生年月日" value={formatDate(data?.birthDate)} sm={6} />
            <DisplayItem label="性別" value={data?.gender} sm={3} />
            <DisplayItem label="血液型" value={data?.bloodType} sm={3} />
          </DisplayRow>
          <DisplayRow>
            <DisplayItem label="住所" value={(data?.postalCode ? `〒${data.postalCode} ` : '') + (data?.address || '')} />
          </DisplayRow>
          <DisplayRow>
            <DisplayItem label="電話番号" value={data?.phone} sm={6} />
            <DisplayItem label="携帯電話" value={data?.mobilePhone} sm={6} />
          </DisplayRow>
          <DisplayRow>
            <DisplayItem label="メールアドレス" value={data?.email} />
          </DisplayRow>
        </Stack>
      </Box>

      {/* --- 通所経路セクション --- */}
      <Box>
        <Typography variant="subtitle1" gutterBottom>通所経路</Typography>
        <Stack spacing={2}>
            <DisplayRow>
                <DisplayItem label="交通手段" value={data?.commuteMethod} />
            </DisplayRow>
            <DisplayRow>
                <DisplayItem label="自宅～事業所までの距離(km)" value={data?.commuteDistance} sm={6} />
                <DisplayItem label="交通費 片道合計(円)" value={data?.commuteTotalFare} sm={6} />
            </DisplayRow>
        </Stack>
      </Box>
    </Stack>
  );

  // 編集モードの場合のJSX
  const renderEditMode = () => (
    <Grid container spacing={3}>
      {/* 左カラム */}
      <Grid item xs={12} md={7}>
        <Typography variant="subtitle1" gutterBottom>基本情報</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}><TextField size="small" name="name" label="氏名" value={data?.name || ''} onChange={handleChange} fullWidth /></Grid>
          <Grid item xs={12} sm={6}><TextField size="small" name="nameKana" label="フリガナ" value={data?.nameKana || ''} onChange={handleChange} fullWidth /></Grid>
          <Grid item xs={12} sm={6}><TextField size="small" name="birthDate" label="生年月日" type="date" value={data?.birthDate ? format(new Date(data.birthDate.seconds ? data.birthDate.toDate() : data.birthDate), 'yyyy-MM-dd') : ''} onChange={handleChange} fullWidth InputLabelProps={{ shrink: true }} /></Grid>
          <Grid item xs={12} sm={3}><TextField size="small" name="gender" label="性別" value={data?.gender || ''} onChange={handleChange} fullWidth /></Grid>
          <Grid item xs={12} sm={3}><TextField size="small" name="bloodType" label="血液型" value={data?.bloodType || ''} onChange={handleChange} fullWidth /></Grid>
          <Grid item xs={12} sm={4}><TextField size="small" name="postalCode" label="郵便番号" value={data?.postalCode || ''} onChange={handleChange} fullWidth /></Grid>
          <Grid item xs={12} sm={8}><TextField size="small" name="address" label="住所" value={data?.address || ''} onChange={handleChange} fullWidth /></Grid>
          <Grid item xs={12} sm={6}><TextField size="small" name="phone" label="電話番号" value={data?.phone || ''} onChange={handleChange} fullWidth /></Grid>
          <Grid item xs={12} sm={6}><TextField size="small" name="mobilePhone" label="携帯電話" value={data?.mobilePhone || ''} onChange={handleChange} fullWidth /></Grid>
          <Grid item xs={12}><TextField size="small" name="email" label="メールアドレス" type="email" value={data?.email || ''} onChange={handleChange} fullWidth /></Grid>
        </Grid>
      </Grid>
      
      {/* 右カラム */}
      <Grid item xs={12} md={5}>
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
      {/* 保存・キャンセルボタンは isEditing が true の時だけ表示 */}
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