import { useState, useEffect, useMemo } from 'react'; // ★ 1. useMemo をインポート
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  TextField,    // ★ 2. UI部品をインポート
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Grid
} from '@mui/material';
import { db } from '@/firebase/index.js';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { subYears } from 'date-fns';

// 日本語翻訳マップ (変更なし)
const statusMap = {
  'lead-new': { label: '新規問合せ', color: 'primary' },
  'lead-consulting': { label: '相談・見学', color: 'info' },
  'lead-trial': { label: '体験利用', color: 'secondary' },
  'contract-prep': { label: '契約準備中', color: 'warning' },
  'client-active': { label: '利用中', color: 'success' },
  'closed-lost': { label: 'ロスト', color: 'error' },
  'completed': { label: '完了', color: 'default' },
};
const getStatusChip = (status) => {
  const statusInfo = statusMap[status] || { label: status, color: 'default' };
  return <Chip label={statusInfo.label} color={statusInfo.color} size="small" />;
};

function AllClientsListPage() {
  const [allClients, setAllClients] = useState([]); // ★ 3. Firestoreから取得した全データ保持用
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // ★ 4. フィルターの状態を管理する state
  const [statusFilter, setStatusFilter] = useState(''); // ステータスフィルター
  const [nameFilter, setNameFilter] = useState('');     // 名前検索フィルター

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const oneYearAgo = subYears(new Date(), 1);
        const clientsRef = collection(db, 'clients');
        const q = query(
          clientsRef,
          where('createdAt', '>=', oneYearAgo),
          orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const clientsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setAllClients(clientsData); // 取得したデータを保持

      } catch (error) {
        console.error("利用者データの取得に失敗しました:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchClients();
  }, []);

  const handleRowClick = (clientId) => {
    navigate(`/clients/${clientId}`);
  };

  // ★ 5. フィルターされたクライアントリストを計算する
  const filteredClients = useMemo(() => {
    let clients = [...allClients];

    // ステータスで絞り込み
    if (statusFilter) {
      clients = clients.filter(client => client.status === statusFilter);
    }

    // 名前で絞り込み (部分一致)
    if (nameFilter) {
      clients = clients.filter(client => 
        (client.name && client.name.includes(nameFilter)) || 
        (client.nameKana && client.nameKana.includes(nameFilter)) // カナでも検索
      );
    }

    return clients;
  }, [allClients, statusFilter, nameFilter]); // これらの値が変わった時だけ再計算


  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>利用者一覧</Typography>
      
      {/* ★ 6. フィルターUIのセクション */}
     {/* ★★★ あなたのアイデアを採用した、最強のテーブルレイアウト版 ★★★ */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '16px 0' }}>
          <tbody>
            <tr>
              {/* --- 1列目: 利用者名検索 --- */}
              <td style={{ width: '45%' }}>
                <TextField
                  fullWidth
                  label="利用者名で検索"
                  variant="outlined"
                  value={nameFilter}
                  onChange={(e) => setNameFilter(e.target.value)}
                />
              </td>

              {/* --- 2列目: ステータス絞り込み --- */}
              <td style={{ width: '45%' }}>
                <TextField
                  fullWidth
                  select
                  label="ステータスで絞り込み"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  variant="outlined"
                  InputLabelProps={{ shrink: true }} // ラベルは常に上に
                >
                  <MenuItem value=""><em>すべて</em></MenuItem>
                  {Object.entries(statusMap).map(([key, { label }]) => (
                    <MenuItem key={key} value={key}>{label}</MenuItem>
                  ))}
                </TextField>
              </td>

              {/* --- 3列目: クリアボタン --- */}
              <td style={{ width: '10%' }}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => {
                    setNameFilter('');
                    setStatusFilter('');
                  }}
                  sx={{ height: '56px' }}
                >
                  クリア
                </Button>
              </td>
            </tr>
          </tbody>
        </table>
      </Paper>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {filteredClients.length} 件の利用者情報が見つかりました。
      </Typography>
      
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="user list table">
          <TableHead>{/* ... 変更なし ... */}</TableHead>
          <TableBody>
            {/* ★ 7. 表示するデータを filteredClients に変更 */}
            {filteredClients.map((client) => (
              <TableRow
                key={client.id}
                hover
                onClick={() => handleRowClick(client.id)}
                sx={{ cursor: 'pointer' }}
              >
                <TableCell component="th" scope="row">{client.name}</TableCell>
                <TableCell>{getStatusChip(client.status)}</TableCell>
                <TableCell>
                  {client.status === 'closed-lost' ? (
                    `[${statusMap[client.lostAtPhase]?.label || client.lostAtPhase}] ${client.lostReason || ''}`
                  ) : ( '—' )}
                </TableCell>
                <TableCell>{client.createdAt?.toDate().toLocaleDateString() || '不明'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

export default AllClientsListPage;