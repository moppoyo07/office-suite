// 利用開始モーダル（利用形態 + 利用開始日 必須入力）
import { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, RadioGroup, FormControlLabel, Radio, FormControl,
  TextField, Stack, Typography
} from '@mui/material';
import PropTypes from 'prop-types';

function SelectClientTypeModal({ open, onClose, onConfirm, clientId }) {
  const [selectedValue, setSelectedValue] = useState('onsite');
  const [serviceStartDate, setServiceStartDate] = useState('');

  // ダイアログが開くたびにリセット
  useEffect(() => {
    if (open) {
      setSelectedValue('onsite');
      setServiceStartDate('');
    }
  }, [open]);

  const handleConfirm = () => {
    if (clientId && serviceStartDate) {
      onConfirm(clientId, selectedValue, serviceStartDate);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>利用開始の確認</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          <TextField
            label="利用開始日"
            type="date"
            value={serviceStartDate}
            onChange={e => setServiceStartDate(e.target.value)}
            fullWidth
            required
            InputLabelProps={{ shrink: true }}
            autoFocus
          />
          <FormControl component="fieldset">
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
              利用形態
            </Typography>
            <RadioGroup
              value={selectedValue}
              onChange={e => setSelectedValue(e.target.value)}
            >
              <FormControlLabel value="onsite" control={<Radio />} label="施設内利用" />
              <FormControlLabel value="remote" control={<Radio />} label="施設外利用" />
            </RadioGroup>
          </FormControl>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">キャンセル</Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          disabled={!serviceStartDate}
        >
          利用開始
        </Button>
      </DialogActions>
    </Dialog>
  );
}

SelectClientTypeModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  clientId: PropTypes.string,
};

export default SelectClientTypeModal;
