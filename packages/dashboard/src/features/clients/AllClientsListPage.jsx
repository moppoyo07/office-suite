// src/features/clients/AllClientsListPage.jsx

import React, { useState, useEffect } from 'react';
import { 
  Box, Paper, Typography, TextField, InputAdornment, 
  Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  MenuItem, Select, FormControl, InputLabel
} from '@mui/material';
import { Search } from '@mui/icons-material';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '@/firebase/index';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { CLIENT_STATUS, STATUS_CONFIG } from '@/constants/clientStatus';

// 色定義（なければデフォルト色を使用）
const STATUS_COLORS = {
  [CLIENT_STATUS.INQUIRY]:      { bg: '#06b6d4', text: '#fff' }, // Cyan
  [CLIENT_STATUS.INTERVIEW]:    { bg: '#3b82f6', text: '#fff' }, // Blue
  [CLIENT_STATUS.TRIAL]:        { bg: '#8b5cf6', text: '#fff' }, // Violet
  [CLIENT_STATUS.PRE_CONTRACT]: { bg: '#f59e0b', text: '#fff' }, // Amber
  [CLIENT_STATUS.ACTIVE_ONSITE]:{ bg: '#10b981', text: '#fff' }, // Emerald (Green)
  [CLIENT_STATUS.ACTIVE_REMOTE]:{ bg: '#14b8a6', text: '#fff' }, // Teal
  [CLIENT_STATUS.COMPLETED]:    { bg: '#6366f1', text: '#fff' }, // Indigo
};

const LOST_PHASE_LABELS = {
  [CLIENT_STATUS.INQUIRY]: "問合せロスト",
  [CLIENT_STATUS.INTERVIEW]: "見学ロスト",
  [CLIENT_STATUS.TRIAL]: "体験ロスト",
  [CLIENT_STATUS.PRE_CONTRACT]: "準備中ロスト",
  [CLIENT_STATUS.ACTIVE_ONSITE]: "利用中退所",
  [CLIENT_STATUS.ACTIVE_REMOTE]: "利用中退所",
  [CLIENT_STATUS.COMPLETED]: "定着後終了",
};

const LOST_REASON_TRANSLATIONS = {
  'other': 'その他',
  'details_mismatch': '条件不一致',
  'price': '料金・費用',
  'distance': '通所困難',
  'atmosphere': '雰囲気',
  'health': '体調不良',
  'employed': '就職決定',
  'transferred': '他事業所へ',
  'expired': '期間満了',
  'drop_out': '途中退所',
};

