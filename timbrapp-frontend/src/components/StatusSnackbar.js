import React from 'react';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

function StatusSnackbar({ open, onClose, status, message }) {
  return (
    <Snackbar
      open={open}
      autoHideDuration={6000}
      onClose={onClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
    >
      <Alert onClose={onClose} severity={status} sx={{ width: '100%' }}>
        {message}
      </Alert>
    </Snackbar>
  );
}

export default StatusSnackbar;
