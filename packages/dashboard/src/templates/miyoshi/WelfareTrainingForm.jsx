// src/templates/miyoshi/WelfareTrainingForm.jsx
// 三次市版 障害者就労支援施設通所費助成金支給申請書
// 様式第1号（第4条関係）
// 3ヶ月分まとめて1枚に記載

import React from 'react';

/**
 * 三次市版 障害者就労支援施設通所費助成金支給申請書
 *
 * Props:
 * - submissionDate: 提出日 { year, month, day }（省略時は当日）
 * - applicant: 申請者情報 { address, name }
 * - client: 通所者情報 { name, gender, relationToApplicant, birthYear, birthMonth, birthDay, address }
 * - facility: 施設情報 { name, address }
 * - months: 月別データの配列（最大3件）
 *   各要素: { year, month, startDay, endDay, days, dailyRate }
 * -備考: note
 */
export default function MiyoshiWelfareTrainingForm({
    submissionDate = null,
    applicant = {
        address: '三次市三次町1538-5',
        name: '工　幸太郎',
    },
    client = {
        name: '工　幸太郎',
        gender: '男',
        relationToApplicant: '本人',
        birthYear: 1978,
        birthMonth: 12,
        birthDay: 4,
        address: '三次市三次町1538-5',
    },
    facility = {
        name: '就労移行ITスクール広島',
        address: '広島市中区中町7-41 401',
    },
    months = [],
    note = '',
}) {
    const today = submissionDate
        ? submissionDate
        : (() => {
              const d = new Date();
              return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() };
          })();

    const toReiwa = (year) => year - 2018;

    // 年齢計算
    const calcAge = () => {
        const now = new Date();
        const birth = new Date(client.birthYear, client.birthMonth - 1, client.birthDay);
        let age = now.getFullYear() - birth.getFullYear();
        const m = now.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
        return age;
    };

    // 月の行データを3行分確保（足りない分は空行）
    const monthRows = [...months];
    while (monthRows.length < 3) monthRows.push(null);

    const fmt = (n) => (n != null ? Number(n).toLocaleString() : '');

    // 各月の小計
    const calcSubtotal = (m) => {
        if (!m || m.days == null || m.dailyRate == null) return null;
        return m.days * m.dailyRate;
    };

    return (
        <div style={styles.sheet}>
            <style>{printStyles}</style>

            {/* 様式番号 */}
            <div style={styles.formNumber}>様式第1号（第4条関係）</div>

            {/* タイトル */}
            <h1 style={styles.title}>障害者就労支援施設通所費助成金支給申請書</h1>

            {/* 提出日 */}
            <div style={styles.dateRow}>
                {toReiwa(today.year)}年　{today.month}月　{today.day}日
            </div>

            {/* 宛先 */}
            <div style={styles.addressee}>三次市長　様</div>

            {/* 申請者情報（右寄せ） */}
            <div style={styles.applicantBlock}>
                <div style={styles.applicantRow}>
                    <span style={styles.applicantLabel}>申請者</span>
                    <span style={styles.applicantLabelSub}>住所</span>
                    <span>{applicant.address}</span>
                </div>
                <div style={styles.applicantRow}>
                    <span style={styles.applicantLabel}>（保護者）</span>
                    <span style={styles.applicantLabelSub}>氏名</span>
                    <span>{applicant.name}</span>
                </div>
            </div>

            {/* 申請文 */}
            <div style={styles.claimSentence}>
                障害者就労支援施設通所費助成金の交付を受けたいので、次の通り申請します。
            </div>

            {/* 通所者情報テーブル */}
            <table style={styles.table}>
                <colgroup>
                    <col style={{ width: '60px' }} />
                    <col style={{ width: '60px' }} />
                    <col />
                    <col style={{ width: '60px' }} />
                    <col style={{ width: '80px' }} />
                    <col />
                </colgroup>
                <tbody>
                    <tr>
                        <th
                            rowSpan={5}
                            style={{
                                ...styles.th,
                                writingMode: 'vertical-rl',
                                textOrientation: 'mixed',
                                width: '60px',
                                textAlign: 'center',
                            }}
                        >
                            通所者
                        </th>
                        <th style={styles.th}>氏名</th>
                        <td style={styles.td}>{client.name}</td>
                        <td style={styles.td}>{client.gender}</td>
                        <th style={styles.th}>申請者との続柄</th>
                        <td style={styles.td}>{client.relationToApplicant}</td>
                    </tr>
                    <tr>
                        <th style={styles.th}>生年月日</th>
                        <td colSpan={4} style={styles.td}>
                            {client.birthYear}年{client.birthMonth}月{client.birthDay}日（{calcAge()}歳）
                        </td>
                    </tr>
                    <tr>
                        <th style={styles.th}>住所</th>
                        <td colSpan={4} style={styles.td}>
                            {client.address}
                        </td>
                    </tr>
                    <tr>
                        <th style={styles.th}>名称</th>
                        <td colSpan={4} style={styles.td}>
                            {facility.name}
                        </td>
                    </tr>
                    <tr>
                        <th style={styles.th}>所在地</th>
                        <td colSpan={4} style={styles.td}>
                            {facility.address}
                        </td>
                    </tr>
                </tbody>
            </table>

            {/* 通所費用テーブル */}
            <table style={{ ...styles.table, marginTop: '0' }}>
                <colgroup>
                    <col style={{ width: '55px' }} />
                    <col style={{ width: '28px' }} />
                    <col style={{ width: '175px' }} />
                    <col />
                </colgroup>
                <thead>
                    <tr>
                        <th colSpan={2} style={styles.th}></th>
                        <th style={styles.th}>通所の期間</th>
                        <th style={styles.th}>通所の費用</th>
                    </tr>
                </thead>
                <tbody>
                    {monthRows.map((m, i) => {
                        const subtotal = calcSubtotal(m);
                        return (
                            <tr key={i} style={{ height: '60px' }}>
                                {i === 0 && (
                                    <td
                                        rowSpan={3}
                                        style={{
                                            ...styles.td,
                                            writingMode: 'vertical-rl',
                                            textOrientation: 'mixed',
                                            textAlign: 'center',
                                            fontSize: '9pt',
                                            lineHeight: 1.4,
                                        }}
                                    >
                                        障害者就労支援施設
                                    </td>
                                )}
                                <td style={{ ...styles.td, textAlign: 'center', verticalAlign: 'middle' }}>
                                    {m ? `${m.month}月` : ''}
                                </td>
                                <td style={{ ...styles.td, fontSize: '9.5pt', verticalAlign: 'middle', padding: '4px 6px' }}>
                                    {m ? (
                                        <>
                                            {m.year}年　{m.month}月　{m.startDay}日から
                                            <br />
                                            {m.year}年　{m.month}月　{m.endDay}日まで
                                            <br />
                                            （　{m.days}日　）
                                        </>
                                    ) : ''}
                                </td>
                                <td style={{ ...styles.td, fontSize: '9.5pt', verticalAlign: 'middle', padding: '4px 8px' }}>
                                    {m && subtotal != null ? (
                                        <>
                                            （1日）　{fmt(m.dailyRate)}円×　{m.days}日
                                            <br />
                                            　　　　　　　＝
                                            <br />
                                            　　　　　　　　　{fmt(subtotal)}円
                                        </>
                                    ) : ''}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            {/* 備考 */}
            <table style={{ ...styles.table, marginTop: '0' }}>
                <tbody>
                    <tr>
                        <th style={{ ...styles.th, width: '60px' }}>備考</th>
                        <td style={{ ...styles.td, height: '30px' }}>{note}</td>
                    </tr>
                </tbody>
            </table>
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
    formNumber: {
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
        marginBottom: '6mm',
    },
    addressee: {
        fontSize: '13pt',
        marginBottom: '6mm',
    },
    applicantBlock: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        marginBottom: '6mm',
        gap: '2px',
    },
    applicantRow: {
        display: 'flex',
        gap: '6px',
    },
    applicantLabel: {
        minWidth: '60px',
        textAlign: 'right',
    },
    applicantLabelSub: {
        minWidth: '28px',
    },
    claimSentence: {
        marginBottom: '5mm',
        lineHeight: 1.8,
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        marginBottom: '0',
        fontSize: '10pt',
    },
    th: {
        border: '1px solid #000',
        padding: '3px 4px',
        textAlign: 'center',
        fontWeight: 'bold',
        backgroundColor: '#f0f0f0',
        lineHeight: 1.4,
    },
    td: {
        border: '1px solid #000',
        padding: '3px 4px',
        lineHeight: 1.4,
    },
};

const printStyles = `
    @media print {
        @page { size: A4 portrait; margin: 0; }
        body { margin: 0; }
    }
`;
