// src/features/admin/branches/BranchDetailPage.jsx
// 支店詳細・編集ページ（マントラ強化版）
// 全フィールドをセクション別アコーディオンで表示

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    TextField,
    Button,
    Stack,
    Alert,
    CircularProgress,
    Chip,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Grid,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    Switch,
    FormControlLabel,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import StoreIcon from '@mui/icons-material/Store';
import PhoneIcon from '@mui/icons-material/Phone';
import VolunteerActivismIcon from '@mui/icons-material/VolunteerActivism';
import GroupsIcon from '@mui/icons-material/Groups';
import SettingsIcon from '@mui/icons-material/Settings';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../firebase/index';
import {
    BRANCH_SECTIONS,
    BRANCH_SECTION_CONFIG,
    BRANCH_SECTION_ORDER,
    getBranchFieldsBySection,
} from '../../../constants/branchFields';
import { lookupPostalCode, formatPostalCode } from '../../../utils/postalCodeLookup';

// セクションアイコンのマッピング
const SECTION_ICONS = {
    [BRANCH_SECTIONS.BASIC]: <StoreIcon />,
    [BRANCH_SECTIONS.CONTACT]: <PhoneIcon />,
    [BRANCH_SECTIONS.WELFARE]: <VolunteerActivismIcon />,
    [BRANCH_SECTIONS.CAPACITY]: <GroupsIcon />,
    [BRANCH_SECTIONS.ATTENDANCE]: <SettingsIcon />,
};

