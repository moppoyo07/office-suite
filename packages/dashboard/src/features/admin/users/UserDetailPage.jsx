// src/features/admin/users/UserDetailPage.jsx
// ユーザー詳細・編集ページ（強化版）
// 全フィールドをセクション別アコーディオンで表示

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Paper,
    TextField,
    Button,
    Stack,
    Alert,
    CircularProgress,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    Chip,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Switch,
    FormControlLabel,
    Grid,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PersonIcon from '@mui/icons-material/Person';
import BusinessIcon from '@mui/icons-material/Business';
import BadgeIcon from '@mui/icons-material/Badge';
import PhoneIcon from '@mui/icons-material/Phone';
import WarningIcon from '@mui/icons-material/Warning';
import WorkIcon from '@mui/icons-material/Work';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import SchoolIcon from '@mui/icons-material/School';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import { doc, getDoc, updateDoc, serverTimestamp, collection, getDocs, query, where, increment } from 'firebase/firestore';
import { db } from '../../../firebase/index';
import { ROLES, ROLE_METADATA, isPlatformRole } from '../../../constants/roles';
import { useCurrentUser } from '../../../hooks/useCurrentUser';
import {
    USER_SECTIONS,
    SECTION_CONFIG,
    SECTION_ORDER,
    USER_FIELDS,
    getFieldsBySection,
} from '../../../constants/userFields';
import { lookupPostalCode, formatPostalCode } from '../../../utils/postalCodeLookup';

// セクションアイコンのマッピング
const SECTION_ICONS = {
    [USER_SECTIONS.BASIC]: <PersonIcon />,
    [USER_SECTIONS.AFFILIATION]: <BusinessIcon />,
    [USER_SECTIONS.PERSONAL]: <BadgeIcon />,
    [USER_SECTIONS.CONTACT]: <PhoneIcon />,
    [USER_SECTIONS.EMERGENCY]: <WarningIcon />,
    [USER_SECTIONS.EMPLOYMENT]: <WorkIcon />,
    [USER_SECTIONS.SALARY]: <AttachMoneyIcon />,
    [USER_SECTIONS.BANK]: <AccountBalanceIcon />,
    [USER_SECTIONS.INSURANCE]: <HealthAndSafetyIcon />,
    [USER_SECTIONS.LICENSE]: <SchoolIcon />,
    [USER_SECTIONS.HEALTH]: <LocalHospitalIcon />,
    [USER_SECTIONS.RESIGNATION]: <ExitToAppIcon />,
};

