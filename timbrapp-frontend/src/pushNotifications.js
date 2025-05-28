import axios from 'axios';
import api from './api';

export function isPushNotificationSupported() {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isIOS164Plus = isIOS && parseInt((navigator.userAgent.match(/OS (\d+)_/)||[])[1], 10) >= 16;
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window &&
    (!isIOS || isIOS164Plus)
  );
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  return Uint8Array.from([...raw].map(ch => ch.charCodeAt(0)));
}

export async function subscribeUserToPush(showSnackbar) {
  const log = (msg, type = 'info') => {
    console.log(`[Push] ${msg}`);
    showSnackbar?.(msg, type);
  };

  try {
    // 1. Verifica supporto
    if (!isPushNotificationSupported()) {
      throw new Error('Browser non supporta le notifiche push');
    }
    log('Browser supporta le notifiche');

    // 2. Verifica permessi
    if (Notification.permission === 'denied') {
      throw new Error('Notifiche bloccate nelle impostazioni browser');
    }
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      throw new Error('Permesso notifiche non concesso');
    }
    log('Permessi concessi');

    // 3. Registrazione Service Worker
    const swReg = await navigator.serviceWorker.register('/service-worker.js');
    log('Service Worker registrato');

    // 4. Attendi attivazione
    if (!swReg.active) {
      log('Attendo attivazione Service Worker...');
      await new Promise(resolve => {
        swReg.addEventListener('activate', () => resolve());
      });
    }    // 5. Recupera VAPID key
    log('Recupero VAPID key...');
    const res = await fetch('/api/webpush/vapid-public-key');
    const { key } = await res.json();
    
    // 6. Verifica sottoscrizione esistente
    const existing = await swReg.pushManager.getSubscription();
    if (existing) {
      log('Rimuovo sottoscrizione esistente...');
      await existing.unsubscribe();
    }

    // 7. Crea sottoscrizione
    log('Richiedo sottoscrizione push...');
    console.log('PushManager:', swReg.pushManager);
    console.log('ServiceWorker state:', swReg.active ? 'active' : 'not active');
    let subscription;
    try {
      subscription = await swReg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key)
      });
    } catch (subscribeError) {
      let errorMsg = 'ERRORE subscribe: ';
      if (subscribeError && subscribeError.message) {
        errorMsg += subscribeError.message + '\n';
      }
      errorMsg += '\nJSON: ' + JSON.stringify(subscribeError);
      errorMsg += '\nStack: ' + (subscribeError && subscribeError.stack ? 'N/A' : 'N/A');
      console.error('Dettaglio errore subscribe:', subscribeError);
      throw subscribeError;
    }

    if (!subscription) {
      throw new Error('Sottoscrizione fallita');
    }
    log('Sottoscrizione creata!');    // 8. Salva sul server
    const saveRes = await fetch('/api/webpush/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ subscription })
    });

    if (!saveRes.ok) {
      throw new Error('Errore salvataggio sul server');
    }

    log('Notifiche attivate con successo!', 'success');
    return subscription;

  } catch (error) {
    console.error('Errore sottoscrizione:', error);
    log(`Errore: ${error.message}`, 'error');
    throw error;
  }
}

export async function unsubscribeFromPushNotifications() {
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  if (!sub) return { success: true };

  // Log dettagliato per iOS
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const iOSVersion = isIOS ? (navigator.userAgent.match(/OS (\d+)_/)||[])[1] : null;
  console.log('[Unsubscribe] Platform:', navigator.userAgent, 'isIOS:', isIOS, 'iOSVersion:', iOSVersion);
  console.log('[Unsubscribe] Subscription endpoint:', sub.endpoint);

  try {    const unsubResult = await sub.unsubscribe();
    console.log('[Unsubscribe] unsubResult:', unsubResult);
    // Recupera tutte le subscriptions server-side
    const res = await fetch('/api/webpush/subscriptions', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    const serverSubs = await res.json();
    const match = serverSubs.find(s => sub.endpoint.includes(s.endpoint));    if (match) {
      // Usa fetch per la DELETE
      const delRes = await fetch(`/api/webpush/subscriptions/${match.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      console.log('[Unsubscribe] DELETE response:', delRes.status, await delRes.text());
    } else {
      console.log('[Unsubscribe] Nessuna subscription trovata lato server da cancellare');
    }
    return { success: true };
  } catch (error) {
    console.error('[Unsubscribe] Errore:', error);
    return { success: false, error: error.message };
  }
}

export async function initializePushNotifications(showSnackbar) {
  try {
    await subscribeUserToPush(showSnackbar);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
