// クライアント詳細画面内アセスメントパネル（1利用者1レコード）
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Button, Typography, Stack, CircularProgress,
  Alert, Dialog, DialogTitle, DialogContent,
  DialogContentText, DialogActions, TextField
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import PrintIcon from '@mui/icons-material/Print';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { useAssessment } from './hooks/useAssessment.js';
import { calcDueDate, daysUntilDue, getDueStatus } from './utils/dueDateCalculator.js';

const statusLabel = (days) => {
  if (days === null) return '';
  if (days < 0) return `期限超過（${Math.abs(days)}日）`;
  if (days === 0) return '本日期限';
  return `提出期限まで${days}日`;
};

export default function AssessmentListPanel({ clientId, clientName, serviceStartDate }) {
  const navigate = useNavigate();
  const { assessment, loading, createAssessment } = useAssessment(clientId);
  const [creating, setCreating] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [startDate, setStartDate] = useState(
    serviceStartDate
      ? (serviceStartDate?.toDate ? serviceStartDate.toDate() : new Date(serviceStartDate))
          .toISOString().split('T')[0]
      : ''
  );

  const dueStatus = getDueStatus(serviceStartDate);
  const days = daysUntilDue(serviceStartDate);
  const dueDate = calcDueDate(serviceStartDate);

  const handleCreate = async () => {
    setCreating(true);
    try {
      await createAssessment(clientName, startDate);
      setOpenDialog(false);
      navigate(`/clients/${clientId}/assessment`);
    } finally {
      setCreating(false);
    }
  };

  if (loading) return <CircularProgress size={24} />;

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h6" fontWeight="bold">フェイスシート・アセスメント</Typography>
      </Stack>

      {/* 提出期限アラート */}
      {serviceStartDate && dueStatus && (
        <Alert
          severity={dueStatus === 'ok' ? 'info' : dueStatus === 'warning' ? 'warning' : 'error'}
          icon={<WarningAmberIcon />}
          sx={{ mb: 2 }}
        >
          自治体提出期限：{dueDate?.toLocaleDateString('ja-JP')}　（{statusLabel(days)}）
        </Alert>
      )}

      {assessment ? (
        /* 既存レコードあり */
        <Box sx={{ border: '1px solid', borderColor: 'primary.main', borderRadius: 1, p: 3 }}>
          <Stack spacing={2}>
            <Typography variant="body2" color="text.secondary">
              最終更新：{assessment.updatedAt?.toDate
                ? assessment.updatedAt.toDate().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })
                : '-'}
            </Typography>
            <Stack direction="row" spacing={2}>
              <Button
                startIcon={<EditIcon />}
                variant="contained"
                onClick={() => navigate(`/clients/${clientId}/assessment`)}
              >
                編集・更新
              </Button>
              <Button
                startIcon={<PrintIcon />}
                variant="outlined"
                onClick={() => window.open(`/clients/${clientId}/assessment/print`, '_blank')}
              >
                印刷（自治体提出用）
              </Button>
            </Stack>
          </Stack>
        </Box>
      ) : (
        /* 未作成 */
        <Box sx={{ border: '2px dashed #ccc', borderRadius: 1, p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            まだアセスメントが作成されていません
          </Typography>
          <Button startIcon={<AddIcon />} variant="contained" onClick={() => setOpenDialog(true)}>
            アセスメントを新規作成
          </Button>
        </Box>
      )}

      {/* 新規作成ダイアログ */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>アセスメント新規作成</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            利用開始日を入力すると提出期限（2ヶ月2週間後）が自動計算されます。
          </DialogContentText>
          <TextField
            label="利用開始日"
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
          {startDate && (
            <Typography variant="body2" color="primary" sx={{ mt: 1 }}>
              提出期限：{calcDueDate(startDate)?.toLocaleDateString('ja-JP')}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>キャンセル</Button>
          <Button onClick={handleCreate} variant="contained" disabled={creating}>
            {creating ? '作成中...' : '作成して入力開始'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
