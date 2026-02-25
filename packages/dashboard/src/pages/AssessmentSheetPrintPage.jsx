import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Box, Typography, Button, CircularProgress } from '@mui/material';
import { Print } from '@mui/icons-material';

// =========================================
// 印刷用HTML生成
// =========================================
const generateSheet1HTML = (client) => {
    const housingLabel = (val) => ({ owned: '持ち家', rented: '借家', public: '公営住宅', group_home: 'グループホーム', other: 'その他' }[val] || val || '-');
    const roomLabel = (val) => ({ private: '専用（個室）', shared: '兼用（相部屋）', none: 'なし' }[val] || val || '-');
    const beddingLabel = (val) => ({ bed: 'ベッド', futon: '布団', other: 'その他' }[val] || val || '-');

    const buildDailySchedule = () => {
        const items = [];
        if (client.daily_wakeup) items.push(`起床: ${client.daily_wakeup}`);
        if (client.daily_breakfast) items.push(`朝食: ${client.daily_breakfast}`);
        if (client.daily_lunch) items.push(`昼食: ${client.daily_lunch}`);
        if (client.daily_dinner) items.push(`夕食: ${client.daily_dinner}`);
        if (client.daily_bath) items.push(`入浴: ${client.daily_bath}`);
        if (client.daily_bedtime) items.push(`就寝: ${client.daily_bedtime}`);
        if (client.daily_daytime) items.push(`日中: ${client.daily_daytime}`);
        if (client.daily_schedule_note) items.push(`メモ: ${client.daily_schedule_note}`);
        return items.join(' / ') || client.daily_schedule || '-';
    };

    const buildWorkExperience = () => {
        const items = [];
        if (client.work_current_status?.length) items.push(`現在: ${client.work_current_status.join(', ')}`);
        if (client.work_exp_general) items.push(`一般就労・アルバイト: ${client.work_exp_general}`);
        if (client.work_exp_welfare) items.push(`就労移行・継続支援: ${client.work_exp_welfare}`);
        if (client.work_exp_recent) items.push(`最近1年間: ${client.work_exp_recent}`);
        if (client.work_exp_interrupted) items.push(`中断: ${client.work_exp_interrupted}`);
        if (items.length === 0 && client.work_types?.length) return client.work_types.join(', ');
        return items.join('<br>') || '-';
    };

    const buildWorkHistory = () => {
        const items = [];
        if (client.work_history_main) items.push(`主な就労先: ${client.work_history_main}`);
        if (client.work_general_hope) items.push(`一般就労希望: ${client.work_general_hope}`);
        if (client.work_desired_job) items.push(`希望する仕事: ${client.work_desired_job}`);
        if (client.work_note) items.push(`特記事項: ${client.work_note}`);
        if (items.length === 0 && client.work_history) return client.work_history;
        return items.join('<br>') || '-';
    };

    let admissionRows = '';
    if (client.past_admission === 'yes') {
        for (let i = 1; i <= 2; i++) {
            const start = client[`admission_start_${i}`]?.seconds ? new Date(client[`admission_start_${i}`].seconds * 1000).toLocaleDateString() : '';
            const end = client[`admission_end_${i}`]?.seconds ? new Date(client[`admission_end_${i}`].seconds * 1000).toLocaleDateString() : '';
            admissionRows += `<tr><td style="text-align:center">${start} ～ ${end}</td><td>${client[`admission_type_${i}`] || ''}</td></tr>`;
        }
    }

    return `
    <div class="header-row">
        <h2>アセスメントシート (様式1 - 履歴・生活)</h2>
        <div class="date-box">記入日: 西暦　　年　　月　　日</div>
    </div>

    <div class="sec-title">本人情報</div>
    <table>
        <tr><th style="width:20%">氏名</th><td style="width:80%">${client.name || ''}</td></tr>
    </table>

    <div class="sec-title">社会参加（地域生活関連）</div>
    <table>
        <tr><th style="width:20%">外出頻度</th><td style="width:80%">${client.outing_frequency || '-'}</td></tr>
        <tr><th style="width:20%">主な外出先</th><td style="width:80%">${client.outing_places || '-'}</td></tr>
    </table>

    <p style="font-weight:bold;margin:8px 0 2px">◆ 過去2年間の入所歴 (${client.past_admission === 'yes' ? 'あり' : 'なし'})</p>
    ${client.past_admission === 'yes' ? `
    <table>
        <thead><tr><th style="width:30%">期間</th><th style="width:70%">施設の種類</th></tr></thead>
        <tbody>${admissionRows}</tbody>
    </table>` : ''}

    <div class="sec-title">日中活動</div>
    <table>
        <tr><th style="width:20%">主な活動場所</th><td style="width:80%">${client.activity_place?.join(', ') || '-'}</td></tr>
        <tr><th style="width:20%">1日の様子</th><td style="width:80%">${buildDailySchedule()}</td></tr>
    </table>

    <div class="sec-title">居住関連</div>
    <table>
        <tr><th style="width:20%">住居形態</th><td style="width:80%">${client.housing_type === 'other' ? 'その他: ' + (client.housing_type_other || '') : housingLabel(client.housing_type)}</td></tr>
        <tr><th style="width:20%">本人の部屋</th><td style="width:80%">${roomLabel(client.room_type)}</td></tr>
        <tr><th style="width:20%">寝具</th><td style="width:80%">${client.bedding_type === 'other' ? 'その他: ' + (client.bedding_type_other || '') : beddingLabel(client.bedding_type)}</td></tr>
        <tr><th style="width:20%">同居者</th><td style="width:80%">${client.cohabitants || '-'}</td></tr>
    </table>

    <div class="sec-title">就労関連</div>
    <table>
        <tr><th style="width:20%">免許・資格</th><td style="width:80%">${client.qualifications || '-'}</td></tr>
        <tr><th style="width:20%">就労経験</th><td style="width:80%">${buildWorkExperience()}</td></tr>
        <tr><th style="width:20%">就労歴・希望</th><td style="width:80%">${buildWorkHistory()}</td></tr>
    </table>`;
};

