import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Chip,
    CircularProgress,
    IconButton,
    Divider,
    Collapse,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Stack,
} from '@mui/material';
import {
    CheckCircle as CheckCircleIcon,
    RadioButtonUnchecked as UncheckedIcon,
    EmojiEvents as TrophyIcon,
    KeyboardArrowDown as ArrowDownIcon,
    KeyboardArrowUp as ArrowUpIcon,
    Add as AddIcon,
} from '@mui/icons-material';
import { doc, setDoc, addDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/index';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

// Firestoreにカテゴリが未登録の場合のフォールバック（活動ログ対象は除外）
const FALLBACK_QUESTS = [
    { id: 'water_refill',    label: 'ウォーターサーバー水補給', points: 10 },
    { id: 'office_cleaning', label: '事務所内の掃除機がけ',     points: 15 },
    { id: 'mail_check',      label: '自治体メールチェック',     points: 5  },
    { id: 'blog_post',       label: 'ブログ更新',               points: 30 },
];

// ポイントを閲覧できるロール（支店管理者以上）
const POINT_VISIBLE_ROLES = ['platform_owner', 'company_admin', 'branch_manager'];

export default function DailyQuestBoard({ currentUser }) {
    const [loading, setLoading] = useState(true);
    const [tasks, setTasks] = useState([]);
    const [todayPoints, setTodayPoints] = useState(0);
    const [isExpanded, setIsExpanded] = useState(true);

    // クエスト追加ダイアログ
    const [addDialog, setAddDialog] = useState(false);
    const [addForm, setAddForm] = useState({ label: '', description: '' });
    const [addSaving, setAddSaving] = useState(false);

    // ポイント表示権限（オーナー・会社管理者のみ）
    const canSeePoints = POINT_VISIBLE_ROLES.includes(currentUser?.role);

    // 今日の日付文字列 (YYYY-MM-DD)
    const todayStr = format(new Date(), 'yyyy-MM-dd');

    useEffect(() => {
        if (!currentUser) return;
        fetchDailyProgress();
    }, [currentUser, todayStr]);

    // 今日の進捗を取得（Firestoreカテゴリ＋カスタム）
    const fetchDailyProgress = async () => {
        try {
            setLoading(true);

            // 1. 今日の完了済みタスクを取得
            const taskSnap = await getDocs(query(
                collection(db, 'staffTasks'),
                where('userId', '==', currentUser.uid),
                where('date', '==', todayStr)
            ));
            const taskMap = {};
            let points = 0;
            taskSnap.forEach(d => {
                const data = d.data();
                taskMap[data.taskId] = data;
                if (data.status === 'completed') points += (data.points || 0);
            });

            // 2. Firestoreのクエストカテゴリを取得（会社 or フォールバック）
            let baseQuests = [];
            if (currentUser.companyId) {
                const catSnap = await getDocs(query(
                    collection(db, 'questCategories'),
                    where('companyId', '==', currentUser.companyId),
                    where('isActive', '==', true)
                ));
                if (!catSnap.empty) {
                    baseQuests = catSnap.docs.map(d => ({
                        taskId: d.id,
                        label: d.data().label,
                        points: d.data().points ?? 0,
                        isPreset: true,
                    }));
                    // createdAt でクライアント側ソート（複合インデックス不要）
                    baseQuests.sort((a, b) => {
                        const ta = catSnap.docs.find(d => d.id === a.taskId)?.data().createdAt?.toMillis?.() ?? 0;
                        const tb = catSnap.docs.find(d => d.id === b.taskId)?.data().createdAt?.toMillis?.() ?? 0;
                        return ta - tb;
                    });
                }
            }
            // カテゴリ未登録の場合はフォールバック
            if (baseQuests.length === 0) {
                baseQuests = FALLBACK_QUESTS.map(q => ({ ...q, taskId: q.id, isPreset: true }));
            }

            // 3. マージ（カテゴリ + 既存カスタムタスク）
            const merged = baseQuests.map(q => ({
                ...q,
                ...(taskMap[q.taskId] || {}),
                status: taskMap[q.taskId]?.status || 'pending',
            }));

            // カスタムタスク（staffTasksのみに存在するもの）を追加
            Object.values(taskMap).forEach(t => {
                if (!merged.find(m => m.taskId === t.taskId)) {
                    merged.push(t);
                }
            });

            setTasks(merged);
            setTodayPoints(points);
        } catch (error) {
            console.error('クエストデータ取得エラー:', error);
        } finally {
            setLoading(false);
        }
    };

    // タスク完了/未完了切り替え
    const handleToggleTask = async (task) => {
        const newStatus = task.status === 'completed' ? 'pending' : 'completed';
        const pointDiff = newStatus === 'completed' ? (task.points || 0) : -(task.points || 0);

        try {
            setTasks(prev => prev.map(t =>
                t.taskId === task.taskId ? { ...t, status: newStatus } : t
            ));
            setTodayPoints(prev => prev + pointDiff);

            const docId = `${currentUser.uid}_${todayStr}_${task.taskId}`;
            await setDoc(doc(db, 'staffTasks', docId), {
                userId: currentUser.uid,
                userName: currentUser.displayName || '名無しスタッフ',
                date: todayStr,
                taskId: task.taskId,
                taskLabel: task.label || task.taskLabel,
                points: task.points || 0,
                status: newStatus,
                completedAt: newStatus === 'completed' ? serverTimestamp() : null,
                updatedAt: serverTimestamp()
            }, { merge: true });

            // 完了時のみ活動フィードに書き込む
            if (newStatus === 'completed' && currentUser.companyId) {
                await addDoc(collection(db, 'companies', currentUser.companyId, 'activity_logs'), {
                    type: 'quest_complete',
                    content: task.label || task.taskLabel || '',
                    clientName: '社内活動',
                    staffName: currentUser.displayName || '名無しスタッフ',
                    staffUid: currentUser.uid,
                    companyId: currentUser.companyId,
                    createdAt: serverTimestamp(),
                });
            }

        } catch (error) {
            console.error('タスク更新エラー:', error);
            fetchDailyProgress();
        }
    };

    // クエストカテゴリ追加（スタッフ用：ポイントは0で作成、後から管理者が設定）
    const handleAddQuest = async () => {
        if (!addForm.label.trim() || !currentUser?.companyId) return;
        setAddSaving(true);
        try {
            await addDoc(collection(db, 'questCategories'), {
                label: addForm.label.trim(),
                description: addForm.description.trim(),
                points: 0,
                companyId: currentUser.companyId,
                branchId: currentUser.branchId || null,
                isActive: true,
                createdBy: currentUser.uid || '',
                createdByName: currentUser.displayName || '',
                createdByRole: currentUser.role || '',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });
            setAddDialog(false);
            setAddForm({ label: '', description: '' });
            await fetchDailyProgress();
        } catch (error) {
            console.error('クエスト追加エラー:', error);
            alert('追加に失敗しました');
        } finally {
            setAddSaving(false);
        }
    };

    const completedCount = tasks.filter(t => t.status === 'completed').length;
    const progressRate = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

    if (loading) {
        return (
            <Paper sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
                <CircularProgress size={24} />
            </Paper>
        );
    }

    return (
        <Paper
            elevation={3}
            sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                borderRadius: 2,
                border: '1px solid rgba(139, 92, 246, 0.2)',
                background: 'linear-gradient(145deg, #1e293b, #0f172a)'
            }}
        >
            {/* ヘッダーエリア */}
            <Box
                sx={{
                    flexShrink: 0,
                    p: 2,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'rgba(139, 92, 246, 0.1)',
                    borderBottom: '1px solid rgba(139, 92, 246, 0.1)'
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TrophyIcon sx={{ color: '#f59e0b', fontSize: 28 }} />
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#f8fafc', lineHeight: 1.2 }}>
                            今日のクエスト
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                            {format(new Date(), 'M月d日(E)', { locale: ja })} のミッション
                        </Typography>
                    </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block' }}>
                            本日の完了
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 'bold', color: progressRate === 100 ? '#10b981' : '#3b82f6' }}>
                            {completedCount} / {tasks.length}
                        </Typography>
                    </Box>
                    {currentUser?.companyId && (
                        <IconButton
                            onClick={() => setAddDialog(true)}
                            size="small"
                            sx={{ color: '#8b5cf6', bgcolor: 'rgba(139,92,246,0.1)', '&:hover': { bgcolor: 'rgba(139,92,246,0.2)' } }}
                        >
                            <AddIcon fontSize="small" />
                        </IconButton>
                    )}
                    <IconButton onClick={() => setIsExpanded(!isExpanded)} sx={{ color: '#cbd5e1' }}>
                        {isExpanded ? <ArrowUpIcon /> : <ArrowDownIcon />}
                    </IconButton>
                </Box>
            </Box>

            {/* クエストリスト（スクロール可能エリア） */}
            <Box sx={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
            <Collapse in={isExpanded}>
                <List sx={{ p: 0 }}>
                    {tasks.map((task) => {
                        const isCompleted = task.status === 'completed';

                        return (
                            <React.Fragment key={task.taskId}>
                                <ListItem
                                    disablePadding
                                    sx={{
                                        bgcolor: isCompleted ? 'rgba(16, 185, 129, 0.05)' : 'transparent',
                                        transition: 'all 0.3s'
                                    }}
                                >
                                    <ListItemButton
                                        onClick={() => handleToggleTask(task)}
                                        sx={{ py: 1.5 }}
                                    >
                                        <ListItemIcon sx={{ minWidth: 40 }}>
                                            {isCompleted ? (
                                                <CheckCircleIcon sx={{ color: '#10b981' }} />
                                            ) : (
                                                <UncheckedIcon sx={{ color: '#64748b' }} />
                                            )}
                                        </ListItemIcon>

                                        <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <ListItemText
                                                primary={
                                                    <Typography
                                                        sx={{
                                                            color: isCompleted ? '#94a3b8' : '#e2e8f0',
                                                            textDecoration: isCompleted ? 'line-through' : 'none',
                                                            fontWeight: isCompleted ? 'normal' : '500'
                                                        }}
                                                    >
                                                        {task.label || task.taskLabel}
                                                    </Typography>
                                                }
                                                secondary={
                                                    !isCompleted && canSeePoints && (
                                                        <Typography variant="caption" sx={{ color: '#3b82f6' }}>
                                                            +{task.points || 0}pt
                                                        </Typography>
                                                    )
                                                }
                                            />
                                        </Box>

                                        {isCompleted && (
                                            <Chip
                                                label="COMPLETED"
                                                size="small"
                                                color="success"
                                                variant="outlined"
                                                sx={{ height: 20, fontSize: '0.65rem' }}
                                            />
                                        )}
                                    </ListItemButton>
                                </ListItem>
                                <Divider sx={{ borderColor: 'rgba(148, 163, 184, 0.1)' }} />
                            </React.Fragment>
                        );
                    })}

                </List>

                {/* フッターメッセージ */}
                {progressRate === 100 && tasks.length > 0 && (
                    <Box sx={{ p: 2, textAlign: 'center', bgcolor: 'rgba(16, 185, 129, 0.1)' }}>
                        <Typography variant="body2" sx={{ color: '#10b981', fontWeight: 'bold' }}>
                            🎉 クエストコンプリート！お疲れ様でした！
                        </Typography>
                    </Box>
                )}
            </Collapse>
            </Box>

            {/* クエスト追加ダイアログ */}
            <Dialog open={addDialog} onClose={() => setAddDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>クエストを追加</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <TextField
                            label="クエスト名"
                            value={addForm.label}
                            onChange={e => setAddForm(p => ({ ...p, label: e.target.value }))}
                            fullWidth
                            required
                            autoFocus
                            placeholder="例：Instagram投稿、見学対応、追客電話"
                        />
                        <TextField
                            label="説明（任意）"
                            value={addForm.description}
                            onChange={e => setAddForm(p => ({ ...p, description: e.target.value }))}
                            fullWidth
                            multiline
                            rows={2}
                            placeholder="例：公式インスタグラムへの投稿業務"
                        />
                        <Typography variant="caption" color="text.secondary">
                            ポイントは支店管理者が後から設定します。
                        </Typography>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setAddDialog(false)} color="inherit">キャンセル</Button>
                    <Button onClick={handleAddQuest} variant="contained" disabled={addSaving || !addForm.label.trim()}
                        sx={{ bgcolor: '#8b5cf6', '&:hover': { bgcolor: '#7c3aed' } }}>
                        {addSaving ? '追加中...' : '追加'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Paper>
    );
}
