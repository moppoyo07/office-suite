// src/pages/AverageUsersPage.jsx
// 平均利用者数算定ページ

import { useState, useEffect, useMemo } from 'react';
import {
    Box, Typography, Paper, Grid, CircularProgress, Alert,
    FormControl, InputLabel, Select, MenuItem, TextField,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Button, Chip, Card, CardContent, Divider, IconButton, Tooltip
} from '@mui/material';
import { collection, query, where, getDocs, doc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../features/auth/context/AuthContext';
import SaveIcon from '@mui/icons-material/Save';
import CalculateIcon from '@mui/icons-material/Calculate';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import AutorenewIcon from '@mui/icons-material/Autorenew';

// 月名
const MONTHS = [4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3];
const MONTH_LABELS = ['4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月', '1月', '2月', '3月'];

// 年度リスト生成（2022年度〜現在年度+1）
const generateFiscalYears = () => {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const currentFiscalYear = currentMonth >= 4 ? currentYear : currentYear - 1;
    const years = [];
    for (let y = 2022; y <= currentFiscalYear + 1; y++) {
        years.push(y);
    }
    return years.reverse();
};

export default function AverageUsersPage() {
    const { currentUser } = useAuth();
    const companyId = currentUser?.companyId || null;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [fiscalYear, setFiscalYear] = useState(() => {
        const now = new Date();
        return now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
    });

    // 月別データ: { 4: { attendance: 178, days: 22, source: 'manual' }, ... }
    const [monthlyData, setMonthlyData] = useState({});

    // 利用者別データ（展開表示用）
    const [clientDetails, setClientDetails] = useState({});
    const [clients, setClients] = useState([]);

    const fiscalYears = useMemo(() => generateFiscalYears(), []);

    // データ読み込み
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                // 保存済みの月別サマリーを取得
                const companyFilter = companyId ? [where('companyId', '==', companyId)] : [];
                const summaryQuery = query(
                    collection(db, 'monthlyAttendanceSummary'),
                    ...companyFilter,
                    where('fiscalYear', '==', fiscalYear)
                );
                const summarySnap = await getDocs(summaryQuery);

                const data = {};
                summarySnap.docs.forEach(doc => {
                    const d = doc.data();
                    data[d.month] = {
                        attendance: d.totalAttendance || 0,
                        days: d.operatingDays || 0,
                        source: d.source || 'manual',
                        details: d.details || {},
                    };
                });

                // 未入力の月はデフォルト値
                MONTHS.forEach(m => {
                    if (!data[m]) {
                        data[m] = { attendance: '', days: '', source: 'manual', details: {} };
                    }
                });

                setMonthlyData(data);

                // 利用者一覧を取得
                const clientFilter = companyId ? [where('companyId', '==', companyId)] : [];
                const clientsSnap = await getDocs(clientFilter.length ? query(collection(db, 'clients'), ...clientFilter) : collection(db, 'clients'));
                const clientList = clientsSnap.docs
                    .map(doc => ({ id: doc.id, ...doc.data() }))
                    .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ja'));
                setClients(clientList);

            } catch (err) {
                console.error('データ取得エラー:', err);
                setError('データの取得に失敗しました');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [fiscalYear, companyId]);

    // 自動集計（attendanceRecordsから取得）
    const handleAutoCalculate = async (month) => {
        try {
            // 年月から日付範囲を計算
            const year = month >= 4 ? fiscalYear : fiscalYear + 1;
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0, 23, 59, 59);

            const companyFilter = companyId ? [where('companyId', '==', companyId)] : [];
            const recordsQuery = query(
                collection(db, 'attendanceRecords'),
                ...companyFilter,
                where('date', '>=', Timestamp.fromDate(startDate)),
                where('date', '<=', Timestamp.fromDate(endDate)),
                where('status', '==', 'present')
            );
            const recordsSnap = await getDocs(recordsQuery);

            // 延べ利用者数 = present の数
            const totalAttendance = recordsSnap.size;

            // 開所日数 = ユニークな日付の数
            const uniqueDays = new Set();
            const details = {};
            recordsSnap.docs.forEach(doc => {
                const data = doc.data();
                const dateObj = data.date?.toDate();
                if (dateObj) {
                    uniqueDays.add(dateObj.toDateString());
                }
                // 利用者別カウント
                if (data.clientId) {
                    details[data.clientId] = (details[data.clientId] || 0) + 1;
                }
            });

            setMonthlyData(prev => ({
                ...prev,
                [month]: {
                    attendance: totalAttendance,
                    days: uniqueDays.size,
                    source: 'auto',
                    details,
                }
            }));

            setSuccess(`${month}月のデータを自動取得しました`);
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            console.error('自動集計エラー:', err);
            setError('自動集計に失敗しました');
        }
    };

    // 手入力変更
    const handleChange = (month, field, value) => {
        setMonthlyData(prev => ({
            ...prev,
            [month]: {
                ...prev[month],
                [field]: value === '' ? '' : parseInt(value) || 0,
                source: 'manual',
            }
        }));
    };

    // 保存
    const handleSave = async () => {
        setSaving(true);
        setError(null);
        try {
            for (const month of MONTHS) {
                const data = monthlyData[month];
                if (data.attendance === '' && data.days === '') continue; // 空データはスキップ

                const docId = companyId ? `${companyId}_${fiscalYear}_${month}` : `${fiscalYear}_${month}`;
                await setDoc(doc(db, 'monthlyAttendanceSummary', docId), {
                    fiscalYear,
                    month,
                    companyId: companyId || null,
                    totalAttendance: parseInt(data.attendance) || 0,
                    operatingDays: parseInt(data.days) || 0,
                    source: data.source || 'manual',
                    details: data.details || {},
                    updatedAt: Timestamp.now(),
                });
            }
            setSuccess('保存しました');
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            console.error('保存エラー:', err);
            setError('保存に失敗しました');
        } finally {
            setSaving(false);
        }
    };

    // 集計計算
    const totals = useMemo(() => {
        let totalAttendance = 0;
        let totalDays = 0;
        MONTHS.forEach(m => {
            const data = monthlyData[m];
            if (data) {
                totalAttendance += parseInt(data.attendance) || 0;
                totalDays += parseInt(data.days) || 0;
            }
        });
        const average = totalDays > 0 ? Math.ceil((totalAttendance / totalDays) * 100) / 100 : 0;
        return { totalAttendance, totalDays, average };
    }, [monthlyData]);

    // CSVインポート処理
    const handleCsvImport = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result;
                const lines = text.split('\n');
                // 最初の行はヘッダー、最後の行は合計と仮定
                // CSVフォーマット: 月,延べ利用者数,開所日数
                const newData = { ...monthlyData };
                lines.forEach(line => {
                    const [monthStr, attendanceStr, daysStr] = line.split(',');
                    const month = parseInt(monthStr);
                    if (MONTHS.includes(month)) {
                        newData[month] = {
                            attendance: parseInt(attendanceStr) || 0,
                            days: parseInt(daysStr) || 0,
                            source: 'csv',
                            details: {},
                        };
                    }
                });
                setMonthlyData(newData);
                setSuccess('CSVをインポートしました');
                setTimeout(() => setSuccess(null), 3000);
            } catch (err) {
                setError('CSVの解析に失敗しました');
            }
        };
        reader.readAsText(file);
        event.target.value = ''; // リセット
    };

    return (
        <Box sx={{ pb: 4 }}>
            {/* ヘッダー */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                <Typography variant="h4">
                    📊 平均利用者数算定
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                        <InputLabel>年度</InputLabel>
                        <Select
                            value={fiscalYear}
                            label="年度"
                            onChange={(e) => setFiscalYear(e.target.value)}
                        >
                            {fiscalYears.map(y => (
                                <MenuItem key={y} value={y}>{y}年度</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <Button
                        component="label"
                        variant="outlined"
                        startIcon={<CloudUploadIcon />}
                        size="small"
                    >
                        CSVインポート
                        <input type="file" accept=".csv" hidden onChange={handleCsvImport} />
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<SaveIcon />}
                        onClick={handleSave}
                        disabled={saving}
                    >
                        {saving ? '保存中...' : '保存'}
                    </Button>
                </Box>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
            ) : (
                <Grid container spacing={3}>
                    {/* 月別入力テーブル */}
                    <Grid size={{ xs: 12 }}>
                        <Paper sx={{ p: 2 }}>
                            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
                                月別データ入力
                            </Typography>
                            <TableContainer>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow sx={{ bgcolor: 'rgba(255,255,255,0.05)' }}>
                                            <TableCell sx={{ fontWeight: 'bold', width: 80 }}>月</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>延べ利用者数</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>開所日数</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold', width: 100 }}>ソース</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold', width: 80 }}>操作</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {MONTHS.map((month, idx) => {
                                            const data = monthlyData[month] || {};
                                            const year = month >= 4 ? fiscalYear : fiscalYear + 1;
                                            const canAutoCalc = year >= 2026 || (year === 2026 && month >= 1);
                                            return (
                                                <TableRow key={month} hover>
                                                    <TableCell sx={{ fontWeight: 'bold' }}>{MONTH_LABELS[idx]}</TableCell>
                                                    <TableCell>
                                                        <TextField
                                                            size="small"
                                                            type="number"
                                                            value={data.attendance ?? ''}
                                                            onChange={(e) => handleChange(month, 'attendance', e.target.value)}
                                                            sx={{ width: 100 }}
                                                            inputProps={{ min: 0 }}
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <TextField
                                                            size="small"
                                                            type="number"
                                                            value={data.days ?? ''}
                                                            onChange={(e) => handleChange(month, 'days', e.target.value)}
                                                            sx={{ width: 80 }}
                                                            inputProps={{ min: 0, max: 31 }}
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={data.source === 'auto' ? '自動' : data.source === 'csv' ? 'CSV' : '手入力'}
                                                            size="small"
                                                            color={data.source === 'auto' ? 'success' : data.source === 'csv' ? 'info' : 'default'}
                                                            variant="outlined"
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        {canAutoCalc && (
                                                            <Tooltip title="DBから自動取得">
                                                                <IconButton size="small" onClick={() => handleAutoCalculate(month)}>
                                                                    <AutorenewIcon fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                        {/* 合計行 */}
                                        <TableRow sx={{ bgcolor: 'rgba(6, 182, 212, 0.1)' }}>
                                            <TableCell sx={{ fontWeight: 'bold' }}>合計</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                                                {totals.totalAttendance.toLocaleString()} 人日
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                                                {totals.totalDays} 日
                                            </TableCell>
                                            <TableCell colSpan={2}></TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Paper>
                    </Grid>

                    {/* 算定結果 */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Card sx={{ bgcolor: 'rgba(6, 182, 212, 0.1)', border: '2px solid #06b6d4' }}>
                            <CardContent>
                                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <CalculateIcon /> 算定結果
                                </Typography>
                                <Divider sx={{ mb: 2 }} />
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography>年度延べ利用者数:</Typography>
                                        <Typography fontWeight="bold">{totals.totalAttendance.toLocaleString()} 人日</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography>年度開所日数:</Typography>
                                        <Typography fontWeight="bold">{totals.totalDays} 日</Typography>
                                    </Box>
                                    <Divider sx={{ my: 1 }} />
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Typography variant="h6">平均利用者数:</Typography>
                                        <Typography variant="h4" sx={{ color: '#06b6d4', fontWeight: 'bold' }}>
                                            {totals.average.toFixed(2)} 人
                                        </Typography>
                                    </Box>
                                    <Typography variant="caption" color="text.secondary">
                                        ※ 小数点第2位以下切り上げ
                                    </Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* 計算式説明 */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" sx={{ mb: 2 }}>📖 計算式</Typography>
                                <Divider sx={{ mb: 2 }} />
                                <Box sx={{ bgcolor: 'rgba(255,255,255,0.05)', p: 2, borderRadius: 1, fontFamily: 'monospace' }}>
                                    <Typography>
                                        平均利用者数 = 延べ利用者数 ÷ 開所日数
                                    </Typography>
                                    <Typography sx={{ mt: 1, color: 'text.secondary' }}>
                                        = {totals.totalAttendance} ÷ {totals.totalDays} = {totals.totalDays > 0 ? (totals.totalAttendance / totals.totalDays).toFixed(4) : 0}
                                    </Typography>
                                    <Typography sx={{ mt: 1, color: '#06b6d4' }}>
                                        → 切り上げ: <strong>{totals.average.toFixed(2)}</strong> 人
                                    </Typography>
                                </Box>
                                <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                                    ※ 2026年1月以降のデータは出席記録から自動取得可能です
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}
        </Box>
    );
}
