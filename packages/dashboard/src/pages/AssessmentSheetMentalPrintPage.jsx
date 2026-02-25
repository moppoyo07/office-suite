import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Box, Typography, Button, CircularProgress, Alert } from '@mui/material';
import { Print } from '@mui/icons-material';

// =========================================
// 印刷用HTML生成
// =========================================
const generateMentalPrintHTML = (client) => {
    const formatDateOrText = (val) => {
        if (!val) return '';
        if (typeof val === 'string') return val;
        if (val?.seconds) return new Date(val.seconds * 1000).toLocaleDateString('ja-JP');
        if (val?.toDate) return val.toDate().toLocaleDateString('ja-JP');
        return String(val);
    };

    const buildCopingMethods = () => {
        const items = [];
        if (client.coping_hospital) items.push('病院を受診する');
        if (client.coping_medication) items.push('薬で対処する');
        if (client.coping_rest) items.push('休む');
        if (client.coping_talk) items.push('人に話す');
        if (client.coping_exercise) items.push('体を動かす');
        if (client.coping_sleep) items.push('寝る');
        if (client.coping_other_text) items.push(`その他: ${client.coping_other_text}`);
        if (items.length === 0 && client.coping_methods?.length) return client.coping_methods.join(', ');
        return items.join(', ') || '-';
    };

    const buildConsultationPartner = () => {
        const items = [];
        if (client.consult_family) items.push('家族');
        if (client.consult_doctor) items.push('主治医');
        if (client.consult_supporter) items.push('支援者');
        if (client.consult_friend) items.push('友人');
        if (client.consult_welfare) items.push('福祉事業所');
        if (client.consult_other_text) items.push(`その他: ${client.consult_other_text}`);
        if (client.consult_none) items.push('いない');
        if (items.length === 0 && client.consultation_partner) return client.consultation_partner;
        return items.join(', ') || '-';
    };

    const buildHospitalInfo = () => {
        const items = [];
        if (client.current_hospital_status === 'yes') {
            items.push('通院中');
            if (client.current_hospital_freq) items.push(client.current_hospital_freq);
            if (client.current_hospital_duration) items.push(`(${client.current_hospital_duration})`);
        } else if (client.current_hospital_status === 'no') {
            items.push('通院していない');
        } else {
            if (client.current_hospital_freq) items.push(client.current_hospital_freq);
        }
        return items.join(' ') || '-';
    };

    const behaviorItems = [
        { id: 'panic', label: 'パニック' },
        { id: 'obsession', label: 'こだわり' },
        { id: 'compulsion', label: '強迫' },
        { id: 'hallucination', label: '幻覚・妄想' },
        { id: 'seizure', label: '発作' },
        { id: 'other', label: 'その他' },
    ];

    let behaviorRows = '';
    behaviorItems.forEach(item => {
        const isYes = client[`behavior_${item.id}_check`] === 'yes';
        const status = isYes ? 'あり' : client[`behavior_${item.id}_check`] === 'no' ? 'なし' : '-';

        let selfCoping = '';
        if (isYes) {
            if (client[`behavior_${item.id}_coping_self`]) selfCoping += '[自己対処あり]<br>';
            selfCoping += client[`behavior_${item.id}_comment_self`] || '';
        }

        let othersCoping = '';
        if (isYes) {
            if (client[`behavior_${item.id}_coping_others`]) othersCoping += '[周囲対処あり]<br>';
            othersCoping += client[`behavior_${item.id}_comment_others`] || '';
        }

        const staffNote = client[`behavior_${item.id}_staff_note`] || '';
        const highlight = isYes && !staffNote ? 'background-color:#fff8e1;' : '';

        behaviorRows += `
            <tr>
                <td style="text-align:center;font-weight:bold">${item.label}</td>
                <td style="text-align:center">${status}</td>
                <td>${selfCoping}</td>
                <td>${othersCoping}</td>
                <td style="${highlight}">${staffNote}</td>
            </tr>`;
    });

    const symptomStatus = client.symptom_status === 'stable' ? '安定している' :
        client.symptom_status === 'active' ? '症状がある' : '-';
    const symptomDetail = client.symptom_status === 'active' && client.symptom_detail ? ` (${client.symptom_detail})` : '';

    const medStatus = client.medication_status === 'yes'
        ? `あり (1日 ${client.medication_times || ''} 回 / タイミング: ${client.medication_timing?.join(', ') || ''})`
        : client.medication_status === 'no' ? 'なし' : '-';

    const sideEffects = client.side_effects === 'yes'
        ? `あり (${client.side_effects_detail || ''})`
        : client.side_effects === 'no' ? 'なし' : '-';

    const medManagement = client.medication_management === 'self' ? '自己管理' :
        client.medication_management === 'family' ? '家族管理' : client.medication_management || '-';

    const medAdherence = client.medication_adherence === 'good' ? '飲み忘れがない' :
        client.medication_adherence === 'poor' ? '飲み忘れがある' :
            client.medication_adherence === 'adjusting' ? '調整中' :
                client.medication_adherence || '-';

    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>アセスメントシート(精神) - ${client.name || ''}</title>
    <style>
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
    </style>
</head>
<body>
    <!-- ページ1: 精神・医療情報 -->
    <div class="header-row">
        <h2>アセスメントシート (精神・医療)</h2>
        <div class="date-box">記入日: 西暦　　年　　月　　日</div>
    </div>

    <div class="sec-title">基本情報・医療</div>
    <table>
        <tr><th style="width:20%">氏名</th><td style="width:80%">${client.name || ''}</td></tr>
        <tr><th>障害特性(症状)</th><td>${client.disability_characteristics || '-'}</td></tr>
        <tr><th>発症時期</th><td>${formatDateOrText(client.onset_date)}${client.onset_trigger ? ' (きっかけ: ' + client.onset_trigger + ')' : ''}</td></tr>
        <tr><th>初診時期</th><td>${formatDateOrText(client.diagnosis_date)}</td></tr>
        <tr><th>入院歴</th><td>${client.hospitalization_history === 'yes' ? 'あり' : client.hospitalization_history === 'no' ? 'なし' : '-'}</td></tr>
        <tr><th>現在の通院</th><td>${buildHospitalInfo()}</td></tr>
    </table>

    <div class="sec-title">症状の把握</div>
    <table>
        <tr><th style="width:20%">現在の状態</th><td style="width:80%">${symptomStatus}${symptomDetail}</td></tr>
        <tr><th>不調時のサイン</th><td>${client.symptoms_checklist?.join(', ') || '-'}</td></tr>
        <tr><th>症状が出る時</th><td>${client.symptom_triggers?.join(', ') || '-'}${client.symptom_trigger_other ? ' (' + client.symptom_trigger_other + ')' : ''}</td></tr>
    </table>

    <div class="sec-title">対処法・相談体制</div>
    <table>
        <tr><th style="width:20%">体調不良時の対処</th><td style="width:80%">${buildCopingMethods()}</td></tr>
        <tr><th>相談相手</th><td>${buildConsultationPartner()}</td></tr>
    </table>

    <!-- ページ2: 行動面・服薬 -->
    <div class="page-break"></div>
    <div class="header-row">
        <h2>アセスメントシート (行動面・服薬)</h2>
        <div class="date-box">記入日: 西暦　　年　　月　　日</div>
    </div>

    <div class="sec-title">服薬管理</div>
    <table>
        <tr><th style="width:20%">服薬の有無</th><td style="width:80%">${medStatus}</td></tr>
        <tr><th>副作用</th><td>${sideEffects}</td></tr>
        <tr><th>管理方法</th><td>${medManagement}</td></tr>
        <tr><th>服薬状況</th><td>${medAdherence}</td></tr>
    </table>

    <div class="sec-title">行動面の課題</div>
    <table>
        <thead>
            <tr>
                <th style="width:12%">項目</th>
                <th style="width:8%">有無</th>
                <th style="width:25%">本人の対処</th>
                <th style="width:25%">周囲の対処</th>
                <th style="width:30%">支援員コメント</th>
            </tr>
        </thead>
        <tbody>${behaviorRows}</tbody>
    </table>

    <div class="sec-title">特記事項</div>
    <div style="border:1px solid #000;min-height:80px;padding:6px;white-space:pre-wrap">${client.behavior_notes || ''}</div>

</body>
</html>`;
};

// =========================================
// React コンポーネント
// =========================================
export default function AssessmentSheetMentalPrintPage() {
    const { clientId } = useParams();
    const [client, setClient] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchClient = async () => {
            if (!clientId) return;
            try {
                const docRef = doc(db, 'clients', clientId);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setClient(docSnap.data());
                }
            } finally {
                setLoading(false);
            }
        };
        fetchClient();
    }, [clientId]);

    // 行動面 - 未記入アラート
    const behaviorItems = [
        { id: 'panic', label: 'パニック' },
        { id: 'obsession', label: 'こだわり' },
        { id: 'compulsion', label: '強迫' },
        { id: 'hallucination', label: '幻覚・妄想' },
        { id: 'seizure', label: '発作' },
        { id: 'other', label: 'その他' },
    ];

    const missingStaffNotes = client ? behaviorItems.filter(item =>
        client[`behavior_${item.id}_check`] === 'yes' &&
        !client[`behavior_${item.id}_staff_note`]
    ) : [];

    const handlePrint = () => {
        if (!client) return;
        const html = generateMentalPrintHTML(client);
        const printWindow = window.open('', '_blank', 'width=900,height=700');
        if (printWindow) {
            printWindow.document.write(html);
            printWindow.document.close();
            setTimeout(() => { printWindow.print(); }, 500);
        } else {
            alert('ポップアップがブロックされました。ポップアップを許可してください。');
        }
    };

    if (loading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}><CircularProgress /></Box>;
    }

    if (!client) {
        return <Typography sx={{ p: 4 }}>データが見つかりません</Typography>;
    }

    return (
        <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h5" sx={{ mb: 2 }}>
                アセスメントシート (精神・医療) - {client.name}
            </Typography>

            {missingStaffNotes.length > 0 && (
                <Alert severity="warning" sx={{ maxWidth: 600, mx: 'auto', mb: 2, textAlign: 'left' }}>
                    <strong>支援員コメント未記入の項目があります</strong><br />
                    {missingStaffNotes.map(i => i.label).join('、')} の行動面で支援員コメントが未入力です。
                </Alert>
            )}

            <Button
                variant="contained"
                color="success"
                size="large"
                startIcon={<Print />}
                onClick={handlePrint}
                sx={{ fontSize: '16pt', px: 6, py: 2 }}
            >
                印刷する
            </Button>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                ボタンをクリックすると新しいウィンドウで印刷プレビューが開きます
            </Typography>
        </Box>
    );
}
