// src/features/service-records/ServiceRecordEditModal.jsx
// サービス記録編集モーダル

import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Box,
    Typography,
    Chip,
    Divider,
    CircularProgress,
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import BusinessIcon from '@mui/icons-material/Business';
import { doc, setDoc, updateDoc, serverTimestamp, Timestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/index';
import { format } from 'date-fns';
import ja from 'date-fns/locale/ja';
import { useAuth } from '../auth/context/AuthContext';
import { CHARGE_FIELD_MAP } from '../../constants/chargeFields';

export default function ServiceRecordEditModal({
    open,
    onClose,
    attendanceRecord,
    serviceRecord,
    onSave,
}) {
    const { currentUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [fetchedDocId, setFetchedDocId] = useState('');
    const [checkInData, setCheckInData] = useState(null);
    const [enabledCharges, setEnabledCharges] = useState([]);
    const [chargeStates, setChargeStates] = useState({});
    const [form, setForm] = useState({
        specialNotes: '',
        supportContent: '',
        remoteContactTimeMorning: '',
        remoteContactTimeEvening: '',
        activitiesAmText: '',
        activitiesPmText: '',
    });

    // チェックインデータを取得
    useEffect(() => {
        if (!attendanceRecord) return;

        const fetchCheckIn = async () => {
            try {
                const dateStr = format(attendanceRecord.date, 'yyyy-MM-dd');
                // ID生成ルールが合わない可能性があるため、クエリ検索に変更
                const q = query(
                    collection(db, 'dailyCheckins'),
                    where('clientId', '==', attendanceRecord.clientId),
                    where('date', '==', dateStr)
                );

                const querySnapshot = await getDocs(q);

                if (!querySnapshot.empty) {
                    const docData = querySnapshot.docs[0].data();
                    setCheckInData(docData);
                    setFetchedDocId(querySnapshot.docs[0].id); // 実際のIDを記録
                } else {
                    setFetchedDocId('NOT_FOUND');
                    // dailyCheckinsが見つからない場合、attendanceRecord内のデータを使用（バックアップ）
                    if (attendanceRecord.activitiesAm || attendanceRecord.activitiesPm) {
                        setCheckInData({
                            activities: {
                                am: attendanceRecord.activitiesAm || [],
                                pm: attendanceRecord.activitiesPm || [],
                                note: attendanceRecord.specialNotes || ''
                            }
                        });
                    } else {
                        setCheckInData(null);
                    }
                }
            } catch (err) {
                console.error('チェックインデータ取得エラー:', err);
            }
        };

        fetchCheckIn();
    }, [attendanceRecord]);


    // 支店設定から有効な加算項目を読み込み
    useEffect(() => {
        const loadCharges = async () => {
            try {
                const branchesSnapshot = await getDocs(collection(db, 'branches'));
                if (!branchesSnapshot.empty) {
                    const branchData = branchesSnapshot.docs[0].data();
                    const charges = Object.entries(CHARGE_FIELD_MAP)
                        .filter(([fieldKey]) => branchData[fieldKey] === true)
                        .map(([, mapping]) => mapping);
                    if (charges.length > 0) {
                        setEnabledCharges(charges);
                    } else {
                        setEnabledCharges([
                            CHARGE_FIELD_MAP.attendanceMealSupport,
                            CHARGE_FIELD_MAP.attendanceTransportGoing,
                            CHARGE_FIELD_MAP.attendanceTransportReturning,
                        ]);
                    }
                } else {
                    setEnabledCharges([
                        CHARGE_FIELD_MAP.attendanceMealSupport,
                        CHARGE_FIELD_MAP.attendanceTransportGoing,
                        CHARGE_FIELD_MAP.attendanceTransportReturning,
                    ]);
                }
            } catch (err) {
                console.error('支店設定の取得に失敗:', err);
            }
        };
        loadCharges();
    }, []);

    // attendanceRecordからserviceDetailsの初期状態を読み込み
    useEffect(() => {
        if (attendanceRecord?.serviceDetails) {
            setChargeStates(attendanceRecord.serviceDetails);
        } else {
            setChargeStates({});
        }
    }, [attendanceRecord]);

    // 加算チップのトグル処理（即座にFirestoreを更新）
    const handleChargeToggle = async (chargeKey) => {
        if (!attendanceRecord?.id) return;
        const newValue = !chargeStates[chargeKey];
        setChargeStates(prev => ({ ...prev, [chargeKey]: newValue }));
        try {
            await updateDoc(doc(db, 'attendanceRecords', attendanceRecord.id), {
                [`serviceDetails.${chargeKey}`]: newValue,
                updatedAt: serverTimestamp(),
            });
        } catch (err) {
            console.error('加算の更新に失敗:', err);
            alert('加算の更新に失敗しました');
        }
    };

    useEffect(() => {
        if (serviceRecord) {
            setForm({
                specialNotes: serviceRecord.specialNotes || '',
                supportContent: serviceRecord.supportContent || '',
                remoteContactTimeMorning: serviceRecord.remoteContactTimeMorning || '',
                remoteContactTimeEvening: serviceRecord.remoteContactTimeEvening || '',
                activitiesAmText: (serviceRecord.activitiesAm || []).join(', '),
                activitiesPmText: (serviceRecord.activitiesPm || []).join(', '),
            });
        } else {
            setForm({
                specialNotes: '',
                supportContent: '',
                remoteContactTimeMorning: '',
                remoteContactTimeEvening: '',
                activitiesAmText: attendanceRecord ? ((attendanceRecord.activitiesAm || []).join(', ')) : '',
                activitiesPmText: attendanceRecord ? ((attendanceRecord.activitiesPm || []).join(', ')) : '',
            });
        }
    }, [serviceRecord, attendanceRecord]);

    const handleChange = (field) => (e) => {
        setForm(prev => ({ ...prev, [field]: e.target.value }));
    };

    const handleSave = async () => {
        if (!attendanceRecord) return;

        setLoading(true);
        try {
            const recordData = {
                attendanceRecordId: attendanceRecord.id,
                clientId: attendanceRecord.clientId,
                clientName: attendanceRecord.clientName || '',
                date: Timestamp.fromDate(attendanceRecord.date),
                startTime: attendanceRecord.startTime || '',
                endTime: attendanceRecord.endTime || '',
                attendanceType: attendanceRecord.attendanceType || 'onsite',
                activitiesAm: form.activitiesAmText.split(/[,、]/).map(s => s.trim()).filter(s => s),
                activitiesPm: form.activitiesPmText.split(/[,、]/).map(s => s.trim()).filter(s => s),
                specialNotes: form.specialNotes,
                supportContent: form.supportContent,
                remoteContactTimeMorning: form.remoteContactTimeMorning || '',
                remoteContactTimeEvening: form.remoteContactTimeEvening || '',
                recorderName: currentUser?.displayName || currentUser?.name || '',
                recorderId: currentUser?.uid || '',
                isCompleted: true,
                completedAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            };

            if (serviceRecord?.id) {
                // 更新
                await updateDoc(doc(db, 'serviceRecords', serviceRecord.id), recordData);
            } else {
                // 新規作成
                recordData.createdAt = serverTimestamp();
                await setDoc(doc(collection(db, 'serviceRecords')), recordData);
            }

            onSave?.();
        } catch (err) {
            console.error('保存エラー:', err);
            alert('保存に失敗しました');
        } finally {
            setLoading(false);
        }
    };

    if (!attendanceRecord) return null;

    const getDayOfWeek = (date) => {
        const days = ['日', '月', '火', '水', '木', '金', '土'];
        return days[date.getDay()];
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: { bgcolor: '#1e293b', color: '#fff' }
            }}
        >
            <DialogTitle sx={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="h6">サービス記録編集</Typography>
                    {attendanceRecord.attendanceType === 'remote' ? (
                        <Chip
                            icon={<HomeIcon sx={{ fontSize: 16 }} />}
                            label="在宅"
                            size="small"
                            sx={{ bgcolor: 'rgba(139, 92, 246, 0.2)', color: '#a78bfa' }}
                        />
                    ) : (
                        <Chip
                            icon={<BusinessIcon sx={{ fontSize: 16 }} />}
                            label="通所"
                            size="small"
                            sx={{ bgcolor: 'rgba(16, 185, 129, 0.2)', color: '#10b981' }}
                        />
                    )}
                </Box>
            </DialogTitle>

            <DialogContent sx={{ mt: 2 }}>
                {/* 基本情報 */}
                <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" sx={{ color: '#fff', mb: 1 }}>
                        {attendanceRecord.clientName || '名前なし'}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                        {format(attendanceRecord.date, 'yyyy年M月d日', { locale: ja })} ({getDayOfWeek(attendanceRecord.date)})
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                        {attendanceRecord.startTime || '--:--'} 〜 {attendanceRecord.endTime || '--:--'}
                    </Typography>
                </Box>

                <Divider sx={{ bgcolor: 'rgba(255,255,255,0.1)', mb: 2 }} />

                {/* 健康状態（チェックインより） */}
                {checkInData && (
                    <Box sx={{ mb: 3, bgcolor: 'rgba(15, 23, 42, 0.5)', p: 2, borderRadius: 2, border: '1px solid rgba(255,255,255,0.1)' }}>
                        <Typography variant="subtitle2" sx={{ color: '#06b6d4', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                            🏥 健康状態
                        </Typography>

                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                            {/* 体温・食事 */}
                            <Box>
                                <Typography variant="caption" color="text.secondary">体温</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{attendanceRecord.temperature || checkInData.temperature || '--'}℃</Typography>
                            </Box>
                            <Box>
                                <Typography variant="caption" color="text.secondary">食事</Typography>
                                <Typography variant="body2">{checkInData.meals ? `レベル ${checkInData.meals}` : '--'}</Typography>
                            </Box>

                            {/* 睡眠 */}
                            <Box sx={{ gridColumn: '1 / -1' }}>
                                <Typography variant="caption" color="text.secondary">睡眠</Typography>
                                <Typography variant="body2">
                                    {checkInData.sleep?.bedtime || '--:--'} 〜 {checkInData.sleep?.wakeTime || '--:--'}
                                    (質: {checkInData.sleep?.quality || '-'})
                                </Typography>
                            </Box>

                            {/* 気分 */}
                            <Box sx={{ gridColumn: '1 / -1' }}>
                                <Typography variant="caption" color="text.secondary">気分</Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                    {(checkInData.mood?.types || []).map((t, i) => (
                                        <Chip key={i} label={t} size="small" sx={{ bgcolor: 'rgba(6, 182, 212, 0.2)', color: '#06b6d4', fontSize: '0.7rem' }} />
                                    ))}
                                    <Typography variant="body2" sx={{ ml: 1 }}>
                                        (レベル: {checkInData.mood?.level || '-'})
                                    </Typography>
                                </Box>
                            </Box>

                            {/* 服薬 */}
                            <Box sx={{ gridColumn: '1 / -1' }}>
                                <Typography variant="caption" color="text.secondary">服薬状況</Typography>
                                <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                                    朝: {checkInData.medication?.morning === 'taken' ? '○' : checkInData.medication?.morning === 'not_taken' ? '×' : '-'} /
                                    昼: {checkInData.medication?.noon === 'taken' ? '○' : checkInData.medication?.noon === 'not_taken' ? '×' : '-'} /
                                    夜: {checkInData.medication?.evening === 'taken' ? '○' : checkInData.medication?.evening === 'not_taken' ? '×' : '-'}
                                </Typography>
                                {checkInData.medication?.missedReason && (
                                    <Typography variant="caption" sx={{ color: '#f59e0b', display: 'block', mt: 0.5 }}>
                                        ※ {checkInData.medication.missedReason}
                                    </Typography>
                                )}
                            </Box>
                        </Box>
                    </Box>
                )}

                {/* 加算セクション */}
                {enabledCharges.length > 0 && (
                    <Box sx={{ mb: 3, bgcolor: 'rgba(15, 23, 42, 0.5)', p: 2, borderRadius: 2, border: '1px solid rgba(255,255,255,0.1)' }}>
                        <Typography variant="subtitle2" sx={{ color: '#f59e0b', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                            加算
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {enabledCharges.map(charge => {
                                const isActive = chargeStates[charge.key] || false;
                                return (
                                    <Chip
                                        key={charge.key}
                                        label={charge.label}
                                        size="small"
                                        clickable
                                        onClick={() => handleChargeToggle(charge.key)}
                                        sx={{
                                            fontSize: '0.8rem',
                                            height: 28,
                                            bgcolor: isActive ? `${charge.color}30` : 'transparent',
                                            color: isActive ? charge.color : '#94a3b8',
                                            border: '1px solid',
                                            borderColor: isActive ? `${charge.color}50` : '#4a556830',
                                            cursor: 'pointer',
                                            '&:hover': {
                                                bgcolor: isActive ? `${charge.color}40` : '#4a556820',
                                            },
                                        }}
                                    />
                                );
                            })}
                        </Box>
                    </Box>
                )}

                <Divider sx={{ bgcolor: 'rgba(255,255,255,0.1)', mb: 2 }} />

                <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" sx={{ color: '#06b6d4', mb: 1 }}>
                        📋 活動内容（午前・午後）
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                        <TextField
                            fullWidth
                            label="午前"
                            value={form.activitiesAmText}
                            onChange={handleChange('activitiesAmText')}
                            placeholder="活動1, 活動2..."
                            InputLabelProps={{ shrink: true }}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    color: '#06b6d4',
                                    fontSize: '0.95rem',
                                    '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                                    '&.Mui-focused fieldset': { borderColor: '#06b6d4' },
                                },
                                '& .MuiInputLabel-root': { color: '#06b6d4' },
                            }}
                        />
                        <TextField
                            fullWidth
                            label="午後"
                            value={form.activitiesPmText}
                            onChange={handleChange('activitiesPmText')}
                            placeholder="活動1, 活動2..."
                            InputLabelProps={{ shrink: true }}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    color: '#a78bfa',
                                    fontSize: '0.95rem',
                                    '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                                    '&.Mui-focused fieldset': { borderColor: '#a78bfa' },
                                },
                                '& .MuiInputLabel-root': { color: '#a78bfa' },
                            }}
                        />
                    </Box>
                    {(checkInData?.activities?.am || []).length > 0 || (checkInData?.activities?.pm || []).length > 0 ? (
                        <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mt: -1, mb: 2 }}>
                            ※ チェックイン時の入力: {(checkInData?.activities?.am || []).join(', ')} / {(checkInData?.activities?.pm || []).join(', ')}
                        </Typography>
                    ) : null}
                </Box>

                <Divider sx={{ bgcolor: 'rgba(255,255,255,0.1)', mb: 2 }} />

                {/* 在宅時連絡時刻（在宅の場合のみ表示） */}
                {attendanceRecord.attendanceType === 'remote' && (
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" sx={{ color: '#06b6d4', mb: 1 }}>
                            📞 在宅時連絡時刻
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField
                                label="朝"
                                type="time"
                                value={form.remoteContactTimeMorning}
                                onChange={handleChange('remoteContactTimeMorning')}
                                size="small"
                                sx={{
                                    flex: 1,
                                    '& .MuiOutlinedInput-root': {
                                        color: '#fff',
                                        '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                                        '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                                        '&.Mui-focused fieldset': { borderColor: '#06b6d4' },
                                    },
                                    '& .MuiInputLabel-root': { color: '#94a3b8' },
                                    '& .MuiInputLabel-root.Mui-focused': { color: '#06b6d4' },
                                }}
                                InputLabelProps={{ shrink: true }}
                            />
                            <TextField
                                label="夕方"
                                type="time"
                                value={form.remoteContactTimeEvening}
                                onChange={handleChange('remoteContactTimeEvening')}
                                size="small"
                                sx={{
                                    flex: 1,
                                    '& .MuiOutlinedInput-root': {
                                        color: '#fff',
                                        '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                                        '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                                        '&.Mui-focused fieldset': { borderColor: '#06b6d4' },
                                    },
                                    '& .MuiInputLabel-root': { color: '#94a3b8' },
                                    '& .MuiInputLabel-root.Mui-focused': { color: '#06b6d4' },
                                }}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Box>
                    </Box>
                )}

                {/* スタッフ入力フィールド */}
                <Box sx={{ mb: 2 }}>
                    <TextField
                        fullWidth
                        multiline
                        rows={2}
                        label="✏️ 特記事項"
                        value={form.specialNotes}
                        onChange={handleChange('specialNotes')}
                        placeholder="特記事項があれば入力..."
                        InputLabelProps={{ shrink: true }}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                color: '#fff',
                                fontSize: '0.95rem',
                                '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                                '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                                '&.Mui-focused fieldset': { borderColor: '#f59e0b' },
                            },
                            '& .MuiInputLabel-root': { color: '#f59e0b' },
                        }}
                    />
                </Box>

                <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ color: '#10b981', mb: 1 }}>
                        📝 支援内容
                    </Typography>
                    <TextField
                        fullWidth
                        multiline
                        rows={3}
                        value={form.supportContent}
                        onChange={handleChange('supportContent')}
                        placeholder="支援内容を入力..."
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                color: '#fff',
                                fontSize: '0.95rem',
                                '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                                '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                                '&.Mui-focused fieldset': { borderColor: '#10b981' },
                            },
                        }}
                    />
                </Box>
            </DialogContent>

            <DialogActions sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <Button onClick={onClose} sx={{ color: '#94a3b8' }}>
                    キャンセル
                </Button>
                <Button
                    variant="contained"
                    onClick={handleSave}
                    disabled={loading}
                    sx={{
                        bgcolor: '#10b981',
                        '&:hover': { bgcolor: '#059669' },
                    }}
                >
                    {loading ? <CircularProgress size={20} /> : '保存'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
