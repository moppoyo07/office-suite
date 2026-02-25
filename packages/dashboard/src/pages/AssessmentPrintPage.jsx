// アセスメント印刷ページ
// ClientPrintPage.jsx と同じ window.open + document.write 方式を使用
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/index.js';
import { Box, CircularProgress, Typography, Button } from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';

// =========================================
// 共通CSS（ClientPrintPage.jsx と同じ方式）
// =========================================
const PRINT_CSS = `
  @page { size: A4 portrait; margin: 10mm; }
  body {
    font-family: 'Hiragino Kaku Gothic ProN', 'Meiryo', 'MS Gothic', sans-serif;
    font-size: 9pt;
    color: #000;
    background: #fff;
    margin: 0;
    padding: 5mm;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
  td, th {
    border: 1px solid #000;
    padding: 3px 5px;
    vertical-align: top;
    font-size: 9pt;
    line-height: 1.4;
  }
  th { background-color: #f0f0f0; font-weight: bold; text-align: left; }
  .sec-title {
    background-color: #000;
    color: #fff;
    padding: 3px 8px;
    font-weight: bold;
    font-size: 10pt;
    margin: 6px 0 2px 0;
  }
  .header-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 2px solid #000;
    padding-bottom: 4px;
    margin-bottom: 6px;
  }
  .header-row h2 { font-size: 14pt; margin: 0; }
  .date-box { border: 1px solid #000; padding: 4px 8px; font-size: 9pt; }
  .page-break { page-break-before: always; margin-top: 0; }
  .note { font-size: 7pt; margin-bottom: 6px; color: #333; }
`;

// =========================================
// HTML生成ヘルパー
// =========================================
const v = (val) => val || '';
const header = (title, sub) =>
  `<div class="header-row"><h2>${title}</h2><div class="date-box">${sub || '記入日：西暦　　年　　月　　日'}</div></div>`;
const sec = (label) => `<div class="sec-title">${label}</div>`;
const pb = () => `<div class="page-break"></div>`;

