// src/templates/sakamachi/WelfareTrainingForm.jsx
// 坂町版 障害者（児）施設等通所交通費助成請求書

import React from 'react';

/**
 * 坂町版 障害者（児）施設等通所交通費助成請求書（別紙２）
 * A4縦印刷対応
 *
 * Props:
 * - year: 年
 * - month: 月
 * - municipalityName: 自治体名（表示用）
 * - clients: 利用者データ配列
 */
export default function SakamachiWelfareTrainingClaim({
    year = 2026,
    month = 1,
    municipalityName = '坂町',
    clients = [],
    officeInfo = {
        corporation: '株式会社　PresingSocialService',
        facilityName: '就労移行ITスクール広島',
        address: '広島県広島市中区中町7-41 401',
        representative: '代表取締役　福嶋　悠太',
    },
}) {
    const today = new Date();
    const reiwaYear = year - 2018;
    const submissionReiwa = today.getFullYear() - 2018;

    // 各クライアントの行データを生成（日額行 + 定期行）
    const buildRows = () => {
        const rows = [];
        clients.forEach(client => {
            const commuteDays = client.commuteDays || 0;
            const commuteUnit = client.commuteUnit || 0;
            const commuteAmount = client.commuteAmount || 0;

            const dailyPortion = commuteUnit * commuteDays;
            const passPortion = commuteAmount - dailyPortion;

            // 日額行（日額単価がある場合）
            if (commuteUnit > 0 && commuteDays > 0) {
                rows.push({
                    name: client.name,
                    days: commuteDays,
                    dailyRate: commuteUnit,
                    basis: dailyPortion,
                    actual: dailyPortion,
                    claimed: dailyPortion,
                    note: passPortion > 0 ? '1ヶ月定期券' : (client.transportNote || ''),
                });
            }

            // 定期行（定期代がある場合）
            if (passPortion > 0) {
                rows.push({
                    name: commuteUnit > 0 ? client.name : client.name,
                    days: null,
                    dailyRate: null,
                    basis: passPortion,
                    actual: passPortion,
                    claimed: passPortion,
                    note: `(${passPortion.toLocaleString()}円)購入`,
                });
            }

            // 日額も定期もない場合は1行だけ表示
            if (commuteUnit === 0 && passPortion <= 0 && commuteAmount > 0) {
                rows.push({
                    name: client.name,
                    days: commuteDays,
                    dailyRate: null,
                    basis: commuteAmount,
                    actual: commuteAmount,
                    claimed: commuteAmount,
                    note: client.transportNote || '',
                });
            }
        });
        return rows;
    };

    const rows = buildRows();
    const totalClaimed = rows.reduce((sum, r) => sum + (r.claimed || 0), 0);

    // 最低10行表示
    while (rows.length < 10) rows.push({});

    const fmt = (n) => n != null && n !== '' ? `¥${Number(n).toLocaleString()}` : '';

    return (
        <div style={styles.sheet}>
            <style>{printStyles}</style>

            {/* 別紙番号 */}
            <div style={styles.betsushi}>別紙２</div>

            {/* タイトル */}
            <h1 style={styles.title}>障害者（児）施設等通所交通費助成請求書</h1>

            {/* 提出日 */}
            <div style={styles.dateRow}>
                令和{submissionReiwa}年{today.getMonth() + 1}月{today.getDate()}日
            </div>

            {/* 宛先 */}
            <div style={styles.addressee}>坂 町 長 様</div>

            {/* 事業者情報（右寄せ） */}
            <div style={styles.officeBlock}>
                <div style={styles.officeRow}>
                    <span style={styles.officeLabel}>事業者の名称</span>
                    <span>{officeInfo.corporation}</span>
                </div>
                <div style={styles.officeRow}>
                    <span style={styles.officeLabel}>（施設名）</span>
                    <span>{officeInfo.facilityName}</span>
                </div>
                <div style={styles.officeRow}>
                    <span style={styles.officeLabel}>所在地</span>
                    <span>{officeInfo.address}</span>
                </div>
                <div style={styles.officeRow}>
                    <span style={styles.officeLabel}>代表者職氏名</span>
                    <span>{officeInfo.representative}　㊞</span>
                </div>
            </div>

            {/* 請求文 */}
            <div style={styles.claimSentence}>
                <u>
                    助成対象者からの委任に基づき、令和{reiwaYear}年{month}月分
                    <strong>{totalClaimed.toLocaleString()}円</strong>
                    を請求します。
                </u>
            </div>

            {/* メインテーブル */}
            <table style={styles.table}>
                <thead>
                    <tr>
                        <th rowSpan={2} style={{ ...styles.th, width: '90px' }}>
                            助成対象者<br />氏名
                        </th>
                        <th rowSpan={2} style={{ ...styles.th, width: '50px' }}>
                            通所<br />日数<br />①
                        </th>
                        <th rowSpan={2} style={{ ...styles.th, width: '60px' }}>
                            所要額<br />（日額）<br />②
                        </th>
                        <th colSpan={3} style={{ ...styles.th }}>
                            通所のための経費（月額）(円)
                        </th>
                        <th rowSpan={2} style={{ ...styles.th, width: '120px' }}>備考</th>
                    </tr>
                    <tr>
                        <th style={{ ...styles.th, width: '70px' }}>
                            基準額③<br /><span style={{ fontSize: '0.7em' }}>①×②</span>
                        </th>
                        <th style={{ ...styles.th, width: '70px' }}>
                            実支出額<br />④
                        </th>
                        <th style={{ ...styles.th, width: '70px' }}>
                            ③と④で<br />低い額
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, i) => (
                        <tr key={i}>
                            <td style={styles.td}>{row.name || ''}</td>
                            <td style={{ ...styles.td, textAlign: 'center' }}>
                                {row.days != null ? row.days : ''}
                            </td>
                            <td style={{ ...styles.td, textAlign: 'right' }}>
                                {row.dailyRate != null ? fmt(row.dailyRate) : ''}
                            </td>
                            <td style={{ ...styles.td, textAlign: 'right' }}>
                                {row.basis != null ? fmt(row.basis) : ''}
                            </td>
                            <td style={{ ...styles.td, textAlign: 'right' }}>
                                {row.actual != null ? fmt(row.actual) : ''}
                            </td>
                            <td style={{ ...styles.td, textAlign: 'right' }}>
                                {row.claimed != null ? fmt(row.claimed) : ''}
                            </td>
                            <td style={{ ...styles.td, fontSize: '0.8em' }}>{row.note || ''}</td>
                        </tr>
                    ))}
                    <tr>
                        <td colSpan={5} style={{ ...styles.td, textAlign: 'center', fontWeight: 'bold' }}>合 計</td>
                        <td style={{ ...styles.td, textAlign: 'right', fontWeight: 'bold' }}>
                            {fmt(totalClaimed)}
                        </td>
                        <td style={styles.td}></td>
                    </tr>
                </tbody>
            </table>

            {/* 証明文 */}
            <div style={styles.certify}>
                <u>また、下記については、事実と相違ないことを証明します。</u>
            </div>

            {/* 注記 */}
            <div style={styles.note}>
                （※）「障害者（児）施設等通所交通費助成決定通知書」の助成額欄が月額で表示されている者については、②は空欄とし、③に助成額（月額）を記入してください。
            </div>

            {/* 添付書類 */}
            <div style={styles.attachment}>
                （添付書類）助成対象者の出勤簿の写し
            </div>
        </div>
    );
}

