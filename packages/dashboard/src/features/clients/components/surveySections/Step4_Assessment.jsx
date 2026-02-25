import React from 'react';
import { Stack, Box, Typography, TextField, Button, FormControl, FormLabel, RadioGroup, FormControlLabel, Radio, Grid, Paper } from '@mui/material';

const Step4_Assessment = ({ formData, setFormData, handleChange, nextStep, prevStep }) => {

    const lifeSkills = [
        { key: 'meal', label: '食事' },
        { key: 'bath', label: '入浴' },
        { key: 'excretion', label: '排泄' },
        { key: 'changing', label: '着替え' },
        { key: 'goingOut', label: '外出' },
        { key: 'money', label: '金銭管理' },
        { key: 'meds', label: '服薬管理' },
        { key: 'communication', label: 'コミュニケーション' },
    ];

    const handleSkillChange = (key, value) => {
        setFormData(prev => ({ ...prev, [`assessment_skill_${key}`]: value }));
    };

    return (
        <>
            <Typography variant="h5" component="h2" gutterBottom>
                ステップ4：詳細アセスメント
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                現在の生活状況や、健康状態・特性について詳しく教えてください。
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>

                {/* --- 1. 日常生活能力 --- */}
                <Box>
                    <Typography variant="h6" sx={{ mb: 2, borderBottom: '1px solid #ddd', pb: 1 }}>
                        1. 現在の生活状況（日常生活能力）
                    </Typography>
                    {lifeSkills.map((skill) => (
                        <Paper key={skill.key} variant="outlined" sx={{ p: 2, mb: 2 }}>
                            <Grid container spacing={2} alignItems="center">
                                <Grid item xs={12} sm={3}>
                                    <Typography variant="subtitle1" fontWeight="bold">{skill.label}</Typography>
                                </Grid>
                                <Grid item xs={12} sm={9}>
                                    <FormControl component="fieldset">
                                        <RadioGroup
                                            row
                                            name={`assessment_skill_${skill.key}`}
                                            value={formData[`assessment_skill_${skill.key}`] || ''}
                                            onChange={(e) => handleSkillChange(skill.key, e.target.value)}
                                        >
                                            <FormControlLabel value="independent" control={<Radio size="small" />} label="自立" />
                                            <FormControlLabel value="partial" control={<Radio size="small" />} label="一部介助/見守り" />
                                            <FormControlLabel value="full" control={<Radio size="small" />} label="全介助" />
                                        </RadioGroup>
                                    </FormControl>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        label="特記事項（困りごとや工夫している点など）"
                                        name={`assessment_note_${skill.key}`}
                                        value={formData[`assessment_note_${skill.key}`] || ''}
                                        onChange={handleChange}
                                        sx={{ mt: 1 }}
                                    />
                                </Grid>
                            </Grid>
                        </Paper>
                    ))}
                </Box>

                {/* --- 2. 健康・医療・生活リズム --- */}
                <Box>
                    <Typography variant="h6" sx={{ mb: 2, borderBottom: '1px solid #ddd', pb: 1 }}>
                        2. 健康・生活リズム
                    </Typography>
                    <Grid container spacing={3}>
                        <Grid item xs={12} sm={6}>
                            <Typography variant="subtitle2" gutterBottom>睡眠</Typography>
                            <TextField
                                fullWidth
                                multiline
                                minRows={2}
                                label="睡眠状況（時間帯、熟睡感など）"
                                name="assessment_sleep"
                                value={formData.assessment_sleep || ''}
                                onChange={handleChange}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Typography variant="subtitle2" gutterBottom>食欲</Typography>
                            <TextField
                                fullWidth
                                multiline
                                minRows={2}
                                label="食欲・食事の状況"
                                name="assessment_appetite"
                                value={formData.assessment_appetite || ''}
                                onChange={handleChange}
                            />
                        </Grid>
                    </Grid>
                </Box>

                {/* --- 3. 対人関係・社会性 --- */}
                <Box>
                    <Typography variant="h6" sx={{ mb: 2, borderBottom: '1px solid #ddd', pb: 1 }}>
                        3. 対人関係・社会性
                    </Typography>
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="対人スキル・集団適応（人との関わり方、得意・不得意など）"
                                name="assessment_social"
                                value={formData.assessment_social || ''}
                                onChange={handleChange}
                                multiline
                                minRows={2}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="自発性（自分から行動・発信することについて）"
                                name="assessment_spontaneity"
                                value={formData.assessment_spontaneity || ''}
                                onChange={handleChange}
                                multiline
                                minRows={2}
                            />
                        </Grid>
                    </Grid>
                </Box>

                {/* --- 4. 行動面の課題（特性） --- */}
                <Box>
                    <Typography variant="h6" sx={{ mb: 2, borderBottom: '1px solid #ddd', pb: 1 }}>
                        4. 行動面の課題・特性
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'block', mb: 2 }}>
                        もし該当するものがあれば、具体的な状況や対応策をご記入ください。
                    </Typography>
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="こだわり・マイルールなど"
                                name="assessment_obsession"
                                value={formData.assessment_obsession || ''}
                                onChange={handleChange}
                                multiline
                                minRows={2}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="パニック・不安定になった時の様子"
                                name="assessment_panic"
                                value={formData.assessment_panic || ''}
                                onChange={handleChange}
                                multiline
                                minRows={2}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="その他（自傷・他害・飛び出し等、配慮が必要な点）"
                                name="assessment_other_issues"
                                value={formData.assessment_other_issues || ''}
                                onChange={handleChange}
                                multiline
                                minRows={2}
                            />
                        </Grid>
                    </Grid>
                </Box>

            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                <Button onClick={prevStep}>
                    ステップ3へ戻る
                </Button>
                <Button variant="contained" onClick={nextStep}>
                    確認画面へ
                </Button>
            </Box>
        </>
    );
};

export default Step4_Assessment;
