// utils/cacheInterceptor.js
import apiCache from './apiCache';

/**
 * Interceptor per implementare automaticamente le strategie di cache
 * su tutte le chiamate API dell'applicazione
 */
class CacheInterceptor {
  constructor() {
    this.isOnline = navigator.onLine;
    this.setupNetworkListener();
  }

  setupNetworkListener() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processOfflineQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  async processOfflineQueue() {
    console.log('Back online - processing offline queue...');
    const results = await apiCache.processOfflineQueue();
    console.log('Offline queue processed:', results);
  }

  /**
   * Intercetta le richieste fetch e applica le strategie di cache
   */
  async interceptFetch(url, options = {}) {
    const method = options.method || 'GET';
    const cacheKey = apiCache.generateCacheKey(url, method, options.params || {});
    const endpointStrategy = apiCache.getStrategyForEndpoint(url);
    
    // Per le richieste non-GET, gestisci diversamente
    if (method !== 'GET') {
      return this.handleMutatingRequest(url, options, endpointStrategy);
    }

    // Applica la strategia di cache basata sull'endpoint
    switch (endpointStrategy.strategy) {
      case 'cache-first':
        return this.cacheFirstStrategy(url, options, cacheKey, endpointStrategy);
      
      case 'network-first':
        return this.networkFirstStrategy(url, options, cacheKey, endpointStrategy);
      
      case 'cache-only':
        return this.cacheOnlyStrategy(cacheKey);
      
      case 'network-only':
        return this.networkOnlyStrategy(url, options);
      
      case 'stale-while-revalidate':
        return this.staleWhileRevalidateStrategy(url, options, cacheKey, endpointStrategy);
      
      case 'cache-with-network-fallback':
        return this.cacheWithNetworkFallbackStrategy(url, options, cacheKey, endpointStrategy);
      
      default:
        return this.networkFirstStrategy(url, options, cacheKey, endpointStrategy);
    }
  }

  /**
   * Strategia Cache First: usa la cache se disponibile, altrimenti network
   */
  async cacheFirstStrategy(url, options, cacheKey, strategy) {
    try {
      // Prova prima dalla cache
      const cachedResult = await apiCache.get(cacheKey);
      
      if (cachedResult && !cachedResult.isStale) {
        console.log(`Cache hit (fresh): ${url}`);
        return {
          data: cachedResult.data,
          fromCache: true,
          isStale: false
        };
      }

      // Se offline e abbiamo dati stale, usali
      if (!this.isOnline && cachedResult) {
        console.log(`Cache hit (stale, offline): ${url}`);
        return {
          data: cachedResult.data,
          fromCache: true,
          isStale: true
        };
      }

      // Altrimenti fetch da network
      const networkResult = await this.fetchFromNetwork(url, options);
      
      // Salva in cache per future richieste
      await apiCache.set(cacheKey, networkResult.data, {
        ttl: strategy.ttl,
        endpoint: url,
        metadata: { strategy: strategy.strategy }
      });

      console.log(`Network fetch and cached: ${url}`);
      return {
        data: networkResult.data,
        fromCache: false,
        isStale: false
      };

    } catch (error) {
      // Se il network fallisce, prova la cache stale
      const cachedResult = await apiCache.get(cacheKey, { allowStale: true });
      
      if (cachedResult) {
        console.log(`Network failed, serving stale cache: ${url}`);
        return {
          data: cachedResult.data,
          fromCache: true,
          isStale: true,
          error: error.message
        };
      }

      throw error;
    }
  }

  /**
   * Strategia Network First: prova network prima, poi cache come fallback
   */
  async networkFirstStrategy(url, options, cacheKey, strategy) {
    try {
      if (!this.isOnline) {
        throw new Error('Offline');
      }

      const networkResult = await this.fetchFromNetwork(url, options);
      
      // Salva in cache
      await apiCache.set(cacheKey, networkResult.data, {
        ttl: strategy.ttl,
        endpoint: url,
        metadata: { strategy: strategy.strategy }
      });

      console.log(`Network first success: ${url}`);
      return {
        data: networkResult.data,
        fromCache: false,
        isStale: false
      };

    } catch (error) {
      // Network fallito, prova la cache
      const cachedResult = await apiCache.get(cacheKey, { allowStale: true });
      
      if (cachedResult) {
        console.log(`Network failed, serving cache: ${url}`);
        return {
          data: cachedResult.data,
          fromCache: true,
          isStale: cachedResult.isStale,
          error: error.message
        };
      }

      // Se anche la cache fallisce e supportiamo offline, aggiungi alla coda
      if (strategy.offlineSupport && !this.isOnline) {
        await apiCache.addToOfflineQueue({
          url,
          method: options.method || 'GET',
          headers: options.headers || {},
          body: options.body
        });
        
        throw new Error('Request queued for when online');
      }

      throw error;
    }
  }

  /**
   * Strategia Stale While Revalidate: restituisci cache immediatamente e aggiorna in background
   */
  async staleWhileRevalidateStrategy(url, options, cacheKey, strategy) {
    // Prima verifica se abbiamo dati in cache
    const cachedResult = await apiCache.get(cacheKey, { allowStale: true });
    
    if (cachedResult) {
      // Restituisci immediatamente i dati dalla cache
      const response = {
        data: cachedResult.data,
        fromCache: true,
        isStale: cachedResult.isStale
      };

      // Se i dati sono stale, aggiorna in background
      if (cachedResult.isStale && this.isOnline) {
        this.backgroundRevalidate(url, options, cacheKey, strategy);
      }

      console.log(`Stale while revalidate (cache): ${url}`);
      return response;
    }

    // Se non abbiamo cache, fetch normalmente
    try {
      const networkResult = await this.fetchFromNetwork(url, options);
      
      await apiCache.set(cacheKey, networkResult.data, {
        ttl: strategy.ttl,
        endpoint: url,
        metadata: { strategy: strategy.strategy }
      });

      console.log(`Stale while revalidate (network): ${url}`);
      return {
        data: networkResult.data,
        fromCache: false,
        isStale: false
      };

    } catch (error) {
      throw error;
    }
  }