const styles = {
    sheet: {
        fontFamily: 'MS Mincho, serif',
        fontSize: '11pt',
        color: '#000',
        padding: '15mm 15mm 10mm 15mm',
        width: '210mm',
        minHeight: '297mm',
        boxSizing: 'border-box',
        position: 'relative',
    },
    betsushi: {
        fontSize: '10pt',
        marginBottom: '4mm',
    },
    title: {
        fontSize: '14pt',
        fontWeight: 'bold',
        textAlign: 'center',
        margin: '0 0 6mm 0',
    },
    dateRow: {
        textAlign: 'right',
        marginBottom: '4mm',
    },
    addressee: {
        fontSize: '13pt',
        marginBottom: '6mm',
    },
    officeBlock: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        marginBottom: '6mm',
    },
    officeRow: {
        display: 'flex',
        gap: '8px',
        marginBottom: '2px',
    },
    officeLabel: {
        minWidth: '80px',
    },
    claimSentence: {
        marginBottom: '5mm',
        lineHeight: 1.8,
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        marginBottom: '6mm',
        fontSize: '10pt',
    },
    th: {
        border: '1px solid #000',
        padding: '3px 4px',
        textAlign: 'center',
        fontWeight: 'bold',
        backgroundColor: '#f5f5f5',
        lineHeight: 1.4,
    },
    td: {
        border: '1px solid #000',
        padding: '3px 4px',
        height: '22px',
        lineHeight: 1.3,
    },
    certify: {
        marginBottom: '4mm',
    },
    note: {
        fontSize: '9pt',
        marginBottom: '4mm',
        lineHeight: 1.6,
    },
    attachment: {
        marginTop: '4mm',
    },
};

const printStyles = `
    @media print {
        @page { size: A4 portrait; margin: 0; }
        body { margin: 0; }
    }
`;
