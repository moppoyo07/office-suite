import { Dialog, DialogTitle, DialogContent, DialogActions, Button, RadioGroup, FormControlLabel, Radio, FormControl } from '@mui/material';
import PropTypes from 'prop-types';
import { useState } from 'react';

function SelectClientTypeModal({ open, onClose, onConfirm, clientId }) {
  const [selectedValue, setSelectedValue] = useState('onsite'); // デフォルトは '施設内'

  const handleRadioChange = (event) => {
    setSelectedValue(event.target.value);
  };

  const handleConfirm = () => {
    if (clientId) {
      onConfirm(clientId, selectedValue);
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>利用形態の選択</DialogTitle>
      <DialogContent>
        <FormControl component="fieldset">
          <RadioGroup
            aria-label="client-type"
            name="client-type-radio-group"
            value={selectedValue}
            onChange={handleRadioChange}
          >
            <FormControlLabel value="onsite" control={<Radio />} label="施設内利用 (On-site)" />
            <FormControlLabel value="remote" control={<Radio />} label="施設外利用 (Remote)" />
          </RadioGroup>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>キャンセル</Button>
        <Button onClick={handleConfirm} variant="contained">決定</Button>
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