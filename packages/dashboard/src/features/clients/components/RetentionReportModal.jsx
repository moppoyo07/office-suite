// src/features/clients/components/RetentionReportModal.jsx
// 定着支援レポート 入力モーダル（→矢印で翌月移動時に表示）

import { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Stack, TextField, Typography, Divider,
  MenuItem, Select, FormControl, InputLabel, Box
} from '@mui/material';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../firebase';

const VISIT_PLACES = ['事業所', '職場', 'オンライン', '自宅', 'その他'];
const VISIT_METHODS = ['面談', '電話', 'メール', '訪問', 'その他'];

const MONTH_LABELS = { 1: '1ヶ月目', 2: '2ヶ月目', 3: '3ヶ月目', 4: '4ヶ月目', 5: '5ヶ月目' };
const GOAL_PLACEHOLDERS = [
  '例：職場内コミュニケーションを安定させる',
  '例：体調管理リズムを定着させる',
  '例：定期的な相談窓口を活用できる',
];
const IMPL_PLACEHOLDERS = [
  '例：上司との面談に同席し、本人の意向を伝達した',
  '例：睡眠・食事記録の確認と生活リズム調整のアドバイスを実施した',
  '例：相談支援事業所との情報共有を月1回実施した',
];
const RESULT_PLACEHOLDERS = [
  '例：職場での孤立感が軽減。自発的に質問できるようになってきた',
  '例：睡眠時間が安定し、遅刻が0件に減少した',
  '例：相談支援員との連携がスムーズになり安心感が増した',
];

const emptyForm = () => ({
  visit1Date: '', visit1Place: '', visit1Method: '',
  visit2Date: '', visit2Place: '', visit2Method: '',
  visit3Date: '', visit3Place: '', visit3Method: '',
  goal1: '', goal2: '', goal3: '',
  impl1: '', impl2: '', impl3: '',
  result1: '', result2: '', result3: '',
  futureDirection: '',
  clientAction: '',
  employerAction: '',
  sharedItems: '',
  nextGoal: '',
  staffName: '',
});

// 対象月キー生成: follow-up-m2 → 今年の現在月
const toMonthKey = () => {
  const now = new Date();
  return `${now.getFullYear()}_${String(now.getMonth() + 1).padStart(2, '0')}`;
};

