import { useState, useEffect, useMemo, useCallback } from 'react';
import { Typography, Button, Paper, Box, Divider, CircularProgress } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { collection, getDocs, doc, updateDoc, addDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "@/firebase/index.js";

// コンポーネントのインポート
import ClientCard from './ClientCard.jsx';
import LostReasonModal from './components/LostReasonModal.jsx';


const columns = [
  { id: 'inquiry', title: '新規問合せ', prevStatus: null, nextStatus: 'interview' },
  { id: 'interview', title: '相談・見学', prevStatus: 'inquiry', nextStatus: 'trial' },
  { id: 'trial', title: '体験利用', prevStatus: 'interview', nextStatus: 'pre_contract' },
  { id: 'pre_contract', title: '契約準備中', prevStatus: 'trial', nextStatus: 'active_onsite' },
  { id: 'active_onsite', title: '利用中（施設内）', prevStatus: 'pre_contract', nextStatus: null },
];

function ClientListPage() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLostModalOpen, setIsLostModalOpen] = useState(false);
  const [lostTarget, setLostTarget] = useState(null);


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
      await updateDoc(doc(db, "clients", lostTarget.id), { status: 'closed', closedType: 'lost', lostAtPhase: lostTarget.status, lostReason: reason, lostReasonDetails: details, updatedAt: new Date() });
      fetchClients();
    } catch (error) { console.error("ロスト処理エラー:", error); }
    finally { setIsLostModalOpen(false); setLostTarget(null); }
  }, [lostTarget, fetchClients]);



  useEffect(() => { fetchClients(); }, [fetchClients]);

  const clientsByStatus = useMemo(() => {
    const data = {};
    columns.forEach(column => { data[column.id] = clients.filter(c => c.status === column.id); });
    return data;
  }, [clients]);

  const lostCounts = useMemo(() => {
    return columns.reduce((acc, column) => {
      acc[column.id] = clients.filter(c => (c.status === 'closed' || c.status === 'closed-lost') && c.lostAtPhase === column.id).length;
      return acc;
    }, {});
  }, [clients]);

  if (loading) { return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>; }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px - 48px)', overflow: 'hidden' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, flexShrink: 0, px: 2 }}>
        <Typography variant="h5" sx={{
          fontWeight: 'bold',
          color: '#e0e0e0',
          textShadow: '0 0 8px rgba(6, 182, 212, 0.7)',
          letterSpacing: '0.05em'
        }}>
          利用者CRMボード
        </Typography>
        <Button component={RouterLink} to="/clients/new" variant="contained" size="small">新規利用者を追加</Button>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, flexGrow: 1, overflowX: 'auto', overflowY: 'hidden', alignItems: 'stretch', pb: 1, px: 2 }}>
        {columns.map(column => {
          const filteredClients = clientsByStatus[column.id] || [];
          const lostCount = lostCounts[column.id] || 0;

          return (
            <Box key={column.id} sx={{ flex: '0 0 280px', display: 'flex', flexDirection: 'column', height: '100%' }}>

              {/* --- 上段: 利用者リスト (スクロール領域) --- */}
              <Paper sx={{
                width: '100%',
                flexGrow: 1,
                minHeight: 0,
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: 'rgba(30, 41, 59, 0.5)',
                backdropFilter: 'blur(4px)',
                border: '1px solid #06b6d4',
                boxShadow: '0 0 4px #06b6d4',
                borderRadius: '8px 8px 0 0',
                borderBottom: 'none',
                transition: 'box-shadow 0.3s ease-in-out',
                '&:hover': {
                  boxShadow: '0 0 8px #06b6d4, 0 0 16px #06b6d4',
                },
              }}>
                <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', fontSize: '1rem' }}>{column.title}</Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>{filteredClients.length} 人</Typography>
                </Box>
                <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 1 }}>
                  {filteredClients.map(client => (
                    <ClientCard
                      key={client.id} client={client} onUpdateStatus={handleUpdateStatus}
                      onComplete={handleComplete} onLost={handleOpenLostModal}
                    />
                  ))}
                </Box>
              </Paper>

              {/* --- 下段: ロストカウンター (コンパクト化) --- */}
              <Paper sx={{
                p: 1,
                width: '100%',
                flexShrink: 0,
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                border: '1px solid #06b6d4',
                borderTop: '1px dashed rgba(6, 182, 212, 0.5)',
                borderRadius: '0 0 8px 8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: '0 4px 6px rgba(0,0,0,0.4)',
              }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>Lost / 他決</Typography>
                <Typography variant="subtitle2" sx={{ color: '#ef4444', fontWeight: 'bold', fontSize: '1rem' }}>
                  {lostCount} <span style={{ fontSize: '0.7rem', color: 'grey', fontWeight: 'normal' }}>人</span>
                </Typography>
              </Paper>

            </Box>
          );
        })}
      </Box>

      <LostReasonModal open={isLostModalOpen} onClose={() => setIsLostModalOpen(false)} onSubmit={handleConfirmLost} />

    </Box>
  );
}
export default ClientListPage;