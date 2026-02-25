// src/features/service-records/ServiceRecordPrintView.jsx
// 印刷用サービス記録ビュー

import React, { forwardRef } from 'react';
import './ServiceRecordPrint.css';

const ServiceRecordPrintView = forwardRef(({
    clientName,
    year,
    month,
    records,
}, ref) => {

    // 曜日を取得
    const getDayOfWeek = (date) => {
        const days = ['日', '月', '火', '水', '木', '金', '土'];
        return days[date.getDay()];
    };

    // 日付をフォーマット（日のみ）
    const formatDay = (date) => {
        return date.getDate();
    };

    return (
        <div className="print-container" ref={ref}>
            {/* タイトル - H1・太字・センタリング */}
            <h1 className="print-main-title">サービス提供記録</h1>

            {/* 年月・利用者情報 */}
            <div className="print-info-row">
                <div className="print-year-month">{year}年{month}月</div>
                <div className="print-client-info">
                    <span className="print-client-label">利用者氏名：</span>
                    <span className="print-client-name">{clientName}</span>
                </div>
            </div>

            {/* 記録ブロック */}
            {records.map((record, index) => {
                const recordDate = record.date instanceof Date ? record.date : new Date(record.date);

                return (
                    <div key={index} className="record-block">
                        {/* 上段: 日付、時刻、特記事項、活動内容、記録者 */}
                        <div className="record-row">
                            {/* 日付 */}
                            <div className="record-cell cell-date">
                                <div className="date-day">{formatDay(recordDate)}</div>
                                <div className="date-weekday">({getDayOfWeek(recordDate)})</div>
                            </div>

                            {/* 時刻 */}
                            <div className="record-cell cell-time">
                                <div className="time-row time-row-border">
                                    <div className="time-label">開始</div>
                                    <div className="time-value">{record.startTime || ''}</div>
                                </div>
                                <div className="time-row">
                                    <div className="time-label">終了</div>
                                    <div className="time-value">{record.endTime || ''}</div>
                                </div>
                            </div>

                            {/* 在宅時連絡時刻 */}
                            <div className="record-cell cell-remote-time">
                                <div className="remote-time-label">在宅時<br />連絡時刻</div>
                                <div className="remote-time-value">
                                    {record.attendanceType === 'remote' ? (
                                        <>
                                            {record.remoteContactTimeMorning && <div>朝: {record.remoteContactTimeMorning}</div>}
                                            {record.remoteContactTimeEvening && <div>夕: {record.remoteContactTimeEvening}</div>}
                                            {!record.remoteContactTimeMorning && !record.remoteContactTimeEvening && record.remoteContactTime && (
                                                <div>{record.remoteContactTime}</div>
                                            )}
                                        </>
                                    ) : ''}
                                </div>
                            </div>

                            {/* 特記事項 */}
                            <div className="record-cell cell-special-notes">
                                <div className="special-notes-label">特記事項</div>
                                <div className="special-notes-value">{record.specialNotes || ''}</div>
                            </div>

                            {/* 活動内容 */}
                            <div className="record-cell cell-activities">
                                <div className="activities-header">活動内容</div>
                                <div className="activities-content">
                                    <div className="activities-row">
                                        <div className="activities-label">午前</div>
                                        <div className="activities-value">
                                            {record && Array.isArray(record.activitiesAm) ? record.activitiesAm.join('、') : ''}
                                        </div>
                                    </div>
                                    <div className="activities-row">
                                        <div className="activities-label">午後</div>
                                        <div className="activities-value">
                                            {record && Array.isArray(record.activitiesPm) ? record.activitiesPm.join('、') : ''}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 記録者 */}
                            <div className="record-cell cell-recorder">
                                <div className="recorder-label">記録者</div>
                                <div className="recorder-value">{record.recorderName || ''}</div>
                            </div>
                        </div>

                        {/* 下段: 支援内容 */}
                        <div className="record-row">
                            <div className="record-cell support-content-row">
                                <span className="support-label">支援内容</span>
                                <span className="support-value">{record.supportContent || ''}</span>
                            </div>
                        </div>
                    </div>
                );
            })}

            {/* 記録がない場合 */}
            {records.length === 0 && (
                <div className="no-records">
                    この月の記録はありません
                </div>
            )}
        </div>
    );
});

ServiceRecordPrintView.displayName = 'ServiceRecordPrintView';

export default ServiceRecordPrintView;
