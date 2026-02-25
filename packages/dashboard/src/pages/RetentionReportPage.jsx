// src/pages/RetentionReportPage.jsx
// 定着支援レポート（月次） 入力・印刷ページ
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  doc, getDoc, setDoc, serverTimestamp, collection, getDocs, query, orderBy
} from 'firebase/firestore';
import { db } from '../firebase';
import {
  Box, Paper, Typography, Button, TextField, Stack, Divider,
  CircularProgress, Select, MenuItem, FormControl, InputLabel,
  IconButton
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import PrintIcon from '@mui/icons-material/Print';

// 月を yyyy_MM 形式に変換
const toMonthKey = (year, month) => `${year}_${String(month).padStart(2, '0')}`;

// 空のレポートデータ
const emptyReport = () => ({
  // 支援日程（最大3件）
  visit1Date: '', visit1Place: '', visit1Method: '',
  visit2Date: '', visit2Place: '', visit2Method: '',
  visit3Date: '', visit3Place: '', visit3Method: '',
  // 今月の支援目標
  goal1: '', goal2: '', goal3: '',
  // 支援実施内容
  impl1: '', impl2: '', impl3: '',
  // 支援結果・本人の様子
  result1: '', result2: '', result3: '',
  // 今後の支援方向性
  futureDirection: '',
  // 本人・雇用主への働きかけ
  clientAction: '',
  employerAction: '',
  // 関係機関との共有事項
  sharedItems: '',
  // 次月の目標（引き継ぎ）
  nextGoal: '',
  // スタッフ
  staffName: '',
});

const VISIT_PLACES = ['事業所', '職場', 'オンライン', '自宅', 'その他'];
const VISIT_METHODS = ['面談', '電話', 'メール', '訪問', 'その他'];

function RetentionReportPage() {
  const { clientId, yearMonth } = useParams();
  const navigate = useNavigate();

  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [report, setReport] = useState(emptyReport());

  // セレクタ用
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [existingMonths, setExistingMonths] = useState([]);

  const activeMonthKey = yearMonth || toMonthKey(selectedYear, selectedMonth);

  // クライアント情報取得
  useEffect(() => {
    if (!clientId) return;
    getDoc(doc(db, 'clients', clientId)).then(snap => {
      if (snap.exists()) setClient({ id: snap.id, ...snap.data() });
    });
  }, [clientId]);

  // 既存レポート一覧取得
  const fetchExistingMonths = useCallback(async () => {
    if (!clientId) return;
    const snap = await getDocs(
      query(collection(db, 'clients', clientId, 'retentionReports'), orderBy('__name__', 'desc'))
    );
    setExistingMonths(snap.docs.map(d => d.id));
  }, [clientId]);

  // レポートデータ取得
  const fetchReport = useCallback(async (monthKey) => {
    if (!clientId || !monthKey) return;
    setLoading(true);
    try {
      const snap = await getDoc(doc(db, 'clients', clientId, 'retentionReports', monthKey));
      if (snap.exists()) {
        setReport({ ...emptyReport(), ...snap.data() });
      } else {
        setReport(emptyReport());
      }
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    fetchExistingMonths();
  }, [fetchExistingMonths]);

  useEffect(() => {
    fetchReport(activeMonthKey);
  }, [fetchReport, activeMonthKey]);

  const handleChange = (field) => (e) => {
    setReport(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleSave = async () => {
    if (!clientId) return;
    setSaving(true);
    try {
      await setDoc(
        doc(db, 'clients', clientId, 'retentionReports', activeMonthKey),
        { ...report, updatedAt: serverTimestamp() },
        { merge: true }
      );
      await fetchExistingMonths();
      alert('保存しました');
    } catch (e) {
      console.error('保存エラー:', e);
      alert('保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    if (!client) return;

    const [yr, mo] = activeMonthKey.split('_');
    const monthLabel = `${yr}年${parseInt(mo, 10)}月`;

    const formatDate = (d) => {
      if (!d) return '';
      const date = d.toDate ? d.toDate() : new Date(d);
      return date.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    const visitRow = (n) => {
      const date = report[`visit${n}Date`];
      const place = report[`visit${n}Place`];
      const method = report[`visit${n}Method`];
      if (!date && !place && !method) return '';
      return `<tr>
        <td style="text-align:center; width:5%">${n}</td>
        <td style="width:25%">${date}</td>
        <td style="width:30%">${place}</td>
        <td style="width:40%">${method}</td>
      </tr>`;
    };

    const goalRows = [1, 2, 3].map(n => `
      <tr>
        <td style="text-align:center; width:5%; background:#f0f0f0; font-weight:bold;">①②③`[n - 1] + `</td>
        <td style="min-height:35px; height:35px;">${report[`goal${n}`] || ''}</td>
        <td style="min-height:35px; height:35px;">${report[`impl${n}`] || ''}</td>
        <td style="min-height:35px; height:35px;">${report[`result${n}`] || ''}</td>
      </tr>`
    ).join('');

    // 目標番号ラベル
    const numLabel = (n) => ['①', '②', '③'][n - 1];
    const goalsTable = [1, 2, 3].map(n => `
      <tr>
        <td style="text-align:center; width:5%; background:#f0f0f0; font-weight:bold;">${numLabel(n)}</td>
        <td style="width:30%; min-height:40px; height:40px;">${report[`goal${n}`] || ''}</td>
        <td style="width:30%; min-height:40px; height:40px;">${report[`impl${n}`] || ''}</td>
        <td style="min-height:40px; height:40px;">${report[`result${n}`] || ''}</td>
      </tr>`
    ).join('');

    const html = `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<title>定着支援レポート ${monthLabel}</title>
<style>
  @page { size: A4 portrait; margin: 12mm; }
  * { box-sizing: border-box; }
  body {
    font-family: 'Hiragino Kaku Gothic ProN', 'Meiryo', sans-serif;
    font-size: 9pt;
    color: #000;
    background: #fff;
    margin: 0; padding: 0;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  h1 { text-align: center; font-size: 13pt; margin: 0 0 5px 0; border-bottom: 2px solid #000; padding-bottom: 3px; }
  .meta { display: flex; justify-content: space-between; font-size: 9pt; margin-bottom: 5px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 5px; }
  td, th {
    border: 1px solid #000;
    padding: 3px 5px;
    vertical-align: top;
    font-size: 9pt;
    line-height: 1.4;
  }
  th { background-color: #e0e0e0; font-weight: bold; text-align: left; white-space: nowrap; width: 22%; }
  .sec-title {
    background-color: #333;
    color: #fff;
    padding: 2px 7px;
    font-weight: bold;
    font-size: 9pt;
    margin: 6px 0 2px 0;
  }
  .tall td, .tall th { min-height: 55px; height: 55px; }
</style>
</head>
<body>

<h1>定 着 支 援 レ ポ ー ト</h1>
<div class="meta">
  <span>対象月：<strong>${monthLabel}</strong></span>
  <span>利用者氏名：<strong>${client.name || ''}</strong></span>
  <span>就職先：${client.employmentCompany || client.employmentInfo?.companyName || ''}</span>
  <span>就職日：${formatDate(client.employmentDate)}</span>
</div>

<div class="sec-title">支援実施日程</div>
<table>
  <thead>
    <tr>
      <th style="width:5%; text-align:center;">回</th>
      <th style="width:25%;">実施日</th>
      <th style="width:30%;">場所・方法</th>
      <th>内容メモ</th>
    </tr>
  </thead>
  <tbody>
    ${[1, 2, 3].map(n => {
      const date = report[`visit${n}Date`] || '';
      const place = report[`visit${n}Place`] || '';
      const method = report[`visit${n}Method`] || '';
      return `<tr>
        <td style="text-align:center; background:#f0f0f0;">${n}</td>
        <td>${date}</td>
        <td>${place}${place && method ? '　/　' : ''}${method}</td>
        <td></td>
      </tr>`;
    }).join('')}
  </tbody>
</table>

<div class="sec-title">今月の支援目標・実施内容・結果</div>
<table>
  <thead>
    <tr>
      <th style="width:4%; text-align:center;">No</th>
      <th style="width:30%;">支援目標</th>
      <th style="width:33%;">実施内容</th>
      <th>結果・本人の様子</th>
    </tr>
  </thead>
  <tbody>
    ${[1, 2, 3].map(n => `
    <tr>
      <td style="text-align:center; background:#f0f0f0; font-weight:bold;">${numLabel(n)}</td>
      <td style="min-height:45px; height:45px;">${report[`goal${n}`] || ''}</td>
      <td style="min-height:45px; height:45px;">${report[`impl${n}`] || ''}</td>
      <td style="min-height:45px; height:45px;">${report[`result${n}`] || ''}</td>
    </tr>`).join('')}
  </tbody>
</table>

<div class="sec-title">今後の支援方向性・課題</div>
<table>
  <tr>
    <td style="min-height:55px; height:55px;">${report.futureDirection || ''}</td>
  </tr>
</table>

<div class="sec-title">本人・雇用主への働きかけ</div>
<table>
  <tr>
    <th>本人への働きかけ</th>
    <td style="min-height:40px; height:40px;">${report.clientAction || ''}</td>
  </tr>
  <tr>
    <th>雇用主への働きかけ</th>
    <td style="min-height:40px; height:40px;">${report.employerAction || ''}</td>
  </tr>
</table>

<div class="sec-title">関係機関との共有・連携事項</div>
<table>
  <tr>
    <td style="min-height:50px; height:50px;">${report.sharedItems || ''}</td>
  </tr>
</table>

<div class="sec-title">来月の目標（申し送り）</div>
<table>
  <tr>
    <td style="min-height:45px; height:45px;">${report.nextGoal || ''}</td>
  </tr>
</table>

<table style="margin-top:10px;">
  <tr>
    <th style="width:22%;">担当支援員</th>
    <td style="width:28%;">${report.staffName || ''}</td>
    <th style="width:22%;">確認　管理者</th>
    <td style="width:28%; height:35px;"></td>
  </tr>
</table>

</body>
</html>`;

    const w = window.open('', '_blank');
    if (!w) {
      alert('ポップアップがブロックされました。ブラウザの設定でポップアップを許可してください。');
      return;
    }
    w.document.write(html);
    w.document.close();
    setTimeout(() => { w.focus(); w.print(); }, 500);
  };

  const Field = ({ label, field, multiline = false, rows = 2, placeholder = '' }) => (
    <TextField
      label={label}
      value={report[field] || ''}
      onChange={handleChange(field)}
      fullWidth
      multiline={multiline}
      rows={multiline ? rows : undefined}
      placeholder={placeholder}
      size="small"
    />
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper sx={{ p: 3, maxWidth: 900, mx: 'auto', my: 2 }}>
      {/* ヘッダー */}
      <Stack direction="row" alignItems="center" spacing={1} mb={2}>
        <IconButton onClick={() => navigate(`/clients/${clientId}`)}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h6" flexGrow={1}>
          定着支援レポート　{client?.name}
        </Typography>
        <Button variant="outlined" startIcon={<PrintIcon />} onClick={handlePrint}>
          印刷
        </Button>
        <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave} disabled={saving}>
          {saving ? '保存中...' : '保存'}
        </Button>
      </Stack>

      {/* 月選択 */}
      <Stack direction="row" spacing={2} mb={3} alignItems="center">
        <FormControl size="small" sx={{ minWidth: 100 }}>
          <InputLabel>年</InputLabel>
          <Select
            value={selectedYear}
            label="年"
            onChange={e => {
              setSelectedYear(e.target.value);
              fetchReport(toMonthKey(e.target.value, selectedMonth));
            }}
          >
            {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map(y => (
              <MenuItem key={y} value={y}>{y}年</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 80 }}>
          <InputLabel>月</InputLabel>
          <Select
            value={selectedMonth}
            label="月"
            onChange={e => {
              setSelectedMonth(e.target.value);
              fetchReport(toMonthKey(selectedYear, e.target.value));
            }}
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
              <MenuItem key={m} value={m}>{m}月</MenuItem>
            ))}
          </Select>
        </FormControl>
        <Typography variant="body2" color="text.secondary">
          対象月：{activeMonthKey.replace('_', '年')}月
        </Typography>
        {existingMonths.length > 0 && (
          <Typography variant="caption" color="primary">
            保存済み: {existingMonths.join(', ')}
          </Typography>
        )}
      </Stack>

      {/* 支援実施日程 */}
      <Typography variant="subtitle1" fontWeight="bold" mb={1}>支援実施日程</Typography>
      <Stack spacing={1.5} mb={2}>
        {[1, 2, 3].map(n => (
          <Stack key={n} direction="row" spacing={1} alignItems="center">
            <Typography variant="body2" sx={{ minWidth: 24 }}>第{n}回</Typography>
            <TextField
              label="実施日"
              type="date"
              value={report[`visit${n}Date`] || ''}
              onChange={handleChange(`visit${n}Date`)}
              size="small"
              sx={{ width: 160 }}
              InputLabelProps={{ shrink: true }}
            />
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>場所</InputLabel>
              <Select
                value={report[`visit${n}Place`] || ''}
                label="場所"
                onChange={handleChange(`visit${n}Place`)}
              >
                <MenuItem value=""><em>未選択</em></MenuItem>
                {VISIT_PLACES.map(p => <MenuItem key={p} value={p}>{p}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>方法</InputLabel>
              <Select
                value={report[`visit${n}Method`] || ''}
                label="方法"
                onChange={handleChange(`visit${n}Method`)}
              >
                <MenuItem value=""><em>未選択</em></MenuItem>
                {VISIT_METHODS.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
              </Select>
            </FormControl>
          </Stack>
        ))}
      </Stack>

      <Divider sx={{ my: 2 }} />

      {/* 支援目標・実施・結果 */}
      <Typography variant="subtitle1" fontWeight="bold" mb={1}>今月の支援目標・実施内容・結果</Typography>
      {[1, 2, 3].map(n => (
        <Box key={n} sx={{ mb: 2, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
          <Typography variant="body2" fontWeight="bold" mb={1}>目標 {['①', '②', '③'][n - 1]}</Typography>
          <Stack spacing={1.5}>
            <Field label="支援目標" field={`goal${n}`} multiline rows={2}
              placeholder={n === 1 ? '例：職場内コミュニケーションを安定させる' : n === 2 ? '例：体調管理リズムを定着させる' : '例：定期的な相談窓口の活用'} />
            <Field label="実施内容" field={`impl${n}`} multiline rows={2}
              placeholder={n === 1 ? '例：上司との月1回の面談に同席し、本人の意向を伝達した' : n === 2 ? '例：睡眠・食事記録の確認と生活リズム調整のアドバイスを行った' : '例：相談支援事業所との情報共有を月1回実施した'} />
            <Field label="結果・本人の様子" field={`result${n}`} multiline rows={2}
              placeholder={n === 1 ? '例：職場での孤立感が軽減。自発的に質問できるようになってきた' : n === 2 ? '例：睡眠時間が安定し、遅刻が0件に減少した' : '例：相談支援員との連携がスムーズになり安心感が増した'} />
          </Stack>
        </Box>
      ))}

      <Divider sx={{ my: 2 }} />

      {/* 今後の方向性 */}
      <Typography variant="subtitle1" fontWeight="bold" mb={1}>今後の支援方向性・課題</Typography>
      <Field label="今後の支援方向性・課題" field="futureDirection" multiline rows={3}
        placeholder="例：職場内での人間関係構築が次月の重点課題。上司への定期報告体制を整備する。" />

      <Divider sx={{ my: 2 }} />

      {/* 本人・雇用主への働きかけ */}
      <Typography variant="subtitle1" fontWeight="bold" mb={1}>本人・雇用主への働きかけ</Typography>
      <Stack spacing={1.5} mb={2}>
        <Field label="本人への働きかけ" field="clientAction" multiline rows={2}
          placeholder="例：困ったことはすぐに連絡するよう促した。不安なことを言語化する練習を継続。" />
        <Field label="雇用主への働きかけ" field="employerAction" multiline rows={2}
          placeholder="例：体調変化時の早退を柔軟に認めるよう依頼。業務量の調整を相談した。" />
      </Stack>

      {/* 関係機関共有 */}
      <Typography variant="subtitle1" fontWeight="bold" mb={1}>関係機関との共有・連携事項</Typography>
      <Field label="共有・連携事項" field="sharedItems" multiline rows={2}
        placeholder="例：主治医・相談支援専門員へ就労状況を報告。服薬変更の情報を共有した。" />

      <Divider sx={{ my: 2 }} />

      {/* 来月の目標 */}
      <Typography variant="subtitle1" fontWeight="bold" mb={1}>来月の目標（申し送り）</Typography>
      <Field label="来月の目標" field="nextGoal" multiline rows={2}
        placeholder="例：職場内での自己解決力を高める。月次面談を継続し定着度を確認する。" />

      <Divider sx={{ my: 2 }} />

      {/* 担当者 */}
      <Field label="担当支援員" field="staffName" />

      <Stack direction="row" spacing={2} mt={3} justifyContent="flex-end">
        <Button variant="outlined" startIcon={<PrintIcon />} onClick={handlePrint}>
          印刷
        </Button>
        <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave} disabled={saving}>
          {saving ? '保存中...' : '保存'}
        </Button>
      </Stack>
    </Paper>
  );
}

export default RetentionReportPage;
