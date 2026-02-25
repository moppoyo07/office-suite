// src/features/admin/companies/CompanyDetailPage.jsx
// 企業詳細・編集ページ（強化版）
// 全フィールドをセクション別アコーディオンで表示

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
    Box,
    Typography,
    Paper,
    TextField,
    Button,
    Stack,
    Alert,
    CircularProgress,
    Divider,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    Chip,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Grid,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import BusinessIcon from '@mui/icons-material/Business';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import PhoneIcon from '@mui/icons-material/Phone';
import BadgeIcon from '@mui/icons-material/Badge';
import WorkIcon from '@mui/icons-material/Work';
import VolunteerActivismIcon from '@mui/icons-material/VolunteerActivism';
import SavingsIcon from '@mui/icons-material/Savings';
import PeopleIcon from '@mui/icons-material/People';
import StoreIcon from '@mui/icons-material/Store';
import { doc, getDoc, updateDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../firebase/index';
import {
    COMPANY_SECTIONS,
    COMPANY_SECTION_CONFIG,
    COMPANY_SECTION_ORDER,
    getCompanyFieldsBySection,
} from '../../../constants/companyFields';
import { lookupPostalCode, formatPostalCode } from '../../../utils/postalCodeLookup';

// セクションアイコンのマッピング
const SECTION_ICONS = {
    [COMPANY_SECTIONS.BASIC]: <BusinessIcon />,
    [COMPANY_SECTIONS.CORPORATE]: <AccountBalanceIcon />,
    [COMPANY_SECTIONS.CONTACT]: <PhoneIcon />,
    [COMPANY_SECTIONS.LABOR]: <BadgeIcon />,
    [COMPANY_SECTIONS.HELLOWORK]: <WorkIcon />,
    [COMPANY_SECTIONS.WELFARE]: <VolunteerActivismIcon />,
    [COMPANY_SECTIONS.BANK]: <SavingsIcon />,
    [COMPANY_SECTIONS.ADVISOR]: <PeopleIcon />,
};

export default function CompanyDetailPage() {
    const { companyId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [formData, setFormData] = useState({});
    const [branches, setBranches] = useState([]);
    const [expandedSections, setExpandedSections] = useState([COMPANY_SECTIONS.BASIC]);

    // 企業データ取得
    useEffect(() => {
        const fetchCompany = async () => {
            try {
                const docRef = doc(db, 'companies', companyId);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setFormData(docSnap.data());
                } else {
                    setError('企業が見つかりません');
                }
            } catch (err) {
                console.error('企業データ取得エラー:', err);
                setError('データの取得に失敗しました');
            } finally {
                setLoading(false);
            }
        };
        fetchCompany();
    }, [companyId]);

    // 支店データ取得
    useEffect(() => {
        const fetchBranches = async () => {
            try {
                const q = query(collection(db, 'branches'), where('companyId', '==', companyId));
                const snapshot = await getDocs(q);
                setBranches(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            } catch (err) {
                console.error('支店データ取得エラー:', err);
            }
        };
        if (companyId) fetchBranches();
    }, [companyId]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        if (!formData.name?.trim()) {
            setError('企業名は必須です');
            return;
        }

        setSaving(true);
        setError(null);
        setSuccess(false);

        try {
            await updateDoc(doc(db, 'companies', companyId), {
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
        const { key, label, type, options, placeholder, helperText, sensitive } = field;
        const value = formData[key] ?? '';

        // 郵便番号フィールド（特別処理）
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
                    helperText="7桁入力で住所を自動入力"
                />
            );
        }

        // Multi-Select型 (serviceTypes など)
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
                                        color="primary"
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
                    {helperText && <Typography variant="caption" sx={{ mt: 0.5, ml: 1.5, display: 'block', color: 'text.secondary' }}>{helperText}</Typography>}
                </FormControl>
            );
        }

        // Select型 (通常)
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
                    {helperText && <Typography variant="caption" sx={{ mt: 0.5, ml: 1.5, display: 'block', color: 'text.secondary' }}>{helperText}</Typography>}
                </FormControl>
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
                InputLabelProps={type === 'date' ? { shrink: true } : undefined}
                InputProps={{
                    ...(sensitive && { type: 'password' }),
                }}
            />
        );
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4, height: '100vh', alignItems: 'center' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            {/* ヘッダー */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Button
                        startIcon={<ArrowBackIcon />}
                        onClick={() => navigate('/admin/companies')}
                        sx={{ mr: 2, color: '#94a3b8' }}
                    >
                        戻る
                    </Button>
                    <Typography variant="h5" fontWeight="bold">
                        企業詳細設定
                    </Typography>
                    <Chip
                        label={`${branches.length} 支店`}
                        size="small"
                        sx={{ ml: 2, bgcolor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid #10b981' }}
                    />
                </Box>
                <Button
                    variant="contained"
                    startIcon={<SaveIcon />}
                    onClick={handleSave}
                    disabled={saving}
                    sx={{ bgcolor: '#06b6d4', '&:hover': { bgcolor: '#0891b2' }, borderRadius: 2 }}
                >
                    {saving ? '保存中...' : '変更を保存'}
                </Button>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }}>設定を保存しました</Alert>}

            {/* セクション別アコーディオン */}
            <Stack spacing={2}>
                {COMPANY_SECTION_ORDER.map(section => {
                    const config = COMPANY_SECTION_CONFIG[section];
                    const fields = getCompanyFieldsBySection(section);

                    return (
                        <Accordion
                            key={section}
                            expanded={expandedSections.includes(section)}
                            onChange={handleAccordionChange(section)}
                            sx={{
                                backgroundColor: 'rgba(30, 41, 59, 0.5)',
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
                            <AccordionDetails sx={{ bgcolor: 'rgba(15, 23, 42, 0.3)', p: 3 }}>
                                <Grid container spacing={3}>
                                    {fields.map(field => (
                                        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={field.key}>
                                            {renderField(field)}
                                        </Grid>
                                    ))}
                                </Grid>
                            </AccordionDetails>
                        </Accordion>
                    );
                })}
            </Stack>

            {/* 支店一覧 */}
            <Paper sx={{ p: 3, mt: 3, backgroundColor: 'rgba(30, 41, 59, 0.3)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: 1 }}>
                        <StoreIcon />
                        登録支店
                    </Typography>
                    <Button
                        component={RouterLink}
                        to={`/admin/branches/new?companyId=${companyId}`}
                        startIcon={<AddIcon />}
                        size="small"
                        variant="outlined"
                        sx={{ color: '#10b981', borderColor: '#10b981' }}
                    >
                        支店を追加
                    </Button>
                </Box>
                <Divider sx={{ mb: 2, borderColor: 'rgba(255,255,255,0.05)' }} />
                {branches.length === 0 ? (
                    <Typography color="text.secondary" variant="body2">登録されている支店はありません</Typography>
                ) : (
                    <List dense>
                        {branches.map(branch => (
                            <ListItem key={branch.id} sx={{ px: 0 }}>
                                <ListItemText
                                    primary={branch.name}
                                    secondary={branch.address}
                                    primaryTypographyProps={{ color: '#f1f5f9', fontWeight: 'bold' }}
                                    secondaryTypographyProps={{ color: '#94a3b8' }}
                                />
                                <ListItemSecondaryAction>
                                    <Chip label={`${branch.userCount || 0}名`} size="small" variant="outlined" sx={{ color: '#94a3b8' }} />
                                </ListItemSecondaryAction>
                            </ListItem>
                        ))}
                    </List>
                )}
            </Paper>
        </Box>
    );
}
