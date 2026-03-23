// src/pages/StaffWorkSchedulePage.jsx
// 従業者の勤務体制・勤務形態一覧表

import React, { useState, useEffect, useMemo } from 'react';
import {
    Box, Typography, Paper, Grid, CircularProgress, Alert,
    FormControl, InputLabel, Select, MenuItem, TextField,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Button, Chip, IconButton, Tooltip
} from '@mui/material';
import { collection, doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../features/auth/context/AuthContext';
import SaveIcon from '@mui/icons-material/Save';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

// 職種一覧
const ROLES = [
    { id: 'manager', label: '管理者', required: true },
    { id: 'service_manager', label: 'サービス管理責任者', required: true },
    { id: 'vocational_instructor', label: '職業指導員', required: true },
    { id: 'life_supporter', label: '生活支援員', required: true },
    { id: 'employment_supporter', label: '就労支援員', required: true },
];

// 月の日数を取得
const getDaysInMonth = (year, month) => {
    return new Date(year, month, 0).getDate();
};

// 年月リスト生成
const generateYearMonths = () => {
    const result = [];
    const now = new Date();
    for (let i = -12; i <= 12; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
        result.push({
            value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
            label: `${d.getFullYear()}年${d.getMonth() + 1}月`,
        });
    }
    return result;
};

export default function StaffWorkSchedulePage() {
    const { currentUser } = useAuth();
    const companyId = currentUser?.companyId || null;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // 年月選択
    const now = new Date();
    const [yearMonth, setYearMonth] = useState(
        `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    );

    // 所定労働時間（週）
    const [standardHours, setStandardHours] = useState(40);

    // スタッフデータ
    const [staffList, setStaffList] = useState([]);

    const yearMonthOptions = useMemo(() => generateYearMonths(), []);
    const [year, month] = yearMonth.split('-').map(Number);
    const daysInMonth = getDaysInMonth(year, month);

    // 4週間分の日数（最大28日）
    const weeks = [
        { label: '第1週', days: Array.from({ length: 7 }, (_, i) => i + 1) },
        { label: '第2週', days: Array.from({ length: 7 }, (_, i) => i + 8) },
        { label: '第3週', days: Array.from({ length: 7 }, (_, i) => i + 15) },
        { label: '第4週', days: Array.from({ length: 7 }, (_, i) => i + 22).filter(d => d <= daysInMonth) },
    ];

    // データ読み込み
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const docId = companyId ? `${companyId}_${yearMonth}` : yearMonth;
                const docRef = doc(db, 'staffWorkSchedules', docId);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setStandardHours(data.standardHours || 40);
                    setStaffList(data.staff || []);
                } else {
                    // 初期データ（職種ごとに1人ずつ）
                    setStaffList(ROLES.map(role => ({
                        id: `${role.id}_1`,
                        role: role.id,
                        roleLabel: role.label,
                        name: '',
                        workType: 'A', // A: 常勤専従, B: 常勤兼務, C: 非常勤
                        schedule: {},
                    })));
                }
            } catch (err) {
                console.error('データ取得エラー:', err);
                setError('データの取得に失敗しました');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [yearMonth, companyId]);

    // スタッフ追加
    const handleAddStaff = (roleId) => {
        const role = ROLES.find(r => r.id === roleId);
        const count = staffList.filter(s => s.role === roleId).length + 1;
        setStaffList(prev => [
            ...prev,
            {
                id: `${roleId}_${Date.now()}`,
                role: roleId,
                roleLabel: role.label,
                name: '',
                workType: 'A',
                schedule: {},
            },
        ]);
    };

    // スタッフ削除
    const handleRemoveStaff = (id) => {
        setStaffList(prev => prev.filter(s => s.id !== id));
    };

    // スケジュール更新
    const handleScheduleChange = (staffId, day, value) => {
        setStaffList(prev =>
            prev.map(staff =>
                staff.id === staffId
                    ? {
                        ...staff,
                        schedule: {
                            ...staff.schedule,
                            [day]: value === '' ? undefined : parseFloat(value) || 0,
                        },
                    }
                    : staff
            )
        );
    };

    // 名前・勤務形態更新
    const handleStaffChange = (staffId, field, value) => {
        setStaffList(prev =>
            prev.map(staff =>
                staff.id === staffId ? { ...staff, [field]: value } : staff
            )
        );
    };

    // 計算
    const calculateTotals = (schedule) => {
        const total = Object.values(schedule).reduce((sum, h) => sum + (h || 0), 0);
        const weeklyAvg = total / 4;
        const fte = standardHours > 0 ? weeklyAvg / standardHours : 0;
        return { total, weeklyAvg, fte };
    };

    // 保存
    const handleSave = async () => {
        setSaving(true);
        setError(null);
        try {
            const docId = companyId ? `${companyId}_${yearMonth}` : yearMonth;
            const docRef = doc(db, 'staffWorkSchedules', docId);
            await setDoc(docRef, {
                yearMonth,
                companyId: companyId || null,
                standardHours,
                staff: staffList.map(s => ({
                    ...s,
                    ...calculateTotals(s.schedule),
                })),
                updatedAt: Timestamp.now(),
            });
            setSuccess('保存しました');
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            console.error('保存エラー:', err);
            setError('保存に失敗しました');
        } finally {
            setSaving(false);
        }
    };

    // 職種別グループ
    const groupedStaff = useMemo(() => {
        const groups = {};
        ROLES.forEach(role => {
            groups[role.id] = staffList.filter(s => s.role === role.id);
        });
        return groups;
    }, [staffList]);

    // 職種別合計
    const roleTotals = useMemo(() => {
        const totals = {};
        ROLES.forEach(role => {
            const roleStaff = staffList.filter(s => s.role === role.id);
            const totalFte = roleStaff.reduce((sum, s) => sum + calculateTotals(s.schedule).fte, 0);
            totals[role.id] = totalFte;
        });
        return totals;
    }, [staffList, standardHours]);

    return (
        <Box sx={{ pb: 4 }}>
            {/* ヘッダー */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                <Typography variant="h4">
                    📋 勤務形態一覧表
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <FormControl size="small" sx={{ minWidth: 140 }}>
                        <InputLabel>年月</InputLabel>
                        <Select
                            value={yearMonth}
                            label="年月"
                            onChange={(e) => setYearMonth(e.target.value)}
                        >
                            {yearMonthOptions.map(opt => (
                                <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <TextField
                        label="週所定労働時間"
                        type="number"
                        size="small"
                        value={standardHours}
                        onChange={(e) => setStandardHours(parseInt(e.target.value) || 40)}
                        sx={{ width: 120 }}
                        inputProps={{ min: 1, max: 60 }}
                    />
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
                <>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                        従業者の勤務の体制及び勤務形態一覧表
                    </Typography>

                    <Paper sx={{ p: 2, overflowX: 'auto' }}>
                        <TableContainer>
                            <Table size="small" sx={{ minWidth: 1200 }}>
                                <TableHead>
                                    <TableRow sx={{ bgcolor: 'rgba(255,255,255,0.05)' }}>
                                        <TableCell sx={{ fontWeight: 'bold', minWidth: 100, position: 'sticky', left: 0, bgcolor: '#1e1e1e', zIndex: 2 }}>職種</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', minWidth: 60 }}>勤務形態</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', minWidth: 100 }}>氏名</TableCell>
                                        {weeks.map((week, wi) => (
                                            <TableCell key={wi} colSpan={week.days.length} sx={{ textAlign: 'center', fontWeight: 'bold', borderLeft: '1px solid rgba(255,255,255,0.1)' }}>
                                                {week.label}
                                            </TableCell>
                                        ))}
                                        <TableCell sx={{ fontWeight: 'bold', borderLeft: '2px solid rgba(6, 182, 212, 0.5)' }}>4週計</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>週平均</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>常勤換算</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', width: 50 }}></TableCell>
                                    </TableRow>
                                    <TableRow sx={{ bgcolor: 'rgba(255,255,255,0.03)' }}>
                                        <TableCell colSpan={3}></TableCell>
                                        {weeks.map((week, wi) =>
                                            week.days.map(day => (
                                                <TableCell key={`h-${day}`} sx={{ textAlign: 'center', fontSize: '0.75rem', p: 0.5, borderLeft: day === week.days[0] ? '1px solid rgba(255,255,255,0.1)' : undefined }}>
                                                    {day}
                                                </TableCell>
                                            ))
                                        )}
                                        <TableCell colSpan={4}></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {ROLES.map(role => (
                                        <React.Fragment key={role.id}>
                                            {groupedStaff[role.id]?.map((staff, idx) => {
                                                const totals = calculateTotals(staff.schedule);
                                                return (
                                                    <TableRow key={staff.id} hover>
                                                        <TableCell sx={{ position: 'sticky', left: 0, bgcolor: '#1e1e1e', zIndex: 1 }}>
                                                            {idx === 0 ? role.label : ''}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Select
                                                                size="small"
                                                                value={staff.workType}
                                                                onChange={(e) => handleStaffChange(staff.id, 'workType', e.target.value)}
                                                                sx={{ fontSize: '0.75rem', minWidth: 50 }}
                                                            >
                                                                <MenuItem value="A">A</MenuItem>
                                                                <MenuItem value="B">B</MenuItem>
                                                                <MenuItem value="C">C</MenuItem>
                                                            </Select>
                                                        </TableCell>
                                                        <TableCell>
                                                            <TextField
                                                                size="small"
                                                                value={staff.name}
                                                                onChange={(e) => handleStaffChange(staff.id, 'name', e.target.value)}
                                                                placeholder="氏名"
                                                                sx={{ width: 80 }}
                                                                inputProps={{ style: { fontSize: '0.8rem' } }}
                                                            />
                                                        </TableCell>
                                                        {weeks.map((week, wi) =>
                                                            week.days.map(day => (
                                                                <TableCell key={`${staff.id}-${day}`} sx={{ p: 0.25, borderLeft: day === week.days[0] ? '1px solid rgba(255,255,255,0.1)' : undefined }}>
                                                                    <TextField
                                                                        size="small"
                                                                        type="number"
                                                                        value={staff.schedule[day] ?? ''}
                                                                        onChange={(e) => handleScheduleChange(staff.id, day, e.target.value)}
                                                                        sx={{ width: 40 }}
                                                                        inputProps={{ min: 0, max: 24, step: 0.5, style: { fontSize: '0.75rem', padding: '4px', textAlign: 'center' } }}
                                                                    />
                                                                </TableCell>
                                                            ))
                                                        )}
                                                        <TableCell sx={{ fontWeight: 'bold', borderLeft: '2px solid rgba(6, 182, 212, 0.5)' }}>
                                                            {totals.total.toFixed(0)}
                                                        </TableCell>
                                                        <TableCell sx={{ fontWeight: 'bold' }}>
                                                            {totals.weeklyAvg.toFixed(1)}
                                                        </TableCell>
                                                        <TableCell sx={{ fontWeight: 'bold', color: '#06b6d4' }}>
                                                            {totals.fte.toFixed(2)}
                                                        </TableCell>
                                                        <TableCell>
                                                            <IconButton size="small" onClick={() => handleRemoveStaff(staff.id)} color="error">
                                                                <DeleteIcon fontSize="small" />
                                                            </IconButton>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                            {/* 職種追加ボタン行 */}
                                            <TableRow>
                                                <TableCell colSpan={3 + weeks.reduce((sum, w) => sum + w.days.length, 0) + 4}>
                                                    <Button size="small" startIcon={<AddIcon />} onClick={() => handleAddStaff(role.id)}>
                                                        {role.label}を追加
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        </React.Fragment>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>

                    {/* 常勤換算サマリー */}
                    <Paper sx={{ p: 2, mt: 3 }}>
                        <Typography variant="h6" sx={{ mb: 2 }}>📊 常勤換算サマリー</Typography>
                        <Grid container spacing={2}>
                            {ROLES.map(role => (
                                <Grid size={{ xs: 6, sm: 4, md: 2.4 }} key={role.id}>
                                    <Box sx={{ p: 2, bgcolor: 'rgba(6, 182, 212, 0.1)', borderRadius: 1 }}>
                                        <Typography variant="caption" color="text.secondary">{role.label}</Typography>
                                        <Typography variant="h5" sx={{ color: '#06b6d4', fontWeight: 'bold' }}>
                                            {roleTotals[role.id]?.toFixed(2) || '0.00'}
                                        </Typography>
                                        <Typography variant="caption">常勤換算人数</Typography>
                                    </Box>
                                </Grid>
                            ))}
                        </Grid>
                        <Box sx={{ mt: 2, p: 2, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 1 }}>
                            <Typography variant="body2">
                                当該事業所・施設における常勤職員の勤務すべき1週間の時間数: <strong>{standardHours}時間</strong>
                            </Typography>
                        </Box>
                    </Paper>
                </>
            )}
        </Box>
    );
}
