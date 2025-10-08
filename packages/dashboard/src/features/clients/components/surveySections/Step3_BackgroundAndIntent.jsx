// Step3_BackgroundAndIntent.jsx

import React from 'react';
import { Stack, Box, Typography, TextField, Button, RadioGroup, FormControlLabel, Radio, FormControl, FormLabel, Checkbox, FormGroup, Select, MenuItem, InputLabel } from '@mui/material';

const Step3_BackgroundAndIntent = ({ formData, setFormData, handleChange, nextStep, prevStep }) => {

  // --- ★★★ チェックボックス（複数選択）用の汎用ハンドラ ★★★ ---
  // どのチェックボックスグループでも使えるように汎用化
  const handleCheckboxChange = (groupName, itemName, isChecked) => {
    const currentItems = formData[groupName] || [];
    let newItems;
    if (isChecked) {
      newItems = [...currentItems, itemName];
    } else {
      newItems = currentItems.filter(item => item !== itemName);
    }
    // setFormData を直接使って配列を更新
    setFormData(prev => ({ ...prev, [groupName]: newItems }));
  };
  
  // --- ネスト関連の古いハンドラはすべて削除 ---
  // handleHowDidYouHearCheck → handleCheckboxChange に統合
  // handleFutureActionsCheck → handleCheckboxChange に統合
  // handleChangeNested → 不要なので削除

  return (
    <>
      <Typography variant="h5" component="h2" gutterBottom>
        ステップ3：ご利用の背景・ご意向
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        あなたの状況や、希望について教えてください。
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>

        {/* --- 1. 事業所を知った経緯 --- */}
        <FormControl component="fieldset">
          <FormLabel component="legend">事業所をどのような経緯でお知りになりましたか？（複数選択可）</FormLabel>
          <FormGroup sx={{ mt: 1 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} flexWrap="wrap">
              {/* ▼▼▼ 汎用ハンドラを使うように修正 ▼▼▼ */}
              <FormControlLabel control={<Checkbox checked={formData.howDidYouHear?.includes('homepage') || false} onChange={(e) => handleCheckboxChange('howDidYouHear', 'homepage', e.target.checked)} />} label="ホームページ" />
              <FormControlLabel control={<Checkbox checked={formData.howDidYouHear?.includes('flyer') || false} onChange={(e) => handleCheckboxChange('howDidYouHear', 'flyer', e.target.checked)} />} label="チラシ・ポスター" />
              <FormControlLabel control={<Checkbox checked={formData.howDidYouHear?.includes('hospital') || false} onChange={(e) => handleCheckboxChange('howDidYouHear', 'hospital', e.target.checked)} />} label="病院・クリニック" />
              <FormControlLabel control={<Checkbox checked={formData.howDidYouHear?.includes('helloWork') || false} onChange={(e) => handleCheckboxChange('howDidYouHear', 'helloWork', e.target.checked)} />} label="ハローワーク" />
              <FormControlLabel control={<Checkbox checked={formData.howDidYouHear?.includes('litalico') || false} onChange={(e) => handleCheckboxChange('howDidYouHear', 'litalico', e.target.checked)} />} label="LITALICO仕事ナビ" />
              <FormControlLabel control={<Checkbox checked={formData.howDidYouHear?.includes('other') || false} onChange={(e) => handleCheckboxChange('howDidYouHear', 'other', e.target.checked)} />} label="その他" />
            </Stack>
          </FormGroup>
          {/* ▼▼▼ 詳細入力欄もフラットなキーで管理 ▼▼▼ */}
          {formData.howDidYouHear?.includes('other') &&
            <TextField
              size="small"
              label="その他（具体的に）"
              name="howDidYouHear_detail" // ★★★ name属性をフラットに！ ★★★
              value={formData.howDidYouHear_detail || ''}
              onChange={handleChange} // ★★★ 親のhandleChangeを使う！ ★★★
              sx={{ mt: 1 }}
            />
          }
        </FormControl>
        
        {/* --- 2. 現在の活動状況 --- */}
        <FormControl component="fieldset" fullWidth>
          <FormLabel component="legend">現在の活動状況を教えてください</FormLabel>
          <RadioGroup 
            name="currentSituation" 
            value={formData.currentSituation || ''} 
            onChange={handleChange}
            sx={{ mt: 1 }}
          >
            <FormControlLabel value="none" control={<Radio />} label="特になし" />
            <FormControlLabel value="working" control={<Radio />} label="在職中である" />
            <FormControlLabel value="welfareService" control={<Radio />} label="福祉サービス利用中" />
            <FormControlLabel value="inSchool" control={<Radio />} label="在学中である" />
            {formData.currentSituation === 'inSchool' && 
              <TextField size="small" label="学校名" name="schoolName" value={formData.schoolName || ''} onChange={handleChange} sx={{ mt: 1, mb: 1, ml: 4 }} />
            }
            <FormControlLabel value="visitingHospital" control={<Radio />} label="通院中" />
            {/* ▼▼▼ 病院名もフラットなキーで管理 ▼▼▼ */}
            {formData.currentSituation === 'visitingHospital' && 
              <TextField 
                size="small" 
                label="病院名" 
                name="primaryClinic_name" // ★★★ name属性をフラットに！ ★★★
                value={formData.primaryClinic_name || ''} 
                onChange={handleChange}  // ★★★ 親のhandleChangeを使う！ ★★★
                sx={{ mt: 1, mb: 1, ml: 4 }} 
              />
            }
            <FormControlLabel value="onLeave" control={<Radio />} label="休職中である" />
            <FormControlLabel value="usingHelloWork" control={<Radio />} label="ハローワークに通っている" />
            <FormControlLabel value="partTime" control={<Radio />} label="アルバイト" />
            <FormControlLabel value="other" control={<Radio />} label="その他" />
          </RadioGroup>
        </FormControl>

        {/* --- 3. 今後の希望 (変更なし) --- */}
        <FormControl component="fieldset" fullWidth>
          {/* ... (ここのセクションは元々フラットなので変更なし) ... */}
        </FormControl>
        
        {/* --- 4. 今後取り組みたいこと --- */}
        <FormControl component="fieldset">
          <FormLabel component="legend">今後取り組みたいと考えていることがあれば教えて下さい（複数選択可）</FormLabel>
          <FormGroup sx={{ mt: 1 }}>
            <Stack direction="row" flexWrap="wrap">
              {/* ▼▼▼ 汎用ハンドラを使うように修正 ▼▼▼ */}
              <FormControlLabel control={<Checkbox checked={formData.futureActions?.includes('apply') || false} onChange={(e) => handleCheckboxChange('futureActions', 'apply', e.target.checked)} />} label="求人への応募" />
              <FormControlLabel control={<Checkbox checked={formData.futureActions?.includes('research') || false} onChange={(e) => handleCheckboxChange('futureActions', 'research', e.target.checked)} />} label="企業研究" />
              <FormControlLabel control={<Checkbox checked={formData.futureActions?.includes('resume') || false} onChange={(e) => handleCheckboxChange('futureActions', 'resume', e.target.checked)} />} label="履歴書・職務経歴書の作成" />
              <FormControlLabel control={<Checkbox checked={formData.futureActions?.includes('training') || false} onChange={(e) => handleCheckboxChange('futureActions', 'training', e.target.checked)} />} label="委託訓練やスクール等でのスキルアップ" />
              <FormControlLabel control={<Checkbox checked={formData.futureActions?.includes('qualification') || false} onChange={(e) => handleCheckboxChange('futureActions', 'qualification', e.target.checked)} />} label="資格の取得" />
              <FormControlLabel control={<Checkbox checked={formData.futureActions?.includes('manner') || false} onChange={(e) => handleCheckboxChange('futureActions', 'manner', e.target.checked)} />} label="ビジネスマナーの向上" />
              <FormControlLabel control={<Checkbox checked={formData.futureActions?.includes('communication') || false} onChange={(e) => handleCheckboxChange('futureActions', 'communication', e.target.checked)} />} label="コミュニケーション力の向上" />
              <FormControlLabel control={<Checkbox checked={formData.futureActions?.includes('stamina') || false} onChange={(e) => handleCheckboxChange('futureActions', 'stamina', e.target.checked)} />} label="体力づくり" />
              <FormControlLabel control={<Checkbox checked={formData.futureActions?.includes('nothing') || false} onChange={(e) => handleCheckboxChange('futureActions', 'nothing', e.target.checked)} />} label="特にない・思いつかない" />
              <FormControlLabel control={<Checkbox checked={formData.futureActions?.includes('other') || false} onChange={(e) => handleCheckboxChange('futureActions', 'other', e.target.checked)} />} label="その他" />
            </Stack>
          </FormGroup>
           {/* ▼▼▼ 詳細入力欄もフラットなキーで管理 ▼▼▼ */}
          {formData.futureActions?.includes('other') &&
            <TextField
              size="small"
              label="その他（具体的に）"
              name="futureActions_detail" // ★★★ name属性をフラットに！ ★★★
              value={formData.futureActions_detail || ''}
              onChange={handleChange} // ★★★ 親のhandleChangeを使う！ ★★★
              sx={{ mt: 1, maxWidth: 400 }}
            />
          }
        </FormControl>

        {/* --- 5. 交通機関 (変更なし、ただしhandleSurveySubmitとキーを合わせる) --- */}
        <FormControl component="fieldset">
          <FormLabel component="legend">交通機関について</FormLabel>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 1 }}>
            {/* ★★★ handleSurveySubmitのキー名に合わせて修正 ★★★ */}
            <TextField fullWidth label="最寄り駅" name="commuteRoute1_from" value={formData.commuteRoute1_from || ''} onChange={handleChange} />
            <TextField fullWidth label="利用路線" name="commuteRoute1_line" value={formData.commuteRoute1_line || ''} onChange={handleChange} />
            <TextField fullWidth label="片道運賃（円）" name="commuteTotalFare" type="number" value={formData.commuteTotalFare || ''} onChange={handleChange} />
          </Stack>
        </FormControl>
                {/* --- 6. 同行者 --- */}
        <FormControl component="fieldset" fullWidth>
          <FormLabel component="legend">本日の同行者について</FormLabel>
          <Select
            name="companionType"
            value={formData.companionType || ''}
            onChange={handleChange}
            sx={{ mt: 1, minWidth: 200 }}
          >
            <MenuItem value="self">本人のみ</MenuItem>
            <MenuItem value="family">ご家族</MenuItem>
            <MenuItem value="agency">支援機関</MenuItem>
            <MenuItem value="other">その他</MenuItem>
          </Select>
          {formData.companionType === 'agency' && (
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 2 }}>
              <TextField fullWidth label="支援機関名" name="companionAgencyName" value={formData.companionAgencyName || ''} onChange={handleChange} />
              <TextField fullWidth label="担当者名" name="companionStaffName" value={formData.companionStaffName || ''} onChange={handleChange} />
            </Stack>
          )}
        </FormControl>
        <FormControl component="fieldset">
          {/* ... (ここのセクションは元々フラットなので変更なし) ... */}
        </FormControl>

      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
        <Button onClick={prevStep}>
          ステップ2へ戻る
        </Button>
        <Button variant="contained" onClick={nextStep}>
          確認画面へ進む
        </Button>
      </Box>
    </>
  );
};

export default Step3_BackgroundAndIntent;