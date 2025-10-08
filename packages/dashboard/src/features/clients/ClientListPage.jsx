import { useState, useEffect, useMemo, useCallback } from 'react';
import { Typography, Button, Paper, Box, Divider, CircularProgress } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { collection, getDocs, doc, updateDoc, addDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "@/firebase/index.js";

// コンポーネントのインポート
import ClientCard from './ClientCard.jsx'; 
import LostReasonModal from './components/LostReasonModal.jsx';
import FollowUpModal from './components/FollowUpModal.jsx';

const columns = [
  { id: 'lead-new', title: '新規問合せ', prevStatus: null, nextStatus: 'lead-consulting' },
  { id: 'lead-consulting', title: '相談・見学', prevStatus: 'lead-new', nextStatus: 'lead-trial' },
  { id: 'lead-trial', title: '体験利用', prevStatus: 'lead-consulting', nextStatus: 'contract-prep' },
  { id: 'contract-prep', title: '契約準備中', prevStatus: 'lead-trial', nextStatus: 'client-active' },
  { id: 'client-active', title: '利用中', prevStatus: 'contract-prep', nextStatus: null },
];

function ClientListPage() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLostModalOpen, setIsLostModalOpen] = useState(false);
  const [lostTarget, setLostTarget] = useState(null);
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [followUpTargetId, setFollowUpTargetId] = useState(null);

  const fetchClients = useCallback(async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "clients"));
      setClients(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) { console.error("利用者データの取得に失敗しました:", error); }
    finally { setLoading(false); }
  }, []);

  const handleUpdateStatus = useCallback(async (clientId, currentStatus, direction) => {
    const col = columns.find(c => c.id === currentStatus);
    const newStatus = direction === 'next' ? col.nextStatus : col.prevStatus;
    if (!newStatus) return;
    try {
      await updateDoc(doc(db, "clients", clientId), { status: newStatus, updatedAt: new Date() });
      fetchClients();
    } catch (error) { console.error("ステータス更新エラー:", error); }
  }, [fetchClients]);

  const handleComplete = useCallback((clientId) => { alert(`（将来の実装）クライアントID: ${clientId} を、次のフェーズに移行します。`); }, []);
  
  const handleOpenLostModal = useCallback((clientId, currentStatus) => {
    setLostTarget({ id: clientId, status: currentStatus });
    setIsLostModalOpen(true);
  }, []);
  
  const handleConfirmLost = useCallback(async (reason, details) => {
    if (!lostTarget) return;
    try {
      await updateDoc(doc(db, "clients", lostTarget.id), { status: 'closed-lost', lostAtPhase: lostTarget.status, lostReason: reason, lostReasonDetails: details, updatedAt: new Date() });
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

  useEffect(() => { fetchClients(); }, [fetchClients]);

  const clientsByStatus = useMemo(() => {
    const data = {};
    columns.forEach(column => { data[column.id] = clients.filter(c => c.status === column.id); });
    return data;
  }, [clients]);

  const lostCounts = useMemo(() => {
    return columns.reduce((acc, column) => {
      acc[column.id] = clients.filter(c => c.status === 'closed-lost' && c.lostAtPhase === column.id).length;
      return acc;
    }, {});
  }, [clients]);

  if (loading) { return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>; }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px - 48px)' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexShrink: 0 }}>
        <Typography variant="h4" sx={{ 
          fontWeight: 'bold', 
          color: '#e0e0e0',
          textShadow: '0 0 8px rgba(6, 182, 212, 0.7)',
        }}>
          利用者CRMボード
        </Typography>
        <Button component={RouterLink} to="/clients/new" variant="contained">新規利用者を追加</Button>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, flexGrow: 1, alignItems: 'stretch' }}>
        {columns.map(column => {
          const filteredClients = clientsByStatus[column.id] || [];
          return (
            <Box key={column.id} sx={{ flex: '1 0 220px', minWidth: 220, display: 'flex' }}>
              
              <Paper sx={{
                p: 2,
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: 'rgba(30, 41, 59, 0.5)',
                backdropFilter: 'blur(4px)',
                border: '1px solid #06b6d4',
                boxShadow: '0 0 4px #06b6d4',
                borderRadius: '8px',
                transition: 'box-shadow 0.3s ease-in-out',
                '&:hover': {
                  boxShadow: '0 0 8px #06b6d4, 0 0 16px #06b6d4',
                },
              }}>
                <Typography variant="h6" sx={{ mb: 2, borderBottom: '1px solid', borderColor: 'divider', pb: 1, display: 'flex', justifyContent: 'space-between' }}>
                  <span>{column.title}</span>
                  <span style={{ color: 'grey', fontSize: '0.9rem' }}>{filteredClients.length} 人</span>
                </Typography>
                <Box sx={{ flexGrow: 1, overflowY: 'auto', pr: 1 }}>
                  {filteredClients.map(client => (
                    <ClientCard 
                      key={client.id} client={client} onUpdateStatus={handleUpdateStatus}
                      onComplete={handleComplete} onLost={handleOpenLostModal} onFollowUp={() => handleOpenFollowUpModal(client.id)}
                    />
                  ))}
                </Box>
              </Paper>
            </Box>
          );
        })}
      </Box>

      <Paper sx={{
        p: 1.5,
        mt: 2,
        flexShrink: 0,
        backgroundColor: 'rgba(30, 41, 59, 0.5)',
        backdropFilter: 'blur(4px)',
        border: '1px solid #06b6d4',
        boxShadow: '0 0 4px #06b6d4',
        borderRadius: '8px',
      }}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>ロストカウンター</Typography>
        <Divider />
        <Box sx={{ display: 'flex', justifyContent: 'space-around', pt: 1 }}>
          {columns.map(col => (
            <Box key={`lost-${col.id}`} sx={{ textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">{col.title}</Typography>
              <Typography variant="h6">{lostCounts[col.id] || 0}人</Typography>
            </Box>
          ))}
        </Box>
      </Paper>
      
      <LostReasonModal open={isLostModalOpen} onClose={() => setIsLostModalOpen(false)} onSubmit={handleConfirmLost} />
      <FollowUpModal   open={isFollowUpModalOpen} 
                       onClose={() => setIsFollowUpModalOpen(false)} 
                       onSubmit={handleConfirmFollowUp}
                       clientId={followUpTargetId}
          />   
      </Box>
  );
}
export default ClientListPage;