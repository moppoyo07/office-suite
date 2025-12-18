// src/pages/AdminCleanupPage.jsx

import React, { useState } from 'react';
import { Box, Button, Typography, Paper, Alert, CircularProgress } from '@mui/material';
import { collection, getDocs, writeBatch, doc } from 'firebase/firestore';
import { db } from '@/firebase/index';
import { CLIENT_STATUS } from '@/constants/clientStatus';

export const AdminCleanupPage = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [logs, setLogs] = useState([]);

  // 旧IDと新IDの変換マップ
  const PHASE_MAPPING = {
    'lead-new': CLIENT_STATUS.INQUIRY,      // inquiry
    'lead-consulting': CLIENT_STATUS.INTERVIEW, // interview
    'lead-trial': CLIENT_STATUS.TRIAL,          // trial
    'contract-prep': CLIENT_STATUS.PRE_CONTRACT // pre_contract
  };

  const fixLostPhases = async () => {
    setLoading(true);
    setMessage(null);
    setLogs([]);
    let count = 0;

    try {
      const querySnapshot = await getDocs(collection(db, "clients"));
      const batch = writeBatch(db);
      let batchCount = 0;

      querySnapshot.forEach((document) => {
        const data = document.data();
        
        // ロストしたフェーズの記録があるかチェック
        if (data.lostAtPhase && PHASE_MAPPING[data.lostAtPhase]) {
          const oldPhase = data.lostAtPhase;
          const newPhase = PHASE_MAPPING[oldPhase];
          
          const ref = doc(db, "clients", document.id);
          
          // 更新内容：lostAtPhaseを新しくし、statusも念のため closed に統一
          const updateData = {
            lostAtPhase: newPhase,
          };

          // もしステータスが古い closed-lost なら、新しい closed に直す
          if (data.status === 'closed-lost') {
            updateData.status = CLIENT_STATUS.CLOSED;
          }

          batch.update(ref, updateData);
          
          setLogs(prev => [...prev, `${data.name}: ${oldPhase} → ${newPhase}`]);
          count++;
          batchCount++;
        }
      });

      if (count > 0) {
        await batch.commit();
        setMessage(`完了: ${count}件のデータを修正しました。`);
      } else {
        setMessage("修正が必要なデータは見つかりませんでした。");
      }

    } catch (error) {
      console.error(error);
      setMessage(`エラー発生: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 4, maxWidth: 800, mx: 'auto' }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h5" gutterBottom fontWeight="bold">
          データ整合性修正ツール
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          過去の「ロスト（利用終了）」データの内部IDが古いため、集計に反映されていません。<br />
          以下のボタンを押すと、<code>lead-consulting</code> などを <code>interview</code> に変換します。
        </Typography>

        <Box sx={{ my: 3 }}>
          <Button 
            variant="contained" 
            color="secondary" 
            onClick={fixLostPhases} 
            disabled={loading}
            size="large"
          >
            {loading ? <CircularProgress size={24} /> : "ロストフェーズの旧IDを新IDに変換実行"}
          </Button>
        </Box>

        {message && (
          <Alert severity={message.includes("エラー") ? "error" : "success"} sx={{ mb: 2 }}>
            {message}
          </Alert>
        )}

        {logs.length > 0 && (
          <Box sx={{ mt: 2, p: 2, bgcolor: '#1e1e1e', borderRadius: 1, maxHeight: 300, overflowY: 'auto' }}>
            <Typography variant="caption" color="#888" display="block" mb={1}>
              実行ログ:
            </Typography>
            {logs.map((log, index) => (
              <Typography key={index} variant="caption" display="block" sx={{ fontFamily: 'monospace', color: '#ddd' }}>
                {log}
              </Typography>
            ))}
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default AdminCleanupPage;