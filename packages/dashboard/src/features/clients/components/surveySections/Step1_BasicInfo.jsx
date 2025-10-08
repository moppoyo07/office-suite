import React from 'react';
import { Stack, Box, Typography, TextField, Button, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { ja } from 'date-fns/locale';
import axios from 'axios';

// --- ヘルパー関数 ---
const calculateAge = (birthDate) => {
  if (!birthDate) return null;
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

const Step1_BasicInfo = ({ formData, setFormData, handleChange, handleDateChange, nextStep }) => {

  // --- ★★★ 郵便番号検索ロジックを復活 ★★★ ---
  const handlePostalCodeSearch = async () => {
    if (!formData.postalCode) return;
    try {
      const res = await axios.get(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${formData.postalCode}`);
      if (res.data.results) {
        const result = res.data.results[0];
        const fullAddress = `${result.address1}${result.address2}${result.address3}`;
        setFormData(prev => ({ ...prev, address: fullAddress }));
      } else {
        alert('住所が見つかりませんでした。');
      }
    } catch (error) {
      console.error("郵便番号検索エラー:", error);
      alert('住所の検索に失敗しました。');
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ja}>
      <Typography variant="h5" component="h2" gutterBottom>
        ステップ1：基本情報
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        あなたご自身について教えてください。
      </Typography>
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>

        {/* --- ★★★ 1段目: 氏名, ふりがな, 性別 ★★★ --- */}
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <TextField fullWidth label="氏名" name="name" value={formData.name || ''} onChange={handleChange} required />
          <TextField fullWidth label="ふりがな" name="nameKana" value={formData.nameKana || ''} onChange={handleChange} />
          <FormControl fullWidth sx={{ minWidth: 120 }}>
            <InputLabel>性別</InputLabel>
            <Select name="gender" value={formData.gender || ''} label="性別" onChange={handleChange}>
              <MenuItem value="male">男性</MenuItem><MenuItem value="female">女性</MenuItem><MenuItem value="other">その他</MenuItem>
            </Select>
          </FormControl>
        </Stack>
        
        {/* --- ★★★ 2段目: 生年月日, 年齢 ★★★ --- */}
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ alignItems: 'center' }}>
          <DatePicker label="生年月日" value={formData.birthDate || null} onChange={(newValue) => handleDateChange('birthDate', newValue)} sx={{ width: { xs: '100%', md: 250 } }} />
          <Typography variant="body1" sx={{ pl: { md: 2 } }}>
            年齢: <Box component="span" sx={{ fontWeight: 'bold', fontSize: '1.2rem', ml: 1 }}>{calculateAge(formData.birthDate) ?? '--'}</Box> 歳
          </Typography>
        </Stack>
        
        {/* --- 3段目: 郵便番号, 住所 --- */}
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ alignItems: 'flex-start' }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', width: { xs: '100%', md: 'auto' } }}>
            <TextField label="郵便番号" name="postalCode" placeholder="1000001" value={formData.postalCode || ''} onChange={handleChange} sx={{ width: 150 }}/>
            <Button onClick={handlePostalCodeSearch} variant="outlined">住所検索</Button>
          </Box>
          <TextField fullWidth label="住所" name="address" value={formData.address || ''} onChange={handleChange} />
        </Stack>

        {/* --- 4段目: 電話番号, メールアドレス --- */}
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <TextField fullWidth label="電話番号" name="phone" value={formData.phone || ''} onChange={handleChange} required />
          <TextField fullWidth label="メールアドレス" name="email" value={formData.email || ''} onChange={handleChange} />
        </Stack>

      </Box>
      
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
        <Button variant="contained" onClick={nextStep}>
          次へ進む
        </Button>
      </Box>
    </LocalizationProvider>
  );
};

export default Step1_BasicInfo;