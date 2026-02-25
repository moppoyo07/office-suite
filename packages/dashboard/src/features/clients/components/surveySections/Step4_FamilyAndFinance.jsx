import React from 'react';
import {
    Stack, Box, Typography, TextField, Button, Grid, Paper,
    FormControl, InputLabel, Select, MenuItem, FormControlLabel, Radio, RadioGroup
} from '@mui/material';

const Step4_FamilyAndFinance = ({ formData, setFormData, handleChange, nextStep, prevStep }) => {

    return (
        <Box>
            <Typography variant="h5" component="h2" gutterBottom>
                ステップ4：家族構成・経済状況
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                ご家族の情報と経済状況について教えてください。
            </Typography>

            <Stack spacing={3}>
                {/* ====== 1. 家族構成 ====== */}
                <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>家族構成／家族状況</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                        ご家族の情報をご記入ください（最大6名）。
                    </Typography>

                    <Grid container spacing={1}>
                        {[1, 2, 3, 4, 5, 6].map((num) => (
                            <Grid item xs={12} sm={6} key={num}>
                                <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 1.5, mb: 1 }}>
                                    <Typography variant="caption" sx={{ fontWeight: 'bold', mb: 0.5, display: 'block' }}>
                                        家族{num}
                                    </Typography>
                                    <Stack spacing={1}>
                                        <Stack direction="row" spacing={1}>
                                            <TextField
                                                fullWidth size="small" label="氏名"
                                                name={`family_name_${num}`}
                                                value={formData[`family_name_${num}`] || ''}
                                                onChange={handleChange}
                                            />
                                            <TextField
                                                size="small" label="続柄" sx={{ width: 100 }}
                                                name={`family_rel_${num}`}
                                                value={formData[`family_rel_${num}`] || ''}
                                                onChange={handleChange}
                                                placeholder="例: 母"
                                            />
                                        </Stack>
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            <FormControl size="small" sx={{ minWidth: 100 }}>
                                                <InputLabel>同居</InputLabel>
                                                <Select
                                                    value={formData[`family_living_${num}`] || ''}
                                                    label="同居"
                                                    name={`family_living_${num}`}
                                                    onChange={handleChange}
                                                >
                                                    <MenuItem value="同居">同居</MenuItem>
                                                    <MenuItem value="別居">別居</MenuItem>
                                                </Select>
                                            </FormControl>
                                            <TextField
                                                fullWidth size="small" label="その他・親族関係など"
                                                name={`family_note_${num}`}
                                                value={formData[`family_note_${num}`] || ''}
                                                onChange={handleChange}
                                                placeholder="例: キーパーソン"
                                            />
                                        </Stack>
                                    </Stack>
                                </Box>
                            </Grid>
                        ))}
                    </Grid>
                </Paper>

                {/* ====== 2. 経済状況 ====== */}
                <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>経済状況</Typography>

                    {/* 生活保護 */}
                    <Box sx={{ mb: 2, p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>生活保護</Typography>
                        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                            <FormControl size="small" sx={{ minWidth: 140 }}>
                                <InputLabel>状態</InputLabel>
                                <Select
                                    value={formData.welfare_protection_status || ''}
                                    label="状態"
                                    name="welfare_protection_status"
                                    onChange={handleChange}
                                >
                                    <MenuItem value="無">無</MenuItem>
                                    <MenuItem value="受給中">受給中</MenuItem>
                                    <MenuItem value="申請中">申請中</MenuItem>
                                </Select>
                            </FormControl>
                            {(formData.welfare_protection_status === '受給中' || formData.welfare_protection_status === '申請中') && (
                                <>
                                    <TextField
                                        size="small" type="number" label="円／月額"
                                        name="welfare_protection_amount"
                                        value={formData.welfare_protection_amount || ''}
                                        onChange={handleChange}
                                        sx={{ width: 130 }}
                                    />
                                    <TextField
                                        size="small" label="交通費"
                                        name="welfare_protection_transport"
                                        value={formData.welfare_protection_transport || ''}
                                        onChange={handleChange}
                                        sx={{ width: 120 }}
                                    />
                                    <FormControl size="small" sx={{ minWidth: 120 }}>
                                        <InputLabel>助成</InputLabel>
                                        <Select
                                            value={formData.welfare_protection_subsidy || ''}
                                            label="助成"
                                            name="welfare_protection_subsidy"
                                            onChange={handleChange}
                                        >
                                            <MenuItem value="助成有">助成有</MenuItem>
                                            <MenuItem value="助成無">助成無</MenuItem>
                                        </Select>
                                    </FormControl>
                                </>
                            )}
                        </Stack>
                    </Box>

                    {/* 障害年金 */}
                    <Box sx={{ mb: 2, p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>障害年金</Typography>
                        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                            <FormControl size="small" sx={{ minWidth: 140 }}>
                                <InputLabel>状態</InputLabel>
                                <Select
                                    value={formData.disability_pension_status || ''}
                                    label="状態"
                                    name="disability_pension_status"
                                    onChange={handleChange}
                                >
                                    <MenuItem value="無">無</MenuItem>
                                    <MenuItem value="受給中">受給中</MenuItem>
                                    <MenuItem value="申請中">申請中</MenuItem>
                                </Select>
                            </FormControl>
                            {(formData.disability_pension_status === '受給中' || formData.disability_pension_status === '申請中') && (
                                <>
                                    <TextField
                                        size="small" type="number" label="円／月額"
                                        name="disability_pension_amount"
                                        value={formData.disability_pension_amount || ''}
                                        onChange={handleChange}
                                        sx={{ width: 130 }}
                                    />
                                    <FormControl size="small" sx={{ minWidth: 120 }}>
                                        <InputLabel>種類</InputLabel>
                                        <Select
                                            value={formData.disability_pension_type || ''}
                                            label="種類"
                                            name="disability_pension_type"
                                            onChange={handleChange}
                                        >
                                            <MenuItem value="基礎">基礎</MenuItem>
                                            <MenuItem value="厚生">厚生</MenuItem>
                                            <MenuItem value="共済">共済</MenuItem>
                                        </Select>
                                    </FormControl>
                                    <TextField
                                        size="small" label="級"
                                        name="disability_pension_grade"
                                        value={formData.disability_pension_grade || ''}
                                        onChange={handleChange}
                                        sx={{ width: 60 }}
                                    />
                                </>
                            )}
                        </Stack>
                    </Box>

                    {/* 健康保険 */}
                    <Box sx={{ mb: 2, p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>健康保険</Typography>
                        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                            <FormControl size="small" sx={{ minWidth: 140 }}>
                                <InputLabel>被保険者</InputLabel>
                                <Select
                                    value={formData.health_insurance_holder || ''}
                                    label="被保険者"
                                    name="health_insurance_holder"
                                    onChange={handleChange}
                                >
                                    <MenuItem value="家族">家族</MenuItem>
                                    <MenuItem value="本人">本人</MenuItem>
                                </Select>
                            </FormControl>
                            <FormControl size="small" sx={{ minWidth: 160 }}>
                                <InputLabel>種類</InputLabel>
                                <Select
                                    value={formData.health_insurance_type || ''}
                                    label="種類"
                                    name="health_insurance_type"
                                    onChange={handleChange}
                                >
                                    <MenuItem value="国保">国保</MenuItem>
                                    <MenuItem value="社保">社保</MenuItem>
                                    <MenuItem value="共済">共済</MenuItem>
                                    <MenuItem value="その他">その他</MenuItem>
                                </Select>
                            </FormControl>
                            <FormControl size="small" sx={{ minWidth: 200 }}>
                                <InputLabel>自立支援医療</InputLabel>
                                <Select
                                    value={formData.self_support_medical || ''}
                                    label="自立支援医療"
                                    name="self_support_medical"
                                    onChange={handleChange}
                                >
                                    <MenuItem value="無">無</MenuItem>
                                    <MenuItem value="受給中">受給中</MenuItem>
                                    <MenuItem value="申請中">申請中</MenuItem>
                                </Select>
                            </FormControl>
                        </Stack>
                    </Box>

                    {/* 備考 */}
                    <TextField
                        fullWidth size="small" multiline rows={2}
                        label="備考欄（その他の収入、家族の収入など）"
                        name="finance_note"
                        value={formData.finance_note || ''}
                        onChange={handleChange}
                    />
                </Paper>
            </Stack>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                <Button onClick={prevStep}>前へ戻る</Button>
                <Button variant="contained" onClick={nextStep}>次へ進む</Button>
            </Box>
        </Box>
    );
};

export default Step4_FamilyAndFinance;
