// src/pages/AnnualReportCenterPage.jsx
// 年次処理センター - 期末に行う各種届出書・報告書の印刷一覧

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Container, Typography, Paper, Stack, Chip } from '@mui/material';
import { AssignmentTurnedIn, Calculate, TableChart } from '@mui/icons-material';


const ReportCard = ({ icon, title, description, tag, onClick, disabled }) => (
    <Paper
        elevation={disabled ? 0 : 4}
        onClick={disabled ? undefined : onClick}
        sx={{
            flex: 1,
            minWidth: 220,
            p: 3,
            borderRadius: 3,
            background: disabled
                ? 'rgba(30,41,59,0.3)'
                : 'linear-gradient(145deg, #1e3a5f 0%, #1e4d7b 100%)',
            cursor: disabled ? 'default' : 'pointer',
            transition: 'all 0.3s ease',
            border: disabled
                ? '1px dashed rgba(148,163,184,0.3)'
                : '1px solid rgba(59,130,246,0.3)',
            '&:hover': disabled ? {} : {
                transform: 'translateY(-6px) scale(1.02)',
                boxShadow: '0 16px 32px rgba(59,130,246,0.3)',
            },
        }}
    >
        <Box sx={{ textAlign: 'center' }}>
            <Box sx={{ fontSize: 48, mb: 1, opacity: disabled ? 0.3 : 1 }}>{icon}</Box>
            <Typography variant="h6" sx={{ color: disabled ? 'text.disabled' : 'white', fontWeight: 'bold', mb: 0.5 }}>
                {title}
            </Typography>
            <Typography variant="body2" sx={{ color: disabled ? 'text.disabled' : 'rgba(255,255,255,0.75)', mb: 1.5 }}>
                {description}
            </Typography>
            <Chip
                label={disabled ? '準備中' : (tag || '作成する →')}
                size="small"
                sx={{
                    bgcolor: disabled ? 'rgba(100,116,139,0.2)' : 'rgba(255,255,255,0.15)',
                    color: disabled ? 'text.disabled' : 'white',
                    fontWeight: 'bold',
                }}
            />
        </Box>
    </Paper>
);

export default function AnnualReportCenterPage() {
    const navigate = useNavigate();
    const now = new Date();
    const fiscalYear = now.getMonth() < 3 ? now.getFullYear() - 1 : now.getFullYear();

    return (
        <Container maxWidth="lg">
            <Box sx={{ py: 3 }}>
                {/* ヘッダー */}
                <Paper
                    elevation={0}
                    sx={{
                        p: 4, mb: 4,
                        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
                        borderRadius: 3,
                        border: '1px solid rgba(59,130,246,0.3)',
                        position: 'relative',
                        overflow: 'hidden',
                        '&::before': {
                            content: '""',
                            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                            background: 'radial-gradient(circle at 20% 50%, rgba(59,130,246,0.15) 0%, transparent 50%)',
                        },
                    }}
                >
                    <Box sx={{ position: 'relative', zIndex: 1 }}>
                        <Typography variant="h3" sx={{ fontWeight: 800, color: 'white', mb: 0.5 }}>
                            📋 年次処理センター
                        </Typography>
                        <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                            {fiscalYear}年度 期末届出書・報告書
                        </Typography>
                    </Box>
                </Paper>

                {/* カード一覧 */}
                <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2, color: 'text.secondary' }}>
                    算定シート
                </Typography>
                <Stack direction="row" spacing={3} flexWrap="wrap" sx={{ mb: 4 }}>
                    <ReportCard
                        icon={<TableChart />}
                        title="平均利用者数算定"
                        description="前年度の平均利用者数を算定し、職員配置基準を確認"
                        tag="算定シート"
                        onClick={() => navigate('/admin/average-users-sheet')}
                    />
                </Stack>

                <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2, color: 'text.secondary' }}>
                    届出書
                </Typography>
                <Stack direction="row" spacing={3} flexWrap="wrap" sx={{ mb: 4 }}>
                    <ReportCard
                        icon={<Calculate />}
                        title="基本報酬算定区分 届出書"
                        description="就労定着率に基づく区分を算定し、別紙38を自動生成"
                        tag="別紙38"
                        onClick={() => navigate('/annual/basic-reward')}
                    />
                    <ReportCard
                        icon={<AssignmentTurnedIn />}
                        title="就労定着者の状況"
                        description="定着者一覧の別添資料"
                        disabled
                    />
                </Stack>

                <Typography variant="caption" color="text.secondary">
                    ※ 年度は{fiscalYear}年4月〜{fiscalYear + 1}年3月。届出書は期末に行政へ提出が必要です。
                </Typography>
            </Box>
        </Container>
    );
}
