// src/components/TenantSwitcher.jsx
// 企業・支店切り替えUIコンポーネント

import React, { useState } from 'react';
import {
    Box,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Typography,
    Chip,
    Divider,
    CircularProgress,
} from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';
import StoreIcon from '@mui/icons-material/Store';
import { useTenant } from '../context/TenantContext';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { ROLE_LABELS } from '../constants/roles';

/**
 * 企業・支店を切り替えるためのUIコンポーネント
 * サイドバーやヘッダーに配置することを想定
 */
export function TenantSwitcher({ compact = false }) {
    const {
        currentTenant,
        companies,
        branches,
        switchCompany,
        switchBranch,
        canSwitchCompany,
        canSwitchBranch,
        loading,
    } = useTenant();

    const { role } = useCurrentUser();

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                <CircularProgress size={20} />
            </Box>
        );
    }

    // 切り替え不可の場合は現在のテナント情報のみ表示
    if (!canSwitchCompany && !canSwitchBranch) {
        return (
            <Box sx={{ p: 2 }}>
                <Typography variant="caption" color="text.secondary" display="block">
                    所属
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    {currentTenant.company?.name || '未設定'}
                </Typography>
                {currentTenant.branch && (
                    <Typography variant="body2" color="text.secondary">
                        {currentTenant.branch.name}
                    </Typography>
                )}
            </Box>
        );
    }

    if (compact) {
        // コンパクトモード（ヘッダー用）
        return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {canSwitchCompany && companies.length > 1 && (
                    <Select
                        size="small"
                        value={currentTenant.companyId || ''}
                        onChange={(e) => switchCompany(e.target.value)}
                        sx={{ minWidth: 120 }}
                    >
                        {companies.map(company => (
                            <MenuItem key={company.id} value={company.id}>
                                {company.name}
                            </MenuItem>
                        ))}
                    </Select>
                )}
                {canSwitchBranch && branches.length > 1 && (
                    <Select
                        size="small"
                        value={currentTenant.branchId || ''}
                        onChange={(e) => switchBranch(e.target.value)}
                        sx={{ minWidth: 120 }}
                    >
                        {branches.map(branch => (
                            <MenuItem key={branch.id} value={branch.id}>
                                {branch.name}
                            </MenuItem>
                        ))}
                    </Select>
                )}
            </Box>
        );
    }

    // 通常モード（サイドバー用）
    return (
        <Box sx={{ p: 2 }}>
            {/* ロール表示 */}
            <Box sx={{ mb: 2 }}>
                <Chip
                    label={ROLE_LABELS[role] || role}
                    size="small"
                    color="primary"
                    variant="outlined"
                />
            </Box>

            {/* 企業選択 */}
            {canSwitchCompany && companies.length > 0 && (
                <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                    <InputLabel id="company-select-label">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <BusinessIcon fontSize="small" />
                            企業
                        </Box>
                    </InputLabel>
                    <Select
                        labelId="company-select-label"
                        value={currentTenant.companyId || ''}
                        label="企業"
                        onChange={(e) => switchCompany(e.target.value)}
                    >
                        {companies.map(company => (
                            <MenuItem key={company.id} value={company.id}>
                                {company.name}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            )}

            {/* 支店選択 */}
            {canSwitchBranch && branches.length > 0 && (
                <FormControl fullWidth size="small">
                    <InputLabel id="branch-select-label">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <StoreIcon fontSize="small" />
                            支店
                        </Box>
                    </InputLabel>
                    <Select
                        labelId="branch-select-label"
                        value={currentTenant.branchId || ''}
                        label="支店"
                        onChange={(e) => switchBranch(e.target.value)}
                    >
                        {branches.map(branch => (
                            <MenuItem key={branch.id} value={branch.id}>
                                {branch.name}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            )}

            {/* 現在の選択表示 */}
            {(!canSwitchCompany || companies.length <= 1) && currentTenant.company && (
                <Box sx={{ mb: 1 }}>
                    <Typography variant="caption" color="text.secondary">企業</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {currentTenant.company.name}
                    </Typography>
                </Box>
            )}
            {(!canSwitchBranch || branches.length <= 1) && currentTenant.branch && (
                <Box>
                    <Typography variant="caption" color="text.secondary">支店</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {currentTenant.branch.name}
                    </Typography>
                </Box>
            )}
        </Box>
    );
}

export default TenantSwitcher;
