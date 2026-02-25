// アセスメント入力ウィザード（1利用者1レコード・ロックなし）
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Paper, Stepper, Step, StepLabel, Button, Typography,
  CircularProgress, Stack
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import PrintIcon from '@mui/icons-material/Print';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

import { useAssessment } from './hooks/useAssessment.js';
import Step1_FaceSheet from './steps/Step1_FaceSheet.jsx';
import Step2_FaceSheetBack from './steps/Step2_FaceSheetBack.jsx';
import Step3_Assessment1 from './steps/Step3_Assessment1.jsx';
import Step4_Assessment2 from './steps/Step4_Assessment2.jsx';
import Step5_Mental from './steps/Step5_Mental.jsx';
import Step6_Behaviors from './steps/Step6_Behaviors.jsx';

const STEPS = [
  { label: 'フェイスシート（表）', key: 'faceSheet' },
  { label: 'フェイスシート（裏）', key: 'faceSheetBack' },
  { label: 'アセスメント1',       key: 'assessment1' },
  { label: 'アセスメント2',       key: 'assessment2' },
  { label: '精神・医療',          key: 'mentalAssessment' },
  { label: '行動について',        key: 'behaviors' },
];

const EMPTY_DATA = {
  faceSheet: {}, faceSheetBack: {}, assessment1: {},
  assessment2: {}, mentalAssessment: {}, behaviors: {},
};

export default function AssessmentWizard() {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const { assessment, loading, saveAll } = useAssessment(clientId);

  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState(EMPTY_DATA);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // 既存データをロード
  useEffect(() => {
    if (assessment?.data) {
      setFormData(assessment.data);
    }
  }, [assessment]);

  const handleSectionChange = (sectionKey, sectionData) => {
    setFormData(prev => ({ ...prev, [sectionKey]: sectionData }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveAll(formData);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  const currentKey = STEPS[activeStep].key;

  const renderStep = () => {
    const props = {
      data: formData[currentKey],
      onChange: (val) => handleSectionChange(currentKey, val),
    };
    switch (activeStep) {
      case 0: return <Step1_FaceSheet {...props} />;
      case 1: return <Step2_FaceSheetBack {...props} />;
      case 2: return <Step3_Assessment1 {...props} />;
      case 3: return <Step4_Assessment2 {...props} />;
      case 4: return <Step5_Mental {...props} />;
      case 5: return <Step6_Behaviors {...props} />;
      default: return null;
    }
  };

  return (
    <Box sx={{ p: 2, maxWidth: 900, mx: 'auto' }}>
      {/* ヘッダー */}
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(`/clients/${clientId}`)}
          variant="outlined"
          size="small"
        >
          戻る
        </Button>
        <Typography variant="h6" fontWeight="bold" sx={{ flexGrow: 1 }}>
          {assessment?.clientName} - フェイスシート・アセスメント
        </Typography>
        {assessment?.updatedAt?.toDate && (
          <Typography variant="body2" color="text.secondary">
            最終保存：{assessment.updatedAt.toDate().toLocaleDateString('ja-JP')}
          </Typography>
        )}
      </Stack>

      {/* ステッパー */}
      <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 3 }}>
        {STEPS.map(({ label }) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {/* フォーム本体 */}
      <Paper sx={{ p: 3, mb: 2 }}>
        {renderStep()}
      </Paper>

      {/* ナビゲーション */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
        <Button
          disabled={activeStep === 0}
          onClick={() => setActiveStep(p => p - 1)}
          variant="outlined"
        >
          前へ
        </Button>

        <Stack direction="row" spacing={1}>
          <Button
            startIcon={saving ? <CircularProgress size={16} /> : <SaveIcon />}
            onClick={handleSave}
            variant="outlined"
            color={saved ? 'success' : 'primary'}
            disabled={saving}
          >
            {saved ? '保存済み' : '保存'}
          </Button>
          <Button
            startIcon={<PrintIcon />}
            onClick={() => window.open(`/clients/${clientId}/assessment/print`, '_blank')}
            variant="outlined"
          >
            印刷プレビュー
          </Button>
        </Stack>

        <Button
          disabled={activeStep === STEPS.length - 1}
          onClick={() => setActiveStep(p => p + 1)}
          variant="contained"
        >
          次へ
        </Button>
      </Stack>
    </Box>
  );
}
