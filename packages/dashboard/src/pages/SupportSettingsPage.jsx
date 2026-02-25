import { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Grid, TextField, Button,
    Chip, IconButton, Divider, Alert, Tabs, Tab,
    List, ListItem, ListItemText, ListItemSecondaryAction,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Select, MenuItem, CircularProgress, TablePagination
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import { collection, query, getDocs, doc, getDoc, setDoc, deleteDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from '../firebase/index';
import { MUNICIPALITIES } from '../constants/municipalityConfig';

// デフォルト設定値
const DEFAULT_SETTINGS = {
    activityOptions: [
        'PC作業', '軽作業', '事務作業', 'ビジネスマナー',
        '就職活動', 'グループワーク', '面談', '運動',
        '清掃', '調理', '自習', '外出訓練',
    ],
    specialNoteOptions: [
        '通所', '在宅', '就職支援', '体験利用', '見学対応',
    ],
    serviceTypes: [
        { value: 'transition', label: '就労移行支援' },
        { value: 'typeB', label: '就労継続支援B型' },
        { value: 'typeA', label: '就労継続支援A型' },
    ],
};

// タブパネル
function TabPanel({ children, value, index }) {
    return value === index ? <Box sx={{ py: 3 }}>{children}</Box> : null;
}

// 編集可能なリストコンポーネント
function EditableList({ title, items, onAdd, onRemove, placeholder }) {
    const [newItem, setNewItem] = useState('');

    const handleAdd = () => {
        if (newItem.trim() && !items.includes(newItem.trim())) {
            onAdd(newItem.trim());
            setNewItem('');
        }
    };

    return (
        <Paper sx={{ p: 2, bgcolor: 'rgba(30, 41, 59, 0.5)' }}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                {title}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <TextField
                    size="small"
                    value={newItem}
                    onChange={(e) => setNewItem(e.target.value)}
                    placeholder={placeholder}
                    onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
                    sx={{ flex: 1 }}
                />
                <Button
                    variant="contained"
                    onClick={handleAdd}
                    startIcon={<AddIcon />}
                    disabled={!newItem.trim()}
                >
                    追加
                </Button>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {items.map((item, index) => (
                    <Chip
                        key={index}
                        label={item}
                        onDelete={() => onRemove(item)}
                        sx={{
                            bgcolor: 'rgba(6, 182, 212, 0.2)',
                            '&:hover': { bgcolor: 'rgba(6, 182, 212, 0.3)' },
                        }}
                    />
                ))}
            </Box>
            {items.length === 0 && (
                <Typography variant="body2" color="text.secondary">
                    項目がありません
                </Typography>
            )}
        </Paper>
    );
}

export default function SupportSettingsPage() {
    const [tabValue, setTabValue] = useState(0);
    const [settings, setSettings] = useState(DEFAULT_SETTINGS);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // 自治体管理用のステート
    const [municipalities, setMunicipalities] = useState([]);
    const [loadingMunis, setLoadingMunis] = useState(false);

    // 設定を読み込み
    useEffect(() => {
        const loadSettings = async () => {
            try {
                const docRef = doc(db, 'systemSettings', 'supportConfig');
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setSettings({ ...DEFAULT_SETTINGS, ...docSnap.data() });
                }
            } catch (error) {
                console.error('設定の読み込みエラー:', error);
            } finally {
                setLoading(false);
            }
        };
        loadSettings();
    }, []);

    // 自治体を読み込み
    const loadMunicipalities = async () => {
        setLoadingMunis(true);
        try {
            const q = query(collection(db, 'municipalities'));
            const snap = await getDocs(q);
            const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            // 名前順にソート
            list.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ja'));
            setMunicipalities(list);
        } catch (error) {
            console.error('自治体の読み込みエラー:', error);
        } finally {
            setLoadingMunis(false);
        }
    };

    useEffect(() => {
        if (tabValue === 3) { // 自治体管理タブのインデックス
            loadMunicipalities();
        }
    }, [tabValue]);

    // 自治体マスターの初期化
    const handleSeedMunicipalities = async () => {
        setSaving(true);
        try {
            const batch = writeBatch(db);
            const colRef = collection(db, 'municipalities');

            for (const m of MUNICIPALITIES) {
                const docRef = doc(colRef, m.id);
                batch.set(docRef, {
                    ...m,
                    isActive: m.enabled,
                    updatedAt: serverTimestamp(),
                });
            }

            await batch.commit();
            setMessage({ type: 'success', text: '自治体マスターを初期化しました' });
            loadMunicipalities();
        } catch (error) {
            console.error('初期化エラー:', error);
            setMessage({ type: 'error', text: '初期化に失敗しました' });
        } finally {
            setSaving(false);
        }
    };

    // 自治体の更新
    const handleUpdateMuni = async (id, updates) => {
        try {
            await setDoc(doc(db, 'municipalities', id), {
                ...updates,
                updatedAt: serverTimestamp()
            }, { merge: true });
            setMunicipalities(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
        } catch (error) {
            console.error('自治体更新エラー:', error);
        }
    };

    // 設定を保存
    const handleSave = async () => {
        setSaving(true);
        setMessage({ type: '', text: '' });
        try {
            await setDoc(doc(db, 'systemSettings', 'supportConfig'), {
                ...settings,
                updatedAt: serverTimestamp(),
            }, { merge: true });
            setMessage({ type: 'success', text: '設定を保存しました' });
        } catch (error) {
            console.error('設定の保存エラー:', error);
            setMessage({ type: 'error', text: '保存に失敗しました' });
        } finally {
            setSaving(false);
        }
    };

    // リスト操作ヘルパー
    const addToList = (key) => (item) => {
        setSettings(prev => ({
            ...prev,
            [key]: [...prev[key], item],
        }));
    };

    const removeFromList = (key) => (item) => {
        setSettings(prev => ({
            ...prev,
            [key]: prev[key].filter(i => i !== item),
        }));
    };

    const handleReset = (key) => {
        setSettings(prev => ({
            ...prev,
            [key]: DEFAULT_SETTINGS[key],
        }));
    };

    if (loading) {
        return (
            <Box sx={{ p: 3, textAlign: 'center' }}>
                <CircularProgress />
                <Typography sx={{ mt: 2 }}>読み込み中...</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    ⚙️ 支援業務設定
                </Typography>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<SaveIcon />}
                    onClick={handleSave}
                    disabled={saving}
                >
                    {saving ? '保存中...' : '設定を保存'}
                </Button>
            </Box>

            {message.text && (
                <Alert severity={message.type} sx={{ mb: 2 }} onClose={() => setMessage({ type: '', text: '' })}>
                    {message.text}
                </Alert>
            )}

            <Paper sx={{ borderRadius: 2 }}>
                <Tabs
                    value={tabValue}
                    onChange={(e, v) => setTabValue(v)}
                    sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
                >
                    <Tab label="活動内容" />
                    <Tab label="特記事項" />
                    <Tab label="サービス記録" />
                    <Tab label="自治体管理" />
                    <Tab label="その他" />
                </Tabs>

                <Box sx={{ p: 2 }}>
                    {/* 活動内容タブ */}
                    <TabPanel value={tabValue} index={0}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            チェックイン時に利用者が選択できる活動内容の一覧です。
                        </Typography>
                        <EditableList
                            title="活動内容の選択肢"
                            items={settings.activityOptions}
                            onAdd={addToList('activityOptions')}
                            onRemove={removeFromList('activityOptions')}
                            placeholder="例: 就職面接練習"
                        />
                        <Button
                            variant="text"
                            size="small"
                            onClick={() => handleReset('activityOptions')}
                            sx={{ mt: 2 }}
                        >
                            デフォルトに戻す
                        </Button>
                    </TabPanel>

                    {/* 特記事項タブ */}
                    <TabPanel value={tabValue} index={1}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            サービス記録で使用する特記事項の選択肢です。
                        </Typography>
                        <EditableList
                            title="特記事項の選択肢"
                            items={settings.specialNoteOptions}
                            onAdd={addToList('specialNoteOptions')}
                            onRemove={removeFromList('specialNoteOptions')}
                            placeholder="例: 体調不良"
                        />
                        <Button
                            variant="text"
                            size="small"
                            onClick={() => handleReset('specialNoteOptions')}
                            sx={{ mt: 2 }}
                        >
                            デフォルトに戻す
                        </Button>
                    </TabPanel>

                    {/* サービス記録タブ */}
                    <TabPanel value={tabValue} index={2}>
                        <Paper sx={{ p: 3, bgcolor: 'rgba(30, 41, 59, 0.3)', textAlign: 'center' }}>
                            <Typography color="text.secondary">🚧 準備中...</Typography>
                        </Paper>
                    </TabPanel>

                    {/* 自治体管理タブ */}
                    <TabPanel value={tabValue} index={3}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6" fontWeight="bold">厚生訓練費 対象自治体マスター</Typography>
                            <Button variant="outlined" size="small" onClick={handleSeedMunicipalities} disabled={saving}>
                                初期データを投入
                            </Button>
                        </Box>

                        {loadingMunis ? (
                            <Box sx={{ textAlign: 'center', py: 4 }}><CircularProgress /></Box>
                        ) : (
                            <TableContainer component={Paper} sx={{ bgcolor: 'background.paper' }}>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 'bold' }}>自治体名</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>請求先名 (DB値)</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>テンプレート</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>状態</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {municipalities.map((muni) => (
                                            <TableRow key={muni.id} hover>
                                                <TableCell>{muni.name}</TableCell>
                                                <TableCell>{muni.billingName}</TableCell>
                                                <TableCell>
                                                    <Select
                                                        size="small"
                                                        value={muni.template || 'none'}
                                                        onChange={(e) => handleUpdateMuni(muni.id, { template: e.target.value === 'none' ? null : e.target.value })}
                                                        sx={{ minWidth: 120 }}
                                                    >
                                                        <MenuItem value="none">なし</MenuItem>
                                                        <MenuItem value="hiroshima">広島市様式</MenuItem>
                                                        <MenuItem value="miyoshi">三次市様式</MenuItem>
                                                        <MenuItem value="hatsukaichi">廿日市市様式</MenuItem>
                                                        <MenuItem value="saka">坂町様式</MenuItem>
                                                        <MenuItem value="fuchu">府中町様式</MenuItem>
                                                    </Select>
                                                </TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={muni.isActive ? '有効' : '無効'}
                                                        color={muni.isActive ? 'success' : 'default'}
                                                        size="small"
                                                        onClick={() => handleUpdateMuni(muni.id, { isActive: !muni.isActive })}
                                                        sx={{ cursor: 'pointer' }}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {municipalities.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                                                    データがありません
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}
                    </TabPanel>

                    {/* その他タブ */}
                    <TabPanel value={tabValue} index={4}>
                        <Paper sx={{ p: 3, bgcolor: 'rgba(30, 41, 59, 0.3)', textAlign: 'center' }}>
                            <Typography color="text.secondary">🚧 準備中...</Typography>
                        </Paper>
                    </TabPanel>
                </Box>
            </Paper>
        </Box>
    );
}
