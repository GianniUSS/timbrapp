// utils/apiCache.js
import { openDB } from 'idb';

/**
 * Sistema di cache intelligente per API endpoints
 * Utilizza IndexedDB per persistenza offline e strategie di cache avanzate
 */
class ApiCache {
  constructor() {
    this.dbName = 'TimbrAppCache';
    this.version = 1;
    this.stores = {
      apiCache: 'api-cache',
      userPreferences: 'user-preferences',
      offlineQueue: 'offline-queue'
    };
    this.db = null;
    this.maxCacheSize = 50 * 1024 * 1024; // 50MB max cache size
    this.init();
  }

  async init() {
    try {
      this.db = await openDB(this.dbName, this.version, {
        upgrade(db) {
          // Store per la cache delle API
          if (!db.objectStoreNames.contains('api-cache')) {
            const apiStore = db.createObjectStore('api-cache', { keyPath: 'key' });
            apiStore.createIndex('timestamp', 'timestamp');
            apiStore.createIndex('endpoint', 'endpoint');
            apiStore.createIndex('expires', 'expires');
          }

          // Store per le preferenze utente sulla cache
          if (!db.objectStoreNames.contains('user-preferences')) {
            db.createObjectStore('user-preferences', { keyPath: 'key' });
          }

          // Store per le richieste offline
          if (!db.objectStoreNames.contains('offline-queue')) {
            const queueStore = db.createObjectStore('offline-queue', { 
              keyPath: 'id',
              autoIncrement: true 
            });
            queueStore.createIndex('timestamp', 'timestamp');
          }
        }
      });
      console.log('ApiCache initialized successfully');
    } catch (error) {
      console.error('Failed to initialize ApiCache:', error);
    }
  }

  /**
   * Genera una chiave univoca per la cache basata su URL e parametri
   */
  generateCacheKey(url, method = 'GET', params = {}) {
    const normalizedUrl = url.toLowerCase();
    const sortedParams = Object.keys(params).sort().reduce((result, key) => {
      result[key] = params[key];
      return result;
    }, {});
    
    return `${method}:${normalizedUrl}:${JSON.stringify(sortedParams)}`;
  }

  /**
   * Strategie di cache disponibili
   */
  getCacheStrategies() {
    return {
      CACHE_FIRST: 'cache-first',           // Usa cache se disponibile, altrimenti network
      NETWORK_FIRST: 'network-first',       // Prova network prima, poi cache come fallback
      CACHE_ONLY: 'cache-only',             // Solo cache (per offline)
      NETWORK_ONLY: 'network-only',         // Solo network (bypass cache)
      STALE_WHILE_REVALIDATE: 'stale-while-revalidate', // Restituisce cache + aggiorna in background
      CACHE_WITH_NETWORK_FALLBACK: 'cache-with-network-fallback'
    };
  }

  /**
   * Configurazione delle strategie per endpoint specifici
   */
  getEndpointStrategies() {
    return {
      // Dati che cambiano raramente - cache aggressive
      '/api/funzioni-skill': {
        strategy: this.getCacheStrategies().CACHE_FIRST,
        ttl: 24 * 60 * 60 * 1000, // 24 ore
        staleWhileRevalidate: true
      },
      
      // Dati del personale - cache con revalidazione
      '/api/personale': {
        strategy: this.getCacheStrategies().STALE_WHILE_REVALIDATE,
        ttl: 60 * 60 * 1000, // 1 ora
        backgroundSync: true
      },
      
      // Task e commesse - cache breve con network priority
      '/api/task': {
        strategy: this.getCacheStrategies().NETWORK_FIRST,
        ttl: 15 * 60 * 1000, // 15 minuti
        offlineSupport: true
      },
      
      // Richieste e permessi - sempre aggiornati
      '/api/requests': {
        strategy: this.getCacheStrategies().NETWORK_FIRST,
        ttl: 5 * 60 * 1000, // 5 minuti
        realTimeUpdates: true
      },
      
      // Dati dell'utente corrente - cache con sync frequente
      '/api/user/profile': {
        strategy: this.getCacheStrategies().STALE_WHILE_REVALIDATE,
        ttl: 30 * 60 * 1000, // 30 minuti
        backgroundSync: true
      },
      
      // Eventi e calendario - cache con revalidazione
      '/api/eventi': {
        strategy: this.getCacheStrategies().CACHE_FIRST,
        ttl: 2 * 60 * 60 * 1000, // 2 ore
        conditionalRequests: true
      }
    };
  }

