/* eslint-disable no-restricted-globals */

/**
 * Service Worker ottimizzato per TimbrApp
 * Versione: 2.0.0
 */

import { clientsClaim } from 'workbox-core';
import { ExpirationPlugin } from 'workbox-expiration';
import { precacheAndRoute, createHandlerBoundToURL } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate, CacheFirst, NetworkFirst, NetworkOnly } from 'workbox-strategies';
import { BackgroundSyncPlugin } from 'workbox-background-sync';

// Versione del service worker (sincronizzata con version.json)
let SW_VERSION = 'unknown';
let appVersionFetched = false;

// Controllare se siamo in modalità debug
const isDebug = false; // Cambia in produzione

// Funzione logger custom per limitare i log in prod
function swLog(message, data = null, forceLog = false) {
  if (isDebug || forceLog) {
    if (data) {
      console.log(`[Service Worker] ${message}`, data);
    } else {
      console.log(`[Service Worker] ${message}`);
    }
  }
}

/**
 * Gestisce gli aggiornamenti del service worker
 * Singolo gestore per evitare duplicazioni
 */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    swLog('Ricevuto messaggio SKIP_WAITING, attivazione immediata', null, true);
    self.skipWaiting();
    // Notifica i client che il SW è attivo
    self.clients.matchAll({ type: 'window' }).then(clients => {
      clients.forEach(client => client.postMessage({ type: 'RELOAD_PAGE' }));
    });
  }
});

/**
 * Recupera la versione corrente dell'app
 * Usa un semaforo per evitare chiamate multiple
 */
async function fetchAppVersion() {
  // Evita chiamate ripetute
  if (appVersionFetched) return SW_VERSION;
  
  try {
    const cacheKey = `version-${Date.now()}`;
    const response = await fetch(`/version.json?v=${cacheKey}`, { 
      cache: 'no-store', 
      headers: { 'Cache-Control': 'no-cache' } 
    });
    
    if (response.ok) {
      const data = await response.json();
      SW_VERSION = data.version || 'unknown';
      appVersionFetched = true;
      swLog(`Versione applicazione: ${SW_VERSION}`, null, true);
    }
  } catch (e) {
    swLog('Impossibile recuperare version.json', e);
  }
  
  return SW_VERSION;
}

swLog('Caricamento...', null, true);

clientsClaim();

// Precache dei file critici
precacheAndRoute(self.__WB_MANIFEST);

// App Shell routing
const fileExtensionRegexp = new RegExp('/[^/?]+\\.[^/]+$');
registerRoute(
  ({ request, url }) => {
    if (request.mode !== 'navigate') return false;
    if (url.pathname.startsWith('/_')) return false;
    if (url.pathname.match(fileExtensionRegexp)) return false;
    return true;
  },
  createHandlerBoundToURL(process.env.PUBLIC_URL + '/index.html')
);

// Cache immagini
registerRoute(
  ({ url }) => url.origin === self.location.origin && 
    (url.pathname.endsWith('.png') || url.pathname.endsWith('.jpg') || 
     url.pathname.endsWith('.jpeg') || url.pathname.endsWith('.svg')),
  new CacheFirst({
    cacheName: 'images',
    plugins: [
      new ExpirationPlugin({ 
        maxEntries: 50,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 giorni
      }),
    ],
  })
);

// Cache risorse statiche (CSS/JS)
registerRoute(
  ({ url }) => url.origin === self.location.origin && 
    (url.pathname.endsWith('.css') || url.pathname.endsWith('.js')),
  new StaleWhileRevalidate({
    cacheName: 'static-resources',
  })
);

// API endpoints - NetworkFirst per preferire i dati aggiornati
registerRoute(
  ({ url }) => url.origin === self.location.origin && 
    (url.pathname.startsWith('/timbrature') || 
     url.pathname.startsWith('/requests') || 
     url.pathname.startsWith('/user') ||
     url.pathname.startsWith('/commesse')),
  new NetworkFirst({
    cacheName: 'api-responses',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 7 * 24 * 60 * 60, // 7 giorni
      }),
    ],
  })
);

