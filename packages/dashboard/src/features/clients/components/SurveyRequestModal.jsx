import React from 'react';
import { Modal, Box, Typography, Button, Stack } from '@mui/material';
import { QRCodeCanvas } from 'qrcode.react'; 

// モーダルのスタイル（コンポーネントの外で定義）
const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 600,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
};

const SurveyRequestModal = ({ open, onClose, surveyUrl }) => {
  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="survey-modal-title"
      aria-describedby="survey-modal-description"
    >
      <Box sx={modalStyle}>
        <Typography id="survey-modal-title" variant="h6" component="h2">
          見学者様へのアンケートご協力依頼
        </Typography>
        <Typography id="survey-modal-description" sx={{ mt: 2 }}>
          以下のいずれかの方法でアンケートにご回答ください。
        </Typography>
        
        <Stack direction="row" spacing={4} sx={{ mt: 4, alignItems: 'center' }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="subtitle1">スマートフォンで回答</Typography>
            <Box sx={{ mt: 1, p: 1, border: '1px solid #ddd', borderRadius: 1 }}>
              <QRCodeCanvas value={surveyUrl} size={180} />
            </Box>
          </Box>

          <Box>
            <Typography variant="subtitle1">このPCで回答</Typography>
            <Button 
              variant="contained" 
              onClick={() => window.open(surveyUrl, '_blank')}
              sx={{ mt: 1 }}
            >
              入力画面を開く
            </Button>
          </Box>
        </Stack>
      </Box>
    </Modal>
  );
};

export default SurveyRequestModal;