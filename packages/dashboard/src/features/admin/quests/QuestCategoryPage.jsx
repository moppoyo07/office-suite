// src/features/admin/quests/QuestCategoryPage.jsx
// クエストカテゴリ管理ページ
// - branch_staff: カテゴリの追加のみ（ポイント設定・削除・有効無効切替不可）
// - branch_manager: カテゴリの追加・編集・削除・有効無効切替・ポイント設定
// - company_admin / platform_owner: 全操作可能

import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Button, IconButton, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Switch, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Stack, Tooltip, CircularProgress, Divider, Alert
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import StarIcon from '@mui/icons-material/Star';
import DownloadingIcon from '@mui/icons-material/Downloading';
import {
  collection, query, where, getDocs, addDoc, updateDoc, deleteDoc,
  doc, serverTimestamp, setDoc
} from 'firebase/firestore';
import { db } from '../../../firebase';
import { useCurrentUser } from '../../../hooks/useCurrentUser';

// 支店管理者以上がポイント設定可能
const POINT_ADMIN_ROLES = ['platform_owner', 'company_admin', 'branch_manager'];

// デフォルトカテゴリ（シード用）
// ※面談・見学・体験・追客・質疑は活動ログで記録するためクエスト対象外
const DEFAULT_CATEGORIES = [
  { label: 'ウォーターサーバー水補給',   description: '事業所内の水補給',              defaultPoints: 10  },
  { label: '事務所内の掃除機がけ',       description: '事業所内の清掃作業',            defaultPoints: 15  },
  { label: '自治体メールチェック',       description: '行政からのメール確認',          defaultPoints: 5   },
  { label: 'ブログ更新',               description: '公式ブログへの投稿',            defaultPoints: 30  },
  { label: '講座実施',                 description: '利用者向け講座・プログラムの実施', defaultPoints: 20  },
  { label: 'Twitter（X）投稿',         description: '公式アカウントへの投稿',         defaultPoints: 10  },
  { label: 'Instagram投稿',           description: '公式インスタグラム投稿',         defaultPoints: 10  },
  { label: 'TikTok投稿',              description: '公式TikTok投稿',               defaultPoints: 15  },
  { label: '利用者向け前日連絡',        description: '翌日出席確認の前日連絡',        defaultPoints: 5   },
];

const emptyForm = { label: '', description: '', points: 10 };

