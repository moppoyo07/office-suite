// src/hooks/useClientUpdater.js

import { useCallback } from 'react';
import { doc, updateDoc, serverTimestamp, Timestamp, addDoc, collection } from "firebase/firestore";
import { db } from '../firebase';
import { CLIENT_STATUS } from '../constants/clientStatus';

export const useClientUpdater = (onSuccess) => {

  /**
   * 卒業・退所処理（3タイプ対応）
   * type: 'employment' | 'graduated_no_job' | 'withdrawal'
   */
  const graduateClient = useCallback(async (clientId, data) => {
    if (!clientId || !data.date) {
      alert('エラー: 日付情報が必要です。');
      return;
    }
    if (data.type === 'employment' && !data.companyName) {
      alert('エラー: 就職先企業名が必要です。');
      return;
    }
    if (data.type === 'withdrawal' && !data.reason) {
      alert('エラー: 退所理由が必要です。');
      return;
    }

    const clientRef = doc(db, 'clients', clientId);
    const dateValue = Timestamp.fromDate(new Date(data.date));

    try {
      if (data.type === 'employment') {
        // 就職 → 定着支援1ヶ月目へ
        await updateDoc(clientRef, {
          status: CLIENT_STATUS.FOLLOW_UP_M1,
          employmentDate: dateValue,
          employmentCompany: data.companyName,
          employmentAddress: data.companyAddress || '',
          employmentPhone: data.companyPhone || '',
          employmentContact: data.companyContact || '',
          closedType: null,
          updatedAt: serverTimestamp(),
        });

        // 活動記録に自動追加
        const logLines = [`【就職決定】`, `就職先: ${data.companyName}`];
        if (data.companyAddress) logLines.push(`住所: ${data.companyAddress}`);
        if (data.companyPhone) logLines.push(`電話: ${data.companyPhone}`);
        if (data.companyContact) logLines.push(`担当者: ${data.companyContact}`);
        logLines.push(`就職日: ${data.date}`);

        await addDoc(collection(db, 'clients', clientId, 'activity_logs'), {
          type: 'employment',
          content: logLines.join('\n'),
          createdAt: serverTimestamp(),
          staffName: '自動記録',
        });

      } else if (data.type === 'graduated_no_job') {
        // 就職無し卒業 → expired_graduation
        await updateDoc(clientRef, {
          status: CLIENT_STATUS.EXPIRED_GRADUATION,
          completionDate: dateValue,
          completionNote: data.details || '',
          closedType: 'graduated_no_job',
          updatedAt: serverTimestamp(),
        });

      } else if (data.type === 'withdrawal') {
        // 利用中退所 → closed
        const WITHDRAWAL_LABELS = {
          health: '体調不良', distance: '通所困難', transferred: '他事業所へ移行',
          family: '家族の事情', employed: '就職・転職', expired: '期間満了', other: 'その他',
        };
        const reasonLabel = WITHDRAWAL_LABELS[data.reason] || data.reason;

        await updateDoc(clientRef, {
          status: CLIENT_STATUS.CLOSED,
          closedType: 'withdrawal',
          closedDate: dateValue,
          lostReason: data.reason,
          lostReasonDetails: data.details || '',
          lostAtPhase: CLIENT_STATUS.ACTIVE_ONSITE, // 活動中からの退所
          updatedAt: serverTimestamp(),
        });

        // 活動記録に自動追加
        await addDoc(collection(db, 'clients', clientId, 'activity_logs'), {
          type: 'lost',
          content: `【利用中退所】\n理由: ${reasonLabel}${data.details ? '\n詳細: ' + data.details : ''}`,
          createdAt: serverTimestamp(),
          staffName: '自動記録',
        });
      }

      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('卒業・退所処理エラー:', error);
      alert('処理に失敗しました。');
    }
  }, [onSuccess]);

  /**
   * ロスト処理（新規獲得フェーズでの離脱）
   * 理由必須
   */
  const loseClient = useCallback(async (clientId, lostInfo) => {
    if (!clientId || !lostInfo?.reason || !lostInfo?.currentStatus) {
      alert('エラー: 理由と現在のステータスが必要です。');
      return;
    }

    const LOST_REASON_LABELS = {
      other: 'その他', details_mismatch: '条件不一致', price: '料金・費用',
      distance: '通所困難', atmosphere: '雰囲気', health: '体調不良',
      transferred: '他事業所へ', expired: '期間満了', drop_out: '途中退所',
    };

    const clientRef = doc(db, 'clients', clientId);
    try {
      await updateDoc(clientRef, {
        status: CLIENT_STATUS.CLOSED,
        closedType: 'lost',
        lostAtPhase: lostInfo.currentStatus,
        lostReason: lostInfo.reason,
        lostReasonDetails: lostInfo.details || '',
        updatedAt: serverTimestamp(),
      });

      const reasonLabel = LOST_REASON_LABELS[lostInfo.reason] || lostInfo.reason;
      await addDoc(collection(db, 'clients', clientId, 'activity_logs'), {
        type: 'lost',
        content: lostInfo.details
          ? `【利用終了】\n理由: ${reasonLabel}\n詳細: ${lostInfo.details}`
          : `【利用終了】\n理由: ${reasonLabel}`,
        createdAt: serverTimestamp(),
        staffName: '自動記録',
      });

      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('ロスト処理エラー:', error);
      alert('ロスト処理に失敗しました。');
    }
  }, [onSuccess]);

  return { graduateClient, loseClient };
};
