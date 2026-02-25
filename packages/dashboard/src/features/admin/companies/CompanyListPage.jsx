// src/features/admin/companies/CompanyListPage.jsx
// 企業一覧ページ

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
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../../firebase/index';
import { format } from 'date-fns';

export default function CompanyListPage() {
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCompanies = async () => {
            try {
                const q = query(collection(db, 'companies'), orderBy('createdAt', 'desc'));
                const snapshot = await getDocs(q);
                setCompanies(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            } catch (error) {
                console.error('企業データ取得エラー:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchCompanies();
    }, []);

    const formatDate = (timestamp) => {
        if (!timestamp) return '-';
        try {
            const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
            return format(date, 'yyyy/MM/dd');
        } catch {
            return '-';
        }
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" sx={{ color: '#fff' }}>
                    企業管理
                </Typography>
                <Button
                    component={RouterLink}
                    to="/admin/companies/new"
                    variant="contained"
                    startIcon={<AddIcon />}
                    sx={{ bgcolor: '#06b6d4', '&:hover': { bgcolor: '#0891b2' } }}
                >
                    新規企業を登録
                </Button>
            </Box>

            <Paper sx={{ backgroundColor: '#1a1a2e', border: '1px solid rgba(6, 182, 212, 0.2)' }}>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ color: '#94a3b8', fontWeight: 'bold' }}>企業名</TableCell>
                                <TableCell sx={{ color: '#94a3b8', fontWeight: 'bold' }}>支店数</TableCell>
                                <TableCell sx={{ color: '#94a3b8', fontWeight: 'bold' }}>ユーザー数</TableCell>
                                <TableCell sx={{ color: '#94a3b8', fontWeight: 'bold' }}>登録日</TableCell>
                                <TableCell sx={{ color: '#94a3b8', fontWeight: 'bold' }} align="right">操作</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                                        <CircularProgress size={24} />
                                    </TableCell>
                                </TableRow>
                            ) : companies.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ py: 4, color: '#94a3b8' }}>
                                        登録されている企業はありません
                                    </TableCell>
                                </TableRow>
                            ) : (
                                companies.map((company) => (
                                    <TableRow key={company.id} hover>
                                        <TableCell>
                                            <Typography sx={{ color: '#fff', fontWeight: 'bold' }}>
                                                {company.name}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {company.id}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip label={company.branchCount || 0} size="small" />
                                        </TableCell>
                                        <TableCell>
                                            <Chip label={company.userCount || 0} size="small" />
                                        </TableCell>
                                        <TableCell sx={{ color: '#94a3b8' }}>
                                            {formatDate(company.createdAt)}
                                        </TableCell>
                                        <TableCell align="right">
                                            <IconButton
                                                component={RouterLink}
                                                to={`/admin/companies/${company.id}`}
                                                size="small"
                                                sx={{ color: '#06b6d4' }}
                                            >
                                                <EditIcon />
                                            </IconButton>
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