export default function RetentionReportModal({ open, onClose, onSubmit, client }) {
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);

  // 対象月ラベル（card の month から）
  const currentMonth = (() => {
    if (!client?.status) return 1;
    const m = client.status.match(/follow-up-m(\d+)/);
    return m ? parseInt(m[1], 10) : 1;
  })();
  const monthLabel = MONTH_LABELS[currentMonth] || `${currentMonth}ヶ月目`;
  const nextMonthLabel = MONTH_LABELS[currentMonth + 1] || '定着完了';

  useEffect(() => {
    if (open) setForm(emptyForm());
  }, [open]);

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  const saveToFirestore = async () => {
    const monthKey = toMonthKey();
    await setDoc(
      doc(db, 'clients', client.id, 'retentionReports', monthKey),
      {
        ...form,
        followUpMonth: currentMonth,
        targetMonth: monthKey,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  };

  const openPrintWindow = () => {
    const numLabel = (n) => ['①', '②', '③'][n - 1];
    const now = new Date();
    const monthLabel2 = `${now.getFullYear()}年${now.getMonth() + 1}月`;

    const formatDate = (d) => {
      if (!d) return '';
      const date = d.toDate ? d.toDate() : new Date(d);
      return date.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    const html = `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<title>定着支援レポート ${monthLabel2}</title>
<style>
  @page { size: A4 portrait; margin: 12mm; }
  * { box-sizing: border-box; }
  body { font-family: 'Hiragino Kaku Gothic ProN','Meiryo',sans-serif; font-size:9pt; color:#000; background:#fff; margin:0; padding:0; -webkit-print-color-adjust:exact !important; print-color-adjust:exact !important; }
  h1 { text-align:center; font-size:13pt; margin:0 0 5px 0; border-bottom:2px solid #000; padding-bottom:3px; }
  .meta { display:flex; justify-content:space-between; font-size:9pt; margin-bottom:5px; flex-wrap:wrap; gap:4px; }
  table { width:100%; border-collapse:collapse; margin-bottom:5px; }
  td,th { border:1px solid #000; padding:3px 5px; vertical-align:top; font-size:9pt; line-height:1.4; }
  th { background-color:#e0e0e0; font-weight:bold; text-align:left; white-space:nowrap; width:22%; }
  .sec-title { background-color:#333; color:#fff; padding:2px 7px; font-weight:bold; font-size:9pt; margin:6px 0 2px 0; }
  .num-cell { text-align:center; width:4%; background:#f0f0f0; font-weight:bold; }
</style>
</head>
<body>
<h1>定 着 支 援 レ ポ ー ト</h1>
<div class="meta">
  <span>対象月：<strong>${monthLabel2}</strong>（定着${currentMonth}ヶ月目）</span>
  <span>利用者氏名：<strong>${client?.name || ''}</strong></span>
  <span>就職先：${client?.employmentCompany || client?.employmentInfo?.companyName || ''}</span>
  <span>就職日：${formatDate(client?.employmentDate)}</span>
</div>

<div class="sec-title">支援実施日程</div>
<table>
  <thead><tr>
    <th style="width:4%;text-align:center;">回</th>
    <th style="width:24%;">実施日</th>
    <th style="width:30%;">場所</th>
    <th>方法</th>
  </tr></thead>
  <tbody>
    ${[1,2,3].map(n => `<tr>
      <td style="text-align:center;background:#f0f0f0;">${n}</td>
      <td>${form[`visit${n}Date`] || ''}</td>
      <td>${form[`visit${n}Place`] || ''}</td>
      <td>${form[`visit${n}Method`] || ''}</td>
    </tr>`).join('')}
  </tbody>
</table>

<div class="sec-title">今月の支援目標・実施内容・結果</div>
<table>
  <thead><tr>
    <th style="width:4%;text-align:center;">No</th>
    <th style="width:30%;">支援目標</th>
    <th style="width:33%;">実施内容</th>
    <th>結果・本人の様子</th>
  </tr></thead>
  <tbody>
    ${[1,2,3].map(n => `<tr>
      <td class="num-cell">${numLabel(n)}</td>
      <td style="min-height:45px;height:45px;">${form[`goal${n}`] || ''}</td>
      <td style="min-height:45px;height:45px;">${form[`impl${n}`] || ''}</td>
      <td style="min-height:45px;height:45px;">${form[`result${n}`] || ''}</td>
    </tr>`).join('')}
  </tbody>
</table>

<div class="sec-title">今後の支援方向性・課題</div>
<table><tr><td style="min-height:55px;height:55px;">${form.futureDirection || ''}</td></tr></table>

<div class="sec-title">本人・雇用主への働きかけ</div>
<table>
  <tr><th>本人への働きかけ</th><td style="min-height:40px;height:40px;">${form.clientAction || ''}</td></tr>
  <tr><th>雇用主への働きかけ</th><td style="min-height:40px;height:40px;">${form.employerAction || ''}</td></tr>
</table>

<div class="sec-title">関係機関との共有・連携事項</div>
<table><tr><td style="min-height:45px;height:45px;">${form.sharedItems || ''}</td></tr></table>

<div class="sec-title">来月の目標（申し送り）</div>
<table><tr><td style="min-height:45px;height:45px;">${form.nextGoal || ''}</td></tr></table>

<table style="margin-top:10px;">
  <tr>
    <th style="width:22%;">担当支援員</th>
    <td style="width:28%;">${form.staffName || ''}</td>
    <th style="width:22%;">確認　管理者</th>
    <td style="width:28%;height:35px;"></td>
  </tr>
</table>
</body></html>`;

    const w = window.open('', '_blank');
    if (!w) {
      alert('ポップアップがブロックされました。ブラウザの設定でポップアップを許可してください。');
      return;
    }
    w.document.write(html);
    w.document.close();
    setTimeout(() => { w.focus(); w.print(); }, 500);
  };

  const handleSaveAndPrint = async () => {
    if (!client?.id) return;
    setSaving(true);
    try {
      await saveToFirestore();
      openPrintWindow();
      onSubmit?.(client.id);
    } catch (e) {
      console.error('レポート保存エラー:', e);
      alert('保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const SelectField = ({ label, field, options }) => (
    <FormControl size="small" sx={{ minWidth: 130 }}>
      <InputLabel>{label}</InputLabel>
      <Select value={form[field] || ''} label={label} onChange={set(field)}>
        <MenuItem value=""><em>未選択</em></MenuItem>
        {options.map(o => <MenuItem key={o} value={o}>{o}</MenuItem>)}
      </Select>
    </FormControl>
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth
      PaperProps={{ sx: { maxHeight: '92vh' } }}
    >
      <DialogTitle>
        定着支援レポート　{monthLabel}
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {client?.name} 様 ／ 保存後、カードを {nextMonthLabel} へ移動します
        </Typography>
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2.5}>

          {/* 支援実施日程 */}
          <Typography variant="subtitle2" color="primary" fontWeight="bold">
            ■ 支援実施日程
          </Typography>
          {[1, 2, 3].map(n => (
            <Stack key={n} direction="row" spacing={1.5} alignItems="center">
              <Typography variant="body2" sx={{ minWidth: 32, color: 'text.secondary' }}>
                第{n}回
              </Typography>
              <TextField
                label="実施日" type="date" value={form[`visit${n}Date`]}
                onChange={set(`visit${n}Date`)} size="small" sx={{ width: 160 }}
                InputLabelProps={{ shrink: true }}
              />
              <SelectField label="場所" field={`visit${n}Place`} options={VISIT_PLACES} />
              <SelectField label="方法" field={`visit${n}Method`} options={VISIT_METHODS} />
            </Stack>
          ))}

          <Divider />

          {/* 今月の支援目標・実施・結果 */}
          <Typography variant="subtitle2" color="primary" fontWeight="bold">
            ■ 今月の支援目標・実施内容・結果
          </Typography>
          {[1, 2, 3].map(n => (
            <Box key={n} sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
              <Typography variant="body2" fontWeight="bold" mb={1.5}>
                {'①②③'[n - 1]}
              </Typography>
              <Stack spacing={1.5}>
                <TextField
                  label="支援目標" value={form[`goal${n}`]}
                  onChange={set(`goal${n}`)} size="small" fullWidth multiline rows={2}
                  placeholder={GOAL_PLACEHOLDERS[n - 1]}
                />
                <TextField
                  label="実施内容" value={form[`impl${n}`]}
                  onChange={set(`impl${n}`)} size="small" fullWidth multiline rows={2}
                  placeholder={IMPL_PLACEHOLDERS[n - 1]}
                />
                <TextField
                  label="結果・本人の様子" value={form[`result${n}`]}
                  onChange={set(`result${n}`)} size="small" fullWidth multiline rows={2}
                  placeholder={RESULT_PLACEHOLDERS[n - 1]}
                />
              </Stack>
            </Box>
          ))}

          <Divider />

          {/* 今後の方向性 */}
          <Typography variant="subtitle2" color="primary" fontWeight="bold">
            ■ 今後の支援方向性・課題
          </Typography>
          <TextField
            label="今後の支援方向性・課題" value={form.futureDirection}
            onChange={set('futureDirection')} size="small" fullWidth multiline rows={3}
            placeholder="例：職場内での人間関係構築が次月の重点課題。上司への定期報告体制を整備する。"
          />

          <Divider />

          {/* 働きかけ */}
          <Typography variant="subtitle2" color="primary" fontWeight="bold">
            ■ 本人・雇用主への働きかけ
          </Typography>
          <TextField
            label="本人への働きかけ" value={form.clientAction}
            onChange={set('clientAction')} size="small" fullWidth multiline rows={2}
            placeholder="例：困ったことはすぐに連絡するよう促した。不安なことを言語化する練習を継続。"
          />
          <TextField
            label="雇用主への働きかけ" value={form.employerAction}
            onChange={set('employerAction')} size="small" fullWidth multiline rows={2}
            placeholder="例：体調変化時の早退を柔軟に認めるよう依頼。業務量の調整を相談した。"
          />

          {/* 関係機関 */}
          <Typography variant="subtitle2" color="primary" fontWeight="bold">
            ■ 関係機関との共有・連携事項
          </Typography>
          <TextField
            label="共有・連携事項" value={form.sharedItems}
            onChange={set('sharedItems')} size="small" fullWidth multiline rows={2}
            placeholder="例：主治医・相談支援専門員へ就労状況を報告。服薬変更の情報を共有した。"
          />

          <Divider />

          {/* 来月の目標 */}
          <Typography variant="subtitle2" color="primary" fontWeight="bold">
            ■ 来月の目標（申し送り）
          </Typography>
          <TextField
            label="来月の目標" value={form.nextGoal}
            onChange={set('nextGoal')} size="small" fullWidth multiline rows={2}
            placeholder="例：職場内での自己解決力を高める。月次面談を継続し定着度を確認する。"
          />

          <Divider />

          <TextField
            label="担当支援員" value={form.staffName}
            onChange={set('staffName')} size="small" sx={{ width: 240 }}
          />

        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color="inherit">キャンセル</Button>
        <Button
          onClick={handleSaveAndPrint}
          variant="contained"
          disabled={saving}
          color="primary"
        >
          {saving ? '処理中...' : `印刷して ${nextMonthLabel} へ`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
