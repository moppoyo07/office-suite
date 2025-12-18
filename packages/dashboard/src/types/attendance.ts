// src/types/attendance.ts

import { Timestamp } from 'firebase/firestore';

/**
 * 利用者の月次利用計画 (attendancePlansコレクション)
 */
export interface AttendancePlan {
  id: string;
  clientId: string;
  year: number;
  month: number;
  plannedDates: Timestamp[];
  status: 'draft' | 'submitted' | 'approved';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}


/**
 * 利用者の日々の利用実績 (attendanceRecordsコレクション)
 * 
 *【設計思想】
 * このドキュメントは「記録した瞬間の事実」を凍結保存するスナップショットです。
 * 利用者情報やサービス単価が将来変更されても、この記録は影響を受けません。
 * これにより、監査耐性とデータの永続的な正当性を担保します。
 */
export interface AttendanceRecord {
  id?: string;

  // --- 連携キー ---
  clientId: string;
  date: Timestamp;
  staffId: string; // 記録者ID

  // --- スナップショット情報 ---
  clientName: string; // 記録時点の利用者名
  staffName: string;  // 記録時点の職員名
  
  // --- 基本的な利用状況 ---
  status: 'present' | 'absent'; // 出欠 ('present'が利用あり)
  startTime: string;            // 開始時刻 (例: "10:00")
  endTime: string;              // 終了時刻 (例: "16:00")

  // --- 記録時点の加算情報（スナップショット）---
  serviceDetails: {
    mealSupport: boolean;      // 食事提供加算の有無
    transportSupport: 'none' | 'going' | 'returning' | 'both'; // 送迎状況
    homeVisitSupport: boolean; // 訪問支援の有無
    // ※将来的にCSVで必要な他の加算項目もここに追加
  };

  // --- メタデータ ---
  note?: string;         // 特記事項
  createdAt: Timestamp;
  updatedAt: Timestamp;
}