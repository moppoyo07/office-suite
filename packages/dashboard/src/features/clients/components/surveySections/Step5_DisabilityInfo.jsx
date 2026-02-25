import React from 'react';
import {
    Stack, Box, Typography, TextField, Button, Grid, Paper,
    Checkbox, FormControlLabel, FormControl, InputLabel, Select, MenuItem
} from '@mui/material';

// 障害種別チェックリスト
const DISABILITY_TYPES = [
    { key: 'disability_mental', label: '精神' },
    { key: 'disability_intellectual', label: '知的' },
    { key: 'disability_physical', label: '身体' },
    { key: 'disability_developmental', label: '発達' },
    { key: 'disability_rare', label: '難病' },
];

const Step5_DisabilityInfo = ({ formData, setFormData, handleChange, nextStep, prevStep }) => {

    // チェックボックス配列ヘルパー
    const handleCheckArray = (fieldName, value, checked) => {
        const current = formData[fieldName] || [];
        const newValue = checked ? [...current, value] : current.filter(x => x !== value);
        handleChange({ target: { name: fieldName, value: newValue } });
    };

    return (
        <Box>
            <Typography variant="h5" component="h2" gutterBottom>
                ステップ5：障害・疾病の状況
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                障害の種類、障害者手帳の情報、非常災害時の対応について教えてください。
            </Typography>

            <Stack spacing={3}>
                {/* ====== 1. 障害種別・診断名 ====== */}
                <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>障害種別</Typography>

                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                        {DISABILITY_TYPES.map(({ key, label }) => (
                            <FormControlLabel
                                key={key}
                                control={
                                    <Checkbox
                                        checked={formData[key] || false}
                                        onChange={(e) => handleChange({ target: { name: key, value: e.target.checked } })}
                                    />
                                }
                                label={label}
                            />
                        ))}
                    </Box>

                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth size="small" label="診断名"
                                name="diagnosis_name"
                                value={formData.diagnosis_name || ''}
                                onChange={handleChange}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth size="small" label="合併障害・その他疾病"
                                name="comorbidity"
                                value={formData.comorbidity || ''}
                                onChange={handleChange}
                            />
                        </Grid>
                    </Grid>
                </Paper>

                {/* ====== 2. 障害者手帳 ====== */}
                <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>障害者手帳</Typography>

                    {/* 精神 */}
                    <Box sx={{ mb: 2, p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>精神障害者保健福祉手帳</Typography>
                        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                            <TextField
                                size="small" label="等級" sx={{ width: 80 }}
                                name="cert_mental_grade"
                                value={formData.cert_mental_grade || ''}
                                onChange={handleChange}
                            />
                            <TextField
                                size="small" label="取得年月日" sx={{ width: 160 }}
                                name="cert_mental_date"
                                value={formData.cert_mental_date || ''}
                                onChange={handleChange}
                                placeholder="例: 2024年4月"
                            />
                            <TextField
                                fullWidth size="small" label="特記事項"
                                name="cert_mental_note"
                                value={formData.cert_mental_note || ''}
                                onChange={handleChange}
                            />
                        </Stack>
                    </Box>

                    {/* 療育 */}
                    <Box sx={{ mb: 2, p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>療育手帳</Typography>
                        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                            <TextField
                                size="small" label="等級" sx={{ width: 80 }}
                                name="cert_intellectual_grade"
                                value={formData.cert_intellectual_grade || ''}
                                onChange={handleChange}
                            />
                            <TextField
                                size="small" label="取得年月日" sx={{ width: 160 }}
                                name="cert_intellectual_date"
                                value={formData.cert_intellectual_date || ''}
                                onChange={handleChange}
                                placeholder="例: 2024年4月"
                            />
                            <TextField
                                fullWidth size="small" label="特記事項"
                                name="cert_intellectual_note"
                                value={formData.cert_intellectual_note || ''}
                                onChange={handleChange}
                            />
                        </Stack>
                    </Box>

                    {/* 身体 */}
                    <Box sx={{ mb: 2, p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>身体障害者手帳</Typography>
                        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                            <TextField
                                size="small" label="種・級" sx={{ width: 80 }}
                                name="cert_physical_grade"
                                value={formData.cert_physical_grade || ''}
                                onChange={handleChange}
                            />
                            <TextField
                                size="small" label="取得年月日" sx={{ width: 160 }}
                                name="cert_physical_date"
                                value={formData.cert_physical_date || ''}
                                onChange={handleChange}
                                placeholder="例: 2024年4月"
                            />
                            <TextField
                                fullWidth size="small" label="特記事項"
                                name="cert_physical_note"
                                value={formData.cert_physical_note || ''}
                                onChange={handleChange}
                            />
                        </Stack>
                    </Box>

                    {/* 手帳なし */}
                    <Box sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={formData.cert_none || false}
                                    onChange={(e) => handleChange({ target: { name: 'cert_none', value: e.target.checked } })}
                                />
                            }
                            label="手帳なし"
                        />
                        {formData.cert_none && (
                            <Stack spacing={1.5} sx={{ mt: 1, ml: 4 }}>
                                <FormControl size="small" sx={{ minWidth: 200 }}>
                                    <InputLabel>状態</InputLabel>
                                    <Select
                                        value={formData.cert_none_status || ''}
                                        label="状態"
                                        name="cert_none_status"
                                        onChange={handleChange}
                                    >
                                        <MenuItem value="申請中">申請中</MenuItem>
                                        <MenuItem value="未申請">未申請</MenuItem>
                                        <MenuItem value="取得不可">取得不可</MenuItem>
                                    </Select>
                                </FormControl>
                                <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                                    <TextField
                                        size="small" label="取得予定" sx={{ width: 160 }}
                                        name="cert_none_planned_date"
                                        value={formData.cert_none_planned_date || ''}
                                        onChange={handleChange}
                                        placeholder="例: 2025年6月"
                                    />
                                    <TextField
                                        fullWidth size="small" label="理由・備考"
                                        name="cert_none_reason"
                                        value={formData.cert_none_reason || ''}
                                        onChange={handleChange}
                                    />
                                </Stack>
                            </Stack>
                        )}
                    </Box>

                    <TextField
                        fullWidth size="small" multiline rows={2} sx={{ mt: 2 }}
                        label="備考欄"
                        name="cert_note"
                        value={formData.cert_note || ''}
                        onChange={handleChange}
                    />
                </Paper>

                {/* ====== 3. 非常災害時・危機対応 ====== */}
                <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>非常災害時・危機対応</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                        緊急時の対応に必要な情報を教えてください。
                    </Typography>

                    <Stack spacing={2}>
                        {/* Q1: 身体面の心配 */}
                        <Box sx={{ p: 1.5, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                                非常災害時、身体面や体調面（症状）で心配なことはありますか
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                                <FormControlLabel control={<Checkbox checked={formData.emergency_physical === '特にない'} onChange={() => handleChange({ target: { name: 'emergency_physical', value: '特にない' } })} />} label="特にない" />
                                <FormControlLabel control={<Checkbox checked={formData.emergency_physical === 'ある'} onChange={() => handleChange({ target: { name: 'emergency_physical', value: 'ある' } })} />} label="ある" />
                            </Box>
                            {formData.emergency_physical === 'ある' && (
                                <Stack spacing={1} sx={{ ml: 4 }}>
                                    <TextField size="small" fullWidth label="心配な内容" name="emergency_physical_detail"
                                        value={formData.emergency_physical_detail || ''} onChange={handleChange} />
                                    <Typography variant="caption" sx={{ mt: 1 }}>対処法（チェック）</Typography>
                                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                        {['服薬', '支援者と面談', '通院', '家族に連絡', '救急車'].map(opt => (
                                            <FormControlLabel key={opt}
                                                control={<Checkbox size="small" checked={formData.emergency_physical_coping?.includes(opt)} onChange={(e) => handleCheckArray('emergency_physical_coping', opt, e.target.checked)} />}
                                                label={opt} />
                                        ))}
                                    </Box>
                                    <TextField size="small" fullWidth label="その他の対処法" name="emergency_physical_coping_other"
                                        value={formData.emergency_physical_coping_other || ''} onChange={handleChange} />
                                </Stack>
                            )}
                        </Box>

                        {/* Q2: 発作 */}
                        <Box sx={{ p: 1.5, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                                発作はありますか
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                                <FormControlLabel control={<Checkbox checked={formData.emergency_seizure === '特にない'} onChange={() => handleChange({ target: { name: 'emergency_seizure', value: '特にない' } })} />} label="特にない" />
                                <FormControlLabel control={<Checkbox checked={formData.emergency_seizure === '心発作'} onChange={() => handleChange({ target: { name: 'emergency_seizure', value: '心発作' } })} />} label="心発作" />
                                <FormControlLabel control={<Checkbox checked={formData.emergency_seizure === 'てんかん'} onChange={() => handleChange({ target: { name: 'emergency_seizure', value: 'てんかん' } })} />} label="てんかん" />
                                <FormControlLabel control={<Checkbox checked={formData.emergency_seizure === 'パニック等'} onChange={() => handleChange({ target: { name: 'emergency_seizure', value: 'パニック等' } })} />} label="パニック等" />
                                <FormControlLabel control={<Checkbox checked={formData.emergency_seizure === 'その他'} onChange={() => handleChange({ target: { name: 'emergency_seizure', value: 'その他' } })} />} label="その他" />
                            </Box>
                            {formData.emergency_seizure && formData.emergency_seizure !== '特にない' && (
                                <Stack spacing={1} sx={{ ml: 4 }}>
                                    <TextField size="small" fullWidth label="詳細" name="emergency_seizure_detail"
                                        value={formData.emergency_seizure_detail || ''} onChange={handleChange} />
                                    <Typography variant="caption" sx={{ mt: 1 }}>対処法（チェック）</Typography>
                                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                        {['服薬', '支援者と面談', '通院', '家族に連絡', '救急車'].map(opt => (
                                            <FormControlLabel key={opt}
                                                control={<Checkbox size="small" checked={formData.emergency_seizure_coping?.includes(opt)} onChange={(e) => handleCheckArray('emergency_seizure_coping', opt, e.target.checked)} />}
                                                label={opt} />
                                        ))}
                                    </Box>
                                    <TextField size="small" fullWidth label="その他の対処法" name="emergency_seizure_coping_other"
                                        value={formData.emergency_seizure_coping_other || ''} onChange={handleChange} />
                                </Stack>
                            )}
                        </Box>

                        {/* Q3: 自傷・他害 */}
                        <Box sx={{ p: 1.5, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                                自分や他者を傷つけてしまうような心配がある
                            </Typography>
                            <Typography variant="caption" sx={{ mb: 1, display: 'block' }}>過去</Typography>
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                                <FormControlLabel control={<Checkbox checked={formData.emergency_harm_past === 'ない'} onChange={() => handleChange({ target: { name: 'emergency_harm_past', value: 'ない' } })} />} label="ない" />
                                <FormControlLabel control={<Checkbox checked={formData.emergency_harm_past === 'ある'} onChange={() => handleChange({ target: { name: 'emergency_harm_past', value: 'ある' } })} />} label="ある" />
                            </Box>
                            <Typography variant="caption" sx={{ mb: 1, display: 'block' }}>現在</Typography>
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                                <FormControlLabel control={<Checkbox checked={formData.emergency_harm_present === 'ない'} onChange={() => handleChange({ target: { name: 'emergency_harm_present', value: 'ない' } })} />} label="ない" />
                                <FormControlLabel control={<Checkbox checked={formData.emergency_harm_present === 'ある'} onChange={() => handleChange({ target: { name: 'emergency_harm_present', value: 'ある' } })} />} label="ある" />
                            </Box>
                            {(formData.emergency_harm_past === 'ある' || formData.emergency_harm_present === 'ある') && (
                                <Stack spacing={1} sx={{ ml: 4 }}>
                                    <TextField size="small" fullWidth label="状況や方法" name="emergency_harm_detail"
                                        value={formData.emergency_harm_detail || ''} onChange={handleChange} />
                                    <Typography variant="caption">相談先（チェック）</Typography>
                                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                        {['主治医', '家族', '知人', '支援者', '関係機関'].map(opt => (
                                            <FormControlLabel key={opt}
                                                control={<Checkbox size="small" checked={formData.emergency_harm_consult?.includes(opt)} onChange={(e) => handleCheckArray('emergency_harm_consult', opt, e.target.checked)} />}
                                                label={opt} />
                                        ))}
                                    </Box>
                                    <Typography variant="caption">対処法（チェック）</Typography>
                                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                        {['服薬', '止血', '通院', '救急車'].map(opt => (
                                            <FormControlLabel key={opt}
                                                control={<Checkbox size="small" checked={formData.emergency_harm_action?.includes(opt)} onChange={(e) => handleCheckArray('emergency_harm_action', opt, e.target.checked)} />}
                                                label={opt} />
                                        ))}
                                    </Box>
                                    <TextField size="small" fullWidth label="乗り越えてきた対処法があれば教えてください" name="emergency_harm_overcome"
                                        value={formData.emergency_harm_overcome || ''} onChange={handleChange} />
                                </Stack>
                            )}
                        </Box>

                        {/* Q4: 自殺念慮 */}
                        <Box sx={{ p: 1.5, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                                死にたい気持ちになることや行動に起こしたことはありますか
                            </Typography>
                            <Typography variant="caption" sx={{ mb: 1, display: 'block' }}>過去</Typography>
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                                <FormControlLabel control={<Checkbox checked={formData.emergency_suicidal_past === 'ない'} onChange={() => handleChange({ target: { name: 'emergency_suicidal_past', value: 'ない' } })} />} label="ない" />
                                <FormControlLabel control={<Checkbox checked={formData.emergency_suicidal_past === 'ある'} onChange={() => handleChange({ target: { name: 'emergency_suicidal_past', value: 'ある' } })} />} label="ある" />
                            </Box>
                            <Typography variant="caption" sx={{ mb: 1, display: 'block' }}>現在</Typography>
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                                <FormControlLabel control={<Checkbox checked={formData.emergency_suicidal_present === 'ない'} onChange={() => handleChange({ target: { name: 'emergency_suicidal_present', value: 'ない' } })} />} label="ない" />
                                <FormControlLabel control={<Checkbox checked={formData.emergency_suicidal_present === 'ある'} onChange={() => handleChange({ target: { name: 'emergency_suicidal_present', value: 'ある' } })} />} label="ある" />
                            </Box>
                            {(formData.emergency_suicidal_past === 'ある' || formData.emergency_suicidal_present === 'ある') && (
                                <Stack spacing={1} sx={{ ml: 4 }}>
                                    <TextField size="small" fullWidth label="状況や方法" name="emergency_suicidal_detail"
                                        value={formData.emergency_suicidal_detail || ''} onChange={handleChange} />
                                    <Typography variant="caption">相談先（チェック）</Typography>
                                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                        {['主治医', '家族', '知人', '支援者', '関係機関'].map(opt => (
                                            <FormControlLabel key={opt}
                                                control={<Checkbox size="small" checked={formData.emergency_suicidal_consult?.includes(opt)} onChange={(e) => handleCheckArray('emergency_suicidal_consult', opt, e.target.checked)} />}
                                                label={opt} />
                                        ))}
                                    </Box>
                                    <Typography variant="caption">対処法（チェック）</Typography>
                                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                        {['服薬', '止血', '通院', '救急車'].map(opt => (
                                            <FormControlLabel key={opt}
                                                control={<Checkbox size="small" checked={formData.emergency_suicidal_action?.includes(opt)} onChange={(e) => handleCheckArray('emergency_suicidal_action', opt, e.target.checked)} />}
                                                label={opt} />
                                        ))}
                                    </Box>
                                    <TextField size="small" fullWidth label="乗り越えてきた対処法があれば教えてください" name="emergency_suicidal_overcome"
                                        value={formData.emergency_suicidal_overcome || ''} onChange={handleChange} />
                                </Stack>
                            )}
                        </Box>

                        <TextField
                            fullWidth size="small" multiline rows={2}
                            label="全体を通しての特記事項"
                            name="emergency_general_note"
                            value={formData.emergency_general_note || ''}
                            onChange={handleChange}
                        />
                    </Stack>
                </Paper>
            </Stack>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                <Button onClick={prevStep}>前へ戻る</Button>
                <Button variant="contained" onClick={nextStep}>次へ進む</Button>
            </Box>
        </Box>
    );
};

export default Step5_DisabilityInfo;
