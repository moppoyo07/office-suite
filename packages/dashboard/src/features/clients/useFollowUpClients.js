// src/features/clients/useFollowUpClients.js (新規作成)
import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { db } from "@/firebase/index.js";

// かんばんのカラム定義
export const followUpKanbanColumns = [
  { id: 'm1', title: '1ヶ月目', status: 'follow-up-m1' },
  { id: 'm2', title: '2ヶ月目', status: 'follow-up-m2' },
  { id: 'm3', title: '3ヶ月目', status: 'follow-up-m3' },
  { id: 'm4', title: '4ヶ月目', status: 'follow-up-m4' },
  { id: 'm5', title: '5ヶ月目', status: 'follow-up-m5' },
];

export const useFollowUpClients = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // --- モーダルの状態管理 ---
  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);
  const [completionTargetId, setCompletionTargetId] = useState(null);
  const [isLostModalOpen, setIsLostModalOpen] = useState(false);
  const [lostTarget, setLostTarget] = useState(null);
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [followUpTargetId, setFollowUpTargetId] = useState(null);

  // --- データ取得 (リアルタイム) ---
  useEffect(() => {
    setLoading(true);
    const followUpStatuses = followUpKanbanColumns.map(col => col.status);
    const q = query(collection(db, "clients"), where("status", "in", followUpStatuses));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const clientsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setClients(clientsData);
      setLoading(false);
    }, (error) => {
      console.error("定着支援利用者の取得エラー:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // --- データをカラムごとに分類 ---
  const categorizedClients = followUpKanbanColumns.reduce((acc, column) => {
    acc[column.id] = clients.filter(client => client.status === column.status);
    return acc;
  }, {});

  // --- アクション: ステータス更新 (カード移動) ---
  const handleUpdateStatus = useCallback(async (clientId, newStatus) => {
    try {
      await updateDoc(doc(db, "clients", clientId), { status: newStatus });
    } catch (error) {
      console.error("ステータス更新エラー:", error);
    }
  }, []);

  // --- アクション: 完了処理 (5ヶ月目→完了) ---
  const handleOpenCompletionModal = useCallback((clientId) => {
    setCompletionTargetId(clientId);
    setIsCompletionModalOpen(true);
  }, []);

  const handleConfirmCompletion = useCallback(async (completionDate) => {
    if (!completionTargetId || !completionDate) return;
    try {
      await updateDoc(doc(db, "clients", completionTargetId), { 
        status: 'completed',
        followUpCompletionDate: completionDate // 完了日を保存
      });
    } catch (error) {
      console.error("完了処理エラー:", error);
    } finally {
      setIsCompletionModalOpen(false);
      setCompletionTargetId(null);
    }
  }, [completionTargetId]);

  // --- アクション: ロスト/退職処理 (ClientCardの✖ボタン) ---
  const handleOpenLostModal = useCallback((clientId, currentStatus) => {
    // ★重要: 定着支援ではステータスを変えず isRetired フラグを立てる
    setLostTarget({ id: clientId, status: currentStatus });
    setIsLostModalOpen(true);
  }, []);

  const handleConfirmLost = useCallback(async (reason, details) => {
    if (!lostTarget) return;
    try {
      // 退職フラグを立てる (ボード上には残る)
      await updateDoc(doc(db, "clients", lostTarget.id), { 
        isRetired: true,
        retiredAt: new Date(),
        lostReason: reason, // 念のため理由も保存
        lostReasonDetails: details
      });
    } catch (error) {
      console.error("退職処理エラー:", error);
    } finally {
      setIsLostModalOpen(false);
      setLostTarget(null);
    }
  }, [lostTarget]);

  // --- アクション: 活動記録 (ClientCardの📞ボタン) ---
  const handleOpenFollowUpModal = useCallback((clientId) => {
    setFollowUpTargetId(clientId);
    setIsFollowUpModalOpen(true);
  }, []);
  
  // ※handleConfirmFollowUp (活動記録の保存) は FollowUpModal 側でやってくれる想定
  // もしページ側でするならここに追加。

  // --- フックから返す値 ---
  return {
    loading,
    kanbanColumns: followUpKanbanColumns,
    categorizedClients,
    handleUpdateStatus,
    // 5ヶ月目のカードの右矢印用。これはClientCardに渡すときにちょっと工夫が必要
    handleComplete: handleOpenCompletionModal, 
    handleOpenLostModal,
    handleOpenFollowUpModal,
    modals: {
      completion: {
        isOpen: isCompletionModalOpen,
        onClose: () => setIsCompletionModalOpen(false),
        onSubmit: handleConfirmCompletion,
      },
      lost: {
        isOpen: isLostModalOpen,
        onClose: () => setIsLostModalOpen(false),
        onSubmit: handleConfirmLost,
      },
      followUp: {
        isOpen: isFollowUpModalOpen,
        onClose: () => setIsFollowUpModalOpen(false),
        targetId: followUpTargetId,
        // onSubmit: もし必要なら渡す
      },
    },
  };
};