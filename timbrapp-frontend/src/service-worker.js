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
        title: 'Notifica TimbrApp',
        body: 'Hai ricevuto un nuovo aggiornamento'
      };
    }
  } catch (e) {
    swLog('Errore parsing push data', e);
    notificationData = {
      title: 'Notifica TimbrApp',
      body: 'Hai ricevuto un nuovo aggiornamento'
    };
  }
  
  const options = {
    body: notificationData.body || 'Hai ricevuto una nuova notifica',
    icon: notificationData.icon || '/icon-192x192.png',
    badge: '/badge-128x128.png',
    data: notificationData.data || {},
    tag: notificationData.tag || 'default',
    requireInteraction: notificationData.requireInteraction || false,
    actions: notificationData.actions || []
  };
  
  event.waitUntil(
    self.registration.showNotification(notificationData.title || 'TimbrApp', options)
  );
});