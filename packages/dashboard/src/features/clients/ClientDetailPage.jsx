// src/features/clients/ClientDetailPage.jsx

import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebase/index.js";
import { useAuth } from '../auth/context/AuthContext.jsx';
import {
  Paper, Typography, Box, List, ListItem, ListItemButton, ListItemText,
  IconButton, Button, CircularProgress, Stack, Dialog, DialogTitle, DialogContent
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import PostAddIcon from '@mui/icons-material/PostAdd';
import PrintIcon from '@mui/icons-material/Print';

// カスタムフック
import { useActivityLog } from '../../hooks/useActivityLog';
import { useAssessment } from '../assessment/hooks/useAssessment';

// モーダルコンポーネント
// セクションコンポーネント
import BasicInfoSection from './components/BasicInfoSection.jsx';
import WelfareContractSection from './components/WelfareContractSection.jsx';
import RelatedOrgsSection from './components/RelatedOrgsSection.jsx';
import HealthStatusSection from './components/HealthStatusSection.jsx';
import ActivityLogList from './components/ActivityLogList.jsx';
import ActivityLogForm from './components/ActivityLogForm.jsx';
import AssessmentListPanel from '../assessment/AssessmentListPanel.jsx';

const detailMenu = [
  { id: 'basic',          label: '基本情報' },
  { id: 'activity',       label: '活動記録' },
  { id: 'welfareContract',label: '福祉・契約' },
  { id: 'relatedOrgs',    label: '関係機関' },
  { id: 'health',         label: '心身の状況' },
  { id: 'assessment',     label: 'アセスメント' },
];

function ClientDetailPage() {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const { saveLog, isSaving: isSavingLog } = useActivityLog();
  const { assessment } = useAssessment(clientId);

  const [selectedMenu, setSelectedMenu] = useState('basic');
  const [clientData, setClientData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(null);
  const [openLogModal, setOpenLogModal] = useState(false);

  const fetchClientData = useCallback(async () => {
    if (!clientId) { setLoading(false); return; }
    setLoading(true);
    try {
      const docRef = doc(db, 'clients', clientId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = { id: docSnap.id, ...docSnap.data() };
        setClientData(data);
        setEditData(data);
      } else {
        navigate('/clients/new');
      }
    } catch (error) {
      console.error("データ取得中にエラーが発生しました:", error);
    } finally {
      setLoading(false);
    }
  }, [clientId, navigate]);

  useEffect(() => { fetchClientData(); }, [fetchClientData]);

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (dataToSave = editData) => {
    try {
      const docRef = doc(db, "clients", clientId);
      await updateDoc(docRef, { ...dataToSave, updatedAt: serverTimestamp() });
      setClientData(dataToSave);
      setIsEditing(false);
    } catch (error) {
      console.error("更新エラー:", error);
    }
  };

  const handleCancelEdit = () => {
    setEditData(clientData);
    setIsEditing(false);
  };

  const handleSaveLog = async (logData) => {
    if (!clientId) { alert("エラー: クライアントIDが見つかりません。"); return { success: false }; }
    const result = await saveLog(clientId, logData, clientData?.name || '');
    if (result && result.success) {
      setOpenLogModal(false);
    } else {
      alert("保存できませんでした: " + (result?.error || "不明なエラー"));
    }
    return result;
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><CircularProgress /></Box>;
  }
  if (!clientData) return null;

  const currentData = isEditing ? editData : clientData;

  return (
    <>
      <Paper sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)' }}>
        {/* ヘッダー */}
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', borderBottom: 1, borderColor: 'divider' }}>
          <IconButton onClick={() => navigate('/clients/new')}><ArrowBackIcon /></IconButton>
          <Typography variant="h6" sx={{ ml: 2, flexGrow: 1 }}>
            {clientData?.name}
            <Typography component="span" variant="body2" sx={{ ml: 2, color: 'text.secondary' }}>
              ({clientData?.status})
            </Typography>
          </Typography>

          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<PrintIcon />}
              onClick={() => window.open(`/clients/${clientId}/print`, '_blank')}
            >
              帳票印刷
            </Button>
            <Button variant="contained" color="primary" startIcon={<PostAddIcon />} onClick={() => setOpenLogModal(true)}>
              活動記録を追加
            </Button>
            <Button
              variant="outlined"
              startIcon={<PrintIcon />}
              onClick={() => navigate(`/support/attendance-print/${clientId}`)}
            >
              出欠確認表
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              startIcon={<PrintIcon />}
              onClick={() => window.open(`/clients/${clientId}/retention-plan/print`, '_blank')}
            >
              定着支援計画書
            </Button>
            {!isEditing && (
              <Button variant="contained" startIcon={<EditIcon />} onClick={() => setIsEditing(true)}>編集</Button>
            )}
          </Stack>
        </Box>

        {/* 本体 */}
        <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
          {/* 左メニュー */}
          <Box sx={{ width: 200, borderRight: 1, borderColor: 'divider', flexShrink: 0 }}>
            <List>
              {detailMenu.map(item => (
                <ListItem key={item.id} disablePadding>
                  <ListItemButton selected={selectedMenu === item.id} onClick={() => setSelectedMenu(item.id)}>
                    <ListItemText primary={item.label} />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Box>

          {/* コンテンツ */}
          <Box sx={{ flexGrow: 1, p: 3, overflowY: 'auto' }}>
            {selectedMenu === 'basic' && (
              <BasicInfoSection
                isEditing={isEditing}
                data={currentData}
                handleChange={handleEditChange}
                handleSave={handleSave}
                handleCancelEdit={handleCancelEdit}
                setEditedData={setEditData}
              />
            )}
            {selectedMenu === 'activity' && (<ActivityLogList clientId={clientId} />)}
            {selectedMenu === 'welfareContract' && (
              <WelfareContractSection isEditing={isEditing} data={currentData} handleChange={handleEditChange} handleSave={handleSave} handleCancelEdit={handleCancelEdit} />
            )}
            {selectedMenu === 'relatedOrgs' && (
              <RelatedOrgsSection isEditing={isEditing} data={currentData} handleChange={handleEditChange} handleSave={handleSave} handleCancelEdit={handleCancelEdit} />
            )}
            {selectedMenu === 'health' && (
              <HealthStatusSection
                mentalData={assessment?.data?.mentalAssessment}
                behaviorsData={assessment?.data?.behaviors}
              />
            )}
            {selectedMenu === 'assessment' && (
              <AssessmentListPanel
                clientId={clientId}
                clientName={clientData?.name}
                serviceStartDate={clientData?.serviceStartDate}
                provisionalPeriodEndDate={clientData?.provisionalPeriodEndDate}
                branchId={clientData?.branchId}
              />
            )}
          </Box>
        </Box>
      </Paper>

      {/* 活動記録モーダル */}
      <Dialog open={openLogModal} onClose={() => setOpenLogModal(false)} fullWidth maxWidth="md">
        <DialogTitle>活動記録の追加</DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          <ActivityLogForm
            onSubmit={handleSaveLog}
            onCancel={() => setOpenLogModal(false)}
            isSaving={isSavingLog}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

export default ClientDetailPage;
