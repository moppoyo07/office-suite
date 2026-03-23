import { useState, useEffect, useCallback } from 'react';
import { Box, CircularProgress, Grid, Paper, Typography } from '@mui/material';
import { collection, getDocs, doc, updateDoc, query, where, addDoc, serverTimestamp, onSnapshot } from "firebase/firestore";
import { db, auth } from "../../firebase/index.js";
import { useClientUpdater } from '../../hooks/useClientUpdater';
import { useTenant } from '../../context/TenantContext';

import ClientCard from './ClientCard.jsx';
import EmploymentInfoModal from './components/EmploymentInfoModal.jsx';
import LostReasonModal from './components/LostReasonModal.jsx';
import RetentionPlanInputModal from './components/RetentionPlanInputModal.jsx';

function ClientOnsitePage() {
  const { activeCompanyId: companyId } = useTenant();

  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [retirementCount, setRetirementCount] = useState(0);
  const [isLostModalOpen, setIsLostModalOpen] = useState(false);
  const [lostTarget, setLostTarget] = useState(null);
  const [isEmploymentModalOpen, setIsEmploymentModalOpen] = useState(false);
  const [employmentTargetId, setEmploymentTargetId] = useState(null);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [planTargetClient, setPlanTargetClient] = useState(null);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const companyFilter = companyId ? [where('companyId', '==', companyId)] : [];
      const q = query(collection(db, "clients"), ...companyFilter, where("status", "==", "active_onsite"));
      const querySnapshot = await getDocs(q);
      setClients(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) { console.error("利用者データの取得に失敗しました:", error); }
    finally { setLoading(false); }
  }, [companyId]);

  const { graduateClient, loseClient } = useClientUpdater(fetchClients);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  useEffect(() => {
    const companyFilter = companyId ? [where('companyId', '==', companyId)] : [];
    const q = query(collection(db, "clients"), ...companyFilter, where("status", "in", ["closed", "closed-lost"]), where("lostAtPhase", "==", "active_onsite"));
    const unsubscribe = onSnapshot(q, (snapshot) => { setRetirementCount(snapshot.size); }, (error) => { console.error("退所者数の取得に失敗しました:", error); });
    return () => unsubscribe();
  }, [companyId]);

  const handleUpdateStatus = useCallback(async (clientId, newStatus) => {
    try {
      await updateDoc(doc(db, "clients", clientId), { status: newStatus });
      fetchClients();
    }
    catch (error) { console.error("ステータス更新エラー:", error); }
  }, [fetchClients]);

  const handleOpenLostModal = useCallback((clientId, currentStatus) => {
    setLostTarget({ id: clientId, status: currentStatus });
    setIsLostModalOpen(true);
  }, []);

  const handleConfirmLost = useCallback(async (reason, details) => {
    if (!lostTarget) return;
    await loseClient(lostTarget.id, {
      reason,
      details,
      currentStatus: lostTarget.status
    });
    setIsLostModalOpen(false);
    setLostTarget(null);
  }, [lostTarget, loseClient]);


  const handleComplete = useCallback((clientId) => {
    setEmploymentTargetId(clientId);
    setIsEmploymentModalOpen(true);
  }, []);

  const handleConfirmEmployment = useCallback(async (employmentData) => {
    if (!employmentTargetId || !employmentData) return;
    await graduateClient(employmentTargetId, employmentData);
    setIsEmploymentModalOpen(false);
    // 就職確定の場合のみ計画書入力モーダルを開く
    if (employmentData.type === 'employment') {
      const target = clients.find(c => c.id === employmentTargetId);
      setPlanTargetClient(target || { id: employmentTargetId });
      setIsPlanModalOpen(true);
    }
    setEmploymentTargetId(null);
  }, [employmentTargetId, graduateClient, clients]);

  if (loading) { return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>; }

  return (
    <Box sx={{ p: 2, pb: 12 }}>
      <Grid container spacing={2}>
        {clients.map(client => (
          // ▼▼▼ 修正: itemを削除し、sizeプロパティに変更 ▼▼▼
          <Grid key={client.id} size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
            <ClientCard
              client={client}
              onUpdateStatus={handleUpdateStatus}
              onLost={handleOpenLostModal}
              onComplete={handleComplete}
            />
          </Grid>
        ))}
      </Grid>
      {clients.length === 0 && !loading && (<Box sx={{ textAlign: 'center', p: 4, color: 'text.secondary' }}>該当する利用者はいません。</Box>)}
      <Paper elevation={6} sx={{ position: 'fixed', bottom: 24, right: 24, width: { xs: 180, sm: 240 }, height: 120, borderRadius: 2, p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 1200, backdropFilter: 'blur(5px)', backgroundColor: 'rgba(255, 255, 255, 0.8)', }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>退所者数</Typography>
        <Typography variant="h3" component="p" sx={{ fontWeight: 'bold' }}>{retirementCount}</Typography>
      </Paper>
      <LostReasonModal open={isLostModalOpen} onClose={() => setIsLostModalOpen(false)} onSubmit={handleConfirmLost} />

      <EmploymentInfoModal
        open={isEmploymentModalOpen}
        onClose={() => setIsEmploymentModalOpen(false)}
        onSubmit={handleConfirmEmployment}
      />
      <RetentionPlanInputModal
        open={isPlanModalOpen}
        onClose={() => setIsPlanModalOpen(false)}
        onSubmit={() => { setIsPlanModalOpen(false); fetchClients(); }}
        clientId={planTargetClient?.id}
        clientName={planTargetClient?.name}
      />
    </Box>
  );
}

export default ClientOnsitePage;