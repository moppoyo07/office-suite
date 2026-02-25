import React from 'react';
import { Stack, Box, Typography, TextField, Button, Grid, FormControl, FormLabel, Checkbox, FormControlLabel, RadioGroup, Radio } from '@mui/material';

const Step7_Behavioral = ({ formData, setFormData, handleChange, nextStep, prevStep, handleSubmit }) => {

    const behaviors = [
        { id: 'panic', label: 'パニック' },
        { id: 'obsession', label: 'こだわり' },
        { id: 'compulsion', label: '強迫行為・強迫観念' },
        { id: 'hallucination', label: '幻覚・妄想' },
        { id: 'seizure', label: '発作' },
        { id: 'other', label: 'その他' },
    ];

    return (
        <Box>
            <Typography variant="h5" component="h2" gutterBottom>
                ステップ7：行動面のアセスメント
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                日常生活や対人関係における行動面の特徴や対処法について教えてください。（アセスメントシート 精神・裏面）
            </Typography>

            <Stack spacing={4}>

                {/* 服薬管理 */}
                <Box sx={{ border: 1, borderColor: 'divider', p: 2, borderRadius: 1 }}>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>服薬管理</Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <FormControl component="fieldset">
                                <FormLabel component="legend">服薬の有無</FormLabel>
                                <RadioGroup row name="medication_status" value={formData.medication_status || ''} onChange={handleChange}>
                                    <FormControlLabel value="none" control={<Radio size="small" />} label="薬はない" />
                                    <FormControlLabel value="yes" control={<Radio size="small" />} label="服薬がある" />
                                </RadioGroup>
                            </FormControl>
                            {formData.medication_status === 'yes' && (
                                <Box sx={{ ml: 2, mt: 1 }}>
                                    <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                                        <Typography variant="body2">一日</Typography>
                                        <TextField size="small" sx={{ width: 60 }} name="medication_times" value={formData.medication_times || ''} onChange={handleChange} />
                                        <Typography variant="body2">回</Typography>
                                    </Stack>
                                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                        {['朝', '昼', '夕', '晩', '就寝前', '頓服(痛み止め等)'].map(timing => (
                                            <FormControlLabel
                                                key={timing}
                                                control={<Checkbox checked={formData.medication_timing?.includes(timing)} onChange={(e) => {
                                                    const current = formData.medication_timing || [];
                                                    const newValue = e.target.checked ? [...current, timing] : current.filter(x => x !== timing);
                                                    handleChange({ target: { name: 'medication_timing', value: newValue } });
                                                }} />}
                                                label={timing}
                                            />
                                        ))}
                                    </Box>
                                </Box>
                            )}
                        </Grid>

                        <Grid item xs={12}>
                            <FormControl component="fieldset">
                                <FormLabel component="legend">副作用</FormLabel>
                                <RadioGroup row name="side_effects" value={formData.side_effects || ''} onChange={handleChange}>
                                    <FormControlLabel value="none" control={<Radio size="small" />} label="ない" />
                                    <FormControlLabel value="yes" control={<Radio size="small" />} label="ある" />
                                </RadioGroup>
                            </FormControl>
                            {formData.side_effects === 'yes' && (
                                <TextField fullWidth size="small" placeholder="内容" name="side_effects_detail" value={formData.side_effects_detail || ''} onChange={handleChange} sx={{ mt: 1 }} />
                            )}
                        </Grid>

                        <Grid item xs={12}>
                            <FormControl component="fieldset">
                                <FormLabel component="legend">管理方法</FormLabel>
                                <RadioGroup row name="medication_management" value={formData.medication_management || ''} onChange={handleChange}>
                                    <FormControlLabel value="self" control={<Radio size="small" />} label="自己管理" />
                                    <FormControlLabel value="family" control={<Radio size="small" />} label="家族管理" />
                                </RadioGroup>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12}>
                            <FormControl component="fieldset">
                                <FormLabel component="legend">服薬状況</FormLabel>
                                <RadioGroup row name="medication_adherence" value={formData.medication_adherence || ''} onChange={handleChange}>
                                    <FormControlLabel value="good" control={<Radio size="small" />} label="飲み忘れがない" />
                                    <FormControlLabel value="poor" control={<Radio size="small" />} label="飲み忘れがある" />
                                    <FormControlLabel value="adjusting" control={<Radio size="small" />} label="服薬調整中である" />
                                    <FormControlLabel value="other" control={<Radio size="small" />} label="その他" />
                                </RadioGroup>
                            </FormControl>
                        </Grid>
                    </Grid>
                </Box>

                {/* 行動について */}
                <Box>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>行動について</Typography>
                    <Box sx={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                            <thead>
                                <tr>
                                    <th style={{ border: '1px solid #888', padding: '8px', width: '15%', backgroundColor: 'rgba(0,0,0,0.08)', color: 'inherit' }}>項目</th>
                                    <th style={{ border: '1px solid #888', padding: '8px', width: '25%', backgroundColor: 'rgba(0,0,0,0.08)', color: 'inherit' }}>チェック</th>
                                    <th style={{ border: '1px solid #888', padding: '8px', width: '30%', backgroundColor: 'rgba(0,0,0,0.08)', color: 'inherit' }}>本人コメント（自分の対処法）</th>
                                    <th style={{ border: '1px solid #888', padding: '8px', width: '30%', backgroundColor: 'rgba(0,0,0,0.08)', color: 'inherit' }}>支援者追記（周りの対処法）</th>
                                </tr>
                            </thead>
                            <tbody>
                                {behaviors.map((item) => (
                                    <tr key={item.id}>
                                        <td style={{ border: '1px solid #ddd', padding: '8px', fontWeight: 'bold' }}>{item.label}</td>
                                        <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                                            <FormControl component="fieldset">
                                                <RadioGroup name={`behavior_${item.id}_check`} value={formData[`behavior_${item.id}_check`] || 'none'} onChange={handleChange}>
                                                    <FormControlLabel value="none" control={<Radio size="small" />} label="特にない" />
                                                    <FormControlLabel value="yes" control={<Radio size="small" />} label="ある" />
                                                </RadioGroup>
                                            </FormControl>
                                            {formData[`behavior_${item.id}_check`] === 'yes' && (
                                                <Box sx={{ pl: 2 }}>
                                                    <FormControlLabel
                                                        control={<Checkbox size="small" checked={formData[`behavior_${item.id}_coping_self`] || false} onChange={(e) => handleChange({ target: { name: `behavior_${item.id}_coping_self`, value: e.target.checked } })} />}
                                                        label="自分の対処法がある"
                                                        sx={{ display: 'block' }}
                                                    />
                                                    <FormControlLabel
                                                        control={<Checkbox size="small" checked={formData[`behavior_${item.id}_coping_others`] || false} onChange={(e) => handleChange({ target: { name: `behavior_${item.id}_coping_others`, value: e.target.checked } })} />}
                                                        label="周りの対処方法がある"
                                                        sx={{ display: 'block' }}
                                                    />
                                                    <FormControlLabel
                                                        control={<Checkbox size="small" checked={formData[`behavior_${item.id}_no_coping`] || false} onChange={(e) => handleChange({ target: { name: `behavior_${item.id}_no_coping`, value: e.target.checked } })} />}
                                                        label="対処方法がない"
                                                        sx={{ display: 'block' }}
                                                    />
                                                    <FormControlLabel
                                                        control={<Checkbox size="small" checked={formData[`behavior_${item.id}_unknown`] || false} onChange={(e) => handleChange({ target: { name: `behavior_${item.id}_unknown`, value: e.target.checked } })} />}
                                                        label="わからない"
                                                    />
                                                </Box>
                                            )}
                                        </td>
                                        <td style={{ border: '1px solid #ddd', padding: '8px', verticalAlign: 'top' }}>
                                            <TextField fullWidth multiline minRows={3} size="small" name={`behavior_${item.id}_comment_self`} value={formData[`behavior_${item.id}_comment_self`] || ''} onChange={handleChange} placeholder="自分の対処法など" />
                                        </td>
                                        <td style={{ border: '1px solid #ddd', padding: '8px', verticalAlign: 'top' }}>
                                            <TextField fullWidth multiline minRows={3} size="small" name={`behavior_${item.id}_comment_others`} value={formData[`behavior_${item.id}_comment_others`] || ''} onChange={handleChange} placeholder="周りの対処法など" />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </Box>
                </Box>

                <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>特記事項・その他具体的な行動があれば教えてください</Typography>
                    <TextField fullWidth multiline minRows={3} name="behavior_notes" value={formData.behavior_notes || ''} onChange={handleChange} />
                </Box>

            </Stack>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                <Button onClick={prevStep}>
                    前へ戻る
                </Button>
                <Button variant="contained" color="primary" onClick={handleSubmit}>
                    完了（確認画面へ）
                </Button>
            </Box>
        </Box>
    );
};

export default Step7_Behavioral;
