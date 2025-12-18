// src/features/clients/useKanbanClients.js

import { useState, useEffect, useMemo, useCallback } from 'react';
import { collection, getDocs, doc, updateDoc, query, where, serverTimestamp } from "firebase/firestore";
import { db } from "@/firebase/index.js";
import { useActivityLog } from '@/hooks/useActivityLog';
import { CLIENT_STATUS, STATUS_CONFIG } from '@/constants/clientStatus';

// カンバンの列定義
const kanbanColumns = [
  { id: CLIENT_STATUS.INQUIRY,      title: STATUS_CONFIG[CLIENT_STATUS.INQUIRY].label },
  { id: CLIENT_STATUS.INTERVIEW,    title: STATUS_CONFIG[CLIENT_STATUS.INTERVIEW].label },
  { id: CLIENT_STATUS.TRIAL,        title: STATUS_CONFIG[CLIENT_STATUS.TRIAL].label },
  { id: CLIENT_STATUS.PRE_CONTRACT, title: STATUS_CONFIG[CLIENT_STATUS.PRE_CONTRACT].label },
];

export function useKanbanClients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // --- モーダル用State ---
  const [isLostModalOpen, setIsLostModalOpen] = useState(false);
  const [lostTarget, setLostTarget] = useState(null); // { id: '...', status: '...' } が入る
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

  // --- ハンドラ ---
  const handleUpdateStatus = useCallback(async (clientId, newStatus) => {
    if (newStatus === 'trigger-modal') {
      setTypeSelectTargetId(clientId);
      setIsSelectTypeModalOpen(true);
    } else if (newStatus) {
      try {
        await updateDoc(doc(db, "clients", clientId), { 
          status: newStatus,
          updatedAt: serverTimestamp()
        });
        fetchClients();
      } catch (error) { console.error("ステータス更新エラー:", error); }
    }
  }, [fetchClients]);
  
  const handleConfirmClientType = useCallback(async (clientId, type) => {
    const newStatus = type === 'onsite' ? CLIENT_STATUS.ACTIVE_ONSITE : CLIENT_STATUS.ACTIVE_REMOTE;
    try {
      await updateDoc(doc(db, "clients", clientId), { 
        status: newStatus,
        updatedAt: serverTimestamp()
      });
      fetchClients();
    } catch (error) { console.error("利用種別更新エラー:", error); }
    finally { setIsSelectTypeModalOpen(false); setTypeSelectTargetId(null); }
  }, [fetchClients]);

  // ★★★ ここが重要：ロストモーダルを開くとき、現在のステータスを記録する ★★★
  const handleOpenLostModal = useCallback((clientId, currentStatus) => {
    // currentStatus が undefined の場合を防ぐ
    if (!currentStatus) {
      console.error("ロスト処理エラー: 現在のステータスが不明です");
      return;
    }
    setLostTarget({ id: clientId, status: currentStatus });
    setIsLostModalOpen(true);
  }, []);
  
  // ★★★ ここが重要：保存するときに lostAtPhase を書き込む ★★★
  const handleConfirmLost = useCallback(async (reason, details) => {
    if (!lostTarget) return;
    try {
      await updateDoc(doc(db, "clients", lostTarget.id), { 
        status: CLIENT_STATUS.CLOSED, // 全員ここに行くが...
        lostAtPhase: lostTarget.status, // ★この「名札」で区別する！
        lostReason: reason, 
        lostReasonDetails: details,
        updatedAt: serverTimestamp()
      });
      fetchClients(); // 画面更新
    } catch (error) { console.error("ロスト処理エラー:", error); }
    finally { setIsLostModalOpen(false); setLostTarget(null); }
  }, [lostTarget, fetchClients]);

  // ... フォローアップ関連 ...
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
    kanbanColumns,
    categorizedClients,
    handleUpdateStatus,
    handleOpenLostModal,
    handleOpenFollowUpModal,
    modals: {
      lost: { 
        isOpen: isLostModalOpen, 
        onClose: () => setIsLostModalOpen(false), 
        onSubmit: handleConfirmLost, 
      },
      selectType: { isOpen: isSelectTypeModalOpen, onClose: () => setIsSelectTypeModalOpen(false), onSubmit: handleConfirmClientType, targetId: typeSelectTargetId, },
      followUp: { isOpen: isFollowUpModalOpen, onClose: () => setIsFollowUpModalOpen(false), onSubmit: handleConfirmFollowUp, targetId: followUpTargetId, isSaving: isSavingLog, },
    },
  };
}