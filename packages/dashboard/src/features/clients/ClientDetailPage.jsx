import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, serverTimestamp, collection, addDoc } from "firebase/firestore";
import { db } from "@/firebase/index.js";
import { useAuth } from '../auth/context/AuthContext.jsx';
import {
  Paper, Typography, Box, List, ListItem, ListItemButton, ListItemText,
  IconButton, Button, CircularProgress, Stack, Dialog, DialogTitle, DialogContent
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import PostAddIcon from '@mui/icons-material/PostAdd';

// モーダルコンポーネント
import SurveyRequestModal from "./components/SurveyRequestModal";
import ScheduleModal from "./components/ScheduleModal";

// 各セクションのコンポーネント
import BasicInfoSection from './components/BasicInfoSection.jsx';
import WelfareContractSection from './components/WelfareContractSection.jsx';
import RelatedOrgsSection from './components/RelatedOrgsSection.jsx';
import HealthStatusSection from './components/HealthStatusSection.jsx';
import ActivityLogList from './components/ActivityLogList.jsx';
import ActivityLogForm from './components/ActivityLogForm.jsx';

const detailMenu = [
  { id: 'basic', label: '基本情報' },
  { id: 'activity', label: '活動記録' },
  { id: 'welfareContract', label: '福祉・契約' },
  { id: 'relatedOrgs', label: '関係機関' },
  { id: 'health', label: '心身の状況' },
];

function ClientDetailPage() {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // --- Stateの定義 ---
  const [selectedMenu, setSelectedMenu] = useState('basic');
  const [clientData, setClientData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(null);

  const [openSurveyModal, setOpenSurveyModal] = useState(false);
  const [openScheduleModal, setOpenScheduleModal] = useState(false);
  const [openLogModal, setOpenLogModal] = useState(false);

  const surveyUrl = `${window.location.origin}/survey/${clientId}`;

  // --- データ取得 ---
  useEffect(() => {
    if (!clientId) {
      setLoading(false);
      return;
    }

    const fetchClientData = async () => {
      setLoading(true);
      try {
        console.log('データの取得を開始します。ID:', clientId);
        const docRef = doc(db, 'clients', clientId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = { id: docSnap.id, ...docSnap.data() };
          console.log('データが見つかりました:', data);
          setClientData(data);
          setEditData(data); // 編集用のデータも初期化
        } else {
          console.log("ドキュメントが見つかりませんでした。");
          navigate('/clients'); // データがない場合は一覧に戻す
        }
      } catch (error) {
        console.error("データ取得中にエラーが発生しました:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchClientData();
  }, [clientId, navigate]);

  // --- 編集・保存・キャンセル処理 ---
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (dataToSave = editData) => {
    try {
      const docRef = doc(db, "clients", clientId);
      await updateDoc(docRef, { ...dataToSave, updatedAt: serverTimestamp() });
      setClientData(dataToSave); // 画面表示を即時更新
      setIsEditing(false);
    } catch (error) {
      console.error("更新エラー:", error);
    }
  };
  
  const handleCancelEdit = () => {
    setEditData(clientData); // 変更を元に戻す
    setIsEditing(false);
  };

  // --- 活動記録を保存する関数 ---
  const handleSaveLog = async (logData) => {
    if (!clientId || !currentUser) {
      alert("エラー: ログイン情報が見つかりません。");
      return;
    }
    try {
      const logsRef = collection(db, 'clients', clientId, 'activity_logs');
      await addDoc(logsRef, {
        ...logData,
        createdAt: serverTimestamp(),
        staffUid: currentUser.uid,
        staffName: currentUser.staffName || currentUser.displayName, // staffNameがなければdisplayNameを使う
      });
      setOpenLogModal(false);
    } catch (error) {
      console.error("活動記録の保存に失敗:", error);
      alert("エラーが発生しました。記録を保存できませんでした。");
    }
  };

  // --- レンダリング前のチェック ---
  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><CircularProgress /></Box>;
  }

  // データがない場合は何も表示しない（useEffectでリダイレクトされるはず）
  if (!clientData) {
    return null;
  }

  const currentData = isEditing ? editData : clientData;

  // --- JSXの返却 ---
  return (
    <>
      <Paper sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)' }}>
        {/* ヘッダー部分 */}
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', borderBottom: 1, borderColor: 'divider' }}>
          <IconButton onClick={() => navigate(-1)}><ArrowBackIcon /></IconButton>
          <Typography variant="h6" sx={{ ml: 2, flexGrow: 1 }}>{clientData?.name}</Typography>

          <Stack direction="row" spacing={1}>
            <Button variant="contained" color="primary" startIcon={<PostAddIcon />} onClick={() => setOpenLogModal(true)}>
              活動記録を追加
            </Button>
            <Button
              variant="outlined"
              startIcon={<CalendarMonthIcon />}
              onClick={() => {
                console.log('日程管理ボタンがクリックされました！');
                setOpenScheduleModal(true);
              }}
            >
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
          {/* 右コンテンツエリア */}
          <Box sx={{ flexGrow: 1, p: 3, overflowY: 'auto' }}>
            {selectedMenu === 'basic' && ( <BasicInfoSection isEditing={isEditing} data={currentData} handleChange={handleEditChange} handleSave={handleSave} handleCancelEdit={handleCancelEdit}/> )}
            {selectedMenu === 'activity' && ( <ActivityLogList clientId={clientId} /> )}
            {selectedMenu === 'welfareContract' && ( <WelfareContractSection isEditing={isEditing} data={currentData} handleChange={handleEditChange} handleSave={handleSave} handleCancelEdit={handleCancelEdit}/> )}
            {selectedMenu === 'relatedOrgs' && ( <RelatedOrgsSection isEditing={isEditing} data={currentData} handleChange={handleEditChange} handleSave={handleSave} handleCancelEdit={handleCancelEdit}/> )}
            {selectedMenu === 'health' && ( <HealthStatusSection isEditing={isEditing} data={currentData} handleChange={handleEditChange} handleSave={handleSave} handleCancelEdit={handleCancelEdit}/> )}
          </Box>
        </Box>
      </Paper>

      {/* モーダル呼び出しエリア */}
      <SurveyRequestModal open={openSurveyModal} onClose={() => setOpenSurveyModal(false)} surveyUrl={surveyUrl} />
      
      {/* ScheduleModalはclientDataが存在する場合のみレンダリング */}
      {clientData && (
        <ScheduleModal
          open={openScheduleModal}
          onClose={() => setOpenScheduleModal(false)}
          data={clientData}
          onSave={handleSave}
        />
      )}

      {/* 活動記録追加用モーダル */}
      <Dialog open={openLogModal} onClose={() => setOpenLogModal(false)} fullWidth maxWidth="sm">
        <DialogTitle>活動記録の追加</DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
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