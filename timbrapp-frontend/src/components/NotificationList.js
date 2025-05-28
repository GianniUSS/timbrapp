// src/components/NotificationList.js
import React, { useState, useEffect } from 'react';
import {
  Badge, IconButton, Menu, MenuItem, List, ListItem, ListItemText,
  Typography, Divider, Button
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import api from '../api';

export default function NotificationList() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  // Carica le notifiche
  const loadNotifications = async () => {
    try {
      const response = await api.get('/api/notifications');
      setNotifications(response.data);
      setUnreadCount(response.data.filter(n => !n.isRead).length);
    } catch (error) {
      console.error('Errore caricamento notifiche:', error);
    }
  };

  // Carica le notifiche all'avvio
  useEffect(() => {
    loadNotifications();
    
    // Aggiorna ogni 30 secondi
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Apre il menu delle notifiche
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  // Chiude il menu delle notifiche
  const handleClose = () => {
    setAnchorEl(null);
  };

  // Segna una notifica come letta
  const markAsRead = async (id) => {
    try {
      await api.put(`/api/notifications/${id}/read`);
      loadNotifications();
    } catch (error) {
      console.error('Errore aggiornamento notifica:', error);
    }
  };

  // Segna tutte le notifiche come lette
  const markAllAsRead = async () => {
    try {
      await api.put('/api/notifications/read-all');
      loadNotifications();
    } catch (error) {
      console.error('Errore aggiornamento notifiche:', error);
    }
  };

  // Formatta la data della notifica
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      <IconButton
        color="inherit"
        onClick={handleClick}
      >
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>
      
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          style: {
            maxHeight: 400,
            width: '300px',
          },
        }}
      >
        <Typography variant="subtitle1" sx={{ p: 2, pb: 0 }}>
          Notifiche
        </Typography>
        
        {unreadCount > 0 && (
          <Button
            size="small"
            onClick={markAllAsRead}
            sx={{ ml: 1, mb: 1 }}
          >
            Segna tutte come lette
          </Button>
        )}
        
        <Divider />
        
        <List sx={{ width: '100%', padding: 0 }}>
          {notifications.length === 0 ? (
            <ListItem>
              <ListItemText primary="Nessuna notifica" />
            </ListItem>
          ) : (
            notifications.map((notification) => (
              <MenuItem
                key={notification.id}
                onClick={() => {
                  markAsRead(notification.id);
                  handleClose();
                }}
                sx={{
                  backgroundColor: notification.isRead ? 'inherit' : 'rgba(25, 118, 210, 0.08)',
                }}
              >
                <ListItemText
                  primary={notification.message}
                  secondary={formatDate(notification.createdAt)}
                />
              </MenuItem>
            ))
          )}
        </List>
      </Menu>
    </>
  );
}
