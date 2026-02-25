// src/features/retention/RetentionSupportPrintView.jsx
// 定着支援レポート印刷ビュー（別紙様式１準拠）

import { forwardRef } from 'react';
import './RetentionSupportPrint.css';

// 和暦変換
const toWareki = (date) => {
    if (!date) return { year: '', month: '', day: '' };
    const d = date instanceof Date ? date : date.toDate?.() || new Date(date);
    const year = d.getFullYear();
    const reiwaYear = year - 2018;
    return { year: reiwaYear, month: d.getMonth() + 1, day: d.getDate() };
};

const RetentionSupportPrintView = forwardRef(({
    client,
    formData,
    targetDate,
    month,
    staffName,
}, ref) => {
    const today = new Date();
    const todayWareki = toWareki(today);
    const empWareki = toWareki(client?.employmentDate);
    const targetWareki = toWareki(targetDate);

    return (
        <div className="retention-print-container" ref={ref}>
            {/* Header */}
            <div className="retention-print-header">
                <div className="retention-print-form-number">(別紙様式１)</div>
                <h1 className="retention-print-title">就労定着支援　支援レポート</h1>
                <div className="retention-print-date-row">
                    <span>作成日　令和 {todayWareki.year} 年 {todayWareki.month} 月 {todayWareki.day} 日</span>
                    <span>雇用開始日　令和 {empWareki.year} 年 {empWareki.month} 月 {empWareki.day} 日</span>
                </div>
            </div>

            {/* 基本情報テーブル */}
            <table className="retention-print-table">
                <tbody>
                    <tr>
                        <th style={{ width: '70px' }}>利用者名</th>
                        <td style={{ width: '120px' }}>{client?.name || ''}</td>
                        <th style={{ width: '70px', fontSize: '9pt' }}>雇用事業主<br />(勤務先)</th>
                        <td style={{ width: '120px' }}>{client?.employmentCompany || ''}</td>
                        <th style={{ width: '60px' }}>ご担当者</th>
                        <td>{formData?.employerContact || ''}</td>
                    </tr>
                </tbody>
            </table>

            {/* 対象月 */}
            <div className="retention-print-section">
                <div className="retention-print-section-header">
                    R{targetWareki.year}年 {targetWareki.month}月 の支援実績
                </div>
                <div className="retention-print-section-content">
                    {formData?.supportLogs?.filter(log => log.date).map((log, index) => {
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
            </div>

            {/* 当月の主な支援目標 */}
            <div className="retention-print-section">
                <div className="retention-print-section-header">当月の主な支援目標</div>
                <div className="retention-print-section-content">{formData?.monthlyGoals || ''}</div>
            </div>

            {/* 当月の支援状況 */}
            <div className="retention-print-section">
                <div className="retention-print-section-header">当月の支援状況</div>
            </div>
            <div className="retention-print-split">
                <div className="retention-print-col">
                    <div className="retention-print-col-header">支援実施内容</div>
                    <div className="retention-print-col-content">{formData?.supportContent || ''}</div>
                </div>
                <div className="retention-print-col">
                    <div className="retention-print-col-header">支援結果</div>
                    <div className="retention-print-col-content">{formData?.supportResults || ''}</div>
                </div>
            </div>

            {/* 支援の方向性 */}
            <div className="retention-print-section">
                <div className="retention-print-section-header">支援の方向性</div>
            </div>
            <div className="retention-print-split">
                <div className="retention-print-col" style={{ flex: '1' }}>
                    <div className="retention-print-col-header">今後の支援内容</div>
                    <div className="retention-print-col-content short">{formData?.futurePlan || ''}</div>
                </div>
                <div className="retention-print-col" style={{ flex: '2' }}>
                    <div className="retention-print-col-header">対象者・事業主・関係機関等の取組</div>
                    <div className="retention-print-col-content short">{formData?.stakeholderActions || ''}</div>
                </div>
            </div>

            {/* 共有事項 */}
            <div className="retention-print-shared">
                <div className="retention-print-shared-label">共有事項</div>
                <div className="retention-print-shared-content">{formData?.sharedMatters || ''}</div>
            </div>

            {/* フッター */}
            <div className="retention-print-footer">
                <div className="retention-print-footer-cell label">事業所名</div>
                <div className="retention-print-footer-cell value">{formData?.facilityName || ''}</div>
                <div className="retention-print-footer-cell label">担当者</div>
                <div className="retention-print-footer-cell value">{staffName || ''}</div>
            </div>

            {/* 署名欄 */}
            <div className="retention-print-sign-box">
                <div>対象者<br />提示日</div>
                <div className="retention-print-sign-date">___/___</div>
            </div>
        </div>
    );
});

RetentionSupportPrintView.displayName = 'RetentionSupportPrintView';

export default RetentionSupportPrintView;
