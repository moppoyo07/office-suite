import { Box, Typography, Divider, Stack, TextField, Button, Grid, FormGroup, FormControlLabel, Checkbox, RadioGroup, Radio, FormControl, FormLabel } from '@mui/material';

const HealthStatusSection = ({ isEditing, data, handleChange, handleSave, handleCancelEdit }) => {

  // チェックボックス用の特別なハンドラ
  // 例: handleCheckboxChange('healthSigns', '不眠', true)
  const handleCheckboxChange = (fieldName, value, checked) => {
    const currentValues = data[fieldName] || []; // 現在の配列を取得 (なければ空配列)
    let newValues;
    if (checked) {
      newValues = [...currentValues, value]; // チェックされたら追加
    } else {
      newValues = currentValues.filter(item => item !== value); // チェックが外れたら削除
    }
    handleChange({ target: { name: fieldName, value: newValues } });
  };
  
  return (
    <Box>
      <Typography variant="h5" gutterBottom>心身の状況</Typography>
      <Divider sx={{ my: 2 }} />
      {isEditing ? (
        // --- 編集モード ---
        <Stack spacing={3} component="form" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
            {/* 障害の把握 */}
            <FormControl component="fieldset">
              <FormLabel component="legend">体調不良時のサイン（複数選択可）</FormLabel>
              <FormGroup row>
                <FormControlLabel control={<Checkbox checked={data.healthSigns?.includes('幻聴・妄想') || false} onChange={(e) => handleCheckboxChange('healthSigns', '幻聴・妄想', e.target.checked)} />} label="幻聴・妄想" />
                <FormControlLabel control={<Checkbox checked={data.healthSigns?.includes('不眠') || false} onChange={(e) => handleCheckboxChange('healthSigns', '不眠', e.target.checked)} />} label="不眠" />
                <FormControlLabel control={<Checkbox checked={data.healthSigns?.includes('イライラ') || false} onChange={(e) => handleCheckboxChange('healthSigns', 'イライラ', e.target.checked)} />} label="イライラ" />
                <FormControlLabel control={<Checkbox checked={data.healthSigns?.includes('頭痛') || false} onChange={(e) => handleCheckboxChange('healthSigns', '頭痛', e.target.checked)} />} label="頭痛" />
                {/* 他の選択肢も同様に追加 */}
              </FormGroup>
            </FormControl>

            {/* 服薬管理 */}
            <FormControl component="fieldset">
              <FormLabel component="legend">服薬管理方法</FormLabel>
              <RadioGroup row name="medicationManagement" value={data.medicationManagement || ''} onChange={handleChange}>
                <FormControlLabel value="self" control={<Radio />} label="自己管理" />
                <FormControlLabel value="family" control={<Radio />} label="家族管理" />
                <FormControlLabel value="none" control={<Radio />} label="服薬なし" />
              </RadioGroup>
            </FormControl>

            <TextField name="copingMethods" label="体調不良時の対処法" value={data.copingMethods || ''} onChange={handleChange} fullWidth multiline rows={3} />

            <Box sx={{ display: 'flex', gap: 1, pt: 2 }}>
              <Button type="submit" variant="contained">保存</Button>
              <Button variant="outlined" onClick={handleCancelEdit}>キャンセル</Button>
            </Box>
        </Stack>
      ) : (
        // --- 表示モード (スパイ映画風UI) ---
        <Stack spacing={2.5}>
            <Box>
              <Typography variant="overline" sx={{ color: 'primary.main', letterSpacing: '0.1em' }}>
                PSYCHOLOGICAL & BEHAVIORAL PROFILE
              </Typography>
              <Divider sx={{ mb: 1.5 }} />
              <Stack spacing={1.5}>
                <Box>
                  <Typography sx={{ color: 'text.secondary' }}>Health Condition Signs (on distress)</Typography>
                  <Typography variant="h6" sx={{ color: '#e0e0e0' }}>{data.healthSigns?.join(', ') || 'N/A'}</Typography>
                </Box>
                <Box>
                  <Typography sx={{ color: 'text.secondary' }}>Medication Management</Typography>
                  <Typography variant="h6" sx={{ color: '#e0e0e0' }}>{data.medicationManagement === 'self' ? 'Self-managed' : data.medicationManagement === 'family' ? 'Family-managed' : 'No medication'}</Typography>
                </Box>
                 <Box>
                  <Typography sx={{ color: 'text.secondary' }}>Coping Methods</Typography>
                  <Typography sx={{ color: '#bdbdbd', whiteSpace: 'pre-wrap' }}>{data.copingMethods || 'No data'}</Typography>
                </Box>
              </Stack>
            </Box>
        </Stack>
      )}
    </Box>
  );
};

export default HealthStatusSection;