// src/pages/RetentionPlanPrintPage.jsx
// 定着支援計画書 印刷ページ
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Box, Typography, Button, CircularProgress } from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';

function RetentionPlanPrintPage() {
  const { clientId } = useParams();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [printed, setPrinted] = useState(false);

  useEffect(() => {
    if (!clientId) return;
    getDoc(doc(db, 'clients', clientId)).then(snap => {
      if (snap.exists()) setClient({ id: snap.id, ...snap.data() });
      setLoading(false);
    });
  }, [clientId]);

  useEffect(() => {
    if (!client || printed) return;
    setPrinted(true);
    handlePrint();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client]);

  const handlePrint = () => {
    if (!client) return;

    const formatDate = (d) => {
      if (!d) return '';
      const date = d.toDate ? d.toDate() : new Date(d);
      return date.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' });
    };
    const getAge = (birthDate) => {
      if (!birthDate) return '';
      const birth = birthDate.toDate ? birthDate.toDate() : new Date(birthDate);
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
      return age;
    };
    const genderLabel = client.gender === 'male' ? '男性' : client.gender === 'female' ? '女性' : 'その他';
    const getDisabilities = () => {
      const t = [];
      if (client.disability_mental) t.push('精神障害');
      if (client.disability_intellectual) t.push('知的障害');
      if (client.disability_physical) t.push('身体障害');
      if (client.disability_developmental) t.push('発達障害');
      if (client.disability_rare) t.push('難病');
      return t.join('　') || '　';
    };

    const today = new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' });

    const html = `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<title>定着支援計画書</title>
<style>
  @page { size: A4 portrait; margin: 12mm 12mm 12mm 12mm; }
  * { box-sizing: border-box; }
  body {
    font-family: 'Hiragino Kaku Gothic ProN', 'Meiryo', sans-serif;
    font-size: 9pt;
    color: #000;
    background: #fff;
    margin: 0;
    padding: 0;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  h1 {
    text-align: center;
    font-size: 14pt;
    margin: 0 0 6px 0;
    border-bottom: 2px solid #000;
    padding-bottom: 4px;
  }
  .doc-date { text-align: right; font-size: 9pt; margin-bottom: 6px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 6px; }
  td, th {
    border: 1px solid #000;
    padding: 3px 5px;
    vertical-align: top;
    font-size: 9pt;
    line-height: 1.5;
  }
  th {
    background-color: #e8e8e8;
    font-weight: bold;
    text-align: left;
    white-space: nowrap;
    width: 22%;
  }
  .sec-title {
    background-color: #333;
    color: #fff;
    padding: 3px 8px;
    font-weight: bold;
    font-size: 10pt;
    margin: 8px 0 3px 0;
  }
  .tall td, .tall th { min-height: 60px; height: 60px; }
  .very-tall td, .very-tall th { min-height: 80px; height: 80px; }
  .support-num {
    text-align: center;
    width: 6%;
    font-weight: bold;
    background-color: #f0f0f0;
  }
  .sig-row td { height: 45px; }
  .sig-table { margin-top: 12px; }
  .footer-note { font-size: 7pt; margin-top: 8px; text-align: center; color: #555; }
</style>
</head>
<body>

<h1>定　着　支　援　計　画　書</h1>
<div class="doc-date">作成日：${today}</div>

<div class="sec-title">利用者情報</div>
<table>
  <tr>
    <th>ふりがな</th>
    <td>${client.nameKana || ''}</td>
    <th>生年月日</th>
    <td>${formatDate(client.birthDate)}（${getAge(client.birthDate)}歳）</td>
  </tr>
  <tr>
    <th>氏名</th>
    <td style="font-size:11pt; font-weight:bold;">${client.name || ''}</td>
    <th>性別</th>
    <td>${genderLabel}</td>
  </tr>
  <tr>
    <th>障害種別</th>
    <td colspan="3">${getDisabilities()}</td>
  </tr>
  <tr>
    <th>サービス開始日</th>
    <td>${formatDate(client.serviceStartDate)}</td>
    <th>就職日</th>
    <td>${formatDate(client.employmentDate)}</td>
  </tr>
</table>

<div class="sec-title">就職先情報</div>
<table>
  <tr>
    <th>就職先企業名</th>
    <td colspan="3" style="font-size:10pt; font-weight:bold;">${client.employmentCompany || client.employmentInfo?.companyName || ''}</td>
  </tr>
  <tr>
    <th>職種・業務内容</th>
    <td colspan="3" style="min-height:40px; height:40px;">${client.jobDescription || ''}</td>
  </tr>
  <tr>
    <th>勤務形態</th>
    <td>${client.workStyle || ''}</td>
    <th>勤務時間</th>
    <td>${client.workHours || ''}</td>
  </tr>
  <tr>
    <th>勤務日数</th>
    <td>${client.workDays || ''}</td>
    <th>給与・賃金</th>
    <td>${client.salary || ''}</td>
  </tr>
  <tr>
    <th>職場環境・特記事項</th>
    <td colspan="3" style="min-height:50px; height:50px;">${client.workplaceEnvironment || ''}</td>
  </tr>
</table>

<div class="sec-title">健康・生活状況</div>
<table>
  <tr>
    <th>健康状態・配慮事項</th>
    <td colspan="3" style="min-height:50px; height:50px;">${client.healthNotes || client.health_overview || ''}</td>
  </tr>
  <tr>
    <th>服薬・通院状況</th>
    <td colspan="3" style="min-height:40px; height:40px;">${client.medicationStatus || ''}</td>
  </tr>
</table>

<div class="sec-title">定着支援の目標</div>
<table>
  <tr>
    <th>長期目標<br>（6ヶ月）</th>
    <td style="min-height:55px; height:55px;">${client.retentionGoalLong || ''}</td>
  </tr>
  <tr>
    <th>短期目標<br>（1ヶ月）</th>
    <td style="min-height:55px; height:55px;">${client.retentionGoalShort || ''}</td>
  </tr>
</table>

<div class="sec-title">具体的な支援内容</div>
<table>
  <thead>
    <tr>
      <th style="width:6%; text-align:center;">No.</th>
      <th style="width:20%;">支援項目</th>
      <th>支援内容・方法</th>
      <th style="width:18%;">担当・頻度</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td class="support-num">①</td>
      <td>${client.supportItem1 || '職場適応支援'}</td>
      <td style="min-height:55px; height:55px;">${client.supportContent1 || ''}</td>
      <td>${client.supportPerson1 || ''}</td>
    </tr>
    <tr>
      <td class="support-num">②</td>
      <td>${client.supportItem2 || '生活安定支援'}</td>
      <td style="min-height:55px; height:55px;">${client.supportContent2 || ''}</td>
      <td>${client.supportPerson2 || ''}</td>
    </tr>
    <tr>
      <td class="support-num">③</td>
      <td>${client.supportItem3 || '関係機関連携'}</td>
      <td style="min-height:55px; height:55px;">${client.supportContent3 || ''}</td>
      <td>${client.supportPerson3 || ''}</td>
    </tr>
  </tbody>
</table>

<div class="sec-title">支援者・同意確認</div>
<table class="sig-table">
  <tr>
    <th style="width:25%; text-align:center;">事業所名</th>
    <td style="width:75%;"></td>
  </tr>
  <tr class="sig-row">
    <th style="text-align:center;">担当支援員　署名</th>
    <td></td>
  </tr>
  <tr class="sig-row">
    <th style="text-align:center;">利用者　署名</th>
    <td></td>
  </tr>
  <tr class="sig-row">
    <th style="text-align:center;">保護者等　署名<br><span style="font-size:7pt; font-weight:normal;">（必要な場合）</span></th>
    <td></td>
  </tr>
</table>

<div class="footer-note">※本計画書は利用者・事業所双方が1部ずつ保管してください。</div>

</body>
</html>`;

    const w = window.open('', '_blank');
    if (!w) {
      alert('ポップアップがブロックされました。ブラウザの設定でポップアップを許可してください。');
      return;
    }
    w.document.write(html);
    w.document.close();
    setTimeout(() => {
      w.focus();
      w.print();
    }, 500);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!client) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography color="error">利用者データが見つかりません。</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4, textAlign: 'center' }}>
      <Typography variant="h6" gutterBottom>定着支援計画書</Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        {client.name} 様
      </Typography>
      <Button
        variant="contained"
        startIcon={<PrintIcon />}
        onClick={handlePrint}
        sx={{ mt: 2 }}
      >
        印刷ダイアログを開く
      </Button>
    </Box>
  );
}

export default RetentionPlanPrintPage;
