// src/templates/hiroshima/WelfareTrainingForm.jsx
// 広島市版 更生訓練費支給申請書テンプレート
import React from 'react';

/**
 * 広島市版 更生訓練費支給申請書
 * A4横印刷対応
 * 
 * Props:
 * - year: 年（2026など）
 * - month: 月（1-12）
 * - municipalityName: 自治体名（中区など）
 * - clients: 利用者データ配列
 * - officeInfo: 事業所情報
 * - submissionDate: 提出日
 */
export default function HiroshimaWelfareTrainingClaim({
    year = 2026,
    month = 1,
    municipalityName = "中区",
    clients = [],
    officeInfo = {
        address: "広島市中区中町7-41",
        corporation: "(株)PresingSocialService",
        facilityName: "就労移行ITスクール広島",
        representative: "福嶋 悠太"
    },
    submissionDate = null // 自動で今日の日付を使用
}) {
    // 提出日が渡されなければ今日の日付を使用
    const today = new Date();
    const actualSubmissionDate = submissionDate || {
        year: today.getFullYear() - 2018, // 令和年
        month: today.getMonth() + 1,
        day: today.getDate()
    };
    // 計算ロジック
    const calculatedData = clients.map(client => {
        const trainDays = client.trainDays || 0;
        // 訓練費: 月額固定（15日以上3150円、14日以下1600円）
        const trainUnit = trainDays >= 15 ? 3150 : (trainDays > 0 ? 1600 : 0);
        const trainAmount = trainUnit; // 日数に関係なく月額固定

        const commuteDays = client.commuteDays || 0;
        const commuteUnit = client.commuteUnit || 0;
        // 交通費: WelfareTrainingPageで計算済みの値を使用（日額×日数+定期代）
        const commuteAmount = client.commuteAmount || 0;

        return { ...client, trainUnit, trainAmount, commuteDays, commuteUnit, commuteAmount };
    });

    // 合計
    const totalTrainAmount = calculatedData.reduce((sum, c) => sum + (c.trainAmount || 0), 0);
    const totalCommuteAmount = calculatedData.reduce((sum, c) => sum + (c.commuteAmount || 0), 0);
    const totalAmount = totalTrainAmount + totalCommuteAmount;

    // 空行で埋める（最低10行）
    const rows = [...calculatedData];
    while (rows.length < 10) rows.push({});

    const reiwaYear = year - 2018;

    return (
        <div style={styles.sheet}>
            <style>{printStyles}</style>

            {/* タイトル */}
            <h1 style={styles.title}>更生訓練費支給申請書</h1>

            {/* 自治体名・年月 */}
            <div style={styles.headerRow}>
                <span style={styles.municipality}>{municipalityName}</span>
                <span style={styles.yearMonth}>（R{reiwaYear}年{month}月分）</span>
            </div>

            {/* メインテーブル */}
            <table style={styles.table}>
                <thead>
                    <tr>
                        <th rowSpan={2} style={{ ...styles.th, width: '100px' }}>支給対象者名</th>
                        <th colSpan={3} style={styles.th}>訓練のための経費</th>
                        <th colSpan={3} style={styles.th}>通所のための経費</th>
                        <th rowSpan={2} style={{ ...styles.th, width: '200px' }}>
                            交通費の算出方法<br />(具体的に記入してください)
                        </th>
                    </tr>
                    <tr>
                        <th style={{ ...styles.th, width: '35px' }}>訓練<br />日数</th>
                        <th style={{ ...styles.th, width: '50px' }}>単価</th>
                        <th style={{ ...styles.th, width: '60px' }}>金額</th>
                        <th style={{ ...styles.th, width: '35px' }}>通所<br />日数</th>
                        <th style={{ ...styles.th, width: '50px' }}>単価</th>
                        <th style={{ ...styles.th, width: '60px' }}>金額</th>
                    </tr>
                    <tr style={styles.unitRow}>
                        <td style={styles.unitCell}></td>
                        <td style={styles.unitCell}>日</td>
                        <td style={styles.unitCell}>円</td>
                        <td style={styles.unitCell}>円</td>
                        <td style={styles.unitCell}>日</td>
                        <td style={styles.unitCell}>円</td>
                        <td style={styles.unitCell}>円</td>
                        <td style={styles.unitCell}></td>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, i) => {
                        const isEmpty = !row.name;
                        const rowStyle = isEmpty
                            ? { ...styles.dataRow, borderTop: 'none' }
                            : styles.dataRow;
                        const cellStyle = isEmpty
                            ? { ...styles.td, borderTop: 'none' }
                            : styles.td;
                        return (
                            <tr key={i} style={rowStyle}>
                                <td style={cellStyle}>{row.name || ''}</td>
                                <td style={isEmpty ? { ...styles.tdCenter, borderTop: 'none' } : styles.tdCenter}>{row.trainDays || ''}</td>
                                <td style={isEmpty ? { ...styles.tdRight, borderTop: 'none' } : styles.tdRight}>{row.trainUnit ? row.trainUnit.toLocaleString() : ''}</td>
                                <td style={isEmpty ? { ...styles.tdRight, borderTop: 'none' } : styles.tdRight}>{row.trainAmount ? row.trainAmount.toLocaleString() : ''}</td>
                                <td style={isEmpty ? { ...styles.tdCenter, borderTop: 'none' } : styles.tdCenter}>{row.commuteDays || ''}</td>
                                <td style={isEmpty ? { ...styles.tdRight, borderTop: 'none' } : styles.tdRight}>{row.commuteUnit ? row.commuteUnit.toLocaleString() : ''}</td>
                                <td style={isEmpty ? { ...styles.tdRight, borderTop: 'none' } : styles.tdRight}>{row.commuteAmount ? row.commuteAmount.toLocaleString() : ''}</td>
                                <td style={isEmpty ? { ...styles.tdDetail, borderTop: 'none' } : styles.tdDetail}>{row.transportNote || ''}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            {/* 合計・署名エリア */}
            <div style={styles.footer}>
                {/* 合計行 */}
                <div style={styles.summaryRow}>
                    <span>更生訓練費支給申請額</span>
                    <span style={styles.totalAmount}>{totalAmount.toLocaleString()}</span>
                    <span>円也</span>

                    <div style={styles.breakdownWrapper}>
                        <span style={styles.bracketLeft}></span>
                        <div style={styles.breakdownContent}>
                            <div style={styles.breakdownLine}>
                                <span>内訳　訓練のための経費</span>
                                <span style={{ marginLeft: '20px' }}>{totalTrainAmount.toLocaleString()} 円</span>
                            </div>
                            <div style={styles.breakdownLine}>
                                <span>　　　通所のための経費</span>
                                <span style={{ marginLeft: '20px' }}>{totalCommuteAmount.toLocaleString()} 円</span>
                            </div>
                        </div>
                        <span style={styles.bracketRight}></span>
                    </div>
                </div>

                {/* 証明文 */}
                <p style={styles.certText}>
                    支給申請者からの委任に基づき令和 {reiwaYear} 年 {month} 月分を上記のとおり申請する。
                </p>
                <p style={styles.certText}>
                    なお、上記については事実と相違ないことを証明する。
                </p>
                <p style={styles.dateText}>
                    令和 {actualSubmissionDate.year} 年 {actualSubmissionDate.month} 月 {actualSubmissionDate.day} 日
                </p>

                {/* 宛先と署名 */}
                <div style={styles.signatureArea}>
                    <div style={styles.addressee}>広島市長　様</div>
                    <div style={styles.signatureBlock}>
                        <div style={styles.signatureRow}>
                            <span style={styles.signatureLabel}>住　所</span>
                            <span>{officeInfo.address}</span>
                        </div>
                        <div style={styles.signatureRow}>
                            <span style={styles.signatureLabel}>施設・事業所長</span>
                            <span>{officeInfo.corporation}</span>
                        </div>
                        <div style={styles.signatureRow}>
                            <span style={styles.signatureLabel}></span>
                            <span>{officeInfo.facilityName}</span>
                        </div>
                        <div style={styles.signatureRow}>
                            <span style={styles.signatureLabel}>代表取締役</span>
                            <span>{officeInfo.representative}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// インラインスタイル
const styles = {
    sheet: {
        fontFamily: '"MS PMincho", "Hiragino Mincho ProN", serif',
        width: '210mm',
        minHeight: '297mm',
        padding: '15mm',
        background: 'white',
        color: '#000',
        boxSizing: 'border-box',
    },
    title: {
        fontSize: '18pt',
        textAlign: 'center',
        marginBottom: '10mm',
        fontWeight: 'normal',
    },
    headerRow: {
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '2mm',
        fontSize: '11pt',
    },
    municipality: {
        fontSize: '14pt',
        fontWeight: 'bold',
    },
    yearMonth: {},
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: '10pt',
        border: '2px solid #000',
    },
    th: {
        border: '1px solid #000',
        padding: '2px 4px',
        textAlign: 'center',
        fontWeight: 'normal',
        verticalAlign: 'middle',
    },
    unitRow: {
        fontSize: '9pt',
    },
    unitCell: {
        border: '1px solid #000',
        borderTop: 'none',
        textAlign: 'center',
        padding: '1px',
    },
    dataRow: {
        height: '10mm',
    },
    td: {
        border: '1px solid #000',
        padding: '2px 4px',
        verticalAlign: 'middle',
    },
    tdCenter: {
        border: '1px solid #000',
        padding: '2px 4px',
        textAlign: 'center',
        verticalAlign: 'middle',
    },
    tdRight: {
        border: '1px solid #000',
        padding: '2px 4px',
        textAlign: 'right',
        verticalAlign: 'middle',
    },
    tdDetail: {
        border: '1px solid #000',
        padding: '2px 4px',
        fontSize: '9pt',
        whiteSpace: 'pre-wrap',
        verticalAlign: 'top',
    },
    footer: {
        border: '2px solid #000',
        borderTop: 'none',
        padding: '5mm 8mm',
    },
    // 合計欄（見本通り）
    summaryRow: {
        display: 'flex',
        alignItems: 'center',
        fontSize: '11pt',
        marginBottom: '5mm',
    },
    totalAmount: {
        borderBottom: '1px solid #000',
        padding: '0 8px',
        margin: '0 3px',
        fontWeight: 'bold',
        minWidth: '60px',
        textAlign: 'right',
        display: 'inline-block',
    },
    // 括弧付き内訳（見本通り）
    breakdownWrapper: {
        display: 'inline-flex',
        alignItems: 'stretch',
        marginLeft: '15px',
    },
    bracketLeft: {
        width: '6px',
        borderLeft: '1px solid #000',
        borderTop: '1px solid #000',
        borderBottom: '1px solid #000',
    },
    breakdownContent: {
        padding: '2px 8px',
        fontSize: '10pt',
        lineHeight: '1.6',
    },
    breakdownLine: {
        display: 'flex',
        justifyContent: 'space-between',
        minWidth: '180px',
    },
    bracketRight: {
        width: '6px',
        borderRight: '1px solid #000',
        borderTop: '1px solid #000',
        borderBottom: '1px solid #000',
    },
    certText: {
        margin: '2mm 0',
        fontSize: '10pt',
    },
    dateText: {
        margin: '5mm 0 5mm 15mm',
        fontSize: '10pt',
    },
    signatureArea: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginTop: '8mm',
    },
    addressee: {
        fontSize: '11pt',
    },
    signatureBlock: {
        width: '55%',
    },
    signatureRow: {
        display: 'flex',
        marginBottom: '1mm',
        fontSize: '10pt',
    },
    signatureLabel: {
        width: '100px',
        flexShrink: 0,
    },
};

// 印刷用CSS（A4縦）
const printStyles = `
@media print {
    @page {
        size: A4 portrait;
        margin: 10mm;
    }
    body {
        margin: 0;
        padding: 0;
    }
    .no-print {
        display: none !important;
    }
}
`;
