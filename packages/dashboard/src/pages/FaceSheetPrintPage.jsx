import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Box, Typography, Button, CircularProgress } from '@mui/material';
import { Print } from '@mui/icons-material';

// =========================================
// 印刷用HTML生成（新ウィンドウ印刷方式）
// =========================================
const generatePrintHTML = (client) => {
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
        const types = [];
        if (client.disability_mental) types.push('精神');
        if (client.disability_intellectual) types.push('知的');
        if (client.disability_physical) types.push('身体');
        if (client.disability_developmental) types.push('発達');
        if (client.disability_rare) types.push('難病');
        return types.join(', ') || '-';
    };

    const getCerts = () => {
        const certs = [];
        if (client.cert_mental_grade) certs.push(`精神 ${client.cert_mental_grade}級${client.cert_mental_date ? ' (' + client.cert_mental_date + ')' : ''}`);
        if (client.cert_intellectual_grade) certs.push(`療育 ${client.cert_intellectual_grade}${client.cert_intellectual_date ? ' (' + client.cert_intellectual_date + ')' : ''}`);
        if (client.cert_physical_grade) certs.push(`身体 ${client.cert_physical_grade}${client.cert_physical_date ? ' (' + client.cert_physical_date + ')' : ''}`);
        if (client.cert_none) certs.push(`なし${client.cert_none_status ? '（' + client.cert_none_status + '）' : ''}`);
        return certs.join(' / ') || '-';
    };

    const genderLabel = client.gender === 'male' ? '男性' : client.gender === 'female' ? '女性' : 'その他';
    const bloodTypeLabel = client.bloodType ? `${client.bloodType}型` : '';

    // 通所経路
    const transportLabel = (route) => {
        if (!route) return '';
        const noteMap = { bus: 'バス', train: '電車', other: 'その他' };
        return route.note || noteMap[route.type] || route.type || '';
    };

    let commuteRows = '';
    if (client.commuteRoutes && client.commuteRoutes.length > 0) {
        commuteRows = client.commuteRoutes.map((route, idx) => `
            <tr>
                <td style="text-align:center">${idx + 1}</td>
                <td>${transportLabel(route)}${route.company ? ' (' + route.company + ')' : ''}</td>
                <td>${route.from || ''} ～ ${route.to || ''}</td>
                <td style="text-align:right">${route.cost ? Number(route.cost).toLocaleString() + '円' : '-'}</td>
                <td style="text-align:right">${route.costDiscounted ? Number(route.costDiscounted).toLocaleString() + '円' : '-'}</td>
                <td style="text-align:center">${route.paymentMethod === 'pass' ? '定期' : '日額'}</td>
            </tr>
        `).join('');
    } else {
        commuteRows = '<tr><td colspan="6" style="text-align:center;color:#999">経路情報なし</td></tr>';
    }

    // 緊急連絡先
    let emergencyRows = '';
    for (let i = 1; i <= 3; i++) {
        emergencyRows += `
            <tr>
                <td style="text-align:center;width:3%">${i}</td>
                <th style="width:8%">氏名</th>
                <td style="width:25%">${client[`emergency_name_${i}`] || ''}</td>
                <th style="width:8%">続柄</th>
                <td style="width:15%">${client[`emergency_rel_${i}`] || ''}</td>
                <th style="width:10%">電話番号</th>
                <td style="width:31%">${client[`emergency_phone_${i}`] || ''}</td>
            </tr>`;
    }

    // かかりつけ医
    let medicalRows = '';
    for (let i = 1; i <= 2; i++) {
        medicalRows += `
            <tr>
                <td rowspan="2" style="text-align:center;vertical-align:middle;width:3%">${i}</td>
                <th style="width:8%">病院名</th>
                <td style="width:30%">${client[`medical_name_${i}`] || ''}</td>
                <th style="width:8%">所在地</th>
                <td style="width:20%">${client[`medical_address_${i}`] || ''}</td>
                <th style="width:10%">電話番号</th>
                <td style="width:21%">${client[`medical_phone_${i}`] || ''}</td>
            </tr>
            <tr>
                <th>受診科目</th>
                <td>${client[`medical_dept_${i}`] || ''}</td>
                <th>担当医</th>
                <td>${client[`medical_doctor_${i}`] || ''}</td>
                <th>通院頻度</th>
                <td>${client[`medical_freq_${i}`] || ''}</td>
            </tr>`;
    }

    // 家族構成
    let familyRows = '';
    for (let i = 1; i <= 6; i++) {
        const name = client[`family_name_${i}`];
        if (!name) continue;
        familyRows += `
            <tr>
                <td style="text-align:center">${i}</td>
                <td>${name}</td>
                <td>${client[`family_rel_${i}`] || ''}</td>
                <td style="text-align:center">${client[`family_living_${i}`] || ''}</td>
                <td>${client[`family_note_${i}`] || ''}</td>
            </tr>`;
    }

    // 福祉サービス
    let welfareOtherRows = '';
    for (let i = 1; i <= 2; i++) {
        welfareOtherRows += `
            <tr>
                <td style="text-align:center;width:3%">${i}</td>
                <th style="width:10%">事業所名</th>
                <td style="width:35%">${client[`welfare_other_name_${i}`] || ''}</td>
                <th style="width:8%">種別</th>
                <td style="width:13%">${client[`welfare_other_type_${i}`] || ''}</td>
                <th style="width:8%">担当</th>
                <td style="width:23%">${client[`welfare_other_person_${i}`] || ''}</td>
            </tr>`;
    }

    // 非常災害時（質問・回答・対処法）
    const q1Answer = (() => {
        let s = client.emergency_physical || '-';
        if (client.emergency_physical === 'ある' && client.emergency_physical_detail) s += `（${client.emergency_physical_detail}）`;
        return s;
    })();
    const q1Coping = (() => {
        if (client.emergency_physical !== 'ある') return '';
        const items = [];
        if (client.emergency_physical_coping?.length) items.push(client.emergency_physical_coping.join(', '));
        if (client.emergency_physical_coping_other) items.push(client.emergency_physical_coping_other);
        return items.join('、');
    })();

    const q2Answer = (() => {
        let s = client.emergency_seizure || '-';
        if (client.emergency_seizure && client.emergency_seizure !== '特にない' && client.emergency_seizure_detail) s += `（${client.emergency_seizure_detail}）`;
        return s;
    })();
    const q2Coping = (() => {
        if (!client.emergency_seizure || client.emergency_seizure === '特にない') return '';
        const items = [];
        if (client.emergency_seizure_coping?.length) items.push(client.emergency_seizure_coping.join(', '));
        if (client.emergency_seizure_coping_other) items.push(client.emergency_seizure_coping_other);
        return items.join('、');
    })();

    const q3HasIssue = client.emergency_harm_past === 'ある' || client.emergency_harm_present === 'ある';
    const q3Answer = `過去: ${client.emergency_harm_past || '-'}<br>現在: ${client.emergency_harm_present || '-'}${q3HasIssue && client.emergency_harm_detail ? '（' + client.emergency_harm_detail + '）' : ''}`;
    const q3Coping = (() => {
        if (!q3HasIssue) return '';
        const parts = [];
        if (client.emergency_harm_consult?.length) parts.push('相談先: ' + client.emergency_harm_consult.join(', '));
        if (client.emergency_harm_action?.length) parts.push('対処: ' + client.emergency_harm_action.join(', '));
        if (client.emergency_harm_overcome) parts.push('乗り越え方: ' + client.emergency_harm_overcome);
        return parts.join('<br>');
    })();

    const q4HasIssue = client.emergency_suicidal_past === 'ある' || client.emergency_suicidal_present === 'ある';
    const q4Answer = `過去: ${client.emergency_suicidal_past || '-'}<br>現在: ${client.emergency_suicidal_present || '-'}${q4HasIssue && client.emergency_suicidal_detail ? '（' + client.emergency_suicidal_detail + '）' : ''}`;
    const q4Coping = (() => {
        if (!q4HasIssue) return '';
        const parts = [];
        if (client.emergency_suicidal_consult?.length) parts.push('相談先: ' + client.emergency_suicidal_consult.join(', '));
        if (client.emergency_suicidal_action?.length) parts.push('対処: ' + client.emergency_suicidal_action.join(', '));
        if (client.emergency_suicidal_overcome) parts.push('乗り越え方: ' + client.emergency_suicidal_overcome);
        return parts.join('<br>');
    })();

    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>フェイスシート - ${client.name || ''}</title>
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
        .note { font-size: 7pt; margin-bottom: 6px; }
        .page-break { page-break-before: always; }
    </style>
