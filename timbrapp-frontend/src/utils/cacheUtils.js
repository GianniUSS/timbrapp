/**
 * Utility per gestione della cache locale e ottimizzazione delle prestazioni
 */

// Cache delle commesse con validità temporale
const CACHE_DURATION = 5 * 60 * 1000; // 5 minuti in millisecondi

// Struttura della cache
let cache = {
  commesse: {
    data: null,
    timestamp: null
  },
  version: {
    data: null,
    timestamp: null
  }
};

/**
 * Controlla se i dati nella cache sono ancora validi
 * @param {string} key - Chiave della cache da controllare
 * @returns {boolean} - true se i dati sono validi, false altrimenti
 */
export function isCacheValid(key) {
  if (!cache[key] || !cache[key].timestamp || !cache[key].data) {
    return false;
  }
  
  const now = Date.now();
  return (now - cache[key].timestamp) < CACHE_DURATION;
}

/**
 * Ottiene i dati dalla cache
 * @param {string} key - Chiave della cache da cui ottenere i dati
 * @returns {any} - I dati memorizzati o null se non presenti/validi
 */
export function getFromCache(key) {
  if (isCacheValid(key)) {
    return cache[key].data;
  }
  return null;
}

/**
 * Salva i dati nella cache
 * @param {string} key - Chiave della cache
 * @param {any} data - Dati da memorizzare
 */
export function saveToCache(key, data) {
  cache[key] = {
    data,
    timestamp: Date.now()
  };
}

/**
 * Invalida la cache per una specifica chiave o tutta la cache
 * @param {string} [key] - Chiave della cache da invalidare (se omesso, invalida tutta la cache)
 */
export function invalidateCache(key) {
  if (key && cache[key]) {
    cache[key] = {
      data: null,
      timestamp: null
    };
  } else if (!key) {
    // Invalida tutta la cache
    Object.keys(cache).forEach(cacheKey => {
      cache[cacheKey] = {
        data: null,
        timestamp: null
      };
    });
  }
}

/**
 * Ottimizza le chiamate ripetute a funzioni intensive
 * @param {Function} fn - Funzione da memoizzare
 * @returns {Function} - Versione memoizzata della funzione
 */
export function memoize(fn) {
  const cache = new Map();
  
  return function(...args) {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
}

/**
 * Implementa una funzione di debounce che limita la frequenza delle chiamate a una funzione
 * @param {Function} func - La funzione da eseguire
 * @param {number} wait - Il tempo di attesa in millisecondi
 * @param {boolean} immediate - Se true, esegue la funzione immediatamente anziché alla fine del timeout
 * @returns {Function} - La funzione con debounce
 */
export function debounce(func, wait = 300, immediate = false) {
  let timeout;
  
  return function executedFunction(...args) {
    const context = this;
    
    const later = function() {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };
    
    const callNow = immediate && !timeout;
    
    clearTimeout(timeout);
    
    timeout = setTimeout(later, wait);
    
    if (callNow) func.apply(context, args);
  };
}

/**
 * Esegue il prefetch delle risorse importanti
 * @param {Array} urls - Array di URL da precaricare
 */
export function prefetchResources(urls) {
  if (!urls || !Array.isArray(urls)) return;
  
  urls.forEach(url => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;
    document.head.appendChild(link);
  });
}
