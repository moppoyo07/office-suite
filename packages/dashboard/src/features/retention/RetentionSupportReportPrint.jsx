// src/features/retention/RetentionSupportReportPrint.jsx
// 定着支援レポート印刷用コンポーネント（厚労省 別紙様式１準拠）

import { forwardRef } from 'react';
import { format } from 'date-fns';

// 和暦変換
const toWareki = (date) => {
    if (!date) return { era: 'R', year: '', month: '', day: '' };
    const d = date instanceof Date ? date : date.toDate?.() || new Date(date);
    const year = d.getFullYear();
    const reiwaYear = year - 2018;
    return { era: 'R', year: reiwaYear, month: d.getMonth() + 1, day: d.getDate() };
};

// 場所の表示
const locationLabel = (loc) => {
    switch (loc) {
        case 'employer': return '雇用事業主内';
        case 'office': return '事業所内';
        default: return 'その他';
    }
};

// 方法の表示
const methodLabel = (method) => {
    switch (method) {
        case 'interview': return '面接';
        case 'phone': return '電話';
        case 'email': return 'メール';
        default: return 'その他';
    }
};

const RetentionSupportReportPrint = forwardRef(({ client, formData, targetDate, month }, ref) => {
    const today = new Date();
    const todayWareki = toWareki(today);
    const empWareki = toWareki(client?.employmentDate);
    const targetWareki = toWareki(targetDate);

    const styles = {
        page: {
            width: '210mm',
            minHeight: '297mm',
            backgroundColor: 'white',
            color: 'black',
            padding: '15mm',
            fontSize: '11px',
            fontFamily: '"游明朝", "Yu Mincho", serif',
            lineHeight: 1.6,
            boxSizing: 'border-box',
        },
        header: {
            position: 'relative',
            marginBottom: '16px',
        },
        title: {
            textAlign: 'center',
            fontSize: '18px',
            fontWeight: 'bold',
            marginBottom: '8px',
        },
        formNumber: {
            position: 'absolute',
            top: 0,
            right: 0,
            fontSize: '10px',
        },
        dateRow: {
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '24px',
            fontSize: '11px',
            marginTop: '8px',
        },
        table: {
            width: '100%',
            borderCollapse: 'collapse',
            border: '1px solid black',
        },
        cell: {
            border: '1px solid black',
            padding: '6px 8px',
            verticalAlign: 'middle',
        },
        headerCell: {
            backgroundColor: '#fffde7',
            fontWeight: 'bold',
            textAlign: 'center',
            border: '1px solid black',
            padding: '6px 8px',
        },
        grayCell: {
            backgroundColor: '#f5f5f5',
            textAlign: 'center',
            border: '1px solid black',
            padding: '4px',
            fontSize: '10px',
        },
        textArea: {
            minHeight: '80px',
            padding: '8px',
            whiteSpace: 'pre-wrap',
            border: '1px solid black',
            borderTop: 0,
        },
        splitColumn: {
            display: 'flex',
            border: '1px solid black',
            borderTop: 0,
        },
        leftCol: {
            width: '50%',
            borderRight: '1px solid black',
        },
        rightCol: {
            width: '50%',
        },
        colHeader: {
            backgroundColor: '#f5f5f5',
            textAlign: 'center',
            padding: '4px',
            borderBottom: '1px solid black',
            fontSize: '10px',
        },
        colContent: {
            padding: '8px',
            minHeight: '200px',
            whiteSpace: 'pre-wrap',
            fontSize: '10px',
        },
        footer: {
            display: 'flex',
            border: '1px solid black',
            borderTop: 0,
        },
        signBox: {
            border: '1px solid black',
            padding: '8px',
            width: '100px',
            marginLeft: 'auto',
            marginTop: '8px',
        },
    };

    return (
        <div ref={ref} style={styles.page}>
            {/* Header */}
            <div style={styles.header}>
                <div style={styles.formNumber}>(別紙様式１)</div>
                <div style={styles.title}>就労定着支援　支援レポート</div>
                <div style={styles.dateRow}>
                    <span>作成日　令和 {todayWareki.year} 年 {todayWareki.month} 月 {todayWareki.day} 日</span>
                    <span>雇用開始日　令和 {empWareki.year} 年 {empWareki.month} 月 {empWareki.day} 日</span>
                </div>
            </div>

            {/* Basic Info Table */}
            <table style={styles.table}>
                <tbody>
                    <tr>
                        <td style={{ ...styles.headerCell, width: '80px' }}>利用者名</td>
                        <td style={{ ...styles.cell, width: '150px' }}>{client?.name || ''}</td>
                        <td style={{ ...styles.headerCell, width: '80px', fontSize: '10px' }}>雇用事業主<br />(勤務先)</td>
                        <td style={{ ...styles.cell, width: '150px' }}>{client?.employmentCompany || ''}</td>
                        <td style={{ ...styles.headerCell, width: '70px', fontSize: '10px' }}>ご担当者</td>
                        <td style={styles.cell}>{client?.employerContact || ''}</td>
                    </tr>
                </tbody>
            </table>

            {/* Target Month */}
            <div style={{ ...styles.headerCell, borderTop: 0, display: 'flex', gap: '8px' }}>
                <span>R{targetWareki.year}</span>
                <span>年</span>
                <span style={{ fontWeight: 'bold' }}>{targetWareki.month}</span>
                <span>月</span>
                <span style={{ marginLeft: '16px' }}>の支援実績</span>
            </div>

            {/* Support Logs */}
            <div style={styles.textArea}>
                {formData.supportLogs.filter(log => log.date).map((log, index) => {
                    const logDate = new Date(log.date);
                    return (
                        <div key={index} style={{ marginBottom: '4px' }}>
                            <strong>{logDate.getMonth() + 1}月 {logDate.getDate()}日</strong>
                            {' '}｜ 場所：
                            <span style={{ textDecoration: log.location === 'employer' ? 'underline' : 'none' }}>雇用事業主内</span>・
                            <span style={{ textDecoration: log.location === 'office' ? 'underline' : 'none' }}>事業所内</span>・
                            <span style={{ textDecoration: log.location === 'other' ? 'underline' : 'none' }}>その他</span>
                            {' '}｜ 方法：
                            <span style={{ textDecoration: log.method === 'interview' ? 'underline' : 'none' }}>面接</span>・
                            <span style={{ textDecoration: log.method === 'phone' ? 'underline' : 'none' }}>電話</span>・
                            <span style={{ textDecoration: log.method === 'email' ? 'underline' : 'none' }}>メール</span>・
                            <span style={{ textDecoration: log.method === 'other' ? 'underline' : 'none' }}>その他</span>
                        </div>
                    );
                })}
            </div>

            {/* Monthly Goals */}
            <div style={{ ...styles.headerCell, borderTop: 0 }}>当月の主な支援目標</div>
            <div style={styles.textArea}>{formData.monthlyGoals}</div>

            {/* Current Month Status */}
            <div style={{ ...styles.headerCell, borderTop: 0 }}>当月の支援状況</div>
            <div style={styles.splitColumn}>
                <div style={styles.leftCol}>
                    <div style={styles.colHeader}>支援実施内容</div>
                    <div style={styles.colContent}>{formData.supportContent}</div>
                </div>
                <div style={styles.rightCol}>
                    <div style={styles.colHeader}>支援結果</div>
                    <div style={styles.colContent}>{formData.supportResults}</div>
                </div>
            </div>

            {/* Future Direction */}
            <div style={{ ...styles.headerCell, borderTop: 0 }}>支援の方向性</div>
            <div style={styles.splitColumn}>
                <div style={{ width: '33%', borderRight: '1px solid black' }}>
                    <div style={styles.colHeader}>今後の支援内容</div>
                    <div style={{ ...styles.colContent, minHeight: '100px' }}>{formData.futurePlan}</div>
                </div>
                <div style={{ width: '67%' }}>
                    <div style={styles.colHeader}>対象者・事業主・関係機関等の取組</div>
                    <div style={{ ...styles.colContent, minHeight: '100px' }}>{formData.stakeholderActions}</div>
                </div>
            </div>

            {/* Shared Matters */}
            <div style={{ display: 'flex', border: '1px solid black', borderTop: 0 }}>
                <div style={{ ...styles.headerCell, width: '80px', borderRight: '1px solid black' }}>共有事項</div>
                <div style={{ flex: 1, padding: '8px', minHeight: '40px' }}>{formData.sharedMatters}</div>
            </div>

            {/* Footer */}
            <div style={styles.footer}>
                <div style={{ ...styles.headerCell, width: '100px' }}>事業所名</div>
                <div style={{ ...styles.cell, flex: 1, textAlign: 'center' }}>{formData.facilityName}</div>
                <div style={{ ...styles.headerCell, width: '70px' }}>担当者</div>
                <div style={{ ...styles.cell, width: '100px', textAlign: 'center' }}>{formData.staffName}</div>
            </div>

            {/* Sign Box */}
            <div style={styles.signBox}>
                <div style={{ fontSize: '9px' }}>対象者<br />提示日</div>
                <div style={{ marginTop: '12px', textAlign: 'center' }}>___/___</div>
            </div>
        </div>
    );
});

RetentionSupportReportPrint.displayName = 'RetentionSupportReportPrint';

export default RetentionSupportReportPrint;
