import React from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';

function DashboardHeader({ APP_VERSION, renderNotificationIcon, getTodayEntries, entries, NotificationList, onMenuClick, isOnline, offlineEntries, syncOfflineData }) {
  return (
    <AppBar 
      position="fixed"
      sx={{ 
        background: 'linear-gradient(90deg, #1976d2 0%, #2196f3 100%)',
        width: '100%',
        left: 0,
        top: 0,
        zIndex: 1300,
        paddingTop: 'env(safe-area-inset-top, 0px)',
        boxShadow: 'none',
        borderBottom: '1.5px solid #e3eaf2',
      }}
    >
      <Toolbar sx={{ 
        minHeight: { xs: '62px', sm: '70px' },
        px: { xs: 2, sm: 4 },
        py: { xs: 0.5, sm: 1 },
        display: 'flex',
        justifyContent: 'space-between',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1, minWidth: 0 }}>
          <Typography variant="h6" component="div" sx={{ 
            fontWeight: 700,
            fontSize: { xs: '1.15rem', sm: '1.35rem' },
            color: 'white',
            letterSpacing: 0.2,
            mr: 1.2,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            AtWork
          </Typography>
          <Typography variant="caption" sx={{ 
            color: 'rgba(255,255,255,0.85)',
            fontSize: { xs: '0.85rem', sm: '0.95rem' },
            fontWeight: 400,
            mr: 1.2
          }}>
            {APP_VERSION}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {renderNotificationIcon()}
          <IconButton
            size="small"
            color="inherit"
            aria-label="notifiche"
            sx={{ mr: 0.5 }}
          >
            <NotificationList entries={getTodayEntries(entries)} />
          </IconButton>
          <IconButton
            size="small"
            edge="end"
            color="inherit"
            aria-label="menu"
            sx={{ p: { xs: 0.7, sm: 1 } }}
            onClick={onMenuClick}
          >
            <MenuIcon sx={{ fontSize: { xs: '1.5rem', sm: '1.7rem' } }} />
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default DashboardHeader;
