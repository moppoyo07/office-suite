// src/features/admin/users/UserCreatePage.jsx
// 新規ユーザー招待ページ

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Paper,
    TextField,
    Button,
    Stack,
    Alert,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    FormHelperText,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { collection, addDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../firebase/index';
import { useCurrentUser } from '../../../hooks/useCurrentUser';
import { ROLES, ROLE_LABELS, isPlatformRole, isExternalRole } from '../../../constants/roles';

export default function UserCreatePage() {
    const navigate = useNavigate();
    const { isPlatform, role: myRole, companyId: myCompanyId } = useCurrentUser();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [companies, setCompanies] = useState([]);
    const [branches, setBranches] = useState([]);

    const [formData, setFormData] = useState({
        email: '',
        displayName: '',
        role: ROLES.BRANCH_STAFF,
        companyId: myCompanyId || '',
        branchId: '',
    });

    // 選択可能なロール（自分より低いロールのみ）
    const getAvailableRoles = () => {
        const allRoles = [
            { value: ROLES.PLATFORM_STAFF, label: ROLE_LABELS[ROLES.PLATFORM_STAFF], platformOnly: true },
            { value: ROLES.COMPANY_ADMIN, label: ROLE_LABELS[ROLES.COMPANY_ADMIN], platformOnly: true },
            { value: ROLES.BRANCH_MANAGER, label: ROLE_LABELS[ROLES.BRANCH_MANAGER] },
            { value: ROLES.BRANCH_STAFF, label: ROLE_LABELS[ROLES.BRANCH_STAFF] },
            { value: ROLES.ACCOUNTANT, label: ROLE_LABELS[ROLES.ACCOUNTANT] },
            { value: ROLES.TAX_ADVISOR, label: ROLE_LABELS[ROLES.TAX_ADVISOR] },
            { value: ROLES.HELPER, label: 'HOTDOG（制限閲覧）', platformOnly: true },
        ];

        if (isPlatform) {
            return allRoles;
        } else if (myRole === ROLES.COMPANY_ADMIN) {
            return allRoles.filter(r => !r.platformOnly);
        } else {
            return allRoles.filter(r => r.value === ROLES.BRANCH_STAFF);
        }
    };

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
        const companyToUse = formData.companyId || myCompanyId;
        if (!companyToUse) return;

        const fetchBranches = async () => {
            const q = query(collection(db, 'branches'), where('companyId', '==', companyToUse));
            const snapshot = await getDocs(q);
            setBranches(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        };
        fetchBranches();
    }, [formData.companyId, myCompanyId]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // ロール変更時に支店をリセット
        if (name === 'role') {
            if (isPlatformRole(value) || value === ROLES.COMPANY_ADMIN) {
                setFormData(prev => ({ ...prev, [name]: value, branchId: '' }));
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.email.trim()) {
            setError('メールアドレスは必須です');
            return;
        }

        // 支店レベルのロールなら支店必須
        const needsBranch = [ROLES.BRANCH_MANAGER, ROLES.BRANCH_STAFF].includes(formData.role);
        if (needsBranch && !formData.branchId) {
            setError('支店を選択してください');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // 招待レコードを作成（実際のFirebase Authアカウントは招待リンククリック時に作成）
            await addDoc(collection(db, 'userInvitations'), {
                email: formData.email,
                displayName: formData.displayName || '',
                role: formData.role,
                companyId: isPlatformRole(formData.role) ? null : (formData.companyId || myCompanyId),
                branchId: needsBranch ? formData.branchId : null,
                invitedBy: myRole,
                status: 'pending',
                createdAt: serverTimestamp(),
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7日後に期限切れ
            });

            // TODO: 実際にはここでメール送信APIを呼び出す
            // 今は仮でusersコレクションにも追加（招待中フラグ付き）
            await addDoc(collection(db, 'users'), {
                email: formData.email,
                displayName: formData.displayName || '',
                role: formData.role,
                companyId: isPlatformRole(formData.role) ? null : (formData.companyId || myCompanyId),
                branchId: needsBranch ? formData.branchId : null,
                invitePending: true,
                createdAt: serverTimestamp(),
            });

            setSuccess(true);
            setTimeout(() => navigate('/admin/users'), 2000);
        } catch (err) {
            console.error('招待エラー:', err);
            setError('招待に失敗しました。もう一度お試しください。');
        } finally {
            setLoading(false);
        }
    };

    const selectedRole = formData.role;
    const showCompanySelect = isPlatform && !isPlatformRole(selectedRole);
    const showBranchSelect = [ROLES.BRANCH_MANAGER, ROLES.BRANCH_STAFF].includes(selectedRole);
    const showAssignedCompanies = isExternalRole(selectedRole);

    return (
        <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate('/admin/users')}
                    sx={{ mr: 2, color: '#94a3b8' }}
                >
                    戻る
                </Button>
                <Typography variant="h4" sx={{ color: '#fff' }}>
                    ユーザー招待
                </Typography>
            </Box>

            <Paper
                component="form"
                onSubmit={handleSubmit}
                sx={{
                    p: 4,
                    backgroundColor: '#1a1a2e',
                    border: '1px solid rgba(139, 92, 246, 0.2)',
                }}
            >
                {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
                {success && <Alert severity="success" sx={{ mb: 3 }}>招待を送信しました！</Alert>}

                <Stack spacing={3}>
                    <Typography variant="h6" sx={{ color: '#8b5cf6', borderLeft: '3px solid #8b5cf6', pl: 1 }}>
                        基本情報
                    </Typography>

                    <TextField
                        name="email"
                        label="メールアドレス *"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        fullWidth
                        required
                        placeholder="例: user@example.com"
                        helperText="招待メールがこのアドレスに送信されます"
                    />

                    <TextField
                        name="displayName"
                        label="表示名"
                        value={formData.displayName}
                        onChange={handleChange}
                        fullWidth
                        placeholder="例: 山田太郎"
                    />

                    <Typography variant="h6" sx={{ color: '#06b6d4', borderLeft: '3px solid #06b6d4', pl: 1, pt: 2 }}>
                        権限設定
                    </Typography>

                    <FormControl fullWidth required>
                        <InputLabel>ロール（役割）</InputLabel>
                        <Select
                            name="role"
                            value={formData.role}
                            label="ロール（役割）"
                            onChange={handleChange}
                        >
                            {getAvailableRoles().map(role => (
                                <MenuItem key={role.value} value={role.value}>
                                    {role.label}
                                </MenuItem>
                            ))}
                        </Select>
                        <FormHelperText>ユーザーの権限レベルを選択</FormHelperText>
                    </FormControl>

                    {showCompanySelect && (
                        <FormControl fullWidth required>
                            <InputLabel>所属企業</InputLabel>
                            <Select
                                name="companyId"
                                value={formData.companyId}
                                label="所属企業"
                                onChange={handleChange}
                            >
                                {companies.map(company => (
                                    <MenuItem key={company.id} value={company.id}>
                                        {company.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    )}

                    {showBranchSelect && (
                        <FormControl fullWidth required>
                            <InputLabel>所属支店</InputLabel>
                            <Select
                                name="branchId"
                                value={formData.branchId}
                                label="所属支店"
                                onChange={handleChange}
                            >
                                {branches.map(branch => (
                                    <MenuItem key={branch.id} value={branch.id}>
                                        {branch.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    )}

                    {showAssignedCompanies && (
                        <Alert severity="info">
                            経理・税理士の担当企業は、招待完了後に詳細画面から設定できます。
                        </Alert>
                    )}

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 2 }}>
                        <Button
                            type="submit"
                            variant="contained"
                            startIcon={<SendIcon />}
                            disabled={loading || success}
                            sx={{ bgcolor: '#8b5cf6', '&:hover': { bgcolor: '#7c3aed' } }}
                        >
                            {loading ? '送信中...' : '招待を送信'}
                        </Button>
                    </Box>
                </Stack>
            </Paper>
        </Box>
    );
}
