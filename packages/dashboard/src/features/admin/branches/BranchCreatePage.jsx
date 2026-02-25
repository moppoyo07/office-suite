// src/features/admin/branches/BranchCreatePage.jsx
// 新規支店登録ページ

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { collection, addDoc, getDocs, updateDoc, doc, increment, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../firebase/index';
import { useCurrentUser } from '../../../hooks/useCurrentUser';

export default function BranchCreatePage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { isPlatform, companyId: userCompanyId } = useCurrentUser();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [companies, setCompanies] = useState([]);
    const [formData, setFormData] = useState({
        name: '',
        companyId: searchParams.get('companyId') || userCompanyId || '',
        address: '',
        phone: '',
        email: '',
        capacity: '', // 定員
    });

    // プラットフォームユーザーの場合、企業一覧を取得
    useEffect(() => {
        if (isPlatform) {
            const fetchCompanies = async () => {
                const snapshot = await getDocs(collection(db, 'companies'));
                setCompanies(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            };
            fetchCompanies();
        }
    }, [isPlatform]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            setError('支店名は必須です');
            return;
        }
        if (!formData.companyId) {
            setError('所属企業を選択してください');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // 支店を作成
            const docRef = await addDoc(collection(db, 'branches'), {
                ...formData,
                capacity: formData.capacity ? Number(formData.capacity) : null,
                userCount: 0,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });

            // 企業の支店カウントを更新
            await updateDoc(doc(db, 'companies', formData.companyId), {
                branchCount: increment(1),
                updatedAt: serverTimestamp(),
            });

            console.log('支店を登録しました:', docRef.id);
            navigate('/admin/branches');
        } catch (err) {
            console.error('支店登録エラー:', err);
            setError('登録に失敗しました。もう一度お試しください。');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate('/admin/branches')}
                    sx={{ mr: 2, color: '#94a3b8' }}
                >
                    戻る
                </Button>
                <Typography variant="h4" sx={{ color: '#fff' }}>
                    新規支店登録
                </Typography>
            </Box>

            <Paper
                component="form"
                onSubmit={handleSubmit}
                sx={{
                    p: 4,
                    backgroundColor: '#1a1a2e',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                }}
            >
                {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

                <Stack spacing={3}>
                    {/* 所属企業選択（プラットフォームユーザーのみ） */}
                    {isPlatform && (
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

                    <TextField
                        name="name"
                        label="支店名（事業所名） *"
                        value={formData.name}
                        onChange={handleChange}
                        fullWidth
                        required
                        placeholder="例: 広島事業所"
                    />

                    <TextField
                        name="address"
                        label="住所"
                        value={formData.address}
                        onChange={handleChange}
                        fullWidth
                        placeholder="例: 広島県広島市中区○○1-2-3"
                    />

                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                        <TextField
                            name="phone"
                            label="電話番号"
                            value={formData.phone}
                            onChange={handleChange}
                            fullWidth
                            placeholder="例: 082-123-4567"
                        />
                        <TextField
                            name="email"
                            label="メールアドレス"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            fullWidth
                            placeholder="例: hiroshima@example.com"
                        />
                    </Stack>

                    <TextField
                        name="capacity"
                        label="定員"
                        type="number"
                        value={formData.capacity}
                        onChange={handleChange}
                        sx={{ width: 150 }}
                        placeholder="例: 20"
                        helperText="B型事業所の定員数"
                    />

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 2 }}>
                        <Button
                            type="submit"
                            variant="contained"
                            startIcon={<SaveIcon />}
                            disabled={loading}
                            sx={{ bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' } }}
                        >
                            {loading ? '登録中...' : '支店を登録'}
                        </Button>
                    </Box>
                </Stack>
            </Paper>
        </Box>
    );
}
