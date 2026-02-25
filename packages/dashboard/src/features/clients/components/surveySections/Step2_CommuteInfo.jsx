import React from 'react';
import {
    Stack, Box, Typography, TextField, Button, Grid, Paper,
    Checkbox, FormControlLabel, IconButton, FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

// 交通機関タイプの選択肢
const TRANSPORT_TYPES = [
    { value: 'bus', label: 'バス' },
    { value: 'jr', label: 'JR' },
    { value: 'private_rail', label: '地下鉄・私鉄' },
];

// 空の経路テンプレート
const createEmptyRoute = () => ({
    transportType: '', // 'bus' | 'jr' | 'private_rail'
    line: '',          // 路線名（JR/私鉄用）
    from: '',          // 乗車地点
    to: '',            // 降車地点
    fare: '',          // 片道運賃
});

const Step2_CommuteInfo = ({ formData, setFormData, handleChange, nextStep, prevStep }) => {

    // --- 経路配列の状態管理 ---
    // formData.commute_routes_input に動的経路配列を保持
    const routes = formData.commute_routes_input || [createEmptyRoute()];

    const updateRoutes = (newRoutes) => {
        setFormData({ commute_routes_input: newRoutes });
    };

    // 経路を追加
    const handleAddRoute = () => {
        updateRoutes([...routes, createEmptyRoute()]);
    };

    // 経路を削除
    const handleRemoveRoute = (index) => {
        if (routes.length <= 1) return; // 最低1つは残す
        updateRoutes(routes.filter((_, i) => i !== index));
    };

    // 経路のフィールドを更新
    const handleRouteFieldChange = (index, field, value) => {
        const updated = [...routes];
        updated[index] = { ...updated[index], [field]: value };
        updateRoutes(updated);
    };

    // --- 交通機関タイプに応じたフィールドを表示 ---
    const renderRouteFields = (route, index) => {
        if (!route.transportType) return null;

        const isTrain = route.transportType === 'jr' || route.transportType === 'private_rail';
        const fromLabel = route.transportType === 'bus' ? '乗車バス停' : '乗車駅';
        const toLabel = route.transportType === 'bus' ? '降車バス停' : '降車駅';

        return (
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
                {isTrain && (
                    <Grid item xs={12} sm={3}>
                        <TextField
                            fullWidth size="small"
                            label="路線名"
                            value={route.line || ''}
                            onChange={(e) => handleRouteFieldChange(index, 'line', e.target.value)}
                            placeholder={route.transportType === 'jr' ? '例: 山陽本線' : '例: アストラムライン'}
                        />
                    </Grid>
                )}
                <Grid item xs={6} sm={isTrain ? 3 : 4}>
                    <TextField
                        fullWidth size="small"
                        label={fromLabel}
                        value={route.from || ''}
                        onChange={(e) => handleRouteFieldChange(index, 'from', e.target.value)}
                    />
                </Grid>
                <Grid item xs={6} sm={isTrain ? 3 : 4}>
                    <TextField
                        fullWidth size="small"
                        label={toLabel}
                        value={route.to || ''}
                        onChange={(e) => handleRouteFieldChange(index, 'to', e.target.value)}
                    />
                </Grid>
                <Grid item xs={12} sm={isTrain ? 3 : 4}>
                    <TextField
                        fullWidth size="small" type="number"
                        label="片道運賃（円）"
                        value={route.fare || ''}
                        onChange={(e) => handleRouteFieldChange(index, 'fare', e.target.value)}
                    />
                </Grid>
            </Grid>
        );
    };

    // --- handleNext で commuteRoutes を生成 ---
    const handleNextWithLogic = () => {
        const commuteRoutes = [];
        let totalMonthlyPass = 0;

        // 動的経路から commuteRoutes を生成
        routes.forEach((route) => {
            if (!route.transportType) return;

            const typeMap = { bus: 'bus', jr: 'train', private_rail: 'train' };
            const companyMap = { bus: null, jr: 'JR', private_rail: route.line || '' };
            const noteMap = {
                bus: 'バス',
                jr: `JR${route.line ? ' ' + route.line : ''}`,
                private_rail: route.line || '私鉄',
            };

            commuteRoutes.push({
                type: typeMap[route.transportType],
                from: route.from,
                to: route.to,
                cost: Number(route.fare || 0),
                paymentMethod: formData.commute_use_pass ? 'pass' : 'daily',
                company: companyMap[route.transportType],
                note: noteMap[route.transportType],
            });
        });

        // その他（車・自転車・徒歩）
        if (formData.commute_other) {
            commuteRoutes.push({
                type: 'other',
                note: formData.commute_other_detail || '',
                cost: 0,
            });
        }

        // 定期代
        if (formData.commute_use_pass) {
            totalMonthlyPass = Number(formData.commute_pass_cost || 0);
        }

        // 日額合計
        const dailyTotal = commuteRoutes
            .filter(r => r.paymentMethod !== 'pass')
            .reduce((sum, r) => sum + (r.cost || 0), 0);

        const updates = {
            commuteRoutes,
            commuteMonthlyPass: totalMonthlyPass,
            commuteTotalFare: dailyTotal,
        };

        setFormData(prev => ({ ...prev, ...updates }));
        nextStep();
    };


    return (
        <Box>
            <Typography variant="h5" component="h2" gutterBottom>
                ステップ2：通所経路・交通費
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                事業所への通所経路を教えてください。乗り換えがある場合は「＋ 経路を追加」で追加してください。
            </Typography>

            <Stack spacing={2}>
                {/* --- 動的経路リスト --- */}
                {routes.map((route, index) => (
                    <Paper
                        key={index}
                        variant="outlined"
                        sx={{ p: 2, borderColor: 'divider', position: 'relative' }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', minWidth: 50 }}>
                                経路{index + 1}
                            </Typography>
                            <FormControl size="small" sx={{ minWidth: 180 }}>
                                <InputLabel>交通機関</InputLabel>
                                <Select
                                    value={route.transportType}
                                    label="交通機関"
                                    onChange={(e) => handleRouteFieldChange(index, 'transportType', e.target.value)}
                                >
                                    {TRANSPORT_TYPES.map(t => (
                                        <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            {routes.length > 1 && (
                                <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => handleRemoveRoute(index)}
                                    sx={{ ml: 'auto' }}
                                    title="この経路を削除"
                                >
                                    <DeleteOutlineIcon />
                                </IconButton>
                            )}
                        </Box>

                        {renderRouteFields(route, index)}
                    </Paper>
                ))}

                {/* 経路追加ボタン */}
                <Button
                    variant="outlined"
                    startIcon={<AddCircleOutlineIcon />}
                    onClick={handleAddRoute}
                    sx={{ alignSelf: 'flex-start' }}
                >
                    経路を追加（乗り換え）
                </Button>

                {/* --- その他（車・自転車・徒歩） --- */}
                <Paper variant="outlined" sx={{ p: 2 }}>
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={formData.commute_other || false}
                                onChange={(e) => handleChange({ target: { name: 'commute_other', value: e.target.checked } })}
                            />
                        }
                        label={<Typography fontWeight="bold">その他（車・自転車・徒歩など）</Typography>}
                    />
                    {formData.commute_other && (
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ ml: 4, mt: 1 }}>
                            <TextField
                                fullWidth size="small"
                                label="詳細"
                                name="commute_other_detail"
                                value={formData.commute_other_detail || ''}
                                onChange={handleChange}
                                placeholder="自家用車、自転車など"
                            />
                            <TextField
                                size="small" type="number"
                                label="片道距離（km）"
                                name="commute_distance"
                                value={formData.commute_distance || ''}
                                onChange={handleChange}
                                sx={{ width: 160 }}
                            />
                        </Stack>
                    )}
                </Paper>

                {/* --- 定期券セクション --- */}
                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'action.hover' }}>
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={formData.commute_use_pass || false}
                                onChange={(e) => handleChange({ target: { name: 'commute_use_pass', value: e.target.checked } })}
                            />
                        }
                        label={<Typography fontWeight="bold">定期券を利用する</Typography>}
                    />
                    {formData.commute_use_pass && (
                        <Box sx={{ ml: 4, mt: 1 }}>
                            <TextField
                                size="small" type="number"
                                label="定期代（1ヶ月 / 円）"
                                name="commute_pass_cost"
                                value={formData.commute_pass_cost || ''}
                                onChange={handleChange}
                                sx={{ width: 200 }}
                            />
                        </Box>
                    )}
                </Paper>
            </Stack>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                <Button onClick={prevStep}>
                    前へ戻る
                </Button>
                <Button variant="contained" onClick={handleNextWithLogic}>
                    次へ進む
                </Button>
            </Box>
        </Box>
    );
};

export default Step2_CommuteInfo;
