import { useState } from 'react';
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/firebase/index.js";
import { useAuth } from '@/features/auth/context/AuthContext';

export const useActivityLog = () => {
  const { currentUser } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  const saveLog = async (clientId, logData) => {
    // IDチェック
    if (!clientId) {
      console.error("【保存失敗】クライアントIDがありません");
      setError("利用者情報が取得できませんでした。");
      return { success: false, error: "利用者IDが不明です" };
    }

    setIsSaving(true);
    setError(null);

    try {
      // ユーザー情報（保険）
      const staffUid = currentUser?.uid || 'unknown_staff';
      const staffName = currentUser?.staffName || currentUser?.displayName || '担当職員';

      // ★★★ 絶対にここが必要です！ ★★★
      // logData の中にある 'id' (undefined) を取り除き、残りを dataToSave に入れます。
      const { id, ...dataToSave } = logData;

      const logsCollectionRef = collection(db, 'clients', clientId, 'activity_logs');
      
      await addDoc(logsCollectionRef, {
        ...dataToSave, // idを含まないきれいなデータ
        createdAt: serverTimestamp(),
        staffUid: staffUid,
        staffName: staffName,
      });
      
      console.log("【保存成功】");
      return { success: true };

    } catch (e) {
      console.error("【保存エラー】", e);
      setError("保存中にエラーが発生しました。");
      return { success: false, error: e.message };
    } finally {
      setIsSaving(false);
    }
  };

  return { saveLog, isSaving, error };
};