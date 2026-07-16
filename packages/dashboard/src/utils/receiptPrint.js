// src/utils/receiptPrint.js
// 利用料 領収書の印刷ユーティリティ
// billingRecords の入金済（status='paid'）レコードから領収書HTMLを生成し印刷する

import { format } from 'date-fns';

// ブランドカラー（請求書と統一）
const BRAND = '#0891b2';
const BRAND_DARK = '#065f68';

function formatYearMonth(ym) {
    const [y, m] = ym.split('-');
    return `${y}年${Number(m)}月`;
}

// 領収書1枚分のHTML
// branch（支店/事業所）を優先し、なければ company にフォールバック
function generateReceiptHTML(record, company, branch) {
    const yearMonth = formatYearMonth(record.yearMonth);
    // 発行日 = 入金日（paidAt）。なければ今日
    const paidDate = record.paidAt?.toDate
        ? format(record.paidAt.toDate(), 'yyyy年M月d日')
        : format(new Date(), 'yyyy年M月d日');
    const amount = record.amount || 0;

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

    // 領収書番号（年月-連番風）。paidAtの日付をベースに一意性を持たせる
    const receiptNo = `RCP-${record.yearMonth}-${(record.id || '').slice(0, 6).toUpperCase()}`;

    const contactLines = [
        phone ? 'TEL: ' + phone : '',
        fax ? 'FAX: ' + fax : '',
    ].filter(Boolean).join('　／　');

    return `
    <div style="width:190mm; min-height:135mm; margin:0 auto; padding:0; font-family:'Noto Sans JP','MS Gothic','Hiragino Sans',sans-serif; font-size:10pt; box-sizing:border-box; page-break-after:always; display:flex; flex-direction:column;">

        <!-- ===== ヘッダー帯 ===== -->
        <div style="background:linear-gradient(135deg, ${BRAND} 0%, ${BRAND_DARK} 100%); padding:8mm 10mm 6mm; color:white;">
            <div style="font-size:11pt; letter-spacing:3mm; opacity:0.7; margin-bottom:1mm;">RECEIPT</div>
            <div style="font-size:20pt; font-weight:bold; letter-spacing:5mm;">領 収 書</div>
        </div>

        <!-- ===== 本体 ===== -->
        <div style="padding:8mm 10mm 10mm; flex:1; display:flex; flex-direction:column;">

            <!-- 宛名（左）＆ 発行情報（右） -->
            <div style="display:flex; justify-content:space-between; margin-bottom:6mm;">
                <div style="flex:1;">
                    <div style="font-size:15pt; font-weight:bold; border-bottom:2px solid #333; padding-bottom:2mm; display:inline-block;">
                        ${record.clientName}　<span style="font-size:11pt; font-weight:normal;">様</span>
                    </div>
                </div>
                <div style="text-align:right; font-size:9pt; color:#555; line-height:2;">
                    <div>発行日：${paidDate}</div>
                    <div>領収書番号：${receiptNo}</div>
                </div>
            </div>

            <!-- 領収金額 -->
            <div style="margin-bottom:6mm;">
                <div style="display:flex; align-items:baseline; gap:3mm; border:2px solid ${BRAND}; padding:4mm 6mm; border-radius:2mm;">
                    <span style="font-size:11pt; color:${BRAND}; font-weight:bold;">領収金額</span>
                    <span style="font-size:24pt; font-weight:bold; color:${BRAND}; margin-left:auto;">
                        &#165;${amount.toLocaleString()}&nbsp;<span style="font-size:12pt;">-</span>
                    </span>
                </div>
            </div>

            <!-- 但し書き -->
            <div style="margin-bottom:5mm; font-size:11pt;">
                <span style="color:#555;">但し</span>
                <span style="border-bottom:1px solid #999; padding:0 3mm 1mm; font-weight:bold;">${yearMonth}分 利用料</span>
                <span style="color:#555;">として</span>
            </div>

            <div style="font-size:9pt; color:#666; margin-bottom:8mm;">上記正に領収いたしました。</div>

            <!-- 明細（内訳） -->
            <table style="width:100%; border-collapse:collapse; margin-bottom:5mm;">
                <tbody>
                    <tr>
                        <td style="padding:2.5mm 4mm; border:1px solid #ddd; background:#f8f8f8; width:40%; color:#555;">税抜金額</td>
                        <td style="padding:2.5mm 4mm; border:1px solid #ddd; text-align:right;">&#165;${amount.toLocaleString()}</td>
                    </tr>
                    <tr>
                        <td style="padding:2.5mm 4mm; border:1px solid #ddd; background:#f8f8f8; color:#555;">消費税等</td>
                        <td style="padding:2.5mm 4mm; border:1px solid #ddd; text-align:right;">非課税</td>
                    </tr>
                </tbody>
            </table>

            <!-- ===== フッター：発行元 ===== -->
            <div style="display:flex; justify-content:flex-end; margin-top:auto;">
                <div style="font-size:9pt; line-height:1.9; text-align:left;">
                    <div style="font-size:12pt; font-weight:bold; color:#333; margin-bottom:2mm;">${facilityName}</div>
                    ${companyName && companyName !== facilityName ? '<div style="color:#555;">' + companyName + '</div>' : ''}
                    ${address ? '<div style="color:#555;">' + address + '</div>' : ''}
                    ${contactLines ? '<div style="color:#555;">' + contactLines + '</div>' : ''}
                    ${email ? '<div style="color:#555;">' + email + '</div>' : ''}
                </div>
            </div>
        </div>
    </div>
    `;
}

// 領収書を印刷（1枚〜複数枚に対応）
// records: billingRecords の配列（入金済のもの）
export function printReceipts(records, company, branch) {
    const list = Array.isArray(records) ? records : [records];
    if (list.length === 0) return;

    const html = list.map(r => generateReceiptHTML(r, company, branch)).join('');
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) {
        alert('ポップアップがブロックされました。ブラウザの設定でポップアップを許可してください。');
        return;
    }
    const title = list.length === 1
        ? `領収書 ${list[0].clientName}`
        : `領収書 ${list.length}件`;
    const doc = printWindow.document;
    doc.open();
    doc.write(`<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>${title}</title>
    <style>
        @page { size: A4; margin: 0; }
        @media print { body { margin: 0; } }
        body { margin: 0; padding: 0; }
    </style>
</head>
<body>${html}</body>
</html>`);
    doc.close();
    setTimeout(() => {
        printWindow.focus();
        printWindow.print();
    }, 500);
}
