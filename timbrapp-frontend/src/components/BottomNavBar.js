import React from 'react';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import Typography from '@mui/material/Typography';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ListAltIcon from '@mui/icons-material/ListAlt';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

function BottomNavBar({ bottomNavValue, handleBottomNavChange, APP_VERSION }) {
  return (
    <Paper 
      sx={{ 
        position: 'fixed', 
        bottom: 0, 
        left: 0, 
        right: 0, 
        zIndex: 1000,
        borderTop: '1px solid rgba(0,0,0,0.1)'
      }} 
      elevation={3}
    >
      <Box sx={{ 
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative'
      }}>
        <BottomNavigation
          value={bottomNavValue}
          onChange={handleBottomNavChange}
          showLabels
          sx={{ 
            width: '100%',
            height: { xs: '64px', sm: '72px' },
            py: { xs: 0.75, sm: 1.25 },
            '& .MuiBottomNavigationAction-root': {
              py: 0.75,
              minWidth: 0,
              maxWidth: '100%'
            },
            '& .MuiBottomNavigationAction-label': {
              fontSize: { xs: '0.7rem', sm: '0.8rem' },
              mt: 0.75
            }
          }}
        >
          <BottomNavigationAction 
            label="Timbrature" 
            icon={<AccessTimeIcon sx={{ fontSize: { xs: '1.3rem', sm: '1.5rem' } }} />} 
          />
          <BottomNavigationAction 
            label="Richieste" 
            icon={<ListAltIcon sx={{ fontSize: { xs: '1.3rem', sm: '1.5rem' } }} />} 
          />
          <BottomNavigationAction 
            label="Attività" 
            icon={<AssignmentIcon sx={{ fontSize: { xs: '1.3rem', sm: '1.5rem' } }} />} 
          />
          <BottomNavigationAction 
            label="Turni" 
            icon={<AccountCircleIcon sx={{ fontSize: { xs: '1.3rem', sm: '1.5rem' } }} />} 
          />
        </BottomNavigation>
        {/* Rimossa la visualizzazione della versione dell'app */}
      </Box>
    </Paper>
  );
}

export default BottomNavBar;
