import React, { useState, useEffect, useRef } from 'react';
import {
  IconButton,
  Snackbar,
  Alert
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import NotificationsOffIcon from '@mui/icons-material/NotificationsOff';
import {
  isPushNotificationSupported,
  initializePushNotifications,
  unsubscribeFromPushNotifications
} from '../pushNotifications';

// Funzione per rilevare iOS 16.4+
function isIOS164OrAbove() {
  const ua = window.navigator.userAgent;
  if (!/iPad|iPhone|iPod/.test(ua) || window.MSStream) return false;
  const match = ua.match(/OS (\d+)[._](\d+)(?:[._](\d+))?/);
  if (!match) return false;
  const major = parseInt(match[1], 10);
  const minor = parseInt(match[2] || '0', 10);
  return (major > 16) || (major === 16 && minor >= 4);
}

export default function NotificationToggle() {
  const [notificationStatus, setNotificationStatus] = useState('checking');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [debugMessages, setDebugMessages] = useState([]);
  const [isIOS, setIsIOS] = useState(false);
  const [isIOS164, setIsIOS164] = useState(false);
  const [isOldIOS, setIsOldIOS] = useState(false);
  const statusRef = useRef(notificationStatus);

  const showSnackbar = (msg, sev = 'info') => setSnackbar({ open: true, message: msg, severity: sev });
  const addDebugMessage = (msg, sev = 'info') => setDebugMessages(msgs => [...msgs, { msg, sev }]);
  
  const checkStatus = async () => {
    if (!isPushNotificationSupported()) return setNotificationStatus('unsupported');
    const permission = Notification.permission;
    if (permission === 'denied') return setNotificationStatus('blocked');
    if (permission !== 'granted') return setNotificationStatus('default');
    const reg = await navigator.serviceWorker.getRegistration();
    const sub = await reg?.pushManager.getSubscription();
    setNotificationStatus(sub ? 'enabled' : 'default');
  };

  // Aggiorna la ref ogni volta che notificationStatus cambia
  useEffect(() => {
    statusRef.current = notificationStatus;
  }, [notificationStatus]);

  useEffect(() => {
    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream);
    setIsIOS164(isIOS164OrAbove());
    setIsOldIOS(/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream && !isIOS164OrAbove());
    checkStatus();
  }, []);

  // Polling iOS: retry per 10s dopo rilancio app (ogni 1 secondo)
  useEffect(() => {
    if (!(/iPad|iPhone|iPod/.test(navigator.userAgent) && isIOS164OrAbove())) return;
    setDebugMessages([]); // pulisci vecchi messaggi
    let retryCount = 0;
    const interval = setInterval(async () => {
      retryCount++;
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      addDebugMessage(
        `[iOS Poll #${retryCount}] SW: ${reg ? 'OK' : 'NO'} | Sub: ${sub ? 'OK' : 'NO'} | Stato: ${statusRef.current}`,
        sub ? 'success' : 'warning'
      );
      await checkStatus();
      if (statusRef.current === 'enabled' || statusRef.current === 'blocked' || retryCount > 10) {
        clearInterval(interval);
        if (!sub) {
          addDebugMessage('[iOS Poll] Sottoscrizione non trovata dopo 10 tentativi', 'error');
        }
      }
    }, 1000); // ogni 1 secondo, max 10 secondi
    return () => clearInterval(interval);
  }, [isIOS164]);

  const toggle = async () => {
    if (notificationStatus === 'unsupported') return showSnackbar('Non supportato', 'warning');
    if (notificationStatus === 'blocked') return showSnackbar('Permesso negato. Vai nelle impostazioni di Safari', 'warning');
    if (notificationStatus === 'enabled') {
      await unsubscribeFromPushNotifications();
      setNotificationStatus('default');
      return showSnackbar('Disattivate', 'info');
    }
    const res = await initializePushNotifications();
    if (res.success) {
      setNotificationStatus('enabled');
      showSnackbar('Attivate!', 'success');
    } else {
      setNotificationStatus('default');
      showSnackbar('Errore: ' + (res.error || 'generico'), 'error');
    }
  };

  if (notificationStatus === 'unsupported') return null;

  if (isIOS && isOldIOS) {
    return (
      <Snackbar open={true} autoHideDuration={6000}>
        <Alert severity="warning">
          Le notifiche push sono disponibili solo su iOS 16.4 o superiore. Aggiorna il sistema per attivarle.
        </Alert>
      </Snackbar>
    );
  }

  const icon = notificationStatus === 'enabled'
    ? <NotificationsActiveIcon />
    : notificationStatus === 'blocked'
      ? <NotificationsOffIcon />
      : <NotificationsIcon />;

  return (
    <>
      <IconButton color="inherit" onClick={toggle} aria-label="notifiche">
        {icon}
      </IconButton>
      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
      {/* Debug: mostra tutti i messaggi di polling iOS come Alert persistenti */}
      {debugMessages.length > 0 && (
        <div style={{ position: 'fixed', bottom: 80, left: 10, right: 10, zIndex: 9999 }}>
          {debugMessages.map((d, i) => (
            <Alert key={i} severity={d.sev} sx={{ mb: 1 }}>{d.msg}</Alert>
          ))}
        </div>
      )}
    </>
  );
}
