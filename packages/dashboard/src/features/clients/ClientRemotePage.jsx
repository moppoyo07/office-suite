// src/features/clients/ClientRemotePage.jsx (修正後の完成版)

import { useState, useEffect, useCallback } from 'react';
import { Box, CircularProgress, Grid, Paper, Typography } from '@mui/material';
import { collection, getDocs, doc, updateDoc, query, where, addDoc, serverTimestamp, onSnapshot } from "firebase/firestore";
import { db, auth } from "@/firebase/index.js";
import ClientCard from './ClientCard.jsx';
import EmploymentDateModal from './components/EmploymentDateModal.jsx';
import LostReasonModal from './components/LostReasonModal.jsx';
import FollowUpModal from './components/FollowUpModal.jsx';

// ★ 修正点 1: コンポーネント名を変更
function ClientRemotePage() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [retirementCount, setRetirementCount] = useState(0);
  const [isLostModalOpen, setIsLostModalOpen] = useState(false);
  const [lostTarget, setLostTarget] = useState(null);
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [followUpTargetId, setFollowUpTargetId] = useState(null);
  const [isEmploymentModalOpen, setIsEmploymentModalOpen] = useState(false);
  const [employmentTargetId, setEmploymentTargetId] = useState(null);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      // ★ 修正点 2: クエリのステータスを "active_remote" に変更
      const q = query(collection(db, "clients"), where("status", "==", "active_remote"));
      const querySnapshot = await getDocs(q);
      setClients(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) { console.error("利用者データの取得に失敗しました:", error); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  useEffect(() => {
    // ★ 修正点 3: 退所者数取得のクエリも "active_remote" に変更
    const q = query(collection(db, "clients"), where("status", "==", "closed-lost"), where("lostAtPhase", "==", "active_remote"));
    const unsubscribe = onSnapshot(q, (snapshot) => { setRetirementCount(snapshot.size); }, (error) => { console.error("退所者数の取得に失敗しました:", error); });
    return () => unsubscribe();
  }, []);

  // --- これ以下の関数群は OnsitePage と全く同じなので変更不要 ---
  
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
    try {
      await updateDoc(doc(db, "clients", lostTarget.id), { status: 'closed-lost', lostAtPhase: lostTarget.status, lostReason: reason, lostReasonDetails: details });
      fetchClients();
    } 
    catch (error) { console.error("ロスト処理エラー:", error); }
    finally {
      setIsLostModalOpen(false);
      setLostTarget(null);
    }
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
    } 
    catch (error) { console.error("活動記録の保存エラー:", error); }
    finally {
      setIsFollowUpModalOpen(false);
      setFollowUpTargetId(null);
    }
  }, [followUpTargetId]);
  
  const handleComplete = useCallback((clientId) => {
    setEmploymentTargetId(clientId);
    setIsEmploymentModalOpen(true);
  }, []);
  
  const handleConfirmEmploymentDate = useCallback(async (employmentDate) => {
    if (!employmentTargetId || !employmentDate) return;
    try {
      await updateDoc(doc(db, "clients", employmentTargetId), { 
        status: 'follow-up-m1',
        serviceStartDate: employmentDate 
      });
      fetchClients();
    } 
    catch (error) { console.error("就職日の更新エラー:", error); } 
    finally { 
      setIsEmploymentModalOpen(false); 
      setEmploymentTargetId(null); 
    }
  }, [employmentTargetId, fetchClients]);

  if (loading) { return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>; }

  // --- JSX (見た目) の部分も OnsitePage と全く同じなので変更不要 ---

  return (
    <Box sx={{ p: 2, pb: 12 }}>
      <Grid container spacing={2}>
        {clients.map(client => (
          <Grid item key={client.id} xs={12} sm={6} md={4} lg={3}>
            <ClientCard
              client={client}
              onUpdateStatus={handleUpdateStatus} // onComplete ではなくこちら
              onLost={handleOpenLostModal}
              onFollowUp={handleOpenFollowUpModal}
              onComplete={handleComplete} // onComplete は定着支援への移行ボタン用
            />
          </Grid>
        ))}
      </Grid>
      {clients.length === 0 && !loading && ( <Box sx={{ textAlign: 'center', p: 4, color: 'text.secondary' }}>該当する利用者はいません。</Box> )}
      <Paper elevation={6} sx={{ position: 'fixed', bottom: 24, right: 24, width: { xs: 180, sm: 240 }, height: 120, borderRadius: 2, p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 1200, backdropFilter: 'blur(5px)', backgroundColor: 'rgba(255, 255, 255, 0.8)', }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>退所者数</Typography>
        <Typography variant="h3" component="p" sx={{ fontWeight: 'bold' }}>{retirementCount}</Typography>
      </Paper>
      <LostReasonModal open={isLostModalOpen} onClose={() => setIsLostModalOpen(false)} onSubmit={handleConfirmLost} />
      <FollowUpModal open={isFollowUpModalOpen} onClose={() => setIsFollowUpModalOpen(false)} onSubmit={handleConfirmFollowUp} clientId={followUpTargetId} />
      <EmploymentDateModal 
        open={isEmploymentModalOpen} 
        onClose={() => setIsEmploymentModalOpen(false)} 
        onSubmit={handleConfirmEmploymentDate} 
      />
    </Box>
  );
}

// ★ 修正点 1: export default も変更
export default ClientRemotePage;