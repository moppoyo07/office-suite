// 一時的なロール確認・設定ページ
// セットアップ完了後に削除してください

import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Paper, Select, MenuItem, Button, Alert,
    CircularProgress, Chip
} from '@mui/material';
import { collection, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/index';
import { useAuth } from '../auth/context/AuthContext.jsx';
import { ROLES, ROLE_METADATA } from '../../constants/roles';

const ALL_ROLES = Object.values(ROLES);

export default function RoleSetupPage() {
    const { currentUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(null);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const snapshot = await getDocs(collection(db, 'users'));
                const list = [];
                snapshot.forEach(docSnap => {
                    list.push({ id: docSnap.id, ...docSnap.data() });
                });
                list.sort((a, b) => (a.role || '').localeCompare(b.role || ''));
                setUsers(list);
            } catch (err) {
                console.error('ユーザー取得エラー:', err);
                setMessage({ type: 'error', text: 'ユーザー取得に失敗: ' + err.message });
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, []);

    const handleRoleChange = async (userId, newRole) => {
        setSaving(userId);
        try {
            await updateDoc(doc(db, 'users', userId), {
                role: newRole,
                updatedAt: serverTimestamp(),
            });
            setUsers(prev => prev.map(u =>
                u.id === userId ? { ...u, role: newRole } : u
            ));
            setMessage({ type: 'success', text: `ロールを ${newRole} に更新しました` });
            setTimeout(() => setMessage(null), 3000);
        } catch (err) {
            console.error('ロール更新エラー:', err);
            setMessage({ type: 'error', text: '更新失敗: ' + err.message });
        } finally {
            setSaving(null);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom sx={{ color: '#fff' }}>
                🔧 ロール確認・設定（一時ページ）
            </Typography>

            <Alert severity="warning" sx={{ mb: 3 }}>
                ⚠️ このページは一時的なものです。ロール設定が完了したら削除してください。
                <br />
                現在ログイン中: <strong>{currentUser?.email}</strong> (UID: {currentUser?.uid})
            </Alert>

            {message && (
                <Alert severity={message.type} sx={{ mb: 2 }}>{message.text}</Alert>
            )}

            <TableContainer component={Paper} sx={{ bgcolor: '#1e293b' }}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ color: '#94a3b8', fontWeight: 'bold' }}>名前</TableCell>
                            <TableCell sx={{ color: '#94a3b8', fontWeight: 'bold' }}>メール</TableCell>
                            <TableCell sx={{ color: '#94a3b8', fontWeight: 'bold' }}>UID</TableCell>
                            <TableCell sx={{ color: '#94a3b8', fontWeight: 'bold' }}>現在のロール</TableCell>
                            <TableCell sx={{ color: '#94a3b8', fontWeight: 'bold' }}>ロール変更</TableCell>
                            <TableCell sx={{ color: '#94a3b8', fontWeight: 'bold' }}>自分</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {users.map(user => {
                            const meta = ROLE_METADATA[user.role];
                            const isMe = user.id === currentUser?.uid;
                            return (
                                <TableRow key={user.id} sx={isMe ? { bgcolor: 'rgba(139,92,246,0.15)' } : {}}>
                                    <TableCell sx={{ color: '#fff' }}>
                                        {user.displayName || '(未設定)'}
                                    </TableCell>
                                    <TableCell sx={{ color: '#cbd5e1' }}>
                                        {user.email || '(未設定)'}
                                    </TableCell>
                                    <TableCell sx={{ color: '#64748b', fontSize: '0.7rem', fontFamily: 'monospace' }}>
                                        {user.id}
                                    </TableCell>
                                    <TableCell>
                                        {user.role ? (
                                            <Chip
                                                label={`${meta?.badge || user.role}`}
                                                size="small"
                                                sx={{ color: meta?.color || '#fff', borderColor: meta?.color, fontWeight: 'bold' }}
                                                variant="outlined"
                                            />
                                        ) : (
                                            <Chip label="⚠️ 未設定" size="small" color="error" />
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Select
                                            value={user.role || ''}
                                            size="small"
                                            onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                            disabled={saving === user.id}
                                            sx={{ minWidth: 180, color: '#fff', '.MuiSelect-icon': { color: '#94a3b8' } }}
                                        >
                                            {ALL_ROLES.map(r => {
                                                const m = ROLE_METADATA[r];
                                                return (
                                                    <MenuItem key={r} value={r}>
                                                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                                            <Typography sx={{ color: m?.color, fontWeight: 'bold', fontSize: '0.85rem' }}>
                                                                {m?.badge || r}
                                                            </Typography>
                                                        </Box>
                                                    </MenuItem>
                                                );
                                            })}
                                        </Select>
                                        {saving === user.id && <CircularProgress size={16} sx={{ ml: 1 }} />}
                                    </TableCell>
                                    <TableCell>
                                        {isMe && <Chip label="YOU" size="small" color="primary" />}
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>

            <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mt: 2 }}>
                合計: {users.length} ユーザー
            </Typography>
        </Box>
    );
}
