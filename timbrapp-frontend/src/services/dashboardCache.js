// Servizio di caching per i dati frequentemente utilizzati nella dashboard
class DashboardCache {
  constructor() {
    this.cache = new Map();
    this.timeouts = new Map();
    this.defaultExpiration = 5 * 60 * 1000; // 5 minuti di default
  }

  // Imposta un valore nella cache con scadenza opzionale
  set(key, value, expiration = this.defaultExpiration) {
    // Elimina eventuali vecchi timer
    if (this.timeouts.has(key)) {
      clearTimeout(this.timeouts.get(key));
      this.timeouts.delete(key);
    }

    // Imposta il nuovo valore
    this.cache.set(key, value);

    // Imposta un nuovo timer per la scadenza
    if (expiration > 0) {
      const timeout = setTimeout(() => {
        this.cache.delete(key);
        this.timeouts.delete(key);
      }, expiration);
      this.timeouts.set(key, timeout);
    }
  }

  // Ottiene un valore dalla cache (o null se non esiste)
  get(key) {
    return this.cache.has(key) ? this.cache.get(key) : null;
  }

  // Elimina un valore dalla cache
  delete(key) {
    if (this.timeouts.has(key)) {
      clearTimeout(this.timeouts.get(key));
      this.timeouts.delete(key);
    }
    this.cache.delete(key);
  }

  // Verifica se esiste un valore nella cache
  has(key) {
    return this.cache.has(key);
  }

  // Cancella tutta la cache
  clear() {
    // Cancella tutti i timeout
    for (const timeout of this.timeouts.values()) {
      clearTimeout(timeout);
    }
    this.timeouts.clear();
    this.cache.clear();
  }

  // Crea una chiave per dati dei turni basata su data inizio/fine
  createShiftsKey(dateFrom, dateTo) {
    return `shifts_${dateFrom}_${dateTo}`;
  }
}

// Singleton
const dashboardCache = new DashboardCache();
export default dashboardCache;
