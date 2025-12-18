// src/hooks/useClientUpdater.js

import { useCallback } from 'react';
import { doc, updateDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import { db } from '../firebase'; // パスは環境に合わせて調整

/**
 * 利用者情報の更新処理を専門に扱うカスタムフック
 */
export const useClientUpdater = (onSuccess) => {
  // ステータスを 'graduated' に更新し、就職情報を保存する関数
  const graduateClient = useCallback(async (clientId, employmentData) => {
    if (!clientId || !employmentData || !employmentData.employmentDate || !employmentData.companyName) {
      console.error("引数が不足しています: graduateClient");
      alert("エラー: 必要な情報が不足しています。");
      return;
    }

    const clientRef = doc(db, "clients", clientId);

    try {
      await updateDoc(clientRef, {
        status: 'graduated',
        employmentInfo: {
          companyName: employmentData.companyName.trim(),
          employmentDate: Timestamp.fromDate(employmentData.employmentDate),
        },
        updatedAt: serverTimestamp()
      });

      console.log(`利用者 ${clientId} を 'graduated' に更新しました。`);
      // 成功した場合に、親コンポーネントから渡されたコールバック関数を実行
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("就職情報の更新エラー:", error);
      alert("エラーが発生しました。就職情報を更新できませんでした。");
    }
  }, [onSuccess]);

  // ステータスを 'closed-lost' に更新し、失注情報を保存する関数
  const loseClient = useCallback(async (clientId, lostInfo) => {
    if (!clientId || !lostInfo || !lostInfo.reason || !lostInfo.currentStatus) {
      console.error("引数が不足しています: loseClient");
      alert("エラー: 必要な情報が不足しています。");
      return;
    }

    const clientRef = doc(db, "clients", clientId);

    try {
      await updateDoc(clientRef, {
        status: 'closed-lost',
        lostAtPhase: lostInfo.currentStatus,
        lostReason: lostInfo.reason,
        lostReasonDetails: lostInfo.details || "", // 詳細はオプショナル
        updatedAt: serverTimestamp()
      });

      console.log(`利用者 ${clientId} を 'closed-lost' に更新しました。`);
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("ロスト処理エラー:", error);
      alert("エラーが発生しました。ロスト処理に失敗しました。");
    }
  }, [onSuccess]);
  
  // 他の汎用的なステータス更新関数も、必要ならここに追加していく
  // const updateClientStatus = useCallback(async (clientId, newStatus) => { ... });

  // このフックが提供する関数群を返す
  return { graduateClient, loseClient };
};