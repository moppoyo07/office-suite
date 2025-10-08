// src/features/clients/ClientKanbanPage.jsx (ロジック分離後のスリム版)

import { Typography, Paper, Box, CircularProgress, Divider } from '@mui/material';
import { useKanbanClients } from './useKanbanClients'; // ★ 作成したカスタムフックをインポート

// 見た目に関わるコンポーネントだけをインポート
import ClientCard from './ClientCard.jsx';
import LostReasonModal from './components/LostReasonModal.jsx';
import SelectClientTypeModal from './components/SelectClientTypeModal.jsx';
import FollowUpModal from './components/FollowUpModal.jsx';

// このコンポーネントは「見た目」に専念する！
function ClientKanbanPage() {
  // ★ たった一行で、必要なデータと関数をすべて受け取る！
  const {
    loading,
    kanbanColumns,
    categorizedClients,
    handleUpdateStatus,
    handleOpenLostModal,
    handleOpenFollowUpModal,
    modals,
  } = useKanbanClients();
  
  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><CircularProgress /></Box>;
  }

  return (
    <>
      <Box sx={{ 
        display: 'flex', 
        gap: 2,
        px: 0, 
        }}>
        {kanbanColumns.map(column => (
          <Box key={column.id} sx={{ 
            flex: 1, 
            minWidth: 250,
            display: 'flex', 
            flexDirection: 'column' 
            }}>
            <Paper sx={{
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              flexGrow: 1,
              overflow: 'hidden',
              p: 2,
              backgroundColor: 'transparent',
              //backdropFilter: 'blur(4px)',
              border: '1px solid #06b6d4',
              boxShadow: '0 0 4px #06b6d4',
              borderRadius: '8px',
            }}>
              
              <Box sx={{ flexShrink: 0 }}>
                <Typography variant="h6">
                  {column.title} ({(categorizedClients[column.id] || []).length})
                </Typography>
                <Divider sx={{ my: 1, borderColor: 'rgba(6, 182, 212, 0.3)' }}/>
              </Box>

              <Box sx={{ 
                flexGrow: 1, 
                overflowY: 'auto', 
                pr: 1, 
                mr: -1 
                }}>
                {(categorizedClients[column.id] || []).map(client => (
                  <ClientCard 
                    key={client.id} 
                    client={client} 
                    onUpdateStatus={handleUpdateStatus}
                    onLost={handleOpenLostModal}
                    onFollowUp={handleOpenFollowUpModal}
                    disableHoverEffect={true} 
                  />
                ))}
              </Box>
            </Paper>
          </Box>
        ))}
      </Box>

      {/* --- モーダル群もスッキリ！ --- */}
      <LostReasonModal open={modals.lost.isOpen} onClose={modals.lost.onClose} onSubmit={modals.lost.onSubmit} />
      <SelectClientTypeModal open={modals.selectType.isOpen} onClose={modals.selectType.onClose} onConfirm={modals.selectType.onSubmit} clientId={modals.selectType.targetId} />
      <FollowUpModal open={modals.followUp.isOpen} onClose={modals.followUp.onClose} onSubmit={modals.followUp.onSubmit} clientId={modals.followUp.targetId} />
    </>
  );
}

export default ClientKanbanPage;