import React, { useState, useEffect } from 'react';
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
    Switch,
    FormControlLabel,
    Alert,
    Tooltip,
    Button,
    CircularProgress,
    Snackbar,
    Chip
} from '@mui/material';
import {
    Save as SaveIcon,
    Security as SecurityIcon
} from '@mui/icons-material';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../firebase/index';
import { ROLES, ROLE_METADATA } from '../../../constants/roles';
import { useCurrentUser } from '../../../hooks/useCurrentUser';

// Firestore ドキュメントパス
const PERMISSIONS_DOC_PATH = 'settings/rbac_permissions';

// 定義された機能（パーミッション）リスト
const FEATURES = [
    { id: 'dashboard_view', label: 'ダッシュボード閲覧', group: '基本' },
    { id: 'activity_feed_view', label: '全社活動フィード(Bridge)', group: '基本' },
    { id: 'activity_ranking_view', label: '活動量ランキング閲覧', group: '管理' },
    { id: 'client_list_view', label: '利用者一覧(CRM)閲覧', group: '基本' },
    { id: 'client_edit', label: '利用者情報編集', group: '基本' },
    { id: 'support_record_edit', label: '支援記録の作成・編集', group: '現場' },
    { id: 'monthly_planner_view', label: '月次計画の閲覧', group: '管理' },
    { id: 'monthly_stats_view', label: '月次数字・集計の閲覧', group: '経理', premium: true },
    { id: 'accounting_export', label: '経理データ出力', group: '経理', premium: true },
    { id: 'staff_management', label: 'スタッフ管理・ロール設定', group: '管理' },
];

/**
 * ロール制御コントロールパネル
 * 企業トップ(Commander)が自社の権限を設定する画面
 * Firestoreの settings/rbac_permissions に保存
 */
