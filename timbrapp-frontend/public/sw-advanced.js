// public/sw-advanced.js
const CACHE_NAME = 'timbrapp-v2.0.0';
const STATIC_CACHE = 'timbrapp-static-v2';
const DYNAMIC_CACHE = 'timbrapp-dynamic-v2';
const API_CACHE = 'timbrapp-api-v2';

// Risorse essenziali da cachare immediatamente
const ESSENTIAL_RESOURCES = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/offline.html'
];

// Pattern di URL per diversi tipi di cache
const CACHE_PATTERNS = {
  static: /\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf)$/,
  api: /^\/api\//,
  html: /\.html$/
};

// Configurazione delle strategie di cache
const CACHE_STRATEGIES = {
  // Cache first per risorse statiche
  static: {
    strategy: 'cacheFirst',
    cacheName: STATIC_CACHE,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 giorni
    maxEntries: 100
  },
  
  // Network first per API con fallback cache
  api: {
    strategy: 'networkFirst',
    cacheName: API_CACHE,
    maxAge: 5 * 60 * 1000, // 5 minuti
    maxEntries: 50,
    networkTimeout: 5000
  },
  
  // Stale while revalidate per pagine HTML
  html: {
    strategy: 'staleWhileRevalidate',
    cacheName: DYNAMIC_CACHE,
    maxAge: 24 * 60 * 60 * 1000, // 24 ore
    maxEntries: 25
  }
};

/**
 * Service Worker avanzato per TimbrApp
 * Implementa strategie di cache intelligenti, background sync e notifiche push
 */

// Installazione del Service Worker
self.addEventListener('install', (event) => {
  console.log('SW: Installing service worker...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('SW: Caching essential resources');
      return cache.addAll(ESSENTIAL_RESOURCES);
    }).then(() => {
      console.log('SW: Installation complete');
      return self.skipWaiting(); // Forza l'attivazione immediata
    })
  );
});

// Attivazione del Service Worker
self.addEventListener('activate', (event) => {
  console.log('SW: Activating service worker...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      const deletePromises = cacheNames
        .filter(cacheName => 
          cacheName !== STATIC_CACHE && 
          cacheName !== DYNAMIC_CACHE && 
          cacheName !== API_CACHE
        )
        .map(cacheName => {
          console.log('SW: Deleting old cache:', cacheName);
          return caches.delete(cacheName);
        });
      
      return Promise.all(deletePromises);
    }).then(() => {
      console.log('SW: Activation complete');
      return self.clients.claim(); // Prende controllo di tutte le pagine
    })
  );
});

// Interceptor per le richieste di rete
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const { url, method } = request;
  
  // Ignora richieste non-GET per ora
  if (method !== 'GET') {
    return;
  }

  // Determina la strategia di cache basata sull'URL
  let strategy = getStrategyForRequest(request);
  
  event.respondWith(
    handleRequest(request, strategy)
      .catch(error => {
        console.error('SW: Request failed:', error);
        return handleOfflineResponse(request);
      })
  );
});

/**
 * Determina la strategia di cache appropriata per una richiesta
 */
function getStrategyForRequest(request) {
  const url = new URL(request.url);
  
  if (CACHE_PATTERNS.static.test(url.pathname)) {
    return CACHE_STRATEGIES.static;
  } else if (CACHE_PATTERNS.api.test(url.pathname)) {
    return CACHE_STRATEGIES.api;
  } else if (CACHE_PATTERNS.html.test(url.pathname) || url.pathname === '/') {
    return CACHE_STRATEGIES.html;
  }
  
  // Default strategy
  return CACHE_STRATEGIES.html;
}

/**
 * Gestisce le richieste basandosi sulla strategia specificata
 */
async function handleRequest(request, strategy) {
  switch (strategy.strategy) {
    case 'cacheFirst':
      return cacheFirst(request, strategy);
    case 'networkFirst':
      return networkFirst(request, strategy);
    case 'staleWhileRevalidate':
      return staleWhileRevalidate(request, strategy);
    default:
      return fetch(request);
  }
}

