// src/features/clients/ClientCompletedListPage.jsx

import { useState, useEffect, useCallback } from 'react';
import { Box, CircularProgress, Grid, Typography } from '@mui/material';
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/firebase/index.js";
import ClientCard from './ClientCard.jsx';
import FollowUpModal from './components/FollowUpModal.jsx'; // 念のため活動記録モーダルは残す

function ClientCompletedListPage() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // 活動記録モーダル用のState
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [followUpTargetId, setFollowUpTargetId] = useState(null);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      // statusが 'completed' のものを、完了日が新しい順に取得
      const q = query(
        collection(db, "clients"), 
        where("status", "==", "completed"),
        orderBy("followUpCompletionDate", "desc") // followUpCompletionDateフィールドで降順ソート
      );
      const querySnapshot = await getDocs(q);
      setClients(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) { 
      console.error("完了者データの取得に失敗しました:", error); 
    } finally { 
      setLoading(false); 
    }
  }, []);

  useEffect(() => { 
    fetchClients(); 
  }, [fetchClients]);
  
  // 活動記録モーダルを開くハンドラ
  const handleOpenFollowUpModal = useCallback((clientId) => {
    setFollowUpTargetId(clientId);
    setIsFollowUpModalOpen(true);
  }, []);

  // 活動記録を保存するハンドラ
  const handleConfirmFollowUp = useCallback(async (actionType, memo) => {
    if (!followUpTargetId) return;
    try {
      // (ロジックは他ページと同じ)
    } catch (error) { 
      console.error("活動記録の保存エラー:", error); 
    } finally { 
      setIsFollowUpModalOpen(false); 
      setFollowUpTargetId(null); 
    }
  }, [followUpTargetId]);


  if (loading) { 
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>; 
  }

  return (
    <Box sx={{ p: 2 }}>
      <Grid container spacing={2}> 
        {clients.map(client => (
          // 4列表示（lg={3} は 12/3=4）
          <Grid item key={client.id} xs={12} sm={6} md={4} lg={3}>
            <ClientCard 
              client={client}
              onFollowUp={handleOpenFollowUpModal}
              // このページでは不要なハンドラは渡さない
              onUpdateStatus={() => {}}
              onLost={() => {}}
            />
          </Grid>
        ))}
      </Grid>

      {clients.length === 0 && !loading && (
        <Typography sx={{ textAlign: 'center', p: 4, color: 'text.secondary' }}>
          完了した利用者はいません。
        </Typography>
      )}

      <FollowUpModal 
        open={isFollowUpModalOpen} 
        onClose={() => setIsFollowUpModalOpen(false)} 
        onSubmit={handleConfirmFollowUp} 
        clientId={followUpTargetId} 
      />
    </Box>
  );
}

export default ClientCompletedListPage;