// packages/dashboard/src/features/clients/SurveyPage.jsx

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase/index.js";
import { Container, Paper, Box, CircularProgress, Typography } from '@mui/material';

// 各ステップのコンポーネント
import Step1_BasicInfo from './components/surveySections/Step1_BasicInfo';
import Step2_WelfareInfo from "./components/surveySections/Step2_WelfareInfo";
import Step3_BackgroundAndIntent from "./components/surveySections/Step3_BackgroundAndIntent";
import Step4_Confirmation from './components/surveySections/Step4_Confirmation';
import Step5_Complete from './components/surveySections/Step5_Complete';

// 保存用ハンドラー（修正済みのものをインポート）
import { handleSurveySubmit } from './surveySubmitHandler';

function SurveyPage() {
  const { clientId } = useParams();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({});
  const [pageLoading, setPageLoading] = useState(true);
  
  // 送信中かどうかのフラグ（Step4のボタン制御用）
  const [formSubmitting, setFormSubmitting] = useState(false);

  // 初期データ取得
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
          
          // 既存のアンケートデータがあればそれを優先、なければ基本情報から初期値をセット
          const initialFormData = data.surveyData || {
            name: data.name || '',
            nameKana: data.nameKana || '',
            phone: data.phone || '',
            email: data.email || '',
            address: data.address || '',
            // 必要に応じて他のフィールドも初期化
          };
          
          // FirestoreのTimestamp型で保存されていた場合、JSのDate型に戻す処理が必要ならここで行う
          // 今回はformDataにそのままセットし、各コンポーネント側で対応
          setFormData(initialFormData);

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
  
  // ステップ移動
  const nextStep = () => {
    window.scrollTo(0, 0); // ページ上部へスクロール
    setStep(prev => prev + 1);
  };
  
  const prevStep = () => {
    window.scrollTo(0, 0);
    setStep(prev => prev - 1);
  };

  // 入力変更ハンドラー
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // 日付変更ハンドラー (MUI DatePicker用)
  const handleDateChange = (name, newValue) => {
    setFormData(prev => ({ ...prev, [name]: newValue }));
  };

  // --- ★★★ 送信ハンドラー (ここが重要) ★★★ ---
  const handleSubmit = async () => {
    // 1. 送信中フラグをON (ボタンを無効化)
    setFormSubmitting(true);

    try {
      console.log("送信処理開始...", formData);

      // 2. clientIdがない場合のガード
      if (!clientId) {
        throw new Error("クライアントIDが見つかりません。URLを確認してください。");
      }

      // 3. 外部ファイル(surveySubmitHandler)に処理を委譲
      // ここでデータのサニタイズ(undefined除去など)が行われる
      await handleSurveySubmit(clientId, formData);

      console.log("送信完了！");
      
      // 4. 成功したら完了画面(Step5)へ移動
      setStep(5); 

    } catch (error) {
      console.error("送信エラー:", error);
      alert(`送信に失敗しました。\n${error.message}`);
    } finally {
      // 5. 処理が終わったらフラグを戻す
      setFormSubmitting(false);
    }
  };

  if (pageLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  // ステップごとの表示切り替え
  const renderStep = () => {
    const commonProps = { 
      formData, 
      setFormData, 
      handleChange, 
      handleDateChange 
    };

    switch (step) {
      case 1:
        return <Step1_BasicInfo {...commonProps} nextStep={nextStep} />;
      case 2:
        return <Step2_WelfareInfo {...commonProps} nextStep={nextStep} prevStep={prevStep} />;
      case 3:
        return <Step3_BackgroundAndIntent {...commonProps} nextStep={nextStep} prevStep={prevStep} />;
      case 4:
        return (
          <Step4_Confirmation 
            {...commonProps} 
            prevStep={prevStep} 
            handleSubmit={handleSubmit} // ← 修正済みの関数を渡す
            setStep={setStep} 
            isSubmitting={formSubmitting} // ← 送信中フラグを渡す
          />
        );
      case 5:
        return <Step5_Complete />;
      default:
        return <Typography>エラー: 不正なステップです。</Typography>;
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