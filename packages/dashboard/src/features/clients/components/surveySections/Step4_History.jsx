import React from 'react';
import { Stack, Box, Typography, TextField, Button, Grid, FormControl, FormLabel, RadioGroup, FormControlLabel, Radio, Checkbox, Paper } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ja } from 'date-fns/locale';

const Step4_History = ({ formData, setFormData, handleChange, handleDateChange, nextStep, prevStep }) => {

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ja}>
            <Typography variant="h5" component="h2" gutterBottom>
                ステップ6：アセスメント（履歴・生活）
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                生活状況や就労歴について教えてください。（アセスメントシート 様式1）
            </Typography>

            <Stack spacing={4}>

                {/* --- 社会参加等 --- */}
                <Box>
                    <Typography variant="h6" sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>社会参加（地域生活関連）</Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={4}>
                            <TextField fullWidth size="small" label="外出の頻度" name="outing_frequency" value={formData.outing_frequency || ''} onChange={handleChange} placeholder="週〇回、ほぼ毎日など" />
                        </Grid>
                        <Grid item xs={12} sm={8}>
                            <TextField fullWidth size="small" label="主な外出先" name="outing_places" value={formData.outing_places || ''} onChange={handleChange} />
                        </Grid>
                    </Grid>
                </Box>

                {/* --- 過去2年の入所歴（社会参加とは別セクション） --- */}
                <Box>
                    <Typography variant="h6" sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>過去2年の入所歴</Typography>
                    <FormControl component="fieldset">
                        <RadioGroup row name="past_admission" value={formData.past_admission || 'none'} onChange={handleChange}>
                            <FormControlLabel value="none" control={<Radio size="small" />} label="なし" />
                            <FormControlLabel value="yes" control={<Radio size="small" />} label="あり" />
                        </RadioGroup>
                    </FormControl>
                    {formData.past_admission === 'yes' && (
                        <Box sx={{ mt: 1, pl: 2, borderLeft: '2px solid #ddd' }}>
                            {[1, 2].map(num => (
                                <Grid container spacing={1} key={num} sx={{ mb: 1 }}>
                                    <Grid item xs={12} sm={5}>
                                        <Stack direction="row" alignItems="center" spacing={1}>
                                            <Typography variant="caption">{num}.</Typography>
                                            <DatePicker
                                                label="入所年月"
                                                views={['year', 'month']}
                                                slotProps={{ textField: { size: 'small' } }}
                                                value={formData[`admission_start_${num}`] || null}
                                                onChange={(val) => handleDateChange(`admission_start_${num}`, val)}
                                            />
                                            <Typography>～</Typography>
                                            <DatePicker
                                                label="退所年月"
                                                views={['year', 'month']}
                                                slotProps={{ textField: { size: 'small' } }}
                                                value={formData[`admission_end_${num}`] || null}
                                                onChange={(val) => handleDateChange(`admission_end_${num}`, val)}
                                            />
                                        </Stack>
                                    </Grid>
                                    <Grid item xs={12} sm={7}>
                                        <TextField fullWidth size="small" label="施設の種類" name={`admission_type_${num}`} value={formData[`admission_type_${num}`] || ''} onChange={handleChange} />
                                    </Grid>
                                </Grid>
                            ))}
                        </Box>
                    )}
                </Box>

                {/* --- 日中活動 --- */}
                <Box>
                    <Typography variant="h6" sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>日中活動</Typography>
                    <FormLabel component="legend">主な活動場所</FormLabel>
                    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                        {['自宅', '施設', '病院', 'その他'].map((opt) => (
                            <FormControlLabel
                                key={opt}
                                control={<Checkbox checked={formData.activity_place?.includes(opt)} onChange={(e) => {
                                    const current = formData.activity_place || [];
                                    const newValue = e.target.checked ? [...current, opt] : current.filter(x => x !== opt);
                                    handleChange({ target: { name: 'activity_place', value: newValue } });
                                }} />}
                                label={opt}
                            />
                        ))}
                    </Box>

                    {/* 1日の様子 - 時間帯別 */}
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>1日の様子</Typography>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                        <Grid container spacing={2}>
                            <Grid item xs={6} sm={3}>
                                <TextField fullWidth size="small" label="起床時間" name="daily_wakeup" value={formData.daily_wakeup || ''} onChange={handleChange} placeholder="例: 7:00" />
                            </Grid>
                            <Grid item xs={6} sm={3}>
                                <TextField fullWidth size="small" label="朝食" name="daily_breakfast" value={formData.daily_breakfast || ''} onChange={handleChange} placeholder="例: 7:30" />
                            </Grid>
                            <Grid item xs={6} sm={3}>
                                <TextField fullWidth size="small" label="昼食" name="daily_lunch" value={formData.daily_lunch || ''} onChange={handleChange} placeholder="例: 12:00" />
                            </Grid>
                            <Grid item xs={6} sm={3}>
                                <TextField fullWidth size="small" label="夕食" name="daily_dinner" value={formData.daily_dinner || ''} onChange={handleChange} placeholder="例: 18:00" />
                            </Grid>
                            <Grid item xs={6} sm={3}>
                                <TextField fullWidth size="small" label="入浴" name="daily_bath" value={formData.daily_bath || ''} onChange={handleChange} placeholder="例: 20:00" />
                            </Grid>
                            <Grid item xs={6} sm={3}>
                                <TextField fullWidth size="small" label="就寝時間" name="daily_bedtime" value={formData.daily_bedtime || ''} onChange={handleChange} placeholder="例: 23:00" />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField fullWidth size="small" label="日中の過ごし方" name="daily_daytime" value={formData.daily_daytime || ''} onChange={handleChange} placeholder="テレビ、散歩、読書など" />
                            </Grid>
                        </Grid>
                        <TextField
                            fullWidth size="small" sx={{ mt: 2 }}
                            multiline minRows={2}
                            label="その他メモ（休日の過ごし方など）"
                            name="daily_schedule_note"
                            value={formData.daily_schedule_note || ''}
                            onChange={handleChange}
                        />
                    </Paper>
                </Box>

                {/* --- 居住関連 --- */}
                <Box>
                    <Typography variant="h6" sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>居住関連</Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <FormControl component="fieldset">
                                <FormLabel component="legend">住居形態</FormLabel>
                                <RadioGroup row name="housing_type" value={formData.housing_type || ''} onChange={handleChange}>
                                    <FormControlLabel value="owned" control={<Radio size="small" />} label="持ち家" />
                                    <FormControlLabel value="rented" control={<Radio size="small" />} label="借家" />
                                    <FormControlLabel value="public" control={<Radio size="small" />} label="公営住宅" />
                                    <FormControlLabel value="group_home" control={<Radio size="small" />} label="グループホーム" />
                                    <FormControlLabel value="other" control={<Radio size="small" />} label="その他" />
                                </RadioGroup>
                            </FormControl>
                            {formData.housing_type === 'other' && (
                                <TextField fullWidth size="small" label="その他の住居形態" name="housing_type_other"
                                    value={formData.housing_type_other || ''} onChange={handleChange} sx={{ mt: 1 }} />
                            )}
                        </Grid>
                        <Grid item xs={12}>
                            <FormControl component="fieldset">
                                <FormLabel component="legend">本人の部屋</FormLabel>
                                <RadioGroup row name="room_type" value={formData.room_type || ''} onChange={handleChange}>
                                    <FormControlLabel value="private" control={<Radio size="small" />} label="専用（個室）" />
                                    <FormControlLabel value="shared" control={<Radio size="small" />} label="兼用（相部屋）" />
                                    <FormControlLabel value="none" control={<Radio size="small" />} label="なし" />
                                </RadioGroup>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                            <FormControl component="fieldset">
                                <FormLabel component="legend">寝具</FormLabel>
                                <RadioGroup row name="bedding_type" value={formData.bedding_type || ''} onChange={handleChange}>
                                    <FormControlLabel value="bed" control={<Radio size="small" />} label="ベッド" />
                                    <FormControlLabel value="futon" control={<Radio size="small" />} label="布団" />
                                    <FormControlLabel value="other" control={<Radio size="small" />} label="その他" />
                                </RadioGroup>
                            </FormControl>
                            {formData.bedding_type === 'other' && (
                                <TextField fullWidth size="small" label="その他" name="bedding_type_other"
                                    value={formData.bedding_type_other || ''} onChange={handleChange} sx={{ mt: 1 }} />
                            )}
                        </Grid>
                        <Grid item xs={12}>
                            <TextField fullWidth size="small" label="同居者" name="cohabitants" value={formData.cohabitants || ''} onChange={handleChange} placeholder="父、母、弟など" />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField fullWidth size="small" multiline minRows={2} label="その他特記事項" name="housing_note" value={formData.housing_note || ''} onChange={handleChange} />
                        </Grid>
                    </Grid>
                </Box>

                {/* --- 免許・資格 --- */}
                <Box>
                    <Typography variant="h6" sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>免許・資格・検定など</Typography>
                    <TextField
                        fullWidth
                        multiline
                        minRows={2}
                        placeholder="普通自動車免許、英検2級など"
                        name="qualifications"
                        value={formData.qualifications || ''}
                        onChange={handleChange}
                    />
                </Box>

                {/* --- 就労関連 --- */}
                <Box>
                    <Typography variant="h6" sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>就労状況</Typography>

                    {/* 現在の就労状況 */}
                    <FormControl component="fieldset" sx={{ mb: 3 }}>
                        <FormLabel component="legend">現在の状況</FormLabel>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                            {['一般就労', 'パート・アルバイト', '就労移行支援', '就労継続支援A型', '就労継続支援B型', '未就労', 'その他'].map(opt => (
                                <FormControlLabel
                                    key={opt}
                                    control={<Checkbox checked={formData.work_current_status?.includes(opt)} onChange={(e) => {
                                        const current = formData.work_current_status || [];
                                        const newValue = e.target.checked ? [...current, opt] : current.filter(x => x !== opt);
                                        handleChange({ target: { name: 'work_current_status', value: newValue } });
                                    }} />}
                                    label={opt}
                                />
                            ))}
                        </Box>
                        {formData.work_current_status?.includes('その他') && (
                            <TextField fullWidth size="small" label="その他の詳細" name="work_current_status_other"
                                value={formData.work_current_status_other || ''} onChange={handleChange} sx={{ mt: 1 }} />
                        )}
                    </FormControl>

                    {/* 過去の就労経験チェック */}
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>過去の就労経験</Typography>
                    <Stack spacing={1.5} sx={{ mb: 3 }}>
                        <Stack direction="row" alignItems="center" spacing={2}>
                            <Typography variant="body2" sx={{ minWidth: 260 }}>一般就労やアルバイトの経験</Typography>
                            <RadioGroup row name="work_exp_general" value={formData.work_exp_general || ''} onChange={handleChange}>
                                <FormControlLabel value="あり" control={<Radio size="small" />} label="あり" />
                                <FormControlLabel value="なし" control={<Radio size="small" />} label="なし" />
                            </RadioGroup>
                        </Stack>
                        <Stack direction="row" alignItems="center" spacing={2}>
                            <Typography variant="body2" sx={{ minWidth: 260 }}>就労移行・就労継続支援の経験</Typography>
                            <RadioGroup row name="work_exp_welfare" value={formData.work_exp_welfare || ''} onChange={handleChange}>
                                <FormControlLabel value="あり" control={<Radio size="small" />} label="あり" />
                                <FormControlLabel value="なし" control={<Radio size="small" />} label="なし" />
                            </RadioGroup>
                        </Stack>
                        <Stack direction="row" alignItems="center" spacing={2}>
                            <Typography variant="body2" sx={{ minWidth: 260 }}>最近1年間の就労の経験</Typography>
                            <RadioGroup row name="work_exp_recent" value={formData.work_exp_recent || ''} onChange={handleChange}>
                                <FormControlLabel value="あり" control={<Radio size="small" />} label="あり" />
                                <FormControlLabel value="なし" control={<Radio size="small" />} label="なし" />
                            </RadioGroup>
                        </Stack>
                        <Stack direction="row" alignItems="center" spacing={2}>
                            <Typography variant="body2" sx={{ minWidth: 260 }}>中断の有無</Typography>
                            <RadioGroup row name="work_exp_interrupted" value={formData.work_exp_interrupted || ''} onChange={handleChange}>
                                <FormControlLabel value="あり" control={<Radio size="small" />} label="あり" />
                                <FormControlLabel value="なし" control={<Radio size="small" />} label="なし" />
                            </RadioGroup>
                        </Stack>
                    </Stack>

                    {/* 主な就労先 */}
                    <TextField
                        fullWidth size="small" sx={{ mb: 2 }}
                        multiline minRows={2}
                        label="主な就労先"
                        name="work_history_main"
                        value={formData.work_history_main || ''}
                        onChange={handleChange}
                        placeholder="会社名、業種、期間など"
                    />

                    {/* 一般就労希望 */}
                    <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                        <Typography variant="body2" sx={{ minWidth: 200 }}>一般就労希望</Typography>
                        <RadioGroup row name="work_general_hope" value={formData.work_general_hope || ''} onChange={handleChange}>
                            <FormControlLabel value="あり" control={<Radio size="small" />} label="あり" />
                            <FormControlLabel value="なし" control={<Radio size="small" />} label="なし" />
                        </RadioGroup>
                    </Stack>

                    <TextField
                        fullWidth size="small" sx={{ mb: 2 }}
                        label="希望する仕事"
                        name="work_desired_job"
                        value={formData.work_desired_job || ''}
                        onChange={handleChange}
                    />

                    {/* 就労希望時期 */}
                    <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }} flexWrap="wrap">
                        <Typography variant="body2">就労希望時期</Typography>
                        <TextField size="small" label="年月" name="work_desired_date"
                            value={formData.work_desired_date || ''} onChange={handleChange}
                            placeholder="例: 2025年10月" sx={{ width: 160 }} />
                        <RadioGroup row name="work_open_close" value={formData.work_open_close || ''} onChange={handleChange}>
                            <FormControlLabel value="オープン" control={<Radio size="small" />} label="オープン" />
                            <FormControlLabel value="クローズ" control={<Radio size="small" />} label="クローズ" />
                        </RadioGroup>
                    </Stack>

                    <TextField
                        fullWidth size="small"
                        multiline minRows={2}
                        label="特記事項"
                        name="work_note"
                        value={formData.work_note || ''}
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
        </LocalizationProvider>
    );
};

export default Step4_History;
