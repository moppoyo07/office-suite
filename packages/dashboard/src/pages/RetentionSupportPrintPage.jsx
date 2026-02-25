// src/pages/RetentionSupportPrintPage.jsx
// 定着支援レポート印刷ページ（新ウィンドウ印刷方式）

import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
    Box, Container, Typography, Button, CircularProgress,
    Stack, Alert, Paper, TextField, Snackbar
} from '@mui/material';
import { Print, ArrowBack, Save } from '@mui/icons-material';
import { doc, getDoc, setDoc, addDoc, collection, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { addMonths } from 'date-fns';
import { useAuth } from '../features/auth/context/AuthContext';

// 和暦変換
const toWareki = (date) => {
    if (!date) return { year: '', month: '', day: '' };
    const d = date instanceof Date ? date : date.toDate?.() || new Date(date);
    const year = d.getFullYear();
    const reiwaYear = year - 2018;
    return { year: reiwaYear, month: d.getMonth() + 1, day: d.getDate() };
};

// 印刷用HTMLを生成（全てテーブルレイアウト）
const generatePrintHTML = (client, formData, targetDate, staffName) => {
    const todayWareki = toWareki(new Date());
    const empWareki = toWareki(client?.employmentDate);
    const targetWareki = toWareki(targetDate);

    // 支援ログの表示（横並び）
    const supportLogsHTML = formData.supportLogs
        .filter(log => log.date)
        .map(log => {
            const logDate = new Date(log.date);
            const loc = log.location;
            const mtd = log.method;
            return `${logDate.getMonth() + 1}月${logDate.getDate()}日 ｜ 場所：${loc === 'employer' ? '<u>雇用事業主内</u>' : '雇用事業主内'}・${loc === 'office' ? '<u>事業所内</u>' : '事業所内'}・${loc === 'other' ? '<u>その他</u>' : 'その他'} ｜ 方法：${mtd === 'interview' ? '<u>面接</u>' : '面接'}・${mtd === 'phone' ? '<u>電話</u>' : '電話'}・${mtd === 'email' ? '<u>メール</u>' : 'メール'}・${mtd === 'other' ? '<u>その他</u>' : 'その他'}<br>`;
        })
        .join('');

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>定着支援レポート - ${client?.name || ''}</title>
    <style>
        @page {
            size: A4 portrait;
            margin: 8mm;
        }
        body {
            font-family: '游明朝', 'Yu Mincho', 'MS 明朝', serif;
            font-size: 10pt;
            color: #000;
            background: #fff;
            margin: 0;
            padding: 5mm;
        }
        table {
            width: 100%;
            border-collapse: collapse;
        }
        td, th {
            border: 1px solid #000;
            padding: 4px 6px;
            vertical-align: top;
        }
        th {
            background-color: #fffde7;
            font-weight: bold;
            text-align: center;
        }
        .header-table {
            border: none;
            margin-bottom: 8px;
        }
        .header-table td {
            border: none;
            padding: 2px;
        }
        .title {
            font-size: 14pt;
            font-weight: bold;
            text-align: center;
        }
        .form-number {
            text-align: right;
            font-size: 9pt;
        }
        .date-row {
            text-align: right;
            font-size: 9pt;
        }
        .section-header {
            background-color: #fffde7;
            font-weight: bold;
            text-align: center;
        }
        .col-header {
            background-color: #f0f0f0;
            text-align: center;
            font-size: 9pt;
        }
        .content-cell {
            min-height: 60px;
            white-space: pre-wrap;
        }
        .content-cell-tall {
            min-height: 120px;
            white-space: pre-wrap;
        }
        .sign-table {
            width: auto;
            margin-left: auto;
            margin-top: 8px;
        }
        .sign-table td {
            width: 80px;
            height: 50px;
            text-align: center;
            font-size: 9pt;
        }
    </style>
</head>
<body>
    <!-- ヘッダー -->
    <table class="header-table">
        <tr>
            <td style="width: 20%;"></td>
            <td style="width: 60%;" class="title">就労定着支援　支援レポート</td>
            <td style="width: 20%;" class="form-number">(別紙様式１)</td>
        </tr>
        <tr>
            <td colspan="3" class="date-row">
                作成日　令和 ${todayWareki.year} 年 ${todayWareki.month} 月 ${todayWareki.day} 日　　　
                雇用開始日　令和 ${empWareki.year} 年 ${empWareki.month} 月 ${empWareki.day} 日
            </td>
        </tr>
    </table>

    <!-- 基本情報 -->
    <table>
        <tr>
            <th style="width: 12%;">利用者名</th>
            <td style="width: 18%;">${client?.name || ''}</td>
            <th style="width: 12%;">雇用事業主<br>(勤務先)</th>
            <td style="width: 18%;">${client?.employmentCompany || ''}</td>
            <th style="width: 10%;">ご担当者</th>
            <td style="width: 30%;">${formData.employerContact || ''}</td>
        </tr>
    </table>

    <!-- 対象月の支援実績 -->
    <table>
        <tr>
            <th class="section-header">R${targetWareki.year}年 ${targetWareki.month}月 の支援実績</th>
        </tr>
        <tr>
            <td class="content-cell">${supportLogsHTML || '&nbsp;'}</td>
        </tr>
    </table>

    <!-- 当月の主な支援目標 -->
    <table>
        <tr>
            <th class="section-header">当月の主な支援目標</th>
        </tr>
        <tr>
            <td class="content-cell">${formData.monthlyGoals || '&nbsp;'}</td>
        </tr>
    </table>

    <!-- 当月の支援状況 -->
    <table>
        <tr>
            <th colspan="2" class="section-header">当月の支援状況</th>
        </tr>
        <tr>
            <td class="col-header" style="width: 50%;">支援実施内容</td>
            <td class="col-header" style="width: 50%;">支援結果</td>
        </tr>
        <tr>
            <td class="content-cell-tall">${formData.supportContent || '&nbsp;'}</td>
            <td class="content-cell-tall">${formData.supportResults || '&nbsp;'}</td>
        </tr>
    </table>

    <!-- 支援の方向性 -->
    <table>
        <tr>
            <th colspan="2" class="section-header">支援の方向性</th>
        </tr>
        <tr>
            <td class="col-header" style="width: 35%;">今後の支援内容</td>
            <td class="col-header" style="width: 65%;">対象者・事業主・関係機関等の取組</td>
        </tr>
        <tr>
            <td class="content-cell">${formData.futurePlan || '&nbsp;'}</td>
            <td class="content-cell">${formData.stakeholderActions || '&nbsp;'}</td>
        </tr>
    </table>

    <!-- 共有事項 -->
    <table>
        <tr>
            <th style="width: 12%;">共有事項</th>
            <td>${formData.sharedMatters || '&nbsp;'}</td>
        </tr>
    </table>

    <!-- フッター -->
    <table>
        <tr>
            <th style="width: 12%;">事業所名</th>
            <td style="width: 38%;">${formData.facilityName || ''}</td>
            <th style="width: 12%;">担当者</th>
            <td style="width: 38%;">${staffName || ''}</td>
        </tr>
    </table>

    <!-- 署名欄 -->
    <table class="sign-table">
        <tr>
            <td>対象者<br>提示日</td>
        </tr>
        <tr>
            <td>${todayWareki.month}/${todayWareki.day}</td>
        </tr>
    </table>

    <script>
        window.onload = function() {
            window.print();
        };
    </script>
</body>
</html>
    `;
};

export default function RetentionSupportPrintPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { currentUser } = useAuth();

    const clientId = searchParams.get('clientId');
    const month = parseInt(searchParams.get('month')) || 1;
    const reportId = searchParams.get('reportId'); // 既存レポート編集用

    const [client, setClient] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [currentReportId, setCurrentReportId] = useState(reportId);
    const [formData, setFormData] = useState({
        supportLogs: [{ date: '', location: 'office', method: 'interview' }],
        employerContact: '',
        monthlyGoals: '',
        supportContent: '',
        supportResults: '',
        futurePlan: '',
        stakeholderActions: '',
        sharedMatters: '',
        facilityName: '就労移行ITスクール広島',
    });

    // クライアントデータからemployerContactを初期化
    useEffect(() => {
        if (client?.employerContact && !reportId) {
            setFormData(prev => ({ ...prev, employerContact: client.employerContact }));
        }
    }, [client, reportId]);

    // クライアント情報を取得
    useEffect(() => {
        const fetchClient = async () => {
            if (!clientId) return;
            try {
                const docSnap = await getDoc(doc(db, 'clients', clientId));
                if (docSnap.exists()) {
                    setClient({ id: docSnap.id, ...docSnap.data() });
                }
            } catch (error) {
                console.error('クライアント取得エラー:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchClient();
    }, [clientId]);

    // 既存レポートを読み込み
    useEffect(() => {
        const fetchReport = async () => {
            if (!reportId) return;
            try {
                const docSnap = await getDoc(doc(db, 'retentionReports', reportId));
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setFormData(data.formData || {});
                }
            } catch (error) {
                console.error('レポート取得エラー:', error);
            }
        };
        fetchReport();
    }, [reportId]);

    // 保存処理
    const handleSave = async () => {
        if (!clientId || !client) return;
        setSaving(true);
        try {
            const targetDate = getTargetDate();
            const reportData = {
                clientId,
                clientName: client.name || '',
                month,
                targetDate: Timestamp.fromDate(targetDate),
                formData,
                updatedAt: serverTimestamp(),
                updatedBy: currentUser?.uid || '',
            };

            if (currentReportId) {
                // 既存レポートを更新
                await setDoc(doc(db, 'retentionReports', currentReportId), reportData, { merge: true });
            } else {
                // 新規レポートを作成
                reportData.createdAt = serverTimestamp();
                reportData.createdBy = currentUser?.uid || '';
                const docRef = await addDoc(collection(db, 'retentionReports'), reportData);
                setCurrentReportId(docRef.id);
            }
            setSnackbar({ open: true, message: '保存しました', severity: 'success' });
        } catch (error) {
            console.error('保存エラー:', error);
            setSnackbar({ open: true, message: '保存に失敗しました', severity: 'error' });
        } finally {
            setSaving(false);
        }
    };

    // 印刷ハンドラ - 新しいウィンドウを開いて印刷
    const handlePrint = () => {
        const targetDate = getTargetDate();
        const staffName = currentUser?.displayName || currentUser?.email || '';
        const printHTML = generatePrintHTML(client, formData, targetDate, staffName);

        // 新しいウィンドウを開く
        const printWindow = window.open('', '_blank', 'width=800,height=600');
        if (printWindow) {
            printWindow.document.write(printHTML);
            printWindow.document.close();
        } else {
            alert('ポップアップがブロックされました。ポップアップを許可してください。');
        }
    };

    // 対象年月を計算
    const getTargetDate = () => {
        if (!client?.employmentDate) return new Date();
        const empDate = client.employmentDate.toDate?.() || new Date(client.employmentDate);
        return addMonths(empDate, month - 1);
    };

    // ログインユーザー名を取得
    const staffName = currentUser?.displayName || currentUser?.email || '';

    if (!clientId) {
        return <Container><Alert severity="error">パラメータが不正です</Alert></Container>;
    }

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    const targetDate = getTargetDate();
    const todayWareki = toWareki(new Date());
    const empWareki = toWareki(client?.employmentDate);
    const targetWareki = toWareki(targetDate);

    return (
        <Container maxWidth="lg">
            <Box sx={{ py: 2 }}>
                {/* ヘッダー */}
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                    <Stack direction="row" alignItems="center" spacing={2}>
                        <Button startIcon={<ArrowBack />} onClick={() => navigate(-1)} variant="outlined" size="small">
                            戻る
                        </Button>
                        <Typography variant="h5" fontWeight="bold">
                            定着支援レポート - {client?.name}
                        </Typography>
                        <Stack direction="row" alignItems="center" spacing={1}>
                            <Button
                                variant="outlined"
                                size="small"
                                disabled={month <= 1}
                                onClick={() => navigate(`/retention-support/print?clientId=${clientId}&month=${month - 1}`)}
                            >
                                ◀ 前月
                            </Button>
                            <Typography variant="h6" sx={{ mx: 2, minWidth: '80px', textAlign: 'center' }}>
                                {month}ヶ月目
                            </Typography>
                            <Button
                                variant="outlined"
                                size="small"
                                disabled={month >= 6}
                                onClick={() => navigate(`/retention-support/print?clientId=${clientId}&month=${month + 1}`)}
                            >
                                次月 ▶
                            </Button>
                        </Stack>
                    </Stack>
                    <Stack direction="row" spacing={2}>
                        <Button
                            variant="contained"
                            color="primary"
                            size="large"
                            startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <Save />}
                            onClick={handleSave}
                            disabled={saving}
                        >
                            {saving ? '保存中...' : '保存'}
                        </Button>
                        <Button variant="contained" color="success" size="large" startIcon={<Print />} onClick={handlePrint}>
                            印刷
                        </Button>
                    </Stack>
                </Stack>

                {/* 入力フォーム */}
                <Paper sx={{ p: 3, mb: 3, bgcolor: 'rgba(30, 41, 59, 0.9)' }}>
                    <Typography variant="h6" sx={{ color: '#10b981', mb: 2 }}>📝 支援記録入力</Typography>

                    {/* ご担当者（就職先）入力 */}
                    <TextField
                        label="ご担当者（就職先）"
                        placeholder="就職先の担当者名を入力"
                        fullWidth
                        size="small"
                        value={formData.employerContact}
                        onChange={(e) => setFormData(prev => ({ ...prev, employerContact: e.target.value }))}
                        sx={{ mb: 2 }}
                    />

                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2, mb: 2 }}>
                        <TextField
                            label="支援ログ（日付）"
                            type="date"
                            size="small"
                            value={formData.supportLogs[0]?.date || ''}
                            onChange={(e) => setFormData(prev => ({
                                ...prev,
                                supportLogs: [{ ...prev.supportLogs[0], date: e.target.value }]
                            }))}
                            InputLabelProps={{ shrink: true }}
                        />
                        <TextField
                            label="場所"
                            select
                            size="small"
                            value={formData.supportLogs[0]?.location || 'office'}
                            onChange={(e) => setFormData(prev => ({
                                ...prev,
                                supportLogs: [{ ...prev.supportLogs[0], location: e.target.value }]
                            }))}
                            SelectProps={{ native: true }}
                        >
                            <option value="employer">雇用事業主内</option>
                            <option value="office">事業所内</option>
                            <option value="other">その他</option>
                        </TextField>
                    </Box>

                    <TextField
                        label="当月の主な支援目標"
                        multiline
                        rows={2}
                        fullWidth
                        value={formData.monthlyGoals}
                        onChange={(e) => setFormData(prev => ({ ...prev, monthlyGoals: e.target.value }))}
                        sx={{ mb: 2 }}
                    />

                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2, mb: 2 }}>
                        <TextField
                            label="支援実施内容"
                            multiline
                            rows={4}
                            fullWidth
                            value={formData.supportContent}
                            onChange={(e) => setFormData(prev => ({ ...prev, supportContent: e.target.value }))}
                        />
                        <TextField
                            label="支援結果"
                            multiline
                            rows={4}
                            fullWidth
                            value={formData.supportResults}
                            onChange={(e) => setFormData(prev => ({ ...prev, supportResults: e.target.value }))}
                        />
                    </Box>

                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2, mb: 2 }}>
                        <TextField
                            label="今後の支援内容"
                            multiline
                            rows={2}
                            fullWidth
                            value={formData.futurePlan}
                            onChange={(e) => setFormData(prev => ({ ...prev, futurePlan: e.target.value }))}
                        />
                        <TextField
                            label="対象者・事業主・関係機関等の取組"
                            multiline
                            rows={2}
                            fullWidth
                            value={formData.stakeholderActions}
                            onChange={(e) => setFormData(prev => ({ ...prev, stakeholderActions: e.target.value }))}
                        />
                    </Box>

                    <TextField
                        label="共有事項"
                        multiline
                        rows={2}
                        fullWidth
                        value={formData.sharedMatters}
                        onChange={(e) => setFormData(prev => ({ ...prev, sharedMatters: e.target.value }))}
                    />
                </Paper>

                {/* 印刷プレビュー */}
                <Paper sx={{ p: 3, bgcolor: '#fff' }}>
                    <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 2 }}>
                        印刷プレビュー（印刷ボタンを押すと新しいウィンドウで印刷できます）
                    </Typography>

                    {/* プレビュー表示 */}
                    <Box sx={{
                        fontFamily: '"Yu Mincho", "游明朝", serif',
                        fontSize: '11pt',
                        color: '#000',
                        lineHeight: 1.5
                    }}>
                        {/* Header */}
                        <Box sx={{ position: 'relative', mb: 2 }}>
                            <Box sx={{ position: 'absolute', top: 0, right: 0, fontSize: '10pt' }}>(別紙様式１)</Box>
                            <Typography sx={{ textAlign: 'center', fontSize: '16pt', fontWeight: 'bold', mb: 1 }}>
                                就労定着支援　支援レポート
                            </Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 3, fontSize: '10pt' }}>
                                <span>作成日　令和 {todayWareki.year} 年 {todayWareki.month} 月 {todayWareki.day} 日</span>
                                <span>雇用開始日　令和 {empWareki.year} 年 {empWareki.month} 月 {empWareki.day} 日</span>
                            </Box>
                        </Box>

                        {/* 基本情報テーブル */}
                        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000' }}>
                            <tbody>
                                <tr>
                                    <th style={{ width: '70px', border: '1px solid #000', padding: '4px 6px', backgroundColor: '#fffde7', fontWeight: 'bold', textAlign: 'center' }}>利用者名</th>
                                    <td style={{ width: '120px', border: '1px solid #000', padding: '4px 6px' }}>{client?.name || ''}</td>
                                    <th style={{ width: '70px', border: '1px solid #000', padding: '4px 6px', backgroundColor: '#fffde7', fontWeight: 'bold', textAlign: 'center', fontSize: '9pt' }}>雇用事業主<br />(勤務先)</th>
                                    <td style={{ width: '120px', border: '1px solid #000', padding: '4px 6px' }}>{client?.employmentCompany || ''}</td>
                                    <th style={{ width: '60px', border: '1px solid #000', padding: '4px 6px', backgroundColor: '#fffde7', fontWeight: 'bold', textAlign: 'center' }}>ご担当者</th>
                                    <td style={{ border: '1px solid #000', padding: '4px 6px' }}>{formData.employerContact || ''}</td>
                                </tr>
                            </tbody>
                        </table>

                        {/* 対象月 */}
                        <Box sx={{ border: '1px solid #000', borderTop: 0 }}>
                            <Box sx={{ backgroundColor: '#fffde7', fontWeight: 'bold', textAlign: 'center', p: '4px', borderBottom: '1px solid #000' }}>
                                R{targetWareki.year}年 {targetWareki.month}月 の支援実績
                            </Box>
                            <Box sx={{ p: 1, minHeight: '60px', fontSize: '10pt' }}>
                                {formData.supportLogs.filter(log => log.date).map((log, index) => {
                                    const logDate = new Date(log.date);
                                    return (
                                        <Box key={index} sx={{ mb: '4px' }}>
                                            <strong>{logDate.getMonth() + 1}月 {logDate.getDate()}日</strong>
                                            {' '}｜ 場所：
                                            <span style={{ textDecoration: log.location === 'employer' ? 'underline' : 'none' }}>雇用事業主内</span>・
                                            <span style={{ textDecoration: log.location === 'office' ? 'underline' : 'none' }}>事業所内</span>・
                                            <span style={{ textDecoration: log.location === 'other' ? 'underline' : 'none' }}>その他</span>
                                        </Box>
                                    );
                                })}
                            </Box>
                        </Box>

                        {/* 当月の主な支援目標 */}
                        <Box sx={{ border: '1px solid #000', borderTop: 0 }}>
                            <Box sx={{ backgroundColor: '#fffde7', fontWeight: 'bold', textAlign: 'center', p: '4px', borderBottom: '1px solid #000' }}>
                                当月の主な支援目標
                            </Box>
                            <Box sx={{ p: 1, minHeight: '60px', whiteSpace: 'pre-wrap', fontSize: '10pt' }}>
                                {formData.monthlyGoals}
                            </Box>
                        </Box>

                        {/* 共有事項 */}
                        <Box sx={{ display: 'flex', border: '1px solid #000', borderTop: 0 }}>
                            <Box sx={{ width: '80px', backgroundColor: '#fffde7', fontWeight: 'bold', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: '1px solid #000' }}>
                                共有事項
                            </Box>
                            <Box sx={{ flex: 1, p: 1, minHeight: '30px' }}>
                                {formData.sharedMatters}
                            </Box>
                        </Box>

                        {/* フッター */}
                        <Box sx={{ display: 'flex', border: '1px solid #000', borderTop: 0 }}>
                            <Box sx={{ p: '4px 8px', textAlign: 'center', borderRight: '1px solid #000', backgroundColor: '#fffde7', fontWeight: 'bold', width: '80px' }}>事業所名</Box>
                            <Box sx={{ p: '4px 8px', textAlign: 'center', borderRight: '1px solid #000', flex: 1 }}>{formData.facilityName}</Box>
                            <Box sx={{ p: '4px 8px', textAlign: 'center', borderRight: '1px solid #000', backgroundColor: '#fffde7', fontWeight: 'bold', width: '80px' }}>担当者</Box>
                            <Box sx={{ p: '4px 8px', textAlign: 'center', flex: 1 }}>{staffName}</Box>
                        </Box>
                    </Box>
                </Paper>
            </Box>

            {/* 保存通知 */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={3000}
                onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert severity={snackbar.severity} onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Container>
    );
}
