// hooks/usePWA.js
import { useState, useEffect, useCallback } from 'react';

/**
 * Hook per gestire le funzionalità Progressive Web App
 * Include installazione, updates, offline status e notifiche
 */
export const usePWA = () => {
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [serviceWorkerRegistration, setServiceWorkerRegistration] = useState(null);

  // Registra il service worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      registerServiceWorker();
    }
  }, []);

  // Gestisce eventi di installazione
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      console.log('PWA: Install prompt available');
      e.preventDefault(); // Previeni il prompt automatico
      setInstallPrompt(e);
      setIsInstallable(true);
    };

    const handleAppInstalled = (e) => {
      console.log('PWA: App installed');
      setIsInstalled(true);
      setIsInstallable(false);
      setInstallPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Gestisce status di connessione
  useEffect(() => {
    const handleOnline = () => {
      console.log('PWA: Back online');
      setIsOnline(true);
    };

    const handleOffline = () => {
      console.log('PWA: Gone offline');
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Verifica se l'app è già installata
  useEffect(() => {
    const checkIfInstalled = () => {
      // Su iOS
      if (window.navigator.standalone) {
        setIsInstalled(true);
        return;
      }

      // Su Android/Desktop
      if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true);
        return;
      }

      // Verifica tramite manifest
      if (document.referrer.startsWith('android-app://')) {
        setIsInstalled(true);
        return;
      }
    };

    checkIfInstalled();
  }, []);

  /**
   * Registra il service worker avanzato
   */
  const registerServiceWorker = async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw-advanced.js', {
        scope: '/',
        updateViaCache: 'none' // Assicura controlli di update frequenti
      });

      setServiceWorkerRegistration(registration);
      console.log('PWA: Service worker registered successfully');

      // Verifica updates
      registration.addEventListener('updatefound', () => {
        console.log('PWA: Update found');
        const newWorker = registration.installing;
        
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('PWA: Update available');
            setUpdateAvailable(true);
          }
        });
      });

      // Ascolta messaggi dal service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        const { type, data } = event.data;
        
        switch (type) {
          case 'OFFLINE_REQUESTS_PROCESSED':
            console.log('PWA: Offline requests processed');
            // Qui potresti mostrare una notifica all'utente
            break;
          default:
            console.log('PWA: SW message:', type, data);
        }
      });

      // Controlla update all'avvio
      checkForUpdates(registration);

    } catch (error) {
      console.error('PWA: Service worker registration failed:', error);
    }
  };

  /**
   * Controlla se ci sono aggiornamenti disponibili
   */
  const checkForUpdates = useCallback(async (registration = serviceWorkerRegistration) => {
    if (!registration) return;

    try {
      await registration.update();
      console.log('PWA: Checked for updates');
    } catch (error) {
      console.error('PWA: Update check failed:', error);
    }
  }, [serviceWorkerRegistration]);

  /**
   * Applica l'aggiornamento disponibile
   */
  const applyUpdate = useCallback(async () => {
    if (!serviceWorkerRegistration || !updateAvailable) return;

    const newWorker = serviceWorkerRegistration.waiting;
    if (newWorker) {
      // Invia messaggio al SW per fare skip waiting
      newWorker.postMessage({ type: 'SKIP_WAITING' });
      
      // Ricarica la pagina per attivare il nuovo SW
      window.location.reload();
    }
  }, [serviceWorkerRegistration, updateAvailable]);

  /**
   * Installa la PWA
   */
  const installApp = useCallback(async () => {
    if (!installPrompt) return false;

    try {
      const result = await installPrompt.prompt();
      console.log('PWA: Install prompt result:', result.outcome);
      
      if (result.outcome === 'accepted') {
        setIsInstalled(true);
      }
      
      setIsInstallable(false);
      setInstallPrompt(null);
      
      return result.outcome === 'accepted';
    } catch (error) {
      console.error('PWA: Install failed:', error);
      return false;
    }
  }, [installPrompt]);

  /**
   * Richiede permessi per le notifiche push
   */
  const requestNotificationPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      console.warn('PWA: Notifications not supported');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      console.warn('PWA: Notification permission denied');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      console.log('PWA: Notification permission:', permission);
      return permission === 'granted';
    } catch (error) {
      console.error('PWA: Failed to request notification permission:', error);
      return false;
    }
  }, []);

  /**
   * Sottoscrive alle notifiche push
   */
  const subscribeToPushNotifications = useCallback(async (vapidPublicKey) => {
    if (!serviceWorkerRegistration) {
      console.error('PWA: Service worker not registered');
      return null;
    }

    try {
      const hasPermission = await requestNotificationPermission();
      if (!hasPermission) return null;

      const subscription = await serviceWorkerRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
      });

      console.log('PWA: Push subscription created:', subscription);
      return subscription;
    } catch (error) {
      console.error('PWA: Push subscription failed:', error);
      return null;
    }
  }, [serviceWorkerRegistration, requestNotificationPermission]);

  /**
   * Ottiene statistiche della cache
   */
  const getCacheStats = useCallback(async () => {
    if (!serviceWorkerRegistration) return null;

    return new Promise((resolve) => {
      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        resolve(event.data);
      };

      serviceWorkerRegistration.active.postMessage(
        { type: 'GET_CACHE_STATS' },
        [messageChannel.port2]
      );
    });
  }, [serviceWorkerRegistration]);

  /**
   * Pulisce tutte le cache
   */
  const clearCache = useCallback(async () => {
    if (!serviceWorkerRegistration) return false;

    return new Promise((resolve) => {
      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        resolve(event.data.success);
      };

      serviceWorkerRegistration.active.postMessage(
        { type: 'CLEAR_CACHE' },
        [messageChannel.port2]
      );
    });
  }, [serviceWorkerRegistration]);

  /**
   * Invia una notifica locale
   */
  const showNotification = useCallback(async (title, options = {}) => {
    if (!serviceWorkerRegistration) {
      console.error('PWA: Service worker not registered');
      return false;
    }

    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) return false;

    try {
      await serviceWorkerRegistration.showNotification(title, {
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        tag: 'timbrapp-notification',
        renotify: true,
        ...options
      });
      
      console.log('PWA: Notification shown:', title);
      return true;
    } catch (error) {
      console.error('PWA: Failed to show notification:', error);
      return false;
    }
  }, [serviceWorkerRegistration, requestNotificationPermission]);

  /**
   * Forza la sincronizzazione offline
   */
  const syncOfflineData = useCallback(async () => {
    if (!serviceWorkerRegistration) return false;

    try {
      await serviceWorkerRegistration.sync.register('offline-requests');
      console.log('PWA: Background sync registered');
      return true;
    } catch (error) {
      console.error('PWA: Background sync failed:', error);
      return false;
    }
  }, [serviceWorkerRegistration]);

  return {
    // Status
    isInstallable,
    isInstalled,
    isOnline,
    updateAvailable,
    serviceWorkerRegistration,
    
    // Actions
    installApp,
    applyUpdate,
    checkForUpdates,
    requestNotificationPermission,
    subscribeToPushNotifications,
    showNotification,
    getCacheStats,
    clearCache,
    syncOfflineData
  };
};

/**
 * Hook specifico per gestire la modalità offline
 */
export const useOfflineMode = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineQueue, setOfflineQueue] = useState([]);
  const [lastSyncTime, setLastSyncTime] = useState(null);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      processOfflineQueue();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const addToOfflineQueue = useCallback((action) => {
    setOfflineQueue(prev => [...prev, {
      ...action,
      timestamp: Date.now(),
      id: Date.now() + Math.random()
    }]);
  }, []);

  const processOfflineQueue = useCallback(async () => {
    if (offlineQueue.length === 0) return;

    console.log('Processing offline queue:', offlineQueue.length, 'items');
    
    const processedItems = [];
    
    for (const item of offlineQueue) {
      try {
        // Qui implementeresti la logica per riprocessare l'azione
        await item.action();
        processedItems.push(item.id);
      } catch (error) {
        console.error('Failed to process offline item:', error);
      }
    }

    setOfflineQueue(prev => prev.filter(item => !processedItems.includes(item.id)));
    setLastSyncTime(new Date());
  }, [offlineQueue]);

  return {
    isOnline,
    offlineQueue: offlineQueue.length,
    lastSyncTime,
    addToOfflineQueue
  };
};

/**
 * Utility per convertire VAPID key
 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default usePWA;
