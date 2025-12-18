// RelatedOrgsSection.jsx (2カラムレイアウト版・Grid修正済み)

import { Box, Typography, Divider, Stack, TextField, Button, Grid } from '@mui/material';
import { Paper } from '@mui/material';

// --- 表示モード用の小さな部品 ---
const DisplayGroup = ({ title, fields }) => (
    <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>{title}</Typography>
        <Grid container spacing={2}>
            {fields.map(field => (
                // ▼▼▼ 修正: itemを削除し、sizeプロパティに変更 ▼▼▼
                <Grid size={{ xs: 12, sm: field.sm || 4 }} key={field.label}>
                    <Typography variant="caption" color="text.secondary">{field.label}</Typography>
                    <Typography variant="body1" sx={{ pl: 1 }}>{field.value || '未設定'}</Typography>
                </Grid>
            ))}
        </Grid>
    </Box>
);

// --- 編集モード用の入力部品 ---
const EditGroup = ({ title, children }) => (
    <Box>
        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>{title}</Typography>
        <Stack spacing={2}>
            {children}
        </Stack>
    </Box>
);

const RelatedOrgsSection = ({ isEditing, data, handleChange, handleSave, handleCancelEdit }) => {
    
    return (
        <Box>
            <Typography variant="h5" gutterBottom>連絡先・関係機関</Typography>
            <Divider sx={{ my: 1.5 }} />

            {isEditing ? (
                // --- ★★★ 編集モード (2カラム) ★★★ ---
                <Stack component="form" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                    <Grid container spacing={4}>
                        {/* === 左カラム: 緊急連絡先 === */}
                        {/* ▼▼▼ 修正: itemを削除し、sizeプロパティに変更 ▼▼▼ */}
                        <Grid size={{ xs: 12, md: 6 }}>
                            <EditGroup title="緊急連絡先">
                                {[1, 2, 3].map(num => (
                                    <Paper key={num} variant="outlined" sx={{ p: 2 }}>
                                        <Typography variant="caption">緊急連絡先 {num}</Typography>
                                        <Stack spacing={2} sx={{ mt: 1 }}>
                                            <TextField size="small" name={`emergencyContact${num}_name`} label="氏名" value={data[`emergencyContact${num}_name`] || ''} onChange={handleChange} fullWidth />
                                            <TextField size="small" name={`emergencyContact${num}_relationship`} label="続柄" value={data[`emergencyContact${num}_relationship`] || ''} onChange={handleChange} fullWidth />
                                            <TextField size="small" name={`emergencyContact${num}_phone`} label="電話番号" value={data[`emergencyContact${num}_phone`] || ''} onChange={handleChange} fullWidth />
                                        </Stack>
                                    </Paper>
                                ))}
                            </EditGroup>
                        </Grid>
                        
                        {/* === 右カラム: それ以外 === */}
                        {/* ▼▼▼ 修正: itemを削除し、sizeプロパティに変更 ▼▼▼ */}
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Stack spacing={4}>
                                <EditGroup title="かかりつけ医療機関 1">
                                    <TextField size="small" name="medicalInstitution1_name" label="病院名" value={data?.medicalInstitution1_name || ''} onChange={handleChange} fullWidth />
                                    <TextField size="small" name="medicalInstitution1_phone" label="電話番号" value={data?.medicalInstitution1_phone || ''} onChange={handleChange} fullWidth />
                                    <TextField size="small" name="medicalInstitution1_doctor" label="担当医" value={data?.medicalInstitution1_doctor || ''} onChange={handleChange} fullWidth />
                                    <TextField size="small" name="medicalInstitution1_department" label="受診科目" value={data?.medicalInstitution1_department || ''} onChange={handleChange} fullWidth />
                                </EditGroup>
                                 <EditGroup title="かかりつけ医療機関 2">
                                    <TextField size="small" name="medicalInstitution2_name" label="病院名" value={data?.medicalInstitution2_name || ''} onChange={handleChange} fullWidth />
                                    <TextField size="small" name="medicalInstitution2_phone" label="電話番号" value={data?.medicalInstitution2_phone || ''} onChange={handleChange} fullWidth />
                                </EditGroup>
                                <EditGroup title="相談支援事業所">
                                    <TextField size="small" name="supportCenter_name" label="事業所名" value={data?.supportCenter_name || ''} onChange={handleChange} fullWidth />
                                    <TextField size="small" name="supportCenter_contactPerson" label="担当者名" value={data?.supportCenter_contactPerson || ''} onChange={handleChange} fullWidth />
                                    <TextField size="small" name="supportCenter_phone" label="電話番号" value={data?.supportCenter_phone || ''} onChange={handleChange} fullWidth />
                                </EditGroup>
                            </Stack>
                        </Grid>
                    </Grid>

                    <Box sx={{ display: 'flex', gap: 1, pt: 2, mt: 3, borderTop: '1px solid rgba(0, 0, 0, 0.12)' }}>
                        <Button type="submit" variant="contained">このセクションを保存</Button>
                        <Button variant="outlined" onClick={handleCancelEdit}>キャンセル</Button>
                    </Box>
                </Stack>
            ) : (
                // --- ★★★ 表示モード (2カラム) ★★★ ---
                <Grid container spacing={14}>
                    {/* === 左カラム: 緊急連絡先 === */}
                    {/* ▼▼▼ 修正: itemを削除し、sizeプロパティに変更 ▼▼▼ */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <DisplayGroup title="緊急連絡先 1" fields={[
                            { label: '氏名', value: data?.emergencyContact1_name },
                            { label: '続柄', value: data?.emergencyContact1_relationship },
                            { label: '電話番号', value: data?.emergencyContact1_phone },
                        ]} />
                         <DisplayGroup title="緊急連絡先 2" fields={[
                            { label: '氏名', value: data?.emergencyContact2_name },
                            { label: '続柄', value: data?.emergencyContact2_relationship },
                            { label: '電話番号', value: data?.emergencyContact2_phone },
                        ]} />
                         <DisplayGroup title="緊急連絡先 3" fields={[
                            { label: '氏名', value: data?.emergencyContact3_name },
                            { label: '続柄', value: data?.emergencyContact3_relationship },
                            { label: '電話番号', value: data?.emergencyContact3_phone },
                        ]} />
                    </Grid>
                    
                    {/* === 右カラム: それ以外 === */}
                    {/* ▼▼▼ 修正: itemを削除し、sizeプロパティに変更 ▼▼▼ */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <DisplayGroup title="かかりつけ医療機関 1" fields={[
                            { label: '病院名', value: data?.medicalInstitution1_name },
                            { label: '電話番号', value: data?.medicalInstitution1_phone },
                            { label: '担当医', value: data?.medicalInstitution1_doctor },
                            { label: '受診科目', value: data?.medicalInstitution1_department },
                        ]} />
                        <DisplayGroup title="かかりつけ医療機関 2" fields={[
                            { label: '病院名', value: data?.medicalInstitution2_name },
                            { label: '電話番号', value: data?.medicalInstitution2_phone },
                        ]} />
                        <DisplayGroup title="相談支援事業所" fields={[
                            { label: '事業所名', value: data?.supportCenter_name },
                            { label: '担当者名', value: data?.supportCenter_contactPerson },
                            { label: '電話番号', value: data?.supportCenter_phone },
                        ]} />
                    </Grid>
                </Grid>
            )}
        </Box>
    );
};

export default RelatedOrgsSection;