export const AllClientsListPage = () => {
  const [clients, setClients] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); 
  const navigate = useNavigate();

  useEffect(() => {
    const q = query(collection(db, 'clients'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const clientsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        inquiryDate: doc.data().inquiryDate?.toDate() || null,
        updatedAt: doc.data().updatedAt?.toDate() || null,
      }));
      clientsData.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
      setClients(clientsData);
    });

    return () => unsubscribe();
  }, []);

  // ★ステータスチップ（色付き）
  const renderStatusChip = (row) => {
    const status = row.status;
    
    // ロスト（終了）の場合
    if (status === CLIENT_STATUS.CLOSED) {
      const lostPhase = row.lostAtPhase;
      const label = LOST_PHASE_LABELS[lostPhase] || '利用終了';
      return (
        <Chip 
          label={label} 
          size="small" 
          variant="outlined" // ロストはあえて枠線のみにして区別
          sx={{ 
            color: '#ef4444', 
            borderColor: '#ef4444',
            fontWeight: 'bold',
            bgcolor: 'rgba(239, 68, 68, 0.05)'
          }} 
        />
      );
    }

    // 定着支援（Follow-up）の特別扱い
    if (status.startsWith('follow-up')) {
      // "follow-up-m1" -> "1ヶ月目" のように見やすく
      const month = status.replace('follow-up-m', '');
      return (
        <Chip 
          label={`定着支援 ${month}`} 
          size="small" 
          sx={{ 
            bgcolor: '#ec4899', // Pink
            color: '#fff',
            fontWeight: 'bold'
          }} 
        />
      );
    }

    // 通常ステータス
    const config = STATUS_CONFIG[status];
    const colorStyle = STATUS_COLORS[status] || { bg: '#64748b', text: '#fff' }; // デフォルトGrey
    
    return (
      <Chip 
        label={config?.label || status} 
        size="small" 
        sx={{ 
          bgcolor: colorStyle.bg, 
          color: colorStyle.text,
          fontWeight: 'bold',
          border: 'none'
        }} 
      />
    );
  };

  const renderReasonText = (row) => {
    if (row.status !== CLIENT_STATUS.CLOSED) return '-';
    if (row.lostReasonDetails && row.lostReasonDetails.trim() !== "") {
      return (
        <Typography variant="body2" sx={{ color: '#ef4444', maxWidth: 300 }} noWrap title={row.lostReasonDetails}>
          {row.lostReasonDetails}
        </Typography>
      );
    }
    if (row.lostReason) {
      return (
        <Typography variant="body2" color="text.secondary">
          {LOST_REASON_TRANSLATIONS[row.lostReason] || row.lostReason}
        </Typography>
      );
    }
    return <Typography variant="caption" color="text.disabled">理由なし</Typography>;
  };

  const filteredClients = clients.filter((client) => {
    if (searchText) {
      const lowerText = searchText.toLowerCase();
      const matchesName = client.name?.toLowerCase().includes(lowerText);
      const matchesKana = client.nameKana?.includes(lowerText);
      const matchesReason = client.lostReasonDetails?.toLowerCase().includes(lowerText);
      if (!matchesName && !matchesKana && !matchesReason) return false;
    }

    if (filterStatus !== 'all') {
      if (filterStatus.startsWith('lost_')) {
        if (client.status !== CLIENT_STATUS.CLOSED) return false;
        const targetPhase = filterStatus.replace('lost_', '');
        return client.lostAtPhase === targetPhase;
      } else {
        return client.status === filterStatus;
      }
    }
    return true;
  });

  return (
    <Box sx={{ height: '100%', width: '100%', p: 3 }}>
      <Paper sx={{ p: 2, mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h6" fontWeight="bold">
          全利用者リスト ({filteredClients.length}件)
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>ステータス絞り込み</InputLabel>
            <Select
              value={filterStatus}
              label="ステータス絞り込み"
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <MenuItem value="all">全て表示</MenuItem>
              <MenuItem disabled sx={{ fontSize: '0.75rem', bgcolor: '#eee' }}>進行中</MenuItem>
              {Object.entries(STATUS_CONFIG).map(([key, config]) => {
                if (key === CLIENT_STATUS.CLOSED || key === CLIENT_STATUS.COMPLETED) return null;
                return <MenuItem key={key} value={key}>{config.label}</MenuItem>;
              })}
              <MenuItem value={CLIENT_STATUS.COMPLETED}>{STATUS_CONFIG[CLIENT_STATUS.COMPLETED].label}</MenuItem>
              <MenuItem disabled sx={{ fontSize: '0.75rem', bgcolor: '#eee' }}>終了・ロスト理由別</MenuItem>
              {Object.entries(LOST_PHASE_LABELS).map(([phaseKey, label]) => (
                <MenuItem key={`lost_${phaseKey}`} value={`lost_${phaseKey}`}>{label}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            size="small"
            placeholder="氏名・理由で検索..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
        </Box>
      </Paper>

      <TableContainer component={Paper} sx={{ maxHeight: 'calc(100vh - 200px)' }}>
        <Table stickyHeader size="medium">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', bgcolor: '#1e1e1e', color: '#fff', width: '20%' }}>氏名</TableCell>
              <TableCell sx={{ fontWeight: 'bold', bgcolor: '#1e1e1e', color: '#fff', width: '15%' }}>ステータス</TableCell>
              <TableCell sx={{ fontWeight: 'bold', bgcolor: '#1e1e1e', color: '#fff', width: '35%' }}>理由・詳細</TableCell>
              <TableCell sx={{ fontWeight: 'bold', bgcolor: '#1e1e1e', color: '#fff', width: '15%' }}>問合せ日</TableCell>
              <TableCell sx={{ fontWeight: 'bold', bgcolor: '#1e1e1e', color: '#fff', width: '15%' }}>最終更新</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredClients.map((row) => (
              <TableRow 
                key={row.id} 
                hover 
                onClick={() => navigate(`/clients/${row.id}`)}
                sx={{ cursor: 'pointer' }}
              >
                <TableCell>
                  <Typography variant="body2" fontWeight="bold">{row.name}</Typography>
                  <Typography variant="caption" color="text.secondary">{row.nameKana}</Typography>
                </TableCell>
                <TableCell>{renderStatusChip(row)}</TableCell>
                <TableCell>{renderReasonText(row)}</TableCell>
                <TableCell>{row.inquiryDate ? format(row.inquiryDate, 'yyyy/MM/dd') : '-'}</TableCell>
                <TableCell>
                  <Typography variant="caption" color="text.secondary">
                    {row.updatedAt ? format(row.updatedAt, 'MM/dd HH:mm') : '-'}
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
            {filteredClients.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                  条件に一致するデータが見つかりません
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default AllClientsListPage;