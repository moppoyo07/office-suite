// src/features/clients/LostCounter.jsx

import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid } from '@mui/material';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/index';
import { CLIENT_STATUS, STATUS_CONFIG } from '@/constants/clientStatus';

export const LostCounter = () => {
  const targetPhases = [
    CLIENT_STATUS.INQUIRY,      // 新規問合せ
    CLIENT_STATUS.INTERVIEW,    // 相談・見学
    CLIENT_STATUS.TRIAL,        // 体験利用
    CLIENT_STATUS.PRE_CONTRACT  // 契約準備中
  ];

  const [stats, setStats] = useState({});

  useEffect(() => {
    const fetchLostStats = async () => {
      try {
        const q = query(
          collection(db, 'clients'),
          where('status', '==', CLIENT_STATUS.CLOSED)
        );
        const querySnapshot = await getDocs(q);
        
        const newStats = {};
        targetPhases.forEach(phase => newStats[phase] = 0);

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const phase = data.lostAtPhase;
          if (targetPhases.includes(phase)) {
            newStats[phase] = (newStats[phase] || 0) + 1;
          }
        });

        setStats(newStats);
      } catch (error) {
        console.error("ロスト集計エラー:", error);
      }
    };

    fetchLostStats();
  }, []);

  return (
    <Box 
      sx={{ 
        mt: 2, 
        p: 2, 
        border: '1px solid rgba(6, 182, 212, 0.7)', // Cyan枠線
        borderRadius: 2, 
        bgcolor: 'rgba(22, 28, 36, 0.6)', // 黒透過背景
        boxShadow: '0 0 10px rgba(6, 182, 212, 0.1)',
      }}
    >
      <Typography 
        variant="subtitle2" 
        sx={{ 
          mb: 1, 
          color: '#fff', 
          fontWeight: 'bold',
          borderLeft: '3px solid #06b6d4',
          pl: 1
        }}
      >
        ロストカウンター
      </Typography>
      
      <Grid container spacing={2} textAlign="center">
        {targetPhases.map((phaseId) => (
          // ★★★ 修正ポイント: item プロパティを削除し、xs={3} を size={{ xs: 3 }} に変更 ★★★
          <Grid key={phaseId} size={{ xs: 3 }}>
            <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mb: 0.5 }}>
              {STATUS_CONFIG[phaseId]?.label || phaseId}
            </Typography>
            
            <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#fff' }}>
              {stats[phaseId] || 0}
              <Typography component="span" variant="caption" sx={{ ml: 0.5, color: '#94a3b8' }}>
                人
              </Typography>
            </Typography>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default LostCounter;