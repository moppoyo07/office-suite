// features/clients/surveySubmitHandler.js

import { doc, updateDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import { db } from "@/firebase/index.js";

/**
 * データをFirestore用にクリーニングするヘルパー関数
 * - undefined を null に変換 (Firestoreはundefined禁止のため)
 * - Dateオブジェクトを FirestoreのTimestamp または 文字列 に変換
 */
const sanitizeData = (data) => {
  const cleanData = {};
  
  Object.keys(data).forEach(key => {
    const value = data[key];

    if (value === undefined) {
      // undefined は null に変換して保存（または保存しないなら continue）
      cleanData[key] = null;
    } else if (value instanceof Date) {
      // JSのDateオブジェクトなら Timestamp に変換
      cleanData[key] = Timestamp.fromDate(value);
    } else {
      // その他の値はそのまま
      cleanData[key] = value;
    }
  });

  return cleanData;
};

/**
 * アンケートデータをFirestoreに保存する関数
 */
export const handleSurveySubmit = async (clientId, formData) => {
  console.log("--- handleSurveySubmit 開始 ---");
  
  // 1. データのクリーニング（これが超重要！）
  // これをやらないと、未入力項目が undefined になってエラーで止まります
  const safeFormData = sanitizeData(formData);

  console.log("Firestore保存用データ:", safeFormData);

  // 2. 最終保存データの作成
  // surveyDataフィールドにも保存するなら、そちらもクリーニングが必要
  const finalData = {
    ...safeFormData,              // ルートに展開
    surveyData: safeFormData,     // まとめて保存
    updatedAt: serverTimestamp(), // 更新日時
  };

  try {
    // 3. Firestoreへの保存
    const docRef = doc(db, "clients", clientId);
    await updateDoc(docRef, finalData);

    console.log(`clientId: ${clientId} のアンケートデータ保存が完了しました。`);
    
  } catch (error) {
    console.error("Firestore保存エラー詳細:", error);
    // エラーを呼び出し元（SurveyPage）に伝えて、あちらで catch させる
    throw error;
  }
};