</head>
<body>
    <!-- ===== ページ1: 基本情報 + 連絡先 ===== -->
    <div class="header-row">
        <h2>フェイスシート</h2>
        <div class="date-box">記入日：西暦　　年　　月　　日</div>
    </div>
    <p class="note">※非常災害時・危機対応に活用されるシートです。出来るかぎり詳細な記載にご協力下さい。また、変更があった際は、速やかに事業所までご報告下さい。</p>

    <div class="sec-title">基本情報</div>
    <table>
        <tr>
            <th style="width:10%">ふりがな</th>
            <td style="width:40%">${client.nameKana || ''}</td>
            <th style="width:10%">生年月日</th>
            <td style="width:40%">${formatDate(client.birthDate)} (${getAge(client.birthDate)}歳)</td>
        </tr>
        <tr>
            <th style="width:10%">氏名</th>
            <td style="width:40%" colspan="1">${client.name || ''}</td>
            <th style="width:10%">性別・血液型</th>
            <td style="width:40%" colspan="1">${genderLabel}　/　${bloodTypeLabel}</td>
        </tr>
        <tr>
            <th>住所</th>
            <td colspan="3" style="height:35px">〒${client.postalCode || ''}<br>${client.address || ''}</td>
        </tr>
    </table>

    <table>
        <tr>
            <th style="width:10%">電話番号</th>
            <td style="width:40%">${client.phone || ''}</td>
            <th style="width:10%" rowspan="2">メールアドレス</th>
            <td style="width:40%" rowspan="2">${client.email || ''}</td>
        </tr>
        <tr>
            <th>携帯電話</th>
            <td>${client.mobilePhone || '-'}</td>
        </tr>
    </table>

    <!-- 通所経路 -->
    <table>
        <thead>
            <tr>
                <th style="width:5%">No</th>
                <th style="width:15%">交通機関</th>
                <th style="width:30%">区間</th>
                <th style="width:15%">片道運賃</th>
                <th style="width:15%">割引運賃</th>
                <th style="width:20%">支払方式</th>
            </tr>
        </thead>
        <tbody>${commuteRows}</tbody>
    </table>

    <!-- 連絡先等 -->
    <div class="sec-title">連絡先等</div>
    <p style="font-size:7pt;margin:2px 0">緊急連絡先（電話番号欄には緊急時に連絡がつきやすい番号をご記載ください）</p>
    <table><tbody>${emergencyRows}</tbody></table>

    <p style="font-weight:bold;font-size:9pt;margin:6px 0 2px">かかりつけ医療機関</p>
    <table><tbody>${medicalRows}</tbody></table>

    <p style="font-weight:bold;font-size:9pt;margin:6px 0 2px">相談支援事業所</p>
    <table><tbody>
        <tr>
            <td style="width:3%;text-align:center">4</td>
            <th style="width:10%">事業所名</th>
            <td style="width:35%">${client.welfare_support_office || ''}</td>
            <th style="width:8%">担当</th>
            <td style="width:20%">${client.welfare_support_person || ''}</td>
            <th style="width:10%">電話</th>
            <td style="width:14%">${client.welfare_support_phone || ''}</td>
        </tr>
    </tbody></table>

    <p style="font-weight:bold;font-size:9pt;margin:6px 0 2px">福祉サービス・登録機関等</p>
    <table><tbody>${welfareOtherRows}</tbody></table>

    <p style="font-weight:bold;font-size:9pt;margin:6px 0 2px">行政窓口</p>
    <table><tbody>
        <tr>
            <td style="width:3%;text-align:center">1</td>
            <td style="width:20%">${client.admin_city_name || ''}</td>
            <td style="width:25%">${client.admin_city_section || ''} 課・係</td>
            <th style="width:8%">担当</th>
            <td style="width:15%">${client.admin_city_person || ''}</td>
            <th style="width:10%">電話</th>
            <td style="width:19%">${client.admin_city_phone || ''}</td>
        </tr>
        <tr>
            <td style="text-align:center">2</td>
            <td>管轄ハローワーク</td>
            <td>${client.hello_work_status === 'registered' ? '登録済' : '未登録'}</td>
            <th>担当</th>
            <td>${client.hello_work_person || ''}</td>
            <th>電話</th>
            <td>${client.hello_work_phone || ''}</td>
        </tr>
    </tbody></table>

    <!-- ===== ページ2: 家族・障害・非常災害時 ===== -->
    <div class="page-break"></div>
    <div class="header-row">
        <h2>フェイスシート (2)</h2>
        <div style="font-size:10pt">${client.name || ''}</div>
    </div>

    <div class="sec-title">家族構成</div>
    <table>
        <thead>
            <tr>
                <th style="width:5%">No</th>
                <th style="width:25%">氏名</th>
                <th style="width:15%">続柄</th>
                <th style="width:15%">同居</th>
                <th style="width:40%">備考</th>
            </tr>
        </thead>
        <tbody>${familyRows || '<tr><td colspan="5" style="text-align:center">-</td></tr>'}</tbody>
    </table>

    <div class="sec-title">経済状況</div>
    <table><tbody>
        <tr>
            <th style="width:12%">生活保護</th>
            <td style="width:38%">${client.welfare_protection_status || '-'}${client.welfare_protection_amount ? ' ' + client.welfare_protection_amount + '円/月' : ''}</td>
            <th style="width:12%">障害年金</th>
            <td style="width:38%">${client.disability_pension_status || '-'}${client.disability_pension_type ? ' ' + client.disability_pension_type : ''}${client.disability_pension_grade ? ' ' + client.disability_pension_grade + '級' : ''}${client.disability_pension_amount ? ' ' + client.disability_pension_amount + '円/月' : ''}</td>
        </tr>
        <tr>
            <th>健康保険</th>
            <td>${client.health_insurance_type || '-'}${client.health_insurance_holder ? ' (' + client.health_insurance_holder + ')' : ''}</td>
            <th>自立支援医療</th>
            <td>${client.self_support_medical || '-'}</td>
        </tr>
    </tbody></table>

    <div class="sec-title">障害・疾病情報</div>
    <table><tbody>
        <tr>
            <th style="width:12%">障害種別</th>
            <td style="width:38%">${getDisabilities()}</td>
            <th style="width:12%">診断名</th>
            <td style="width:38%">${client.diagnosis_name || '-'}</td>
        </tr>
        <tr>
            <th>合併障害</th>
            <td>${client.comorbidity || '-'}</td>
            <th>障害者手帳</th>
            <td>${getCerts()}</td>
        </tr>
    </tbody></table>

    <div class="sec-title">非常災害時・危機対応</div>
    <table>
        <thead>
            <tr>
                <th style="width:35%">質問</th>
                <th style="width:25%">ご回答</th>
                <th style="width:40%">対処法</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td style="font-weight:bold">非常災害時、身体面や体調面（症状）で心配なことはありますか</td>
                <td>${q1Answer}</td>
                <td>${q1Coping}</td>
            </tr>
            <tr>
                <td style="font-weight:bold">発作はありますか</td>
                <td>${q2Answer}</td>
                <td>${q2Coping}</td>
            </tr>
            <tr>
                <td style="font-weight:bold">自分や他者を傷つけてしまうような心配がある</td>
                <td>${q3Answer}</td>
                <td>${q3Coping}</td>
            </tr>
            <tr>
                <td style="font-weight:bold">死にたい気持ちになることや行動に起こしたことはありますか</td>
                <td>${q4Answer}</td>
                <td>${q4Coping}</td>
            </tr>
        </tbody>
    </table>

    <p style="font-weight:bold;font-size:9pt;margin:6px 0 2px">特記事項</p>
    <div style="border:1px solid #000;min-height:50px;padding:6px;white-space:pre-wrap">${client.emergency_general_note || ''}</div>

</body>
</html>`;
};

// =========================================
// React コンポーネント
// =========================================
export default function FaceSheetPrintPage() {
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

    // 印刷: 新ウィンドウ方式
    const handlePrint = () => {
        if (!client) return;
        const html = generatePrintHTML(client);
        const printWindow = window.open('', '_blank', 'width=900,height=700');
        if (printWindow) {
            printWindow.document.write(html);
            printWindow.document.close();
            // 少し待ってから印刷ダイアログ表示
            setTimeout(() => {
                printWindow.print();
            }, 500);
        } else {
            alert('ポップアップがブロックされました。ポップアップを許可してください。');
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!client) {
        return <Typography sx={{ p: 4 }}>データが見つかりません</Typography>;
    }

    return (
        <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h5" sx={{ mb: 2 }}>
                フェイスシート - {client.name}
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
