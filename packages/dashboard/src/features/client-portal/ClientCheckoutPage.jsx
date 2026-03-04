// src/features/client-portal/ClientCheckoutPage.jsx
// 退所チェックアウト画面

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box, Paper, Typography, Button, TextField,
    Slider, Alert, CircularProgress
} from '@mui/material';
import { collection, doc, setDoc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase/index';
import { useClientAuth } from './context/ClientAuthContext';
import { format } from 'date-fns';
import { roundTo30Min } from '../../utils/roundTime';

export default function ClientCheckoutPage() {
    const { client } = useClientAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [checkinData, setCheckinData] = useState(null);

    const [form, setForm] = useState({
        fatigue: 3,
        activity: '', // 活動内容（午前・午後統合）
        reflection: '',
    });

    const today = format(new Date(), 'yyyy-MM-dd');

    useEffect(() => {
        const fetchCheckin = async () => {
            if (!client?.id) return;
            const docId = `${client.id}_${today}`;
            const docRef = doc(db, 'dailyCheckins', docId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setCheckinData(docSnap.data());
                // 既存のデータがあればフォームにセット（AM/PM統合）
                const data = docSnap.data();
                const activityAm = data.activities?.am || [];
                const activityPm = data.activities?.pm || [];
                // 配列または文字列の可能性を考慮
                const amText = Array.isArray(activityAm) ? activityAm.join(' ') : (data.activitiesAM || '');
                const pmText = Array.isArray(activityPm) ? activityPm.join(' ') : (data.activitiesPM || '');

                if (amText || pmText) {
                    setForm(prev => ({
                        ...prev,
                        activity: [amText, pmText].filter(Boolean).join('\n')
                    }));
                }
            }
        };
        fetchCheckin();
    }, [client, today]);

    const handleChange = (field) => (e) => {
        setForm(prev => ({ ...prev, [field]: e.target.value }));
    };

    const handleSliderChange = (field) => (e, newValue) => {
        setForm(prev => ({ ...prev, [field]: newValue }));
    };

    const handleSubmit = async () => {
        setLoading(true);
        setError('');

        try {
            const docId = `${client.id}_${today}`;
            const now = Timestamp.now();
            const departureTime = roundTo30Min(format(new Date(), 'HH:mm'));

            // 活動内容を配列形式に変換（サービス記録用）
            // 改行で分割して配列にするか、そのまま配列の1要素にするか
            const activityArray = form.activity ? form.activity.split('\n').filter(Boolean) : [];

            // 1. dailyCheckins 更新
            await setDoc(doc(db, 'dailyCheckins', docId), {
                departureTime: now,
                fatigue: form.fatigue,
                // データ構造を統一
                activities: {
                    am: activityArray, // 統合された活動を午前に割り当て（または全日扱い）
                    pm: [],
                    raw: form.activity
                },
                reflection: form.reflection,
                updatedAt: now,
            }, { merge: true });

            // 2. attendanceRecords 更新（管理画面・印刷用）
            await setDoc(doc(db, 'attendanceRecords', docId), {
                status: 'present',
                endTime: departureTime,
                // 活動実績を上書き保存
                activitiesAm: activityArray,
                activitiesPm: [],
                // 振り返りは別フィールドに保存（specialNotesは加算用なので触らない）
                reflection: form.reflection,
                updatedAt: now,
            }, { merge: true });

            navigate('/portal/home');
        } catch (err) {
            console.error('チェックアウトエラー:', err);
            setError('退所記録に失敗しました');
        } finally {
            setLoading(false);
        }
    };

    const arrivalTime = checkinData?.arrivalTime
        ? format(checkinData.arrivalTime.toDate(), 'HH:mm')
        : '--:--';

    return (
        <Box sx={{ py: 2 }}>
            <Typography variant="h6" align="center" sx={{ mb: 2, color: '#fff' }}>
                退所チェックアウト
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {/* 通所時間表示 */}
            <Paper sx={{ p: 2, mb: 2, bgcolor: 'rgba(16, 185, 129, 0.1)', borderRadius: 2, border: '1px solid #10b981' }}>
                <Typography variant="body2" color="text.secondary">本日の通所時間</Typography>
                <Typography variant="h5" sx={{ color: '#10b981', fontWeight: 'bold' }}>
                    {arrivalTime}
                </Typography>
            </Paper>

            <Paper sx={{ p: 2, mb: 2, bgcolor: 'rgba(30, 41, 59, 0.9)', borderRadius: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 2, color: '#06b6d4' }}>😓 疲労度</Typography>
                <Typography variant="caption" color="text.secondary">今の疲れ具合（1=元気〜5=疲れた）</Typography>
                <Slider
                    value={form.fatigue}
                    onChange={handleSliderChange('fatigue')}
                    min={1}
                    max={5}
                    marks={[
                        { value: 1, label: '元気' },
                        { value: 3, label: '普通' },
                        { value: 5, label: '疲れた' },
                    ]}
                    sx={{ mt: 1 }}
                />
            </Paper>

            <Paper sx={{ p: 2, mb: 2, bgcolor: 'rgba(30, 41, 59, 0.9)', borderRadius: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 2, color: '#06b6d4' }}>📝 今日の活動</Typography>
                <TextField
                    fullWidth
                    size="small"
                    label="今日やったこと"
                    value={form.activity}
                    onChange={handleChange('activity')}
                    multiline
                    rows={4}
                    placeholder="PC訓練、面談など..."
                    sx={{ mb: 2 }}
                />
            </Paper>

            <Paper sx={{ p: 2, mb: 2, bgcolor: 'rgba(30, 41, 59, 0.9)', borderRadius: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 2, color: '#06b6d4' }}>💭 振り返り</Typography>
                <TextField
                    fullWidth
                    size="small"
                    label="今日の気づき・学び"
                    value={form.reflection}
                    onChange={handleChange('reflection')}
                    multiline
                    rows={3}
                    placeholder="今日できたこと、感じたことなど..."
                />
            </Paper>

            <Button
                variant="contained"
                fullWidth
                size="large"
                onClick={handleSubmit}
                disabled={loading}
                sx={{ py: 2, fontSize: '1.1rem', bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' } }}
            >
                {loading ? <CircularProgress size={24} /> : '退所を記録する'}
            </Button>

            <Typography variant="caption" align="center" sx={{ display: 'block', mt: 4, mb: 1, color: 'rgba(255,255,255,0.3)' }}>
                App Version: v2.0 (Sync Fix)
            </Typography>
        </Box>
    );

}
