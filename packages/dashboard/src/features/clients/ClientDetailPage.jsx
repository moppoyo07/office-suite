// src/features/clients/ClientDetailPage.jsx (改造後・コピペ用)

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Paper, Typography, Box, List, ListItem, ListItemButton, ListItemText, IconButton, Button, CircularProgress, Dialog, DialogTitle, DialogContent, Stack } from '@mui/material'; // ★ 変更点: Dialog関連とStackを追加
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import PostAddIcon from '@mui/icons-material/PostAdd'; // ★ 変更点: 新しいアイコン
import { getDoc, updateDoc, serverTimestamp, collection, addDoc } from "firebase/firestore"; // ★ 変更点: collection, addDoc を追加
import { db } from "@/firebase/index.js";
import { useAuth } from '../auth/context/AuthContext.jsx'; // ★ 変更点: ログインユーザー情報を取得

// モーダルコンポーネント
import SurveyRequestModal from "./components/SurveyRequestModal";
import ScheduleModal from "./components/ScheduleModal";

// 各セクションのコンポーネント
import BasicInfoSection from './components/BasicInfoSection.jsx';
import WelfareContractSection from './components/WelfareContractSection.jsx';
import RelatedOrgsSection from './components/RelatedOrgsSection.jsx';
import HealthStatusSection from './components/HealthStatusSection.jsx';
import ActivityLogList from './components/ActivityLogList.jsx';   // ★ 変更点: 新しいコンポーネント
import ActivityLogForm from './components/ActivityLogForm.jsx';   // ★ 変更点: 新しいコンポーネント

// ★ 変更点: メニューに「活動記録」を追加
const detailMenu = [ 
  { id: 'basic', label: '基本情報' },
  { id: 'activity', label: '活動記録' }, // ★ ここ！
  { id: 'welfareContract', label: '福祉・契約' },
  { id: 'relatedOrgs', label: '関係機関' },
  { id: 'health', label: '心身の状況' },
];

function ClientDetailPage() {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth(); // ★ 変更点: ログインユーザー情報を取得

  // --- Stateの定義 ---
  const [selectedMenu, setSelectedMenu] = useState('basic');
  const [clientData, setClientData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(null);
  
  const [openSurveyModal, setOpenSurveyModal] = useState(false);
  const [openScheduleModal, setOpenScheduleModal] = useState(false);
  const [openLogModal, setOpenLogModal] = useState(false); // ★ 変更点: 活動記録モーダルのstate

  const surveyUrl = `${window.location.origin}/survey/${clientId}`;

  // --- データ取得 (変更なし) ---
  useEffect(() => { /* ... 既存のコードのまま ... */ }, [clientId, navigate]);
  
  // --- 編集・保存・キャンセル処理 (変更なし) ---
  const handleEditChange = (e) => { /* ... 既存のコードのまま ... */ };
  const handleSave = async (dataToSave = editData) => { /* ... 既存のコードのまま ... */ };
  const handleCancelEdit = () => { /* ... 既存のコードのまま ... */ };

  // ★ 変更点: 活動記録を保存する新しい関数
  const handleSaveLog = async (logData) => {
    if (!clientId || !currentUser) {
      alert("エラー: ログイン情報が見つかりません。");
      return;
    }
    try {
      const logsRef = collection(db, 'clients', clientId, 'activity_logs');
      await addDoc(logsRef, {
        ...logData, // { type, content }
        createdAt: serverTimestamp(),
        staffUid: currentUser.uid,
        staffName: currentUser.staffName,
      });
      setOpenLogModal(false); // モーダルを閉じる
    } catch (error) {
      console.error("活動記録の保存に失敗:", error);
      alert("エラーが発生しました。記録を保存できませんでした。");
    }
  };

  // --- レンダリング前のチェック (変更なし) ---
  if (loading) { /* ... 既存のコードのまま ... */ }
  if (!clientData) { /* ... 既存のコードのまま ... */ }

  const currentData = isEditing ? editData : clientData;

  // --- JSXの返却 ---
  return (
    <>
      <Paper sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)' }}>
        {/* ヘッダー部分 */}
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', borderBottom: 1, borderColor: 'divider' }}>
          <IconButton onClick={() => navigate('/clients')}><ArrowBackIcon /></IconButton>
          <Typography variant="h6" sx={{ ml: 2, flexGrow: 1 }}>{clientData?.name}</Typography>
          
          <Stack direction="row" spacing={1}> {/* ★ 変更点: ボタンをStackで囲む */}
            <Button variant="contained" color="primary" startIcon={<PostAddIcon />} onClick={() => setOpenLogModal(true)}>
              活動記録を追加
            </Button>
            <Button variant="outlined" startIcon={<CalendarMonthIcon />} onClick={() => setOpenScheduleModal(true)}>
              日程管理
            </Button>
            <Button variant="outlined" onClick={() => setOpenSurveyModal(true)}>
              アンケートを依頼
            </Button>
            {!isEditing && <Button variant="contained" startIcon={<EditIcon />} onClick={() => setIsEditing(true)}>編集</Button>}
          </Stack>
        </Box>

        {/* メインコンテンツ部分 */}
        <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
          {/* 左メニュー */}
          <Box sx={{ width: 240, borderRight: 1, borderColor: 'divider', flexShrink: 0 }}> {/* ★ 変更点: 少し幅を広げる */}
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
          {/* 右コンテンツエリア */}
          <Box sx={{ flexGrow: 1, p: 3, overflowY: 'auto' }}>
            {selectedMenu === 'basic' && ( <BasicInfoSection isEditing={isEditing} data={currentData} handleChange={handleEditChange} handleSave={handleSave} handleCancelEdit={handleCancelEdit}/> )}
            
            {/* ★ 変更点: 活動記録の表示エリア */}
            {selectedMenu === 'activity' && ( <ActivityLogList clientId={clientId} /> )}

            {selectedMenu === 'welfareContract' && ( <WelfareContractSection isEditing={isEditing} data={currentData} handleChange={handleEditChange} handleSave={handleSave} handleCancelEdit={handleCancelEdit}/> )}
            {selectedMenu === 'relatedOrgs' && ( <RelatedOrgsSection isEditing={isEditing} data={currentData} handleChange={handleEditChange} handleSave={handleSave} handleCancelEdit={handleCancelEdit}/> )}
            {selectedMenu === 'health' && ( <HealthStatusSection isEditing={isEditing} data={currentData} handleChange={handleEditChange} handleSave={handleSave} handleCancelEdit={handleCancelEdit}/> )}
          </Box>
        </Box>
      </Paper>

      {/* モーダル呼び出しエリア */}
      <SurveyRequestModal open={openSurveyModal} onClose={() => setOpenSurveyModal(false)} surveyUrl={surveyUrl} />
      {clientData && ( <ScheduleModal open={openScheduleModal} onClose={() => setOpenScheduleModal(false)} data={clientData} onSave={handleSave} /> )}

      {/* ★ 変更点: 活動記録追加用モーダル */}
      <Dialog open={openLogModal} onClose={() => setOpenLogModal(false)} fullWidth maxWidth="sm">
        <DialogTitle>活動記録の追加</DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}> {/* MUI v5の버그回避 */}
          <ActivityLogForm 
            onSubmit={handleSaveLog} 
            onCancel={() => setOpenLogModal(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

export default ClientDetailPage;