// =========================================
// アセスメントHTML生成（全6ページ）
// =========================================
const generateAssessmentHTML = (data = {}, clientName = '') => {
  const fs  = data.faceSheet       || {};
  const fsb = data.faceSheetBack   || {};
  const a1  = data.assessment1     || {};
  const a2  = data.assessment2     || {};
  const mental = data.mentalAssessment || {};
  const beh = data.behaviors       || {};

  const routes         = fs.commuteRoutes  || [];
  const emergency      = fs.emergency      || [];
  const hospitals      = fs.hospitals      || [];
  const welfareServices= fs.welfareServices|| [];
  const adminOffices   = fs.adminOffices   || [];
  const family         = fsb.family        || [];
  const econ           = fsb.economics     || {};
  const disability     = fsb.disability    || {};
  const certs          = disability.certificates || {};
  const crisis         = fsb.crisis        || {};
  const employment     = a1.employment     || {};
  const housing        = a1.housing        || {};
  const social         = a1.social         || {};
  const medication     = mental.medication || {};

  let html = '';

  // ===== ページ1: フェイスシート表 =====
  html += header('フェイスシート', '');
  html += `<p class="note">※非常災害時・危機対応に活用されるシートです。出来るかぎり詳細な記載にご協力下さい。</p>`;

  html += sec('基本情報');
  html += `<table><tbody>
    <tr><th width="12%">ふりがな</th><td width="38%">${v(fs.nameKana)}</td><th width="12%">生年月日</th><td>${v(fs.birthDate)}</td></tr>
    <tr><th>氏名</th><td>${v(fs.name)}</td><th>性別・血液型</th><td>${v(fs.gender)} / ${v(fs.bloodType)}</td></tr>
    <tr><th>住所</th><td colspan="3">〒${v(fs.postalCode)}　${v(fs.address)}</td></tr>
    <tr><th>電話番号</th><td>${v(fs.phone)}</td><th>携帯電話</th><td>${v(fs.mobilePhone)}</td></tr>
    <tr><th>メールアドレス</th><td colspan="3">${v(fs.email)}</td></tr>
  </tbody></table>`;

  html += sec('通所経路');
  html += `<table><thead><tr><th width="18%">交通手段</th><th width="20%">路線・会社</th><th>乗車〜降車</th><th width="14%">片道運賃</th><th width="14%">割引運賃</th></tr></thead><tbody>`;
  if (routes.length > 0) {
    routes.forEach(r => {
      html += `<tr><td style="text-align:center">${v(r.type)}</td><td>${v(r.company)}</td><td>${v(r.from)}〜${v(r.to)}</td><td style="text-align:center">${r.cost ? r.cost + '円' : '-'}</td><td style="text-align:center">${r.costDiscounted ? r.costDiscounted + '円' : '-'}</td></tr>`;
    });
  } else {
    html += `<tr><td colspan="5" style="text-align:center;color:#999">経路情報なし</td></tr>`;
  }
  html += `</tbody></table>`;

  html += sec('緊急連絡先');
  html += `<table><tbody>`;
  [0,1,2].forEach(i => {
    html += `<tr><td style="text-align:center;width:3%;font-weight:bold">${i+1}</td><th width="8%">氏名</th><td width="30%">${v(emergency[i]?.name)}</td><th width="8%">続柄</th><td width="18%">${v(emergency[i]?.relation)}</td><th width="10%">電話番号</th><td>${v(emergency[i]?.phone)}</td></tr>`;
  });
  html += `</tbody></table>`;

  html += sec('かかりつけ医療機関');
  [0,1].forEach(i => {
    html += `<table><tbody>
      <tr><td style="text-align:center;width:3%" rowspan="2">${i+1}</td><th width="10%">病院名</th><td colspan="3">${v(hospitals[i]?.name)}</td><th width="10%">電話番号</th><td width="20%">${v(hospitals[i]?.phone)}</td></tr>
      <tr><th>受診科目</th><td>${v(hospitals[i]?.dept)}</td><th width="8%">担当医</th><td>${v(hospitals[i]?.doctor)}</td><th>通院頻度</th><td>${v(hospitals[i]?.freq)}</td></tr>
    </tbody></table>`;
  });

  html += sec('相談支援事業所・福祉サービス・行政窓口');
  html += `<table><tbody>
    <tr><th width="14%">相談支援事業所</th><td>${v(fs.supportOffice?.name)}</td><th width="8%">担当</th><td>${v(fs.supportOffice?.person)}</td><th width="8%">電話</th><td>${v(fs.supportOffice?.phone)}</td></tr>`;
  [0,1].forEach(i => {
    html += `<tr><th>福祉サービス${i+1}</th><td>${v(welfareServices[i]?.name)}</td><th>種別</th><td>${v(welfareServices[i]?.type)}</td><th>担当</th><td>${v(welfareServices[i]?.person)}</td></tr>`;
  });
  [0,1].forEach(i => {
    html += `<tr><th>行政窓口${i+1}</th><td>${v(adminOffices[i]?.city)}</td><th>課・係</th><td>${v(adminOffices[i]?.section)}</td><th>担当</th><td>${v(adminOffices[i]?.person)}</td></tr>`;
  });
  html += `<tr><th>ハローワーク</th><td>${fs.helloWork?.status === 'registered' ? '登録済' : '未登録'}</td><th>担当</th><td>${v(fs.helloWork?.person)}</td><th>電話</th><td>${v(fs.helloWork?.phone)}</td></tr>`;
  html += `</tbody></table>`;

  // ===== ページ2: フェイスシート裏 =====
  html += pb();
  html += header('フェイスシート（裏）', clientName);

  html += sec('家族構成');
  html += `<table><thead><tr><th width="4%">No</th><th>氏名</th><th width="12%">続柄</th><th width="12%">同居</th><th>備考</th></tr></thead><tbody>`;
  const familyFiltered = family.filter(f => f.name);
  if (familyFiltered.length > 0) {
    familyFiltered.forEach((f, i) => {
      html += `<tr><td style="text-align:center">${i+1}</td><td>${v(f.name)}</td><td style="text-align:center">${v(f.relation)}</td><td style="text-align:center">${f.living === 'yes' ? '同居' : '別居'}</td><td>${v(f.note)}</td></tr>`;
    });
  } else {
    html += `<tr><td colspan="5" style="text-align:center">-</td></tr>`;
  }
  html += `</tbody></table>`;

  html += sec('経済状況');
  html += `<table><tbody>
    <tr><th width="12%">生活保護</th><td>${v(econ.welfare?.status)} ${econ.welfare?.amount ? econ.welfare.amount + '円/月' : ''}</td><th width="12%">障害年金</th><td>${v(econ.disabilityPension?.status)} ${v(econ.disabilityPension?.grade)} ${econ.disabilityPension?.amount ? econ.disabilityPension.amount + '円/月' : ''}</td></tr>
    <tr><th>健康保険</th><td>${v(econ.healthInsurance?.type)} ${v(econ.healthInsurance?.holder)}</td><th>自立支援医療</th><td>${v(econ.selfSupportMedical)}</td></tr>
    <tr><th>備考</th><td colspan="3" style="white-space:pre-wrap">${v(econ.note)}</td></tr>
  </tbody></table>`;

  html += sec('障害・疾病の状況');
  html += `<table><tbody>
    <tr><th width="12%">障害種別</th><td>${(disability.types || []).join('、') || '-'}</td><th width="12%">診断名</th><td>${v(disability.diagnosisName)}</td></tr>
    <tr><th>合併障害</th><td>${v(disability.comorbidity)}</td><th>手帳申請状況</th><td>${v(disability.certStatus)}</td></tr>
    <tr><th>精神障害者保健福祉手帳</th><td>${certs.mental?.grade ? certs.mental.grade + '級' : '-'}</td><th>取得日</th><td>${v(certs.mental?.date)}</td></tr>
    <tr><th>療育手帳</th><td>${certs.intellectual?.grade ? certs.intellectual.grade + '級' : '-'}</td><th>取得日</th><td>${v(certs.intellectual?.date)}</td></tr>
    <tr><th>身体障害者手帳</th><td>${certs.physical?.grade ? certs.physical.grade + '級' : '-'}</td><th>取得日</th><td>${v(certs.physical?.date)}</td></tr>
  </tbody></table>`;

  html += sec('緊急災害時・危機対応');
  html += `<table><thead><tr><th width="30%">質問</th><th width="35%">ご回答</th><th>対処法</th></tr></thead><tbody>
    <tr><td>非常災害時、身体面で心配なこと</td><td>${v(crisis.physical?.answer)} ${v(crisis.physical?.detail)}</td><td>${v(crisis.physical?.coping)}</td></tr>
    <tr><td>発作はありますか</td><td>${v(crisis.seizure?.answer)} ${v(crisis.seizure?.detail)}</td><td>${v(crisis.seizure?.coping)}</td></tr>
    <tr><td>自傷・他害の心配</td><td>過去:${v(crisis.selfHarm?.past)} 現在:${v(crisis.selfHarm?.present)}<br>${v(crisis.selfHarm?.detail)}</td><td>${v(crisis.selfHarm?.coping)}</td></tr>
    <tr><td>自殺念慮の有無</td><td>過去:${v(crisis.suicidal?.past)} 現在:${v(crisis.suicidal?.present)}<br>${v(crisis.suicidal?.detail)}</td><td>${v(crisis.suicidal?.coping)}</td></tr>
  </tbody></table>`;
  html += `<div style="border:1px solid #000;min-height:40px;padding:4px 6px;white-space:pre-wrap">特記事項：${v(crisis.generalNote)}</div>`;

  // ===== ページ3: アセスメント1 =====
  html += pb();
  html += header('アセスメントシート１（社会参加・生活・就労）', '');

  html += sec('社会参加（地域生活関連）');
  html += `<table><tbody>
    <tr><th width="20%">外出の頻度</th><td>${v(social.outingFreq)}</td><th width="20%">主な外出先</th><td>${v(social.outingPlaces)}</td></tr>
    <tr><th>社会参加の状況</th><td colspan="3">${v(social.participation)}</td></tr>
    <tr><th>過去2年間の入所歴</th><td colspan="3">${social.admissionHistory === 'yes' ? 'あり' : 'なし'}</td></tr>
    <tr><th>その他</th><td colspan="3">${v(social.note)}</td></tr>
  </tbody></table>`;

  html += sec('日中活動');
  html += `<table><tbody>
    <tr><th width="20%">主な活動場所</th><td>${v(a1.dailyActivity?.place)}</td></tr>
    <tr><th>1日の様子</th><td style="white-space:pre-wrap;min-height:80px">${v(a1.dailyActivity?.dayDescription)}</td></tr>
    <tr><th>休日の様子</th><td style="white-space:pre-wrap">${v(a1.dailyActivity?.holidayDescription)}</td></tr>
  </tbody></table>`;

  html += sec('居住関連');
  html += `<table><tbody>
    <tr><th width="20%">住居形態</th><td>${v(housing.type)}</td><th width="20%">建物種別</th><td>${v(housing.structure)}</td></tr>
    <tr><th>本人の部屋</th><td>${v(housing.room)}</td><th>寝具</th><td>${v(housing.bedding)}</td></tr>
    <tr><th>特記事項</th><td colspan="3">${v(housing.notes)}</td></tr>
  </tbody></table>`;

  html += sec('免許・資格・検定など');
  html += `<table><tbody>
    <tr><th width="12%">有無</th><td width="20%">${v(a1.qualificationsStatus)}</td><th width="12%">内容</th><td>${v(a1.qualifications)}</td></tr>
  </tbody></table>`;

  html += sec('就労関連について');
  html += `<table><tbody>
    <tr><th width="20%">就労状況</th><td colspan="3">${(employment.currentStatus || []).join('、') || '-'}</td></tr>
    <tr><th>一般就労・アルバイト経験</th><td>${v(employment.expGeneral)}</td><th>移行・継続支援経験</th><td>${v(employment.expWelfare)}</td></tr>
    <tr><th>最近1年間の就労経験</th><td>${v(employment.expRecent)}</td><th>中断の有無</th><td>${v(employment.interrupted)}</td></tr>
    <tr><th>主な就労先（最後）</th><td colspan="3">${v(employment.mainEmployer)}</td></tr>
    <tr><th>一般就労希望</th><td>${v(employment.hopeGeneral)}</td><th>希望する仕事</th><td>${v(employment.desiredJob)}</td></tr>
    <tr><th>就職希望時期</th><td>${v(employment.desiredTiming)}</td><th>オープン/クローズ</th><td>${v(employment.openClose)}</td></tr>
    <tr><th>特記事項</th><td colspan="3" style="white-space:pre-wrap">${v(employment.notes)}</td></tr>
  </tbody></table>`;

  // ===== ページ4: アセスメント2 =====
  html += pb();
  html += header('アセスメントシート２（本人の意向・好み）', '');
  html += `<table><tbody>`;
  [
    { label: '好きなこと・得意なこと',            key: 'likes' },
    { label: '嫌いなこと・苦手なこと',            key: 'dislikes' },
    { label: '希望する暮らし',                    key: 'desiredLifestyle' },
    { label: '特に支援してほしいこと',            key: 'supportRequests' },
    { label: '支援をするとき気をつけてほしいこと', key: 'supportPrecautions' },
    { label: '将来の夢や希望',                    key: 'futureDreams' },
    { label: 'その他',                            key: 'other' },
  ].forEach(({ label, key }) => {
    html += `<tr><th width="22%">${label}</th><td style="min-height:60px;white-space:pre-wrap;vertical-align:top">${v(a2[key])}</td></tr>`;
  });
  html += `</tbody></table>`;

  // ===== ページ5: 精神・医療 =====
  html += pb();
  html += header('アセスメントシート（精神）', clientName);
  html += `<table><tbody>
    <tr><th width="20%">障害の状況</th><td style="white-space:pre-wrap">${v(mental.disabilityStatus?.description)}</td><th width="20%">支援者追記</th><td style="white-space:pre-wrap">${v(mental.disabilityStatus?.staffNote)}</td></tr>
    <tr><th>診断確定時期・きっかけ</th><td>${v(mental.treatmentStatus?.diagnosisDate)} / ${v(mental.treatmentStatus?.trigger)}</td><th>支援者追記</th><td>${v(mental.treatmentStatus?.staffNote)}</td></tr>
    <tr><th>初診時期・通院頻度</th><td>${v(mental.hospitalStatus?.firstVisit)} / ${v(mental.hospitalStatus?.freq)}</td><th>入院歴</th><td>${v(mental.hospitalStatus?.admission)}</td></tr>
    <tr><th>現在の病状</th><td>${v(mental.condition?.status)} ${v(mental.condition?.detail)}</td><th>支援者追記</th><td>${v(mental.condition?.staffNote)}</td></tr>
    <tr><th>体調不良のサイン</th><td>${(mental.badSignals?.signs || []).join('、')}</td><th>起こりやすい時</th><td>${(mental.badSignals?.triggers || []).join('、')}</td></tr>
    <tr><th>体調不良時の対処</th><td>${(mental.copingMethods?.methods || []).join('、')} ${v(mental.copingMethods?.other)}</td><th>支援者追記</th><td>${v(mental.copingMethods?.staffNote)}</td></tr>
    <tr><th>相談相手</th><td>${v(mental.consultation?.partner)} ${v(mental.consultation?.name)}</td><th>支援者追記</th><td>${v(mental.consultation?.staffNote)}</td></tr>
    <tr><th>服薬</th><td colspan="3">${v(medication.status)} ${medication.times ? '1日' + medication.times + '回' : ''} ${(medication.timing || []).join('・')} / 管理:${v(medication.management)} / 状況:${v(medication.adherence)}</td></tr>
  </tbody></table>`;

  // ===== ページ6: 行動について =====
  html += pb();
  html += header('アセスメントシート（行動面）', clientName);
  html += `<table><thead><tr><th width="14%">項目</th><th width="12%">状態</th><th width="25%">本人コメント</th><th>支援者追記</th></tr></thead><tbody>`;
  const BEHAVIOR_LABELS = {
    panic: 'パニック', obsession: 'こだわり', compulsion: '強迫行為・強迫観念',
    hallucination: '幻覚・妄想', seizure: '発作', other: 'その他'
  };
  Object.entries(BEHAVIOR_LABELS).forEach(([key, label]) => {
    const item = beh[key] || {};
    html += `<tr>
      <td style="text-align:center;font-weight:bold">${label}</td>
      <td style="text-align:center">${v(item.status)}<br>${(item.coping || []).join('、')}</td>
      <td style="white-space:pre-wrap;vertical-align:top">${v(item.selfComment)}</td>
      <td style="white-space:pre-wrap;vertical-align:top">${v(item.staffNote)}</td>
    </tr>`;
  });
  html += `</tbody></table>`;
  html += `<div style="margin-top:8px;border:1px solid #000;min-height:60px;padding:4px 6px;white-space:pre-wrap"><strong>特記事項：</strong>${v(beh.behaviorNotes)}</div>`;

  return html;
};

