import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const Step5_Complete = () => {
  return (
    <Box sx={{ textAlign: 'center', py: { xs: 4, sm: 8 } }}>
      <CheckCircleIcon color="success" sx={{ fontSize: { xs: 50, sm: 70 } }} />
      <Typography variant="h5" component="h2" sx={{ mt: 2, fontWeight: 'bold' }}>
        送信が完了しました
      </Typography>
      <Typography sx={{ mt: 1.5, mb: 4, color: 'text.secondary' }}>
        ご協力ありがとうございました。
      </Typography>
      <Button 
        variant="contained" 
        onClick={() => window.close()}
        size="large"
      >
        このページを閉じる
      </Button>
    </Box>
  );
};

export default Step5_Complete;