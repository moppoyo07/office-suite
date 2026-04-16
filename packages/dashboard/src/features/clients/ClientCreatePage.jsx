// ClientCreatePage.jsx

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Paper, Typography, TextField, Button, Box, Grid, Alert, Chip, Stack, FormControlLabel, Checkbox } from '@mui/material';
import { collection, addDoc, getDocs, doc, updateDoc, query, where, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebase/index.js";
import { useAuth } from '../auth/context/AuthContext';
import ReplayIcon from '@mui/icons-material/Replay';

const STATUS_LABELS = {
  inquiry: '問合せ', tour: '見学', trial: '体験', active_onsite: '施設内利用',
  active_offsite: '施設外利用', retention: '定着支援', closed: 'ロスト',
};

// スペース・全角半角を無視して比較用の正規化文字列を作る
const normalizeName = (name) => (name || '').replace(/[\s\u3000]/g, '').toLowerCase();

function ClientCreatePage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [allClients, setAllClients] = useState([]);
  const [isFamily, setIsFamily] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    nameKana: '',
    phone: '',
    note: '',
    status: 'inquiry',
  });

  // 既存クライアント一覧を取得（重複チェック用）
  useEffect(() => {
    if (!currentUser?.companyId) return;
    const fetch = async () => {
      try {
        const q = query(collection(db, 'clients'), where('companyId', '==', currentUser.companyId));
        const snap = await getDocs(q);
        setAllClients(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) {
        console.error('クライアント取得エラー:', e);
      }
    };
    fetch();
  }, [currentUser?.companyId]);

  // 名前の重複チェック（スペース無視）
  const duplicates = useMemo(() => {
    const input = normalizeName(formData.name);
    if (!input || input.length < 2) return [];
    return allClients.filter(c => normalizeName(c.name) === input);
  }, [formData.name, allClients]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // 再申込みとして復活
  const handleReactivate = async (client) => {
    if (!window.confirm(`${client.name} を再申込み（問合せ）として復活しますか？`)) return;
    setLoading(true);
    try {
      const clientRef = doc(db, 'clients', client.id);
      await updateDoc(clientRef, {
        status: 'inquiry',
        contactAttempts: 0,
        nextContactDate: null,
        lostAtPhase: null,
        lostReason: null,
        inquiryDate: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // 活動記録に再申込みを記録
      const staffName = currentUser?.staffName || currentUser?.displayName || '担当職員';
      await addDoc(collection(db, 'clients', client.id, 'activity_logs'), {
        type: 'inquiry',
        content: '再申込み（以前ロスト→復活）',
        clientName: client.name,
        staffUid: currentUser?.uid || 'unknown',
        staffName,
        companyId: currentUser?.companyId || null,
        createdAt: serverTimestamp(),
      });

      alert(`${client.name} を再申込みとして復活しました`);
      navigate(`/clients/${client.id}`);
    } catch (e) {
      console.error('復活エラー:', e);
      alert('復活に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('氏名を入力してください。');
      return;
    }
    setLoading(true);
    try {
      // 保存するデータを作成
      const dataToSave = {
        ...formData,
        status: isFamily ? 'family' : 'inquiry',
        companyId: currentUser?.companyId || null,
        branchId: currentUser?.branchId || null,
        ...(!isFamily && { inquiryDate: serverTimestamp() }),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Firestoreの "clients" コレクションに新しいドキュメントを追加
      const docRef = await addDoc(collection(db, "clients"), dataToSave);

      console.log("新しい利用者を登録しました。ドキュメントID:", docRef.id);
      // 関係者以外は詳細画面へ遷移し、問合せテンプレ付きで記録ダイアログを自動起動
      if (isFamily) {
        alert('関係者として登録しました。');
        navigate('/clients');
      } else {
        navigate(`/clients/${docRef.id}?newLog=inquiry`);
      }

    } catch (error) {
      console.error("登録エラー:", error);
      alert("登録に失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        新規利用者の登録
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        最初の問い合わせ内容（氏名・電話番号など）を登録します。詳細は見学アンケートやフェイスシートで入力します。
      </Typography>

      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              name="name"
              label="氏名"
              variant="outlined"
              fullWidth
              required
              value={formData.name}
              onChange={handleChange}
            />
          </Grid>
          {/* 重複警告 */}
          {duplicates.length > 0 && (
            <Grid size={{ xs: 12 }}>
              <Alert
                severity="warning"
                sx={{
                  bgcolor: 'rgba(245,158,11,0.1)',
                  border: '1px solid rgba(245,158,11,0.4)',
                  '& .MuiAlert-message': { width: '100%' },
                }}
              >
                <Typography sx={{ fontWeight: 'bold', mb: 1 }}>
                  この方は以前に登録があります
                </Typography>
                {duplicates.map(c => (
                  <Stack key={c.id} direction="row" alignItems="center" spacing={1.5} sx={{ mb: 0.5, flexWrap: 'wrap' }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{c.name}</Typography>
                    <Chip
                      label={STATUS_LABELS[c.status] || c.status}
                      size="small"
                      color={c.status === 'closed' ? 'error' : 'default'}
                      sx={{ fontSize: '0.7rem' }}
                    />
                    {c.phone && <Typography variant="caption" sx={{ color: 'text.secondary' }}>{c.phone}</Typography>}
                    <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
                      {c.status === 'closed' && (
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          startIcon={<ReplayIcon />}
                          onClick={() => handleReactivate(c)}
                          disabled={loading}
                          sx={{ fontSize: '0.7rem' }}
                        >
                          再申込みとして復活
                        </Button>
                      )}
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => navigate(`/clients/${c.id}`)}
                        sx={{ fontSize: '0.7rem' }}
                      >
                        詳細を見る
                      </Button>
                    </Box>
                  </Stack>
                ))}
              </Alert>
            </Grid>
          )}

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              name="nameKana"
              label="氏名（フリガナ）"
              variant="outlined"
              fullWidth
              value={formData.nameKana}
              onChange={handleChange}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              name="phone"
              label="電話番号"
              type="tel"
              variant="outlined"
              fullWidth
              value={formData.phone}
              onChange={handleChange}
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={isFamily}
                  onChange={(e) => setIsFamily(e.target.checked)}
                  sx={{ color: '#00838f', '&.Mui-checked': { color: '#00838f' } }}
                />
              }
              label={
                <Typography variant="body2">
                  関係者として登録（家族等 — CRM・追客の対象外）
                </Typography>
              }
            />
          </Grid>

          {isFamily && (
            <Grid size={{ xs: 12 }}>
              <TextField
                name="note"
                label="関係者メモ（例：○○さんの母）"
                variant="outlined"
                fullWidth
                value={formData.note}
                onChange={handleChange}
              />
            </Grid>
          )}
        </Grid>
        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={loading}
          sx={{ mt: 3 }}
        >
          {loading ? '登録中...' : 'この内容で登録する'}
        </Button>
      </Box>
    </Paper>
  );
}

export default ClientCreatePage;