  /**
   * Determina la strategia di cache per un endpoint
   */
  getStrategyForEndpoint(url) {
    const strategies = this.getEndpointStrategies();
    
    // Trova la strategia più specifica che matcha l'URL
    const matchingKey = Object.keys(strategies).find(key => url.includes(key));
    
    return matchingKey ? strategies[matchingKey] : {
      strategy: this.getCacheStrategies().NETWORK_FIRST,
      ttl: 10 * 60 * 1000, // Default 10 minuti
      offlineSupport: false
    };
  }

  /**
   * Salva dati nella cache
   */
  async set(key, data, options = {}) {
    if (!this.db) await this.init();
    
    const {
      ttl = 10 * 60 * 1000, // Default 10 minuti
      endpoint = '',
      metadata = {}
    } = options;

    const cacheEntry = {
      key,
      data,
      endpoint,
      timestamp: Date.now(),
      expires: Date.now() + ttl,
      size: JSON.stringify(data).length,
      metadata: {
        ...metadata,
        userAgent: navigator.userAgent,
        url: window.location.href
      }
    };

    try {
      await this.db.put('api-cache', cacheEntry);
      
      // Cleanup se necessario
      await this.cleanupIfNeeded();
      
      return true;
    } catch (error) {
      console.error('Failed to cache data:', error);
      return false;
    }
  }

  /**
   * Recupera dati dalla cache
   */
  async get(key, options = {}) {
    if (!this.db) await this.init();
    
    const { 
      allowStale = false,
      maxAge = null 
    } = options;

    try {
      const entry = await this.db.get('api-cache', key);
      
      if (!entry) return null;

      const now = Date.now();
      const isExpired = entry.expires < now;
      const isTooOld = maxAge && (now - entry.timestamp) > maxAge;

      // Se è scaduto e non permettiamo dati stale
      if ((isExpired || isTooOld) && !allowStale) {
        await this.delete(key);
        return null;
      }

      // Aggiorna il timestamp di ultimo accesso
      entry.lastAccessed = now;
      await this.db.put('api-cache', entry);

      return {
        data: entry.data,
        metadata: entry.metadata,
        isStale: isExpired || isTooOld,
        age: now - entry.timestamp
      };
    } catch (error) {
      console.error('Failed to get cached data:', error);
      return null;
    }
  }

  /**
   * Elimina entry dalla cache
   */
  async delete(key) {
    if (!this.db) await this.init();
    
    try {
      await this.db.delete('api-cache', key);
      return true;
    } catch (error) {
      console.error('Failed to delete cached data:', error);
      return false;
    }
  }

  /**
   * Pulisce la cache dalle entry scadute
   */
  async cleanup() {
    if (!this.db) await this.init();
    
    try {
      const tx = this.db.transaction('api-cache', 'readwrite');
      const store = tx.objectStore('api-cache');
      const now = Date.now();
      
      const cursor = await store.openCursor();
      let deletedCount = 0;
      
      while (cursor) {
        const entry = cursor.value;
        if (entry.expires < now) {
          await cursor.delete();
          deletedCount++;
        }
        await cursor.continue();
      }
      
      console.log(`Cleaned up ${deletedCount} expired cache entries`);
      return deletedCount;
    } catch (error) {
      console.error('Failed to cleanup cache:', error);
      return 0;
    }
  }

  /**
   * Pulisce la cache se necessario (size-based cleanup)
   */
  async cleanupIfNeeded() {
    const stats = await this.getStats();
    
    if (stats.totalSize > this.maxCacheSize) {
      await this.cleanupBySize();
    }
  }

  /**
   * Pulisce la cache basandosi sulla dimensione (LRU)
   */
  async cleanupBySize() {
    if (!this.db) await this.init();
    
    try {
      const tx = this.db.transaction('api-cache', 'readwrite');
      const store = tx.objectStore('api-cache');
      
      // Ottieni tutte le entry ordinate per ultimo accesso
      const entries = await store.getAll();
      entries.sort((a, b) => (a.lastAccessed || a.timestamp) - (b.lastAccessed || b.timestamp));
      
      let currentSize = entries.reduce((total, entry) => total + entry.size, 0);
      let deletedCount = 0;
      
      // Elimina le entry più vecchie fino a raggiungere il 75% della dimensione massima
      const targetSize = this.maxCacheSize * 0.75;
      
      for (const entry of entries) {
        if (currentSize <= targetSize) break;
        
        await store.delete(entry.key);
        currentSize -= entry.size;
        deletedCount++;
      }
      
      console.log(`LRU cleanup: removed ${deletedCount} entries, freed ${this.maxCacheSize - currentSize} bytes`);
    } catch (error) {
      console.error('Failed to perform LRU cleanup:', error);
    }
  }

