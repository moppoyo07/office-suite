import React from 'react';
import { Stack, Box, Typography, TextField, Button, Grid, FormControl, FormLabel, Checkbox, FormControlLabel, RadioGroup, Radio } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ja } from 'date-fns/locale';

const Step6_MentalStatus = ({ formData, setFormData, handleChange, handleDateChange, nextStep, prevStep }) => {

    // チェックボックス配列ヘルパー
    const handleCheckArray = (fieldName, value, checked) => {
        const current = formData[fieldName] || [];
        const newValue = checked ? [...current, value] : current.filter(x => x !== value);
        handleChange({ target: { name: fieldName, value: newValue } });
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ja}>
            <Box>
                <Typography variant="h5" component="h2" gutterBottom>
                    ステップ8：精神・医療情報
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    障害や疾患の状況、体調変化のサインについて教えてください。（アセスメントシート 精神）
                </Typography>

                <Stack spacing={4}>

                    {/* 基本情報 */}
                    <Box sx={{ border: 1, borderColor: 'divider', p: 2, borderRadius: 1 }}>
                        <Typography variant="subtitle2" gutterBottom>障害特性（症状）について</Typography>
                        <TextField fullWidth multiline minRows={2} name="disability_characteristics" value={formData.disability_characteristics || ''} onChange={handleChange} sx={{ mb: 2 }} />

                        <Grid container spacing={2} sx={{ mt: 1 }}>
                            <Grid item xs={12} sm={6}>
                                <TextField fullWidth size="small" label="発症時期" name="onset_date" value={formData.onset_date || ''} onChange={handleChange} placeholder="例: 20歳頃、2020年など" />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField fullWidth size="small" label="きっかけ" name="onset_trigger" value={formData.onset_trigger || ''} onChange={handleChange} />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField fullWidth size="small" label="初めて診断を受けた時期" name="diagnosis_date" value={formData.diagnosis_date || ''} onChange={handleChange} placeholder="例: 25歳頃、2022年など" />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Stack direction="row" spacing={2} alignItems="center">
                                    <Typography variant="body2">入院の有無:</Typography>
                                    <FormControlLabel control={<Checkbox checked={formData.hospitalization_history === 'yes'} onChange={(e) => handleChange({ target: { name: 'hospitalization_history', value: e.target.checked ? 'yes' : 'no' } })} />} label="あり" />
                                    <FormControlLabel control={<Checkbox checked={formData.hospitalization_history === 'no'} onChange={(e) => handleChange({ target: { name: 'hospitalization_history', value: e.target.checked ? 'no' : 'yes' } })} />} label="なし" />
                                </Stack>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField fullWidth size="small" label="現在: 通院先" name="current_hospital_name" value={formData.current_hospital_name || ''} onChange={handleChange} placeholder="病院名" />
                            </Grid>
                            <Grid item xs={12}>
                                <FormControl component="fieldset">
                                    <FormLabel component="legend">通院</FormLabel>
                                    <RadioGroup row name="current_hospital_status" value={formData.current_hospital_status || ''} onChange={handleChange}>
                                        <FormControlLabel value="してる" control={<Radio size="small" />} label="してる" />
                                        <FormControlLabel value="してない" control={<Radio size="small" />} label="してない" />
                                    </RadioGroup>
                                </FormControl>
                                {formData.current_hospital_status === 'してる' && (
                                    <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 1, ml: 2 }}>
                                        <Typography variant="body2">月</Typography>
                                        <TextField size="small" sx={{ width: 60 }} name="current_hospital_freq" value={formData.current_hospital_freq || ''} onChange={handleChange} />
                                        <Typography variant="body2">回</Typography>
                                        <Typography variant="body2" sx={{ ml: 2 }}>診療時間</Typography>
                                        <TextField size="small" sx={{ width: 80 }} name="current_hospital_duration" value={formData.current_hospital_duration || ''} onChange={handleChange} />
                                        <Typography variant="body2">分ぐらい</Typography>
                                    </Stack>
                                )}
                            </Grid>
                        </Grid>
                    </Box>

                    {/* 症状の把握 */}
                    <Box sx={{ border: 1, borderColor: 'divider', p: 2, borderRadius: 1 }}>
                        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>症状の把握</Typography>
                        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                            <FormControlLabel control={<Radio checked={formData.symptom_status === 'stable'} onChange={() => handleChange({ target: { name: 'symptom_status', value: 'stable' } })} />} label="安定している" />
                            <FormControlLabel control={<Radio checked={formData.symptom_status === 'active'} onChange={() => handleChange({ target: { name: 'symptom_status', value: 'active' } })} />} label="症状がある（どんな症状？）" />
                        </Stack>
                        {formData.symptom_status === 'active' && (
                            <TextField fullWidth size="small" name="symptom_detail" value={formData.symptom_detail || ''} onChange={handleChange} placeholder="症状の詳細" sx={{ mb: 2 }} />
                        )}

                        <Typography variant="subtitle2" sx={{ mt: 2 }}>体調がすぐれないときの症状（チェック）</Typography>
                        <Grid container spacing={1}>
                            {['幻聴', '妄想', '不眠', '食欲の増減', '気持ちの変調', '人と接するのが怖い', '落ち着きがなくなる', '表情がかわる', '外出するのがおっくうになる', 'イライラする', '独り言が多くなる', '頭痛', 'わからない', 'その他'].map(sym => (
                                <Grid item xs={6} sm={4} key={sym}>
                                    <FormControlLabel
                                        control={<Checkbox checked={formData.symptoms_checklist?.includes(sym)} onChange={(e) => handleCheckArray('symptoms_checklist', sym, e.target.checked)} />}
                                        label={sym}
                                    />
                                </Grid>
                            ))}
                        </Grid>
                    </Box>

                    {/* どんな時に症状がでますか */}
                    <Box sx={{ border: 1, borderColor: 'divider', p: 2, borderRadius: 1 }}>
                        <Typography variant="subtitle2" gutterBottom>どんな時に症状がでますか？</Typography>
                        <Box sx={{ display: 'flex', gap: 2, mb: 1, flexWrap: 'wrap' }}>
                            {['睡眠不足', '疲れ', '季節・天候', 'わからない'].map(trigger => (
                                <FormControlLabel key={trigger}
                                    control={<Checkbox checked={formData.symptom_triggers?.includes(trigger)} onChange={(e) => handleCheckArray('symptom_triggers', trigger, e.target.checked)} />}
                                    label={trigger}
                                />
                            ))}
                            <FormControlLabel
                                control={<Checkbox checked={formData.symptom_triggers?.includes('その他')} onChange={(e) => handleCheckArray('symptom_triggers', 'その他', e.target.checked)} />}
                                label="その他"
                            />
                        </Box>
                        {formData.symptom_triggers?.includes('その他') && (
                            <TextField fullWidth size="small" placeholder="その他の具体的な状況" name="symptom_trigger_other" value={formData.symptom_trigger_other || ''} onChange={handleChange} sx={{ ml: 4 }} />
                        )}
                    </Box>

                    {/* 体調不良時の対処法 */}
                    <Box sx={{ border: 1, borderColor: 'divider', p: 2, borderRadius: 1 }}>
                        <Typography variant="subtitle2" gutterBottom>体調不良時の対処法</Typography>
                        <Stack spacing={1.5}>
                            <FormControlLabel
                                control={<Checkbox checked={formData.coping_hospital || false} onChange={(e) => handleChange({ target: { name: 'coping_hospital', value: e.target.checked } })} />}
                                label="通院する"
                            />
                            <FormControlLabel
                                control={<Checkbox checked={formData.coping_medication || false} onChange={(e) => handleChange({ target: { name: 'coping_medication', value: e.target.checked } })} />}
                                label="服薬する"
                            />
                            <Stack direction="row" alignItems="center" spacing={2}>
                                <FormControlLabel
                                    control={<Checkbox checked={formData.coping_rest || false} onChange={(e) => handleChange({ target: { name: 'coping_rest', value: e.target.checked } })} />}
                                    label="休息をとる"
                                />
                                {formData.coping_rest && (
                                    <TextField size="small" label="時間" name="coping_rest_hours" value={formData.coping_rest_hours || ''} onChange={handleChange} placeholder="例: 1時間" sx={{ width: 140 }} />
                                )}
                            </Stack>
                            <FormControlLabel
                                control={<Checkbox checked={formData.coping_consult || false} onChange={(e) => handleChange({ target: { name: 'coping_consult', value: e.target.checked } })} />}
                                label="相談をする"
                            />
                            <Stack direction="row" alignItems="center" spacing={2}>
                                <FormControlLabel
                                    control={<Checkbox checked={formData.coping_other || false} onChange={(e) => handleChange({ target: { name: 'coping_other', value: e.target.checked } })} />}
                                    label="その他"
                                />
                                {formData.coping_other && (
                                    <TextField fullWidth size="small" label="具体的な方法" name="coping_other_detail" value={formData.coping_other_detail || ''} onChange={handleChange} />
                                )}
                            </Stack>
                            <FormControlLabel
                                control={<Checkbox checked={formData.coping_unknown || false} onChange={(e) => handleChange({ target: { name: 'coping_unknown', value: e.target.checked } })} />}
                                label="わからない"
                            />
                        </Stack>
                    </Box>

                    {/* 相談相手 */}
                    <Box sx={{ border: 1, borderColor: 'divider', p: 2, borderRadius: 1 }}>
                        <Typography variant="subtitle2" gutterBottom>体調不良時や困った時に相談している相手</Typography>
                        <Stack spacing={1.5}>
                            <Stack direction="row" alignItems="center" spacing={2}>
                                <FormControlLabel
                                    control={<Checkbox checked={formData.consult_family || false} onChange={(e) => handleChange({ target: { name: 'consult_family', value: e.target.checked } })} />}
                                    label="家族"
                                />
                                {formData.consult_family && (
                                    <>
                                        <TextField size="small" label="氏名" name="consult_family_name" value={formData.consult_family_name || ''} onChange={handleChange} sx={{ width: 140 }} />
                                        <TextField size="small" label="続柄" name="consult_family_rel" value={formData.consult_family_rel || ''} onChange={handleChange} sx={{ width: 100 }} />
                                    </>
                                )}
                            </Stack>
                            <FormControlLabel
                                control={<Checkbox checked={formData.consult_doctor || false} onChange={(e) => handleChange({ target: { name: 'consult_doctor', value: e.target.checked } })} />}
                                label="主治医"
                            />
                            <Stack direction="row" alignItems="center" spacing={2}>
                                <FormControlLabel
                                    control={<Checkbox checked={formData.consult_other || false} onChange={(e) => handleChange({ target: { name: 'consult_other', value: e.target.checked } })} />}
                                    label="その他"
                                />
                                {formData.consult_other && (
                                    <TextField fullWidth size="small" label="相手" name="consult_other_detail" value={formData.consult_other_detail || ''} onChange={handleChange} />
                                )}
                            </Stack>
                            <FormControlLabel
                                control={<Checkbox checked={formData.consult_none || false} onChange={(e) => handleChange({ target: { name: 'consult_none', value: e.target.checked } })} />}
                                label="いない"
                            />
                        </Stack>
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
        </LocalizationProvider>
    );
};

export default Step6_MentalStatus;