// =========================================
// 印刷ウィンドウを開く（ClientPrintPage と同じ方式）
// =========================================
const openPrintWindow = (bodyHTML, title) => {
  const html = `<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8"><title>${title}</title><style>${PRINT_CSS}</style></head><body>${bodyHTML}</body></html>`;
  const w = window.open('', '_blank', 'width=900,height=700');
  if (w) {
    w.document.write(html);
    w.document.close();
    setTimeout(() => w.print(), 500);
  } else {
    alert('ポップアップがブロックされました。ブラウザのポップアップ許可設定を確認してください。');
  }
};

// =========================================
// React コンポーネント
// =========================================
export default function AssessmentPrintPage() {
  const { clientId } = useParams();
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const ref = doc(db, 'assessments', clientId);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setAssessment({ id: snap.id, ...snap.data() });
      }
      setLoading(false);
    };
    load();
  }, [clientId]);

  // データロード後に自動で印刷ウィンドウを開く
  useEffect(() => {
    if (!loading && assessment) {
      const title = `アセスメント - ${assessment.clientName || ''}`;
      openPrintWindow(generateAssessmentHTML(assessment.data || {}, assessment.clientName || ''), title);
    }
  }, [loading, assessment]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!assessment) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography color="error">アセスメントが見つかりません。</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: 2 }}>
      <Typography variant="h6">{assessment.clientName} - アセスメント</Typography>
      <Typography color="text.secondary">印刷ダイアログが開きます。閉じた場合は下のボタンで再度開けます。</Typography>
      <Button
        variant="contained"
        startIcon={<PrintIcon />}
        onClick={() => openPrintWindow(
          generateAssessmentHTML(assessment.data || {}, assessment.clientName || ''),
          `アセスメント - ${assessment.clientName || ''}`
        )}
      >
        印刷ダイアログを開く
      </Button>
    </Box>
  );
}
