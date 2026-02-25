import React from 'react';
import { Box, Typography, Button, Paper, Grid } from '@mui/material';

const Step8_Confirmation = ({ formData, prevStep, submitSurvey }) => {

    const InfoRow = ({ label, value }) => {
        if (value === null || value === undefined || value === '') return null;
        return (
            <Grid container spacing={2} sx={{ mb: 0.5, borderBottom: '1px solid', borderColor: 'divider', pb: 0.5 }}>
                <Grid item xs={12} sm={4}>
                    <Typography variant="body2" color="text.secondary" fontWeight="bold">{label}</Typography>
                </Grid>
                <Grid item xs={12} sm={8}>
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                        {Array.isArray(value) ? value.filter(Boolean).join(', ') : String(value)}
                    </Typography>
                </Grid>
            </Grid>
        );
    };

    const SectionTitle = ({ children }) => (
        <Typography variant="h6" sx={{ mt: 3, mb: 2, bgcolor: 'action.hover', p: 1, borderRadius: 1, fontWeight: 'bold' }}>
            {children}
        </Typography>
    );

    // --- ヘルパー関数 ---

    // 交通機関ラベル変換
    const transportLabel = (type) => ({ bus: 'バス', jr: 'JR', private_rail: '地下鉄・私鉄' }[type] || type || '');

    // 住居ラベル変換
    const housingLabel = (val) => ({ owned: '持ち家', rented: '借家', public: '公営住宅', group_home: 'グループホーム', other: 'その他' }[val] || val || '');

    // 部屋ラベル変換
    const roomLabel = (val) => ({ private: '専用（個室）', shared: '兼用（相部屋）', none: 'なし' }[val] || val || '');

    // 寝具ラベル変換
    const beddingLabel = (val) => ({ bed: 'ベッド', futon: '布団', other: 'その他' }[val] || val || '');

    // 通所経路の表示
    const renderRoutes = () => {
        const routes = formData.commute_routes_input || [];
        if (routes.length === 0) return null;
        return routes.map((r, i) => {
            const parts = [`経路${i + 1}: ${transportLabel(r.transportType)}`];
            if (r.line) parts.push(r.line);
            if (r.from || r.to) parts.push(`${r.from || ''} → ${r.to || ''}`);
            if (r.fare) parts.push(`${r.fare}円`);
            return parts.join(' / ');
        }).join('\n');
    };

    // 家族の表示
    const renderFamily = () => {
        const members = [];
        for (let i = 1; i <= 6; i++) {
            const name = formData[`family_name_${i}`];
            if (name) {
                const rel = formData[`family_rel_${i}`] || '';
                const living = formData[`family_living_${i}`] || '';
                const note = formData[`family_note_${i}`] || '';
                const parts = [name];
                if (rel) parts[0] += `（${rel}）`;
                if (living) parts.push(living);
                if (note) parts.push(note);
                members.push(parts.join(' / '));
            }
        }
        return members.length > 0 ? members.join('\n') : null;
    };

    // 経済状況
    const renderWelfare = () => {
        const items = [];
        if (formData.welfare_protection_status) {
            let text = `生活保護: ${formData.welfare_protection_status}`;
            if (formData.welfare_protection_amount) text += ` ${formData.welfare_protection_amount}円/月`;
            items.push(text);
        }
        if (formData.disability_pension_status) {
            let text = `障害年金: ${formData.disability_pension_status}`;
            if (formData.disability_pension_type) text += ` ${formData.disability_pension_type}`;
            if (formData.disability_pension_grade) text += ` ${formData.disability_pension_grade}級`;
            if (formData.disability_pension_amount) text += ` ${formData.disability_pension_amount}円/月`;
            items.push(text);
        }
        if (formData.health_insurance_holder || formData.health_insurance_type) {
            let text = `健康保険: ${formData.health_insurance_type || ''} (${formData.health_insurance_holder || ''})`;
            items.push(text);
        }
        if (formData.self_support_medical) items.push(`自立支援医療: ${formData.self_support_medical}`);
        return items.length > 0 ? items.join('\n') : null;
    };

    // 障害種別の表示
    const renderDisabilities = () => {
        const types = [];
        if (formData.disability_mental) types.push('精神');
        if (formData.disability_intellectual) types.push('知的');
        if (formData.disability_physical) types.push('身体');
        if (formData.disability_developmental) types.push('発達');
        if (formData.disability_rare) types.push('難病');
        return types.length > 0 ? types.join(', ') : null;
    };

    // 手帳の表示
    const renderCerts = () => {
        const certs = [];
        if (formData.cert_mental_grade) {
            let text = `精神: ${formData.cert_mental_grade}級`;
            if (formData.cert_mental_date) text += ` (${formData.cert_mental_date})`;
            certs.push(text);
        }
        if (formData.cert_intellectual_grade) {
            let text = `療育: ${formData.cert_intellectual_grade}`;
            if (formData.cert_intellectual_date) text += ` (${formData.cert_intellectual_date})`;
            certs.push(text);
        }
        if (formData.cert_physical_grade) {
            let text = `身体: ${formData.cert_physical_grade}`;
            if (formData.cert_physical_date) text += ` (${formData.cert_physical_date})`;
            certs.push(text);
        }
        if (formData.cert_none) {
            let text = 'なし';
            if (formData.cert_none_status) text += `（${formData.cert_none_status}）`;
            if (formData.cert_none_planned_date) text += ` 取得予定: ${formData.cert_none_planned_date}`;
            certs.push(text);
        }
        return certs.length > 0 ? certs.join('\n') : null;
    };

    // 非常災害時 Q1/Q2 の表示
    const renderEmergencySimple = (prefix, label) => {
        const val = formData[prefix];
        if (!val) return null;
        const parts = [val];
        if (val !== '特にない') {
            const detail = formData[`${prefix}_detail`];
            if (detail) parts.push(`詳細: ${detail}`);
            const coping = formData[`${prefix}_coping`];
            if (coping?.length) parts.push(`対処: ${coping.join(', ')}`);
            const copingOther = formData[`${prefix}_coping_other`];
            if (copingOther) parts.push(`その他: ${copingOther}`);
        }
        return parts.join('\n  ');
    };

    // 非常災害時 Q3/Q4 の表示（相談先 + 対処 + 乗り越え）
    const renderEmergencyComplex = (prefix) => {
        const pastVal = formData[`${prefix}_past`];
        const presentVal = formData[`${prefix}_present`];
        if (!pastVal && !presentVal) return null;
        const parts = [];
        if (pastVal) parts.push(`過去: ${pastVal}`);
        if (presentVal) parts.push(`現在: ${presentVal}`);
        if (pastVal === 'ある' || presentVal === 'ある') {
            const detail = formData[`${prefix}_detail`];
            if (detail) parts.push(`  状況: ${detail}`);
            const consult = formData[`${prefix}_consult`];
            if (consult?.length) parts.push(`  相談先: ${consult.join(', ')}`);
            const action = formData[`${prefix}_action`];
            if (action?.length) parts.push(`  対処: ${action.join(', ')}`);
            const overcome = formData[`${prefix}_overcome`];
            if (overcome) parts.push(`  乗り越えた方法: ${overcome}`);
        }
        return parts.join('\n');
    };

    // 1日の様子
    const renderDailySchedule = () => {
        const items = [];
        if (formData.daily_wakeup) items.push(`起床: ${formData.daily_wakeup}`);
        if (formData.daily_breakfast) items.push(`朝食: ${formData.daily_breakfast}`);
        if (formData.daily_lunch) items.push(`昼食: ${formData.daily_lunch}`);
        if (formData.daily_dinner) items.push(`夕食: ${formData.daily_dinner}`);
        if (formData.daily_bath) items.push(`入浴: ${formData.daily_bath}`);
        if (formData.daily_bedtime) items.push(`就寝: ${formData.daily_bedtime}`);
        if (formData.daily_daytime) items.push(`日中: ${formData.daily_daytime}`);
        if (formData.daily_schedule_note) items.push(`メモ: ${formData.daily_schedule_note}`);
        return items.length > 0 ? items.join(' / ') : null;
    };

    // 就労経験
    const renderWorkExp = () => {
        const items = [];
        if (formData.work_exp_general) items.push(`一般就労・アルバイト: ${formData.work_exp_general}`);
        if (formData.work_exp_welfare) items.push(`就労移行・継続支援: ${formData.work_exp_welfare}`);
        if (formData.work_exp_recent) items.push(`最近1年間: ${formData.work_exp_recent}`);
        if (formData.work_exp_interrupted) items.push(`中断: ${formData.work_exp_interrupted}`);
        return items.length > 0 ? items.join('\n') : null;
    };

    // 体調不良時の対処法
    const renderCoping = () => {
        const items = [];
        if (formData.coping_hospital) items.push('通院する');
        if (formData.coping_medication) items.push('服薬する');
        if (formData.coping_rest) items.push(`休息をとる${formData.coping_rest_hours ? '(' + formData.coping_rest_hours + ')' : ''}`);
        if (formData.coping_consult) items.push('相談をする');
        if (formData.coping_other) items.push(`その他(${formData.coping_other_detail || ''})`);
        if (formData.coping_unknown) items.push('わからない');
        return items.length > 0 ? items.join(', ') : null;
    };

    // 相談相手
    const renderConsultation = () => {
        const items = [];
        if (formData.consult_family) {
            let text = '家族';
            if (formData.consult_family_name || formData.consult_family_rel) {
                text += `(${formData.consult_family_name || ''} ${formData.consult_family_rel || ''})`;
            }
            items.push(text);
        }
        if (formData.consult_doctor) items.push('主治医');
        if (formData.consult_other) {
            let text = 'その他';
            if (formData.consult_other_detail) text += `(${formData.consult_other_detail})`;
            items.push(text);
        }
        if (formData.consult_none) items.push('いない');
        return items.length > 0 ? items.join(', ') : null;
    };

    // 行動面
    const behaviors = [
        { id: 'panic', label: 'パニック' },
        { id: 'obsession', label: 'こだわり' },
        { id: 'compulsion', label: '強迫行為・強迫観念' },
        { id: 'hallucination', label: '幻覚・妄想' },
        { id: 'seizure', label: '発作' },
        { id: 'other', label: 'その他' },
    ];

    const renderBehaviors = () => {
        const items = [];
        behaviors.forEach(b => {
            const check = formData[`behavior_${b.id}_check`];
            if (check === 'yes') {
                let text = `${b.label}: あり`;
                const selfComment = formData[`behavior_${b.id}_comment_self`];
                if (selfComment) text += ` / 本人: ${selfComment}`;
                const othersComment = formData[`behavior_${b.id}_comment_others`];
                if (othersComment) text += ` / 支援者: ${othersComment}`;
                items.push(text);
            }
        });
        return items.length > 0 ? items.join('\n') : null;
    };

    // 服薬管理ラベル
    const medMgmtLabel = (val) => ({ self: '自己管理', family: '家族管理' }[val] || val || '');
    const medAdherenceLabel = (val) => ({ good: '飲み忘れがない', poor: '飲み忘れがある', adjusting: '服薬調整中', other: 'その他' }[val] || val || '');

    return (
        <Box>
            <Typography variant="h5" component="h2" gutterBottom>
                ステップ10：内容確認
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                入力内容をご確認ください。修正する場合は「前へ戻る」ボタンで戻ってください。
            </Typography>

            <Paper variant="outlined" sx={{ p: 3, maxHeight: '60vh', overflow: 'auto', mb: 3 }}>

                {/* ===== 1. 基本情報 ===== */}
                <SectionTitle>1. 基本情報</SectionTitle>
                <InfoRow label="氏名" value={formData.name} />
                <InfoRow label="ふりがな" value={formData.nameKana} />
                <InfoRow label="性別" value={{ male: '男性', female: '女性', other: 'その他' }[formData.gender]} />
                <InfoRow label="生年月日" value={formData.birthDate ? new Date(formData.birthDate).toLocaleDateString('ja-JP') : null} />
                <InfoRow label="血液型" value={formData.bloodType} />
                <InfoRow label="住所" value={formData.address ? `〒${formData.postalCode || ''} ${formData.address}` : null} />
                <InfoRow label="電話番号" value={formData.phone} />
                <InfoRow label="メールアドレス" value={formData.email} />

                {/* ===== 2. 通所経路 ===== */}
                <SectionTitle>2. 通所経路</SectionTitle>
                <InfoRow label="経路" value={renderRoutes()} />
                <InfoRow label="その他" value={formData.commute_other ? formData.commute_other_detail : null} />
                <InfoRow label="片道距離" value={formData.commute_distance ? `${formData.commute_distance} km` : null} />
                <InfoRow label="定期券" value={formData.commute_use_pass ? `利用（${formData.commute_pass_cost || '?'}円/月）` : '利用なし'} />

                {/* ===== 3. 連絡先・福祉 ===== */}
                <SectionTitle>3. 連絡先・福祉医療</SectionTitle>
                {[1, 2, 3].map(n => (
                    <InfoRow key={`em${n}`} label={`緊急連絡先${n}`}
                        value={formData[`emergency_name_${n}`] ? `${formData[`emergency_name_${n}`]} (${formData[`emergency_rel_${n}`] || ''}) ${formData[`emergency_phone_${n}`] || ''}` : null} />
                ))}
                {[1, 2].map(n => (
                    <InfoRow key={`md${n}`} label={`かかりつけ医${n}`}
                        value={formData[`medical_name_${n}`] ? `${formData[`medical_name_${n}`]} / ${formData[`medical_dept_${n}`] || ''} / ${formData[`medical_phone_${n}`] || ''}` : null} />
                ))}

                {/* ===== 4. 家族・経済 ===== */}
                <SectionTitle>4. 家族構成・経済状況</SectionTitle>
                <InfoRow label="家族" value={renderFamily()} />
                <InfoRow label="経済状況" value={renderWelfare()} />
                <InfoRow label="備考" value={formData.finance_note} />

                {/* ===== 5. 障害・手帳 ===== */}
                <SectionTitle>5. 障害・疾病・手帳</SectionTitle>
                <InfoRow label="障害種別" value={renderDisabilities()} />
                <InfoRow label="診断名" value={formData.diagnosis_name} />
                <InfoRow label="合併障害" value={formData.comorbidity} />
                <InfoRow label="障害者手帳" value={renderCerts()} />

                <Typography variant="subtitle2" sx={{ mt: 2, mb: 1, fontWeight: 'bold' }}>非常災害時・危機対応</Typography>
                <InfoRow label="身体面" value={renderEmergencySimple('emergency_physical', '身体面')} />
                <InfoRow label="発作" value={renderEmergencySimple('emergency_seizure', '発作')} />
                <InfoRow label="自傷・他害" value={renderEmergencyComplex('emergency_harm')} />
                <InfoRow label="自殺念慮" value={renderEmergencyComplex('emergency_suicidal')} />
                <InfoRow label="特記事項" value={formData.emergency_general_note} />

                {/* ===== 6. 履歴・生活 ===== */}
                <SectionTitle>6. 履歴・生活</SectionTitle>
                <InfoRow label="外出頻度" value={formData.outing_frequency} />
                <InfoRow label="主な外出先" value={formData.outing_places} />
                <InfoRow label="入所歴" value={formData.past_admission === 'yes' ? `あり: ${formData.past_admission_detail || ''}` : formData.past_admission === 'no' ? 'なし' : null} />
                <InfoRow label="日中活動場所" value={formData.activity_place?.join(', ')} />
                <InfoRow label="1日の様子" value={renderDailySchedule()} />
                <InfoRow label="住居形態" value={formData.housing_type === 'other' ? `その他: ${formData.housing_type_other || ''}` : housingLabel(formData.housing_type)} />
                <InfoRow label="部屋" value={roomLabel(formData.room_type)} />
                <InfoRow label="寝具" value={formData.bedding_type === 'other' ? `その他: ${formData.bedding_type_other || ''}` : beddingLabel(formData.bedding_type)} />
                <InfoRow label="同居者" value={formData.cohabitants} />
                <InfoRow label="住居メモ" value={formData.housing_note} />
                <InfoRow label="資格" value={formData.qualifications} />

                <Typography variant="subtitle2" sx={{ mt: 2, mb: 1, fontWeight: 'bold' }}>就労状況</Typography>
                <InfoRow label="現在の状況" value={formData.work_current_status?.join(', ')} />
                <InfoRow label="過去の就労経験" value={renderWorkExp()} />
                <InfoRow label="主な就労先" value={formData.work_history_main} />
                <InfoRow label="一般就労希望" value={formData.work_general_hope} />
                <InfoRow label="希望する仕事" value={formData.work_desired_job} />
                <InfoRow label="就労特記事項" value={formData.work_note} />

                {/* ===== 7. 意向・好み ===== */}
                <SectionTitle>7. 意向・好み</SectionTitle>
                <InfoRow label="好きなこと" value={formData.likes} />
                <InfoRow label="嫌いなこと" value={formData.dislikes} />
                <InfoRow label="希望する暮らし" value={formData.desired_lifestyle} />
                <InfoRow label="支援要望" value={formData.support_requests} />
                <InfoRow label="将来の夢" value={formData.future_dreams} />

                {/* ===== 8. 精神・医療 ===== */}
                <SectionTitle>8. 精神・医療</SectionTitle>
                <InfoRow label="障害特性" value={formData.disability_characteristics} />
                <InfoRow label="発症時期" value={formData.onset_date} />
                <InfoRow label="きっかけ" value={formData.onset_trigger} />
                <InfoRow label="初めての診断時期" value={formData.diagnosis_date} />
                <InfoRow label="入院歴" value={formData.hospitalization_history === 'yes' ? 'あり' : formData.hospitalization_history === 'no' ? 'なし' : null} />
                <InfoRow label="通院先" value={formData.current_hospital_name} />
                <InfoRow label="通院" value={
                    formData.current_hospital_status === 'してる'
                        ? `してる（月${formData.current_hospital_freq || '?'}回 / ${formData.current_hospital_duration || '?'}分）`
                        : formData.current_hospital_status === 'してない' ? 'してない' : null
                } />
                <InfoRow label="症状" value={
                    formData.symptom_status === 'stable' ? '安定している'
                        : formData.symptom_status === 'active' ? `症状あり: ${formData.symptom_detail || ''}` : null
                } />
                <InfoRow label="不調サイン" value={formData.symptoms_checklist?.join(', ')} />
                <InfoRow label="症状が出る場面" value={formData.symptom_triggers?.join(', ')} />
                <InfoRow label="対処法" value={renderCoping()} />
                <InfoRow label="相談相手" value={renderConsultation()} />

                {/* ===== 9. 行動面 ===== */}
                <SectionTitle>9. 行動面</SectionTitle>
                <InfoRow label="服薬" value={
                    formData.medication_status === 'yes'
                        ? `あり（${formData.medication_times || '?'}回/日 ${formData.medication_timing?.join(', ') || ''}）`
                        : formData.medication_status === 'none' ? '薬はない' : null
                } />
                <InfoRow label="副作用" value={formData.side_effects === 'yes' ? `あり: ${formData.side_effects_detail || ''}` : formData.side_effects === 'none' ? 'なし' : null} />
                <InfoRow label="管理方法" value={medMgmtLabel(formData.medication_management)} />
                <InfoRow label="服薬状況" value={medAdherenceLabel(formData.medication_adherence)} />
                <InfoRow label="行動" value={renderBehaviors()} />
                <InfoRow label="特記事項" value={formData.behavior_notes} />

            </Paper>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                <Button onClick={prevStep} sx={{ minWidth: 120 }}>
                    戻る
                </Button>
                <Button variant="contained" color="primary" onClick={submitSurvey} sx={{ minWidth: 150, py: 1.5, fontWeight: 'bold' }}>
                    送信する
                </Button>
            </Box>
        </Box>
    );
};

export default Step8_Confirmation;
