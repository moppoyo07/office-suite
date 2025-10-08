// features/clients/surveySubmitHandler.js

import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/firebase/index.js";

/**
 * アンケートデータをFirestoreに保存する関数
 * @param {string} clientId - クライアントのID
 * @param {object} formData - アンケートフォームから送られてきた、すでにフラット化されたデータ
 */
export const handleSurveySubmit = async (clientId, formData) => {
  console.log("--- handleSurveySubmit 開始 ---");
  console.log("受け取ったformData:", formData);

  // --- 最終的な保存データの作成 ---
  // formDataはすでに理想的なフラット構造なので、ほぼそのまま使える。
  // 追加したいメタデータ（更新日時など）と、元の生データをsurveyDataとして追加するだけ。
  const finalData = {
    ...formData, // アンケートで入力された全データを展開
    surveyData: formData, // 元のアンケートデータのスナップショットも保存
    updatedAt: serverTimestamp(),
  };

  // createdAtはドキュメントにまだ存在しない場合のみ追加する
  // (ClientCreatePageで既に設定されているため、ここでは不要な場合が多い)
  // if (!finalData.createdAt) {
  //   finalData.createdAt = serverTimestamp();
  // }
  
  console.log("Firestoreに保存する最終データ:", finalData);

  // --- Firestoreへの保存 ---
  const docRef = doc(db, "clients", clientId);
  await updateDoc(docRef, finalData);

  console.log(`clientId: ${clientId} のアンケートデータ保存が完了しました。`);
};