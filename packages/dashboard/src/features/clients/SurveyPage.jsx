import React, { useState, useEffect } from 'react';
import { Box, Paper, Stepper, Step, StepLabel, Container, Button, Typography } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from "../../firebase";
import Step1_BasicInfo from './components/surveySections/Step1_BasicInfo';
import Step2_CommuteInfo from './components/surveySections/Step2_CommuteInfo';
import Step3_ContactsAndWelfare from './components/surveySections/Step3_ContactsAndWelfare';
import Step4_FamilyAndFinance from './components/surveySections/Step4_FamilyAndFinance';
import Step5_DisabilityInfo from './components/surveySections/Step5_DisabilityInfo';
import Step4_History from './components/surveySections/Step4_History';        // → 画面上は Step 6
import Step5_Preferences from './components/surveySections/Step5_Preferences'; // → 画面上は Step 7
import Step6_MentalStatus from './components/surveySections/Step6_MentalStatus'; // → 画面上は Step 8
import Step7_Behavioral from './components/surveySections/Step7_Behavioral';    // → 画面上は Step 9
import Step8_Confirmation from './components/surveySections/Step8_Confirmation'; // → 画面上は Step 10

const steps = [
  '基本情報',        // 0
  '通所経路',        // 1
  '連絡先・福祉',    // 2
  '家族・経済',      // 3 ★新規
  '障害・手帳',      // 4 ★新規
  '履歴・就労',      // 5
  '意向・好み',      // 6
  '精神・医療',      // 7
  '行動面',          // 8
  '確認'             // 9
];

export default function SurveyPage() {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    const fetchClientData = async () => {
      if (!clientId) return;
      try {
        const docRef = doc(db, 'clients', clientId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          const convertedData = { ...data };
          if (data.birthDate?.toDate) convertedData.birthDate = data.birthDate.toDate();
          setFormData(convertedData);
        }
      } catch (error) {
        console.error("Error fetching client data:", error);
        alert("データの取得に失敗しました");
      } finally {
        setLoading(false);
      }
    };
    fetchClientData();
  }, [clientId]);


  const handleNext = () => {
    setActiveStep((prev) => prev + 1);
    window.scrollTo(0, 0);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
    window.scrollTo(0, 0);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const updateFormData = (newData) => {
    setFormData(prev => ({ ...prev, ...newData }));
  }

  const handleSubmit = async () => {
    if (!clientId) return;
    try {
      const docRef = doc(db, 'clients', clientId);
      await updateDoc(docRef, {
        ...formData,
        updatedAt: serverTimestamp(),
        surveyStatus: 'completed'
      });
      alert('アンケートを保存しました！');
      navigate(`/clients/${clientId}`);
    } catch (error) {
      console.error("Error updating document:", error);
      alert("保存に失敗しました。");
    }
  };

  if (loading) return <Typography>Loading...</Typography>;

  const getStepContent = (step) => {
    const commonProps = {
      formData,
      setFormData: updateFormData,
      handleChange,
      handleDateChange,
      nextStep: handleNext,
      prevStep: handleBack
    };

    switch (step) {
      case 0: return <Step1_BasicInfo {...commonProps} nextStep={handleNext} />;
      case 1: return <Step2_CommuteInfo {...commonProps} />;
      case 2: return <Step3_ContactsAndWelfare {...commonProps} />;
      case 3: return <Step4_FamilyAndFinance {...commonProps} />;   // ★新規
      case 4: return <Step5_DisabilityInfo {...commonProps} />;     // ★新規
      case 5: return <Step4_History {...commonProps} />;
      case 6: return <Step5_Preferences {...commonProps} />;
      case 7: return <Step6_MentalStatus {...commonProps} />;
      case 8: return <Step7_Behavioral {...commonProps} handleSubmit={handleNext} />;
      case 9: return <Step8_Confirmation formData={formData} prevStep={handleBack} submitSurvey={handleSubmit} />;
      default: return 'Unknown step';
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" align="center" gutterBottom sx={{ mb: 4, fontWeight: 'bold' }}>
          ご利用者様 アンケート
        </Typography>

        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Box>
          {getStepContent(activeStep)}
        </Box>
      </Paper>
    </Container>
  );
}