// src/pages/AdminCleanupPage.jsx

import React, { useState } from 'react';
import { Box, Button, Typography, Paper, Alert, CircularProgress, Divider } from '@mui/material';
import { collection, getDocs, writeBatch, doc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase/index';
import { CLIENT_STATUS } from '../constants/clientStatus';
import { format } from 'date-fns';

export const AdminCleanupPage = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [logs, setLogs] = useState([]);

  // 旧IDと新IDの変換マップ
  const PHASE_MAPPING = {
    'lead-new': CLIENT_STATUS.INQUIRY,
    'lead-consulting': CLIENT_STATUS.INTERVIEW,
    'lead-trial': CLIENT_STATUS.TRIAL,
    'contract-prep': CLIENT_STATUS.PRE_CONTRACT
  };

  const fixLostPhases = async () => {
    setLoading(true);
    setMessage(null);
    setLogs([]);
    let count = 0;

    try {
      const querySnapshot = await getDocs(collection(db, "clients"));
      const batch = writeBatch(db);

      querySnapshot.forEach((document) => {
        const data = document.data();
        if (data.lostAtPhase && PHASE_MAPPING[data.lostAtPhase]) {
          const oldPhase = data.lostAtPhase;
          const newPhase = PHASE_MAPPING[oldPhase];
          const ref = doc(db, "clients", document.id);
          const updateData = { lostAtPhase: newPhase };
          if (data.status === 'closed-lost') {
            updateData.status = CLIENT_STATUS.CLOSED;
          }
          batch.update(ref, updateData);
          setLogs(prev => [...prev, `${data.name}: ${oldPhase} → ${newPhase}`]);
          count++;
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

  // 重複attendanceRecordsのクリーンアップ
  const cleanupDuplicateRecords = async () => {
    setLoading(true);
    setMessage(null);
    setLogs([]);
    let deletedCount = 0;

    try {
      // 全レコードを取得（createdAtで新しい順）
      const recordsQuery = query(collection(db, 'attendanceRecords'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(recordsQuery);

      // clientId + date の組み合わせで重複チェック
      const seen = {};
      const duplicates = [];

      snapshot.docs.forEach(docSnap => {
        const data = docSnap.data();
        if (data.clientId && data.date) {
          const dateStr = format(data.date.toDate(), 'yyyy-MM-dd');
          const key = `${data.clientId}_${dateStr}`;

          if (seen[key]) {
            // 重複！古いレコードを削除対象に
            duplicates.push({
              id: docSnap.id,
              clientId: data.clientId,
              clientName: data.clientName || '不明',
              dateStr,
              status: data.status,
            });
          } else {
            seen[key] = docSnap.id;
          }
        }
      });

      setLogs(prev => [...prev, `検出された重複: ${duplicates.length}件`]);

      // 削除実行
      for (const dup of duplicates) {
        await deleteDoc(doc(db, 'attendanceRecords', dup.id));
        setLogs(prev => [...prev, `削除: ${dup.clientName} (${dup.dateStr}) - ${dup.status}`]);
        deletedCount++;
      }

      if (deletedCount > 0) {
        setMessage(`完了: ${deletedCount}件の重複レコードを削除しました。`);
      } else {
        setMessage("重複レコードは見つかりませんでした。");
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

        {/* 重複レコード削除 */}
        <Box sx={{ my: 3, p: 2, bgcolor: 'rgba(239, 68, 68, 0.1)', borderRadius: 1, border: '1px solid #ef4444' }}>
          <Typography variant="subtitle1" fontWeight="bold" color="#ef4444" gutterBottom>
            🗑️ 重複attendanceRecords削除
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            同一利用者・同一日に複数のレコードがある場合、新しいものを残して古いものを削除します。
          </Typography>
          <Button
            variant="contained"
            color="error"
            onClick={cleanupDuplicateRecords}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : "重複レコードを検出・削除"}
          </Button>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* ロストフェーズ変換 */}
        <Box sx={{ my: 3, p: 2, bgcolor: 'rgba(139, 92, 246, 0.1)', borderRadius: 1, border: '1px solid #8b5cf6' }}>
          <Typography variant="subtitle1" fontWeight="bold" color="#8b5cf6" gutterBottom>
            🔄 ロストフェーズID変換
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            古いステータスID（lead-new等）を新しいID（inquiry等）に変換します。
          </Typography>
          <Button
            variant="contained"
            color="secondary"
            onClick={fixLostPhases}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : "旧ID→新ID変換実行"}
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