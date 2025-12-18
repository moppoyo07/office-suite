// src/features/clients/ClientDetailPage.jsx

import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/firebase/index.js";
import { useAuth } from '@/features/auth/context/AuthContext.jsx';
import {
  Paper, Typography, Box, List, ListItem, ListItemButton, ListItemText,
  IconButton, Button, CircularProgress, Stack, Dialog, DialogTitle, DialogContent
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import PostAddIcon from '@mui/icons-material/PostAdd';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BlockIcon from '@mui/icons-material/Block';
import PublishedWithChangesIcon from '@mui/icons-material/PublishedWithChanges';

// カスタムフック
import { useClientUpdater } from '../../hooks/useClientUpdater';
import { useActivityLog } from '@/hooks/useActivityLog';

// モーダルコンポーネント
import SurveyRequestModal from "./components/SurveyRequestModal";
import ScheduleModal from "./components/ScheduleModal";
import EmploymentInfoModal from './components/EmploymentInfoModal.jsx';
import LostReasonModal from './components/LostReasonModal.jsx';
import StatusChangeModal from './components/StatusChangeModal.jsx';

// セクションコンポーネント
import BasicInfoSection from './components/BasicInfoSection.jsx';
import WelfareContractSection from './components/WelfareContractSection.jsx';
import RelatedOrgsSection from './components/RelatedOrgsSection.jsx';
import HealthStatusSection from './components/HealthStatusSection.jsx';
import ActivityLogList from './components/ActivityLogList.jsx';
import ActivityLogForm from './components/ActivityLogForm.jsx';
import AttendancePlanner from './components/AttendancePlanner.jsx';

const detailMenu = [
  { id: 'basic', label: '基本情報' },
  { id: 'plan', label: '利用計画' },
  { id: 'activity', label: '活動記録' },
  { id: 'welfareContract', label: '福祉・契約' },
  { id: 'relatedOrgs', label: '関係機関' },
  { id: 'health', label: '心身の状況' },
];

function ClientDetailPage() {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const { saveLog, isSaving: isSavingLog } = useActivityLog();

  const [selectedMenu, setSelectedMenu] = useState('basic');
  const [clientData, setClientData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(null);

  const [openSurveyModal, setOpenSurveyModal] = useState(false);
  const [openScheduleModal, setOpenScheduleModal] = useState(false);
  const [openLogModal, setOpenLogModal] = useState(false);

  const [isEmploymentModalOpen, setIsEmploymentModalOpen] = useState(false);
  const [isLostModalOpen, setIsLostModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

  const surveyUrl = `${window.location.origin}/survey/${clientId}`;

  const fetchClientData = useCallback(async () => {
    if (!clientId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const docRef = doc(db, 'clients', clientId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = { id: docSnap.id, ...docSnap.data() };
        setClientData(data);
        setEditData(data);
      } else {
        console.log("ドキュメントが見つかりませんでした。");
        navigate('/clients');
      }
    } catch (error) {
      console.error("データ取得中にエラーが発生しました:", error);
    } finally {
      setLoading(false);
    }
  }, [clientId, navigate]);

  const { graduateClient, loseClient } = useClientUpdater(fetchClientData);

  useEffect(() => {
    fetchClientData();
  }, [fetchClientData]);

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
    if (!clientId) {
      alert("エラー: クライアントIDが見つかりません。");
      return { success: false };
    }
    const result = await saveLog(clientId, logData);
    if (result && result.success) {
      setOpenLogModal(false);
    } else {
      alert("保存できませんでした: " + (result?.error || "不明なエラー"));
    }
    return result;
  };

  const handleConfirmEmployment = async (data) => {
    await graduateClient(clientId, data);
    setIsEmploymentModalOpen(false);
  };

  const handleConfirmLost = async (reason, details) => {
    await loseClient(clientId, { 
      reason, 
      details, 
      currentStatus: clientData?.status 
    });
    setIsLostModalOpen(false);
  };

  const handleUpdateStatus = async (newStatus) => {
    if (!clientId) return;
    try {
      await updateDoc(doc(db, "clients", clientId), { 
        status: newStatus,
        updatedAt: serverTimestamp()
      });
      setClientData(prev => ({ ...prev, status: newStatus }));
    } catch (error) {
      console.error("ステータス更新エラー:", error);
      alert("更新に失敗しました");
    }
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><CircularProgress /></Box>;
  }

  if (!clientData) {
    return null;
  }

  const currentData = isEditing ? editData : clientData;

  return (
    <>
      <Paper sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)' }}>
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', borderBottom: 1, borderColor: 'divider' }}>
          <IconButton onClick={() => navigate(-1)}><ArrowBackIcon /></IconButton>
          <Typography variant="h6" sx={{ ml: 2, flexGrow: 1 }}>
            {clientData?.name} 
            <Typography component="span" variant="body2" sx={{ ml: 2, color: 'text.secondary' }}>
              ({clientData?.status})
            </Typography>
          </Typography>

          <Stack direction="row" spacing={1}>
            <Button variant="outlined" color="success" startIcon={<CheckCircleIcon />} onClick={() => setIsEmploymentModalOpen(true)}>
              就職卒業
            </Button>
            <Button variant="outlined" color="error" startIcon={<BlockIcon />} onClick={() => setIsLostModalOpen(true)}>
              利用終了
            </Button>
            <Button variant="outlined" startIcon={<PublishedWithChangesIcon />} onClick={() => setIsStatusModalOpen(true)}>
              ステータス変更
            </Button>
            
            <Button variant="contained" color="primary" startIcon={<PostAddIcon />} onClick={() => setOpenLogModal(true)}>
              活動記録を追加
            </Button>
            <Button
              variant="outlined"
              startIcon={<CalendarMonthIcon />}
              onClick={() => setOpenScheduleModal(true)}
            >
              日程管理
            </Button>
            <Button variant="outlined" onClick={() => setOpenSurveyModal(true)}>
              アンケートを依頼
            </Button>
            {!isEditing && <Button variant="contained" startIcon={<EditIcon />} onClick={() => setIsEditing(true)}>編集</Button>}
          </Stack>
        </Box>

        <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
          <Box sx={{ width: 240, borderRight: 1, borderColor: 'divider', flexShrink: 0 }}>
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
          <Box sx={{ flexGrow: 1, p: 3, overflowY: 'auto' }}>
            {selectedMenu === 'basic' && ( <BasicInfoSection isEditing={isEditing} data={currentData} handleChange={handleEditChange} handleSave={handleSave} handleCancelEdit={handleCancelEdit}/> )}
            {selectedMenu === 'plan' && ( <AttendancePlanner clientId={clientId} /> )}
            {selectedMenu === 'activity' && ( <ActivityLogList clientId={clientId} /> )}
            {selectedMenu === 'welfareContract' && ( <WelfareContractSection isEditing={isEditing} data={currentData} handleChange={handleEditChange} handleSave={handleSave} handleCancelEdit={handleCancelEdit}/> )}
            {selectedMenu === 'relatedOrgs' && ( <RelatedOrgsSection isEditing={isEditing} data={currentData} handleChange={handleEditChange} handleSave={handleSave} handleCancelEdit={handleCancelEdit}/> )}
            {selectedMenu === 'health' && ( <HealthStatusSection isEditing={isEditing} data={currentData} handleChange={handleEditChange} handleSave={handleSave} handleCancelEdit={handleCancelEdit}/> )}
          </Box>
        </Box>
      </Paper>

      <SurveyRequestModal open={openSurveyModal} onClose={() => setOpenSurveyModal(false)} surveyUrl={surveyUrl} />
      
      {clientData && (
        <ScheduleModal
          open={openScheduleModal}
          onClose={() => setOpenScheduleModal(false)}
          data={clientData}
          onSave={handleSave}
        />
      )}

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

      <EmploymentInfoModal 
        open={isEmploymentModalOpen} 
        onClose={() => setIsEmploymentModalOpen(false)} 
        onSubmit={handleConfirmEmployment}
      />
      <LostReasonModal 
        open={isLostModalOpen} 
        onClose={() => setIsLostModalOpen(false)} 
        onSubmit={handleConfirmLost} 
      />
      <StatusChangeModal 
        open={isStatusModalOpen} 
        onClose={() => setIsStatusModalOpen(false)} 
        currentStatus={clientData?.status}
        onUpdate={handleUpdateStatus}
      />
    </>
  );
}

export default ClientDetailPage;