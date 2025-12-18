// src/features/clients/ClientCard.jsx

import { Card, CardContent, Typography, Box, IconButton, Stack, Divider } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { format, differenceInMonths } from 'date-fns';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloseIcon from '@mui/icons-material/Close';
import PhoneIcon from '@mui/icons-material/Phone';

// ★★★ 重要：新しい定数をインポート ★★★
import { CLIENT_STATUS } from '@/constants/clientStatus';

// ★★★ 修正1：ステータス遷移ロジックを新しいIDで定義 ★★★
const leadKanbanTransitions = {
  [CLIENT_STATUS.INQUIRY]:      { prev: null,                    next: CLIENT_STATUS.INTERVIEW },
  [CLIENT_STATUS.INTERVIEW]:    { prev: CLIENT_STATUS.INQUIRY,   next: CLIENT_STATUS.TRIAL },
  [CLIENT_STATUS.TRIAL]:        { prev: CLIENT_STATUS.INTERVIEW, next: CLIENT_STATUS.PRE_CONTRACT },
  [CLIENT_STATUS.PRE_CONTRACT]: { prev: CLIENT_STATUS.TRIAL,     next: 'trigger-modal' },
};

// ※フォローアップ（定着支援）のIDが変更されていない前提であればこのままですが、
// もし変更されている場合はここも修正が必要です。一旦既存のまま残します。
const followUpTransitions = {
  'follow-up-m1': { prev: null,           next: 'follow-up-m2' },
  'follow-up-m2': { prev: 'follow-up-m1', next: 'follow-up-m3' },
  'follow-up-m3': { prev: 'follow-up-m2', next: 'follow-up-m4' },
  'follow-up-m4': { prev: 'follow-up-m3', next: 'follow-up-m5' },
  'follow-up-m5': { prev: 'follow-up-m4', next: 'follow-up-m6' },
  'follow-up-m6': { prev: 'follow-up-m5', next: CLIENT_STATUS.COMPLETED }, // ここだけ定数があれば使用
};

