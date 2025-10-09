import { useState } from 'react';
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/firebase/index.js";
import { useAuth } from '@/features/auth/context/AuthContext';

// 'use'で始まる関数名がカスタムフックのルール
export const useActivityLog = () => {
  const { currentUser } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  // ★ この関数が、活動記録を保存する本体！
  const saveLog = async (clientId, logData) => {
    console.log('★★ useActivityLog: saveLogが実行されました！');
    console.log(`保存先のクライアントID: ${clientId}`);
    console.log('保存するデータ:', logData);
    if (!clientId || !currentUser) {
      setError("クライアントIDまたはユーザー情報がありません。");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const logsCollectionRef = collection(db, 'clients', clientId, 'activity_logs');
      await addDoc(logsCollectionRef, {
        ...logData, // { type, content }
        createdAt: serverTimestamp(),
        staffUid: currentUser.uid,
        staffName: currentUser.staffName || currentUser.displayName,
      });
      console.log(`クライアント(ID: ${clientId})の活動記録を保存しました。`);
    } catch (e) {
      console.error("活動記録の保存に失敗:", e);
      setError("活動記録の保存に失敗しました。");
    } finally {
      setIsSaving(false);
    }
  };

  // このフックを使うコンポーネントに、保存関数と状態を渡す
  return { saveLog, isSaving, error };
};