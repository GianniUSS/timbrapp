import React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';

function ActionButtons({ clockedIn, onBreak, isNetworkOnline, handleClockAction, handleBreakAction }) {
  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      gap: { xs: 2, sm: 2.5 },
      mb: { xs: 2.5, sm: 3.5 }
    }}>
      <Button 
        variant="contained" 
        size="large"
        onClick={handleClockAction}
        disabled={onBreak}
        sx={{ 
          py: { xs: 1.5, sm: 2 },
          fontSize: { xs: '1rem', sm: '1.1rem' },
          fontWeight: 'bold', 
          backgroundColor: clockedIn ? '#f44336' : '#1976d2',
          height: { xs: '52px', sm: '60px' },
          '&.Mui-disabled': {
            backgroundColor: 'rgba(0, 0, 0, 0.05)',
            color: 'rgba(255, 255, 255, 0.4)'
          }
        }}
      >
        {clockedIn ? 'Clock Out' : 'Clock In'}
        {!isNetworkOnline && ' (OFFLINE)'}
      </Button>
      <Button 
        variant="outlined" 
        size="large"
        onClick={handleBreakAction}
        disabled={!clockedIn}
        sx={{ 
          py: { xs: 1.5, sm: 2 },
          fontSize: { xs: '1rem', sm: '1.1rem' },
          borderColor: onBreak ? '#f44336' : '#888',
          color: onBreak ? '#f44336' : '#333',
          height: { xs: '52px', sm: '60px' },
          '&.Mui-disabled': {
            backgroundColor: 'rgba(0, 0, 0, 0.05)',
            color: 'rgba(0, 0, 0, 0.26)'
          }
        }}
      >
        {onBreak ? 'Break Out' : 'Break In'}
        {!isNetworkOnline && ' (OFFLINE)'}
      </Button>
    </Box>
  );
}

export default ActionButtons;
