/* eslint-disable no-restricted-globals */

/**
 * Service Worker ottimizzato per TimbrApp
 * Versione: 2.0.0 (Standalone)
 * 
 * Questa è una versione standalone del service worker che non richiede import
 * per funzionare correttamente quando caricato come file statico.
 */

// Variabili di workbox imitate per compatibilità
self.workbox = {
  core: {
    clientsClaim: function() {
      self.clients.claim();
    }
  },
  precaching: {
    precacheAndRoute: function(precacheManifest) {
      self.__precacheManifest = precacheManifest || [];
      precache();
    }
  },
  routing: {
    registerRoute: registerRoute
  },
  strategies: {
    CacheFirst: CacheFirstStrategy,
    NetworkFirst: NetworkFirstStrategy,
    StaleWhileRevalidate: StaleWhileRevalidateStrategy
  }
};

// Variabili globali
const CACHE_NAMES = {
  static: 'static-cache-v2',
  dynamic: 'dynamic-cache-v2',
  images: 'images-cache-v1',
  api: 'api-cache-v1',
  documents: 'documents-cache-v1'
};

const OFFLINE_PAGE = '/offline.html';
const OFFLINE_IMAGE = '/offline-image.png';

// Versione del service worker (sincronizzata con version.json)
let SW_VERSION = '1.3.0';
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

// Polyfill per clientsClaim
function clientsClaim() {
  self.clients.claim();
}

// Funzioni di base del service worker
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

// Emulate service worker strategies
function CacheFirstStrategy(options) {
  return {
    handle: async (params) => {
      const request = params.request;
      const cacheName = options.cacheName || CACHE_NAMES.static;
      
      try {
        // Try cache first
        const cache = await caches.open(cacheName);
        const cachedResponse = await cache.match(request);
        
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // If not in cache, fetch
        const response = await fetch(request);
        
        // Clone and cache the response
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          cache.put(request, responseToCache);
        }
        
        return response;
      } catch (error) {
        // Fallback for images
        if (request.destination === 'image') {
          return caches.match(OFFLINE_IMAGE);
        }
        throw error;
      }
    }
  };
}

function NetworkFirstStrategy(options) {
  return {
    handle: async (params) => {
      const request = params.request;
      const cacheName = options.cacheName || CACHE_NAMES.dynamic;
      
      try {
        // Try network first
        const response = await fetch(request);
        
        // Clone and cache the response
        if (response && response.status === 200) {
          const cache = await caches.open(cacheName);
          const responseToCache = response.clone();
          cache.put(request, responseToCache);
        }
        
        return response;
      } catch (error) {
        // If offline, try cache
        const cache = await caches.open(cacheName);
        const cachedResponse = await cache.match(request);
        
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // If not in cache and offline, return offline page for navigation
        if (request.mode === 'navigate') {
          return caches.match(OFFLINE_PAGE);
        }
        
        throw error;
      }
    }
  };
}

function StaleWhileRevalidateStrategy(options) {
  return {
    handle: async (params) => {
      const request = params.request;
      const cacheName = options.cacheName || CACHE_NAMES.dynamic;
      
      // Open cache
      const cache = await caches.open(cacheName);
      
      // Get from cache
      const cachedResponse = await cache.match(request);
      
      // Clone request for fetching
      const fetchPromise = fetch(request).then((networkResponse) => {
        // Cache the updated response
        if (networkResponse && networkResponse.status === 200) {
          cache.put(request, networkResponse.clone());
        }
        return networkResponse;
      }).catch((error) => {
        console.error('Fetch failed:', error);
        return null;
      });
      
      // Return cached response immediately, or wait for fetch
      return cachedResponse || fetchPromise;
    }
  };
}

// Cache management
async function precache() {
  const cache = await caches.open(CACHE_NAMES.static);
  
  // Add default files to cache
  await cache.addAll([
    '/',
    '/index.html',
    '/offline.html',
    '/offline-image.png',
    '/static/js/main.js',
    '/static/css/main.css',
    '/icon-192x192.png',
    '/icon-512x512.png',
    '/favicon.ico'
  ]);
}

// Route registration
function registerRoute(matchFn, handler) {
  self.addEventListener('fetch', (event) => {
    // Skip cross-origin requests
    if (!event.request.url.startsWith(self.location.origin)) return;
    
    const match = matchFn({
      request: event.request,
      url: new URL(event.request.url)
    });
    
    if (match) {
      event.respondWith(
        handler.handle({
          request: event.request,
          event: event
        })
      );
    }
  });
}

// Service Worker event handlers
self.addEventListener('install', (event) => {
  swLog('Installazione...', null, true);
  self.skipWaiting();
  
  // Pre-cache essential assets
  event.waitUntil(
    caches.open(CACHE_NAMES.static).then((cache) => {
      return cache.addAll([
        '/',
        '/index.html',
        '/offline.html'
      ]);
    })
  );
});

self.addEventListener('activate', (event) => {
  swLog('Attivazione...', null, true);
  clientsClaim();
  
  // Clean old caches
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!Object.values(CACHE_NAMES).includes(cacheName)) {
            swLog(`Rimozione cache obsoleta: ${cacheName}`);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      swLog('Service Worker attivato e cache aggiornate', null, true);
      return fetchAppVersion();
    })
  );
});

// Notifiche push
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

self.addEventListener('notificationclick', (event) => {
  swLog('Click su notifica:', event.notification);
  
  event.notification.close();
  
  let url = '/';
  if (event.notification.data?.url) {
    url = event.notification.data.url;
  }
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(clientList => {
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// Il service worker è completamente caricato
swLog('Service Worker caricato correttamente', null, true);

// Gestione cache su fetch
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Skip browser extension requests, non-GET requests, and cross-origin
  if (
    event.request.method !== 'GET' ||
    !event.request.url.startsWith(self.location.origin) ||
    url.pathname.startsWith('/browser-sync/')
  ) {
    return;
  }
  
  // App shell - use cache first, fallback to network
  if (url.pathname === '/' || url.pathname.endsWith('.html')) {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request).then((fetchResponse) => {
          const responseToCache = fetchResponse.clone();
          caches.open(CACHE_NAMES.static).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return fetchResponse;
        }).catch(() => {
          return caches.match('/offline.html');
        });
      })
    );
    return;
  }
  
  // Images - cache first
  if (
    event.request.destination === 'image' || 
    url.pathname.endsWith('.png') || 
    url.pathname.endsWith('.jpg') || 
    url.pathname.endsWith('.jpeg') || 
    url.pathname.endsWith('.svg')
  ) {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request).then((fetchResponse) => {
          const responseToCache = fetchResponse.clone();
          caches.open(CACHE_NAMES.images).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return fetchResponse;
        }).catch(() => {
          return caches.match('/offline-image.png');
        });
      })
    );
    return;
  }
  
  // CSS and JS - cache first
  if (
    event.request.destination === 'script' || 
    event.request.destination === 'style'
  ) {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request).then((fetchResponse) => {
          const responseToCache = fetchResponse.clone();
          caches.open(CACHE_NAMES.static).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return fetchResponse;
        });
      })
    );
    return;
  }
});

// Skip waiting message handler
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
