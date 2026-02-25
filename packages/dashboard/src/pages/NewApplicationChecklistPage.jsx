// src/pages/NewApplicationChecklistPage.jsx
// 新規申請チェックリスト（指定申請に当たっての留意事項）

import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Checkbox,
    Chip,
    Button,
    LinearProgress,
    IconButton,
    Tooltip,
} from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PrintIcon from '@mui/icons-material/Print';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import { collection, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/index';

// チェックリスト項目の定義（画像より）
const CHECKLIST_ITEMS = [
    { id: 1, no: '①', name: 'セルフチェックシート', description: '担当者名、特記事項等を記載してください。', formId: null },
    { id: 2, no: '②', name: '指定障害福祉サービス事業者指定申請書', description: '', formId: '様式第1号' },
    { id: 3, no: '③', name: '就労継続支援事業所の指定に係る記載事項', description: '', formId: '付表11' },
    { id: 4, no: '④', name: '従業者の勤務の体制及び勤務形態一覧表', description: '原則として開始月の予定について作成してください。', formId: '参考様式1' },
    { id: 4.1, no: '', name: '組織体制図', description: '', formId: '組織図', isSubItem: true },
    { id: 5, no: '⑤', name: '従業者免許・資格等一覧表', description: '当該事業所のすべての従業者について、記載してください。', formId: '参考様式2' },
    { id: 5.1, no: '', name: '免許証等の写し', description: '', formId: '免許', isSubItem: true },
    { id: 6, no: '⑥', name: '管理者経歴書', description: '', formId: '参考様式3' },
    { id: 7, no: '⑦', name: 'サービス管理責任者経歴書', description: '', formId: '参考様式3' },
    { id: 7.1, no: '', name: '実務経験証明書', description: '', formId: '〃 3-2', isSubItem: true },
    { id: 8, no: '⑧', name: '事業所の平面図', description: '各室の用途及び面積を記載してください。', formId: '参考様式4' },
    { id: 9, no: '⑨', name: '設備・備品等一覧表', description: '', formId: '参考様式5' },
    { id: 10, no: '⑩', name: '設置設備及び面積等一覧表', description: '', formId: '参考様式6' },
    { id: 11, no: '⑪', name: '運営規程', description: '2ページを参照。', formId: '運営規程' },
    { id: 12, no: '⑫', name: '利用者又はその家族からの苦情を解決するために講ずる措置の概要', description: 'マニュアル添付', formId: '参考様式7' },
    { id: 13, no: '⑬', name: '協力医療機関との契約の内容', description: '添付書類', formId: '参考様式8' },
    { id: 14, no: '⑭', name: '損害賠償保険証書の写し', description: '添付書類', formId: null },
    { id: 15, no: '⑮', name: '主たる対象者を特定する場合における理由等', description: '特定する場合のみ、提出してください（特定しない場合は提出不要）。', formId: '参考様式10' },
    { id: 16, no: '⑯', name: '障害者総合支援法第36条第3項の規定に該当しない旨の誓約書', description: '', formId: '参考様式11' },
    { id: 17, no: '⑰', name: '登記事項証明書', description: '登記簿謄本です。', formId: '膳本' },
    { id: 18, no: '⑱', name: '障害福祉サービス事業開始届', description: '', formId: '様式1' },
    { id: 19, no: '⑲', name: '他法令に違反しない旨の誓約書', description: '右', formId: '右' },
    { id: 20, no: '⑳', name: '他法令に違反しない旨の誓約書', description: '左', formId: '左' },
    { id: 21, no: '㉑', name: '介護給付費等算定に係る体制等に関する届出', description: '届出内容に応じて別紙1〜43を添付してください。', formId: '19-1介護給付' },
    { id: 22, no: '㉒', name: '介護給付費等算定に係る', description: '', formId: '19-2介護給付' },
    { id: 23, no: '㉓', name: '法人番号指定通知書', description: '', formId: null },
];

export default function NewApplicationChecklistPage() {
    const [checkedItems, setCheckedItems] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // 進捗率を計算
    const totalItems = CHECKLIST_ITEMS.length;
    const checkedCount = Object.values(checkedItems).filter(Boolean).length;
    const progressPercent = Math.round((checkedCount / totalItems) * 100);

    // Firestoreから進捗を読み込み
    const loadProgress = useCallback(async () => {
        try {
            // TODO: 実際にはbranchIdを使う
            const docRef = doc(db, 'applicationChecklists', 'new-application-default');
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setCheckedItems(docSnap.data().checkedItems || {});
            }
        } catch (err) {
            console.error('進捗読み込みエラー:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadProgress();
    }, [loadProgress]);

    // チェック状態を変更
    const handleToggle = async (itemId) => {
        const newChecked = { ...checkedItems, [itemId]: !checkedItems[itemId] };
        setCheckedItems(newChecked);

        // Firestoreに保存
        setSaving(true);
        try {
            const docRef = doc(db, 'applicationChecklists', 'new-application-default');
            await setDoc(docRef, {
                checkedItems: newChecked,
                updatedAt: serverTimestamp(),
            }, { merge: true });
        } catch (err) {
            console.error('保存エラー:', err);
        } finally {
            setSaving(false);
        }
    };

    // 印刷
    const handlePrint = () => {
        window.print();
    };

    return (
        <Box sx={{ p: 2 }}>
            {/* ヘッダー */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <AssignmentIcon sx={{ color: '#8b5cf6', fontSize: 28 }} />
                    <Typography variant="h5" sx={{ color: '#fff', fontWeight: 'bold' }}>
                        新規申請チェックリスト
                    </Typography>
                    <Typography variant="subtitle2" sx={{ color: '#94a3b8' }}>
                        指定申請に当たっての留意事項【就労移行支援】
                    </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {/* 進捗 */}
                    <Box sx={{ minWidth: 200 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="caption" sx={{ color: '#94a3b8' }}>進捗</Typography>
                            <Typography variant="caption" sx={{ color: progressPercent === 100 ? '#10b981' : '#f59e0b', fontWeight: 'bold' }}>
                                {checkedCount}/{totalItems} ({progressPercent}%)
                            </Typography>
                        </Box>
                        <LinearProgress
                            variant="determinate"
                            value={progressPercent}
                            sx={{
                                height: 8,
                                borderRadius: 4,
                                bgcolor: 'rgba(100, 116, 139, 0.3)',
                                '& .MuiLinearProgress-bar': {
                                    bgcolor: progressPercent === 100 ? '#10b981' : '#8b5cf6',
                                    borderRadius: 4,
                                },
                            }}
                        />
                    </Box>

                    {/* 印刷ボタン */}
                    <Tooltip title="印刷">
                        <IconButton
                            onClick={handlePrint}
                            sx={{
                                bgcolor: 'rgba(139, 92, 246, 0.2)',
                                color: '#8b5cf6',
                                '&:hover': { bgcolor: 'rgba(139, 92, 246, 0.3)' },
                            }}
                        >
                            <PrintIcon />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>

            {/* 説明 */}
            <Paper sx={{ p: 2, mb: 2, bgcolor: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                    提出書類は次のとおりです。チェックの上提出してください。<br />
                    なお、提出書類は原則としてA4版とし、次の順序に並べた上で提出してください。
                </Typography>
            </Paper>

            {/* チェックリストテーブル */}
            <TableContainer component={Paper} sx={{ bgcolor: 'rgba(30, 41, 59, 0.9)' }}>
                <Table size="small">
                    <TableHead>
                        <TableRow sx={{ bgcolor: 'rgba(139, 92, 246, 0.2)' }}>
                            <TableCell sx={{ color: '#fff', fontWeight: 'bold', width: 60 }}>✓</TableCell>
                            <TableCell sx={{ color: '#fff', fontWeight: 'bold', width: 50 }}>No</TableCell>
                            <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>提出書類</TableCell>
                            <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>説明</TableCell>
                            <TableCell sx={{ color: '#fff', fontWeight: 'bold', width: 120 }}>様式</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {CHECKLIST_ITEMS.map((item) => {
                            const isChecked = checkedItems[item.id] || false;
                            return (
                                <TableRow
                                    key={item.id}
                                    hover
                                    onClick={() => handleToggle(item.id)}
                                    sx={{
                                        cursor: 'pointer',
                                        bgcolor: isChecked ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
                                        '&:hover': { bgcolor: isChecked ? 'rgba(16, 185, 129, 0.15)' : 'rgba(139, 92, 246, 0.1)' },
                                        pl: item.isSubItem ? 4 : 0,
                                    }}
                                >
                                    <TableCell>
                                        <Checkbox
                                            checked={isChecked}
                                            onChange={() => handleToggle(item.id)}
                                            icon={<RadioButtonUncheckedIcon sx={{ color: '#64748b' }} />}
                                            checkedIcon={<CheckCircleIcon sx={{ color: '#10b981' }} />}
                                        />
                                    </TableCell>
                                    <TableCell sx={{ color: '#fff', fontSize: '1rem' }}>{item.no}</TableCell>
                                    <TableCell sx={{ color: isChecked ? '#10b981' : '#fff', pl: item.isSubItem ? 4 : 2 }}>
                                        {item.isSubItem && '└ '}
                                        {item.name}
                                    </TableCell>
                                    <TableCell sx={{ color: '#94a3b8', fontSize: '0.85rem' }}>{item.description}</TableCell>
                                    <TableCell>
                                        {item.formId && (
                                            <Chip
                                                label={item.formId}
                                                size="small"
                                                sx={{
                                                    bgcolor: 'rgba(59, 130, 246, 0.2)',
                                                    color: '#3b82f6',
                                                    fontSize: '0.75rem',
                                                }}
                                            />
                                        )}
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* 保存中インジケーター */}
            {saving && (
                <Typography variant="caption" sx={{ color: '#94a3b8', mt: 1, display: 'block' }}>
                    保存中...
                </Typography>
            )}
        </Box>
    );
}
