// src/features/admin/branches/BranchListPage.jsx
// 支店一覧ページ

import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
    Box,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Button,
    CircularProgress,
    Chip,
    IconButton,
    Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../../firebase/index';
import { useCurrentUser } from '../../../hooks/useCurrentUser';

export default function BranchListPage() {
    const [branches, setBranches] = useState([]);
    const [companies, setCompanies] = useState({});
    const [loading, setLoading] = useState(true);
    const { isPlatform } = useCurrentUser();

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 企業データ取得（ID→名前マップ用）
                const companySnap = await getDocs(collection(db, 'companies'));
                const companyMap = {};
                companySnap.forEach(doc => { companyMap[doc.id] = doc.data().name; });
                setCompanies(companyMap);

                // 支店データ取得
                const q = query(collection(db, 'branches'), orderBy('createdAt', 'desc'));
                const snapshot = await getDocs(q);
                setBranches(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            } catch (error) {
                console.error('データ取得エラー:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" sx={{ color: '#fff' }}>
                    支店管理
                </Typography>
                <Button
                    component={RouterLink}
                    to="/admin/branches/new"
                    variant="contained"
                    startIcon={<AddIcon />}
                    sx={{ bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' } }}
                >
                    新規支店を登録
                </Button>
            </Box>

            <Paper sx={{ backgroundColor: '#1a1a2e', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ color: '#94a3b8', fontWeight: 'bold' }}>支店名</TableCell>
                                {isPlatform && <TableCell sx={{ color: '#94a3b8', fontWeight: 'bold' }}>所属企業</TableCell>}
                                <TableCell sx={{ color: '#94a3b8', fontWeight: 'bold' }}>住所</TableCell>
                                <TableCell sx={{ color: '#94a3b8', fontWeight: 'bold' }}>ユーザー数</TableCell>
                                <TableCell sx={{ color: '#94a3b8', fontWeight: 'bold' }} align="right">操作</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={isPlatform ? 5 : 4} align="center" sx={{ py: 4 }}>
                                        <CircularProgress size={24} />
                                    </TableCell>
                                </TableRow>
                            ) : branches.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={isPlatform ? 5 : 4} align="center" sx={{ py: 4, color: '#94a3b8' }}>
                                        登録されている支店はありません
                                    </TableCell>
                                </TableRow>
                            ) : (
                                branches.map((branch) => (
                                    <TableRow key={branch.id} hover>
                                        <TableCell>
                                            <Typography sx={{ color: '#fff', fontWeight: 'bold' }}>
                                                {branch.name}
                                            </Typography>
                                        </TableCell>
                                        {isPlatform && (
                                            <TableCell>
                                                <Chip
                                                    label={companies[branch.companyId] || '不明'}
                                                    size="small"
                                                    sx={{ bgcolor: 'rgba(6, 182, 212, 0.2)', color: '#06b6d4' }}
                                                />
                                            </TableCell>
                                        )}
                                        <TableCell sx={{ color: '#94a3b8' }}>
                                            {branch.address || '-'}
                                        </TableCell>
                                        <TableCell>
                                            <Chip label={branch.userCount || 0} size="small" />
                                        </TableCell>
                                        <TableCell align="right">
                                            <Tooltip title="詳細・編集">
                                                <IconButton
                                                    component={RouterLink}
                                                    to={`/admin/branches/${branch.id}`}
                                                    size="small"
                                                    sx={{ color: '#10b981' }}
                                                >
                                                    <EditIcon />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Box>
    );
}

