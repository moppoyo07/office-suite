// src/features/clients/components/LostCounter.jsx (新規作成)

import { useState, useEffect, useMemo } from 'react';
import { Box, Typography, Paper, Divider, CircularProgress } from '@mui/material';
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/firebase/index.js";

const lostCounterColumns = [
  { id: 'lead-new', title: '新規問合せ'},
  { id: 'lead-consulting', title: '相談・見学'},
  { id: 'lead-trial', title: '体験利用'},
  { id: 'contract-prep', title: '契約準備中'},
];

function LostCounter() {
  const [lostClients, setLostClients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, "clients"), where("status", "==", "closed-lost"));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const clientsData = querySnapshot.docs.map(doc => doc.data());
      setLostClients(clientsData);
      setLoading(false);
    }, (error) => {
      console.error("ロストデータのリアルタイム取得に失敗:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const lostCounts = useMemo(() => {
    return lostCounterColumns.reduce((acc, column) => {
      acc[column.id] = lostClients.filter(c => c.lostAtPhase === column.id).length;
      return acc;
    }, {});
  }, [lostClients]);

  return (
    <Paper sx={{ p: 1.5, mt: 3, flexShrink: 0, backgroundColor: 'rgba(30, 41, 59, 0.5)', backdropFilter: 'blur(4px)', border: '1px solid #06b6d4', boxShadow: '0 0 4px #06b6d4', borderRadius: '8px' }}>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>ロストカウンター</Typography>
      <Divider sx={{ borderColor: 'rgba(6, 182, 212, 0.3)' }} />
      {loading ? ( <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}><CircularProgress size={24} /></Box> ) : (
        <Box sx={{ display: 'flex', justifyContent: 'space-around', pt: 1 }}>
          {lostCounterColumns.map(col => (
            <Box key={`lost-${col.id}`} sx={{ textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">{col.title}</Typography>
              <Typography variant="h6">{lostCounts[col.id] || 0}人</Typography>
            </Box>
          ))}
        </Box>
      )}
    </Paper>
  );
}

export default LostCounter;