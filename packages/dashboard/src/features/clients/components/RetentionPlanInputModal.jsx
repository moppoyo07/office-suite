// src/features/clients/components/RetentionPlanInputModal.jsx
// 定着支援計画書 入力モーダル（就職確定直後に表示）

import { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Stack, TextField, Typography, Divider,
  MenuItem
} from '@mui/material';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../firebase';

const WORK_STYLES = [
  '正社員（フルタイム）',
  '正社員（短時間）',
  'パートタイム',
  'アルバイト',
  '契約社員',
  '派遣',
  'その他',
];

const emptyForm = () => ({
  workStyle: '',
  workHours: '',
  workDays: '',
  salary: '',
  jobDescription: '',
  workplaceEnvironment: '',
  retentionGoalLong: '',
  retentionGoalShort: '',
  supportItem1: '職場適応支援',
  supportContent1: '',
  supportItem2: '生活安定支援',
  supportContent2: '',
  supportItem3: '関係機関連携',
  supportContent3: '',
});

export default function RetentionPlanInputModal({ open, onClose, onSubmit, clientId, clientName }) {
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setForm(emptyForm());
  }, [open]);

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateDoc(doc(db, 'clients', clientId), {
        ...form,
        updatedAt: serverTimestamp(),
      });
      onSubmit?.();
    } catch (e) {
      console.error('計画書保存エラー:', e);
      alert('保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth
      PaperProps={{ sx: { maxHeight: '90vh' } }}
    >
      <DialogTitle>
        定着支援計画書の作成
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {clientName} 様 ／ 後から印刷・修正できます
        </Typography>
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2.5}>

          {/* 就職先勤務条件 */}
          <Typography variant="subtitle2" color="primary" fontWeight="bold">
            ■ 勤務条件
          </Typography>
          <Stack direction="row" spacing={2}>
            <TextField
              select label="勤務形態" value={form.workStyle}
              onChange={set('workStyle')} size="small" sx={{ minWidth: 180 }}
            >
              <MenuItem value=""><em>未選択</em></MenuItem>
              {WORK_STYLES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </TextField>
            <TextField
              label="勤務時間" value={form.workHours}
              onChange={set('workHours')} size="small" fullWidth
              placeholder="例：9:00〜16:00"
            />
          </Stack>
          <Stack direction="row" spacing={2}>
            <TextField
              label="勤務日数" value={form.workDays}
              onChange={set('workDays')} size="small" fullWidth
              placeholder="例：週3日〜5日"
            />
            <TextField
              label="給与・賃金" value={form.salary}
              onChange={set('salary')} size="small" fullWidth
              placeholder="例：時給1,000円"
            />
          </Stack>
          <TextField
            label="職種・業務内容" value={form.jobDescription}
            onChange={set('jobDescription')} size="small" fullWidth
            placeholder="例：データ入力、書類整理、受付補助"
          />
          <TextField
            label="職場環境・特記事項" value={form.workplaceEnvironment}
            onChange={set('workplaceEnvironment')} size="small" fullWidth
            multiline rows={2}
            placeholder="例：少人数の職場。上司が障害に理解があり配慮が得られやすい環境"
          />

          <Divider />

          {/* 定着支援目標 */}
          <Typography variant="subtitle2" color="primary" fontWeight="bold">
            ■ 定着支援の目標
          </Typography>
          <TextField
            label="長期目標（6ヶ月）" value={form.retentionGoalLong}
            onChange={set('retentionGoalLong')} size="small" fullWidth
            multiline rows={2}
            placeholder="例：職場環境に慣れ、自己管理できる状態で安定した就労を継続する"
          />
          <TextField
            label="短期目標（1ヶ月）" value={form.retentionGoalShort}
            onChange={set('retentionGoalShort')} size="small" fullWidth
            multiline rows={2}
            placeholder="例：職場でのルーティン業務を習得し、毎日定時に出勤できるようにする"
          />

          <Divider />

          {/* 支援内容 */}
          <Typography variant="subtitle2" color="primary" fontWeight="bold">
            ■ 具体的な支援内容
          </Typography>

          {[1, 2, 3].map(n => (
            <Stack key={n} spacing={1}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="body2" fontWeight="bold" sx={{ minWidth: 24 }}>
                  {'①②③'[n - 1]}
                </Typography>
                <TextField
                  label="支援項目" value={form[`supportItem${n}`]}
                  onChange={set(`supportItem${n}`)} size="small" sx={{ width: 200 }}
                />
              </Stack>
              <TextField
                label="支援内容・方法" value={form[`supportContent${n}`]}
                onChange={set(`supportContent${n}`)} size="small" fullWidth
                multiline rows={2}
                placeholder={
                  n === 1 ? '例：週1回の定期面談で業務上の困りごとを確認。必要時は上司への橋渡しを行う' :
                  n === 2 ? '例：生活リズム・体調の自己記録を月1回確認し、生活安定のアドバイスを行う' :
                  '例：相談支援専門員・主治医と月1回情報共有を行い、連携して支援にあたる'
                }
              />
            </Stack>
          ))}

        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleSkip} color="inherit">後で記入する</Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={saving}
        >
          {saving ? '保存中...' : '計画書を保存'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
