import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { db } from "@/firebase/index.js";
import { useActivityLog } from '@/hooks/useActivityLog'; // ★ これが専門家

// かんばんのカラム定義
export const followUpKanbanColumns = [
  // ...(ここは変更なし)...
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

  // ★ 活動記録の専門家を呼び出す
  const { saveLog, isSaving: isSavingLog } = useActivityLog();

  // --- データ取得 (リアルタイム) ---
  useEffect(() => {
    // ...(ここは変更なし)...
  }, []);

  // --- データをカラムごとに分類 ---
  const categorizedClients = useMemo(() => {
    // ...(ここは変更なし)...
  }, [clients]);

  // --- アクション: ステータス更新 (カード移動) ---
  const handleUpdateStatus = useCallback(async (clientId, newStatus) => {
    // ...(ここは変更なし)...
  }, []);

  // --- アクション: 完了処理 ---
  const handleOpenCompletionModal = useCallback((clientId) => {
    // ...(ここは変更なし)...
  }, []);

  const handleConfirmCompletion = useCallback(async (completionDate) => {
    // ...(ここは変更なし)...
  }, [completionTargetId]);

  // --- アクション: ロスト/退職処理 ---
  const handleOpenLostModal = useCallback((clientId, currentStatus) => {
    // ...(ここは変更なし)...
  }, []);

  const handleConfirmLost = useCallback(async (reason, details) => {
    // ...(ここは変更なし)...
  }, [lostTarget]);

  // --- アクション: 活動記録 (📞ボタン) ---
  const handleOpenFollowUpModal = useCallback((clientId) => {
    setFollowUpTargetId(clientId);
    setIsFollowUpModalOpen(true);
  }, []);
  
  // ★★★ ここが一番の変更点！ ★★★
  const handleConfirmFollowUp = useCallback(async (logData) => {
    if (!followUpTargetId) return;
    // 専門家にお願いするだけ！
    await saveLog(followUpTargetId, logData);
    setIsFollowUpModalOpen(false);
    setFollowUpTargetId(null);
  }, [followUpTargetId, saveLog]);

  // --- フックから返す値 ---
  return {
    // ...
    // ... (他のreturn値はそのまま)
    handleOpenFollowUpModal,
    modals: {
      // ... (completion, lost はそのまま)
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
        onSubmit: handleConfirmFollowUp, // ★ 変更点
        isSaving: isSavingLog, // ローディング状態も渡せる
      },
    },
  };
};