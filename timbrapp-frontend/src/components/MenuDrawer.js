import React from 'react';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import Box from '@mui/material/Box';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import HistoryIcon from '@mui/icons-material/History';
import SyncIcon from '@mui/icons-material/Sync';
import SettingsIcon from '@mui/icons-material/Settings';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import LogoutIcon from '@mui/icons-material/Logout';
import DescriptionIcon from '@mui/icons-material/Description';

function MenuDrawer({ open, onClose, onNavigate, onLogout, onSync }) {
  // Altezza AppBar: 80px (xs), 90px (sm)
  return (
    <Drawer 
      anchor="right" 
      open={open} 
      onClose={onClose}
      PaperProps={{
        sx: {
          zIndex: 1401, // Più alto della AppBar
          paddingTop: {
            xs: 'calc(env(safe-area-inset-top, 0px) + 80px)',
            sm: 'calc(env(safe-area-inset-top, 0px) + 90px)'
          },
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          height: '100vh',
          boxSizing: 'border-box',
          overflowY: 'auto',
        }
      }}
    >
      <Box>
        <List sx={{ width: 250 }}>
          <ListItem button onClick={() => onNavigate('profile')}>
            <ListItemIcon><AccountCircleIcon /></ListItemIcon>
            <ListItemText primary="Profilo" />
          </ListItem>
          {/* SOLO PER DASHBOARD CLASSICA: Storico timbrature, Sincronizza dati, Documentazione */}
          {/*
          <ListItem button onClick={() => onNavigate('history')}>
            <ListItemIcon><HistoryIcon /></ListItemIcon>
            <ListItemText primary="Storico timbrature" />
          </ListItem>
          <ListItem button onClick={onSync}>
            <ListItemIcon><SyncIcon /></ListItemIcon>
            <ListItemText primary="Sincronizza dati" />
          </ListItem>
          <ListItem button onClick={() => onNavigate('documentazione')}>
            <ListItemIcon><DescriptionIcon /></ListItemIcon>
            <ListItemText primary="Documentazione" />
          </ListItem>
          */}
          <Divider />
          <ListItem button onClick={() => onNavigate('settings')}>
            <ListItemIcon><SettingsIcon /></ListItemIcon>
            <ListItemText primary="Impostazioni" />
          </ListItem>
          <ListItem button onClick={() => onNavigate('help')}>
            <ListItemIcon><HelpOutlineIcon /></ListItemIcon>
            <ListItemText primary="Guida / FAQ" />
          </ListItem>
          <Divider />
          <ListItem button onClick={onLogout}>
            <ListItemIcon><LogoutIcon /></ListItemIcon>
            <ListItemText primary="Logout" />
          </ListItem>
        </List>
      </Box>
    </Drawer>
  );
}

export default MenuDrawer;