export default function BranchDetailPage() {
    const { branchId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [formData, setFormData] = useState({});
    const [companyName, setCompanyName] = useState('');
    const [expandedSections, setExpandedSections] = useState([BRANCH_SECTIONS.BASIC]);

    // 支店データ取得
    useEffect(() => {
        const fetchBranch = async () => {
            try {
                const docRef = doc(db, 'branches', branchId);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setFormData(data);

                    // 企業名を取得
                    if (data.companyId) {
                        const companyDoc = await getDoc(doc(db, 'companies', data.companyId));
                        if (companyDoc.exists()) {
                            setCompanyName(companyDoc.data().name);
                        }
                    }
                } else {
                    setError('支店が見つかりません');
                }
            } catch (err) {
                console.error('支店データ取得エラー:', err);
                setError('データの取得に失敗しました');
            } finally {
                setLoading(false);
            }
        };
        fetchBranch();
    }, [branchId]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        if (!formData.name?.trim()) {
            setError('支店名は必須です');
            return;
        }

        setSaving(true);
        setError(null);
        setSuccess(false);

        try {
            await updateDoc(doc(db, 'branches', branchId), {
                ...formData,
                updatedAt: serverTimestamp(),
            });
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            console.error('更新エラー:', err);
            setError('更新に失敗しました');
        } finally {
            setSaving(false);
        }
    };

    const handleAccordionChange = (section) => (event, isExpanded) => {
        if (isExpanded) {
            setExpandedSections(prev => [...prev, section]);
        } else {
            setExpandedSections(prev => prev.filter(s => s !== section));
        }
    };

    // フィールドをレンダリング
    const renderField = (field) => {
        const { key, label, type, options, placeholder, helperText, multiline } = field;
        const value = formData[key] ?? '';

        // 郵便番号
        if (key === 'postalCode') {
            return (
                <TextField
                    key={key}
                    name={key}
                    label={label}
                    value={value}
                    onChange={async (e) => {
                        const formatted = formatPostalCode(e.target.value);
                        setFormData(prev => ({ ...prev, postalCode: formatted }));

                        if (formatted.replace(/-/g, '').length === 7) {
                            const address = await lookupPostalCode(formatted);
                            if (address) {
                                setFormData(prev => ({
                                    ...prev,
                                    postalCode: formatted,
                                    prefecture: address.prefecture,
                                    city: address.city,
                                    address1: address.address1,
                                }));
                            }
                        }
                    }}
                    fullWidth
                    size="small"
                    placeholder={placeholder}
                    helperText="住所自動入力対応"
                />
            );
        }

        // Multi-Select型 (新設: serviceTypes 用)
        if (type === 'multi-select' && options) {
            const selectedValues = Array.isArray(value) ? value : [];
            return (
                <FormControl key={key} fullWidth size="small">
                    <InputLabel id={`${key}-label`}>{label}</InputLabel>
                    <Select
                        labelId={`${key}-label`}
                        name={key}
                        multiple
                        value={selectedValues}
                        label={label}
                        onChange={(e) => {
                            setFormData(prev => ({ ...prev, [key]: e.target.value }));
                        }}
                        renderValue={(selected) => (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {selected.map((val) => (
                                    <Chip
                                        key={val}
                                        label={options.find(o => o.value === val)?.label || val}
                                        size="small"
                                        color="secondary"
                                        variant="outlined"
                                        sx={{ height: 20, fontSize: '0.7rem' }}
                                    />
                                ))}
                            </Box>
                        )}
                    >
                        {options.map(opt => (
                            <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                        ))}
                    </Select>
                    {helperText && <Typography variant="caption" sx={{ mt: 0.5, ml: 1, color: 'text.secondary', display: 'block' }}>{helperText}</Typography>}
                </FormControl>
            );
        }

        // Select型
        if (type === 'select' && options) {
            return (
                <FormControl key={key} fullWidth size="small">
                    <InputLabel id={`${key}-label`}>{label}</InputLabel>
                    <Select
                        labelId={`${key}-label`}
                        name={key}
                        value={value}
                        label={label}
                        onChange={handleChange}
                    >
                        <MenuItem value="">選択してください</MenuItem>
                        {options.map(opt => (
                            <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
            );
        }

        // トグル型
        if (type === 'toggle') {
            const isChecked = formData[key] ?? field.defaultValue ?? false;
            return (
                <FormControlLabel
                    key={key}
                    control={
                        <Switch
                            checked={isChecked}
                            onChange={(e) => setFormData(prev => ({ ...prev, [key]: e.target.checked }))}
                        />
                    }
                    label={
                        <Typography variant="body2" sx={{ color: isChecked ? '#10b981' : '#94a3b8' }}>
                            {label}
                        </Typography>
                    }
                    sx={{
                        p: 1.5,
                        m: 0,
                        width: '100%',
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: isChecked ? '#10b98144' : 'rgba(255,255,255,0.05)',
                        bgcolor: isChecked ? 'rgba(16, 185, 129, 0.05)' : 'transparent',
                    }}
                />
            );
        }

        // 通常のテキストフィールド
        return (
            <TextField
                key={key}
                name={key}
                label={label}
                type={type === 'number' ? 'number' : type === 'date' ? 'date' : 'text'}
                value={value}
                onChange={handleChange}
                fullWidth
                size="small"
                placeholder={placeholder}
                helperText={helperText}
                multiline={multiline}
                rows={multiline ? 3 : 1}
                InputLabelProps={type === 'date' ? { shrink: true } : undefined}
            />
        );
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: '#0f172a' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 4, bgcolor: '#0f172a', minHeight: '100vh' }}>
            {/* ヘッダー */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Button
                        startIcon={<ArrowBackIcon />}
                        onClick={() => navigate('/admin/branches')}
                        sx={{ mr: 2, color: '#94a3b8' }}
                    >
                        戻る
                    </Button>
                    <Typography variant="h5" fontWeight="bold" sx={{ color: '#f1f5f9' }}>
                        支店詳細設定
                    </Typography>
                    {companyName && (
                        <Chip
                            label={companyName}
                            size="small"
                            sx={{ ml: 2, bgcolor: 'rgba(6, 182, 212, 0.1)', color: '#06b6d4', border: '1px solid #06b6d4' }}
                        />
                    )}
                </Box>
                <Button
                    variant="contained"
                    startIcon={<SaveIcon />}
                    onClick={handleSave}
                    disabled={saving}
                    sx={{ bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' }, borderRadius: 2 }}
                >
                    {saving ? '保存中...' : '変更を保存'}
                </Button>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }}>支店情報を更新しました</Alert>}

            {/* セクション別アコーディオン */}
            <Stack spacing={2}>
                {BRANCH_SECTION_ORDER.map(section => {
                    const config = BRANCH_SECTION_CONFIG[section];
                    const fields = getBranchFieldsBySection(section);

                    return (
                        <Accordion
                            key={section}
                            expanded={expandedSections.includes(section)}
                            onChange={handleAccordionChange(section)}
                            sx={{
                                backgroundColor: 'rgba(30, 41, 59, 0.4)',
                                color: '#e2e8f0',
                                border: `1px solid ${config.color}33`,
                                borderRadius: '8px !important',
                                overflow: 'hidden',
                                '&:before': { display: 'none' },
                            }}
                        >
                            <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: config.color }} />}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    <Box sx={{ color: config.color, display: 'flex' }}>{SECTION_ICONS[section]}</Box>
                                    <Typography sx={{ color: config.color, fontWeight: 'bold' }}>
                                        {config.label}
                                    </Typography>
                                </Box>
                            </AccordionSummary>
                            <AccordionDetails sx={{ bgcolor: 'rgba(15, 23, 42, 0.2)', p: 3 }}>
                                <Grid container spacing={3}>
                                    {fields.map(field => (
                                        <Grid item xs={12} sm={6} md={field.multiline ? 12 : 4} key={field.key}>
                                            {renderField(field)}
                                        </Grid>
                                    ))}
                                </Grid>
                            </AccordionDetails>
                        </Accordion>
                    );
                })}
            </Stack>
        </Box>
    );
}
