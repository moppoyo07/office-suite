// src/features/admin/companies/CompanyCreatePage.jsx
// 新規企業登録ページ

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Paper,
    TextField,
    Button,
    Stack,
    Alert,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../firebase/index';

export default function CompanyCreatePage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        nameKana: '',
        postalCode: '',
        address: '',
        phone: '',
        email: '',
        representativeName: '',
        corporateNumber: '', // 法人番号
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            setError('企業名は必須です');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const docRef = await addDoc(collection(db, 'companies'), {
                ...formData,
                branchCount: 0,
                userCount: 0,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });

            console.log('企業を登録しました:', docRef.id);
            navigate(`/admin/companies/${docRef.id}`);
        } catch (err) {
            console.error('企業登録エラー:', err);
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
                    onClick={() => navigate('/admin/companies')}
                    sx={{ mr: 2, color: '#94a3b8' }}
                >
                    戻る
                </Button>
                <Typography variant="h4" sx={{ color: '#fff' }}>
                    新規企業登録
                </Typography>
            </Box>

            <Paper
                component="form"
                onSubmit={handleSubmit}
                sx={{
                    p: 4,
                    backgroundColor: '#1a1a2e',
                    border: '1px solid rgba(6, 182, 212, 0.2)',
                }}
            >
                {error && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                        {error}
                    </Alert>
                )}

                <Stack spacing={3}>
                    <Typography variant="h6" sx={{ color: '#06b6d4', borderLeft: '3px solid #06b6d4', pl: 1 }}>
                        基本情報
                    </Typography>

                    <TextField
                        name="name"
                        label="企業名 *"
                        value={formData.name}
                        onChange={handleChange}
                        fullWidth
                        required
                        placeholder="例: 株式会社○○農福"
                    />

                    <TextField
                        name="nameKana"
                        label="企業名（フリガナ）"
                        value={formData.nameKana}
                        onChange={handleChange}
                        fullWidth
                        placeholder="例: カブシキガイシャ○○ノウフク"
                    />

                    <TextField
                        name="representativeName"
                        label="代表者名"
                        value={formData.representativeName}
                        onChange={handleChange}
                        fullWidth
                        placeholder="例: 山田太郎"
                    />

                    <TextField
                        name="corporateNumber"
                        label="法人番号"
                        value={formData.corporateNumber}
                        onChange={handleChange}
                        fullWidth
                        placeholder="13桁の法人番号"
                    />

                    <Typography variant="h6" sx={{ color: '#10b981', borderLeft: '3px solid #10b981', pl: 1, pt: 2 }}>
                        連絡先
                    </Typography>

                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                        <TextField
                            name="postalCode"
                            label="郵便番号"
                            value={formData.postalCode}
                            onChange={handleChange}
                            sx={{ width: { xs: '100%', sm: '30%' } }}
                            placeholder="例: 123-4567"
                        />
                        <TextField
                            name="address"
                            label="住所"
                            value={formData.address}
                            onChange={handleChange}
                            fullWidth
                            placeholder="例: 広島県広島市中区○○1-2-3"
                        />
                    </Stack>

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
                            placeholder="例: info@example.com"
                        />
                    </Stack>

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 2 }}>
                        <Button
                            type="submit"
                            variant="contained"
                            startIcon={<SaveIcon />}
                            disabled={loading}
                            sx={{ bgcolor: '#06b6d4', '&:hover': { bgcolor: '#0891b2' } }}
                        >
                            {loading ? '登録中...' : '企業を登録'}
                        </Button>
                    </Box>
                </Stack>
            </Paper>
        </Box>
    );
}
