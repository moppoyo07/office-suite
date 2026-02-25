import React from 'react';
import { Stack, Box, Typography, TextField, Button, Grid, FormControl, FormLabel, RadioGroup, FormControlLabel, Radio, InputLabel, Select, MenuItem } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ja } from 'date-fns/locale';

const Step3_ContactsAndWelfare = ({ formData, setFormData, handleChange, handleDateChange, nextStep, prevStep }) => {

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ja}>
            <Typography variant="h5" component="h2" gutterBottom>
                ステップ3：連絡先・福祉医療
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                緊急連絡先や、現在ご利用中の医療・福祉サービスについて教えてください。
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

                {/* --- 1. 緊急連絡先 --- */}
                <Box sx={{ border: 1, borderColor: 'divider', p: 2, borderRadius: 1 }}>
                    <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>緊急連絡先（3件まで）</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                        緊急時に連絡がつきやすい順にご記入ください。
                    </Typography>

                    {[1, 2, 3].map((num) => (
                        <Stack key={num} direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2, alignItems: 'center' }}>
                            <Typography sx={{ width: '20px', fontWeight: 'bold' }}>{num}</Typography>
                            <TextField size="small" label="氏名" name={`emergency_name_${num}`} value={formData[`emergency_name_${num}`] || ''} onChange={handleChange} sx={{ flex: 1 }} />
                            <TextField size="small" label="続柄" name={`emergency_rel_${num}`} value={formData[`emergency_rel_${num}`] || ''} onChange={handleChange} sx={{ width: { xs: '100%', md: '120px' } }} />
                            <TextField size="small" label="電話番号" name={`emergency_phone_${num}`} value={formData[`emergency_phone_${num}`] || ''} onChange={handleChange} sx={{ flex: 1 }} />
                        </Stack>
                    ))}
                </Box>

                {/* --- 2. かかりつけ医療機関 --- */}
                <Box sx={{ border: 1, borderColor: 'divider', p: 2, borderRadius: 1 }}>
                    <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>かかりつけ医療機関（2件まで）</Typography>
                    {[1, 2].map((num) => (
                        <Box key={num} sx={{ mb: 2, p: 1, bgcolor: 'action.selected', borderRadius: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>医療機関 {num}</Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <TextField fullWidth size="small" label="病院名" name={`medical_name_${num}`} value={formData[`medical_name_${num}`] || ''} onChange={handleChange} />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField fullWidth size="small" label="電話番号" name={`medical_phone_${num}`} value={formData[`medical_phone_${num}`] || ''} onChange={handleChange} />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField fullWidth size="small" label="所在地（市・区・町）" name={`medical_address_${num}`} value={formData[`medical_address_${num}`] || ''} onChange={handleChange} />
                                </Grid>
                                <Grid item xs={6} sm={4}>
                                    <TextField fullWidth size="small" label="受診科目" name={`medical_dept_${num}`} value={formData[`medical_dept_${num}`] || ''} onChange={handleChange} />
                                </Grid>
                                <Grid item xs={6} sm={4}>
                                    <TextField fullWidth size="small" label="担当医" name={`medical_doctor_${num}`} value={formData[`medical_doctor_${num}`] || ''} onChange={handleChange} />
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <TextField fullWidth size="small" label="通院頻度" name={`medical_freq_${num}`} value={formData[`medical_freq_${num}`] || ''} onChange={handleChange} placeholder="例: 月1回" />
                                </Grid>
                            </Grid>
                        </Box>
                    ))}
                </Box>

                {/* --- 3. 相談支援事業所・福祉サービス --- */}
                <Box sx={{ border: 1, borderColor: 'divider', p: 2, borderRadius: 1 }}>
                    <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>相談支援事業所</Typography>
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                        <Grid item xs={12} sm={6}>
                            <TextField fullWidth size="small" label="事業所名" name="welfare_support_office" value={formData.welfare_support_office || ''} onChange={handleChange} />
                        </Grid>
                        <Grid item xs={6} sm={3}>
                            <TextField fullWidth size="small" label="担当" name="welfare_support_person" value={formData.welfare_support_person || ''} onChange={handleChange} />
                        </Grid>
                        <Grid item xs={6} sm={3}>
                            <TextField fullWidth size="small" label="電話番号" name="welfare_support_phone" value={formData.welfare_support_phone || ''} onChange={handleChange} />
                        </Grid>
                    </Grid>

                    <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>その他の福祉サービス・登録機関等</Typography>
                    <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>就労・生活支援センター、地域活動支援センター、訪問看護など</Typography>
                    {[1, 2].map((num) => (
                        <Box key={num} sx={{ mb: 1, p: 1, bgcolor: 'action.selected', borderRadius: 1 }}>
                            <Grid container spacing={1} alignItems="center">
                                <Grid item xs={12} sm={4}>
                                    <TextField fullWidth size="small" label="事業所名" name={`welfare_other_name_${num}`} value={formData[`welfare_other_name_${num}`] || ''} onChange={handleChange} />
                                </Grid>
                                <Grid item xs={4} sm={3}>
                                    <TextField fullWidth size="small" label="種別" name={`welfare_other_type_${num}`} value={formData[`welfare_other_type_${num}`] || ''} onChange={handleChange} placeholder="例: 訪問看護" />
                                </Grid>
                                <Grid item xs={4} sm={2}>
                                    <TextField fullWidth size="small" label="担当" name={`welfare_other_person_${num}`} value={formData[`welfare_other_person_${num}`] || ''} onChange={handleChange} />
                                </Grid>
                                <Grid item xs={4} sm={3}>
                                    <TextField fullWidth size="small" label="電話番号" name={`welfare_other_phone_${num}`} value={formData[`welfare_other_phone_${num}`] || ''} onChange={handleChange} />
                                </Grid>
                            </Grid>
                        </Box>
                    ))}
                </Box>

                {/* --- 4. 行政窓口 --- */}
                <Box sx={{ border: 1, borderColor: 'divider', p: 2, borderRadius: 1 }}>
                    <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>行政窓口</Typography>

                    <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>市・区・町</Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={4}>
                                <TextField fullWidth size="small" label="市・区・町" name="admin_city_name" value={formData.admin_city_name || ''} onChange={handleChange} />
                            </Grid>
                            <Grid item xs={4}>
                                <TextField fullWidth size="small" label="課・係" name="admin_city_section" value={formData.admin_city_section || ''} onChange={handleChange} />
                            </Grid>
                            <Grid item xs={2}>
                                <TextField fullWidth size="small" label="担当" name="admin_city_person" value={formData.admin_city_person || ''} onChange={handleChange} />
                            </Grid>
                            <Grid item xs={2}>
                                <TextField fullWidth size="small" label="電話番号" name="admin_city_phone" value={formData.admin_city_phone || ''} onChange={handleChange} />
                            </Grid>
                        </Grid>
                    </Box>

                    <Box>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>管轄ハローワーク</Typography>
                        <Grid container spacing={2} alignItems="center">
                            <Grid item xs={12} sm={3}>
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    <FormControlLabel control={<Radio checked={formData.hello_work_status === 'registered'} onChange={() => handleChange({ target: { name: 'hello_work_status', value: 'registered' } })} />} label="登録済" />
                                    <FormControlLabel control={<Radio checked={formData.hello_work_status === 'unregistered'} onChange={() => handleChange({ target: { name: 'hello_work_status', value: 'unregistered' } })} />} label="未登録" />
                                </Box>
                            </Grid>
                            <Grid item xs={6} sm={3}>
                                <TextField fullWidth size="small" label="ハローワーク名" name="hello_work_name" value={formData.hello_work_name || ''} onChange={handleChange} />
                            </Grid>
                            <Grid item xs={3} sm={3}>
                                <TextField fullWidth size="small" label="担当" name="hello_work_person" value={formData.hello_work_person || ''} onChange={handleChange} />
                            </Grid>
                            <Grid item xs={3} sm={3}>
                                <TextField fullWidth size="small" label="電話番号" name="hello_work_phone" value={formData.hello_work_phone || ''} onChange={handleChange} />
                            </Grid>
                        </Grid>
                    </Box>
                </Box>

            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                <Button onClick={prevStep}>
                    前へ戻る
                </Button>
                <Button variant="contained" onClick={nextStep}>
                    次へ進む
                </Button>
            </Box>
        </LocalizationProvider>
    );
};

export default Step3_ContactsAndWelfare;
