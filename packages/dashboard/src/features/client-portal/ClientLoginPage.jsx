// src/features/client-portal/ClientLoginPage.jsx
// 利用者向けPINコードログイン画面

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box, Paper, Typography, TextField, Button,
    CircularProgress, Alert, Grid, Snackbar
} from '@mui/material';
import { GetApp, IosShare } from '@mui/icons-material';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/index';
import { useClientAuth } from './context/ClientAuthContext';

// PWAマニフェストを動的に設定するカスタムフック
function usePortalPWA() {
    useEffect(() => {
        // 既存のマニフェストリンクを削除
        const existingManifest = document.querySelector('link[rel="manifest"]');
        if (existingManifest) {
            existingManifest.remove();
        }

        // ポータル専用マニフェストを追加
        const manifestLink = document.createElement('link');
        manifestLink.rel = 'manifest';
        manifestLink.href = '/portal-manifest.json';
        document.head.appendChild(manifestLink);

        // theme-colorもポータル用に更新
        let themeColor = document.querySelector('meta[name="theme-color"]');
        const originalColor = themeColor?.content;
        if (themeColor) {
            themeColor.content = '#0d9488'; // ティール色
        }

        // クリーンアップ
        return () => {
            manifestLink.remove();
            if (themeColor && originalColor) {
                themeColor.content = originalColor;
            }
        };
    }, []);
}

// PWAインストールプロンプトを管理するフック
function usePWAInstall() {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isInstallable, setIsInstallable] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);
    const [isIOS, setIsIOS] = useState(false);

    useEffect(() => {
        // iOSかどうかチェック
        const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        setIsIOS(isIOSDevice);

        // すでにPWAとしてインストール済みかチェック
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsInstalled(true);
            return;
        }

        // beforeinstallpromptイベントをキャプチャ
        const handleBeforeInstall = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setIsInstallable(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstall);

        // インストール完了イベント
        window.addEventListener('appinstalled', () => {
            setIsInstalled(true);
            setIsInstallable(false);
            setDeferredPrompt(null);
        });

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
        };
    }, []);

    const promptInstall = async () => {
        if (!deferredPrompt) return false;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            setDeferredPrompt(null);
            setIsInstallable(false);
        }

        return outcome === 'accepted';
    };

    return { isInstallable, isInstalled, isIOS, promptInstall };
}


