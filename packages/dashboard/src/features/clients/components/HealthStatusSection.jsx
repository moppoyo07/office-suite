import { 
  Box, Typography, Divider, Stack, TextField, Button, Grid, 
  FormGroup, FormControlLabel, Checkbox, RadioGroup, Radio, 
  FormControl, FormLabel, Chip 
} from '@mui/material';

// 服薬管理の選択肢を日本語に変換するヘルパー
const getMedicationLabel = (value) => {
  switch (value) {
    case 'self': return '自己管理';
    case 'family': return '家族管理';
    case 'none': return '服薬なし';
    default: return '未設定';
  }
};

const HealthStatusSection = ({ isEditing, data, handleChange, handleSave, handleCancelEdit }) => {

  // チェックボックス用の特別なハンドラ
  const handleCheckboxChange = (fieldName, value, checked) => {
    const currentValues = data[fieldName] || [];
    let newValues;
    if (checked) {
      newValues = [...currentValues, value];
    } else {
      newValues = currentValues.filter(item => item !== value);
    }
    handleChange({ target: { name: fieldName, value: newValues } });
  };
  
  // --- 表示モード (標準的で見やすいデザイン) ---
  const renderDisplayMode = () => (
    <Stack spacing={3}>
      {/* 1. 体調不良時のサイン */}
      <Box>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          体調不良時のサイン
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {data.healthSigns && data.healthSigns.length > 0 ? (
            data.healthSigns.map((sign, index) => (
              <Chip key={index} label={sign} color="warning" variant="outlined" size="small" />
            ))
          ) : (
            <Typography variant="body1">特になし</Typography>
          )}
        </Box>
      </Box>

      <Divider sx={{ borderStyle: 'dashed' }} />

      {/* 2. 服薬管理 & 対処法 */}
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            服薬管理方法
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 500 }}>
            {getMedicationLabel(data.medicationManagement)}
          </Typography>
        </Grid>
        
        <Grid size={{ xs: 12, sm: 8 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            体調不良時の対処法
          </Typography>
          <PaperContent text={data.copingMethods} />
        </Grid>
      </Grid>
    </Stack>
  );

  // --- 編集モード (入力しやすいフォーム) ---
  const renderEditMode = () => (
    <Stack spacing={3} component="form" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
      
      {/* 障害の把握 */}
      <FormControl component="fieldset">
        <FormLabel component="legend" sx={{ fontWeight: 'bold', mb: 1 }}>体調不良時のサイン（複数選択可）</FormLabel>
        <FormGroup row>
          {['幻聴・妄想', '不眠', 'イライラ', '頭痛', '食欲不振', '意欲低下'].map((sign) => (
            <FormControlLabel 
              key={sign}
              control={
                <Checkbox 
                  checked={data.healthSigns?.includes(sign) || false} 
                  onChange={(e) => handleCheckboxChange('healthSigns', sign, e.target.checked)} 
                />
              } 
              label={sign} 
            />
          ))}
        </FormGroup>
      </FormControl>

      <Divider />

      {/* 服薬管理 */}
      <FormControl component="fieldset">
        <FormLabel component="legend" sx={{ fontWeight: 'bold', mb: 1 }}>服薬管理方法</FormLabel>
        <RadioGroup row name="medicationManagement" value={data.medicationManagement || ''} onChange={handleChange}>
          <FormControlLabel value="self" control={<Radio />} label="自己管理" />
          <FormControlLabel value="family" control={<Radio />} label="家族管理" />
          <FormControlLabel value="none" control={<Radio />} label="服薬なし" />
        </RadioGroup>
      </FormControl>

      <Divider />

      {/* 対処法 */}
      <TextField 
        name="copingMethods" 
        label="体調不良時の対処法" 
        placeholder="例：静かな場所で休む、音楽を聴く、頓服を飲むなど"
        value={data.copingMethods || ''} 
        onChange={handleChange} 
        fullWidth 
        multiline 
        minRows={3} 
      />

      <Box sx={{ display: 'flex', gap: 1, pt: 2 }}>
        <Button type="submit" variant="contained" color="primary">保存</Button>
        <Button variant="outlined" onClick={handleCancelEdit}>キャンセル</Button>
      </Box>
    </Stack>
  );

  return (
    <Box>
      <Typography variant="h5" gutterBottom>心身の状況</Typography>
      <Divider sx={{ my: 2 }} />
      {isEditing ? renderEditMode() : renderDisplayMode()}
    </Box>
  );
};

// 改行コードを正しく表示するための小さなコンポーネント
const PaperContent = ({ text }) => (
  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
    {text || '未設定'}
  </Typography>
);

export default HealthStatusSection;