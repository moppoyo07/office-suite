// src/features/settings/ChargeMasterEditor.jsx
// 加算マスター コンパネ（支援業務設定のタブから呼ばれる）
// 加算ごとに「算定単位を年度別に登録」しておく台帳。将来の請求計算の土台。

import { useState } from 'react';
import {
    Box, Paper, Typography, Button, IconButton, Chip, Alert, CircularProgress,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Dialog, DialogTitle, DialogContent, DialogActions, TextField,
    Select, MenuItem, FormControl, InputLabel, Stack, Divider, OutlinedInput,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useTenant } from '../../context/TenantContext';
import { useChargeMaster } from '../../hooks/useChargeMaster';
import {
    UNIT_TYPES, UNIT_TYPE_LABELS, CHARGE_TARGET_SERVICES,
    getFiscalYear, getUnitForYear,
} from '../../constants/chargeMaster';

const SERVICE_LABELS = Object.fromEntries(CHARGE_TARGET_SERVICES.map(s => [s.value, s.label]));

const emptyCharge = () => ({
    key: '',
    name: '',
    unitType: 'day',
    targetServices: ['transition', 'typeA', 'typeB'],
    homeEligible: false,
    units: {},
    active: true,
});

export default function ChargeMasterEditor() {
    const { activeCompanyId } = useTenant();
    const { charges, loading, upsert, remove, seedDefaults } = useChargeMaster(activeCompanyId);

    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editing, setEditing] = useState(null); // 編集中の加算（null=閉）
    const [isNew, setIsNew] = useState(false);

    const fiscalYear = getFiscalYear();

    const handleSeed = async () => {
        setSaving(true);
        setMessage({ type: '', text: '' });
        try {
            await seedDefaults();
            setMessage({ type: 'success', text: '初期データを投入しました' });
        } catch (err) {
            console.error(err);
            setMessage({ type: 'error', text: '初期投入に失敗しました' });
        } finally {
            setSaving(false);
        }
    };

    const openNew = () => {
        setEditing(emptyCharge());
        setIsNew(true);
        setDialogOpen(true);
    };

    const openEdit = (charge) => {
        setEditing({ ...emptyCharge(), ...charge, units: { ...(charge.units || {}) } });
        setIsNew(false);
        setDialogOpen(true);
    };

    const handleDelete = async (charge) => {
        if (!window.confirm(`「${charge.name}」を削除しますか？`)) return;
        try {
            await remove(charge.key);
        } catch (err) {
            console.error(err);
            setMessage({ type: 'error', text: '削除に失敗しました' });
        }
    };

    // ON/OFF（有効/無効）を一覧から直接切替。無効にすると全画面の加算チップから消える。
    const handleToggleActive = async (charge) => {
        try {
            await upsert({ ...charge, active: charge.active === false });
        } catch (err) {
            console.error(err);
            setMessage({ type: 'error', text: '状態の更新に失敗しました' });
        }
    };

    const handleSave = async () => {
        if (!editing.key.trim()) { setMessage({ type: 'error', text: 'キーは必須です' }); return; }
        if (!editing.name.trim()) { setMessage({ type: 'error', text: '加算名は必須です' }); return; }
        if (isNew && charges.some(c => c.key === editing.key.trim())) {
            setMessage({ type: 'error', text: `キー「${editing.key.trim()}」は既に存在します` });
            return;
        }
        setSaving(true);
        setMessage({ type: '', text: '' });
        try {
            // units の値を数値化（空文字は除外）
            const cleanUnits = {};
            Object.entries(editing.units || {}).forEach(([y, v]) => {
                if (v !== '' && v != null && !Number.isNaN(Number(v))) cleanUnits[y] = Number(v);
            });
            await upsert({ ...editing, key: editing.key.trim(), name: editing.name.trim(), units: cleanUnits });
            setMessage({ type: 'success', text: '保存しました' });
            setDialogOpen(false);
            setEditing(null);
        } catch (err) {
            console.error(err);
            setMessage({ type: 'error', text: '保存に失敗しました' });
        } finally {
            setSaving(false);
        }
    };

    // --- ダイアログ内: 年度別単位の編集 ---
    const setUnitYear = (oldYear, newYear) => {
        setEditing(prev => {
            const units = { ...prev.units };
            const val = units[oldYear];
            delete units[oldYear];
            units[newYear] = val;
            return { ...prev, units };
        });
    };
    const setUnitValue = (year, value) => {
        setEditing(prev => ({ ...prev, units: { ...prev.units, [year]: value } }));
    };
    const removeUnitYear = (year) => {
        setEditing(prev => {
            const units = { ...prev.units };
            delete units[year];
            return { ...prev, units };
        });
    };
    const addUnitYear = () => {
        setEditing(prev => {
            const existing = Object.keys(prev.units).map(Number);
            const nextYear = String(existing.length ? Math.max(...existing) + 1 : fiscalYear);
            if (prev.units[nextYear] !== undefined) return prev;
            return { ...prev, units: { ...prev.units, [nextYear]: '' } };
        });
    };

    if (loading) {
        return <Box sx={{ textAlign: 'center', py: 4 }}><CircularProgress /></Box>;
    }

    if (!activeCompanyId) {
        return <Alert severity="warning">事業所が選択されていません</Alert>;
    }

    return (
        <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                加算ごとの算定単位を「年度別」に登録しておく台帳です。報酬改定で単位が変わったら年度を追加してください。
                ここで登録した単位は、将来サービス記録の加算と突き合わせて請求計算に使います。
            </Typography>

            {message.text && (
                <Alert severity={message.type || 'info'} sx={{ mb: 2 }} onClose={() => setMessage({ type: '', text: '' })}>
                    {message.text}
                </Alert>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight="bold">
                    加算マスター（{fiscalYear}年度の単位を表示）
                </Typography>
                <Stack direction="row" spacing={1}>
                    {charges.length === 0 && (
                        <Button variant="outlined" size="small" onClick={handleSeed} disabled={saving}>
                            初期データを投入
                        </Button>
                    )}
                    <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={openNew}>
                        加算を追加
                    </Button>
                </Stack>
            </Box>

            <TableContainer component={Paper} sx={{ bgcolor: 'background.paper' }}>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>加算名</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>算定単位</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>対象サービス</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }} align="center">在宅算定</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }} align="right">{fiscalYear}年度 単位</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }} align="center">ON/OFF</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }} align="center">操作</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {charges.map((c) => {
                            const unit = getUnitForYear(c, fiscalYear);
                            return (
                                <TableRow key={c.key} hover sx={{ opacity: c.active === false ? 0.5 : 1 }}>
                                    <TableCell>
                                        {c.name}
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                            {c.key}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>{UNIT_TYPE_LABELS[c.unitType] || c.unitType}</TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                            {(c.targetServices || []).map(s => (
                                                <Chip key={s} label={SERVICE_LABELS[s] || s} size="small" variant="outlined" />
                                            ))}
                                        </Box>
                                    </TableCell>
                                    <TableCell align="center">{c.homeEligible ? '○' : '×'}</TableCell>
                                    <TableCell align="right">
                                        {unit != null
                                            ? <strong>{unit}</strong>
                                            : <Typography variant="caption" color="warning.main">未登録</Typography>}
                                    </TableCell>
                                    <TableCell align="center">
                                        <Chip
                                            label={c.active === false ? 'OFF' : 'ON'}
                                            size="small"
                                            color={c.active === false ? 'default' : 'success'}
                                            onClick={() => handleToggleActive(c)}
                                            sx={{ cursor: 'pointer', minWidth: 48 }}
                                        />
                                    </TableCell>
                                    <TableCell align="center">
                                        <IconButton size="small" onClick={() => openEdit(c)}><EditIcon fontSize="small" /></IconButton>
                                        <IconButton size="small" color="error" onClick={() => handleDelete(c)}><DeleteIcon fontSize="small" /></IconButton>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                        {charges.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                                    加算がありません。「初期データを投入」または「加算を追加」してください。
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* 編集ダイアログ */}
            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>{isNew ? '加算を追加' : '加算を編集'}</DialogTitle>
                <DialogContent>
                    {editing && (
                        <Stack spacing={2} sx={{ mt: 1 }}>
                            <TextField
                                label="キー（key）"
                                value={editing.key}
                                onChange={(e) => setEditing(p => ({ ...p, key: e.target.value }))}
                                disabled={!isNew}
                                size="small"
                                helperText="サービス記録の serviceDetails と一致させるID（保存後は変更不可）"
                            />
                            <TextField
                                label="加算名"
                                value={editing.name}
                                onChange={(e) => setEditing(p => ({ ...p, name: e.target.value }))}
                                size="small"
                            />
                            <FormControl size="small">
                                <InputLabel>算定単位</InputLabel>
                                <Select
                                    label="算定単位"
                                    value={editing.unitType}
                                    onChange={(e) => setEditing(p => ({ ...p, unitType: e.target.value }))}
                                >
                                    {UNIT_TYPES.map(u => <MenuItem key={u.value} value={u.value}>{u.label}</MenuItem>)}
                                </Select>
                            </FormControl>
                            <FormControl size="small">
                                <InputLabel>対象サービス</InputLabel>
                                <Select
                                    multiple
                                    label="対象サービス"
                                    value={editing.targetServices}
                                    onChange={(e) => setEditing(p => ({ ...p, targetServices: e.target.value }))}
                                    input={<OutlinedInput label="対象サービス" />}
                                    renderValue={(selected) => selected.map(s => SERVICE_LABELS[s] || s).join('、')}
                                >
                                    {CHARGE_TARGET_SERVICES.map(s => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
                                </Select>
                            </FormControl>
                            <Stack direction="row" spacing={2}>
                                <FormControl size="small" sx={{ flex: 1 }}>
                                    <InputLabel>在宅で算定</InputLabel>
                                    <Select
                                        label="在宅で算定"
                                        value={editing.homeEligible ? 'yes' : 'no'}
                                        onChange={(e) => setEditing(p => ({ ...p, homeEligible: e.target.value === 'yes' }))}
                                    >
                                        <MenuItem value="yes">○ 可</MenuItem>
                                        <MenuItem value="no">× 不可</MenuItem>
                                    </Select>
                                </FormControl>
                                <FormControl size="small" sx={{ flex: 1 }}>
                                    <InputLabel>状態</InputLabel>
                                    <Select
                                        label="状態"
                                        value={editing.active === false ? 'off' : 'on'}
                                        onChange={(e) => setEditing(p => ({ ...p, active: e.target.value === 'on' }))}
                                    >
                                        <MenuItem value="on">有効</MenuItem>
                                        <MenuItem value="off">無効</MenuItem>
                                    </Select>
                                </FormControl>
                            </Stack>

                            <Divider />

                            <Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                    <Typography variant="subtitle2">年度別の単位</Typography>
                                    <Button size="small" startIcon={<AddIcon />} onClick={addUnitYear}>年度を追加</Button>
                                </Box>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                                    その年度以降に適用されます（例: 2024に登録 → 次の改定年まで2024の単位を使用）。
                                </Typography>
                                <Stack spacing={1}>
                                    {Object.keys(editing.units).sort().map((year) => (
                                        <Stack key={year} direction="row" spacing={1} alignItems="center">
                                            <TextField
                                                label="年度"
                                                type="number"
                                                size="small"
                                                value={year}
                                                onChange={(e) => setUnitYear(year, e.target.value)}
                                                sx={{ width: 110 }}
                                            />
                                            <TextField
                                                label="単位"
                                                type="number"
                                                size="small"
                                                value={editing.units[year]}
                                                onChange={(e) => setUnitValue(year, e.target.value)}
                                                sx={{ flex: 1 }}
                                            />
                                            <IconButton size="small" color="error" onClick={() => removeUnitYear(year)}>
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </Stack>
                                    ))}
                                    {Object.keys(editing.units).length === 0 && (
                                        <Typography variant="body2" color="text.secondary">
                                            まだ単位が登録されていません。
                                        </Typography>
                                    )}
                                </Stack>
                            </Box>
                        </Stack>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDialogOpen(false)}>キャンセル</Button>
                    <Button variant="contained" onClick={handleSave} disabled={saving}>
                        {saving ? '保存中...' : '保存'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
