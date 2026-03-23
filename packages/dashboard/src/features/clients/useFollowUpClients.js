// src/features/clients/hooks/useFollowUpClients.js

import { useState, useEffect, useMemo, useCallback } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebase/index.js";
import { useActivityLog } from '../../hooks/useActivityLog';
import { useTenant } from '../../context/TenantContext';
import { CLIENT_STATUS } from '../../constants/clientStatus';

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
  const { activeCompanyId: companyId } = useTenant();

  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);
  const [completionTargetId, setCompletionTargetId] = useState(null);
  const [isLostModalOpen, setIsLostModalOpen] = useState(false);
  const [lostTarget, setLostTarget] = useState(null);
  // 定着支援ノートモーダル用
  const [isRetentionNoteModalOpen, setIsRetentionNoteModalOpen] = useState(false);
  const [retentionNoteTarget, setRetentionNoteTarget] = useState(null);

  const { saveLog, isSaving: isSavingLog } = useActivityLog();

  useEffect(() => {
    setLoading(true);
    const followUpStatuses = followUpKanbanColumns.map(col => col.status);
    const companyFilter = companyId ? [where('companyId', '==', companyId)] : [];
    const q = query(collection(db, "clients"), ...companyFilter, where("status", "in", followUpStatuses));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const clientsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setClients(clientsData);
      setLoading(false);
    }, (error) => {
      console.error("定着支援利用者の取得エラー:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [companyId]); // eslint-disable-line react-hooks/exhaustive-deps

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
        status: CLIENT_STATUS.CLOSED,
        closedType: 'lost',
        lostAtPhase: lostTarget.status,
        lostReason: reason,
        lostReasonDetails: details,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("退職処理エラー:", error);
    } finally {
      setIsLostModalOpen(false);
      setLostTarget(null);
    }
  }, [lostTarget]);



  // 定着支援ノートモーダルを開く（→ボタンから呼ばれる）
  const handleOpenRetentionNoteModal = useCallback((client) => {
    setRetentionNoteTarget(client);
    setIsRetentionNoteModalOpen(true);
  }, []);

  // 定着支援レポート保存後に月を進める
  // onSubmit から clientId を受け取る（RetentionReportModal が保存後に呼ぶ）
  const handleRetentionNoteSaveAndAdvance = useCallback(async (clientId) => {
    if (!retentionNoteTarget) return;
    try {
      const currentStatus = retentionNoteTarget.status;
      const match = currentStatus.match(/follow-up-m(\d+)/);
      if (match) {
        const currentMonth = parseInt(match[1], 10);
        if (currentMonth < 5) {
          const nextStatus = `follow-up-m${currentMonth + 1}`;
          await updateDoc(doc(db, "clients", clientId), { status: nextStatus });
        } else if (currentMonth === 5) {
          // 5ヶ月目: 完了モーダルを開く
          setIsRetentionNoteModalOpen(false);
          setRetentionNoteTarget(null);
          handleOpenCompletionModal(clientId);
          return;
        }
      }
    } catch (error) {
      console.error("ステータス更新エラー:", error);
    } finally {
      setIsRetentionNoteModalOpen(false);
      setRetentionNoteTarget(null);
    }
  }, [retentionNoteTarget, handleOpenCompletionModal]);

  return {
    loading,
    kanbanColumns: followUpKanbanColumns,
    categorizedClients,
    handleUpdateStatus,
    handleComplete: handleOpenCompletionModal,
    handleOpenLostModal,
    handleOpenRetentionNoteModal,
    handleRetentionNoteSaveAndAdvance,
    modals: {
      completion: { isOpen: isCompletionModalOpen, onClose: () => setIsCompletionModalOpen(false), onSubmit: handleConfirmCompletion, },
      lost: { isOpen: isLostModalOpen, onClose: () => setIsLostModalOpen(false), onSubmit: handleConfirmLost, },
      retentionNote: {
        isOpen: isRetentionNoteModalOpen,
        onClose: () => { setIsRetentionNoteModalOpen(false); setRetentionNoteTarget(null); },
        onSubmit: handleRetentionNoteSaveAndAdvance,
        target: retentionNoteTarget,
      },
    },
  };
};