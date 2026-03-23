// src/pages/ServiceRecordListPage.jsx
// 未入力サービス記録一覧

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
    Box,
    Typography,
    Paper,
    CircularProgress,
    Alert,
    Grid,
    Card,
    CardContent,
    CardActionArea,
    Chip,
    IconButton,
    Button,
    Badge,
    Dialog,
    DialogTitle,
    DialogContent,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    ListItemIcon,
} from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import PrintIcon from '@mui/icons-material/Print';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import HomeIcon from '@mui/icons-material/Home';
import BusinessIcon from '@mui/icons-material/Business';
import PersonIcon from '@mui/icons-material/Person';
import { collection, query, where, getDocs, Timestamp, doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/index';
import { format, addMonths, subMonths, getDaysInMonth, startOfMonth, endOfMonth } from 'date-fns';
import ja from 'date-fns/locale/ja';
import { roundTo30Min } from '../utils/roundTime';
import { useReactToPrint } from 'react-to-print';
import ServiceRecordEditModal from '../features/service-records/ServiceRecordEditModal';
import ServiceRecordPrintView from '../features/service-records/ServiceRecordPrintView';
import EditableServiceTable from '../features/service-records/EditableServiceTable';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useTenant } from '../context/TenantContext';

export default function ServiceRecordListPage() {
    const { profile } = useCurrentUser();
    const isServiceManager = profile?.isServiceManager === true;
    const { activeCompanyId: companyId } = useTenant();
    const companyFilter = companyId ? [where('companyId', '==', companyId)] : [];
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [attendanceRecords, setAttendanceRecords] = useState([]);
    const [serviceRecords, setServiceRecords] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // 印刷関連
    const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);
    const [selectedClientForPrint, setSelectedClientForPrint] = useState(null);
    const [printRecords, setPrintRecords] = useState([]);
    const printRef = useRef(null);

    // 入力済み編集用（clientIdのみ保持、recordsはclientsWithRecordsから導出）
    const [selectedClientIdForEdit, setSelectedClientIdForEdit] = useState(null);

    // データ取得
    const fetchData = useCallback(async () => {
        // 月の範囲を関数内で計算
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(currentMonth);

        setLoading(true);
        setError(null);
        try {
            // 1. 出席記録を取得（日付範囲のみでクエリ、statusはJSでフィルタ）
            const attendanceQuery = query(
                collection(db, 'attendanceRecords'),
                ...companyFilter,
                where('date', '>=', Timestamp.fromDate(monthStart)),
                where('date', '<=', Timestamp.fromDate(monthEnd))
            );
            const attendanceSnap = await getDocs(attendanceQuery);
            const records = attendanceSnap.docs
                .map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    date: doc.data().date?.toDate?.() || new Date(),
                }))
                .filter(record => record.status === 'present'); // JSでフィルタ

            // 日付順にソート
            records.sort((a, b) => a.date - b.date);
            setAttendanceRecords(records);


            // 2. サービス記録を取得
            const serviceQuery = query(
                collection(db, 'serviceRecords'),
                ...companyFilter,
                where('date', '>=', Timestamp.fromDate(monthStart)),
                where('date', '<=', Timestamp.fromDate(monthEnd))
            );
            const serviceSnap = await getDocs(serviceQuery);
            const serviceMap = {};
            serviceSnap.docs.forEach(doc => {
                const data = doc.data();
                serviceMap[data.attendanceRecordId] = {
                    id: doc.id,
                    ...data,
                };
            });
            setServiceRecords(serviceMap);
        } catch (err) {
            console.error('データ取得エラー:', err);
            setError('データの取得に失敗しました');
        } finally {
            setLoading(false);
        }
    }, [currentMonth, companyId]);


    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // 未入力/入力済みに分類
    const { pendingRecords, completedRecords } = useMemo(() => {
        const pending = [];
        const completed = [];

        attendanceRecords.forEach(record => {
            const serviceRecord = serviceRecords[record.id];
            if (serviceRecord?.isCompleted) {
                completed.push({ ...record, serviceRecord });
            } else {
                pending.push({ ...record, serviceRecord });
            }
        });

        return { pendingRecords: pending, completedRecords: completed };
    }, [attendanceRecords, serviceRecords]);

    // 未入力レコードを利用者ごとにグループ化
    const pendingByClient = useMemo(() => {
        const clientMap = new Map();
        pendingRecords.forEach(record => {
            const clientName = record.clientName || '名前なし';
            const clientId = record.clientId;
            if (!clientMap.has(clientId)) {
                clientMap.set(clientId, { clientName, records: [] });
            }
            clientMap.get(clientId).records.push(record);
        });
        // 利用者名順にソート
        return Array.from(clientMap.values()).sort((a, b) => a.clientName.localeCompare(b.clientName, 'ja'));
    }, [pendingRecords]);

    // 印刷可能かどうか（入力済みが1件以上あればOK）
    const isPrintable = completedRecords.length > 0;

    // 利用者ごとにグループ化（印刷用）
    const clientsWithRecords = useMemo(() => {
        const clientMap = new Map();
        completedRecords.forEach(record => {
            const clientId = record.clientId;
            if (!clientMap.has(clientId)) {
                clientMap.set(clientId, {
                    clientId,
                    clientName: record.clientName || '名前なし',
                    records: [],
                });
            }
            clientMap.get(clientId).records.push(record);
        });
        return Array.from(clientMap.values());
    }, [completedRecords]);

    // 選択中の利用者データ（最新のrecordsから導出）
    const selectedClientForEdit = useMemo(() => {
        if (!selectedClientIdForEdit) return null;
        return clientsWithRecords.find(c => c.clientId === selectedClientIdForEdit) || null;
    }, [selectedClientIdForEdit, clientsWithRecords]);

    // カードをクリックして編集
    const handleCardClick = (record) => {
        setSelectedRecord(record);
        setIsModalOpen(true);
    };

    // モーダルを閉じる
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedRecord(null);
    };

    // 保存後にデータを再取得
    const handleSave = async () => {
        await fetchData();
        handleCloseModal();
    };

    // 曜日を取得
    const getDayOfWeek = (date) => {
        const days = ['日', '月', '火', '水', '木', '金', '土'];
        return days[date.getDay()];
    };

    // 印刷ダイアログを開く
    const handleOpenPrintDialog = () => {
        setIsPrintDialogOpen(true);
    };

    // 印刷ダイアログを閉じる
    const handleClosePrintDialog = () => {
        setIsPrintDialogOpen(false);
        setSelectedClientForPrint(null);
    };

    // 利用者を選択して印刷データを準備
    const handleSelectClientForPrint = (client) => {
        setSelectedClientForPrint(client);
        // serviceRecordsからデータをマージ
        const records = client.records.map(record => {
            const sr = record.serviceRecord || {};
            return {
                date: record.date,
                startTime: record.startTime || '',
                endTime: record.endTime || '',
                attendanceType: record.attendanceType,
                specialNotes: sr.specialNotes || record.specialNotes || '',
                supportContent: sr.supportContent || '',
                activitiesAm: sr.activitiesAm || record.activitiesAm || [],
                activitiesPm: sr.activitiesPm || record.activitiesPm || [],
                recorderName: sr.recorderName || record.staffName || '',
                remoteContactTimeMorning: sr.remoteContactTimeMorning || '',
                remoteContactTimeEvening: sr.remoteContactTimeEvening || '',
            };
        }).sort((a, b) => a.date - b.date);

        setPrintRecords(records);
        setIsPrintDialogOpen(false);
        // 少し遅延させて印刷実行
        setTimeout(() => {
            handlePrint();
        }, 100);
    };

    // ダミーデータでプレビュー
    const handleDummyPreview = () => {
        const dummyRecords = [
            {
                date: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 5),
                startTime: '09:30',
                endTime: '15:30',
                attendanceType: 'onsite',
                specialNotes: '体調良好',
                supportContent: 'ビジネスマナー講座を実施。名刺交換の練習を行った。',
                activitiesAm: ['PC訓練', 'ビジネスマナー'],
                activitiesPm: ['グループワーク'],
                recorderName: '山田',
            },
            {
                date: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 8),
                startTime: '10:00',
                endTime: '14:00',
                attendanceType: 'remote',
                remoteContactTimeMorning: '09:30',
                remoteContactTimeEvening: '16:00',
                specialNotes: '在宅',
                supportContent: '就職に向かっているのでハローワークに連れて行った',
                activitiesAm: ['オンライン学習'],
                activitiesPm: ['面接練習'],
                recorderName: '佐藤',
            },
            {
                date: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 12),
                startTime: '09:00',
                endTime: '16:00',
                attendanceType: 'onsite',
                specialNotes: '',
                supportContent: '履歴書作成の支援。志望動機の書き方をアドバイス。',
                activitiesAm: ['履歴書作成'],
                activitiesPm: ['面接練習', '自己分析'],
                recorderName: '山田',
            },
        ];
        setSelectedClientForPrint({ clientName: 'テスト 太郎', clientId: 'dummy' });
        setPrintRecords(dummyRecords);
        setIsPrintDialogOpen(false);
        setTimeout(() => {
            handlePrint();
        }, 100);
    };

    // 印刷実行
    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: `サービス提供記録_${selectedClientForPrint?.clientName || ''}_${format(currentMonth, 'yyyy年M月')}`,
    });

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 2 }}>
            {/* サービス管理責任者アラート */}
            {isServiceManager && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                    サービス管理責任者はサービス記録の記入ができません。閲覧のみ可能です。
                </Alert>
            )}
            {/* ヘッダー */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <AssignmentIcon sx={{ color: '#8b5cf6', fontSize: 28 }} />
                    <Typography variant="h5" sx={{ color: '#fff', fontWeight: 'bold' }}>
                        サービス記録
                    </Typography>

                    {/* 月選択 */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 2 }}>
                        <IconButton size="small" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} sx={{ color: '#fff' }}>
                            <ArrowBackIosNewIcon fontSize="small" />
                        </IconButton>
                        <Typography variant="subtitle1" sx={{ color: '#fff', minWidth: 120, textAlign: 'center' }}>
                            {format(currentMonth, 'yyyy年 M月', { locale: ja })}
                        </Typography>
                        <IconButton size="small" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} sx={{ color: '#fff' }}>
                            <ArrowForwardIosIcon fontSize="small" />
                        </IconButton>
                    </Box>
                </Box>

                {/* ステータスと印刷ボタン */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {/* 未入力バッジ */}
                    <Chip
                        icon={pendingRecords.length > 0 ? <WarningIcon /> : <CheckCircleIcon />}
                        label={pendingRecords.length > 0 ? `未入力: ${pendingRecords.length}件` : '全件入力済み'}
                        color={pendingRecords.length > 0 ? 'warning' : 'success'}
                        sx={{ fontWeight: 'bold' }}
                    />

                    {/* 印刷ボタン */}
                    <Button
                        variant="contained"
                        size="large"
                        disabled={!isPrintable}
                        startIcon={<PrintIcon />}
                        onClick={handleOpenPrintDialog}
                        sx={{
                            background: isPrintable
                                ? 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)'
                                : 'rgba(100, 116, 139, 0.3)',
                            color: '#fff',
                            fontWeight: 'bold',
                            px: 3,
                            py: 1,
                            borderRadius: 2,
                            boxShadow: isPrintable ? '0 4px 15px rgba(16, 185, 129, 0.3)' : 'none',
                            '&:hover': {
                                background: isPrintable
                                    ? 'linear-gradient(135deg, #059669 0%, #0891b2 100%)'
                                    : 'rgba(100, 116, 139, 0.3)',
                                boxShadow: isPrintable ? '0 6px 20px rgba(16, 185, 129, 0.4)' : 'none',
                            },
                        }}
                    >
                        🖨️ 一括印刷
                    </Button>
                </Box>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {/* 未入力リスト（担当者ごとに縦列表示） */}
            {
                pendingRecords.length > 0 && (
                    <Box sx={{ mb: 4 }}>
                        <Typography variant="h6" sx={{ color: '#f59e0b', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <WarningIcon fontSize="small" />
                            未入力 ({pendingRecords.length}件)
                        </Typography>
                        <Box sx={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: 1.5,
                        }}>
                            {pendingByClient.map(({ clientName, records }) => (
                                <Box
                                    key={records[0].clientId}
                                    sx={{
                                        minWidth: 140,
                                        maxWidth: 180,
                                        flexShrink: 0,
                                    }}
                                >
                                    {/* 利用者名ヘッダー */}
                                    <Paper sx={{
                                        p: 1,
                                        mb: 1,
                                        bgcolor: 'rgba(245, 158, 11, 0.15)',
                                        border: '1px solid rgba(245, 158, 11, 0.3)',
                                        textAlign: 'center',
                                        borderRadius: 1,
                                    }}>
                                        <Typography variant="body2" sx={{ color: '#f59e0b', fontWeight: 'bold', fontSize: '0.85rem' }}>
                                            {clientName}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                                            {records.length}件
                                        </Typography>
                                    </Paper>
                                    {/* 日付カード縦並び */}
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                        {records.map(record => (
                                            <Card
                                                key={record.id}
                                                sx={{
                                                    bgcolor: 'rgba(245, 158, 11, 0.1)',
                                                    border: '1px solid rgba(245, 158, 11, 0.3)',
                                                    '&:hover': { bgcolor: 'rgba(245, 158, 11, 0.2)' }
                                                }}
                                            >
                                                <CardActionArea onClick={() => handleCardClick(record)}>
                                                    <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            <Typography variant="body2" sx={{ color: '#fff', fontSize: '0.8rem' }}>
                                                                {format(record.date, 'M/d', { locale: ja })} ({getDayOfWeek(record.date)})
                                                            </Typography>
                                                            {record.attendanceType === 'remote' && (
                                                                <Chip
                                                                    label="在宅"
                                                                    size="small"
                                                                    sx={{ bgcolor: 'rgba(139, 92, 246, 0.2)', color: '#a78bfa', fontSize: '0.55rem', height: 16, '& .MuiChip-label': { px: 0.5 } }}
                                                                />
                                                            )}
                                                        </Box>
                                                        <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.7rem' }}>
                                                            {roundTo30Min(record.startTime) || '--:--'}〜
                                                        </Typography>
                                                    </CardContent>
                                                </CardActionArea>
                                            </Card>
                                        ))}
                                    </Box>
                                </Box>
                            ))}
                        </Box>
                    </Box>
                )
            }

            {/* 入力済みリスト（利用者フォルダ形式） */}
            {
                completedRecords.length > 0 && (
                    <Box>
                        <Typography variant="h6" sx={{ color: '#10b981', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CheckCircleIcon fontSize="small" />
                            入力済み ({clientsWithRecords.length}人 / {completedRecords.length}件)
                        </Typography>

                        {/* 選択中の利用者がいなければカード表示 */}
                        {!selectedClientForEdit ? (
                            <Grid container spacing={1}>
                                {clientsWithRecords.map(client => (
                                    <Grid key={client.clientId} size={{ xs: 6, sm: 4, md: 3, lg: 2 }}>
                                        <Card
                                            sx={{
                                                bgcolor: 'rgba(16, 185, 129, 0.1)',
                                                border: '1px solid rgba(16, 185, 129, 0.3)',
                                                '&:hover': { bgcolor: 'rgba(16, 185, 129, 0.2)' }
                                            }}
                                        >
                                            <CardActionArea onClick={() => setSelectedClientIdForEdit(client.clientId)}>
                                                <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#fff', fontSize: '0.85rem' }}>
                                                            {client.clientName}
                                                        </Typography>
                                                        <Chip
                                                            label={`${client.records.length}件`}
                                                            size="small"
                                                            sx={{
                                                                bgcolor: 'rgba(16, 185, 129, 0.3)',
                                                                color: '#10b981',
                                                                fontSize: '0.7rem',
                                                                height: 20,
                                                            }}
                                                        />
                                                    </Box>
                                                </CardContent>
                                            </CardActionArea>
                                        </Card>
                                    </Grid>
                                ))}
                            </Grid>
                        ) : (
                            /* 選択中の利用者のテーブル表示 */
                            <EditableServiceTable
                                clientName={selectedClientForEdit.clientName}
                                clientId={selectedClientForEdit.clientId}
                                records={selectedClientForEdit.records}
                                month={currentMonth}
                                onClose={() => setSelectedClientIdForEdit(null)}
                                onPrint={() => {
                                    setSelectedClientForPrint(selectedClientForEdit);
                                    handlePrepareAndPrint(selectedClientForEdit.clientId, selectedClientForEdit.clientName, selectedClientForEdit.records);
                                }}
                                onSave={fetchData}
                            />
                        )}
                    </Box>
                )
            }


            {/* 記録がない場合 */}
            {
                attendanceRecords.length === 0 && (
                    <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'rgba(30, 41, 59, 0.5)' }}>
                        <Typography sx={{ color: '#94a3b8' }}>
                            {format(currentMonth, 'yyyy年M月', { locale: ja })}の出席記録がありません
                        </Typography>
                    </Paper>
                )
            }

            {/* 編集モーダル */}
            <ServiceRecordEditModal
                open={isModalOpen}
                onClose={handleCloseModal}
                attendanceRecord={selectedRecord}
                serviceRecord={selectedRecord?.serviceRecord}
                onSave={handleSave}
            />

            {/* 印刷利用者選択ダイアログ */}
            <Dialog
                open={isPrintDialogOpen}
                onClose={handleClosePrintDialog}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: { bgcolor: '#1e293b', color: '#fff' }
                }}
            >
                <DialogTitle sx={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    印刷する利用者を選択
                </DialogTitle>
                <DialogContent sx={{ p: 0 }}>
                    <List>
                        {clientsWithRecords.map(client => (
                            <ListItem key={client.clientId} disablePadding>
                                <ListItemButton
                                    onClick={() => handleSelectClientForPrint(client)}
                                    sx={{
                                        '&:hover': { bgcolor: 'rgba(16, 185, 129, 0.1)' }
                                    }}
                                >
                                    <ListItemIcon>
                                        <PersonIcon sx={{ color: '#10b981' }} />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={client.clientName}
                                        secondary={`${client.records.length}日分の記録`}
                                        primaryTypographyProps={{ sx: { color: '#fff' } }}
                                        secondaryTypographyProps={{ sx: { color: '#94a3b8' } }}
                                    />
                                </ListItemButton>
                            </ListItem>
                        ))}
                    </List>
                    {clientsWithRecords.length === 0 && (
                        <Box sx={{ p: 4, textAlign: 'center', color: '#94a3b8' }}>
                            印刷可能な記録がありません
                        </Box>
                    )}

                    {/* ダミーデータプレビューボタン */}
                    <Box sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                        <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 1 }}>
                            レイアウト確認用
                        </Typography>
                        <ListItemButton
                            onClick={handleDummyPreview}
                            sx={{
                                bgcolor: 'rgba(139, 92, 246, 0.1)',
                                borderRadius: 1,
                                '&:hover': { bgcolor: 'rgba(139, 92, 246, 0.2)' }
                            }}
                        >
                            <ListItemIcon>
                                <PrintIcon sx={{ color: '#a78bfa' }} />
                            </ListItemIcon>
                            <ListItemText
                                primary="ダミーデータでプレビュー"
                                secondary="3日分のサンプルデータで印刷レイアウトを確認"
                                primaryTypographyProps={{ sx: { color: '#a78bfa' } }}
                                secondaryTypographyProps={{ sx: { color: '#64748b' } }}
                            />
                        </ListItemButton>
                    </Box>
                </DialogContent>
            </Dialog>

            {/* 印刷用ビュー（非表示） */}
            <Box sx={{ display: 'none' }}>
                <ServiceRecordPrintView
                    ref={printRef}
                    clientName={selectedClientForPrint?.clientName || ''}
                    year={currentMonth.getFullYear()}
                    month={currentMonth.getMonth() + 1}
                    records={printRecords}
                />
            </Box>
        </Box >
    );
}