/**
 * Strategia Cache First
 */
async function cacheFirst(request, strategy) {
  const cache = await caches.open(strategy.cacheName);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    // Verifica se la cache è ancora valida
    const cacheDate = new Date(cachedResponse.headers.get('sw-cache-date') || 0);
    const isExpired = Date.now() - cacheDate.getTime() > strategy.maxAge;
    
    if (!isExpired) {
      console.log('SW: Cache hit (fresh):', request.url);
      return cachedResponse;
    }
  }
  
  // Cache miss o scaduta, fetch dalla rete
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      await cacheResponse(cache, request, networkResponse.clone(), strategy);
      console.log('SW: Network response cached:', request.url);
    }
    
    return networkResponse;
  } catch (error) {
    // Network fallito, usa cache stale se disponibile
    if (cachedResponse) {
      console.log('SW: Network failed, serving stale cache:', request.url);
      return cachedResponse;
    }
    throw error;
  }
}

/**
 * Strategia Network First
 */
async function networkFirst(request, strategy) {
  try {
    const networkResponse = await Promise.race([
      fetch(request),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Network timeout')), strategy.networkTimeout)
      )
    ]);
    
    if (networkResponse.ok) {
      const cache = await caches.open(strategy.cacheName);
      await cacheResponse(cache, request, networkResponse.clone(), strategy);
      console.log('SW: Network first success:', request.url);
    }
    
    return networkResponse;
  } catch (error) {
    // Network fallito, prova la cache
    const cache = await caches.open(strategy.cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      console.log('SW: Network failed, serving cache:', request.url);
      return cachedResponse;
    }
    
    throw error;
  }
}

/**
 * Strategia Stale While Revalidate
 */
async function staleWhileRevalidate(request, strategy) {
  const cache = await caches.open(strategy.cacheName);
  const cachedResponse = await cache.match(request);
  
  // Fetch dalla rete in background per aggiornare la cache
  const networkResponsePromise = fetch(request).then(response => {
    if (response.ok) {
      cacheResponse(cache, request, response.clone(), strategy);
    }
    return response;
  }).catch(error => {
    console.warn('SW: Background update failed:', request.url, error);
  });
  
  // Restituisci immediatamente la cache se disponibile
  if (cachedResponse) {
    console.log('SW: Stale while revalidate (cache):', request.url);
    return cachedResponse;
  }
  
  // Altrimenti attendi la risposta di rete
  console.log('SW: Stale while revalidate (network):', request.url);
  return networkResponsePromise;
}

/**
 * Cache una risposta con metadata aggiuntivi
 */
async function cacheResponse(cache, request, response, strategy) {
  // Aggiungi metadata alla risposta
  const responseWithMetadata = new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: {
      ...Object.fromEntries(response.headers.entries()),
      'sw-cache-date': new Date().toISOString(),
      'sw-strategy': strategy.strategy
    }
  });
  
  await cache.put(request, responseWithMetadata);
  
  // Gestisci la pulizia della cache se necessario
  await cleanupCache(cache, strategy);
}

/**
 * Pulisce la cache rimuovendo le entry più vecchie se si supera il limite
 */
async function cleanupCache(cache, strategy) {
  if (!strategy.maxEntries) return;
  
  const keys = await cache.keys();
  
  if (keys.length > strategy.maxEntries) {
    // Ordina le key per data di cache (più vecchie prima)
    const keyDates = await Promise.all(
      keys.map(async (key) => {
        const response = await cache.match(key);
        const cacheDate = new Date(response.headers.get('sw-cache-date') || 0);
        return { key, date: cacheDate };
      })
    );
    
    keyDates.sort((a, b) => a.date - b.date);
    
    // Rimuovi le entry più vecchie
    const toDelete = keyDates.slice(0, keys.length - strategy.maxEntries);
    await Promise.all(toDelete.map(({ key }) => cache.delete(key)));
    
    console.log(`SW: Cleaned up ${toDelete.length} old cache entries`);
  }
}

