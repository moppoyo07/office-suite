// src/features/clients/ClientCard.jsx (import修正済みの最終版)

import { Card, CardContent, Typography, Box, IconButton, Stack, Divider } from '@mui/material'; // ★★★ Dividerをここに追加！ ★★★
import { Link as RouterLink } from 'react-router-dom';
import { format, differenceInMonths } from 'date-fns';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloseIcon from '@mui/icons-material/Close';
import PhoneIcon from '@mui/icons-material/Phone';

// ステータス遷移ロジック
const leadKanbanTransitions = {
  'lead-new':        { prev: null,              next: 'lead-consulting' },
  'lead-consulting': { prev: 'lead-new',        next: 'lead-trial' },
  'lead-trial':      { prev: 'lead-consulting', next: 'contract-prep' },
  'contract-prep':   { prev: 'lead-trial',      next: 'trigger-modal' },
};
const followUpTransitions = {
  'follow-up-m1': { prev: null,           next: 'follow-up-m2' },
  'follow-up-m2': { prev: 'follow-up-m1', next: 'follow-up-m3' },
  'follow-up-m3': { prev: 'follow-up-m2', next: 'follow-up-m4' },
  'follow-up-m4': { prev: 'follow-up-m3', next: 'follow-up-m5' },
  'follow-up-m5': { prev: 'follow-up-m4', next: 'follow-up-m6' },
  'follow-up-m6': { prev: 'follow-up-m5', next: 'completed' },
};

const ClientCard = ({ client, onUpdateStatus, onComplete, onLost, onFollowUp }) => {
  
  const renderCardDetails = () => {
    const inquiryDate = client.inquiryDate?.toDate ? format(client.inquiryDate.toDate(), 'yyyy/MM/dd') : null;
    const consultingDate = client.consultingScheduledDate?.toDate ? format(client.consultingScheduledDate.toDate(), 'yyyy/MM/dd') : null;
    const trialDate = client.trialScheduledDate?.toDate ? format(client.trialScheduledDate.toDate(), 'yyyy/MM/dd') : null;
    const contractDate = client.contractScheduledDate?.toDate ? format(client.contractScheduledDate.toDate(), 'yyyy/MM/dd') : null;
    const startDate = client.serviceStartDate?.toDate ? client.serviceStartDate.toDate() : null;
    let detailText = null;
    switch (true) {
      case client.status === 'lead-new': detailText = inquiryDate ? `問合せ: ${inquiryDate}` : '日付未設定'; break;
      case client.status === 'lead-consulting': detailText = consultingDate ? `相談予定: ${consultingDate}` : '日付未設定'; break;
      case client.status === 'lead-trial': detailText = trialDate ? `体験予定: ${trialDate}` : '日付未設定'; break;
      case client.status === 'contract-prep': detailText = contractDate ? `契約予定: ${contractDate}` : '日付未設定'; break;
      case client.status === 'active_onsite':
      case client.status === 'active_remote':
        if (startDate) { const monthsInUse = differenceInMonths(new Date(), startDate); detailText = `利用 ${monthsInUse + 1} ヶ月目`; } 
        else { detailText = '利用開始日未設定'; }
        break;
      case client.status.startsWith('follow-up-m'):
        detailText = `定着支援 ${client.status.slice(-1)}ヶ月目`;
        break;
      case client.status === 'completed':
        detailText = `定着完了 (${client.followUpCompletionDate?.toDate ? format(client.followUpCompletionDate.toDate(), 'yyyy/MM/dd') : ''})`;
        break;
      default: return null;
    }
    return <Typography variant="body2" color="text.secondary" noWrap>{detailText}</Typography>;
  };

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
        border: 'none',         // ボーダーをなしに
        boxShadow: 'none',      // 影をなしに
        bgcolor: 'rgba(73, 205, 133, 0.8) !important',
        borderColor: 'rgba(100, 116, 139, 0.5)',
        textDecoration: 'none',
        '&:hover': {
        borderColor: 'primary.main',
        }
      }}
    >
      <CardContent sx={{
        // --- ★★★ これがGridレイアウトの完成形 ★★★ ---
        display: 'grid',
        // 左(テキスト)は残り全部、右(アイコン)は自分の中身分だけ
        gridTemplateColumns: '1fr auto', 
        alignItems: 'center',
        gap: 2, // テキストとアイコンの間の隙間
        p: 1.5,
        '&:last-child': { pb: 1.5 },
      }}>

        {/* --- Grid Item 1: 左側のテキストエリア --- */}
        {/* はみ出し防止の魔法をかけたBox */}
        <Box sx={{ minWidth: 0, overflow: 'hidden' }}>
          <Typography variant="subtitle1" noWrap sx={{ fontWeight: 'bold' }} title={client.name}>
            {client.name}
          </Typography>
          {renderCardDetails()}
        </Box>

        {/* --- Grid Item 2: 右側のアイコンエリア (2段組み) --- */}
        {/* あなたのアイデアをここに実装！ */}
        <Stack
          alignItems="flex-end" 
          spacing={0.2}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
        >
          {/* 上の段 */}
          <Stack direction="row" spacing={0.5}>
            <IconButton title="活動記録" size="small" color="primary" onClick={() => onFollowUp(client.id)}> <PhoneIcon fontSize="inherit" /> </IconButton>
            <IconButton title="失注/離脱処理" size="small" color="error" onClick={() => onLost(client.id, client.status)}> <CloseIcon fontSize="inherit" /> </IconButton>
          </Stack>
          
          {/* 下の段 */}
          <Stack direction="row" spacing={0.5}>
            {(isLeadKanban || isFollowUpKanban) && (
              <>
                <IconButton title="前に戻す" size="small" color="inherit" disabled={! (isLeadKanban ? leadKanbanTransitions : followUpTransitions)[client.status]?.prev} onClick={() => handleUpdate('prev')}> <ArrowBackIcon fontSize="inherit" /> </IconButton>
                <IconButton title="次に進む" size="small" color="inherit" disabled={! (isLeadKanban ? leadKanbanTransitions : followUpTransitions)[client.status]?.next} onClick={() => handleUpdate('next')}> <ArrowForwardIcon fontSize="inherit" /> </IconButton>
              </>
            )}
            {onComplete && (
              <IconButton title="定着支援へ移行" size="small" color="success" onClick={() => onComplete(client.id)}> <ArrowForwardIcon fontSize="inherit" /> </IconButton>
            )}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default ClientCard;