const generateSheet2HTML = (client) => {
    return `
    <div class="header-row">
        <h2>アセスメントシート (様式2 - 意向・好み)</h2>
        <div class="date-box">記入日: 西暦　　年　　月　　日</div>
    </div>

    <div class="sec-title">本人のご意向</div>
    <table>
        <tr>
            <th style="width:25%">好きなこと・もの<br>(得意なこと)</th>
            <td style="width:75%;height:90px;vertical-align:top;white-space:pre-wrap">${client.likes || ''}</td>
        </tr>
        <tr>
            <th style="width:25%">嫌いなこと・もの<br>(苦手なこと)</th>
            <td style="height:90px;vertical-align:top;white-space:pre-wrap">${client.dislikes || ''}</td>
        </tr>
        <tr>
            <th>希望する暮らし</th>
            <td style="height:90px;vertical-align:top;white-space:pre-wrap">${client.desired_lifestyle || ''}</td>
        </tr>
        <tr>
            <th>特に支援してほしいこと</th>
            <td style="height:90px;vertical-align:top;white-space:pre-wrap">${client.support_requests || ''}</td>
        </tr>
        <tr>
            <th>支援をする時に<br>気をつけてほしいこと</th>
            <td style="height:90px;vertical-align:top;white-space:pre-wrap">${client.support_precautions || ''}</td>
        </tr>
        <tr>
            <th>将来の夢や希望</th>
            <td style="height:90px;vertical-align:top;white-space:pre-wrap">${client.future_dreams || ''}</td>
        </tr>
        <tr>
            <th>その他</th>
            <td style="height:70px;vertical-align:top;white-space:pre-wrap">${client.preferences_other || ''}</td>
        </tr>
    </table>`;
};

const wrapInFullHTML = (title, bodyContent) => `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${title}</title>
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
    </style>
</head>
<body>
${bodyContent}
</body>
</html>`;

// =========================================
// React コンポーネント
// =========================================
export default function AssessmentSheetPrintPage() {
    const { clientId } = useParams();
    const [searchParams] = useSearchParams();
    const sheetType = searchParams.get('type') || 'sheet1';
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

    const handlePrint = () => {
        if (!client) return;
        const title = sheetType === 'sheet1'
            ? `アセスメントシート(様式1) - ${client.name}`
            : `アセスメントシート(様式2) - ${client.name}`;
        const body = sheetType === 'sheet1' ? generateSheet1HTML(client) : generateSheet2HTML(client);
        const html = wrapInFullHTML(title, body);

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
                {sheetType === 'sheet1' ? 'アセスメントシート (様式1 - 履歴)' : 'アセスメントシート (様式2 - 意向)'} - {client.name}
            </Typography>
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
