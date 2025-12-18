// src/pages/AdminCleanupPage.jsx

import { useState } from 'react';
import { Box, Button, Typography, CircularProgress, Alert } from '@mui/material';
import { collection, getDocs, doc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/firebase';

const AdminCleanupPage = () => {
  const [loading, setLoading] = useState(false);
  const [log, setLog] = useState([]);

  const cleanUpOrphans = async () => {
    if (!window.confirm('本当に実行しますか？ 親のいない「利用予定」データを削除します。')) return;
    
    setLoading(true);
    setLog([]);
    const logs = [];
    let deletedCount = 0;

    try {
      // 1. 全ての利用予定を取得
      logs.push('検索開始: attendancePlans をスキャン中...');
      const plansRef = collection(db, 'attendancePlans');
      const snapshot = await getDocs(plansRef);
      
      logs.push(`スキャン完了: ${snapshot.size} 件の予定が見つかりました。親の存在を確認します...`);

      // 2. 親がいるか確認
      for (const planDoc of snapshot.docs) {
        const data = planDoc.data();
        const clientId = data.clientId;

        if (!clientId) {
          logs.push(`⚠️ IDなし: ${planDoc.id} (clientIdがありません) -> 削除対象`);
          await deleteDoc(planDoc.ref);
          deletedCount++;
          continue;
        }

        // 親クライアントが存在するか確認
        const clientRef = doc(db, 'clients', clientId);
        const clientSnap = await getDoc(clientRef);

        if (!clientSnap.exists()) {
          logs.push(`🗑️ 削除: ${planDoc.id} (親 ${clientId} が見つかりません)`);
          await deleteDoc(planDoc.ref);
          deletedCount++;
        }
      }

      logs.push('-----------------------------------');
      logs.push(`完了: 合計 ${deletedCount} 件のゾンビデータを削除しました。`);
      
    } catch (error) {
      console.error(error);
      logs.push(`エラー発生: ${error.message}`);
    } finally {
      setLog(logs);
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom color="error">管理者用データ掃除ツール</Typography>
      <Alert severity="warning" sx={{ mb: 3 }}>
        注意: この操作は取り消せません。「親（利用者データ）」が削除されたのに残っている「利用予定」や「活動記録」を強制削除します。
      </Alert>
      
      <Button 
        variant="contained" 
        color="error" 
        onClick={cleanUpOrphans} 
        disabled={loading}
        size="large"
      >
        {loading ? <CircularProgress size={24} /> : 'ゾンビデータを検索して削除'}
      </Button>

      <Box sx={{ mt: 4, p: 2, bgcolor: '#000000ff', borderRadius: 1, maxHeight: '400px', overflow: 'auto', fontFamily: 'monospace' }}>
        {log.map((line, i) => (
          <div key={i}>{line}</div>
        ))}
      </Box>
    </Box>
  );
};

export default AdminCleanupPage;