  /**
   * Background revalidation per stale-while-revalidate
   */
  async backgroundRevalidate(url, options, cacheKey, strategy) {
    try {
      console.log(`Background revalidating: ${url}`);
      const networkResult = await this.fetchFromNetwork(url, options);
      
      await apiCache.set(cacheKey, networkResult.data, {
        ttl: strategy.ttl,
        endpoint: url,
        metadata: { 
          strategy: strategy.strategy,
          backgroundUpdate: true,
          timestamp: Date.now()
        }
      });

      // Emetti evento per notificare l'aggiornamento
      window.dispatchEvent(new CustomEvent('cache-updated', {
        detail: { url, cacheKey, data: networkResult.data }
      }));

    } catch (error) {
      console.warn(`Background revalidation failed for ${url}:`, error);
    }
  }

  /**
   * Strategia Cache Only: usa solo la cache
   */
  async cacheOnlyStrategy(cacheKey) {
    const cachedResult = await apiCache.get(cacheKey, { allowStale: true });
    
    if (cachedResult) {
      return {
        data: cachedResult.data,
        fromCache: true,
        isStale: cachedResult.isStale
      };
    }

    throw new Error('No cached data available');
  }

  /**
   * Strategia Network Only: bypassa sempre la cache
   */
  async networkOnlyStrategy(url, options) {
    const networkResult = await this.fetchFromNetwork(url, options);
    
    return {
      data: networkResult.data,
      fromCache: false,
      isStale: false
    };
  }

  /**
   * Gestisce richieste che modificano dati (POST, PUT, DELETE)
   */
  async handleMutatingRequest(url, options, strategy) {
    if (!this.isOnline) {
      // Se offline, aggiungi alla coda
      if (strategy.offlineSupport) {
        await apiCache.addToOfflineQueue({
          url,
          method: options.method,
          headers: options.headers || {},
          body: options.body
        });
        
        return {
          data: null,
          queued: true,
          message: 'Request queued for when online'
        };
      } else {
        throw new Error('Cannot perform this action while offline');
      }
    }

    try {
      const result = await this.fetchFromNetwork(url, options);
      
      // Invalida cache correlate dopo operazioni di modifica
      this.invalidateRelatedCache(url, options.method);
      
      return {
        data: result.data,
        fromCache: false
      };

    } catch (error) {
      throw error;
    }
  }

  /**
   * Invalida cache correlate dopo operazioni di modifica
   */
  async invalidateRelatedCache(url, method) {
    const patterns = this.getInvalidationPatterns(url, method);
    
    for (const pattern of patterns) {
      await apiCache.invalidate(pattern);
      console.log(`Invalidated cache for pattern: ${pattern}`);
    }
  }

  /**
   * Determina pattern di invalidazione basati sull'endpoint
   */
  getInvalidationPatterns(url, method) {
    const patterns = [];
    
    if (url.includes('/task')) {
      patterns.push('/api/task');
      patterns.push('/api/resource-planner');
    }
    
    if (url.includes('/personale')) {
      patterns.push('/api/personale');
      patterns.push('/api/resource-planner');
    }
    
    if (url.includes('/requests')) {
      patterns.push('/api/requests');
      patterns.push('/api/user');
    }
    
    if (url.includes('/eventi')) {
      patterns.push('/api/eventi');
      patterns.push('/api/calendar');
    }

    // Invalida sempre la cache dell'endpoint specifico
    patterns.push(url.split('?')[0]); // Rimuovi query parameters
    
    return patterns;
  }

  /**
   * Effettua il fetch reale dal network
   */
  async fetchFromNetwork(url, options) {
    const startTime = performance.now();
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const endTime = performance.now();
      
      // Log performance metrics
      console.log(`Network request completed: ${url} (${(endTime - startTime).toFixed(2)}ms)`);
      
      return { data, response };

    } catch (error) {
      const endTime = performance.now();
      console.error(`Network request failed: ${url} (${(endTime - startTime).toFixed(2)}ms)`, error);
      throw error;
    }
  }

  /**
   * Wrapper per integrare con axios o altri client HTTP
   */
  createAxiosInterceptor() {
    return {
      request: async (config) => {
        // Pre-request logic
        return config;
      },
      
      response: async (response) => {
        // Post-response logic
        return response;
      },
      
      error: async (error) => {
        // Error handling logic
        return Promise.reject(error);
      }
    };
  }
}

// Singleton instance
const cacheInterceptor = new CacheInterceptor();

/**
 * Setup cache interceptor su un'istanza Axios
 * @param {AxiosInstance} axiosInstance - Istanza Axios su cui applicare il cache interceptor
 */
export function setupCacheInterceptor(axiosInstance) {
  console.log('Setting up cache interceptor for Axios instance');
  
  const interceptor = cacheInterceptor.createAxiosInterceptor();
  
  // Applica gli interceptor request e response
  axiosInstance.interceptors.request.use(
    interceptor.request,
    interceptor.error
  );
  
  axiosInstance.interceptors.response.use(
    interceptor.response,
    interceptor.error
  );
  
  console.log('Cache interceptor setup completed');
  return axiosInstance;
}

export default cacheInterceptor;
