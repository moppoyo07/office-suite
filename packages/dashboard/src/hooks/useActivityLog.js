import { useState } from 'react';
import { collection, addDoc, doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/index.js";
import { useAuth } from '../features/auth/context/AuthContext';
import { CLIENT_STATUS } from '../constants/clientStatus';

// 問合せの電話回数に応じた次回連絡間隔（日数）
// index 0 = 1回目の電話後, 1 = 2回目後, ... 6 = 7回目以降
const CONTACT_INTERVALS = [1, 1, 3, 7, 12, 30, 31];

// 日曜日なら月曜日にずらす
const skipSunday = (date) => {
    if (date.getDay() === 0) date.setDate(date.getDate() + 1);
    return date;
};

const calcNextContactDate = (attempts) => {
    const days = CONTACT_INTERVALS[Math.min(attempts - 1, CONTACT_INTERVALS.length - 1)];
    const next = new Date();
    next.setHours(0, 0, 0, 0);
    next.setDate(next.getDate() + days);
    return skipSunday(next);
};

export const useActivityLog = () => {
    const { currentUser } = useAuth();
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState(null);

    /**
     * @param {string} clientId
     * @param {object} logData
     * @param {string} clientName
     * @param {object|null} clientData - クライアントドキュメントのデータ（追客用）
     */
    const saveLog = async (clientId, logData, clientName = '', clientData = null) => {
        if (!clientId) {
            console.error("【保存失敗】クライアントIDがありません");
            setError("利用者情報が取得できませんでした。");
            return { success: false, error: "利用者IDが不明です" };
        }

        setIsSaving(true);
        setError(null);

        try {
            const staffUid = currentUser?.uid || 'unknown_staff';
            const staffName = currentUser?.staffName || currentUser?.displayName || '担当職員';

            const { id, ...dataToSave } = logData;

            // 活動ログを保存
            await addDoc(collection(db, 'clients', clientId, 'activity_logs'), {
                ...dataToSave,
                clientName: clientName || '',
                createdAt: serverTimestamp(),
                staffUid,
                staffName,
                companyId: currentUser?.companyId || null,
            });

            // 電話 or メール の場合、次回予定日を自動計算してクライアントに書き込む
            const isContactAction = ['phone_call', 'email'].includes(logData.type);
            if (isContactAction) {
                // clientDataが渡されていない場合はFirestoreから取得
                let status = clientData?.status;
                let contactAttempts = clientData?.contactAttempts ?? null;

                if (!status) {
                    const snap = await getDoc(doc(db, 'clients', clientId));
                    if (snap.exists()) {
                        status = snap.data().status;
                        contactAttempts = snap.data().contactAttempts ?? 0;
                    }
                }

                if (status === CLIENT_STATUS.INQUIRY) {
                    // 問合せ：回数カウント＋間隔で自動計算
                    const currentAttempts = contactAttempts ?? 0;
                    const newAttempts = currentAttempts + 1;
                    const nextDate = calcNextContactDate(newAttempts);

                    await updateDoc(doc(db, 'clients', clientId), {
                        contactAttempts: newAttempts,
                        nextContactDate: nextDate,
                        updatedAt: serverTimestamp(),
                    });
                } else {
                    // 見学後保留・その他：2日後固定（日曜なら月曜へ）
                    const next = new Date();
                    next.setHours(0, 0, 0, 0);
                    next.setDate(next.getDate() + 2);
                    skipSunday(next);

                    await updateDoc(doc(db, 'clients', clientId), {
                        nextContactDate: next,
                        updatedAt: serverTimestamp(),
                    });
                }
            }

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
