// Step2_WelfareInfo.jsx

import React from 'react';
import { Stack, Box, Typography, TextField, Button, RadioGroup, FormControlLabel, Radio, FormControl, FormLabel, Checkbox, Select, MenuItem, InputLabel } from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { ja } from 'date-fns/locale';

const Step2_WelfareInfo = ({ formData, setFormData, handleChange, handleDateChange, nextStep, prevStep }) => {
  
  // --- ★★★ 障害種別のチェックボックス用ハンドラ ★★★ ---
  // チェックを入れる/外す処理
  const handleDisabilityCheck = (e) => {
    const { name, checked } = e.target;
    const key_enabled = `${name}_enabled`; // 例: "mental_enabled"
    const key_class = `${name}_class`;     // 例: "mental_class"
    
    let newFormData = { ...formData, [key_enabled]: checked };
    // チェックを外したら等級もクリアする
    if (!checked) {
      newFormData[key_class] = '';
    }
    setFormData(newFormData);
  };
  
  // --- 古いハンドラは削除 ---
  // handleDisabilityClassChange → TextField が handleChange を直接使うので不要に

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ja}>
      <Typography variant="h5" component="h2" gutterBottom>
        ステップ2：福祉関連情報
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        差し支えのない範囲でご回答ください。
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

        {/* --- 1段目: 手帳状況 (handbookOwnedDate などを handbookStartDate に統一) --- */}
        <FormControl component="fieldset" fullWidth>
          <FormLabel component="legend">障害者手帳の状況</FormLabel>
          <RadioGroup row name="handbookStatus" value={formData.handbookStatus || ''} onChange={handleChange} sx={{ mb: 1 }}>
            <FormControlLabel value="owned" control={<Radio />} label="有り" />
            <FormControlLabel value="none" control={<Radio />} label="無し" />
            <FormControlLabel value="pending" control={<Radio />} label="取得予定" />
          </RadioGroup>
          
          {(formData.handbookStatus === 'owned' || formData.handbookStatus === 'pending') && (
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: 'center', mt: 1 }}>
              <FormControl sx={{ minWidth: 150 }}>
                <InputLabel size="small">手帳の種類</InputLabel>
                <Select
                  name="handbookType"
                  value={formData.handbookType || ''}
                  label="手帳の種類"
                  onChange={handleChange}
                  size="small"
                >
                  <MenuItem value="mental">精神</MenuItem>
                  <MenuItem value="rehabilitation">療育</MenuItem>
                  <MenuItem value="physical">身体</MenuItem>
                </Select>
              </FormControl>

              {/* ★★★ handbookStartDate に統一 ★★★ */}
              <DatePicker 
                label={formData.handbookStatus === 'owned' ? "取得年月" : "取得予定年月"}
                value={formData.handbookStartDate || null}
                onChange={(newValue) => handleDateChange('handbookStartDate', newValue)}
                sx={{ width: { xs: '100%', sm: 250 } }}
                slotProps={{ textField: { size: 'small' } }}
              />
            </Stack>
          )}
        </FormControl>

        {/* --- 2段目: 障害種別 (フラット化) --- */}
        <FormControl component="fieldset">
          <FormLabel component="legend">障害種別（複数選択可）</FormLabel>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 200 }}>
                {/* ▼▼▼ フラットなキーと新しいハンドラを使用 ▼▼▼ */}
                <FormControlLabel control={<Checkbox checked={formData.mental_enabled || false} onChange={handleDisabilityCheck} name="mental" />} label="精神" />
                {formData.mental_enabled && <TextField size="small" label="等級" name="mental_class" value={formData.mental_class || ''} onChange={handleChange} sx={{ width: 100 }} />}
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 200 }}>
                <FormControlLabel control={<Checkbox checked={formData.intellectual_enabled || false} onChange={handleDisabilityCheck} name="intellectual" />} label="知的" />
                {formData.intellectual_enabled && <TextField size="small" label="等級" name="intellectual_class" value={formData.intellectual_class || ''} onChange={handleChange} sx={{ width: 100 }} />}
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 200 }}>
                <FormControlLabel control={<Checkbox checked={formData.physical_enabled || false} onChange={handleDisabilityCheck} name="physical" />} label="身体" />
                {formData.physical_enabled && <TextField size="small" label="等級" name="physical_class" value={formData.physical_class || ''} onChange={handleChange} sx={{ width: 100 }} />}
            </Box>
          </Box>
        </FormControl>

        {/* --- 3段目: 障害名, 自立支援医療 (selfSupportMedicalの値をbooleanに統一) --- */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: 'center' }}>
          <TextField fullWidth label="障害名（診断名）" name="diagnosisName" value={formData.diagnosisName || ''} onChange={handleChange} />
          <FormControl component="fieldset" sx={{ minWidth: 220 }}>
            <FormLabel component="legend">自立支援医療</FormLabel>
            {/* ★★★ valueを文字列の 'true'/'false' ではなく、booleanの true/false に統一 ★★★ */}
            <RadioGroup 
              row 
              name="selfSupportMedical" 
              value={formData.selfSupportMedical || false} // booleanで比較
              onChange={(e) => handleChange({ target: { name: e.target.name, value: e.target.value === 'true' }})}
            >
              <FormControlLabel value={true} control={<Radio />} label="利用あり" />
              <FormControlLabel value={false} control={<Radio />} label="利用なし" />
            </RadioGroup>
          </FormControl>
        </Stack>

      </Box>

      {/* --- ナビゲーションボタン --- */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
        <Button onClick={prevStep}>
          ステップ1へ戻る
        </Button>
        <Button variant="contained" onClick={nextStep}>
          次へ進む
        </Button>
      </Box>
    </LocalizationProvider>
  );
};

export default Step2_WelfareInfo;