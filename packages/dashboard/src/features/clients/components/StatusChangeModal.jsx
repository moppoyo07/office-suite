// src/features/clients/pages/components/StatusChangeModal.jsx

import { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, FormControl, InputLabel, Select, MenuItem, Typography, Box } from '@mui/material';
import { CLIENT_STATUS, STATUS_CONFIG } from '@/constants/clientStatus';

const StatusChangeModal = ({ open, onClose, currentStatus, onUpdate }) => {
  const [newStatus, setNewStatus] = useState(currentStatus || '');

  const handleUpdate = () => {
    onUpdate(newStatus);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>ステータス変更</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          <Typography variant="body2" gutterBottom>
            現在のステータス: <strong>{STATUS_CONFIG[currentStatus]?.label || currentStatus}</strong>
          </Typography>
          
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel id="status-select-label">新しいステータス</InputLabel>
            <Select
              labelId="status-select-label"
              value={newStatus}
              label="新しいステータス"
              onChange={(e) => setNewStatus(e.target.value)}
            >
              {/* 辞書を使って日本語の選択肢を生成 */}
              {Object.values(CLIENT_STATUS).map((statusKey) => (
                <MenuItem key={statusKey} value={statusKey}>
                  {STATUS_CONFIG[statusKey]?.label || statusKey}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>キャンセル</Button>
        <Button onClick={handleUpdate} variant="contained" color="primary">
          変更する
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default StatusChangeModal;