export default function RoleControlPanel() {
    const { companyId } = useCurrentUser();
    const [permissions, setPermissions] = useState({});
    const [isServicePremium, setIsServicePremium] = useState(true);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    // Firestoreから権限設定を読み込み
    useEffect(() => {
        const loadPermissions = async () => {
            try {
                const docRef = doc(db, PERMISSIONS_DOC_PATH);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setPermissions(data.matrix || {});
                    if (data.isServicePremium !== undefined) {
                        setIsServicePremium(data.isServicePremium);
                    }
                } else {
                    // 初回: デフォルト権限を生成
                    const defaults = {};
                    FEATURES.forEach(f => {
                        // Commander: 全てON
                        defaults[`${ROLES.COMPANY_ADMIN}_${f.id}`] = true;
                        // XO: 全てON
                        defaults[`${ROLES.BRANCH_MANAGER}_${f.id}`] = true;
                        // Crew: 基本と現場のみON
                        defaults[`${ROLES.BRANCH_STAFF}_${f.id}`] = ['基本', '現場'].includes(f.group);
                        // Hotdog: 基本のみON（管理・経理はOFF）
                        defaults[`${ROLES.HELPER}_${f.id}`] = f.group === '基本';
                    });
                    setPermissions(defaults);
                }
            } catch (err) {
                console.error('権限設定読み込みエラー:', err);
                setSnackbar({ open: true, message: '権限設定の読み込みに失敗しました', severity: 'error' });
            } finally {
                setLoading(false);
            }
        };
        loadPermissions();
    }, []);

    // 設定の切り替え
    const handleToggle = (roleId, featureId) => {
        setPermissions(prev => ({
            ...prev,
            [`${roleId}_${featureId}`]: !prev[`${roleId}_${featureId}`]
        }));
    };

    // Firestoreに保存
    const handleSave = async () => {
        setSaving(true);
        try {
            const docRef = doc(db, PERMISSIONS_DOC_PATH);
            await setDoc(docRef, {
                matrix: permissions,
                isServicePremium,
                updatedAt: serverTimestamp(),
            }, { merge: true });
            setSnackbar({ open: true, message: '権限設定を保存しました！', severity: 'success' });
        } catch (err) {
            console.error('権限設定保存エラー:', err);
            setSnackbar({ open: true, message: '保存に失敗しました: ' + err.message, severity: 'error' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 6 }}>
                <CircularProgress />
                <Typography variant="body2" sx={{ ml: 2 }}>権限設定を読み込み中...</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SecurityIcon color="primary" />
                    <Typography variant="h5" fontWeight="bold">Role Control Panel (権限マトリクス)</Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                    onClick={handleSave}
                    disabled={saving}
                    sx={{ borderRadius: 2 }}
                >
                    {saving ? '保存中...' : '変更を保存'}
                </Button>
            </Box>

            <Alert severity="info" sx={{ mb: 3 }}>
                各役職(ロール)がアクセスできる機能を個別に設定できます。
                「Premium」マークが付いている機能は、プラットフォーム側のサブスクリプション契約が必要です。
            </Alert>

            <TableContainer component={Paper} elevation={0} sx={{ bgcolor: '#1e293b', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 2 }}>
                <Table sx={{ minWidth: 750 }}>
                    <TableHead>
                        <TableRow sx={{ bgcolor: 'rgba(139,92,246,0.15)' }}>
                            <TableCell sx={{ fontWeight: 'bold', color: '#94a3b8', borderColor: 'rgba(255,255,255,0.08)' }}>機能 / 権限</TableCell>
                            {/* Platform ロール（読み取り専用・常にON） */}
                            {[ROLES.PLATFORM_OWNER, ROLES.PLATFORM_STAFF].map(r => (
                                <TableCell key={r} align="center" sx={{ fontWeight: 'bold', color: ROLE_METADATA[r].color, borderColor: 'rgba(255,255,255,0.08)', whiteSpace: 'nowrap' }}>
                                    {ROLE_METADATA[r].badge}
                                    <br /><Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.65rem' }}>全権限</Typography>
                                </TableCell>
                            ))}
                            {/* 会社内ロール（設定可能） */}
                            {[ROLES.COMPANY_ADMIN, ROLES.BRANCH_MANAGER, ROLES.BRANCH_STAFF, ROLES.HELPER].map(r => (
                                <TableCell key={r} align="center" sx={{ fontWeight: 'bold', color: ROLE_METADATA[r].color, borderColor: 'rgba(255,255,255,0.08)', whiteSpace: 'nowrap' }}>
                                    {ROLE_METADATA[r].badge}
                                    <br /><Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.65rem' }}>{ROLE_METADATA[r].userLabel}</Typography>
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {FEATURES.map((feature) => (
                            <TableRow key={feature.id} hover sx={{ '&:hover': { bgcolor: 'rgba(255,255,255,0.03)' } }}>
                                <TableCell sx={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Typography variant="body2" fontWeight="medium" sx={{ color: '#e2e8f0' }}>
                                            {feature.label}
                                        </Typography>
                                        {feature.premium && (
                                            <Tooltip title="プレミアム機能 (別契約が必要)">
                                                <Chip label="PREMIUM" size="small" color="secondary" variant="outlined" sx={{ height: 20, fontSize: '0.6rem' }} />
                                            </Tooltip>
                                        )}
                                    </Box>
                                    <Typography variant="caption" sx={{ color: '#64748b' }}>
                                        {feature.group}
                                    </Typography>
                                </TableCell>

                                {/* Platform ロール：常にON・変更不可 */}
                                {[ROLES.PLATFORM_OWNER, ROLES.PLATFORM_STAFF].map(r => (
                                    <TableCell key={r} align="center" sx={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                                        <Checkbox checked disabled sx={{ color: ROLE_METADATA[r].color, '&.Mui-disabled': { color: ROLE_METADATA[r].color, opacity: 0.6 } }} />
                                    </TableCell>
                                ))}

                                {/* 会社内ロール：設定可能 */}
                                {[ROLES.COMPANY_ADMIN, ROLES.BRANCH_MANAGER, ROLES.BRANCH_STAFF, ROLES.HELPER].map((roleId) => {
                                    const isDisabled = feature.premium && !isServicePremium;
                                    const isLocked = roleId === ROLES.COMPANY_ADMIN;
                                    const isChecked = isLocked || !!permissions[`${roleId}_${feature.id}`];

                                    return (
                                        <TableCell key={roleId} align="center" sx={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                                            <Checkbox
                                                checked={isChecked}
                                                onChange={() => handleToggle(roleId, feature.id)}
                                                disabled={isDisabled || isLocked}
                                                sx={{
                                                    color: ROLE_METADATA[roleId].color,
                                                    '&.Mui-checked': { color: ROLE_METADATA[roleId].color },
                                                    '&.Mui-disabled': { color: '#475569', opacity: 0.5 },
                                                }}
                                            />
                                        </TableCell>
                                    );
                                })}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Box sx={{ mt: 4 }}>
                <Typography variant="h6" gutterBottom color="secondary" fontWeight="bold">
                    契約プラン管理 (Grand Admiral のみ操作可能)
                </Typography>
                <Paper sx={{ p: 2, bgcolor: '#0f172a', border: '1px dashed rgba(139,92,246,0.4)' }}>
                    <FormControlLabel
                        control={<Switch checked={isServicePremium} onChange={(e) => setIsServicePremium(e.target.checked)} />}
                        label="プレミアム月次集計パッケージ: 有効"
                    />
                    <Typography variant="caption" sx={{ display: 'block', mt: 1, color: '#64748b' }}>
                        ※プラットフォームオーナーが特定の企業に対して機能をアンロックするために使用します。
                        OFFにすると、その企業の全てのロールでプレミアム機能がグレーアウトされます。
                    </Typography>
                </Paper>
            </Box>

            {/* Snackbar通知 */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={3000}
                onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
                    severity={snackbar.severity}
                    variant="filled"
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}
