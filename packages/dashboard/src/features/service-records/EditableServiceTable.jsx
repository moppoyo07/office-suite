// src/features/service-records/EditableServiceTable.jsx
// 印刷プレビュー風のインライン編集テーブル

import React, { useState } from 'react';
import {
    Box,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Button,
    Chip,
    IconButton,
    CircularProgress,
} from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/index';
import { format } from 'date-fns';
import ja from 'date-fns/locale/ja';

const getDayOfWeek = (date) => {
    const days = ['日', '月', '火', '水', '木', '金', '土'];
    return days[date.getDay()];
};

export default function EditableServiceTable({
    clientName,
    records, // { ...attendanceRecord, serviceRecord } の配列
    month,
    onClose,
    onPrint,
    onSave,
}) {
    const [editedRecords, setEditedRecords] = useState({});
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    // 編集中の値を管理
    const handleFieldChange = (recordId, field, value) => {
        setEditedRecords(prev => ({
            ...prev,
            [recordId]: {
                ...prev[recordId],
                [field]: value,
            },
        }));
        setSaved(false);
    };

    // 現在の値を取得（編集中 → serviceRecord → record の順で探す）
    // startTime/endTimeはattendanceRecord専用なのでserviceRecordを参照しない
    const getValue = (record, field) => {
        if (editedRecords[record.id]?.[field] !== undefined) {
            return editedRecords[record.id][field];
        }
        const timeFields = ['startTime', 'endTime'];
        if (timeFields.includes(field)) {
            return record[field] || '';
        }
        if (record.serviceRecord?.[field] !== undefined) {
            return record.serviceRecord[field];
        }
        return record[field] || '';
    };

    // 配列データ取得（午前/午後活動用） - serviceRecordを優先
    const getArrayValue = (record, field) => {
        const sr = record.serviceRecord || {};
        // serviceRecordにあればそちらを優先
        if (sr[field] && Array.isArray(sr[field]) && sr[field].length > 0) {
            return sr[field];
        }
        // なければattendanceRecordから
        const arr = record[field] || [];
        return Array.isArray(arr) ? arr : [];
    };

    // 保存処理
    const handleSave = async () => {
        setSaving(true);
        try {
            const updates = Object.entries(editedRecords);

            for (const [recordId, changes] of updates) {
                const record = records.find(r => r.id === recordId);
                if (!record) continue;

                // テキストを配列に変換（午前/午後活動用）
                const serviceChanges = { ...changes };
                if (changes.activitiesAmText !== undefined) {
                    serviceChanges.activitiesAm = changes.activitiesAmText
                        .split(/[,、]/)
                        .map(s => s.trim())
                        .filter(s => s);
                    delete serviceChanges.activitiesAmText;
                }
                if (changes.activitiesPmText !== undefined) {
                    serviceChanges.activitiesPm = changes.activitiesPmText
                        .split(/[,、]/)
                        .map(s => s.trim())
                        .filter(s => s);
                    delete serviceChanges.activitiesPmText;
                }

                // serviceRecordsを更新（出退時間はattendanceRecords専用なので除外）
                const { startTime, endTime, ...serviceOnlyChanges } = serviceChanges;
                if (record.serviceRecord?.id && Object.keys(serviceOnlyChanges).length > 0) {
                    await updateDoc(doc(db, 'serviceRecords', record.serviceRecord.id), {
                        ...serviceOnlyChanges,
                        updatedAt: serverTimestamp(),
                    });
                }

                // 特定フィールドはattendanceRecordsも更新
                const attendanceFields = ['specialNotes', 'remoteContactTimeMorning', 'remoteContactTimeEvening', 'startTime', 'endTime'];
                const attendanceUpdates = {};
                for (const field of attendanceFields) {
                    if (changes[field] !== undefined) {
                        attendanceUpdates[field] = changes[field];
                    }
                }
                if (Object.keys(attendanceUpdates).length > 0) {
                    await updateDoc(doc(db, 'attendanceRecords', recordId), {
                        ...attendanceUpdates,
                        updatedAt: serverTimestamp(),
                    });

                }
            }

            setSaved(true);
            onSave?.();
        } catch (err) {
            console.error('保存エラー:', err);
            alert('保存に失敗しました');
        } finally {
            setSaving(false);
        }
    };

    const hasChanges = Object.keys(editedRecords).length > 0;

    return (
        <Box sx={{
            bgcolor: '#1e293b',
            borderRadius: 2,
            overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.1)',
        }}>
            {/* ヘッダー */}
            <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                p: 2,
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                bgcolor: 'rgba(15, 23, 42, 0.8)',
            }}>
                <Box>
                    <Typography variant="h6" sx={{ color: '#fff', fontWeight: 'bold' }}>
                        {clientName}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                        {format(month, 'yyyy年M月', { locale: ja })} ({records.length}件)
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    {hasChanges && (
                        <Button
                            variant="contained"
                            size="small"
                            startIcon={saving ? <CircularProgress size={16} /> : <SaveIcon />}
                            onClick={handleSave}
                            disabled={saving}
                            sx={{ bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' } }}
                        >
                            保存
                        </Button>
                    )}
                    {saved && (
                        <Chip label="保存済み" size="small" sx={{ bgcolor: 'rgba(16, 185, 129, 0.2)', color: '#10b981' }} />
                    )}
                    <IconButton
                        size="small"
                        onClick={onClose}
                        sx={{ color: '#94a3b8' }}
                    >
                        <CloseIcon />
                    </IconButton>
                </Box>
            </Box>

            {/* テーブル */}
            <TableContainer sx={{ maxHeight: 450 }}>
                <Table size="small" stickyHeader>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ bgcolor: '#0f172a', color: '#94a3b8', fontWeight: 'bold', width: 55, fontSize: '0.7rem', px: 0.5 }}>日付</TableCell>
                            <TableCell sx={{ bgcolor: '#0f172a', color: '#94a3b8', fontWeight: 'bold', width: 40, fontSize: '0.7rem', px: 0.5 }}>形態</TableCell>
                            <TableCell sx={{ bgcolor: '#0f172a', color: '#3b82f6', fontWeight: 'bold', width: 90, fontSize: '0.7rem', px: 0.5 }}>出退時間</TableCell>
                            <TableCell sx={{ bgcolor: '#0f172a', color: '#06b6d4', fontWeight: 'bold', fontSize: '0.7rem', px: 0.5 }}>午前</TableCell>
                            <TableCell sx={{ bgcolor: '#0f172a', color: '#8b5cf6', fontWeight: 'bold', fontSize: '0.7rem', px: 0.5 }}>午後</TableCell>
                            <TableCell sx={{ bgcolor: '#0f172a', color: '#10b981', fontWeight: 'bold', fontSize: '0.7rem', px: 0.5 }}>支援内容</TableCell>
                            <TableCell sx={{ bgcolor: '#0f172a', color: '#f59e0b', fontWeight: 'bold', fontSize: '0.7rem', px: 0.5 }}>特記</TableCell>
                            <TableCell sx={{ bgcolor: '#0f172a', color: '#ec4899', fontWeight: 'bold', width: 80, fontSize: '0.7rem', px: 0.5 }}>連絡時間</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {records.map((record) => {
                            const isRemote = record.attendanceType === 'remote';
                            return (
                                <TableRow
                                    key={record.id}
                                    sx={{
                                        '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' },
                                        bgcolor: editedRecords[record.id] ? 'rgba(6, 182, 212, 0.1)' : 'transparent',
                                    }}
                                >
                                    {/* 日付 */}
                                    <TableCell sx={{ color: '#fff', fontSize: '0.7rem', px: 0.5 }}>
                                        {format(record.date, 'M/d', { locale: ja })}
                                        <span style={{ color: '#64748b', fontSize: '0.6rem' }}>({getDayOfWeek(record.date)})</span>
                                    </TableCell>
                                    {/* 形態 */}
                                    <TableCell sx={{ px: 0.5 }}>
                                        <Chip
                                            label={isRemote ? '在宅' : '通所'}
                                            size="small"
                                            sx={{
                                                bgcolor: isRemote ? 'rgba(139, 92, 246, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                                                color: isRemote ? '#a78bfa' : '#10b981',
                                                fontSize: '0.55rem',
                                                height: 16,
                                            }}
                                        />
                                    </TableCell>
                                    {/* 出退時間（編集可能） */}
                                    <TableCell sx={{ px: 0.5 }}>
                                        <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                                            <TextField
                                                size="small"
                                                variant="standard"
                                                type="time"
                                                value={getValue(record, 'startTime')}
                                                onChange={(e) => handleFieldChange(record.id, 'startTime', e.target.value)}
                                                inputProps={{ style: { fontSize: '0.65rem', color: '#3b82f6', padding: 0 } }}
                                                sx={{
                                                    width: 38,
                                                    '& .MuiInput-root:before': { borderColor: 'rgba(255,255,255,0.1)' },
                                                }}
                                            />
                                            <Typography sx={{ color: '#475569', fontSize: '0.6rem' }}>〜</Typography>
                                            <TextField
                                                size="small"
                                                variant="standard"
                                                type="time"
                                                value={getValue(record, 'endTime')}
                                                onChange={(e) => handleFieldChange(record.id, 'endTime', e.target.value)}
                                                inputProps={{ style: { fontSize: '0.65rem', color: '#ef4444', padding: 0 } }}
                                                sx={{
                                                    width: 38,
                                                    '& .MuiInput-root:before': { borderColor: 'rgba(255,255,255,0.1)' },
                                                }}
                                            />
                                        </Box>
                                    </TableCell>
                                    {/* 午前活動（編集可能） */}
                                    <TableCell sx={{ px: 0.5 }}>
                                        <TextField
                                            size="small"
                                            variant="standard"
                                            fullWidth
                                            value={editedRecords[record.id]?.activitiesAmText !== undefined
                                                ? editedRecords[record.id].activitiesAmText
                                                : getArrayValue(record, 'activitiesAm').join(', ')}
                                            onChange={(e) => handleFieldChange(record.id, 'activitiesAmText', e.target.value)}
                                            placeholder="午前..."
                                            sx={{
                                                '& .MuiInput-root': { color: '#06b6d4', fontSize: '0.7rem' },
                                                '& .MuiInput-root:before': { borderColor: 'rgba(255,255,255,0.1)' },
                                            }}
                                        />
                                    </TableCell>
                                    {/* 午後活動（編集可能） */}
                                    <TableCell sx={{ px: 0.5 }}>
                                        <TextField
                                            size="small"
                                            variant="standard"
                                            fullWidth
                                            value={editedRecords[record.id]?.activitiesPmText !== undefined
                                                ? editedRecords[record.id].activitiesPmText
                                                : getArrayValue(record, 'activitiesPm').join(', ')}
                                            onChange={(e) => handleFieldChange(record.id, 'activitiesPmText', e.target.value)}
                                            placeholder="午後..."
                                            sx={{
                                                '& .MuiInput-root': { color: '#8b5cf6', fontSize: '0.7rem' },
                                                '& .MuiInput-root:before': { borderColor: 'rgba(255,255,255,0.1)' },
                                            }}
                                        />
                                    </TableCell>
                                    {/* 支援内容（編集可能） */}
                                    <TableCell sx={{ px: 0.5 }}>
                                        <TextField
                                            size="small"
                                            variant="standard"
                                            fullWidth
                                            value={getValue(record, 'supportContent')}
                                            onChange={(e) => handleFieldChange(record.id, 'supportContent', e.target.value)}
                                            placeholder="..."
                                            sx={{
                                                '& .MuiInput-root': { color: '#10b981', fontSize: '0.7rem' },
                                                '& .MuiInput-root:before': { borderColor: 'rgba(255,255,255,0.1)' },
                                            }}
                                        />
                                    </TableCell>
                                    {/* 特記事項（編集可能） */}
                                    <TableCell sx={{ px: 0.5 }}>
                                        <TextField
                                            size="small"
                                            variant="standard"
                                            fullWidth
                                            value={getValue(record, 'specialNotes')}
                                            onChange={(e) => handleFieldChange(record.id, 'specialNotes', e.target.value)}
                                            placeholder="..."
                                            sx={{
                                                '& .MuiInput-root': { color: '#f59e0b', fontSize: '0.7rem' },
                                                '& .MuiInput-root:before': { borderColor: 'rgba(255,255,255,0.1)' },
                                            }}
                                        />
                                    </TableCell>
                                    {/* 連絡時間（在宅のみ編集可能） */}
                                    <TableCell sx={{ px: 0.5 }}>
                                        {isRemote ? (
                                            <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                                                <TextField
                                                    size="small"
                                                    variant="standard"
                                                    value={getValue(record, 'remoteContactTimeMorning')}
                                                    onChange={(e) => handleFieldChange(record.id, 'remoteContactTimeMorning', e.target.value)}
                                                    placeholder="朝"
                                                    sx={{
                                                        width: 35,
                                                        '& .MuiInput-root': { color: '#ec4899', fontSize: '0.65rem' },
                                                        '& .MuiInput-root:before': { borderColor: 'rgba(255,255,255,0.1)' },
                                                    }}
                                                />
                                                <Typography sx={{ color: '#64748b', fontSize: '0.6rem' }}>〜</Typography>
                                                <TextField
                                                    size="small"
                                                    variant="standard"
                                                    value={getValue(record, 'remoteContactTimeEvening')}
                                                    onChange={(e) => handleFieldChange(record.id, 'remoteContactTimeEvening', e.target.value)}
                                                    placeholder="夕"
                                                    sx={{
                                                        width: 35,
                                                        '& .MuiInput-root': { color: '#ec4899', fontSize: '0.65rem' },
                                                        '& .MuiInput-root:before': { borderColor: 'rgba(255,255,255,0.1)' },
                                                    }}
                                                />
                                            </Box>
                                        ) : (
                                            <Typography sx={{ color: '#475569', fontSize: '0.65rem' }}>-</Typography>
                                        )}
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
}
