/* eslint-disable no-restricted-globals */
/**
 * Service Worker Unificato per TimbrApp
 * Versione: 3.0.0 (Consolidato)
 * 
 * Combina le migliori features dalle 3 versioni esistenti
 */

import { clientsClaim } from 'workbox-core';
import { ExpirationPlugin } from 'workbox-expiration';
import { precacheAndRoute, createHandlerBoundToURL } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate, CacheFirst, NetworkFirst, NetworkOnly } from 'workbox-strategies';
import { BackgroundSyncPlugin } from 'workbox-background-sync';

// Versione del service worker
const SW_VERSION = '3.0.0';

console.log(`[Service Worker ${SW_VERSION}] Caricamento versione unificata...`);

clientsClaim();

// Precache delle risorse statiche
precacheAndRoute(self.__WB_MANIFEST);

// Cache Strategy 1: Immagini - CacheFirst con scadenza
registerRoute(
  ({ url }) => url.origin === self.location.origin && 
    /\.(png|jpg|jpeg|svg|gif|webp)$/i.test(url.pathname),
  new CacheFirst({
    cacheName: 'images-cache-v3',
    plugins: [
      new ExpirationPlugin({ 
        maxEntries: 100,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 giorni
        purgeOnQuotaError: true
      }),
    ],
  })
);

// Cache Strategy 2: Assets statici - StaleWhileRevalidate
registerRoute(
  ({ url }) => url.origin === self.location.origin && 
    /\.(css|js)$/i.test(url.pathname),
  new StaleWhileRevalidate({
    cacheName: 'static-assets-v3',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 7 * 24 * 60 * 60, // 7 giorni
      }),
    ],
  })
);

// Cache Strategy 3: API endpoints - NetworkFirst con fallback
registerRoute(
  ({ url }) => url.origin === self.location.origin && 
    (url.pathname.startsWith('/api/timbrature') || 
     url.pathname.startsWith('/api/requests') || 
     url.pathname.startsWith('/api/commesse') ||
     url.pathname.startsWith('/api/user')),
  new NetworkFirst({
    cacheName: 'api-cache-v3',
    networkTimeoutSeconds: 3,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 200,
        maxAgeSeconds: 24 * 60 * 60, // 1 giorno
      }),
    ],
  })
);

// Background Sync per timbrature offline
const timbratureBackgroundSync = new BackgroundSyncPlugin('timbrature-queue-v3', {
  maxRetentionTime: 24 * 60, // 24 ore in minuti
  onSync: async ({ queue }) => {
    let entry;
    while ((entry = await queue.shiftRequest())) {
      try {
        const response = await fetch(entry.request);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        console.log(`[SW] Timbratura sincronizzata con successo:`, entry.request.url);
      } catch (error) {
        console.error(`[SW] Errore sincronizzazione timbratura:`, error);
        await queue.unshiftRequest(entry);
        throw error;
      }
    }
  },
});

// Background Sync per richieste offline
const requestsBackgroundSync = new BackgroundSyncPlugin('requests-queue-v3', {
  maxRetentionTime: 24 * 60,
});

// Gestisci POST timbrature con background sync
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/timbrature') && url.origin === self.location.origin,
  new NetworkOnly({
    plugins: [timbratureBackgroundSync],
  }),
  'POST'
);

// Gestisci POST richieste con background sync
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/requests') && url.origin === self.location.origin,
  new NetworkOnly({
    plugins: [requestsBackgroundSync],
  }),
  'POST'
);

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

// Gestione messaggi da client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log(`[SW ${SW_VERSION}] Ricevuto SKIP_WAITING, attivazione immediata`);
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: SW_VERSION });
  }
});

// Notifica ai client quando il SW è pronto
self.addEventListener('activate', (event) => {
  console.log(`[SW ${SW_VERSION}] Attivato con successo`);
  
  // Pulisci cache vecchie
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            return !cacheName.includes('v3') && 
                   (cacheName.includes('images-cache') || 
                    cacheName.includes('static-assets') || 
                    cacheName.includes('api-cache'));
          })
          .map((cacheName) => {
            console.log(`[SW] Eliminando cache obsoleta: ${cacheName}`);
            return caches.delete(cacheName);
          })
      );
    })
  );
  
  // Notifica ai client
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then(clients => {
      clients.forEach(client => 
        client.postMessage({ 
          type: 'SW_UPDATED', 
          version: SW_VERSION 
        })
      );
    })
  );
});

console.log(`[Service Worker ${SW_VERSION}] Configurazione completata`);
