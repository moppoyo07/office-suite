// src/features/clients/AllClientsListPage.jsx

import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Paper, Typography, TextField, InputAdornment,
  Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  MenuItem, Select, FormControl, InputLabel, CircularProgress, Button, Grid
} from '@mui/material';
import { Search, People, PersonOff } from '@mui/icons-material';
import { collection, getDocs, query, where, or } from 'firebase/firestore';
import { db } from '../../firebase/index';
import { useNavigate } from 'react-router-dom';
import { useTenant } from '../../context/TenantContext';
import { format } from 'date-fns';
import { CLIENT_STATUS, STATUS_CONFIG } from '../../constants/clientStatus';

// 色定義
const STATUS_COLORS = {
  [CLIENT_STATUS.INQUIRY]: { bg: '#06b6d4', text: '#fff' },
  [CLIENT_STATUS.INTERVIEW]: { bg: '#3b82f6', text: '#fff' },
  [CLIENT_STATUS.TRIAL]: { bg: '#8b5cf6', text: '#fff' },
  [CLIENT_STATUS.PRE_CONTRACT]: { bg: '#f59e0b', text: '#fff' },
  [CLIENT_STATUS.ACTIVE_ONSITE]: { bg: '#10b981', text: '#fff' },
  [CLIENT_STATUS.ACTIVE_REMOTE]: { bg: '#14b8a6', text: '#fff' },
  [CLIENT_STATUS.COMPLETED]: { bg: '#6366f1', text: '#fff' },
};

