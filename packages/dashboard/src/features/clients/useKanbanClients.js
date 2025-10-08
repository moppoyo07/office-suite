// src/features/clients/useKanbanClients.js (新規作成)

import { useState, useEffect, useMemo, useCallback } from 'react';
import { collection, getDocs, doc, updateDoc, query, where, addDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "@/firebase/index.js";

const kanbanColumns = [
  { id: 'lead-new', title: '新規問合せ' },
  { id: 'lead-consulting', title: '相談・見学' },
  { id: 'lead-trial', title: '体験利用' },
  { id: 'contract-prep', title: '契約準備中' },
];

// このフックが、カンバンボードに必要なすべてのロジックとデータを提供する
export function useKanbanClients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // --- モーダル用のState ---
  const [isLostModalOpen, setIsLostModalOpen] = useState(false);
  const [lostTarget, setLostTarget] = useState(null);
  const [isSelectTypeModalOpen, setIsSelectTypeModalOpen] = useState(false);
  const [typeSelectTargetId, setTypeSelectTargetId] = useState(null);
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [followUpTargetId, setFollowUpTargetId] = useState(null);

  // --- データ取得 ---
  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const statuses = kanbanColumns.map(col => col.id);
      const q = query(collection(db, "clients"), where("status", "in", statuses));
      const querySnapshot = await getDocs(q);
      setClients(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) { console.error("利用者データの取得に失敗しました:", error); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  // --- ハンドラ関数群 ---
  const handleUpdateStatus = useCallback(async (clientId, newStatus) => {
    if (newStatus === 'trigger-modal') {
      setTypeSelectTargetId(clientId);
      setIsSelectTypeModalOpen(true);
    } else if (newStatus) {
      try {
        await updateDoc(doc(db, "clients", clientId), { status: newStatus });
        fetchClients();
      } catch (error) { console.error("ステータス更新エラー:", error); }
    }
  }, [fetchClients]);
  
  const handleConfirmClientType = useCallback(async (clientId, type) => {
    const newStatus = type === 'onsite' ? 'active_onsite' : 'active_remote';
    try {
      await updateDoc(doc(db, "clients", clientId), { status: newStatus });
      fetchClients();
    } catch (error) { console.error("利用種別更新エラー:", error); }
    finally { setIsSelectTypeModalOpen(false); setTypeSelectTargetId(null); }
  }, [fetchClients]);

  const handleOpenLostModal = useCallback((clientId, currentStatus) => {
    setLostTarget({ id: clientId, status: currentStatus });
    setIsLostModalOpen(true);
  }, []);
  
  const handleConfirmLost = useCallback(async (reason, details) => {
    if (!lostTarget) return;
    try {
      await updateDoc(doc(db, "clients", lostTarget.id), { status: 'closed-lost', lostAtPhase: lostTarget.status, lostReason: reason, lostReasonDetails: details });
      fetchClients();
    } catch (error) { console.error("ロスト処理エラー:", error); }
    finally { setIsLostModalOpen(false); setLostTarget(null); }
  }, [lostTarget, fetchClients]);

  const handleOpenFollowUpModal = useCallback((clientId) => {
    setFollowUpTargetId(clientId);
    setIsFollowUpModalOpen(true);
  }, []);

  const handleConfirmFollowUp = useCallback(async (actionType, memo) => {
    if (!followUpTargetId) return;
    try {
      await addDoc(collection(db, "clients", followUpTargetId, "follow_ups"), { actionType, memo, staffId: auth.currentUser.uid, createdAt: serverTimestamp() });
      alert('活動を記録しました。');
    } catch (error) { console.error("活動記録の保存エラー:", error); }
    finally { setIsFollowUpModalOpen(false); setFollowUpTargetId(null); }
  }, [followUpTargetId]);
  
  // --- 表示用データの計算 ---
  const categorizedClients = useMemo(() => {
    const data = {};
    kanbanColumns.forEach(column => {
      data[column.id] = clients.filter(c => c.status === column.id);
    });
    return data;
  }, [clients]);

  // --- このフックがコンポーネントに渡す値 ---
  return {
    loading,
    kanbanColumns,
    categorizedClients,
    handleUpdateStatus,
    handleOpenLostModal,
    handleOpenFollowUpModal,
    // モーダル関連の状態とハンドラ
    modals: {
      lost: {
        isOpen: isLostModalOpen,
        onClose: () => setIsLostModalOpen(false),
        onSubmit: handleConfirmLost,
      },
      selectType: {
        isOpen: isSelectTypeModalOpen,
        onClose: () => setIsSelectTypeModalOpen(false),
        onSubmit: handleConfirmClientType,
        targetId: typeSelectTargetId,
      },
      followUp: {
        isOpen: isFollowUpModalOpen,
        onClose: () => setIsFollowUpModalOpen(false),
        onSubmit: handleConfirmFollowUp,
        targetId: followUpTargetId,
      },
    },
  };
}