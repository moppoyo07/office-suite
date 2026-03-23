// src/features/clients/useKanbanClients.js

import { useState, useEffect, useMemo, useCallback } from 'react';
import { collection, getDocs, doc, updateDoc, query, where, serverTimestamp, Timestamp } from "firebase/firestore";
import { db } from "../../firebase/index.js";
import { useActivityLog } from '../../hooks/useActivityLog';
import { useTenant } from '../../context/TenantContext';
import { CLIENT_STATUS, STATUS_CONFIG } from '../../constants/clientStatus';

// カンバンの列定義
const kanbanColumns = [
  { id: CLIENT_STATUS.INQUIRY,      title: STATUS_CONFIG[CLIENT_STATUS.INQUIRY].label },
  { id: CLIENT_STATUS.INTERVIEW,    title: STATUS_CONFIG[CLIENT_STATUS.INTERVIEW].label },
  { id: CLIENT_STATUS.TRIAL,        title: STATUS_CONFIG[CLIENT_STATUS.TRIAL].label },
  { id: CLIENT_STATUS.PRE_CONTRACT, title: STATUS_CONFIG[CLIENT_STATUS.PRE_CONTRACT].label },
];

// ステータス遷移時に必須入力する日付の定義
const TRANSITION_DATE_REQUIRED = {
  [CLIENT_STATUS.INTERVIEW]:    { label: '見学日',     fieldName: 'interviewDate',  fromLabel: '新規問合せ', toLabel: '面談・見学' },
  [CLIENT_STATUS.TRIAL]:        { label: '体験開始日', fieldName: 'trialDate',      fromLabel: '面談・見学', toLabel: '体験利用' },
  [CLIENT_STATUS.PRE_CONTRACT]: { label: '体験終了日', fieldName: 'trialEndDate',   fromLabel: '体験利用',   toLabel: '契約準備中' },
};

