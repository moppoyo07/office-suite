// 卒業・退所モーダル（3択：就職 / 就職無し卒業 / 利用中退所）
import { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Stack, TextField, Radio, RadioGroup,
  FormControlLabel, FormControl, FormLabel, MenuItem, Typography
} from '@mui/material';

const WITHDRAWAL_REASONS = [
  { value: 'health',      label: '体調不良' },
  { value: 'distance',    label: '通所困難' },
  { value: 'transferred', label: '他事業所へ移行' },
  { value: 'family',      label: '家族の事情' },
  { value: 'employed',    label: '就職・転職' },
  { value: 'expired',     label: '期間満了' },
  { value: 'other',       label: 'その他' },
];

export default function EmploymentInfoModal({ open, onClose, onSubmit }) {
  const [type, setType] = useState('employment');
  const [date, setDate] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');

  useEffect(() => {
    if (open) {
      setType('employment');
      setDate('');
      setCompanyName('');
      setReason('');
      setDetails('');
    }
  }, [open]);

  const canSubmit = () => {
    if (!date) return false;
    if (type === 'employment' && !companyName.trim()) return false;
    if (type === 'withdrawal' && !reason) return false;
    return true;
  };

  const handleSubmit = () => {
    if (!canSubmit()) return;
    onSubmit({ type, date, companyName: companyName.trim(), reason, details });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>卒業・退所の処理</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>

          {/* 区分選択 */}
          <FormControl>
            <FormLabel sx={{ mb: 1 }}>区分</FormLabel>
            <RadioGroup value={type} onChange={e => setType(e.target.value)}>
              <FormControlLabel value="employment"     control={<Radio />} label="就職（定着支援へ移行）" />
              <FormControlLabel value="graduated_no_job" control={<Radio />} label="就職無し卒業（期間満了など）" />
              <FormControlLabel value="withdrawal"    control={<Radio />} label="利用中退所" />
            </RadioGroup>
          </FormControl>

          {/* 日付 */}
          <TextField
            label={
              type === 'employment'      ? '就職日' :
              type === 'graduated_no_job'? '卒業日' : '退所日'
            }
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            fullWidth
            required
            InputLabelProps={{ shrink: true }}
          />

          {/* 就職：会社名 */}
          {type === 'employment' && (
            <TextField
              label="就職先企業名"
              value={companyName}
              onChange={e => setCompanyName(e.target.value)}
              fullWidth
              required
              autoFocus
            />
          )}

          {/* 就職無し卒業：詳細メモ */}
          {type === 'graduated_no_job' && (
            <TextField
              label="備考（任意）"
              value={details}
              onChange={e => setDetails(e.target.value)}
              fullWidth
              multiline
              rows={2}
              placeholder="例：期間満了、進学のため など"
            />
          )}

          {/* 利用中退所：理由（必須）+ 詳細 */}
          {type === 'withdrawal' && (
            <>
              <TextField
                select
                label="退所理由"
                value={reason}
                onChange={e => setReason(e.target.value)}
                fullWidth
                required
              >
                {WITHDRAWAL_REASONS.map(r => (
                  <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>
                ))}
              </TextField>
              <TextField
                label="詳細・備考（任意）"
                value={details}
                onChange={e => setDetails(e.target.value)}
                fullWidth
                multiline
                rows={2}
              />
            </>
          )}

          {/* 就職後の案内 */}
          {type === 'employment' && date && companyName && (
            <Typography variant="body2" color="primary" sx={{ p: 1.5, bgcolor: 'primary.50', borderRadius: 1 }}>
              就職決定後、定着支援計画書の作成を忘れずに行ってください。
            </Typography>
          )}

        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">キャンセル</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!canSubmit()}
          color={type === 'withdrawal' ? 'error' : 'primary'}
        >
          {type === 'employment'       ? '就職確定・定着支援へ' :
           type === 'graduated_no_job' ? '卒業確定' : '退所処理'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
