// src/features/retention/RetentionReportListModal.jsx
// 定着支援レポート一覧モーダル

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Paper, CircularProgress, Typography,
    IconButton, Stack, Chip
} from '@mui/material';
import { Edit, Print, Add } from '@mui/icons-material';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { format } from 'date-fns';

export default function RetentionReportListModal({ open, onClose, client }) {
    const navigate = useNavigate();
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReports = async () => {
            if (!client?.id || !open) return;
            setLoading(true);
            try {
                const q = query(
                    collection(db, 'retentionReports'),
                    where('clientId', '==', client.id),
                    orderBy('month', 'desc')
                );
                const querySnapshot = await getDocs(q);
                const reportsList = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setReports(reportsList);
            } catch (error) {
                console.error('レポート取得エラー:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchReports();
    }, [client?.id, open]);

    const formatDate = (timestamp) => {
        if (!timestamp) return '---';
        try {
            const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
            return format(date, 'yyyy/MM/dd');
        } catch {
            return '---';
        }
    };

    const handleNewReport = () => {
        onClose();
        // 次に作成すべき月を計算（既存レポートの最大月+1、または1）
        const nextMonth = reports.length > 0
            ? Math.max(...reports.map(r => r.month || 0)) + 1
            : 1;
        navigate(`/retention-support/print?clientId=${client.id}&month=${nextMonth}`);
    };

    const handleEditReport = (report) => {
        onClose();
        navigate(`/retention-support/print?clientId=${client.id}&month=${report.month}&reportId=${report.id}`);
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6">
                        📋 {client?.name} のレポート一覧
                    </Typography>
                    <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        startIcon={<Add />}
                        onClick={handleNewReport}
                    >
                        新規作成
                    </Button>
                </Stack>
            </DialogTitle>
            <DialogContent>
                {loading ? (
                    <Stack alignItems="center" sx={{ py: 4 }}>
                        <CircularProgress />
                    </Stack>
                ) : reports.length === 0 ? (
                    <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                        まだレポートがありません
                    </Typography>
                ) : (
                    <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>月</TableCell>
                                    <TableCell>対象年月</TableCell>
                                    <TableCell>更新日</TableCell>
                                    <TableCell align="center">操作</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {reports.map((report) => (
                                    <TableRow key={report.id} hover>
                                        <TableCell>
                                            <Chip
                                                label={`${report.month}ヶ月目`}
                                                size="small"
                                                color="primary"
                                                variant="outlined"
                                            />
                                        </TableCell>
                                        <TableCell>{formatDate(report.targetDate)}</TableCell>
                                        <TableCell>{formatDate(report.updatedAt)}</TableCell>
                                        <TableCell align="center">
                                            <IconButton
                                                size="small"
                                                color="primary"
                                                onClick={() => handleEditReport(report)}
                                                title="編集"
                                            >
                                                <Edit fontSize="small" />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>閉じる</Button>
            </DialogActions>
        </Dialog>
    );
}
