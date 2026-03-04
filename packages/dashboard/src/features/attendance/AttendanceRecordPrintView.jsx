// src/features/attendance/AttendanceRecordPrintView.jsx
// 出席帳票印刷ビュー

import React, { forwardRef } from 'react';
import { format, getDaysInMonth, startOfMonth, addDays, getDay } from 'date-fns';
import { ja } from 'date-fns/locale';
import './AttendanceRecordPrint.css';
import { roundTo30Min } from '../../utils/roundTime';

// 曜日ラベル
const DAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'];

// 加算項目のラベル
const getAdditions = (record) => {
    if (!record) return '-';
    const additions = [];
    if (record.attendanceType === 'remote') additions.push('在宅');
    if (record.serviceDetails?.mealSupport) additions.push('食事');
    if (record.serviceDetails?.transportGoing) additions.push('送迎往');
    if (record.serviceDetails?.transportReturning) additions.push('送迎復');
    if (record.serviceDetails?.homeVisit) additions.push('訪問');
    return additions.length > 0 ? additions.join('・') : '-';
};

const AttendanceRecordPrintView = forwardRef(({
    clientName,
    recipientId,
    year,
    month,
    records, // Map<dayNumber, record> または配列
}, ref) => {
    // 月の日数を取得
    const daysInMonth = getDaysInMonth(new Date(year, month - 1));
    const firstDay = startOfMonth(new Date(year, month - 1));

    // 日別にレコードをマップ化
    const recordsByDay = new Map();
    if (Array.isArray(records)) {
        records.forEach(record => {
            if (record.date) {
                const date = record.date.toDate ? record.date.toDate() : new Date(record.date);
                const day = date.getDate();
                recordsByDay.set(day, record);
            }
        });
    } else if (records instanceof Map) {
        records.forEach((record, day) => {
            recordsByDay.set(day, record);
        });
    }

    // 出席日数をカウント
    let attendanceCount = 0;
    recordsByDay.forEach(record => {
        if (record.status === 'present') attendanceCount++;
    });

    return (
        <div className="attendance-print-container" ref={ref}>
            {/* ヘッダー */}
            <div className="attendance-header">
                <h1 className="attendance-title">出欠確認表</h1>
                <div className="attendance-info-row">
                    <div className="attendance-month">{year}年{month}月分</div>
                    <div className="attendance-client-info">
                        <span className="info-label">利用者氏名：</span>
                        <span className="info-value">{clientName}</span>
                    </div>
                </div>
                <div className="attendance-info-row">
                    <div className="attendance-recipient">
                        <span className="info-label">受給者証番号：</span>
                        <span className="info-value">{recipientId || '未登録'}</span>
                    </div>
                    <div className="attendance-summary">
                        <span className="info-label">出席日数：</span>
                        <span className="info-value summary-value">{attendanceCount}日</span>
                    </div>
                </div>
            </div>

            {/* テーブル */}
            <table className="attendance-table">
                <thead>
                    <tr>
                        <th className="col-date">日付</th>
                        <th className="col-day">曜日</th>
                        <th className="col-status">出欠</th>
                        <th className="col-time">開始時刻</th>
                        <th className="col-time">終了時刻</th>
                        <th className="col-additions">加算等</th>
                        <th className="col-memo">備考</th>
                    </tr>
                </thead>
                <tbody>
                    {Array.from({ length: daysInMonth }, (_, i) => {
                        const dayNum = i + 1;
                        const date = addDays(firstDay, i);
                        const dayOfWeek = getDay(date);
                        const record = recordsByDay.get(dayNum);
                        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

                        return (
                            <tr key={dayNum} className={isWeekend ? 'weekend-row' : ''}>
                                <td className="col-date">{dayNum}</td>
                                <td className={`col-day ${dayOfWeek === 0 ? 'sunday' : dayOfWeek === 6 ? 'saturday' : ''}`}>
                                    {DAY_LABELS[dayOfWeek]}
                                </td>
                                <td className="col-status">
                                    {record?.status === 'present' ? '○' : record?.status === 'absent' ? '×' : ''}
                                </td>
                                <td className="col-time">{record?.status === 'present' ? (roundTo30Min(record.startTime) || '') : ''}</td>
                                <td className="col-time">{record?.status === 'present' ? (roundTo30Min(record.endTime) || '') : ''}</td>
                                <td className="col-additions">{record?.status === 'present' ? getAdditions(record) : ''}</td>
                                <td className="col-memo"></td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            {/* フッター */}
            <div className="attendance-footer">
                <div className="signature-box">
                    <div className="signature-label">利用者確認印</div>
                    <div className="signature-area"></div>
                </div>
                <div className="signature-box">
                    <div className="signature-label">事業所確認印</div>
                    <div className="signature-area"></div>
                </div>
            </div>
        </div>
    );
});

AttendanceRecordPrintView.displayName = 'AttendanceRecordPrintView';

export default AttendanceRecordPrintView;
