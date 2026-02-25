// src/pages/ClientPrintPage.jsx
// 全帳票一括印刷ページ: フェイスシート + アセスメント様式1・2 + 精神・医療
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Box, Typography, Button, CircularProgress, Paper, Stack } from '@mui/material';
import { Print, ArrowBack } from '@mui/icons-material';

// =========================================
// 共通CSS
// =========================================
const COMMON_CSS = `
    @page { size: A4 portrait; margin: 10mm; }
    body {
        font-family: 'Hiragino Kaku Gothic ProN', 'Meiryo', sans-serif;
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
    }
    th { background-color: #f0f0f0; font-weight: bold; text-align: center; }
    .sec-title {
        background-color: #000;
        color: #fff;
        padding: 3px 8px;
        font-weight: bold;
        font-size: 10pt;
        margin: 4px 0 0 0;
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
    .page-break { page-break-before: always; }
    .note { font-size: 7pt; margin-bottom: 6px; }
`;

// =========================================
// フェイスシートHTML
// =========================================
const generateFaceSheetHTML = (client) => {
    const formatDate = (date) => {
        if (!date) return '';
        const d = date.toDate ? date.toDate() : new Date(date);
        return d.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' });
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
    const getDisabilities = () => {
        const t = [];
        if (client.disability_mental) t.push('精神');
        if (client.disability_intellectual) t.push('知的');
        if (client.disability_physical) t.push('身体');
        if (client.disability_developmental) t.push('発達');
        if (client.disability_rare) t.push('難病');
        return t.join(', ') || '-';
    };
    const getCerts = () => {
        const c = [];
        if (client.cert_mental_grade) c.push(`精神 ${client.cert_mental_grade}級${client.cert_mental_date ? ' (' + client.cert_mental_date + ')' : ''}`);
        if (client.cert_intellectual_grade) c.push(`療育 ${client.cert_intellectual_grade}${client.cert_intellectual_date ? ' (' + client.cert_intellectual_date + ')' : ''}`);
        if (client.cert_physical_grade) c.push(`身体 ${client.cert_physical_grade}${client.cert_physical_date ? ' (' + client.cert_physical_date + ')' : ''}`);
        if (client.cert_none) c.push(`なし${client.cert_none_status ? '（' + client.cert_none_status + '）' : ''}`);
        return c.join(' / ') || '-';
    };
    const genderLabel = client.gender === 'male' ? '男性' : client.gender === 'female' ? '女性' : 'その他';
    const bloodTypeLabel = client.bloodType ? `${client.bloodType}型` : '';
    const transportLabel = (route) => {
        if (!route) return '';
        const noteMap = { bus: 'バス', train: '電車', other: 'その他' };
        return route.note || noteMap[route.type] || route.type || '';
    };
    let commuteRows = '';
    if (client.commuteRoutes?.length > 0) {
        commuteRows = client.commuteRoutes.map((r, i) => `<tr><td style="text-align:center">${i + 1}</td><td>${transportLabel(r)}${r.company ? ' (' + r.company + ')' : ''}</td><td>${r.from || ''} ～ ${r.to || ''}</td><td style="text-align:right">${r.cost ? Number(r.cost).toLocaleString() + '円' : '-'}</td><td style="text-align:right">${r.costDiscounted ? Number(r.costDiscounted).toLocaleString() + '円' : '-'}</td><td style="text-align:center">${r.paymentMethod === 'pass' ? '定期' : '日額'}</td></tr>`).join('');
    } else {
        commuteRows = '<tr><td colspan="6" style="text-align:center;color:#999">経路情報なし</td></tr>';
    }
    let emergencyRows = '';
    for (let i = 1; i <= 3; i++) {
        emergencyRows += `<tr><td style="text-align:center;width:3%">${i}</td><th style="width:8%">氏名</th><td style="width:25%">${client[`emergency_name_${i}`] || ''}</td><th style="width:8%">続柄</th><td style="width:15%">${client[`emergency_rel_${i}`] || ''}</td><th style="width:10%">電話番号</th><td style="width:31%">${client[`emergency_phone_${i}`] || ''}</td></tr>`;
    }
    let medicalRows = '';
    for (let i = 1; i <= 2; i++) {
        medicalRows += `<tr><td rowspan="2" style="text-align:center;vertical-align:middle;width:3%">${i}</td><th style="width:8%">病院名</th><td style="width:30%">${client[`medical_name_${i}`] || ''}</td><th style="width:8%">所在地</th><td style="width:20%">${client[`medical_address_${i}`] || ''}</td><th style="width:10%">電話番号</th><td style="width:21%">${client[`medical_phone_${i}`] || ''}</td></tr><tr><th>受診科目</th><td>${client[`medical_dept_${i}`] || ''}</td><th>担当医</th><td>${client[`medical_doctor_${i}`] || ''}</td><th>通院頻度</th><td>${client[`medical_freq_${i}`] || ''}</td></tr>`;
    }
    let familyRows = '';
    for (let i = 1; i <= 6; i++) {
        const name = client[`family_name_${i}`];
        if (!name) continue;
        familyRows += `<tr><td style="text-align:center">${i}</td><td>${name}</td><td>${client[`family_rel_${i}`] || ''}</td><td style="text-align:center">${client[`family_living_${i}`] || ''}</td><td>${client[`family_note_${i}`] || ''}</td></tr>`;
    }
    let welfareOtherRows = '';
    for (let i = 1; i <= 2; i++) {
        welfareOtherRows += `<tr><td style="text-align:center;width:3%">${i}</td><th style="width:10%">事業所名</th><td style="width:35%">${client[`welfare_other_name_${i}`] || ''}</td><th style="width:8%">種別</th><td style="width:13%">${client[`welfare_other_type_${i}`] || ''}</td><th style="width:8%">担当</th><td style="width:23%">${client[`welfare_other_person_${i}`] || ''}</td></tr>`;
    }

    // 非常災害時
    const q1Answer = (() => { let s = client.emergency_physical || '-'; if (client.emergency_physical === 'ある' && client.emergency_physical_detail) s += `（${client.emergency_physical_detail}）`; return s; })();
    const q1Coping = (() => { if (client.emergency_physical !== 'ある') return ''; const items = []; if (client.emergency_physical_coping?.length) items.push(client.emergency_physical_coping.join(', ')); if (client.emergency_physical_coping_other) items.push(client.emergency_physical_coping_other); return items.join('、'); })();
    const q2Answer = (() => { let s = client.emergency_seizure || '-'; if (client.emergency_seizure && client.emergency_seizure !== '特にない' && client.emergency_seizure_detail) s += `（${client.emergency_seizure_detail}）`; return s; })();
    const q2Coping = (() => { if (!client.emergency_seizure || client.emergency_seizure === '特にない') return ''; const items = []; if (client.emergency_seizure_coping?.length) items.push(client.emergency_seizure_coping.join(', ')); if (client.emergency_seizure_coping_other) items.push(client.emergency_seizure_coping_other); return items.join('、'); })();
    const q3Has = client.emergency_harm_past === 'ある' || client.emergency_harm_present === 'ある';
    const q3Answer = `過去: ${client.emergency_harm_past || '-'}<br>現在: ${client.emergency_harm_present || '-'}${q3Has && client.emergency_harm_detail ? '（' + client.emergency_harm_detail + '）' : ''}`;
    const q3Coping = (() => { if (!q3Has) return ''; const p = []; if (client.emergency_harm_consult?.length) p.push('相談先: ' + client.emergency_harm_consult.join(', ')); if (client.emergency_harm_action?.length) p.push('対処: ' + client.emergency_harm_action.join(', ')); if (client.emergency_harm_overcome) p.push('乗り越え方: ' + client.emergency_harm_overcome); return p.join('<br>'); })();
    const q4Has = client.emergency_suicidal_past === 'ある' || client.emergency_suicidal_present === 'ある';
    const q4Answer = `過去: ${client.emergency_suicidal_past || '-'}<br>現在: ${client.emergency_suicidal_present || '-'}${q4Has && client.emergency_suicidal_detail ? '（' + client.emergency_suicidal_detail + '）' : ''}`;
    const q4Coping = (() => { if (!q4Has) return ''; const p = []; if (client.emergency_suicidal_consult?.length) p.push('相談先: ' + client.emergency_suicidal_consult.join(', ')); if (client.emergency_suicidal_action?.length) p.push('対処: ' + client.emergency_suicidal_action.join(', ')); if (client.emergency_suicidal_overcome) p.push('乗り越え方: ' + client.emergency_suicidal_overcome); return p.join('<br>'); })();

    return `
    <!-- フェイスシート ページ1 -->
    <div class="header-row"><h2>フェイスシート</h2><div class="date-box">記入日：西暦　　年　　月　　日</div></div>
    <p class="note">※非常災害時・危機対応に活用されるシートです。出来るかぎり詳細な記載にご協力下さい。</p>
    <div class="sec-title">基本情報</div>
    <table>
        <tr><th style="width:10%">ふりがな</th><td style="width:40%">${client.nameKana || ''}</td><th style="width:10%">生年月日</th><td style="width:40%">${formatDate(client.birthDate)} (${getAge(client.birthDate)}歳)</td></tr>
        <tr><th style="width:10%">氏名</th><td style="width:40%">${client.name || ''}</td><th style="width:10%">性別・血液型</th><td style="width:40%">${genderLabel}　/　${bloodTypeLabel}</td></tr>
        <tr><th>住所</th><td colspan="3" style="height:35px">〒${client.postalCode || ''}<br>${client.address || ''}</td></tr>
    </table>
    <table>
        <tr><th style="width:10%">電話番号</th><td style="width:40%">${client.phone || ''}</td><th style="width:10%" rowspan="2">メールアドレス</th><td style="width:40%" rowspan="2">${client.email || ''}</td></tr>
        <tr><th>携帯電話</th><td>${client.mobilePhone || '-'}</td></tr>
    </table>
    <table><thead><tr><th style="width:5%">No</th><th style="width:15%">交通機関</th><th style="width:30%">区間</th><th style="width:15%">片道運賃</th><th style="width:15%">割引運賃</th><th style="width:20%">支払方式</th></tr></thead><tbody>${commuteRows}</tbody></table>
    <div class="sec-title">連絡先等</div>
    <p style="font-size:7pt;margin:2px 0">緊急連絡先</p>
    <table><tbody>${emergencyRows}</tbody></table>
    <p style="font-weight:bold;font-size:9pt;margin:6px 0 2px">かかりつけ医療機関</p>
    <table><tbody>${medicalRows}</tbody></table>
    <p style="font-weight:bold;font-size:9pt;margin:6px 0 2px">相談支援事業所</p>
    <table><tbody><tr><td style="width:3%;text-align:center">4</td><th style="width:10%">事業所名</th><td style="width:35%">${client.welfare_support_office || ''}</td><th style="width:8%">担当</th><td style="width:20%">${client.welfare_support_person || ''}</td><th style="width:10%">電話</th><td style="width:14%">${client.welfare_support_phone || ''}</td></tr></tbody></table>
    <p style="font-weight:bold;font-size:9pt;margin:6px 0 2px">福祉サービス・登録機関等</p>
    <table><tbody>${welfareOtherRows}</tbody></table>
    <p style="font-weight:bold;font-size:9pt;margin:6px 0 2px">行政窓口</p>
    <table><tbody>
        <tr><td style="width:3%;text-align:center">1</td><td style="width:20%">${client.admin_city_name || ''}</td><td style="width:25%">${client.admin_city_section || ''} 課・係</td><th style="width:8%">担当</th><td style="width:15%">${client.admin_city_person || ''}</td><th style="width:10%">電話</th><td style="width:19%">${client.admin_city_phone || ''}</td></tr>
        <tr><td style="text-align:center">2</td><td>管轄ハローワーク</td><td>${client.hello_work_status === 'registered' ? '登録済' : '未登録'}</td><th>担当</th><td>${client.hello_work_person || ''}</td><th>電話</th><td>${client.hello_work_phone || ''}</td></tr>
    </tbody></table>

    <!-- フェイスシート ページ2 -->
    <div class="page-break"></div>
    <div class="header-row"><h2>フェイスシート (2)</h2><div style="font-size:10pt">${client.name || ''}</div></div>
    <div class="sec-title">家族構成</div>
    <table><thead><tr><th style="width:5%">No</th><th style="width:25%">氏名</th><th style="width:15%">続柄</th><th style="width:15%">同居</th><th style="width:40%">備考</th></tr></thead><tbody>${familyRows || '<tr><td colspan="5" style="text-align:center">-</td></tr>'}</tbody></table>
    <div class="sec-title">経済状況</div>
    <table><tbody>
        <tr><th style="width:12%">生活保護</th><td style="width:38%">${client.welfare_protection_status || '-'}${client.welfare_protection_amount ? ' ' + client.welfare_protection_amount + '円/月' : ''}</td><th style="width:12%">障害年金</th><td style="width:38%">${client.disability_pension_status || '-'}${client.disability_pension_type ? ' ' + client.disability_pension_type : ''}${client.disability_pension_grade ? ' ' + client.disability_pension_grade + '級' : ''}${client.disability_pension_amount ? ' ' + client.disability_pension_amount + '円/月' : ''}</td></tr>
        <tr><th>健康保険</th><td>${client.health_insurance_type || '-'}${client.health_insurance_holder ? ' (' + client.health_insurance_holder + ')' : ''}</td><th>自立支援医療</th><td>${client.self_support_medical || '-'}</td></tr>
    </tbody></table>
    <div class="sec-title">障害・疾病情報</div>
    <table><tbody>
        <tr><th style="width:12%">障害種別</th><td style="width:38%">${getDisabilities()}</td><th style="width:12%">診断名</th><td style="width:38%">${client.diagnosis_name || '-'}</td></tr>
        <tr><th>合併障害</th><td>${client.comorbidity || '-'}</td><th>障害者手帳</th><td>${getCerts()}</td></tr>
    </tbody></table>
    <div class="sec-title">非常災害時・危機対応</div>
    <table><thead><tr><th style="width:35%">質問</th><th style="width:25%">ご回答</th><th style="width:40%">対処法</th></tr></thead><tbody>
        <tr><td style="font-weight:bold">非常災害時、身体面や体調面で心配なこと</td><td>${q1Answer}</td><td>${q1Coping}</td></tr>
        <tr><td style="font-weight:bold">発作はありますか</td><td>${q2Answer}</td><td>${q2Coping}</td></tr>
        <tr><td style="font-weight:bold">自傷・他害の心配</td><td>${q3Answer}</td><td>${q3Coping}</td></tr>
        <tr><td style="font-weight:bold">自殺念慮の有無</td><td>${q4Answer}</td><td>${q4Coping}</td></tr>
    </tbody></table>
    <p style="font-weight:bold;font-size:9pt;margin:6px 0 2px">特記事項</p>
    <div style="border:1px solid #000;min-height:50px;padding:6px;white-space:pre-wrap">${client.emergency_general_note || ''}</div>
    `;
};

// =========================================
// アセスメント様式1 HTML
// =========================================
const generateSheet1HTML = (client) => {
    const housingLabel = (v) => ({ owned: '持ち家', rented: '借家', public: '公営住宅', group_home: 'グループホーム', other: 'その他' }[v] || v || '-');
    const roomLabel = (v) => ({ private: '専用（個室）', shared: '兼用（相部屋）', none: 'なし' }[v] || v || '-');
    const beddingLabel = (v) => ({ bed: 'ベッド', futon: '布団', other: 'その他' }[v] || v || '-');
    const buildDaily = () => { const i = []; if (client.daily_wakeup) i.push('起床:' + client.daily_wakeup); if (client.daily_breakfast) i.push('朝食:' + client.daily_breakfast); if (client.daily_lunch) i.push('昼食:' + client.daily_lunch); if (client.daily_dinner) i.push('夕食:' + client.daily_dinner); if (client.daily_bath) i.push('入浴:' + client.daily_bath); if (client.daily_bedtime) i.push('就寝:' + client.daily_bedtime); if (client.daily_daytime) i.push('日中:' + client.daily_daytime); if (client.daily_schedule_note) i.push('メモ:' + client.daily_schedule_note); return i.join(' / ') || client.daily_schedule || '-'; };
    const buildWork = () => { const i = []; if (client.work_current_status?.length) i.push('現在: ' + client.work_current_status.join(', ')); if (client.work_exp_general) i.push('一般就労: ' + client.work_exp_general); if (client.work_exp_welfare) i.push('就労移行・継続: ' + client.work_exp_welfare); if (client.work_exp_recent) i.push('最近1年: ' + client.work_exp_recent); if (client.work_exp_interrupted) i.push('中断: ' + client.work_exp_interrupted); if (i.length === 0 && client.work_types?.length) return client.work_types.join(', '); return i.join('<br>') || '-'; };
    const buildHistory = () => { const i = []; if (client.work_history_main) i.push('主な就労先: ' + client.work_history_main); if (client.work_general_hope) i.push('一般就労希望: ' + client.work_general_hope); if (client.work_desired_job) i.push('希望する仕事: ' + client.work_desired_job); if (client.work_note) i.push('特記: ' + client.work_note); if (i.length === 0 && client.work_history) return client.work_history; return i.join('<br>') || '-'; };
    let admRows = '';
    if (client.past_admission === 'yes') { for (let i = 1; i <= 2; i++) { const s = client[`admission_start_${i}`]?.seconds ? new Date(client[`admission_start_${i}`].seconds * 1000).toLocaleDateString() : ''; const e = client[`admission_end_${i}`]?.seconds ? new Date(client[`admission_end_${i}`].seconds * 1000).toLocaleDateString() : ''; admRows += `<tr><td style="text-align:center">${s} ～ ${e}</td><td>${client[`admission_type_${i}`] || ''}</td></tr>`; } }

    return `
    <div class="page-break"></div>
    <div class="header-row"><h2>アセスメントシート (様式1 - 履歴・生活)</h2><div class="date-box">記入日: 西暦　　年　　月　　日</div></div>
    <div class="sec-title">本人情報</div>
    <table><tr><th style="width:20%">氏名</th><td style="width:80%">${client.name || ''}</td></tr></table>
    <div class="sec-title">社会参加（地域生活関連）</div>
    <table><tr><th style="width:20%">外出頻度</th><td>${client.outing_frequency || '-'}</td></tr><tr><th>主な外出先</th><td>${client.outing_places || '-'}</td></tr></table>
    <p style="font-weight:bold;margin:8px 0 2px">◆ 過去2年間の入所歴 (${client.past_admission === 'yes' ? 'あり' : 'なし'})</p>
    ${client.past_admission === 'yes' ? `<table><thead><tr><th style="width:30%">期間</th><th style="width:70%">施設</th></tr></thead><tbody>${admRows}</tbody></table>` : ''}
    <div class="sec-title">日中活動</div>
    <table><tr><th style="width:20%">主な活動場所</th><td>${client.activity_place?.join(', ') || '-'}</td></tr><tr><th>1日の様子</th><td>${buildDaily()}</td></tr></table>
    <div class="sec-title">居住関連</div>
    <table><tr><th style="width:20%">住居形態</th><td>${client.housing_type === 'other' ? 'その他: ' + (client.housing_type_other || '') : housingLabel(client.housing_type)}</td></tr><tr><th>本人の部屋</th><td>${roomLabel(client.room_type)}</td></tr><tr><th>寝具</th><td>${client.bedding_type === 'other' ? 'その他: ' + (client.bedding_type_other || '') : beddingLabel(client.bedding_type)}</td></tr><tr><th>同居者</th><td>${client.cohabitants || '-'}</td></tr></table>
    <div class="sec-title">就労関連</div>
    <table><tr><th style="width:20%">免許・資格</th><td>${client.qualifications || '-'}</td></tr><tr><th>就労経験</th><td>${buildWork()}</td></tr><tr><th>就労歴・希望</th><td>${buildHistory()}</td></tr></table>
    `;
};

// =========================================
// アセスメント様式2 HTML
// =========================================
const generateSheet2HTML = (client) => {
    const tdH = 'style="height:80px;vertical-align:top;white-space:pre-wrap"';
    return `
    <div class="page-break"></div>
    <div class="header-row"><h2>アセスメントシート (様式2 - 意向・好み)</h2><div class="date-box">記入日: 西暦　　年　　月　　日</div></div>
    <div class="sec-title">本人のご意向</div>
    <table>
        <tr><th style="width:25%">好きなこと・もの<br>(得意なこと)</th><td ${tdH}>${client.likes || ''}</td></tr>
        <tr><th>嫌いなこと・もの<br>(苦手なこと)</th><td ${tdH}>${client.dislikes || ''}</td></tr>
        <tr><th>希望する暮らし</th><td ${tdH}>${client.desired_lifestyle || ''}</td></tr>
        <tr><th>特に支援してほしいこと</th><td ${tdH}>${client.support_requests || ''}</td></tr>
        <tr><th>支援をする時に<br>気をつけてほしいこと</th><td ${tdH}>${client.support_precautions || ''}</td></tr>
        <tr><th>将来の夢や希望</th><td ${tdH}>${client.future_dreams || ''}</td></tr>
        <tr><th>その他</th><td ${tdH}>${client.preferences_other || ''}</td></tr>
    </table>
    `;
};

// =========================================
// 精神・医療 HTML
// =========================================
const generateMentalHTML = (client) => {
    const fmt = (v) => { if (!v) return ''; if (typeof v === 'string') return v; if (v?.seconds) return new Date(v.seconds * 1000).toLocaleDateString('ja-JP'); if (v?.toDate) return v.toDate().toLocaleDateString('ja-JP'); return String(v); };
    const copingMethods = (() => { const i = []; if (client.coping_hospital) i.push('病院を受診する'); if (client.coping_medication) i.push('薬で対処する'); if (client.coping_rest) i.push('休む'); if (client.coping_talk) i.push('人に話す'); if (client.coping_exercise) i.push('体を動かす'); if (client.coping_sleep) i.push('寝る'); if (client.coping_other_text) i.push('その他: ' + client.coping_other_text); if (i.length === 0 && client.coping_methods?.length) return client.coping_methods.join(', '); return i.join(', ') || '-'; })();
    const consultPartner = (() => { const i = []; if (client.consult_family) i.push('家族'); if (client.consult_doctor) i.push('主治医'); if (client.consult_supporter) i.push('支援者'); if (client.consult_friend) i.push('友人'); if (client.consult_welfare) i.push('福祉事業所'); if (client.consult_other_text) i.push('その他: ' + client.consult_other_text); if (client.consult_none) i.push('いない'); if (i.length === 0 && client.consultation_partner) return client.consultation_partner; return i.join(', ') || '-'; })();
    const hospitalInfo = (() => { const i = []; if (client.current_hospital_status === 'yes') { i.push('通院中'); if (client.current_hospital_freq) i.push(client.current_hospital_freq); if (client.current_hospital_duration) i.push('(' + client.current_hospital_duration + ')'); } else if (client.current_hospital_status === 'no') { i.push('通院していない'); } else { if (client.current_hospital_freq) i.push(client.current_hospital_freq); } return i.join(' ') || '-'; })();
    const symptomStatus = client.symptom_status === 'stable' ? '安定している' : client.symptom_status === 'active' ? '症状がある' : '-';
    const symptomDetail = client.symptom_status === 'active' && client.symptom_detail ? ' (' + client.symptom_detail + ')' : '';
    const medStatus = client.medication_status === 'yes' ? `あり (1日 ${client.medication_times || ''} 回 / タイミング: ${client.medication_timing?.join(', ') || ''})` : client.medication_status === 'no' ? 'なし' : '-';
    const sideEff = client.side_effects === 'yes' ? `あり (${client.side_effects_detail || ''})` : client.side_effects === 'no' ? 'なし' : '-';
    const medMgmt = client.medication_management === 'self' ? '自己管理' : client.medication_management === 'family' ? '家族管理' : client.medication_management || '-';
    const medAdh = client.medication_adherence === 'good' ? '飲み忘れがない' : client.medication_adherence === 'poor' ? '飲み忘れがある' : client.medication_adherence === 'adjusting' ? '調整中' : client.medication_adherence || '-';

    const behaviorItems = [{ id: 'panic', label: 'パニック' }, { id: 'obsession', label: 'こだわり' }, { id: 'compulsion', label: '強迫' }, { id: 'hallucination', label: '幻覚・妄想' }, { id: 'seizure', label: '発作' }, { id: 'other', label: 'その他' }];
    let behaviorRows = '';
    behaviorItems.forEach(item => {
        const isYes = client[`behavior_${item.id}_check`] === 'yes';
        const status = isYes ? 'あり' : client[`behavior_${item.id}_check`] === 'no' ? 'なし' : '-';
        let selfC = ''; if (isYes) { if (client[`behavior_${item.id}_coping_self`]) selfC += '[自己対処あり]<br>'; selfC += client[`behavior_${item.id}_comment_self`] || ''; }
        let othersC = ''; if (isYes) { if (client[`behavior_${item.id}_coping_others`]) othersC += '[周囲対処あり]<br>'; othersC += client[`behavior_${item.id}_comment_others`] || ''; }
        const note = client[`behavior_${item.id}_staff_note`] || '';
        const hl = isYes && !note ? 'background-color:#fff8e1;' : '';
        behaviorRows += `<tr><td style="text-align:center;font-weight:bold">${item.label}</td><td style="text-align:center">${status}</td><td>${selfC}</td><td>${othersC}</td><td style="${hl}">${note}</td></tr>`;
    });

    return `
    <div class="page-break"></div>
    <div class="header-row"><h2>アセスメントシート (精神・医療)</h2><div class="date-box">記入日: 西暦　　年　　月　　日</div></div>
    <div class="sec-title">基本情報・医療</div>
    <table>
        <tr><th style="width:20%">氏名</th><td style="width:80%">${client.name || ''}</td></tr>
        <tr><th>障害特性(症状)</th><td>${client.disability_characteristics || '-'}</td></tr>
        <tr><th>発症時期</th><td>${fmt(client.onset_date)}${client.onset_trigger ? ' (きっかけ: ' + client.onset_trigger + ')' : ''}</td></tr>
        <tr><th>初診時期</th><td>${fmt(client.diagnosis_date)}</td></tr>
        <tr><th>入院歴</th><td>${client.hospitalization_history === 'yes' ? 'あり' : client.hospitalization_history === 'no' ? 'なし' : '-'}</td></tr>
        <tr><th>現在の通院</th><td>${hospitalInfo}</td></tr>
    </table>
    <div class="sec-title">症状の把握</div>
    <table>
        <tr><th style="width:20%">現在の状態</th><td>${symptomStatus}${symptomDetail}</td></tr>
        <tr><th>不調時のサイン</th><td>${client.symptoms_checklist?.join(', ') || '-'}</td></tr>
        <tr><th>症状が出る時</th><td>${client.symptom_triggers?.join(', ') || '-'}${client.symptom_trigger_other ? ' (' + client.symptom_trigger_other + ')' : ''}</td></tr>
    </table>
    <div class="sec-title">対処法・相談体制</div>
    <table>
        <tr><th style="width:20%">体調不良時の対処</th><td>${copingMethods}</td></tr>
        <tr><th>相談相手</th><td>${consultPartner}</td></tr>
    </table>

    <!-- 行動面・服薬 -->
    <div class="page-break"></div>
    <div class="header-row"><h2>アセスメントシート (行動面・服薬)</h2><div class="date-box">記入日: 西暦　　年　　月　　日</div></div>
    <div class="sec-title">服薬管理</div>
    <table>
        <tr><th style="width:20%">服薬の有無</th><td>${medStatus}</td></tr>
        <tr><th>副作用</th><td>${sideEff}</td></tr>
        <tr><th>管理方法</th><td>${medMgmt}</td></tr>
        <tr><th>服薬状況</th><td>${medAdh}</td></tr>
    </table>
    <div class="sec-title">行動面の課題</div>
    <table>
        <thead><tr><th style="width:12%">項目</th><th style="width:8%">有無</th><th style="width:25%">本人の対処</th><th style="width:25%">周囲の対処</th><th style="width:30%">支援員コメント</th></tr></thead>
        <tbody>${behaviorRows}</tbody>
    </table>
    <div class="sec-title">特記事項</div>
    <div style="border:1px solid #000;min-height:80px;padding:6px;white-space:pre-wrap">${client.behavior_notes || ''}</div>
    `;
};

// =========================================
// React コンポーネント
// =========================================
export default function ClientPrintPage() {
    const { clientId } = useParams();
    const navigate = useNavigate();
    const [client, setClient] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchClient = async () => {
            if (!clientId) return;
            try {
                const docRef = doc(db, 'clients', clientId);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) setClient(docSnap.data());
            } finally {
                setLoading(false);
            }
        };
        fetchClient();
    }, [clientId]);

    const openPrint = (bodyHTML, title) => {
        const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${title}</title><style>${COMMON_CSS}</style></head><body>${bodyHTML}</body></html>`;
        const w = window.open('', '_blank', 'width=900,height=700');
        if (w) { w.document.write(html); w.document.close(); setTimeout(() => w.print(), 500); }
        else alert('ポップアップがブロックされました。ポップアップを許可してください。');
    };

    const handlePrintAll = () => {
        if (!client) return;
        const allHTML = generateFaceSheetHTML(client)
            + generateSheet1HTML(client)
            + generateSheet2HTML(client)
            + generateMentalHTML(client);
        openPrint(allHTML, `全帳票 - ${client.name}`);
    };

    const handlePrintFaceSheet = () => { if (!client) return; openPrint(generateFaceSheetHTML(client), `フェイスシート - ${client.name}`); };
    const handlePrintSheet1 = () => { if (!client) return; openPrint(generateSheet1HTML(client).replace('<div class="page-break"></div>', ''), `アセスメント様式1 - ${client.name}`); };
    const handlePrintSheet2 = () => { if (!client) return; openPrint(generateSheet2HTML(client).replace('<div class="page-break"></div>', ''), `アセスメント様式2 - ${client.name}`); };
    const handlePrintMental = () => { if (!client) return; openPrint(generateMentalHTML(client).replace(/<div class="page-break"><\/div>/, ''), `精神・医療 - ${client.name}`); };

    if (loading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}><CircularProgress /></Box>;
    }

    if (!client) {
        return <Typography sx={{ p: 4 }}>データが見つかりません</Typography>;
    }

    return (
        <Box sx={{ p: 3, maxWidth: '700px', mx: 'auto' }}>
            <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
                <Button startIcon={<ArrowBack />} onClick={() => navigate(-1)} variant="outlined" size="small">戻る</Button>
                <Typography variant="h5" fontWeight="bold">{client.name} - 帳票印刷</Typography>
            </Stack>

            {/* 一括印刷 */}
            <Paper sx={{ p: 3, mb: 3, textAlign: 'center', border: '2px solid', borderColor: 'success.main', borderRadius: 2 }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>📋 全帳票一括印刷</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    フェイスシート + アセスメント様式1・2 + 精神・医療 を一括で印刷します
                </Typography>
                <Button
                    variant="contained"
                    color="success"
                    size="large"
                    startIcon={<Print />}
                    onClick={handlePrintAll}
                    sx={{ fontSize: '14pt', px: 5, py: 1.5 }}
                >
                    全帳票を一括印刷
                </Button>
            </Paper>

            {/* 個別印刷 */}
            <Paper sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>個別印刷</Typography>
                <Stack spacing={1.5}>
                    <Button variant="outlined" startIcon={<Print />} onClick={handlePrintFaceSheet} fullWidth sx={{ justifyContent: 'flex-start', py: 1.2 }}>
                        フェイスシート（2ページ）
                    </Button>
                    <Button variant="outlined" startIcon={<Print />} onClick={handlePrintSheet1} fullWidth sx={{ justifyContent: 'flex-start', py: 1.2 }}>
                        アセスメントシート 様式1（履歴・生活）
                    </Button>
                    <Button variant="outlined" startIcon={<Print />} onClick={handlePrintSheet2} fullWidth sx={{ justifyContent: 'flex-start', py: 1.2 }}>
                        アセスメントシート 様式2（意向・好み）
                    </Button>
                    <Button variant="outlined" startIcon={<Print />} onClick={handlePrintMental} fullWidth sx={{ justifyContent: 'flex-start', py: 1.2 }}>
                        アセスメントシート 精神・医療（2ページ）
                    </Button>
                </Stack>
            </Paper>
        </Box>
    );
}
