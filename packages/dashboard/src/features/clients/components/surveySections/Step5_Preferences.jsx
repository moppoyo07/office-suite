import React from 'react';
import { Stack, Box, Typography, TextField, Button } from '@mui/material';

const Step5_Preferences = ({ formData, setFormData, handleChange, nextStep, prevStep }) => {

    return (
        <Box>
            <Typography variant="h5" component="h2" gutterBottom>
                ステップ5：アセスメント（意向・好み）
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                ご本人の意向や好みについて教えてください。（アセスメントシート 様式2）
            </Typography>

            <Stack spacing={4}>

                <Box>
                    <Typography variant="subtitle1" fontWeight="bold">好きなこと（もの）</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>や得意なこと</Typography>
                    <TextField
                        fullWidth
                        multiline
                        minRows={3}
                        name="likes"
                        value={formData.likes || ''}
                        onChange={handleChange}
                    />
                </Box>

                <Box>
                    <Typography variant="subtitle1" fontWeight="bold">嫌いなこと（もの）</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>や苦手なこと</Typography>
                    <TextField
                        fullWidth
                        multiline
                        minRows={3}
                        name="dislikes"
                        value={formData.dislikes || ''}
                        onChange={handleChange}
                    />
                </Box>

                <Box>
                    <Typography variant="subtitle1" fontWeight="bold">希望する暮らし</Typography>
                    <TextField
                        fullWidth
                        multiline
                        minRows={3}
                        name="desired_lifestyle"
                        value={formData.desired_lifestyle || ''}
                        onChange={handleChange}
                    />
                </Box>

                <Box>
                    <Typography variant="subtitle1" fontWeight="bold">特に支援してほしいこと</Typography>
                    <TextField
                        fullWidth
                        multiline
                        minRows={3}
                        name="support_requests"
                        value={formData.support_requests || ''}
                        onChange={handleChange}
                    />
                </Box>

                <Box>
                    <Typography variant="subtitle1" fontWeight="bold">支援をする時に気をつけてほしいこと</Typography>
                    <TextField
                        fullWidth
                        multiline
                        minRows={3}
                        name="support_precautions"
                        value={formData.support_precautions || ''}
                        onChange={handleChange}
                    />
                </Box>

                <Box>
                    <Typography variant="subtitle1" fontWeight="bold">将来の夢や希望</Typography>
                    <TextField
                        fullWidth
                        multiline
                        minRows={3}
                        name="future_dreams"
                        value={formData.future_dreams || ''}
                        onChange={handleChange}
                    />
                </Box>

                <Box>
                    <Typography variant="subtitle1" fontWeight="bold">その他</Typography>
                    <TextField
                        fullWidth
                        multiline
                        minRows={2}
                        name="preferences_other"
                        value={formData.preferences_other || ''}
                        onChange={handleChange}
                    />
                </Box>

            </Stack>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                <Button onClick={prevStep}>
                    前へ戻る
                </Button>
                <Button variant="contained" onClick={nextStep}>
                    次へ進む
                </Button>
            </Box>
        </Box>
    );
};

export default Step5_Preferences;
