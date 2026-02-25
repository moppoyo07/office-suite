// src/features/retention/RetentionSupportNoteModal.jsx
// 定着支援ノート入力モーダル（厚労省準拠 別紙様式１）

import { useState, useEffect, useRef } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    TextField,
    Grid,
    IconButton,
    Divider,
    FormControl,
    Select,
    MenuItem,
    Paper,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PrintIcon from '@mui/icons-material/Print';
import SaveIcon from '@mui/icons-material/Save';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { format, addMonths } from 'date-fns';
import { ja } from 'date-fns/locale';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/index';
import { useReactToPrint } from 'react-to-print';
import RetentionSupportReportPrint from './RetentionSupportReportPrint';

// 和暦変換
const toWareki = (date) => {
    if (!date) return { era: 'R', year: '', month: '', day: '' };
    const d = date instanceof Date ? date : date.toDate?.() || new Date(date);
    const year = d.getFullYear();
    const reiwaYear = year - 2018;
    return {
        era: 'R',
        year: reiwaYear,
        month: d.getMonth() + 1,
        day: d.getDate(),
    };
};

export default function RetentionSupportNoteModal({
    open,
    onClose,
    client,
    onSaveAndAdvance,
}) {
    const printRef = useRef();
    const [loading, setLoading] = useState(false);

    // ステータスから月数を取得
    const getCurrentMonth = () => {
        if (!client?.status) return 1;
        const match = client.status.match(/follow-up-m(\d+)/);
        return match ? parseInt(match[1], 10) : 1;
    };

    // 対象年月を計算
    const getTargetYearMonth = () => {
        if (!client?.employmentDate) return new Date();
        const empDate = client.employmentDate.toDate?.() || new Date(client.employmentDate);
        return addMonths(empDate, getCurrentMonth() - 1);
    };

    // フォームデータ
    const [formData, setFormData] = useState({
        supportLogs: [{ date: '', location: 'office', method: 'interview' }],
        monthlyGoals: '',
        supportContent: '',
        supportResults: '',
        futurePlan: '',
        stakeholderActions: '',
        sharedMatters: '',
        facilityName: 'Manecto就労定着センター',
        staffName: '',
        presentedDate: '',
    });

    // クライアント変更時にリセット
    useEffect(() => {
        if (client) {
            setFormData(prev => ({
                ...prev,
                supportLogs: [{ date: '', location: 'office', method: 'interview' }],
                monthlyGoals: '',
                supportContent: '',
                supportResults: '',
                futurePlan: '',
                stakeholderActions: '',
                sharedMatters: '',
            }));
        }
    }, [client?.id]);

    // 支援ログ操作
    const addSupportLog = () => {
        setFormData(prev => ({
            ...prev,
            supportLogs: [...prev.supportLogs, { date: '', location: 'office', method: 'interview' }],
        }));
    };

    const removeSupportLog = (index) => {
        setFormData(prev => ({
            ...prev,
            supportLogs: prev.supportLogs.filter((_, i) => i !== index),
        }));
    };

    const updateSupportLog = (index, field, value) => {
        setFormData(prev => ({
            ...prev,
            supportLogs: prev.supportLogs.map((log, i) =>
                i === index ? { ...log, [field]: value } : log
            ),
        }));
    };

    // 印刷
    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: `定着支援レポート_${client?.name}_${getCurrentMonth()}ヶ月目`,
    });

    // 保存して次月へ
    const handleSaveAndAdvance = async () => {
        if (!client) return;
        setLoading(true);
        try {
            const targetDate = getTargetYearMonth();
            const reportData = {
                clientId: client.id,
                month: getCurrentMonth(),
                targetYearMonth: format(targetDate, 'yyyy-MM'),
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                // 自動入力（employmentCompanyフィールドから取得）
                clientName: client.name || '',
                employerName: client.employmentCompany || '',
                employerContact: client.employerContact || '',
                employmentStartDate: client.employmentDate || null,
                // 入力データ
                ...formData,
            };

            await addDoc(collection(db, 'retentionSupportLogs'), reportData);

            // 親コンポーネントに通知（月を進める）
            if (onSaveAndAdvance) {
                onSaveAndAdvance(client.id);
            }
            onClose();
        } catch (error) {
            console.error('保存エラー:', error);
            alert('保存に失敗しました');
        } finally {
            setLoading(false);
        }
    };

    if (!client) return null;

    const targetDate = getTargetYearMonth();
    const wareki = toWareki(targetDate);
    const empWareki = toWareki(client.employmentDate);

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="lg"
            fullWidth
            PaperProps={{
                sx: { bgcolor: '#1e293b', minHeight: '80vh' }
            }}
        >
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    📝 定着支援ノート - {getCurrentMonth()}ヶ月目
                </Typography>
                <IconButton onClick={onClose} size="small">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent dividers sx={{ p: 3 }}>
                <Grid container spacing={3}>
                    {/* 左側：入力フォーム */}
                    <Grid item xs={12} md={6}>
                        {/* 基本情報（自動入力） */}
                        <Paper sx={{ p: 2, mb: 2, bgcolor: 'rgba(59, 130, 246, 0.1)' }}>
                            <Typography variant="subtitle2" sx={{ mb: 1, color: '#94a3b8' }}>
                                基本情報（自動入力）
                            </Typography>
                            <Grid container spacing={1}>
                                <Grid item xs={6}>
                                    <Typography variant="body2" color="text.secondary">利用者名</Typography>
                                    <Typography fontWeight="bold">{client.name}</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="body2" color="text.secondary">対象月</Typography>
                                    <Typography fontWeight="bold">R{wareki.year}年{wareki.month}月</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="body2" color="text.secondary">雇用事業主</Typography>
                                    <Typography>{client.employmentCompany || '未設定'}</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="body2" color="text.secondary">雇用開始日</Typography>
                                    <Typography>R{empWareki.year}年{empWareki.month}月{empWareki.day}日</Typography>
                                </Grid>
                            </Grid>
                        </Paper>

                        {/* 支援ログ */}
                        <Paper sx={{ p: 2, mb: 2, bgcolor: 'rgba(30, 41, 59, 0.8)' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                <Typography variant="subtitle2">支援ログ</Typography>
                                <Button size="small" startIcon={<AddIcon />} onClick={addSupportLog}>追加</Button>
                            </Box>
                            {formData.supportLogs.map((log, index) => (
                                <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
                                    <TextField
                                        type="date"
                                        size="small"
                                        value={log.date}
                                        onChange={(e) => updateSupportLog(index, 'date', e.target.value)}
                                        sx={{ width: 140 }}
                                    />
                                    <FormControl size="small" sx={{ minWidth: 100 }}>
                                        <Select
                                            value={log.location}
                                            onChange={(e) => updateSupportLog(index, 'location', e.target.value)}
                                        >
                                            <MenuItem value="employer">雇用事業主内</MenuItem>
                                            <MenuItem value="office">事業所内</MenuItem>
                                            <MenuItem value="other">その他</MenuItem>
                                        </Select>
                                    </FormControl>
                                    <FormControl size="small" sx={{ minWidth: 100 }}>
                                        <Select
                                            value={log.method}
                                            onChange={(e) => updateSupportLog(index, 'method', e.target.value)}
                                        >
                                            <MenuItem value="interview">面接</MenuItem>
                                            <MenuItem value="phone">電話</MenuItem>
                                            <MenuItem value="email">メール</MenuItem>
                                            <MenuItem value="other">その他</MenuItem>
                                        </Select>
                                    </FormControl>
                                    {formData.supportLogs.length > 1 && (
                                        <IconButton size="small" onClick={() => removeSupportLog(index)}>
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    )}
                                </Box>
                            ))}
                        </Paper>

                        {/* 当月の支援目標 */}
                        <TextField
                            label="当月の主な支援目標"
                            multiline
                            rows={3}
                            fullWidth
                            value={formData.monthlyGoals}
                            onChange={(e) => setFormData(prev => ({ ...prev, monthlyGoals: e.target.value }))}
                            placeholder="① 職場での人間関係の構築をサポートする。&#10;② 夏場の体調管理について助言する。"
                            sx={{ mb: 2 }}
                        />

                        {/* 支援実施内容 */}
                        <TextField
                            label="支援実施内容"
                            multiline
                            rows={5}
                            fullWidth
                            value={formData.supportContent}
                            onChange={(e) => setFormData(prev => ({ ...prev, supportContent: e.target.value }))}
                            placeholder="① 定期面談（2/5）&#10;来所面談を実施。ご本人より..."
                            sx={{ mb: 2 }}
                        />

                        {/* 支援結果 */}
                        <TextField
                            label="支援結果"
                            multiline
                            rows={5}
                            fullWidth
                            value={formData.supportResults}
                            onChange={(e) => setFormData(prev => ({ ...prev, supportResults: e.target.value }))}
                            placeholder="① 職場の人間関係については..."
                            sx={{ mb: 2 }}
                        />

                        {/* 今後の支援内容 */}
                        <TextField
                            label="今後の支援内容"
                            multiline
                            rows={3}
                            fullWidth
                            value={formData.futurePlan}
                            onChange={(e) => setFormData(prev => ({ ...prev, futurePlan: e.target.value }))}
                            sx={{ mb: 2 }}
                        />

                        {/* 対象者・事業主の取組 */}
                        <TextField
                            label="対象者・事業主・関係機関等の取組"
                            multiline
                            rows={4}
                            fullWidth
                            value={formData.stakeholderActions}
                            onChange={(e) => setFormData(prev => ({ ...prev, stakeholderActions: e.target.value }))}
                            placeholder="（対象者）&#10;毎日の睡眠時間を記録し...&#10;&#10;（事業主）&#10;業務量の調整について..."
                            sx={{ mb: 2 }}
                        />

                        {/* 共有事項 */}
                        <TextField
                            label="共有事項"
                            multiline
                            rows={2}
                            fullWidth
                            value={formData.sharedMatters}
                            onChange={(e) => setFormData(prev => ({ ...prev, sharedMatters: e.target.value }))}
                            sx={{ mb: 2 }}
                        />

                        {/* 署名情報 */}
                        <Grid container spacing={2}>
                            <Grid item xs={6}>
                                <TextField
                                    label="事業所名"
                                    fullWidth
                                    size="small"
                                    value={formData.facilityName}
                                    onChange={(e) => setFormData(prev => ({ ...prev, facilityName: e.target.value }))}
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <TextField
                                    label="担当者名"
                                    fullWidth
                                    size="small"
                                    value={formData.staffName}
                                    onChange={(e) => setFormData(prev => ({ ...prev, staffName: e.target.value }))}
                                />
                            </Grid>
                        </Grid>
                    </Grid>

                    {/* 右側：印刷プレビュー */}
                    <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 1, bgcolor: '#fff', minHeight: 600, overflow: 'auto' }}>
                            <Typography variant="caption" sx={{ color: '#64748b', mb: 1, display: 'block' }}>
                                印刷プレビュー
                            </Typography>
                            <Box sx={{ transform: 'scale(0.5)', transformOrigin: 'top left', width: '200%' }}>
                                {/* プレビュー用（refなし） */}
                                <RetentionSupportReportPrint
                                    client={client}
                                    formData={formData}
                                    targetDate={targetDate}
                                    month={getCurrentMonth()}
                                />
                            </Box>
                        </Paper>
                    </Grid>
                </Grid>

                {/* 印刷用（画面では非表示、印刷時のみ表示） */}
                <Box
                    ref={printRef}
                    sx={{
                        position: 'absolute',
                        left: '-9999px',
                        top: 0,
                        '@media print': {
                            position: 'static',
                            left: 'auto',
                        }
                    }}
                >
                    <RetentionSupportReportPrint
                        client={client}
                        formData={formData}
                        targetDate={targetDate}
                        month={getCurrentMonth()}
                    />
                </Box>
            </DialogContent>

            <DialogActions sx={{ p: 2, gap: 1 }}>
                <Button onClick={onClose} color="inherit">
                    キャンセル
                </Button>
                <Button
                    variant="outlined"
                    startIcon={<PrintIcon />}
                    onClick={handlePrint}
                >
                    印刷
                </Button>
                <Button
                    variant="contained"
                    color="success"
                    startIcon={<SaveIcon />}
                    onClick={handleSaveAndAdvance}
                    disabled={loading}
                >
                    {loading ? '保存中...' : '保存して次月へ'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
