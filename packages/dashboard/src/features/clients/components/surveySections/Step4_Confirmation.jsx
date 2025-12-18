// Step4_Confirmation.jsx (CSSプロパティ名修正済み)

import React from 'react';
import { Box, Button, Typography, Paper, Divider, CircularProgress, GlobalStyles } from '@mui/material';

// レイアウトを見やすい縦一列に戻し、印刷用にスタイルを微調整
const InfoRow = ({ label, value }) => (
  <Box sx={{
    display: 'flex',
    py: 1,
    borderBottom: '1px solid #eee',
    '@media print': {
      py: 0.3,
      borderBottom: '1px solid #ccc',
    }
  }}>
    <Typography variant="body2" color="text.secondary" sx={{
      width: '150px',
      flexShrink: 0,
      '@media print': {
        color: '#000 !important',
        fontSize: '9pt',
      }
    }}>
      {label}
    </Typography>
    <Typography variant="body1" sx={{
      fontWeight: 'medium',
      whiteSpace: 'pre-wrap',
      '@media print': {
        fontSize: '10pt',
      }
    }}>
      {value || '未入力'}
    </Typography>
  </Box>
);

const Step4_Confirmation = ({ formData, prevStep, handleSubmit, setStep, isSubmitting }) => {
  
  const handlePrint = () => {
    const originalTitle = document.title;
    document.title = formData.fullName ? `${formData.fullName}様_見学アンケート` : '見学アンケート';
    window.print();
    setTimeout(() => { document.title = originalTitle; }, 500);
  };

  // 表示用のデータ変換ヘルパー
  const calculateAge = (d) => d ? `${new Date().getFullYear() - new Date(d).getFullYear()}歳` : '';
  const formatDate = (d) => d ? new Date(d).toLocaleDateString('ja-JP') : '';
  const genderMap = { male: '男性', female: '女性', other: 'その他' };
  const handbookStatusMap = { owned: '有り', none: '無し', pending: '取得予定' };
  const handbookTypeMap = { mental: '精神', intellectual: '知的', physical: '身体' };
  const selfSupportMedicalMap = { true: '利用あり', false: '利用なし' };

  const currentSituationMap = {
    none: '特になし',
    working: '在職中である',
    welfareService: '福祉サービス利用中',
    inSchool: `在学中である (${formData.schoolName || '未入力'})`,
    visitingHospital: `通院中 (${formData.primaryClinic_name || '未入力'})`,
    onLeave: '休職中である',
    usingHelloWork: 'ハローワークに通っている',
    partTime: 'アルバイト',
    other: 'その他',
  };
  
  const jobDisclosureMap = { open: '障害開示', closed: '障害非開示' };
  
  const howDidYouHearMap = {
    homepage: 'ホームページ', flyer: 'チラシ・ポスター', hospital: '病院・クリニック',
    helloWork: 'ハローワーク', litalico: 'LITALICO仕事ナビ',
    other: `その他 (${formData.howDidYouHear_detail || '未入力'})`
  };

  const futureActionsMap = {
    apply: '求人への応募', research: '企業研究', resume: '履歴書・職務経歴書の作成',
    training: '委託訓練やスクール等でのスキルアップ', qualification: '資格の取得', manner: 'ビジネスマナーの向上',
    communication: 'コミュニケーション力の向上', stamina: '体力づくり', nothing: '特にない・思いつかない',
    other: `その他 (${formData.futureActions_detail || '未入力'})`,
  };

  const selectedSources = (formData.howDidYouHear || []).map(key => howDidYouHearMap[key] || key).join('、');
  
  const selectedFutureActions = (formData.futureActions || []).map(key => futureActionsMap[key] || key).join('、');
  
  const formatHandbookClasses = (data) => {
    const types = ['mental', 'intellectual', 'physical'];
    const enabledTypes = types
      .filter(type => data[`${type}_enabled`] && data[`${type}_class`])
      .map(type => `${handbookTypeMap[type]}(${data[`${type}_class`]}級)`);
    return enabledTypes.join('、') || null;
  };


  return (
    <>
      <GlobalStyles styles={{
        '@media print': {
          '*, *::before, *::after': {
            background: 'transparent !important',
            color: '#000 !important',
            boxShadow: 'none !important',
            textShadow: 'none !important',
          },
          'body, #root': { margin: 0, padding: 0, background: 'white' },
          // ▼▼▼ 修正箇所: ケバブケースをキャメルケースに変更 ▼▼▼
          'body': { WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }
        }
      }} />
      <Typography variant="h5" sx={{ '@media print': { display: 'none' } }}>ステップ4：入力内容のご確認</Typography>
      
      <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, mt: 2, '@media print': { boxShadow: 'none', border: 'none', p: 2, mt: 0 } }}>
        <Typography variant="h6" align="center">見学時アンケート 回答内容</Typography>
        <Divider sx={{ my: 2, '@media print': { borderColor: '#ccc' } }} />

        {/* --- 基本情報セクション --- */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, '@media print': { display: 'none' } }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>基本情報</Typography>
            <Button size="small" onClick={() => setStep(1)}>修正する</Button>
          </Box>
          <InfoRow label="氏名" value={formData.name} />
          <InfoRow label="ふりがな" value={formData.nameKana} />
          <InfoRow label="生年月日" value={`${formatDate(formData.birthDate)} (${calculateAge(formData.birthDate)})`} />
          <InfoRow label="性別" value={genderMap[formData.gender]} />
          <InfoRow label="住所" value={`〒${formData.postalCode || ''} ${formData.address || ''}`} />
          <InfoRow label="電話番号" value={formData.phone} />
          <InfoRow label="メールアドレス" value={formData.email} />
        </Box>

        {/* --- 福祉情報セクション --- */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, '@media print': { display: 'none' } }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>福祉関連情報</Typography>
            <Button size="small" onClick={() => setStep(2)}>修正する</Button>
          </Box>
          <InfoRow label="手帳の状況" value={handbookStatusMap[formData.handbookStatus]} />
          <InfoRow label="手帳の種類・等級" value={formatHandbookClasses(formData)} />
          <InfoRow label="取得/予定年月" value={formatDate(formData.handbookStartDate)} />
          <InfoRow label="障害名(診断名)" value={formData.diagnosisName} />
          <InfoRow label="自立支援医療" value={selfSupportMedicalMap[formData.selfSupportMedical]} />
        </Box>

        {/* --- 背景・意向セクション --- */}
        <Box>
           <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, '@media print': { display: 'none' } }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>背景・ご意向</Typography>
            <Button size="small" onClick={() => setStep(3)}>修正する</Button>
          </Box>
           <InfoRow label="知った経緯" value={selectedSources} />
           <InfoRow label="現在の状況" value={currentSituationMap[formData.currentSituation]} />
           <InfoRow label="希望の仕事(開示)" value={jobDisclosureMap[formData.jobDisclosure]} />
           <InfoRow label="希望の仕事(時期)" value={formData.desiredTiming} />
           <InfoRow label="希望の仕事(職種)" value={formData.desiredJob} />
           <InfoRow label="今後取り組みたいこと" value={selectedFutureActions} />
           <InfoRow label="最寄り駅" value={formData.commuteRoute1_from} />
           <InfoRow label="利用路線" value={formData.commuteRoute1_line} />
           <InfoRow label="片道運賃" value={formData.commuteTotalFare ? `${formData.commuteTotalFare} 円` : ''} />
           <InfoRow label="同行者" value={formData.companionType} />
           {formData.companionType === 'agency' && 
             <>
               <InfoRow label="支援機関名" value={formData.companionAgencyName} />
               <InfoRow label="担当者名" value={formData.companionStaffName} />
             </>
           }
        </Box>
      </Paper>

      {/* --- 下部のボタンエリア --- */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4, '@media print': { display: 'none' } }}>
        <Button onClick={prevStep} disabled={isSubmitting}>ステップ3へ戻る</Button>
        <Box>
          <Button onClick={handlePrint} variant="outlined" sx={{ mr: 2 }} disabled={isSubmitting}>印刷する</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={isSubmitting}>{isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'この内容で送信する'}</Button>
        </Box>
      </Box>
    </>
  );
};

export default Step4_Confirmation;