export default function QuestCategoryPage() {
  const { profile, role, loading: userLoading } = useCurrentUser();
  const canEditPoints = POINT_ADMIN_ROLES.includes(role);
  // スタッフはカテゴリ追加のみ（削除・有効無効切替・デフォルト追加は支店管理者以上）
  const canManage = POINT_ADMIN_ROLES.includes(role);

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // ダイアログ
  const [dialog, setDialog] = useState({ open: false, mode: 'add', target: null });
  const [form, setForm] = useState(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, target: null });

  const companyId = profile?.companyId;
  const branchId  = profile?.branchId;

  // カテゴリ一覧取得
  const fetchCategories = useCallback(async () => {
    if (!companyId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const q = query(
        collection(db, 'questCategories'),
        where('companyId', '==', companyId)
      );
      const snap = await getDocs(q);
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // createdAt でクライアント側ソート（複合インデックス不要）
      docs.sort((a, b) => {
        const ta = a.createdAt?.toMillis?.() ?? 0;
        const tb = b.createdAt?.toMillis?.() ?? 0;
        return ta - tb;
      });
      setCategories(docs);
    } catch (e) {
      console.error('カテゴリ取得エラー:', e);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    if (!userLoading) fetchCategories();
  }, [userLoading, fetchCategories]);

  // ダイアログを開く（追加）
  const openAdd = () => {
    setForm(emptyForm);
    setDialog({ open: true, mode: 'add', target: null });
  };

  // ダイアログを開く（編集）
  const openEdit = (cat) => {
    setForm({ label: cat.label, description: cat.description || '', points: cat.points ?? 10 });
    setDialog({ open: true, mode: 'edit', target: cat });
  };

  const closeDialog = () => setDialog({ open: false, mode: 'add', target: null });

  // 保存（追加 or 編集）
  const handleSave = async () => {
    if (!form.label.trim()) return;
    setSaving(true);
    try {
      const base = {
        label: form.label.trim(),
        description: form.description.trim(),
        points: canEditPoints ? Number(form.points) || 0 : (dialog.target?.points ?? 0),
        companyId,
        branchId: branchId || null,
        isActive: true,
        updatedAt: serverTimestamp(),
      };

      if (dialog.mode === 'add') {
        await addDoc(collection(db, 'questCategories'), {
          ...base,
          createdBy: profile?.uid || '',
          createdByName: profile?.displayName || '',
          createdByRole: role,
          createdAt: serverTimestamp(),
        });
      } else {
        await updateDoc(doc(db, 'questCategories', dialog.target.id), base);
      }
      closeDialog();
      await fetchCategories();
    } catch (e) {
      console.error('保存エラー:', e);
      alert('保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  // アクティブ切り替え
  const handleToggleActive = async (cat) => {
    try {
      await updateDoc(doc(db, 'questCategories', cat.id), {
        isActive: !cat.isActive,
        updatedAt: serverTimestamp(),
      });
      setCategories(prev => prev.map(c => c.id === cat.id ? { ...c, isActive: !c.isActive } : c));
    } catch (e) {
      console.error('切り替えエラー:', e);
    }
  };

  // 削除
  const handleDelete = async () => {
    if (!deleteConfirm.target) return;
    try {
      await deleteDoc(doc(db, 'questCategories', deleteConfirm.target.id));
      setCategories(prev => prev.filter(c => c.id !== deleteConfirm.target.id));
    } catch (e) {
      console.error('削除エラー:', e);
    } finally {
      setDeleteConfirm({ open: false, target: null });
    }
  };

  // デフォルトカテゴリを一括追加
  const handleSeedDefaults = async () => {
    if (!companyId) return;
    if (!window.confirm(`デフォルトカテゴリ（${DEFAULT_CATEGORIES.length}件）を追加します。\n既存と重複するものも追加されます。よろしいですか？`)) return;
    setSaving(true);
    try {
      for (const cat of DEFAULT_CATEGORIES) {
        await addDoc(collection(db, 'questCategories'), {
          label: cat.label,
          description: cat.description,
          points: canEditPoints ? cat.defaultPoints : 0,
          companyId,
          branchId: branchId || null,
          isActive: true,
          createdBy: profile?.uid || '',
          createdByName: profile?.displayName || '',
          createdByRole: role,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      await fetchCategories();
    } catch (e) {
      console.error('シードエラー:', e);
      alert('一括追加に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  if (userLoading || loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}><CircularProgress /></Box>;
  }

  if (!companyId) {
    return <CompanyIdSetup uid={profile?.uid || profile?.id} />;
  }

  const activeCount   = categories.filter(c => c.isActive).length;
  const inactiveCount = categories.filter(c => !c.isActive).length;

  return (
    <Box>
      {/* ページヘッダー */}
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={3}>
        <Box>
          <Typography variant="h5" fontWeight="bold" color="#fff">
            クエストカテゴリ管理
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            {canEditPoints
              ? 'カテゴリの追加・編集とポイント設定ができます'
              : '活動カテゴリを追加できます（ポイント設定は支店管理者以上が行います）'}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          {categories.length === 0 && canManage && (
            <Button
              variant="outlined"
              startIcon={<DownloadingIcon />}
              onClick={handleSeedDefaults}
              disabled={saving}
              sx={{ borderColor: 'rgba(6,182,212,0.5)', color: '#06b6d4' }}
            >
              デフォルトを追加
            </Button>
          )}
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={openAdd}
            sx={{ bgcolor: '#8b5cf6', '&:hover': { bgcolor: '#7c3aed' } }}
          >
            カテゴリを追加
          </Button>
        </Stack>
      </Stack>

      {/* 集計バッジ */}
      <Stack direction="row" spacing={2} mb={2}>
        <Chip label={`有効: ${activeCount}件`} color="success" size="small" variant="outlined" />
        <Chip label={`無効: ${inactiveCount}件`} color="default" size="small" variant="outlined" />
        {!canEditPoints && (
          <Alert severity="info" sx={{ py: 0, px: 1.5, fontSize: '0.75rem' }}>
            ポイント数は支店管理者以上が設定します。未設定のカテゴリは 0pt と表示されます。
          </Alert>
        )}
      </Stack>

      {/* カテゴリテーブル */}
      <TableContainer component={Paper} sx={{ bgcolor: '#1e293b', border: '1px solid rgba(6,182,212,0.2)' }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ '& th': { bgcolor: 'rgba(6,182,212,0.1)', color: '#94a3b8', fontWeight: 'bold', borderColor: 'rgba(255,255,255,0.1)' } }}>
              <TableCell>カテゴリ名</TableCell>
              <TableCell>説明</TableCell>
              {canEditPoints && <TableCell align="center" sx={{ width: 100 }}>ポイント</TableCell>}
              {!canEditPoints && <TableCell align="center" sx={{ width: 100 }}>ポイント</TableCell>}
              <TableCell align="center" sx={{ width: 80 }}>有効</TableCell>
              <TableCell align="center" sx={{ width: 100 }}>操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {categories.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ color: '#64748b', py: 6, borderColor: 'rgba(255,255,255,0.1)' }}>
                  カテゴリがありません。「デフォルトを追加」または「カテゴリを追加」から登録してください。
                </TableCell>
              </TableRow>
            )}
            {categories.map(cat => (
              <TableRow key={cat.id} sx={{ opacity: cat.isActive ? 1 : 0.5, '& td': { borderColor: 'rgba(255,255,255,0.07)', color: '#e2e8f0' } }}>
                <TableCell>
                  <Typography variant="body2" fontWeight={500}>{cat.label}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="caption" color="text.secondary">{cat.description || '—'}</Typography>
                </TableCell>
                <TableCell align="center">
                  {canEditPoints ? (
                    <Chip
                      icon={<StarIcon sx={{ fontSize: 14 }} />}
                      label={`${cat.points ?? 0} pt`}
                      size="small"
                      sx={{ bgcolor: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)' }}
                    />
                  ) : (
                    <Typography variant="caption" color="text.secondary">
                      {cat.points > 0 ? `${cat.points} pt` : '未設定'}
                    </Typography>
                  )}
                </TableCell>
                <TableCell align="center">
                  {canManage ? (
                    <Switch
                      checked={cat.isActive}
                      onChange={() => handleToggleActive(cat)}
                      size="small"
                      color="success"
                    />
                  ) : (
                    <Chip
                      label={cat.isActive ? '有効' : '無効'}
                      size="small"
                      color={cat.isActive ? 'success' : 'default'}
                      variant="outlined"
                      sx={{ fontSize: '0.7rem' }}
                    />
                  )}
                </TableCell>
                <TableCell align="center">
                  <Stack direction="row" spacing={0.5} justifyContent="center">
                    <Tooltip title="編集">
                      <IconButton size="small" onClick={() => openEdit(cat)} sx={{ color: '#06b6d4' }}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {canManage && (
                      <Tooltip title="削除">
                        <IconButton size="small" onClick={() => setDeleteConfirm({ open: true, target: cat })} sx={{ color: '#ef4444' }}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 追加・編集ダイアログ */}
      <Dialog open={dialog.open} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {dialog.mode === 'add' ? 'カテゴリを追加' : 'カテゴリを編集'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="カテゴリ名"
              value={form.label}
              onChange={e => setForm(p => ({ ...p, label: e.target.value }))}
              fullWidth
              required
              autoFocus
              placeholder="例：Instagram投稿、見学対応、追客電話"
            />
            <TextField
              label="説明（任意）"
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              fullWidth
              multiline
              rows={2}
              placeholder="例：公式インスタグラムへの投稿業務"
            />
            {canEditPoints ? (
              <TextField
                label="ポイント数"
                type="number"
                value={form.points}
                onChange={e => setForm(p => ({ ...p, points: e.target.value }))}
                fullWidth
                inputProps={{ min: 0, max: 999 }}
                helperText="スタッフがこのクエストを完了したときに得るポイント"
              />
            ) : (
              <Alert severity="info" sx={{ fontSize: '0.8rem' }}>
                ポイント数は支店管理者以上が設定します。追加後にご連絡ください。
              </Alert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog} color="inherit">キャンセル</Button>
          <Button onClick={handleSave} variant="contained" disabled={saving || !form.label.trim()}>
            {saving ? '保存中...' : '保存'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 削除確認ダイアログ */}
      <Dialog open={deleteConfirm.open} onClose={() => setDeleteConfirm({ open: false, target: null })} maxWidth="xs">
        <DialogTitle>カテゴリを削除</DialogTitle>
        <DialogContent>
          <Typography>
            「{deleteConfirm.target?.label}」を削除しますか？<br />
            <Typography component="span" variant="caption" color="error">
              この操作は取り消せません。過去のクエスト完了データは残ります。
            </Typography>
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm({ open: false, target: null })} color="inherit">キャンセル</Button>
          <Button onClick={handleDelete} variant="contained" color="error">削除</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// 会社IDが未設定のオーナー向けセットアップ画面
function CompanyIdSetup({ uid }) {
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    const trimmed = value.trim();
    if (!trimmed) { setError('会社IDを入力してください'); return; }
    if (!uid) { setError('ユーザー情報が取得できません。再ログインしてください'); return; }
    setSaving(true);
    try {
      await setDoc(doc(db, 'users', uid), { companyId: trimmed }, { merge: true });
      // onSnapshot が反応してページが再レンダリングされる
    } catch (e) {
      console.error('companyId保存エラー:', e);
      setError('保存に失敗しました: ' + e.message);
      setSaving(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 480, mx: 'auto', mt: 8, p: 4 }}>
      <Typography variant="h6" fontWeight="bold" color="#fff" mb={1}>
        会社IDの初期設定
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        このアカウントにはまだ会社IDが設定されていません。<br />
        クエスト管理に使う会社IDを入力してください。<br />
        （英数字・ハイフン推奨。例: my-company）
      </Typography>
      <Stack spacing={2}>
        <TextField
          label="会社ID"
          value={value}
          onChange={e => { setValue(e.target.value); setError(''); }}
          placeholder="例: my-company-001"
          fullWidth
          error={!!error}
          helperText={error}
          autoFocus
        />
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving || !value.trim()}
          sx={{ bgcolor: '#8b5cf6', '&:hover': { bgcolor: '#7c3aed' } }}
        >
          {saving ? '保存中...' : '設定して開始'}
        </Button>
      </Stack>
    </Box>
  );
}
