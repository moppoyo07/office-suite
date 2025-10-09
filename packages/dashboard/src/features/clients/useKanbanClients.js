import { useState, useEffect, useMemo, useCallback } from 'react';
import { collection, getDocs, doc, updateDoc, query, where } from "firebase/firestore";
import { db } from "@/firebase/index.js";
import { useActivityLog } from '@/hooks/useActivityLog';

// ★★★ 変更点：kanbanColumnsの定義を、関数の外（トップレベル）に移動しました！ ★★★
const kanbanColumns = [
  { id: 'lead-new', title: '新規問合せ' },
  { id: 'lead-consulting', title: '相談・見学' },
  { id: 'lead-trial', title: '体験利用' },
  { id: 'contract-prep', title: '契約準備中' },
];

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

  const { saveLog, isSaving: isSavingLog } = useActivityLog();

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

  // (ここから下のハンドラ関数群は、先ほどのコピペ版から変更ありません)
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

  const handleConfirmFollowUp = useCallback(async (logData) => {
    if (!followUpTargetId) return;
    await saveLog(followUpTargetId, logData); 
    setIsFollowUpModalOpen(false);
    setFollowUpTargetId(null);
  }, [followUpTargetId, saveLog]);
  
  const categorizedClients = useMemo(() => {
    const data = {};
    kanbanColumns.forEach(column => {
      data[column.id] = clients.filter(c => c.status === column.id);
    });
    return data;
  }, [clients]);

  return {
    loading,
    kanbanColumns, // ★ これが正しく返されるようになる！
    categorizedClients,
    handleUpdateStatus,
    handleOpenLostModal,
    handleOpenFollowUpModal,
    modals: {
      lost: { isOpen: isLostModalOpen, onClose: () => setIsLostModalOpen(false), onSubmit: handleConfirmLost, },
      selectType: { isOpen: isSelectTypeModalOpen, onClose: () => setIsSelectTypeModalOpen(false), onSubmit: handleConfirmClientType, targetId: typeSelectTargetId, },
      followUp: { isOpen: isFollowUpModalOpen, onClose: () => setIsFollowUpModalOpen(false), onSubmit: handleConfirmFollowUp, targetId: followUpTargetId, isSaving: isSavingLog, },
    },
  };
}