export function useKanbanClients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const { activeCompanyId: companyId } = useTenant();

  // --- モーダル用State ---
  const [isLostModalOpen, setIsLostModalOpen] = useState(false);
  const [lostTarget, setLostTarget] = useState(null);

  const [isSelectTypeModalOpen, setIsSelectTypeModalOpen] = useState(false);
  const [typeSelectTargetId, setTypeSelectTargetId] = useState(null);

  // ステージ遷移日付モーダル
  const [transitionModal, setTransitionModal] = useState({
    open: false,
    clientId: null,
    newStatus: null,
    dateLabel: '',
    fieldName: '',
    fromLabel: '',
    toLabel: '',
  });

  const { saveLog, isSaving: isSavingLog } = useActivityLog();

  // --- データ取得 ---
  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const statuses = kanbanColumns.map(col => col.id);
      statuses.push(CLIENT_STATUS.CLOSED);

      const companyFilter = companyId ? [where('companyId', '==', companyId)] : [];
      const q = query(collection(db, "clients"), ...companyFilter, where("status", "in", statuses));
      const querySnapshot = await getDocs(q);
      setClients(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error("利用者データの取得に失敗しました:", error);
    } finally {
      setLoading(false);
    }
  }, [companyId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchClients(); }, [fetchClients]);

  // --- ステータス更新（日付モーダルのインターセプト付き） ---
  const handleUpdateStatus = useCallback(async (clientId, newStatus) => {
    // 利用開始モーダル
    if (newStatus === 'trigger-modal') {
      setTypeSelectTargetId(clientId);
      setIsSelectTypeModalOpen(true);
      return;
    }

    // 日付入力が必要な遷移
    if (TRANSITION_DATE_REQUIRED[newStatus]) {
      const config = TRANSITION_DATE_REQUIRED[newStatus];
      setTransitionModal({
        open: true,
        clientId,
        newStatus,
        dateLabel: config.label,
        fieldName: config.fieldName,
        fromLabel: config.fromLabel,
        toLabel: config.toLabel,
      });
      return;
    }

    // 日付不要の遷移（後退など）
    try {
      await updateDoc(doc(db, "clients", clientId), {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });
      fetchClients();
    } catch (error) {
      console.error("ステータス更新エラー:", error);
    }
  }, [fetchClients]);

  // --- 日付モーダル確定 ---
  const handleConfirmTransition = useCallback(async (dateString) => {
    const { clientId, newStatus, fieldName } = transitionModal;
    if (!clientId || !newStatus || !dateString) return;

    try {
      const dateValue = Timestamp.fromDate(new Date(dateString));
      await updateDoc(doc(db, "clients", clientId), {
        status: newStatus,
        [fieldName]: dateValue,
        updatedAt: serverTimestamp(),
      });
      fetchClients();
    } catch (error) {
      console.error("ステータス+日付更新エラー:", error);
    } finally {
      setTransitionModal(prev => ({ ...prev, open: false }));
    }
  }, [transitionModal, fetchClients]);

  // --- 利用開始モーダル確定（利用形態 + 利用開始日） ---
  const handleConfirmClientType = useCallback(async (clientId, type, serviceStartDate) => {
    const newStatus = type === 'onsite' ? CLIENT_STATUS.ACTIVE_ONSITE : CLIENT_STATUS.ACTIVE_REMOTE;
    try {
      const dateValue = serviceStartDate ? Timestamp.fromDate(new Date(serviceStartDate)) : null;
      await updateDoc(doc(db, "clients", clientId), {
        status: newStatus,
        ...(dateValue ? { serviceStartDate: dateValue } : {}),
        updatedAt: serverTimestamp(),
      });
      fetchClients();
    } catch (error) {
      console.error("利用種別更新エラー:", error);
    } finally {
      setIsSelectTypeModalOpen(false);
      setTypeSelectTargetId(null);
    }
  }, [fetchClients]);

  // --- ロストモーダル ---
  const handleOpenLostModal = useCallback((clientId, currentStatus) => {
    if (!currentStatus) {
      console.error("ロスト処理エラー: 現在のステータスが不明です");
      return;
    }
    setLostTarget({ id: clientId, status: currentStatus });
    setIsLostModalOpen(true);
  }, []);

  const handleConfirmLost = useCallback(async (reason, details) => {
    if (!lostTarget) return;
    try {
      await updateDoc(doc(db, "clients", lostTarget.id), {
        status: CLIENT_STATUS.CLOSED,
        lostAtPhase: lostTarget.status,
        lostReason: reason,
        lostReasonDetails: details,
        updatedAt: serverTimestamp(),
      });
      fetchClients();
    } catch (error) {
      console.error("ロスト処理エラー:", error);
    } finally {
      setIsLostModalOpen(false);
      setLostTarget(null);
    }
  }, [lostTarget, fetchClients]);

  // --- 集計 ---
  const categorizedClients = useMemo(() => {
    const data = {};
    kanbanColumns.forEach(column => {
      data[column.id] = clients.filter(c => c.status === column.id);
    });
    return data;
  }, [clients]);

  const { lostCounts, totalInquiriesThisMonth } = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const thisMonthClients = clients.filter(c => {
      if (!c.createdAt) return false;
      const createdDate = c.createdAt.toDate ? c.createdAt.toDate() : new Date(c.createdAt);
      return createdDate >= monthStart && createdDate <= monthEnd;
    });

    const totalInquiries = thisMonthClients.length;

    const counts = kanbanColumns.reduce((acc, column) => {
      acc[column.id] = thisMonthClients.filter(c =>
        c.status === CLIENT_STATUS.CLOSED &&
        c.lostAtPhase === column.id
      ).length;
      return acc;
    }, {});

    return { lostCounts: counts, totalInquiriesThisMonth: totalInquiries };
  }, [clients]);

  return {
    loading,
    kanbanColumns,
    categorizedClients,
    lostCounts,
    totalInquiriesThisMonth,
    handleUpdateStatus,
    handleOpenLostModal,
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
      transition: {
        isOpen: transitionModal.open,
        fromLabel: transitionModal.fromLabel,
        toLabel: transitionModal.toLabel,
        dateLabel: transitionModal.dateLabel,
        onConfirm: handleConfirmTransition,
        onCancel: () => setTransitionModal(prev => ({ ...prev, open: false })),
      },
    },
  };
}
