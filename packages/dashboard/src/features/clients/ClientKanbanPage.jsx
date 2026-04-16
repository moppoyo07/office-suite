// src/features/clients/ClientKanbanPage.jsx (ロジック分離後のスリム版)

import { Typography, Paper, Box, CircularProgress, Divider } from '@mui/material';
import { useKanbanClients } from './useKanbanClients'; // ★ 作成したカスタムフックをインポート

// 見た目に関わるコンポーネントだけをインポート
import ClientCard from './ClientCard.jsx';
import LostReasonModal from './components/LostReasonModal.jsx';
import SelectClientTypeModal from './components/SelectClientTypeModal.jsx';
import StageTransitionModal from './components/StageTransitionModal.jsx';

// このコンポーネントは「見た目」に専念する！
function ClientKanbanPage() {
  // ★ たった一行で、必要なデータと関数をすべて受け取る！
  const {
    loading,
    kanbanColumns,
    categorizedClients,
    totalInquiriesThisMonth, // ★ 今月の総問合せ数
    handleUpdateStatus,
    handleOpenLostModal,
    modals,
  } = useKanbanClients();

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><CircularProgress /></Box>;
  }

  // 今月のラベルを作成
  const now = new Date();
  const monthLabel = `${now.getFullYear()}年${now.getMonth() + 1}月`;

  return (
    <>
      {/* ヘッダー: 今月の総問合せ数 */}
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        mb: 2,
        px: 1,
      }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#fff' }}>
          新規獲得ボード
        </Typography>
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          bgcolor: 'rgba(6, 182, 212, 0.1)',
          border: '1px solid rgba(6, 182, 212, 0.3)',
          borderRadius: 2,
          px: 2,
          py: 0.5,
        }}>
          <Typography variant="body2" sx={{ color: '#94a3b8' }}>
            {monthLabel} 総問合せ:
          </Typography>
          <Typography variant="h6" sx={{ color: '#06b6d4', fontWeight: 'bold' }}>
            {totalInquiriesThisMonth}
            <span style={{ fontSize: '0.75rem', marginLeft: 4, color: '#94a3b8', fontWeight: 'normal' }}>件</span>
          </Typography>
        </Box>
      </Box>

      <Box sx={{
        display: 'flex',
        gap: 2,
        px: 0,
        width: '100%',
        height: 'calc(100% - 60px)', // ヘッダー分を引く
        overflowX: 'auto',
        overflowY: 'hidden',
        pb: 1,
        alignItems: 'stretch'
      }}>
        {kanbanColumns.map(column => {
          return (
            <Box key={column.id} sx={{
              flex: '1 0 320px', // ★変更: 画面幅に合わせて伸びるように変更。ベースも広く(320px)
              maxWidth: '400px', // 広がりすぎ防止（オプション）
              display: 'flex',
              flexDirection: 'column',
              height: '100%' // 高さを親に合わせる
            }}>
              {/* --- 利用者リスト (スクロール領域) --- */}
              <Paper sx={{
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                flexGrow: 1,
                minHeight: 0,
                p: 0,
                backgroundColor: 'transparent',
                border: '1px solid #06b6d4',
                boxShadow: '0 0 4px #06b6d4',
                borderRadius: '8px',
              }}>

                <Box sx={{ flexShrink: 0, p: 2, pb: 1, borderBottom: '1px solid rgba(6, 182, 212, 0.3)' }}>
                  <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 'bold' }}>
                    {column.title} <span style={{ fontSize: '0.85rem', color: 'grey' }}>({(categorizedClients[column.id] || []).length})</span>
                  </Typography>
                </Box>

                <Box sx={{
                  flexGrow: 1,
                  overflowY: 'auto',
                  p: 1,
                }}>
                  {(categorizedClients[column.id] || []).map(client => (
                    <ClientCard
                      key={client.id}
                      client={client}
                      onUpdateStatus={handleUpdateStatus}
                      onLost={handleOpenLostModal}
                      onFollowUp={() => { }} // No-op placeholder
                      disableHoverEffect={true}
                    />
                  ))}
                </Box>
              </Paper>

            </Box>
          );
        })}
      </Box>

      {/* --- モーダル群もスッキリ！ --- */}
      <LostReasonModal open={modals.lost.isOpen} onClose={modals.lost.onClose} onSubmit={modals.lost.onSubmit} />
      <SelectClientTypeModal open={modals.selectType.isOpen} onClose={modals.selectType.onClose} onConfirm={modals.selectType.onSubmit} clientId={modals.selectType.targetId} />
      <StageTransitionModal
        open={modals.transition.isOpen}
        fromLabel={modals.transition.fromLabel}
        toLabel={modals.transition.toLabel}
        dateLabel={modals.transition.dateLabel}
        onConfirm={modals.transition.onConfirm}
        onCancel={modals.transition.onCancel}
      />

    </>
  );
}

export default ClientKanbanPage;