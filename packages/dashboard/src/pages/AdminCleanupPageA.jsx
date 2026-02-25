// src/pages/AdminCleanupPage.jsx (ステータス移行ツール版)

import { useState } from 'react';
import { Box, Button, Typography, CircularProgress, Alert, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { collection, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase';

// 古いステータス → 新しいステータス の変換ルール
const STATUS_MAPPING = {
  'lead-new': { status: 'inquiry' },
  'lead-consulting': { status: 'interview' },
  'lead-trial': { status: 'interview' }, // 体験も「見学・面談」フェーズに統合（または分けたい場合は定義追加）
  'contract-prep': { status: 'interview' },
  'client-active': { status: 'active_onsite' },
  'closed-lost': { status: 'closed', lostReason: 'other' }, // ロストは一律「終了(その他)」にして、後で手動修正
  'completed': { status: 'completed' },
  // 既に新しい形式のものは変換しない
};

const AdminCleanupPage = () => {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);

  const migrateStatus = async () => {
    if (!window.confirm('実行しますか？ 全利用者のステータスを新形式に変換します。')) return;
    
    setLoading(true);
    setLogs([]);
    const newLogs = [];
    let updateCount = 0;

    try {
      newLogs.push('--- スキャン開始 ---');
      const snapshot = await getDocs(collection(db, 'clients'));
      
      for (const clientDoc of snapshot.docs) {
        const data = clientDoc.data();
        const oldStatus = data.status;
        
        // 変換ルールにあるかチェック
        if (STATUS_MAPPING[oldStatus]) {
          const newStatusData = STATUS_MAPPING[oldStatus];
          
          // 更新処理
          await updateDoc(clientDoc.ref, {
            ...newStatusData,
            // 元のステータスも念のためバックアップとして残す
            legacyStatus: oldStatus,
            updatedAt: serverTimestamp(),
          });

          newLogs.push({
            id: clientDoc.id,
            name: data.name || '名称未設定',
            old: oldStatus,
            new: newStatusData.status
          });
          updateCount++;
        }
      }
      
      newLogs.push({ id: 'summary', name: '--- 完了 ---', old: '-', new: `合計 ${updateCount} 件更新` });

    } catch (error) {
      console.error(error);
      alert(`エラー発生: ${error.message}`);
    } finally {
      setLogs(newLogs);
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>データ移行ツール (Status Migration)</Typography>
      <Alert severity="info" sx={{ mb: 3 }}>
        古いステータス形式 (例: lead-new) を、新しい形式 (例: inquiry) に一括変換します。<br/>
        変換後、元のステータスは "legacyStatus" フィールドにバックアップされます。
      </Alert>
      
      <Button 
        variant="contained" 
        color="primary" 
        onClick={migrateStatus} 
        disabled={loading}
        size="large"
      >
        {loading ? <CircularProgress size={24} /> : '変換を実行する'}
      </Button>

      {logs.length > 0 && (
        <TableContainer component={Paper} sx={{ mt: 4, maxHeight: 500 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>氏名</TableCell>
                <TableCell>旧ステータス</TableCell>
                <TableCell>新ステータス</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {logs.map((log, i) => (
                <TableRow key={i}>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{log.id}</TableCell>
                  <TableCell>{log.name}</TableCell>
                  <TableCell sx={{ color: 'text.secondary' }}>{log.old}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: 'primary.main' }}>{log.new}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default AdminCleanupPageA;