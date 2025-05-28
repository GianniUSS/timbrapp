import { useState, useCallback } from 'react';
import {
  isPushNotificationSupported,
  initializePushNotifications,
  unsubscribeFromPushNotifications
} from '../pushNotifications';

export function usePushNotifications(showSnackbar) {
  const [notificationStatus, setNotificationStatus] = useState('checking');

  // Controlla lo stato delle notifiche push
  const checkNotificationStatus = useCallback(async () => {
    if (!isPushNotificationSupported()) {
      setNotificationStatus('unsupported');
      return;
    }
    const permission = Notification.permission;
    if (permission === 'denied') {
      setNotificationStatus('blocked');
      return;
    }
    if (permission !== 'granted') {
      setNotificationStatus('default');
      return;
    }
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          const subscription = await registration.pushManager.getSubscription();
          if (subscription) {
            try {
              await fetch(subscription.endpoint, { method: 'HEAD', mode: 'no-cors' });
              setNotificationStatus('enabled');
            } catch {
              setNotificationStatus('default');
            }
          } else {
            setNotificationStatus('default');
          }
        } else {
          setNotificationStatus('default');
        }
      } else {
        setNotificationStatus('unsupported');
      }
    } catch {
      setNotificationStatus('default');
    }
  }, []);

  // Attiva/disattiva notifiche push
  const togglePushNotifications = useCallback(async () => {
    if (notificationStatus === 'unsupported') {
      showSnackbar && showSnackbar('Notifiche non supportate su questo browser', 'warning');
      return;
    }
    if (notificationStatus === 'blocked') {
      showSnackbar && showSnackbar('Notifiche bloccate. Modifica le impostazioni del browser per permettere le notifiche', 'warning');
      return;
    }
    if (notificationStatus === 'enabled') {
      setNotificationStatus('loading');
      try {
        const result = await unsubscribeFromPushNotifications();
        if (result && result.success) {
          setNotificationStatus('default');
          showSnackbar && showSnackbar('Notifiche disattivate con successo', 'success');
        } else {
          showSnackbar && showSnackbar(`Errore disattivazione notifiche: ${result?.error || 'Sconosciuto'}`, 'error');
          checkNotificationStatus();
        }
      } catch (err) {
        showSnackbar && showSnackbar('Si è verificato un errore durante la disattivazione', 'error');
        checkNotificationStatus();
      }
      return;
    }
    setNotificationStatus('loading');
    try {
      const result = await initializePushNotifications(showSnackbar);
      if (result && result.success) {
        setNotificationStatus('enabled');
        showSnackbar && showSnackbar('Notifiche attivate con successo', 'success');
      } else if (result && result.reason === 'permissionDenied') {
        setNotificationStatus('blocked');
        showSnackbar && showSnackbar('Permesso notifiche negato', 'warning');
      } else {
        const msg = result?.error || 'Errore attivazione notifiche';
        showSnackbar && showSnackbar(`Errore attivazione: ${msg}`, 'error');
        console.error('Errore attivazione notifiche:', msg);
        setNotificationStatus('default');
        checkNotificationStatus();
      }
    } catch (err) {
      showSnackbar && showSnackbar('Si è verificato un errore durante l\'attivazione', 'error');
      console.error('Errore attivazione notifiche:', err);
      setNotificationStatus('default');
      checkNotificationStatus();
    }
  }, [notificationStatus, showSnackbar, checkNotificationStatus]);

  return {
    notificationStatus,
    setNotificationStatus,
    checkNotificationStatus,
    togglePushNotifications
  };
}