  /**
   * Ottiene statistiche della cache
   */
  async getStats() {
    if (!this.db) await this.init();
    
    try {
      const entries = await this.db.getAll('api-cache');
      const now = Date.now();
      
      const stats = entries.reduce((acc, entry) => {
        acc.totalEntries++;
        acc.totalSize += entry.size;
        
        if (entry.expires < now) {
          acc.expiredEntries++;
        }
        
        // Raggruppa per endpoint
        if (!acc.byEndpoint[entry.endpoint]) {
          acc.byEndpoint[entry.endpoint] = { count: 0, size: 0 };
        }
        acc.byEndpoint[entry.endpoint].count++;
        acc.byEndpoint[entry.endpoint].size += entry.size;
        
        return acc;
      }, {
        totalEntries: 0,
        totalSize: 0,
        expiredEntries: 0,
        byEndpoint: {}
      });
      
      stats.utilizationPercentage = (stats.totalSize / this.maxCacheSize) * 100;
      
      return stats;
    } catch (error) {
      console.error('Failed to get cache stats:', error);
      return {
        totalEntries: 0,
        totalSize: 0,
        expiredEntries: 0,
        byEndpoint: {},
        utilizationPercentage: 0
      };
    }
  }

  /**
   * Invalida cache per pattern o endpoint specifico
   */
  async invalidate(pattern) {
    if (!this.db) await this.init();
    
    try {
      const tx = this.db.transaction('api-cache', 'readwrite');
      const store = tx.objectStore('api-cache');
      const cursor = await store.openCursor();
      
      let deletedCount = 0;
      
      while (cursor) {
        const entry = cursor.value;
        if (entry.key.includes(pattern) || entry.endpoint.includes(pattern)) {
          await cursor.delete();
          deletedCount++;
        }
        await cursor.continue();
      }
      
      console.log(`Invalidated ${deletedCount} cache entries matching pattern: ${pattern}`);
      return deletedCount;
    } catch (error) {
      console.error('Failed to invalidate cache:', error);
      return 0;
    }
  }

  /**
   * Aggiunge richiesta alla coda offline
   */
  async addToOfflineQueue(request) {
    if (!this.db) await this.init();
    
    const queueItem = {
      ...request,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: 3
    };

    try {
      await this.db.add('offline-queue', queueItem);
      return true;
    } catch (error) {
      console.error('Failed to add to offline queue:', error);
      return false;
    }
  }

  /**
   * Processa la coda offline quando si torna online
   */
  async processOfflineQueue() {
    if (!this.db) await this.init();
    
    try {
      const queueItems = await this.db.getAll('offline-queue');
      const results = [];
      
      for (const item of queueItems) {
        try {
          // Prova a eseguire la richiesta
          const response = await fetch(item.url, {
            method: item.method,
            headers: item.headers,
            body: item.body
          });
          
          if (response.ok) {
            // Successo - rimuovi dalla coda
            await this.db.delete('offline-queue', item.id);
            results.push({ success: true, item });
          } else {
            // Fallimento - incrementa retry count
            item.retryCount++;
            if (item.retryCount >= item.maxRetries) {
              await this.db.delete('offline-queue', item.id);
              results.push({ success: false, item, reason: 'max_retries' });
            } else {
              await this.db.put('offline-queue', item);
              results.push({ success: false, item, reason: 'will_retry' });
            }
          }
        } catch (error) {
          // Errore di rete - incrementa retry count
          item.retryCount++;
          if (item.retryCount >= item.maxRetries) {
            await this.db.delete('offline-queue', item.id);
            results.push({ success: false, item, reason: 'network_error' });
          } else {
            await this.db.put('offline-queue', item);
            results.push({ success: false, item, reason: 'network_error_will_retry' });
          }
        }
      }
      
      return results;
    } catch (error) {
      console.error('Failed to process offline queue:', error);
      return [];
    }
  }

  /**
   * Pulisce completamente la cache
   */
  async clear() {
    if (!this.db) await this.init();
    
    try {
      await this.db.clear('api-cache');
      console.log('Cache cleared successfully');
      return true;
    } catch (error) {
      console.error('Failed to clear cache:', error);
      return false;
    }
  }
}

// Singleton instance
const apiCache = new ApiCache();

export default apiCache;