export default function ClientLoginPage() {
    // PWAマニフェストを設定
    usePortalPWA();

    // PWAインストール機能
    const { isInstallable, isInstalled, isIOS, promptInstall } = usePWAInstall();
    const [showIOSGuide, setShowIOSGuide] = useState(false);

    const [pin, setPin] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { login } = useClientAuth();
    const navigate = useNavigate();


    const handlePinInput = (digit) => {
        if (pin.length < 4) {
            setPin(prev => prev + digit);
            setError('');
        }
    };

    const handleClear = () => {
        setPin('');
        setError('');
    };

    const handleBackspace = () => {
        setPin(prev => prev.slice(0, -1));
    };

    const handleSubmit = async () => {
        if (pin.length !== 4) {
            setError('4桁のPINコードを入力してください');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // PINコードで利用者を検索
            const q = query(
                collection(db, 'clients'),
                where('pin', '==', pin)
            );
            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                setError('PINコードが正しくありません');
                setPin('');
                return;
            }

            const clientDoc = snapshot.docs[0];
            const clientData = {
                id: clientDoc.id,
                name: clientDoc.data().name,
                ...clientDoc.data(),
            };

            login(clientData);
            navigate('/portal/home');
        } catch (err) {
            console.error('ログインエラー:', err);
            setError('ログインに失敗しました');
        } finally {
            setLoading(false);
        }
    };

    // 4桁入力で自動送信
    if (pin.length === 4 && !loading) {
        handleSubmit();
    }

    return (
        <Box sx={{
            minHeight: '100vh',
            bgcolor: '#0f0f1a',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            p: 2,
        }}>
            <Typography
                variant="h4"
                sx={{
                    mb: 4,
                    fontWeight: 'bold',
                    background: 'linear-gradient(90deg, #8b5cf6, #06b6d4)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                }}
            >
                Manecto
            </Typography>

            <Paper sx={{
                p: 3,
                width: '100%',
                maxWidth: 320,
                bgcolor: 'rgba(30, 41, 59, 0.9)',
                borderRadius: 2,
            }}>
                <Typography variant="h6" align="center" sx={{ mb: 3, color: '#fff' }}>
                    PINコードを入力
                </Typography>

                {/* PIN表示 */}
                <Box sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: 1.5,
                    mb: 3
                }}>
                    {[0, 1, 2, 3].map((i) => (
                        <Box
                            key={i}
                            sx={{
                                width: 48,
                                height: 48,
                                borderRadius: 1,
                                border: '2px solid',
                                borderColor: pin.length > i ? '#06b6d4' : '#4a5568',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                bgcolor: pin.length > i ? 'rgba(6, 182, 212, 0.1)' : 'transparent',
                            }}
                        >
                            {pin.length > i && (
                                <Box sx={{
                                    width: 16,
                                    height: 16,
                                    borderRadius: '50%',
                                    bgcolor: '#06b6d4'
                                }} />
                            )}
                        </Box>
                    ))}
                </Box>

                {error && (
                    <Alert severity="error" sx={{ mb: 2, py: 0.5 }}>
                        {error}
                    </Alert>
                )}

                {loading && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                        <CircularProgress size={32} />
                    </Box>
                )}

                {/* テンキー */}
                <Grid container spacing={1}>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, '←'].map((key) => (
                        <Grid size={{ xs: 4 }} key={key}>
                            <Button
                                fullWidth
                                variant={typeof key === 'number' ? 'contained' : 'outlined'}
                                onClick={() => {
                                    if (key === 'C') handleClear();
                                    else if (key === '←') handleBackspace();
                                    else handlePinInput(String(key));
                                }}
                                disabled={loading}
                                sx={{
                                    height: 56,
                                    fontSize: '1.25rem',
                                    fontWeight: 'bold',
                                    bgcolor: typeof key === 'number' ? 'rgba(6, 182, 212, 0.2)' : 'transparent',
                                    color: typeof key === 'number' ? '#fff' : '#06b6d4',
                                    borderColor: '#06b6d4',
                                    '&:hover': {
                                        bgcolor: typeof key === 'number' ? 'rgba(6, 182, 212, 0.4)' : 'rgba(6, 182, 212, 0.1)',
                                    },
                                }}
                            >
                                {key}
                            </Button>
                        </Grid>
                    ))}
                </Grid>
            </Paper>

            <Typography variant="caption" sx={{ mt: 3, color: '#6b7280' }}>
                PINコードがわからない場合はスタッフにお聞きください
            </Typography>

            {/* インストールボタン - Android/Chrome */}
            {isInstallable && !isInstalled && (
                <Button
                    variant="contained"
                    startIcon={<GetApp />}
                    onClick={promptInstall}
                    sx={{
                        mt: 3,
                        py: 1.5,
                        px: 4,
                        fontSize: '1rem',
                        fontWeight: 'bold',
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)',
                        borderRadius: 2,
                        '&:hover': {
                            background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 6px 20px rgba(16, 185, 129, 0.5)',
                        },
                        transition: 'all 0.2s ease',
                    }}
                >
                    📱 アプリをインストール
                </Button>
            )}

            {/* iOSの場合の手動インストール案内ボタン */}
            {isIOS && !isInstalled && (
                <Button
                    variant="outlined"
                    startIcon={<IosShare />}
                    onClick={() => setShowIOSGuide(true)}
                    sx={{
                        mt: 3,
                        py: 1.5,
                        px: 4,
                        fontSize: '1rem',
                        fontWeight: 'bold',
                        color: '#10b981',
                        borderColor: '#10b981',
                        borderRadius: 2,
                        '&:hover': {
                            bgcolor: 'rgba(16, 185, 129, 0.1)',
                            borderColor: '#059669',
                        },
                    }}
                >
                    📱 ホーム画面に追加する方法
                </Button>
            )}

            {/* インストール済みメッセージ */}
            {isInstalled && (
                <Typography
                    variant="body2"
                    sx={{
                        mt: 3,
                        color: '#10b981',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                    }}
                >
                    ✅ アプリとしてインストール済み
                </Typography>
            )}

            {/* iOS向けインストールガイド */}
            <Snackbar
                open={showIOSGuide}
                onClose={() => setShowIOSGuide(false)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Paper
                    sx={{
                        p: 2,
                        bgcolor: 'rgba(30, 41, 59, 0.95)',
                        border: '1px solid #06b6d4',
                        borderRadius: 2,
                        maxWidth: 320,
                    }}
                >
                    <Typography variant="subtitle2" sx={{ color: '#fff', fontWeight: 'bold', mb: 1 }}>
                        📱 ホーム画面に追加する方法
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#d1d5db', mb: 1 }}>
                        1. 画面下の「共有」ボタン <IosShare sx={{ fontSize: 16, verticalAlign: 'middle' }} /> をタップ
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#d1d5db', mb: 1 }}>
                        2.「ホーム画面に追加」を選択
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#d1d5db' }}>
                        3.「追加」をタップして完了！
                    </Typography>
                    <Button
                        size="small"
                        onClick={() => setShowIOSGuide(false)}
                        sx={{ mt: 1, color: '#06b6d4' }}
                    >
                        閉じる
                    </Button>
                </Paper>
            </Snackbar>

            <Typography variant="caption" sx={{ mt: 4, color: 'rgba(255,255,255,0.3)' }}>
                App Version: v2.1 (Activity Sync)
            </Typography>
        </Box >
    );
}