const ClientCard = ({ client, onUpdateStatus, onComplete, onLost, onFollowUp }) => {
  
  const renderCardDetails = () => {
    const inquiryDate = client.inquiryDate?.toDate ? format(client.inquiryDate.toDate(), 'yyyy/MM/dd') : null;
    const consultingDate = client.consultingScheduledDate?.toDate ? format(client.consultingScheduledDate.toDate(), 'yyyy/MM/dd') : null;
    const trialDate = client.trialScheduledDate?.toDate ? format(client.trialScheduledDate.toDate(), 'yyyy/MM/dd') : null;
    const contractDate = client.contractScheduledDate?.toDate ? format(client.contractScheduledDate.toDate(), 'yyyy/MM/dd') : null;
    const startDate = client.serviceStartDate?.toDate ? client.serviceStartDate.toDate() : null;
    
    let detailText = null;

    // ★★★ 修正2：表示条件も新しいID（定数）に変更 ★★★
    switch (true) {
      case client.status === CLIENT_STATUS.INQUIRY: 
        detailText = inquiryDate ? `問合せ: ${inquiryDate}` : '日付未設定'; break;
      case client.status === CLIENT_STATUS.INTERVIEW: 
        detailText = consultingDate ? `相談予定: ${consultingDate}` : '日付未設定'; break;
      case client.status === CLIENT_STATUS.TRIAL: 
        detailText = trialDate ? `体験予定: ${trialDate}` : '日付未設定'; break;
      case client.status === CLIENT_STATUS.PRE_CONTRACT: 
        detailText = contractDate ? `契約予定: ${contractDate}` : '日付未設定'; break;
      
      case client.status === CLIENT_STATUS.ACTIVE_ONSITE:
      case client.status === CLIENT_STATUS.ACTIVE_REMOTE:
        if (startDate) { 
          const monthsInUse = differenceInMonths(new Date(), startDate); 
          detailText = `利用 ${monthsInUse + 1} ヶ月目`; 
        } else { 
          detailText = '利用開始日未設定'; 
        }
        break;
        
      case client.status.startsWith('follow-up-m'):
        detailText = `定着支援 ${client.status.slice(-1)}ヶ月目`;
        break;
      case client.status === CLIENT_STATUS.COMPLETED:
        detailText = `定着完了 (${client.followUpCompletionDate?.toDate ? format(client.followUpCompletionDate.toDate(), 'yyyy/MM/dd') : ''})`;
        break;
      default: return null;
    }
    return <Typography variant="body2" color="text.secondary" noWrap>{detailText}</Typography>;
  };

  // ★ここがポイント：client.status が "inquiry" なので、
  // leadKanbanTransitions[CLIENT_STATUS.INQUIRY] がヒットするようになります。
  const isLeadKanban = client.status in leadKanbanTransitions;
  const isFollowUpKanban = client.status.startsWith('follow-up-');

  const handleUpdate = (direction) => {
    const transitions = isLeadKanban ? leadKanbanTransitions : followUpTransitions;
    const newStatus = transitions[client.status]?.[direction];
    if (newStatus && onUpdateStatus) {
      onUpdateStatus(client.id, newStatus);
    }
  };

  return (
    <Card
      component={RouterLink}
      to={`/clients/${client.id}`}
      variant="outlined"
      sx={{
        backgroundColor: 'rgba(161, 193, 109, 0.8)',
        mb: 1.5,
        border: 'none',         
        boxShadow: 'none',      
        bgcolor: 'rgba(73, 205, 133, 0.8) !important',
        borderColor: 'rgba(100, 116, 139, 0.5)',
        textDecoration: 'none',
        '&:hover': {
          borderColor: 'primary.main',
        }
      }}
    >
      <CardContent sx={{
        display: 'grid',
        gridTemplateColumns: '1fr auto', 
        alignItems: 'center',
        gap: 2,
        p: 1.5,
        '&:last-child': { pb: 1.5 },
      }}>

        {/* --- 左側のテキストエリア --- */}
        <Box sx={{ minWidth: 0, overflow: 'hidden' }}>
          <Typography variant="subtitle1" noWrap sx={{ fontWeight: 'bold' }} title={client.name}>
            {client.name}
          </Typography>
          {renderCardDetails()}
        </Box>

        {/* --- 右側のアイコンエリア --- */}
        <Stack
          alignItems="flex-end" 
          spacing={0.2}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
        >
          {/* 上の段 */}
          <Stack direction="row" spacing={0.5}>
            <IconButton title="活動記録" size="small" color="primary" onClick={() => onFollowUp(client.id)}> 
              <PhoneIcon fontSize="inherit" /> 
            </IconButton>
            <IconButton title="失注/離脱処理" size="small" color="error" onClick={() => onLost(client.id, client.status)}> 
              <CloseIcon fontSize="inherit" /> 
            </IconButton>
          </Stack>
          
          {/* 下の段（矢印ボタン） */}
          <Stack direction="row" spacing={0.5}>
            {(isLeadKanban || isFollowUpKanban) && (
              <>
                {/* 前に戻る */}
                <IconButton 
                  title="前に戻す" 
                  size="small" 
                  color="inherit" 
                  disabled={! (isLeadKanban ? leadKanbanTransitions : followUpTransitions)[client.status]?.prev} 
                  onClick={() => handleUpdate('prev')}
                  // ボタンが無効なときは非表示にしたい場合は以下をコメント解除
                  // sx={{ visibility: (isLeadKanban ? leadKanbanTransitions : followUpTransitions)[client.status]?.prev ? 'visible' : 'hidden' }}
                > 
                  <ArrowBackIcon fontSize="inherit" /> 
                </IconButton>
                
                {/* 次に進む */}
                <IconButton 
                  title="次に進む" 
                  size="small" 
                  color="inherit" 
                  disabled={! (isLeadKanban ? leadKanbanTransitions : followUpTransitions)[client.status]?.next} 
                  onClick={() => handleUpdate('next')}
                  // sx={{ visibility: (isLeadKanban ? leadKanbanTransitions : followUpTransitions)[client.status]?.next ? 'visible' : 'hidden' }}
                > 
                  <ArrowForwardIcon fontSize="inherit" /> 
                </IconButton>
              </>
            )}
            {onComplete && (
              <IconButton title="定着支援へ移行" size="small" color="success" onClick={() => onComplete(client.id)}> 
                <ArrowForwardIcon fontSize="inherit" /> 
              </IconButton>
            )}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default ClientCard;