export default function UserDetailPage() {
    const { userId } = useParams();
    const navigate = useNavigate();
    const { isPlatform } = useCurrentUser();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [formData, setFormData] = useState({});
    const [originalData, setOriginalData] = useState({}); // 変更検知用
    const [companies, setCompanies] = useState([]);
    const [branches, setBranches] = useState([]);
    const [expandedSections, setExpandedSections] = useState([USER_SECTIONS.BASIC, USER_SECTIONS.AFFILIATION]);

    // ユーザーデータ取得
    useEffect(() => {
        const fetchUser = async () => {
            try {
                const docRef = doc(db, 'users', userId);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setFormData(data);
                    setOriginalData(data); // 元データを保存
                } else {
                    setError('ユーザーが見つかりません');
                }
            } catch (err) {
                console.error('ユーザーデータ取得エラー:', err);
                setError('データの取得に失敗しました');
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, [userId]);

    // 企業一覧取得
    useEffect(() => {
        if (isPlatform) {
            const fetchCompanies = async () => {
                const snapshot = await getDocs(collection(db, 'companies'));
                setCompanies(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            };
            fetchCompanies();
        }
    }, [isPlatform]);

    // 支店一覧取得
    useEffect(() => {
        const companyId = formData.companyId;
        if (!companyId) return;

        const fetchBranches = async () => {
            const q = query(collection(db, 'branches'), where('companyId', '==', companyId));
            const snapshot = await getDocs(q);
            setBranches(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        };
        fetchBranches();
    }, [formData.companyId]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        const newValue = type === 'checkbox' ? checked : value;
        setFormData(prev => ({ ...prev, [name]: newValue }));
    };

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        setSuccess(false);

        try {
            // ユーザーデータを更新
            await updateDoc(doc(db, 'users', userId), {
                ...formData,
                updatedAt: serverTimestamp(),
            });

            // ステータス変更時のカウント更新
            const wasActive = !originalData.invitePending && originalData.isActive !== false;
            const isNowActive = !formData.invitePending && formData.isActive !== false;

            // 新規アクティブ（招待中→有効）
            if (!wasActive && isNowActive) {
                console.log('ユーザーがアクティブになりました。カウント+1');
                if (formData.companyId) {
                    await updateDoc(doc(db, 'companies', formData.companyId), {
                        userCount: increment(1),
                        updatedAt: serverTimestamp(),
                    });
                }
                if (formData.branchId) {
                    await updateDoc(doc(db, 'branches', formData.branchId), {
                        userCount: increment(1),
                        updatedAt: serverTimestamp(),
                    });
                }
            }

            // 退職（有効→退職済）
            if (wasActive && !isNowActive && formData.isActive === false) {
                console.log('ユーザーが退職しました。カウント-1');
                if (originalData.companyId) {
                    await updateDoc(doc(db, 'companies', originalData.companyId), {
                        userCount: increment(-1),
                        updatedAt: serverTimestamp(),
                    });
                }
                if (originalData.branchId) {
                    await updateDoc(doc(db, 'branches', originalData.branchId), {
                        userCount: increment(-1),
                        updatedAt: serverTimestamp(),
                    });
                }
            }

            // 復職（退職済→有効）
            if (!wasActive && originalData.isActive === false && isNowActive) {
                console.log('ユーザーが復職しました。カウント+1');
                if (formData.companyId) {
                    await updateDoc(doc(db, 'companies', formData.companyId), {
                        userCount: increment(1),
                        updatedAt: serverTimestamp(),
                    });
                }
                if (formData.branchId) {
                    await updateDoc(doc(db, 'branches', formData.branchId), {
                        userCount: increment(1),
                        updatedAt: serverTimestamp(),
                    });
                }
            }

            // 元データを更新
            setOriginalData(formData);
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
        const { key, label, type, options, placeholder, helperText, editable, sensitive, multiline } = field;
        const value = formData[key] ?? '';

        // 編集不可フィールド
        if (editable === false) {
            return (
                <TextField
                    key={key}
                    name={key}
                    label={label}
                    value={value}
                    disabled
                    fullWidth
                    size="small"
                />
            );
        }

        // Boolean型（Switch）
        if (type === 'boolean') {
            return (
                <FormControlLabel
                    key={key}
                    control={
                        <Switch
                            name={key}
                            checked={!!value}
                            onChange={handleChange}
                        />
                    }
                    label={label}
                />
            );
        }

        // Select型
        if (type === 'select' && options) {
            return (
                <FormControl key={key} fullWidth size="small">
                    <InputLabel>{label}</InputLabel>
                    <Select
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

                        // 7桁入力されたら住所検索
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
                InputProps={{
                    ...(sensitive && { type: 'password' }),
                }}
            />
        );
    };

    // 特殊フィールド（ロール、企業、支店）のレンダリング
    const renderAffiliationSection = () => {
        return (
            <Stack spacing={2}>
                {/* ロール */}
                <FormControl fullWidth size="small">
                    <InputLabel>ロール</InputLabel>
                    <Select
                        name="role"
                        value={formData.role || ''}
                        label="ロール"
                        onChange={handleChange}
                    >
                        {Object.entries(ROLE_METADATA).map(([value, meta]) => (
                            <MenuItem key={value} value={value}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
                                    <Box sx={{
                                        fontWeight: 'bold',
                                        color: meta.color,
                                        minWidth: '120px'
                                    }}>
                                        {meta.badge}
                                    </Box>
                                    <Typography variant="body2" color="text.secondary">
                                        ({meta.dashboard})
                                    </Typography>
                                </Box>
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                {/* 企業選択（プラットフォームのみ） */}
                {isPlatform && !isPlatformRole(formData.role) && (
                    <FormControl fullWidth size="small">
                        <InputLabel>所属企業</InputLabel>
                        <Select
                            name="companyId"
                            value={companies.length > 0 ? (formData.companyId || '') : ''}
                            label="所属企業"
                            onChange={handleChange}
                        >
                            <MenuItem value="">選択してください</MenuItem>
                            {companies.map(company => (
                                <MenuItem key={company.id} value={company.id}>{company.name}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                )}

                {/* 支店選択 */}
                {[ROLES.BRANCH_MANAGER, ROLES.BRANCH_STAFF].includes(formData.role) && (
                    <FormControl fullWidth size="small">
                        <InputLabel>所属支店</InputLabel>
                        <Select
                            name="branchId"
                            value={formData.branchId || ''}
                            label="所属支店"
                            onChange={handleChange}
                        >
                            <MenuItem value="">選択してください</MenuItem>
                            {branches.map(branch => (
                                <MenuItem key={branch.id} value={branch.id}>{branch.name}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                )}

                {/* サービス管理責任者フラグ */}
                <FormControlLabel
                    control={
                        <Switch
                            name="isServiceManager"
                            checked={!!formData.isServiceManager}
                            onChange={handleChange}
                        />
                    }
                    label="サービス管理責任者（ONでサービス記録の入力制限）"
                />
            </Stack>
        );
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            {/* ヘッダー */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Button
                        startIcon={<ArrowBackIcon />}
                        onClick={() => navigate('/admin/users')}
                        sx={{ mr: 2, color: '#94a3b8' }}
                    >
                        戻る
                    </Button>
                    <Typography variant="h4" sx={{ color: '#fff' }}>
                        ユーザー詳細
                    </Typography>
                    {formData.invitePending && (
                        <Chip label="招待中" color="warning" size="small" sx={{ ml: 2 }} />
                    )}
                    {formData.isActive === false && (
                        <Chip label="退職済" size="small" sx={{ ml: 2, bgcolor: 'rgba(100,116,139,0.2)', color: '#64748b' }} />
                    )}
                    {!formData.invitePending && formData.isActive !== false && (
                        <Chip label="有効" color="success" size="small" variant="outlined" sx={{ ml: 2 }} />
                    )}
                </Box>

                {/* ステータス変更ボタン */}
                <Box sx={{ display: 'flex', gap: 1 }}>
                    {formData.invitePending && (
                        <Button
                            variant="outlined"
                            size="small"
                            color="success"
                            onClick={async () => {
                                try {
                                    // 直接DBを更新
                                    await updateDoc(doc(db, 'users', userId), {
                                        invitePending: false,
                                        updatedAt: serverTimestamp(),
                                    });

                                    // 企業・支店のユーザー数をインクリメント
                                    if (formData.companyId) {
                                        await updateDoc(doc(db, 'companies', formData.companyId), {
                                            userCount: increment(1),
                                            updatedAt: serverTimestamp(),
                                        });
                                    }
                                    if (formData.branchId) {
                                        await updateDoc(doc(db, 'branches', formData.branchId), {
                                            userCount: increment(1),
                                            updatedAt: serverTimestamp(),
                                        });
                                    }

                                    // ローカル状態も更新
                                    setFormData(prev => ({ ...prev, invitePending: false }));
                                    setOriginalData(prev => ({ ...prev, invitePending: false }));
                                    setSuccess(true);
                                    setTimeout(() => setSuccess(false), 3000);
                                } catch (err) {
                                    console.error('承認エラー:', err);
                                    setError('承認に失敗しました');
                                }
                            }}
                        >
                            招待を承認（有効にする）
                        </Button>
                    )}
                    {!formData.invitePending && formData.isActive !== false && (
                        <Button
                            variant="outlined"
                            size="small"
                            sx={{ color: '#64748b', borderColor: '#64748b' }}
                            onClick={() => {
                                if (window.confirm('このユーザーを退職済みにしますか？')) {
                                    setFormData(prev => ({ ...prev, isActive: false, resignationDate: new Date().toISOString().split('T')[0] }));
                                }
                            }}
                        >
                            退職処理
                        </Button>
                    )}
                    {formData.isActive === false && (
                        <Button
                            variant="outlined"
                            size="small"
                            color="info"
                            onClick={() => {
                                setFormData(prev => ({ ...prev, isActive: true, resignationDate: '', resignationReason: '' }));
                            }}
                        >
                            復職させる
                        </Button>
                    )}
                </Box>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }}>保存しました</Alert>}

            {/* セクション別アコーディオン */}
            <Stack spacing={1}>
                {SECTION_ORDER.map(section => {
                    const config = SECTION_CONFIG[section];
                    const fields = getFieldsBySection(section);

                    // 所属・権限セクションは特別処理
                    if (section === USER_SECTIONS.AFFILIATION) {
                        return (
                            <Accordion
                                key={section}
                                expanded={expandedSections.includes(section)}
                                onChange={handleAccordionChange(section)}
                                sx={{
                                    backgroundColor: '#1a1a2e',
                                    border: `1px solid ${config.color}33`,
                                    '&:before': { display: 'none' },
                                }}
                            >
                                <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: config.color }} />}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Box sx={{ color: config.color }}>{SECTION_ICONS[section]}</Box>
                                        <Typography sx={{ color: config.color, fontWeight: 'bold' }}>
                                            {config.label}
                                        </Typography>
                                    </Box>
                                </AccordionSummary>
                                <AccordionDetails>
                                    {renderAffiliationSection()}
                                </AccordionDetails>
                            </Accordion>
                        );
                    }

                    // 退職セクションは退職者のみ、または退職日入力時に表示
                    if (section === USER_SECTIONS.RESIGNATION && formData.isActive !== false && !formData.resignationDate) {
                        return (
                            <Accordion
                                key={section}
                                expanded={expandedSections.includes(section)}
                                onChange={handleAccordionChange(section)}
                                sx={{
                                    backgroundColor: '#1a1a2e',
                                    border: `1px solid ${config.color}33`,
                                    '&:before': { display: 'none' },
                                    opacity: 0.6,
                                }}
                            >
                                <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: config.color }} />}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Box sx={{ color: config.color }}>{SECTION_ICONS[section]}</Box>
                                        <Typography sx={{ color: config.color, fontWeight: 'bold' }}>
                                            {config.label}（在籍中）
                                        </Typography>
                                    </Box>
                                </AccordionSummary>
                                <AccordionDetails>
                                    <Grid container spacing={2}>
                                        {fields.map(field => (
                                            <Grid size={{ xs: 12, sm: field.multiline ? 12 : 6, md: field.multiline ? 12 : 4 }} key={field.key}>
                                                {renderField(field)}
                                            </Grid>
                                        ))}
                                    </Grid>
                                </AccordionDetails>
                            </Accordion>
                        );
                    }

                    return (
                        <Accordion
                            key={section}
                            expanded={expandedSections.includes(section)}
                            onChange={handleAccordionChange(section)}
                            sx={{
                                backgroundColor: '#1a1a2e',
                                border: `1px solid ${config.color}33`,
                                '&:before': { display: 'none' },
                            }}
                        >
                            <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: config.color }} />}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Box sx={{ color: config.color }}>{SECTION_ICONS[section]}</Box>
                                    <Typography sx={{ color: config.color, fontWeight: 'bold' }}>
                                        {config.label}
                                    </Typography>
                                </Box>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Grid container spacing={2}>
                                    {fields.map(field => (
                                        <Grid size={{ xs: 12, sm: field.multiline ? 12 : 6, md: field.multiline ? 12 : 4 }} key={field.key}>
                                            {renderField(field)}
                                        </Grid>
                                    ))}
                                </Grid>
                            </AccordionDetails>
                        </Accordion>
                    );
                })}
            </Stack>

            {/* 保存ボタン */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                <Button
                    variant="contained"
                    startIcon={<SaveIcon />}
                    onClick={handleSave}
                    disabled={saving}
                    sx={{ bgcolor: '#8b5cf6', '&:hover': { bgcolor: '#7c3aed' } }}
                >
                    {saving ? '保存中...' : '変更を保存'}
                </Button>
            </Box>
        </Box>
    );
}
