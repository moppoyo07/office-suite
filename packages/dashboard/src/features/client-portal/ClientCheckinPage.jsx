// src/features/client-portal/ClientCheckinPage.jsx
// 通所チェックイン画面（健康状態入力）

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box, Paper, Typography, Button, TextField,
    RadioGroup, Radio, FormControlLabel, FormControl, FormLabel,
    Checkbox, FormGroup, Slider, Alert, CircularProgress,
    ToggleButtonGroup, ToggleButton
} from '@mui/material';
import { collection, doc, setDoc, getDoc, Timestamp, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/index';
import { useClientAuth } from './context/ClientAuthContext';
import { format } from 'date-fns';
import HomeIcon from '@mui/icons-material/Home';
import BusinessIcon from '@mui/icons-material/Business';
import WheelPicker from '../../components/WheelPicker';

const MEDICATION_OPTIONS = [
    { value: 'taken', label: '飲んだ' },
    { value: 'not_taken', label: '飲んでない' },
    { value: 'not_prescribed', label: '処方されていない' },
];

const MOOD_TYPES = [
    '嬉しい', '楽しい', 'イライラ', '普通',
    'リラックス', '落ち着いている', '不安', '緊張',
    '心配', '憂鬱', '眠たい', '気持ちが高ぶっている',
];

// 活動内容の選択肢（よく使うものをプリセット）
const ACTIVITY_OPTIONS = [
    'PC作業', '軽作業', '事務作業', 'ビジネスマナー',
    '就職活動', 'グループワーク', '面談', '運動',
    '清掃', '調理', '自習', '外出訓練',
];

// 体温の選択肢（35.0〜38.0度、0.1度刻み）
const TEMPERATURE_OPTIONS = Array.from({ length: 31 }, (_, i) => (35.0 + i * 0.1).toFixed(1));

export default function ClientCheckinPage() {
    const { client } = useClientAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [form, setForm] = useState({
        attendanceType: 'onsite', // 通所 or 在宅
        temperature: '36.4', // 体温
        medicationMorning: 'not_prescribed',
        medicationNoon: 'not_prescribed',
        medicationEvening: 'not_prescribed',
        medicationBedtime: 'not_prescribed',
        missedReason: '',
        bedtime: '23:00',
        wakeTime: '07:00',
        sleepQuality: 3,
        moodLevel: 3,
        moodTypes: [],
        meals: 3,
        activityAm: [],
        activityPm: [],
        activityNote: '',
    });

    // 今日のデータをロード
    useEffect(() => {
        const fetchCheckin = async () => {
            if (!client?.id) return;
            const today = format(new Date(), 'yyyy-MM-dd');
            const docId = `${client.id}_${today}`;
            try {
                const docRef = doc(db, 'dailyCheckins', docId);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setForm(prev => ({
                        ...prev,
                        attendanceType: data.attendanceType || 'onsite',
                        temperature: data.temperature || '36.4',
                        // 服薬
                        medicationMorning: data.medication?.morning || 'not_prescribed',
                        medicationNoon: data.medication?.noon || 'not_prescribed',
                        medicationEvening: data.medication?.evening || 'not_prescribed',
                        medicationBedtime: data.medication?.bedtime || 'not_prescribed',
                        missedReason: data.medication?.missedReason || '',
                        // 睡眠
                        bedtime: data.sleep?.bedtime || '23:00',
                        wakeTime: data.sleep?.wakeTime || '07:00',
                        sleepQuality: data.sleep?.quality || 3,
                        // 気分
                        moodLevel: data.mood?.level || 3,
                        moodTypes: data.mood?.types || [],
                        // 食事
                        meals: data.meals || 3,
                        // 活動
                        activityAm: data.activities?.am || [],
                        activityPm: data.activities?.pm || [],
                        activityNote: data.activities?.note || '',
                    }));
                }
            } catch (err) {
                console.error("データロードエラー:", err);
            }
        };
        fetchCheckin();
    }, [client]);


    const handleChange = (field) => (e) => {
        setForm(prev => ({ ...prev, [field]: e.target.value }));
    };

    const handleSliderChange = (field) => (e, newValue) => {
        setForm(prev => ({ ...prev, [field]: newValue }));
    };

    const handleMoodTypeToggle = (type) => {
        setForm(prev => ({
            ...prev,
            moodTypes: prev.moodTypes.includes(type)
                ? prev.moodTypes.filter(t => t !== type)
                : [...prev.moodTypes, type],
        }));
    };

    // 活動内容のトグル
    const handleActivityToggle = (period, activity) => {
        const field = period === 'am' ? 'activityAm' : 'activityPm';
        setForm(prev => ({
            ...prev,
            [field]: prev[field].includes(activity)
                ? prev[field].filter(a => a !== activity)
                : [...prev[field], activity],
        }));
    };

    const handleSubmit = async () => {
        setLoading(true);
        setError('');

        try {
            const now = new Date();
            const today = format(now, 'yyyy-MM-dd');
            const docId = `${client.id}_${today}`;
            const arrivalTime = format(now, 'HH:mm');

            // 1. dailyCheckinsに健康情報を保存
            await setDoc(doc(db, 'dailyCheckins', docId), {
                clientId: client.id,
                clientName: client.name,
                date: today,
                type: 'daily', // 念のため
                attendanceType: form.attendanceType, // 保存追加
                arrivalTime: Timestamp.now(),
                temperature: form.temperature, // フラットにも保存（検索用）
                medication: {
                    morning: form.medicationMorning,
                    noon: form.medicationNoon,
                    evening: form.medicationEvening,
                    bedtime: form.medicationBedtime,
                    missedReason: form.missedReason,
                },
                sleep: {
                    bedtime: form.bedtime,
                    wakeTime: form.wakeTime,
                    quality: form.sleepQuality,
                },
                mood: {
                    level: form.moodLevel,
                    types: form.moodTypes,
                },
                meals: form.meals,
                activities: {
                    am: form.activityAm,
                    pm: form.activityPm,
                    note: form.activityNote,
                },
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
            }, { merge: true });


            // 2. attendanceRecordsに出席記録を保存（出席管理との連携）
            await setDoc(doc(db, 'attendanceRecords', docId), {
                clientId: client.id,
                clientName: client.name,
                date: Timestamp.now(),
                status: 'present',
                attendanceType: form.attendanceType, // 通所 or 在宅
                startTime: arrivalTime,
                endTime: '16:00', // デフォルト終了時刻
                staffId: 'portal-checkin', // ポータルからのチェックイン
                staffName: 'セルフチェックイン',
                temperature: form.temperature, // 体温
                // 活動内容をattendanceRecordsにも保存（サービス提供記録用）
                activitiesAm: form.activityAm,
                activitiesPm: form.activityPm,
                specialNotes: form.attendanceType === 'remote'
                    ? (form.activityNote ? `【在宅】 ${form.activityNote}` : '【在宅】')
                    : form.activityNote, // 特記事項として保存
                serviceDetails: {
                    mealSupport: false,
                    transportGoing: false, // 加算は利用者申告＋スタッフ確認が必要なためデフォルトfalse
                    transportReturning: false,
                    homeVisit: false,
                },
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
            }, { merge: true });



            navigate('/portal/home');
        } catch (err) {
            console.error('チェックインエラー:', err);
            setError('チェックインに失敗しました');
        } finally {
            setLoading(false);
        }
    };


    const MedicationRadio = ({ label, field }) => (
        <FormControl component="fieldset" sx={{ mb: 2, width: '100%' }}>
            <FormLabel sx={{ color: '#94a3b8', fontSize: '0.9rem' }}>{label}</FormLabel>
            <RadioGroup row value={form[field]} onChange={handleChange(field)}>
                {MEDICATION_OPTIONS.map(opt => (
                    <FormControlLabel
                        key={opt.value}
                        value={opt.value}
                        control={<Radio size="small" />}
                        label={<Typography variant="caption">{opt.label}</Typography>}
                        sx={{ mr: 1 }}
                    />
                ))}
            </RadioGroup>
        </FormControl>
    );

    return (
        <Box sx={{ py: 2 }}>
            <Typography variant="h6" align="center" sx={{ mb: 2, color: '#fff' }}>
                通所チェックイン
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {/* 通所/在宅選択 */}
            <Paper sx={{ p: 2, mb: 2, bgcolor: 'rgba(30, 41, 59, 0.9)', borderRadius: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 2, color: '#06b6d4' }}>📍 利用形態</Typography>
                <ToggleButtonGroup
                    value={form.attendanceType}
                    exclusive
                    fullWidth
                    onChange={(e, newValue) => { if (newValue) setForm(prev => ({ ...prev, attendanceType: newValue })); }}
                    sx={{ mb: 2 }}
                >
                    <ToggleButton
                        value="onsite"
                        sx={{
                            py: 1.5,
                            color: '#10b981',
                            '&.Mui-selected': {
                                bgcolor: 'rgba(16, 185, 129, 0.2)',
                                color: '#10b981',
                                '&:hover': { bgcolor: 'rgba(16, 185, 129, 0.3)' }
                            }
                        }}
                    >
                        <BusinessIcon sx={{ mr: 1 }} />
                        通所
                    </ToggleButton>
                    <ToggleButton
                        value="remote"
                        sx={{
                            py: 1.5,
                            color: '#8b5cf6',
                            '&.Mui-selected': {
                                bgcolor: 'rgba(139, 92, 246, 0.2)',
                                color: '#8b5cf6',
                                '&:hover': { bgcolor: 'rgba(139, 92, 246, 0.3)' }
                            }
                        }}
                    >
                        <HomeIcon sx={{ mr: 1 }} />
                        在宅
                    </ToggleButton>
                </ToggleButtonGroup>

                {/* 体温選択（ホイールピッカー） */}
                <Typography variant="subtitle2" sx={{ mb: 1, color: '#06b6d4' }}>
                    🌡️ 体温: <strong style={{ color: parseFloat(form.temperature) >= 37.5 ? '#ef4444' : '#06b6d4' }}>{form.temperature}°C</strong>
                </Typography>
                <Box sx={{
                    border: '1px solid #4a5568',
                    borderRadius: 2,
                    overflow: 'hidden',
                    bgcolor: 'rgba(30, 41, 59, 0.95)',
                }}>
                    <WheelPicker
                        options={TEMPERATURE_OPTIONS}
                        value={form.temperature}
                        onChange={(val) => setForm(prev => ({ ...prev, temperature: val }))}
                        suffix="°C"
                        highlightColor={parseFloat(form.temperature) >= 37.5 ? '#ef4444' : '#06b6d4'}
                    />
                </Box>
            </Paper>


            <Paper sx={{ p: 2, mb: 2, bgcolor: 'rgba(30, 41, 59, 0.9)', borderRadius: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 2, color: '#06b6d4' }}>💊 服薬状況</Typography>
                <MedicationRadio label="朝" field="medicationMorning" />
                <MedicationRadio label="昼" field="medicationNoon" />
                <MedicationRadio label="夜" field="medicationEvening" />
                <MedicationRadio label="就寝前" field="medicationBedtime" />
                <TextField
                    fullWidth
                    size="small"
                    label="飲み忘れた状況"
                    value={form.missedReason}
                    onChange={handleChange('missedReason')}
                    multiline
                    rows={2}
                    sx={{ mt: 1 }}
                />
            </Paper>


            <Paper sx={{ p: 2, mb: 2, bgcolor: 'rgba(30, 41, 59, 0.9)', borderRadius: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 2, color: '#06b6d4' }}>😴 睡眠</Typography>
                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <TextField
                        size="small"
                        label="就寝時間"
                        type="time"
                        value={form.bedtime}
                        onChange={handleChange('bedtime')}
                        sx={{ flex: 1 }}
                        InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                        size="small"
                        label="起床時間"
                        type="time"
                        value={form.wakeTime}
                        onChange={handleChange('wakeTime')}
                        sx={{ flex: 1 }}
                        InputLabelProps={{ shrink: true }}
                    />
                </Box>
                <Typography variant="caption" color="text.secondary">睡眠の質</Typography>
                <Slider
                    value={form.sleepQuality}
                    onChange={handleSliderChange('sleepQuality')}
                    min={1}
                    max={5}
                    marks={[
                        { value: 1, label: '悪い' },
                        { value: 3, label: '普通' },
                        { value: 5, label: '良い' },
                    ]}
                    sx={{ mt: 1 }}
                />
            </Paper>

            <Paper sx={{ p: 2, mb: 2, bgcolor: 'rgba(30, 41, 59, 0.9)', borderRadius: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 2, color: '#06b6d4' }}>😊 気分</Typography>
                <Typography variant="caption" color="text.secondary">今の気分（1=悪い〜5=良い）</Typography>
                <Slider
                    value={form.moodLevel}
                    onChange={handleSliderChange('moodLevel')}
                    min={1}
                    max={5}
                    marks
                    sx={{ mt: 1, mb: 2 }}
                />
                <Typography variant="caption" color="text.secondary">気分の種類（複数選択可）</Typography>
                <FormGroup sx={{ mt: 1 }}>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {MOOD_TYPES.map(type => (
                            <Checkbox
                                key={type}
                                checked={form.moodTypes.includes(type)}
                                onChange={() => handleMoodTypeToggle(type)}
                                size="small"
                                icon={<Box sx={{ px: 1.5, py: 0.5, border: '1px solid #4a5568', borderRadius: 2, fontSize: '0.75rem', color: '#94a3b8' }}>{type}</Box>}
                                checkedIcon={<Box sx={{ px: 1.5, py: 0.5, bgcolor: '#06b6d4', borderRadius: 2, fontSize: '0.75rem', color: '#fff' }}>{type}</Box>}
                                sx={{ p: 0 }}
                            />
                        ))}
                    </Box>
                </FormGroup>
            </Paper>

            <Paper sx={{ p: 2, mb: 2, bgcolor: 'rgba(30, 41, 59, 0.9)', borderRadius: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 2, color: '#06b6d4' }}>🍽️ 食事</Typography>
                <Typography variant="caption" color="text.secondary">食事の状況（1=悪い〜5=良い）</Typography>
                <Slider
                    value={form.meals}
                    onChange={handleSliderChange('meals')}
                    min={1}
                    max={5}
                    marks={[
                        { value: 1, label: '悪い' },
                        { value: 3, label: '普通' },
                        { value: 5, label: '良い' },
                    ]}
                    sx={{ mt: 1 }}
                />
            </Paper>

            <Paper sx={{ p: 2, mb: 2, bgcolor: 'rgba(30, 41, 59, 0.9)', borderRadius: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 2, color: '#06b6d4' }}>📋 今日の活動予定</Typography>

                <Typography variant="caption" color="text.secondary">午前の予定（複数選択可）</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2, mt: 1 }}>
                    {ACTIVITY_OPTIONS.map(activity => (
                        <Checkbox
                            key={`am-${activity}`}
                            checked={form.activityAm.includes(activity)}
                            onChange={() => handleActivityToggle('am', activity)}
                            size="small"
                            icon={<Box sx={{ px: 1.5, py: 0.5, border: '1px solid #4a5568', borderRadius: 2, fontSize: '0.75rem', color: '#94a3b8' }}>{activity}</Box>}
                            checkedIcon={<Box sx={{ px: 1.5, py: 0.5, bgcolor: '#8b5cf6', borderRadius: 2, fontSize: '0.75rem', color: '#fff' }}>{activity}</Box>}
                            sx={{ p: 0 }}
                        />
                    ))}
                </Box>

                <Typography variant="caption" color="text.secondary">午後の予定（複数選択可）</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2, mt: 1 }}>
                    {ACTIVITY_OPTIONS.map(activity => (
                        <Checkbox
                            key={`pm-${activity}`}
                            checked={form.activityPm.includes(activity)}
                            onChange={() => handleActivityToggle('pm', activity)}
                            size="small"
                            icon={<Box sx={{ px: 1.5, py: 0.5, border: '1px solid #4a5568', borderRadius: 2, fontSize: '0.75rem', color: '#94a3b8' }}>{activity}</Box>}
                            checkedIcon={<Box sx={{ px: 1.5, py: 0.5, bgcolor: '#f59e0b', borderRadius: 2, fontSize: '0.75rem', color: '#fff' }}>{activity}</Box>}
                            sx={{ p: 0 }}
                        />
                    ))}
                </Box>

                <TextField
                    fullWidth
                    size="small"
                    label="その他・補足"
                    value={form.activityNote}
                    onChange={handleChange('activityNote')}
                    placeholder="上記以外の活動や詳細があれば入力"
                    multiline
                    rows={2}
                />
            </Paper>

            <Button
                variant="contained"
                fullWidth
                size="large"
                onClick={handleSubmit}
                disabled={loading}
                sx={{ py: 2, fontSize: '1.1rem', bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' } }}
            >
                {loading ? <CircularProgress size={24} /> : '通所を記録する'}
            </Button>

            <Typography variant="caption" align="center" sx={{ display: 'block', mt: 4, mb: 1, color: 'rgba(255,255,255,0.3)' }}>
                App Version: v2.0 (Sync Fix)
            </Typography>
        </Box>
    );
}
