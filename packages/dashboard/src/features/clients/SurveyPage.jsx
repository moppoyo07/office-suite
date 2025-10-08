// SurveyPage.jsx

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase/index.js";
import { Container, Paper, Box, CircularProgress, Typography } from '@mui/material';

import Step1_BasicInfo from './components/surveySections/Step1_BasicInfo';
import Step2_WelfareInfo from "./components/surveySections/Step2_WelfareInfo";
import Step3_BackgroundAndIntent from "./components/surveySections/Step3_BackgroundAndIntent";
import Step4_Confirmation from './components/surveySections/Step4_Confirmation';
import Step5_Complete from './components/surveySections/Step5_Complete';

// 新しく作ったロジックをインポート
import { handleSurveySubmit } from './surveySubmitHandler';

function SurveyPage() {
  const { clientId } = useParams();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({});
  const [pageLoading, setPageLoading] = useState(true);
  const [formSubmitting, setFormSubmitting] = useState(false);

  useEffect(() => {
    const fetchClientData = async () => {
      if (!clientId) {
        setPageLoading(false);
        return;
      }
      try {
        const docRef = doc(db, "clients", clientId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          
          // ▼▼▼ ここを修正 ▼▼▼
          // 既存のアンケートデータ(surveyData)を優先し、なければDBのトップレベルのフィールドから初期値を設定
          // フィールド名を "name", "nameKana" に統一
          const initialFormData = data.surveyData || {
            name: data.name || '',
            nameKana: data.nameKana || '', // ★ "furigana" ではなく "nameKana" で初期化
            phone: data.phone || '',
            // アンケートを開いた時にDBの値を引き継ぎたい項目があれば、ここに追加していく
            // 例: email: data.email || ''
          };
          setFormData(initialFormData);
          // ▲▲▲ ▲▲▲

        } else {
          console.warn(`clientId: ${clientId} のドキュメントが見つかりません。`);
        }
      } catch (error) {
        console.error("データ取得エラー:", error);
      } finally {
        setPageLoading(false);
      }
    };
    fetchClientData();
  }, [clientId]);
  
  
  const nextStep = () => {
  console.log(`Step ${step} -> ${step + 1} に進む直前のformData:`, formData);
  setStep(prev => prev + 1);
};
  const prevStep = () => setStep(prev => prev - 1);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleDateChange = (name, newValue) => {
    setFormData(prev => ({ ...prev, [name]: newValue }));
  };

  const handleSubmit = async () => {
    setFormSubmitting(true);
    try {
      // 複雑なロジックは別のファイルに任せる
      await handleSurveySubmit(clientId, formData);
      setStep(5); // 成功したら完了画面へ
    } catch (error) {
      console.error("送信エラー:", error);
      alert('送信に失敗しました。お手数ですが、もう一度お試しください。');
    } finally {
      setFormSubmitting(false);
    }
  };

  if (pageLoading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
  }

  const renderStep = () => {
    const props = { formData, setFormData, handleChange, handleDateChange };
    switch (step) {
      case 1:
        return <Step1_BasicInfo {...props} nextStep={nextStep} />;
      case 2:
        return <Step2_WelfareInfo {...props} nextStep={nextStep} prevStep={prevStep} />;
      case 3:
        return <Step3_BackgroundAndIntent {...props} nextStep={nextStep} prevStep={prevStep} />;
      case 4:
        return <Step4_Confirmation {...props} prevStep={prevStep} handleSubmit={handleSubmit} setStep={setStep} isSubmitting={formSubmitting} />;
      case 5:
        return <Step5_Complete />;
      default:
        return <Typography>アンケートが完了しました。</Typography>;
    }
  };

  return (
    <Container component="main" maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: { xs: 2, sm: 4 } }}>
        {renderStep()}
      </Paper>
    </Container>
  );
}

export default SurveyPage;