/**
 * Gestisce le risposte quando l'app è offline
 */
async function handleOfflineResponse(request) {
  const url = new URL(request.url);
  
  // Per le API, restituisci una risposta offline appropriata
  if (CACHE_PATTERNS.api.test(url.pathname)) {
    return new Response(
      JSON.stringify({
        error: 'Offline',
        message: 'This request failed because you are offline',
        offline: true
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
  
  // Per le pagine HTML, restituisci la pagina offline
  if (CACHE_PATTERNS.html.test(url.pathname) || url.pathname === '/') {
    const cache = await caches.open(STATIC_CACHE);
    const offlinePage = await cache.match('/offline.html');
    
    if (offlinePage) {
      return offlinePage;
    }
  }
  
  // Fallback generico
  return new Response(
    'Offline - Please check your internet connection',
    { status: 503, headers: { 'Content-Type': 'text/plain' } }
  );
}

// Background Sync per le richieste fallite offline
self.addEventListener('sync', (event) => {
  console.log('SW: Background sync triggered:', event.tag);
  
  if (event.tag === 'offline-requests') {
    event.waitUntil(processOfflineRequests());
  }
});

/**
 * Processa le richieste accumulate offline
 */
async function processOfflineRequests() {
  try {
    // Qui potresti integrarti con IndexedDB per recuperare le richieste in coda
    console.log('SW: Processing offline requests...');
    
    // Notifica all'app che le richieste offline sono state processate
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'OFFLINE_REQUESTS_PROCESSED',
        timestamp: Date.now()
      });
    });
    
  } catch (error) {
    console.error('SW: Error processing offline requests:', error);
  }
}

// Push notifications
self.addEventListener('push', (event) => {
  console.log('SW: Push notification received:', event);
  
  const options = {
    body: 'You have new updates in TimbrApp',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    tag: 'timbrapp-update',
    renotify: true,
    requireInteraction: false,
    actions: [
      {
        action: 'view',
        title: 'View',
        icon: '/action-view.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/action-dismiss.png'
      }
    ]
  };
  
  if (event.data) {
    const data = event.data.json();
    options.body = data.message || options.body;
    options.tag = data.tag || options.tag;
  }
  
  event.waitUntil(
    self.registration.showNotification('TimbrApp', options)
  );
});

// Click sulle notifiche
self.addEventListener('notificationclick', (event) => {
  console.log('SW: Notification clicked:', event);
  
  event.notification.close();
  
  if (event.action === 'view') {
    event.waitUntil(
      clients.matchAll().then(clients => {
        // Se l'app è già aperta, portala in primo piano
        if (clients.length > 0) {
          return clients[0].focus();
        }
        // Altrimenti apri una nuova finestra
        return clients.openWindow('/');
      })
    );
  }
});

// Messaggi dal client
self.addEventListener('message', (event) => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'GET_CACHE_STATS':
      getCacheStats().then(stats => {
        event.ports[0].postMessage(stats);
      });
      break;
      
    case 'CLEAR_CACHE':
      clearAllCaches().then(() => {
        event.ports[0].postMessage({ success: true });
      });
      break;
      
    default:
      console.log('SW: Unknown message type:', type);
  }
});

/**
 * Ottiene statistiche delle cache
 */
async function getCacheStats() {
  const cacheNames = await caches.keys();
  const stats = {};
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    stats[cacheName] = {
      entries: keys.length,
      urls: keys.map(key => key.url)
    };
  }
  
  return stats;
}

/**
 * Pulisce tutte le cache
 */
async function clearAllCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)));
  console.log('SW: All caches cleared');
}

console.log('SW: Advanced service worker loaded');