// Background sync per timbrature
const timbratureBackgroundSyncPlugin = new BackgroundSyncPlugin('timbrature-queue', {
  maxRetentionTime: 24 * 60, // 24 ore (in minuti)
  onSync: async ({queue}) => {
    let entry;
    while ((entry = await queue.shiftRequest())) {
      try {
        await fetch(entry.request);
        swLog('Timbratura sincronizzata con successo');
        
        self.registration.showNotification('TimbrApp', {
          body: 'La tua timbratura è stata sincronizzata con successo',
          icon: '/icon-192x192.png'
        });
      } catch (error) {
        swLog('Error replaying timbratura:', error);
        await queue.unshiftRequest(entry);
        throw error;
      }
    }
  },
});

// Background sync per richieste
const requestsBackgroundSyncPlugin = new BackgroundSyncPlugin('requests-queue', {
  maxRetentionTime: 24 * 60, // 24 ore (in minuti)
});

// Gestione POST timbrature offline
registerRoute(
  ({ url }) => url.pathname.startsWith('/timbrature') && url.origin === self.location.origin,
  new NetworkOnly({
    plugins: [timbratureBackgroundSyncPlugin],
  }),
  'POST'
);

// Gestione POST richieste ferie/permessi offline
registerRoute(
  ({ url }) => url.pathname.startsWith('/requests') && url.origin === self.location.origin,
  new NetworkOnly({
    plugins: [requestsBackgroundSyncPlugin],
  }),
  'POST'
);

// Skip per FCM
registerRoute(
  ({ url }) => url.href.includes('fcm.googleapis.com'),
  new NetworkOnly()
);

// Funzione helper per IndexedDB
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('TimbrAppOfflineDB', 1);
    request.onsuccess = event => resolve(event.target.result);
    request.onerror = event => reject(event.target.error);
  });
}

// Installazione del Service Worker - solo una volta
self.addEventListener('install', (event) => {
  event.waitUntil(fetchAppVersion().then(() => {
    swLog(`Installazione completa`, null, true);
  }));
});

// Attivazione del Service Worker - solo una volta
self.addEventListener('activate', (event) => {
  swLog(`Attivazione in corso...`, null, true);
  
  // Claim clients per controllare subito tutte le schede
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      // Eliminazione cache vecchie
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.filter(cacheName => {
            return cacheName.startsWith('atwork-cache-') && 
                   cacheName !== `atwork-cache-${SW_VERSION}`;
          }).map(cacheName => {
            swLog(`Eliminazione cache obsoleta: ${cacheName}`);
            return caches.delete(cacheName);
          })
        );
      })
    ]).then(() => {
      swLog(`Attivazione completata`, null, true);
    })
  );
});

// Gestione delle notifiche push
self.addEventListener('push', (event) => {
  swLog('Push ricevuto', event);
  
  let notificationData = {};
  
  try {
    if (event.data) {
      notificationData = event.data.json();
      swLog('Payload notifica:', notificationData);
    } else {
      swLog('Ricevuto push senza dati');
      notificationData = {
        title: 'Nuova notifica',
        body: 'Hai ricevuto una nuova notifica',
        icon: '/icon-192x192.png'
      };
    }
  } catch (e) {
    swLog('Errore parsing payload:', e);
    notificationData = {
      title: 'Nuova notifica',
      body: 'Hai ricevuto una nuova notifica',
      icon: '/icon-192x192.png'
    };
  }

  const options = {
    body: notificationData.body || 'Hai ricevuto una nuova notifica',
    icon: notificationData.icon || '/icon-192x192.png',
    badge: '/icon-192x192.png',
    data: notificationData.data || {},
    tag: notificationData.tag || 'default',
    renotify: true,
    requireInteraction: true,
    silent: false,
    timestamp: Date.now()
  };

  event.waitUntil(
    self.registration.showNotification(notificationData.title || 'TimbrApp', options)
  );
});

// Gestione click su notifiche
self.addEventListener('notificationclick', (event) => {
  swLog('Click su notifica:', event.notification);
  
  event.notification.close();
  
  let url = '/';
  if (event.notification.data?.url) {
    url = event.notification.data.url;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(windowClients => {
        const matchingClient = windowClients.find(client => 
          client.url.indexOf(url) > -1
        );

        if (matchingClient) {
          return matchingClient.focus();
        }
        return clients.openWindow(url);
      })
  );
});

swLog(`Caricato con successo`, null, true);