// 利用中退所は施設内・施設外を区別しない（統合）
const LOST_PHASE_LABELS = {
  [CLIENT_STATUS.INQUIRY]: "問合せロスト",
  [CLIENT_STATUS.INTERVIEW]: "見学ロスト",
  [CLIENT_STATUS.TRIAL]: "体験ロスト",
  [CLIENT_STATUS.PRE_CONTRACT]: "準備中ロスト",
  active: "利用中退所",  // active_onsite / active_remote 両方をカバー
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
  const [filterStatus, setFilterStatus] = useState('active'); // 初期は利用中のみ
  const [loading, setLoading] = useState(true);
  const [statusCounts, setStatusCounts] = useState({});
  const navigate = useNavigate();
  const { activeCompanyId: companyId } = useTenant();
  const companyFilter = companyId ? [where('companyId', '==', companyId)] : [];

  // ステータス別件数を取得（軽量）
  useEffect(() => {
    const fetchStatusCounts = async () => {
      try {
        const q = query(collection(db, 'clients'), ...companyFilter);
        const snapshot = await getDocs(q);
        const counts = {};
        let activeCount = 0;
        snapshot.docs.forEach(doc => {
          const status = doc.data().status;
          counts[status] = (counts[status] || 0) + 1;
          if (status === CLIENT_STATUS.ACTIVE_ONSITE || status === CLIENT_STATUS.ACTIVE_REMOTE) {
            activeCount++;
          }
        });
        counts['active'] = activeCount;
        counts['total'] = snapshot.docs.length;
        setStatusCounts(counts);
      } catch (error) {
        console.error('件数取得エラー:', error);
      }
    };
    fetchStatusCounts();
  }, []);

  // 条件に応じてデータ取得
  useEffect(() => {
    const fetchClients = async () => {
      setLoading(true);
      try {
        let q;
        if (filterStatus === 'active') {
          q = query(collection(db, 'clients'), ...companyFilter, where('status', 'in', [CLIENT_STATUS.ACTIVE_ONSITE, CLIENT_STATUS.ACTIVE_REMOTE]));
        } else if (filterStatus === 'all') {
          q = query(collection(db, 'clients'), ...companyFilter);
        } else if (filterStatus === 'lost_active') {
          q = query(collection(db, 'clients'), ...companyFilter, where('status', '==', CLIENT_STATUS.CLOSED), where('lostAtPhase', 'in', [CLIENT_STATUS.ACTIVE_ONSITE, CLIENT_STATUS.ACTIVE_REMOTE]));
        } else if (filterStatus.startsWith('lost_')) {
          const targetPhase = filterStatus.replace('lost_', '');
          q = query(collection(db, 'clients'), ...companyFilter, where('status', '==', CLIENT_STATUS.CLOSED), where('lostAtPhase', '==', targetPhase));
        } else if (filterStatus === CLIENT_STATUS.FOLLOW_UP || filterStatus === 'follow_up') {
          q = query(collection(db, 'clients'), ...companyFilter, where('status', 'in', ['follow-up-m1', 'follow-up-m2', 'follow-up-m3', 'follow-up-m4', 'follow-up-m5', 'follow-up-m6']));
        } else {
          q = query(collection(db, 'clients'), ...companyFilter, where('status', '==', filterStatus));
        }

        const snapshot = await getDocs(q);
        const clientsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          inquiryDate: doc.data().inquiryDate?.toDate() || null,
          updatedAt: doc.data().updatedAt?.toDate() || null,
        }));
        clientsData.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
        setClients(clientsData);
      } catch (error) {
        console.error('利用者取得エラー:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchClients();
  }, [filterStatus, companyId]); // eslint-disable-line react-hooks/exhaustive-deps

  // 検索フィルタ（ローカル）
  const filteredClients = useMemo(() => {
    if (!searchText) return clients;
    const lowerText = searchText.toLowerCase();
    // 電話番号検索用: ハイフン・空白・括弧を除去して数字のみで比較
    const normalizePhone = (s) => String(s || '').replace(/[\s\-－ー()（）]/g, '');
    const phoneQuery = normalizePhone(searchText);
    const isPhoneQuery = /^\d+$/.test(phoneQuery) && phoneQuery.length >= 2;

    return clients.filter(client => {
      const matchesName = client.name?.toLowerCase().includes(lowerText);
      const matchesKana = client.nameKana?.includes(lowerText);
      const matchesReason = client.lostReasonDetails?.toLowerCase().includes(lowerText);
      const matchesPhone = isPhoneQuery && (
        normalizePhone(client.phone).includes(phoneQuery) ||
        normalizePhone(client.mobilePhone).includes(phoneQuery)
      );
      return matchesName || matchesKana || matchesReason || matchesPhone;
    });
  }, [clients, searchText]);

  // ステータスチップ
  const renderStatusChip = (row) => {
    const status = row.status;

    if (status === CLIENT_STATUS.CLOSED) {
      const lostPhase = row.lostAtPhase;
      // active_onsite / active_remote はどちらも「利用中退所」として表示
      let label;
      if (lostPhase === CLIENT_STATUS.ACTIVE_ONSITE || lostPhase === CLIENT_STATUS.ACTIVE_REMOTE) {
        label = '利用中退所';
      } else {
        label = LOST_PHASE_LABELS[lostPhase] || '利用終了';
      }
      return (
        <Chip
          label={label}
          size="small"
          variant="outlined"
          sx={{
            color: '#ef4444',
            borderColor: '#ef4444',
            fontWeight: 'bold',
            bgcolor: 'rgba(239, 68, 68, 0.05)'
          }}
        />
      );
    }

    if (status?.startsWith('follow-up')) {
      const month = status.replace('follow-up-m', '');
      return (
        <Chip
          label={`定着支援 ${month}`}
          size="small"
          sx={{ bgcolor: '#ec4899', color: '#fff', fontWeight: 'bold' }}
        />
      );
    }

    const config = STATUS_CONFIG[status];
    const colorStyle = STATUS_COLORS[status] || { bg: '#64748b', text: '#fff' };

    return (
      <Chip
        label={config?.label || status}
        size="small"
        sx={{ bgcolor: colorStyle.bg, color: colorStyle.text, fontWeight: 'bold', border: 'none' }}
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

  return (
    <Box sx={{ height: '100%', width: '100%', p: 2 }}>
      {/* ステータス別サマリー - コンパクト版 */}
      <Box sx={{ mb: 1, display: 'flex', gap: 0.5, flexWrap: 'wrap', alignItems: 'center' }}>
        <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>フィルタ:</Typography>
        <Chip
          size="small"
          icon={<People sx={{ fontSize: 14 }} />}
          label={`利用中 ${statusCounts['active'] || 0}`}
          color="success"
          variant={filterStatus === 'active' ? 'filled' : 'outlined'}
          onClick={() => setFilterStatus('active')}
          sx={{ cursor: 'pointer', height: 24, fontSize: '0.75rem' }}
        />
        <Chip size="small" label={`問合せ ${statusCounts[CLIENT_STATUS.INQUIRY] || 0}`} variant={filterStatus === CLIENT_STATUS.INQUIRY ? 'filled' : 'outlined'} onClick={() => setFilterStatus(CLIENT_STATUS.INQUIRY)} sx={{ cursor: 'pointer', height: 24, fontSize: '0.75rem' }} />
        <Chip size="small" label={`見学 ${statusCounts[CLIENT_STATUS.INTERVIEW] || 0}`} variant={filterStatus === CLIENT_STATUS.INTERVIEW ? 'filled' : 'outlined'} onClick={() => setFilterStatus(CLIENT_STATUS.INTERVIEW)} sx={{ cursor: 'pointer', height: 24, fontSize: '0.75rem' }} />
        <Chip size="small" label={`体験 ${statusCounts[CLIENT_STATUS.TRIAL] || 0}`} variant={filterStatus === CLIENT_STATUS.TRIAL ? 'filled' : 'outlined'} onClick={() => setFilterStatus(CLIENT_STATUS.TRIAL)} sx={{ cursor: 'pointer', height: 24, fontSize: '0.75rem' }} />
        <Chip size="small" label={`終了 ${statusCounts[CLIENT_STATUS.CLOSED] || 0}`} color="error" variant={filterStatus.startsWith('lost_') ? 'filled' : 'outlined'} onClick={() => setFilterStatus('lost_' + CLIENT_STATUS.INQUIRY)} sx={{ cursor: 'pointer', height: 24, fontSize: '0.75rem' }} />
        <Chip size="small" label={`全て ${statusCounts['total'] || 0}`} variant={filterStatus === 'all' ? 'filled' : 'outlined'} onClick={() => setFilterStatus('all')} sx={{ cursor: 'pointer', height: 24, fontSize: '0.75rem' }} />
      </Box>

      {/* 検索・フィルタ */}
      <Paper sx={{ p: 2, mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h6" fontWeight="bold">
          {filterStatus === 'active' ? '利用中' : filterStatus === 'all' ? '全利用者' : STATUS_CONFIG[filterStatus]?.label || 'リスト'} ({filteredClients.length}件)
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>ステータス絞り込み</InputLabel>
            <Select
              value={filterStatus}
              label="ステータス絞り込み"
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <MenuItem value="active">🟢 利用中のみ</MenuItem>
              <MenuItem value="all">全て表示</MenuItem>
              <MenuItem disabled sx={{ fontSize: '0.75rem', bgcolor: '#333' }}>進行中</MenuItem>
              {Object.entries(STATUS_CONFIG).map(([key, config]) => {
                if (key === CLIENT_STATUS.CLOSED || key === CLIENT_STATUS.COMPLETED) return null;
                return <MenuItem key={key} value={key}>{config.label}</MenuItem>;
              })}
              <MenuItem value={CLIENT_STATUS.COMPLETED}>{STATUS_CONFIG[CLIENT_STATUS.COMPLETED].label}</MenuItem>
              <MenuItem disabled sx={{ fontSize: '0.75rem', bgcolor: '#333' }}>終了・ロスト理由別</MenuItem>
              {Object.entries(LOST_PHASE_LABELS).map(([phaseKey, label]) => (
                <MenuItem key={`lost_${phaseKey}`} value={`lost_${phaseKey}`}>{label}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            size="small"
            placeholder="氏名・電話番号・理由で検索..."
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

      {/* テーブル */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper} sx={{ maxHeight: 'calc(100vh - 220px)' }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: '#1e1e1e', color: '#fff', width: '20%', py: 0.5, fontSize: '0.75rem' }}>氏名</TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: '#1e1e1e', color: '#fff', width: '12%', py: 0.5, fontSize: '0.75rem' }}>ステータス</TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: '#1e1e1e', color: '#fff', width: '35%', py: 0.5, fontSize: '0.75rem' }}>理由・詳細</TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: '#1e1e1e', color: '#fff', width: '13%', py: 0.5, fontSize: '0.75rem' }}>問合せ日</TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: '#1e1e1e', color: '#fff', width: '13%', py: 0.5, fontSize: '0.75rem' }}>最終更新</TableCell>
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
      )}
    </Box>
  );
};

export default AllClientsListPage;