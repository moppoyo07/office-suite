// src/features/clients/hooks/useFollowUpClients.js

import { useState, useEffect, useMemo, useCallback } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { db } from "@/firebase/index.js";
import { useActivityLog } from '@/hooks/useActivityLog';

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
  
  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);
  const [completionTargetId, setCompletionTargetId] = useState(null);
  const [isLostModalOpen, setIsLostModalOpen] = useState(false);
  const [lostTarget, setLostTarget] = useState(null);
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [followUpTargetId, setFollowUpTargetId] = useState(null);

  const { saveLog, isSaving: isSavingLog } = useActivityLog();

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

  const categorizedClients = useMemo(() => {
    return followUpKanbanColumns.reduce((acc, column) => {
      acc[column.id] = clients.filter(client => client.status === column.status);
      return acc;
    }, {});
  }, [clients]);

  const handleUpdateStatus = useCallback(async (clientId, newStatus) => {
    try {
      await updateDoc(doc(db, "clients", clientId), { status: newStatus });
    } catch (error) {
      console.error("ステータス更新エラー:", error);
    }
  }, []);

  const handleOpenCompletionModal = useCallback((clientId) => {
    setCompletionTargetId(clientId);
    setIsCompletionModalOpen(true);
  }, []);

  const handleConfirmCompletion = useCallback(async (completionDate) => {
    if (!completionTargetId || !completionDate) return;
    try {
      await updateDoc(doc(db, "clients", completionTargetId), { 
        status: 'completed',
        followUpCompletionDate: completionDate
      });
    } catch (error) {
      console.error("完了処理エラー:", error);
    } finally {
      setIsCompletionModalOpen(false);
      setCompletionTargetId(null);
    }
  }, [completionTargetId]);

  const handleOpenLostModal = useCallback((clientId, currentStatus) => {
    setLostTarget({ id: clientId, status: currentStatus });
    setIsLostModalOpen(true);
  }, []);

  // ★修正: ロスト時にステータスを更新し、フェーズ記録も行うように修正
  const handleConfirmLost = useCallback(async (reason, details) => {
    if (!lostTarget) return;
    try {
      await updateDoc(doc(db, "clients", lostTarget.id), { 
        status: 'closed-lost',            // リストから消すためステータス変更
        lostAtPhase: lostTarget.status,   // ロストカウンター集計用
        
        isRetired: true,
        retiredAt: new Date(),
        lostReason: reason,
        lostReasonDetails: details
      });
    } catch (error) {
      console.error("退職処理エラー:", error);
    } finally {
      setIsLostModalOpen(false);
      setLostTarget(null);
    }
  }, [lostTarget]);

  const handleOpenFollowUpModal = useCallback((clientId) => {
    setFollowUpTargetId(clientId);
    setIsFollowUpModalOpen(true);
  }, []);
  
  const handleConfirmFollowUp = useCallback(async (logData) => {
    if (!followUpTargetId) return;
    await saveLog(followUpTargetId, logData);
    setIsFollowUpModalOpen(false);
    setFollowUpTargetId(null);
  }, [followUpTargetId, saveLog]);

  return {
    loading,
    kanbanColumns: followUpKanbanColumns,
    categorizedClients,
    handleUpdateStatus,
    handleComplete: handleOpenCompletionModal, 
    handleOpenLostModal,
    handleOpenFollowUpModal,
    modals: {
      completion: { isOpen: isCompletionModalOpen, onClose: () => setIsCompletionModalOpen(false), onSubmit: handleConfirmCompletion, },
      lost: { isOpen: isLostModalOpen, onClose: () => setIsLostModalOpen(false), onSubmit: handleConfirmLost, },
      followUp: { isOpen: isFollowUpModalOpen, onClose: () => setIsFollowUpModalOpen(false), targetId: followUpTargetId, onSubmit: handleConfirmFollowUp, isSaving: isSavingLog, },
    },
  };
};