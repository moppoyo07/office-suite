// src/pages/BillingInvoicePrintPage.jsx
// 利用料請求書 一括印刷ページ

import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
    Box, Container, Typography, Button, CircularProgress,
    Stack, Alert, Paper, Divider,
} from '@mui/material';
import { Print, ArrowBack } from '@mui/icons-material';
import {
    collection, query, where, getDocs, Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { useTenant } from '../context/TenantContext';
import { format } from 'date-fns';

function formatYearMonth(ym) {
    const [y, m] = ym.split('-');
    return `${y}年${Number(m)}月`;
}

// ブランドカラー
const BRAND = '#0891b2'; // teal/cyan系
const BRAND_LIGHT = '#e0f7fa';
const BRAND_DARK = '#065f68';

// 請求書1枚分のHTML（印刷用）
// branch（支店/事業所）を優先し、なければ company にフォールバック
function generateInvoiceHTML(record, company, branch, index) {
    const yearMonth = formatYearMonth(record.yearMonth);
    const issuedDate = record.issuedAt?.toDate ? format(record.issuedAt.toDate(), 'yyyy年M月d日') : format(new Date(), 'yyyy年M月d日');
    const facilityName = branch?.name || company?.facilityName || company?.name || '施設名';
    const companyName = company?.name || '';
    const address = [
        (branch?.postalCode || company?.postalCode) ? '〒' + (branch?.postalCode || company?.postalCode) : '',
        branch?.prefecture || company?.prefecture,
        branch?.city || company?.city,
        branch?.address1 || company?.address1,
        branch?.address2 || company?.address2,
    ].filter(Boolean).join(' ');
    const phone = branch?.phone || company?.phone || '';
    const fax = branch?.fax || company?.fax || '';
    const email = branch?.email || company?.email || '';

    // 請求書番号（年月-連番）
    const invoiceNo = `INV-${record.yearMonth}-${String(index + 1).padStart(3, '0')}`;

    // 口座情報（branch優先 → companyフォールバック）
    const bankName = branch?.bankName || company?.bankName || '';
    const bankBranchName = branch?.bankBranchName || company?.bankBranchName || '';
    const bankAccountTypeRaw = branch?.bankAccountType || company?.bankAccountType || 'ordinary';
    const bankAccountType = bankAccountTypeRaw === 'current' ? '当座' : '普通';
    const bankAccountNumber = branch?.bankAccountNumber || company?.bankAccountNumber || '';
    const bankAccountHolder = branch?.bankAccountHolder || company?.bankAccountHolder || '';
    const hasBankInfo = bankName && bankAccountNumber;

    // 発行元情報HTML
    const contactLines = [
        phone ? 'TEL: ' + phone : '',
        fax ? 'FAX: ' + fax : '',
    ].filter(Boolean).join('　／　');

    return `
    <div style="width:190mm; min-height:270mm; margin:0 auto; padding:0; font-family:'Noto Sans JP','MS Gothic','Hiragino Sans',sans-serif; font-size:10pt; box-sizing:border-box; page-break-after:always; display:flex; flex-direction:column;">

        <!-- ===== ヘッダー帯 ===== -->
        <div style="background:linear-gradient(135deg, ${BRAND} 0%, ${BRAND_DARK} 100%); padding:8mm 10mm 6mm; color:white;">
            <div style="font-size:11pt; letter-spacing:3mm; opacity:0.7; margin-bottom:1mm;">INVOICE</div>
            <div style="font-size:20pt; font-weight:bold; letter-spacing:5mm;">請 求 書</div>
        </div>

        <!-- ===== 本体 ===== -->
        <div style="padding:8mm 10mm 10mm; flex:1; display:flex; flex-direction:column;">

            <!-- 請求先（左）＆ 発行情報（右） -->
            <div style="display:flex; justify-content:space-between; margin-bottom:6mm;">
                <!-- 請求先 -->
                <div style="flex:1;">
                    <div style="font-size:15pt; font-weight:bold; border-bottom:2px solid #333; padding-bottom:2mm; display:inline-block;">
                        ${record.clientName}　<span style="font-size:11pt; font-weight:normal;">様</span>
                    </div>
                    <div style="font-size:9pt; color:#666; margin-top:2mm;">下記のとおりご請求申し上げます。</div>
                </div>
                <!-- 発行情報 -->
                <div style="text-align:right; font-size:9pt; color:#555; line-height:2;">
                    <div>請求日：${issuedDate}</div>
                    <div>請求書番号：${invoiceNo}</div>
                </div>
            </div>

            <!-- 件名＆ご請求金額 -->
            <div style="margin-bottom:6mm;">
                <div style="font-size:9.5pt; color:${BRAND}; font-weight:bold; margin-bottom:1mm;">件名：${yearMonth}分 利用料ご請求</div>
                <div style="display:flex; align-items:baseline; gap:3mm;">
                    <span style="font-size:10pt; color:${BRAND}; font-weight:bold;">ご請求金額：</span>
                    <span style="font-size:20pt; font-weight:bold; color:${BRAND};">
                        &#165;${(record.amount || 0).toLocaleString()}
                    </span>
                </div>
            </div>

            <!-- 明細テーブル -->
            <table style="width:100%; border-collapse:collapse; margin-bottom:5mm;">
                <thead>
                    <tr>
                        <th style="background:${BRAND}; color:white; padding:2.5mm 4mm; text-align:left; font-size:9.5pt; width:45%;">品目</th>
                        <th style="background:${BRAND}; color:white; padding:2.5mm 4mm; text-align:center; font-size:9.5pt; width:15%;">数量</th>
                        <th style="background:${BRAND}; color:white; padding:2.5mm 4mm; text-align:right; font-size:9.5pt; width:20%;">単価</th>
                        <th style="background:${BRAND}; color:white; padding:2.5mm 4mm; text-align:right; font-size:9.5pt; width:20%;">金額</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style="padding:3mm 4mm; border-bottom:1px solid #ddd;">障害福祉サービス利用料（利用者負担上限月額）</td>
                        <td style="padding:3mm 4mm; border-bottom:1px solid #ddd; text-align:center;">1</td>
                        <td style="padding:3mm 4mm; border-bottom:1px solid #ddd; text-align:right;">&#165;${(record.amount || 0).toLocaleString()}</td>
                        <td style="padding:3mm 4mm; border-bottom:1px solid #ddd; text-align:right;">&#165;${(record.amount || 0).toLocaleString()}</td>
                    </tr>
                </tbody>
            </table>

            <!-- 小計・合計 -->
            <div style="display:flex; justify-content:flex-end; margin-bottom:8mm;">
                <table style="border-collapse:collapse; font-size:10pt; width:45%;">
                    <tr>
                        <td style="padding:2mm 4mm; text-align:right; color:#555;">小計：</td>
                        <td style="padding:2mm 4mm; text-align:right;">&#165;${(record.amount || 0).toLocaleString()}</td>
                    </tr>
                    <tr style="border-top:2px solid #333;">
                        <td style="padding:3mm 4mm; text-align:right; font-weight:bold; font-size:11pt;">合計：</td>
                        <td style="padding:3mm 4mm; text-align:right; font-weight:bold; font-size:13pt;">&#165;${(record.amount || 0).toLocaleString()}</td>
                    </tr>
                </table>
            </div>

            <!-- ===== フッター：発行元（左）＆ 振込先（右） ===== -->
            <div style="display:flex; gap:6mm; margin-top:auto;">
                <!-- 発行元 -->
                <div style="flex:1; font-size:9pt; line-height:1.9;">
                    <div style="font-size:12pt; font-weight:bold; color:#333; margin-bottom:2mm;">${facilityName}</div>
                    ${companyName && companyName !== facilityName ? '<div style="color:#555;">' + companyName + '</div>' : ''}
                    ${address ? '<div style="color:#555;">' + address + '</div>' : ''}
                    ${contactLines ? '<div style="color:#555;">' + contactLines + '</div>' : ''}
                    ${email ? '<div style="color:#555;">' + email + '</div>' : ''}
                </div>

                <!-- 振込先 -->
                ${hasBankInfo ? `
                <div style="flex:1;">
                    <div style="background:${BRAND}; color:white; padding:2mm 4mm; font-weight:bold; font-size:10pt; text-align:center;">振込先</div>
                    <table style="width:100%; font-size:9.5pt; line-height:2; border-collapse:collapse; border:1px solid #ccc;">
                        <tr><td style="padding:1.5mm 3mm; background:#f8f8f8; width:6em; border-bottom:1px solid #eee; color:#555;">${bankName}</td><td style="padding:1.5mm 3mm; border-bottom:1px solid #eee;">${bankBranchName}</td></tr>
                        <tr><td style="padding:1.5mm 3mm; background:#f8f8f8; border-bottom:1px solid #eee; color:#555;">${bankAccountType}</td><td style="padding:1.5mm 3mm; border-bottom:1px solid #eee; font-weight:bold; letter-spacing:0.5mm;">${bankAccountNumber}</td></tr>
                        ${bankAccountHolder ? '<tr><td style="padding:1.5mm 3mm; background:#f8f8f8; color:#555;">口座名義</td><td style="padding:1.5mm 3mm;">' + bankAccountHolder + '</td></tr>' : ''}
                    </table>
                    <div style="font-size:8pt; color:#888; margin-top:1mm;">※振込手数料はご負担をお願いいたします。</div>
                </div>
                ` : ''}
            </div>

            <div style="text-align:center; margin-top:4mm; font-size:8pt; color:#aaa;">
                ※ご不明な点がございましたら、上記連絡先までお問い合わせください。
            </div>
        </div>
    </div>
    `;
}

export default function BillingInvoicePrintPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { activeCompanyId: companyId, currentTenant, loading: tenantLoading } = useTenant();

    const year = Number(searchParams.get('year'));
    const month = Number(searchParams.get('month'));
    const yearMonth = `${year}-${String(month).padStart(2, '0')}`;
    const company = currentTenant?.company || {};
    const branch = currentTenant?.branch || {};

    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchRecords = async () => {
            if (tenantLoading) return;
            if (!companyId || !year || !month) { setLoading(false); return; }
            setLoading(true);
            try {
                const q = query(
                    collection(db, 'billingRecords'),
                    where('companyId', '==', companyId),
                    where('yearMonth', '==', yearMonth),
                );
                const snap = await getDocs(q);
                const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                data.sort((a, b) => (a.clientName || '').localeCompare(b.clientName || '', 'ja'));
                setRecords(data);
            } catch (e) {
                console.error('請求書データ取得エラー:', e);
                setError('データの取得に失敗しました');
            } finally {
                setLoading(false);
            }
        };
        fetchRecords();
    }, [companyId, tenantLoading, year, month, yearMonth]);

    const handlePrint = () => {
        const html = records.map((r, i) => generateInvoiceHTML(r, company, branch, i)).join('');
        const printWindow = window.open('', '_blank', 'width=900,height=700');
        if (!printWindow) {
            alert('ポップアップがブロックされました。ブラウザの設定でポップアップを許可してください。');
            return;
        }
        const doc = printWindow.document;
        doc.open();
        doc.write(`<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>利用料請求書 ${formatYearMonth(yearMonth)}</title>
    <style>
        @page { size: A4; margin: 0; }
        @media print { body { margin: 0; } }
        body { margin: 0; padding: 0; }
    </style>
</head>
<body>${html}</body>
</html>`);
        doc.close();
        // フォント読み込み等を待ってから印刷ダイアログを表示
        setTimeout(() => {
            printWindow.focus();
            printWindow.print();
        }, 500);
    };

    return (
        <Container maxWidth="md">
            <Box sx={{ py: 3 }}>
                <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
                    <Button startIcon={<ArrowBack />} onClick={() => navigate(-1)}>戻る</Button>
                    <Typography variant="h5" fontWeight="bold">
                        利用料請求書 一括印刷 — {formatYearMonth(yearMonth)}
                    </Typography>
                </Stack>

                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                {!loading && !((branch?.bankName && branch?.bankAccountNumber) || (company?.bankName && company?.bankAccountNumber)) && (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                        振込先口座が未登録です。管理画面 → 支店詳細設定 → 「銀行口座」セクションから登録してください。
                        登録すると請求書に振込先が印刷されます。
                    </Alert>
                )}

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <>
                        <Paper sx={{ p: 3, mb: 3, bgcolor: 'grey.50' }}>
                            <Stack direction="row" alignItems="center" justifyContent="space-between">
                                <Box>
                                    <Typography variant="h6" fontWeight="bold">
                                        対象: {records.length}名
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        合計請求額: ¥{records.reduce((s, r) => s + (r.amount || 0), 0).toLocaleString()}
                                    </Typography>
                                </Box>
                                <Button
                                    variant="contained"
                                    size="large"
                                    startIcon={<Print />}
                                    onClick={handlePrint}
                                    disabled={records.length === 0}
                                    sx={{ py: 1.5, px: 4 }}
                                >
                                    {records.length}名分を一括印刷
                                </Button>
                            </Stack>
                        </Paper>

                        {records.length === 0 ? (
                            <Alert severity="info">
                                {formatYearMonth(yearMonth)}の請求データがありません。
                                月次処理から「請求書発行」を行ってください。
                            </Alert>
                        ) : (
                            <Stack spacing={2}>
                                {records.map((r, i) => (
                                    <Paper key={r.id} sx={{ p: 2, border: '1px solid', borderColor: 'divider' }}>
                                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                                            <Box>
                                                <Typography fontWeight="bold">{i + 1}. {r.clientName}</Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    {formatYearMonth(r.yearMonth)} ／ ¥{(r.amount || 0).toLocaleString()}
                                                </Typography>
                                            </Box>
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    color: r.status === 'paid' ? 'success.main' : 'error.main',
                                                    fontWeight: 'bold',
                                                }}
                                            >
                                                {r.status === 'paid' ? '入金済' : '未入金'}
                                            </Typography>
                                        </Stack>
                                    </Paper>
                                ))}
                            </Stack>
                        )}
                    </>
                )}
            </Box>
        </Container>
    );
}
