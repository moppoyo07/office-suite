// src/hooks/useClientUpdater.js

import { useCallback } from 'react';
import { doc, updateDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import { db } from '../firebase'; 

export const useClientUpdater = (onSuccess) => {
  
  const graduateClient = useCallback(async (clientId, data) => {
    // データの種類を判定 (デフォルトは就職)
    const isEmployment = data.type === 'employment' || !data.type;

    // 基本チェック: IDと日付は必須
    if (!clientId || !data.employmentDate) {
      console.error("引数が不足: IDまたは日付なし");
      alert("エラー: 日付情報が必要です。");
      return;
    }

    // 就職の場合のみ、会社名チェックを行う
    if (isEmployment && !data.companyName) {
      console.error("引数が不足: 会社名なし");
      alert("エラー: 就職先企業名が必要です。");
      return;
    }

    const clientRef = doc(db, "clients", clientId);

    try {
      const updateData = {
        updatedAt: serverTimestamp(),
      };

      if (isEmployment) {
        // --- 就職の場合（定着支援へ） ---
        updateData.status = 'follow-up-m1'; // 定着支援1ヶ月目
        updateData.employmentDate = Timestamp.fromDate(data.employmentDate);
        updateData.employmentCompany = data.companyName.trim();
        
        // 互換性のため employmentInfo にも入れる
        updateData.employmentInfo = {
          companyName: data.companyName.trim(),
          employmentDate: Timestamp.fromDate(data.employmentDate),
        };
        
        console.log(`利用者 ${clientId} を 'follow-up-m1' (就職卒業) に更新`);
      } else {
        // --- その他の完了の場合（完了者リストへ直行） ---
        updateData.status = 'completed'; // 完了ステータス
        updateData.completionDate = Timestamp.fromDate(data.employmentDate); // 完了日
        updateData.completionNote = data.note || ''; // 完了理由メモ
        
        console.log(`利用者 ${clientId} を 'completed' (その他完了) に更新`);
      }

      await updateDoc(clientRef, updateData);

      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("卒業更新エラー:", error);
      alert("更新できませんでした。");
    }
  }, [onSuccess]);

  // ロスト処理 (変更なし)
  const loseClient = useCallback(async (clientId, lostInfo) => {
    if (!clientId || !lostInfo || !lostInfo.reason || !lostInfo.currentStatus) {
      alert("エラー: 必要な情報が不足しています。");
      return;
    }
    const clientRef = doc(db, "clients", clientId);
    try {
      await updateDoc(clientRef, {
        status: 'closed-lost',
        lostAtPhase: lostInfo.currentStatus,
        lostReason: lostInfo.reason,
        lostReasonDetails: lostInfo.details || "",
        updatedAt: serverTimestamp()
      });
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("ロスト処理エラー:", error);
      alert("ロスト処理に失敗しました。");
    }
  }, [onSuccess]);
  
  return { graduateClient, loseClient };
};