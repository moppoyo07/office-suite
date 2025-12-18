// src/types/client.ts

import { Timestamp } from 'firebase/firestore';

export type ClientStatus = 'inquiry' | 'using' | 'closed-lost' | 'graduated';

export interface EmploymentInfo {
  companyName: string;
  employmentDate: Timestamp;
}

/**
 * Firestoreの 'clients' コレクションのドキュメント構造。
 * 利用者に関する全てのマスター情報（変更される可能性のある最新情報）を保持します。
 */
export interface Client {
  id?: string; // 新規作成時には存在しないためオプショナルに

  // --- 基本情報 ---
  name: string;
  furigana: string;
  status: ClientStatus;
  
  // --- アカウント連携 ---
  authUid?: string | null;
  accountStatus?: 'no_account' | 'invited' | 'active';
  inviteToken?: string | null;

  // --- 就職情報 ---
  employmentInfo?: EmploymentInfo | null;
  
  // --- 国保連請求のためのマスター情報 ---
  billingInfo: {
    beneficiaryNumber: string;  // 受給者証番号
    municipalityName: string;   // 支給決定市町村名
    municipalityCode: string;   // 市町村番号
    serviceStartDate: Timestamp; // サービス提供期間（開始）
    serviceEndDate: Timestamp;   // サービス提供期間（終了）
    
    // --- マスターとしての加算情報 ---
    // ここで設定した内容が、日々の実績記録時のデフォルト値となる
    hasMealSupport: boolean;      // 食事提供加算の対象者か
    defaultTransport: 'none' | 'going' | 'returning' | 'both'; // デフォルトの送迎設定
    hasHomeVisitSupport: boolean; // 訪問支援の対象者か
  };
  
  // --- メタデータ ---
  createdAt: Timestamp;
  updatedAt: Timestamp;
}