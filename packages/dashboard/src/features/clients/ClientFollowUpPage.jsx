// src/features/clients/ClientFollowUpPage.jsx
import { Typography, Paper, Box, CircularProgress, Divider } from '@mui/material';
import { useFollowUpClients } from './useFollowUpClients';

// コンポーネントのインポート
import ClientCard from './ClientCard.jsx';
import LostReasonModal from './components/LostReasonModal.jsx';
import CompletionModal from './components/CompletionModal.jsx';
import RetentionReportModal from './components/RetentionReportModal.jsx';

function ClientFollowUpPage() {
  // フックからデータと関数を受け取る
  const {
    loading,
    kanbanColumns,
    categorizedClients,
    handleUpdateStatus,
    handleComplete,
    handleOpenLostModal,
    handleOpenRetentionNoteModal,
    modals,
  } = useFollowUpClients();

  // → 矢印押下時: カード全体を渡してモーダルを開く
  const handleOpenRetentionNote = (clientId) => {
    const allClients = Object.values(categorizedClients).flat();
    const client = allClients.find(c => c.id === clientId);
    if (client) handleOpenRetentionNoteModal(client);
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><CircularProgress /></Box>;
  }

  return (
    <>
      <Box sx={{
        display: 'flex',
        gap: 2,
        px: 1,
        //overflowX: '80%', // 横スクロールを有効に
        minHeight: '70vh', // 適度な高さ
        pb: 0, // 下部にパディング
        flexGrow: 0, // 親(司令塔)の高さめいっぱいに広がる
        p: '1px', // スクロールバーのチラつき防止用
      }}>
        {kanbanColumns.map(column => (
          <Box key={column.id} sx={{
            flex: 1,
            minWidth: 255, // カラムの幅を確保
            display: 'flex',
            flexDirection: 'column'

          }}>
            <Paper sx={{
              width: 'auto',
              display: 'flex',
              flexDirection: 'column',
              flexGrow: 1,
              overflow: 'hidden',
              p: 1,
              backgroundColor: 'transparent', // スタイルはClientKanbanPageを踏襲
              border: '1px solid #06b6d4',
              boxShadow: '0 0 4px #06b6d4',
              borderRadius: '8px',
            }}>

              <Box sx={{ flexShrink: 0 }}>
                <Typography variant="h6" sx={{ textAlign: 'center' }}>
                  {column.title} ({(categorizedClients[column.id] || []).length})
                </Typography>
                <Divider sx={{ my: 1, borderColor: 'rgba(6, 182, 212, 0.3)' }} />
              </Box>

              <Box sx={{
                flexGrow: 1,
                overflowY: 'auto',
                pr: 1,
                mr: -1,
                // スクロールバーのスタイル (必要なら)
                '&::-webkit-scrollbar': { width: '6px' },
                '&::-webkit-scrollbar-thumb': { backgroundColor: 'rgba(6, 182, 212, 0.5)', borderRadius: '3px' },
              }}>
                {(categorizedClients[column.id] || []).map(client => {

                  // ★重要★
                  // 5ヶ月目 (follow-up-m5) のカードの「→」は、ステータス更新ではなく
                  // 「完了モーダルを開く (onComplete)」に割り当てる必要がある。

                  // ClientCardの設計上、onUpdateStatus='next' が呼ばれると自動的にm6に行こうとする。
                  // m5の場合は特別な処理が必要。

                  // ここで少しロジックが入りますが、ClientCardの今の仕様だとこうするのが確実です。
                  const isLastMonth = client.status === 'follow-up-m5';

                  return (
                    <ClientCard
                      key={client.id}
                      client={client}


                      // 1~4ヶ月目: 普通に次の月に移動
                      // 5ヶ月目: onUpdateStatusは渡さず、onCompleteを渡す？
                      // ClientCardの実装を見ると、onUpdateStatusで遷移、onCompleteは別ボタン。
                      // 要件「5か月目の→矢印はモーダルが出てきて」を実現するには工夫が必要。

                      // 【解決策】
                      // ClientCardの handleUpdate('next') の挙動は変えられない。
                      // 5ヶ月目の時だけ、onUpdateStatus に「完了モーダルを開く関数」を偽装して渡す。
                      onUpdateStatus={(id, newStatus) => {


                        // 5ヶ月目(isLastMonth) かつ、進む矢印が押された (newStatusが'follow-up-m6') 場合のみ
                        // 完了モーダルを開く
                        if (isLastMonth && newStatus === 'follow-up-m6') {
                          handleComplete(id);
                        } else {
                          // それ以外（1～4ヶ月目の移動 or 5ヶ月目の戻るボタン）は
                          // 通常のステータス更新処理を呼ぶ
                          handleUpdateStatus(id, newStatus);
                        }
                      }}

                      onLost={handleOpenLostModal}
                      onFollowUp={() => { }} // No-op
                      onRetentionNote={handleOpenRetentionNote}
                      disableHoverEffect={true}
                    />
                  );
                })}
              </Box>
            </Paper>
          </Box>
        ))}
      </Box>

      {/* --- モーダル群 --- */}
      <LostReasonModal
        open={modals.lost.isOpen}
        onClose={modals.lost.onClose}
        onSubmit={modals.lost.onSubmit}
        title="退職情報の入力"
      />
      <CompletionModal
        open={modals.completion.isOpen}
        onClose={modals.completion.onClose}
        onSubmit={modals.completion.onSubmit}
      />
      <RetentionReportModal
        open={modals.retentionNote.isOpen}
        onClose={modals.retentionNote.onClose}
        onSubmit={modals.retentionNote.onSubmit}
        client={modals.retentionNote.target}
      />
    </>
  );
}

export default ClientFollowUpPage;