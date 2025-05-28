// src/services/indexedDBService.js

// Costanti
const DB_NAME = 'TimbrAppOfflineDB';
const DB_VERSION = 1;
const TIMBRATURE_STORE = 'offlineTimbrature';
const REQUESTS_STORE = 'offlineRequests';
const CACHED_TIMBRATURE = 'cachedTimbrature';
const CACHED_REQUESTS = 'cachedRequests';

/**
 * Inizializza il database IndexedDB
 * @returns {Promise} Promise che si risolve quando il DB è pronto
 */
export function initDB() {
  return new Promise((resolve, reject) => {
    function openDB() {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      // Crea/aggiorna la struttura del database
      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Store per timbrature offline (in attesa di sincronizzazione)
        if (!db.objectStoreNames.contains(TIMBRATURE_STORE)) {
          db.createObjectStore(TIMBRATURE_STORE, { keyPath: 'id', autoIncrement: true });
        }

        // Store per richieste (ferie/permessi) offline
        if (!db.objectStoreNames.contains(REQUESTS_STORE)) {
          db.createObjectStore(REQUESTS_STORE, { keyPath: 'id', autoIncrement: true });
        }

        // Cache delle timbrature dal server
        if (!db.objectStoreNames.contains(CACHED_TIMBRATURE)) {
          const store = db.createObjectStore(CACHED_TIMBRATURE, { keyPath: 'id' });
          store.createIndex('userId', 'userId', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Cache delle richieste dal server
        if (!db.objectStoreNames.contains(CACHED_REQUESTS)) {
          const store = db.createObjectStore(CACHED_REQUESTS, { keyPath: 'id' });
          store.createIndex('userId', 'userId', { unique: false });
          store.createIndex('createdAt', 'createdAt', { unique: false });
        }
      };

      request.onsuccess = (event) => {
        console.log('IndexedDB inizializzato con successo');
        resolve(event.target.result);
      };

      request.onerror = (event) => {
        const error = event.target.error;
        console.error('Errore apertura IndexedDB:', error);
        // Se è un NotFoundError, elimina e ricrea il database
        if (error && error.name === 'NotFoundError') {
          console.warn('NotFoundError: elimino e ricreo il database IndexedDB');
          indexedDB.deleteDatabase(DB_NAME);
          setTimeout(openDB, 500); // Riprova dopo breve attesa
        } else {
          reject(error);
        }
      };
    }
    openDB();
  });
}

/**
 * Ottiene una connessione al database
 * @returns {Promise<IDBDatabase>} Database
 */
export function getDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onsuccess = (event) => {
      resolve(event.target.result);
    };
    
    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
}

/**
 * Salva una timbratura in locale quando siamo offline
 * @param {Object} timbratura Dati della timbratura
 * @param {string} token Token JWT di autorizzazione
 * @returns {Promise<Object>} Risultato dell'operazione
 */
export async function saveOfflineTimbratura(timbratura) {
  try {
    const db = await getDB();
    const tx = db.transaction(TIMBRATURE_STORE, 'readwrite');
    const store = tx.objectStore(TIMBRATURE_STORE);

    const token = localStorage.getItem('token');
    
    // Salta se non c'è token (utente non loggato)
    if (!token) {
      return { success: false, error: 'Utente non autenticato' };
    }
    
    const timeStamp = new Date().toISOString();
    
    // Dati da salvare in locale
    const data = {
      timbratura: {
        ...timbratura,
        timestamp: timeStamp, // Usiamo l'orario corrente
      },
      token,
      createdAt: timeStamp,
      synced: false
    };
    
    // Salvare nel database locale
    const id = await new Promise((resolve, reject) => {
      const addRequest = store.add(data);
      addRequest.onsuccess = () => resolve(addRequest.result);
      addRequest.onerror = () => reject(addRequest.error);
    });
    
    // Richiedi sincronizzazione quando torni online
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await registration.sync.register('sync-timbrature');
        console.log('Background sync per timbrature registrato');
      } catch (err) {
        console.error('Errore registrazione background sync:', err);
      }
    }
    
    return { 
      success: true, 
      id, 
      message: 'Timbratura salvata offline e verrà sincronizzata quando sarai online' 
    };
  } catch (error) {
    console.error('Errore salvataggio timbratura offline:', error);
    return { success: false, error: error.message || 'Errore sconosciuto' };
  }
}

/**
 * Ottiene la lista delle timbrature salvate offline
 * @returns {Promise<Array>} Lista timbrature offline
 */
export async function getOfflineTimbrature() {
  try {
    const db = await getDB();
    const tx = db.transaction(TIMBRATURE_STORE, 'readonly');
    const store = tx.objectStore(TIMBRATURE_STORE);
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Errore ottenimento timbrature offline:', error);
    return [];
  }
}

/**
 * Salva le timbrature ricevute dal server nella cache locale
 * @param {Array} timbrature Lista di timbrature dal server
 * @returns {Promise<boolean>} Risultato operazione
 */
export async function cacheServerTimbrature(timbrature) {
  if (!timbrature || !Array.isArray(timbrature)) return false;
  
  try {
    const db = await getDB();
    const tx = db.transaction(CACHED_TIMBRATURE, 'readwrite');
    const store = tx.objectStore(CACHED_TIMBRATURE);
    
    // Cancella la cache precedente
    await new Promise((resolve, reject) => {
      const clearRequest = store.clear();
      clearRequest.onsuccess = () => resolve();
      clearRequest.onerror = () => reject(clearRequest.error);
    });
    
    // Salva i nuovi dati
    for (const timbratura of timbrature) {
      await new Promise((resolve, reject) => {
        const addRequest = store.add(timbratura);
        addRequest.onsuccess = () => resolve();
        addRequest.onerror = () => resolve(); // Ignora errori duplicati
      });
    }
    
    return true;
  } catch (error) {
    console.error('Errore cache timbrature:', error);
    return false;
  }
}

/**
 * Ottiene le timbrature dalla cache locale
 * @returns {Promise<Array>} Lista timbrature dalla cache
 */
export async function getCachedTimbrature() {
  try {
    const db = await getDB();
    const tx = db.transaction(CACHED_TIMBRATURE, 'readonly');
    const store = tx.objectStore(CACHED_TIMBRATURE);
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Errore ottenimento cache timbrature:', error);
    return [];
  }
}

/**
 * Rimuove una timbratura dallo store offline dopo la sincronizzazione
 * @param {number} id ID della timbratura 
 * @returns {Promise<boolean>} Risultato operazione
 */
export async function removeOfflineTimbratura(id) {
  try {
    const db = await getDB();
    const tx = db.transaction(TIMBRATURE_STORE, 'readwrite');
    const store = tx.objectStore(TIMBRATURE_STORE);
    
    await new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
    
    return true;
  } catch (error) {
    console.error('Errore rimozione timbratura offline:', error);
    return false;
  }
}

/**
 * Controlla lo stato della connessione
 * @returns {boolean} true se online, false se offline
 */
export function isOnline() {
  return navigator.onLine;
}

/**
 * Salva una richiesta (ferie/permessi) in locale quando siamo offline
 * @param {Object} request Dati della richiesta
 * @returns {Promise<Object>} Risultato dell'operazione
 */
export async function saveOfflineRequest(request) {
  try {
    const db = await getDB();
    const tx = db.transaction(REQUESTS_STORE, 'readwrite');
    const store = tx.objectStore(REQUESTS_STORE);

    const token = localStorage.getItem('token');
    
    // Salta se non c'è token (utente non loggato)
    if (!token) {
      return { success: false, error: 'Utente non autenticato' };
    }
    
    const timeStamp = new Date().toISOString();
    
    // Dati da salvare in locale
    const data = {
      request: {
        ...request,
        createdAt: timeStamp,
      },
      token,
      createdAt: timeStamp,
      synced: false
    };
    
    // Salvare nel database locale
    const id = await new Promise((resolve, reject) => {
      const addRequest = store.add(data);
      addRequest.onsuccess = () => resolve(addRequest.result);
      addRequest.onerror = () => reject(addRequest.error);
    });
    
    // Richiedi sincronizzazione quando torni online
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await registration.sync.register('sync-requests');
        console.log('Background sync per richieste registrato');
      } catch (err) {
        console.error('Errore registrazione background sync:', err);
      }
    }
    
    return { 
      success: true, 
      id, 
      message: 'Richiesta salvata offline e verrà sincronizzata quando sarai online' 
    };
  } catch (error) {
    console.error('Errore salvataggio richiesta offline:', error);
    return { success: false, error: error.message || 'Errore sconosciuto' };
  }
}

/**
 * Sincronizza le timbrature offline con il server
 * @param {Object} apiInstance Istanza axios per le chiamate API
 * @returns {Promise<Object>} Risultato della sincronizzazione
 */
export async function syncOfflineData(apiInstance) {
  try {
    const db = await getDB();
    const tx = db.transaction(TIMBRATURE_STORE, 'readonly');
    const store = tx.objectStore(TIMBRATURE_STORE);
    
    // Ottieni tutte le timbrature offline
    const offlineTimbrature = await new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    
    if (offlineTimbrature.length === 0) {
      console.log('Nessuna timbratura da sincronizzare');
      return { success: true, syncedCount: 0 };
    }
    
    console.log(`Sincronizzazione di ${offlineTimbrature.length} timbrature...`);
    
    // Prepara i dati per la sincronizzazione
    const syncData = offlineTimbrature.map(item => ({
      id: item.id,
      type: item.timbratura.type,
      timestamp: item.timbratura.timestamp,
      lat: item.timbratura.lat,
      lon: item.timbratura.lon,
      createdOffline: true
    }));
    
    // Invia i dati al server
    // Usa l'istanza API passata o un fetch diretto
    let syncResults;
    
    if (apiInstance) {
      // Usa l'istanza di axios se disponibile
      try {
        const response = await apiInstance.post('/api/sync', { pendingEntries: syncData });
        syncResults = response.data.results;
      } catch (error) {
        console.error('Errore chiamata API sync:', error);
        return { success: false, error: 'Errore di rete' };
      }
    } else {
      // Fallback a fetch diretto
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          return { success: false, error: 'Token non disponibile' };
        }
        
        const response = await fetch('/api/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ pendingEntries: syncData })
        });
        
        if (!response.ok) {
          throw new Error(`Server error: ${response.status}`);
        }
        
        const data = await response.json();
        syncResults = data.results;
      } catch (error) {
        console.error('Errore fetch sync:', error);
        return { success: false, error: 'Errore di rete' };
      }
    }
    
    // Se non abbiamo risultati, qualcosa è andato storto
    if (!syncResults || !Array.isArray(syncResults)) {
      return { success: false, error: 'Risposta server non valida' };
    }
    
    // Processa i risultati e rimuovi le timbrature sincronizzate
    let syncedCount = 0;
    
    for (const result of syncResults) {
      if (result.success) {
        // Rimuovi la timbratura dallo store offline
        await removeOfflineTimbratura(result.id);
        syncedCount++;
      } else {
        console.warn(`Sincronizzazione fallita per timbratura ${result.id}: ${result.error}`);
      }
    }
    
    console.log(`Sincronizzate ${syncedCount} timbrature con successo`);
    
    return { 
      success: true, 
      syncedCount,
      totalCount: offlineTimbrature.length,
      failedCount: offlineTimbrature.length - syncedCount
    };
  } catch (error) {
    console.error('Errore sincronizzazione:', error);
    return { success: false, error: error.message || 'Errore sconosciuto' };
  }
}

/**
 * Sincronizza una singola timbratura offline
 * @param {number} id ID della timbratura offline
 * @param {Object} apiInstance Istanza axios per le chiamate API
 * @returns {Promise<Object>} Risultato sincronizzazione
 */
export async function syncSingleTimbratura(id, apiInstance) {
  try {
    const db = await getDB();
    const tx = db.transaction(TIMBRATURE_STORE, 'readonly');
    const store = tx.objectStore(TIMBRATURE_STORE);
    
    const item = await new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    
    if (!item) {
      return { success: false, error: 'Timbratura non trovata' };
    }
    
    // Invia al server
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        return { success: false, error: 'Token non disponibile' };
      }
      
      let response;
      
      if (apiInstance) {
        response = await apiInstance.post('/timbrature', item.timbratura);
      } else {
        const fetchResponse = await fetch('/timbrature', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(item.timbratura)
        });
        
        if (!fetchResponse.ok) {
          throw new Error(`Server error: ${fetchResponse.status}`);
        }
        
        response = await fetchResponse.json();
      }
      
      // Se arriva qui, la sincronizzazione è riuscita
      await removeOfflineTimbratura(id);
      
      return { success: true, serverId: response.id };
    } catch (error) {
      console.error('Errore sincronizzazione timbratura:', error);
      return { success: false, error: error.message || 'Errore di rete' };
    }
  } catch (error) {
    console.error('Errore accesso IndexedDB:', error);
    return { success: false, error: error.message || 'Errore database locale' };
  }
}

/**
 * Verifica lo stato della connessione di rete
 * Utilizzando sia navigator.onLine che una richiesta di test
 * @returns {Promise<boolean>} True se online, false se offline
 */
export async function checkNetworkStatus() {
  // Prima verifica navigator.onLine (non sempre affidabile)
  if (!navigator.onLine) {
    return false;
  }
  
  // Se navigator.onLine è true, facciamo una richiesta di test
  // per verificare effettivamente la connettività
  try {
    // Prova a recuperare un piccolo file statico
    // Aggiungi un parametro casuale per evitare la cache
    const testUrl = `/api/health?nocache=${Date.now()}`;
    
    // Impostazione timeout di 5 secondi
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(testUrl, { 
      method: 'HEAD',
      signal: controller.signal,
      // Cache-control: no-store per evitare cache
      headers: { 'Cache-Control': 'no-store' }
    });
    
    // Pulisci il timeout
    clearTimeout(timeoutId);
    
    // Se la risposta è ok, siamo online
    return response.ok;
  } catch (error) {
    // Se c'è un errore nella fetch, considera offline
    console.log('Errore nel controllo connessione:', error.name);
    
    // Se l'errore è solo per AbortController, potremmo essere online ma con latenza alta
    if (error.name === 'AbortError') {
      console.log('Timeout nella verifica connessione');
    }
    
    return false;
  }
}

/**
 * Funzione alternativa che utilizza una richiesta a un endpoint esterno
 * Da usare se l'endpoint /api/health non è disponibile
 * @returns {Promise<boolean>} True se online, false se offline
 */
export async function checkNetworkStatusExternal() {
  if (!navigator.onLine) {
    return false;
  }
  
  try {
    // Utilizziamo un endpoint esterno piccolo e veloce
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch('https://www.google.com/generate_204', {
      method: 'HEAD',
      signal: controller.signal,
      mode: 'no-cors' // Importante per richieste cross-origin
    });
    
    clearTimeout(timeoutId);
    
    // Con no-cors, non possiamo leggere response.ok, quindi
    // consideriamo ogni risposta come successo
    return true;
  } catch (error) {
    console.log('Errore nel controllo connessione (esterno):', error.name);
    return false;
  }
}

/**
 * Registra una richiesta di sincronizzazione in background
 * Questa funzione dovrebbe essere chiamata dopo ogni operazione offline
 * @returns {Promise<boolean>} True se la registrazione ha avuto successo
 */
export async function requestBackgroundSync() {
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    try {
      // Attendi che il service worker sia pronto
      const registration = await navigator.serviceWorker.ready;
      
      // Registra l'evento di sincronizzazione
      await registration.sync.register('sync-timbrature');
      console.log('Background sync richiesto');
      return true;
    } catch (error) {
      console.error('Errore nella richiesta di background sync:', error);
      return false;
    }
  } else {
    console.log('Background Sync non supportato');
    return false;
  }
}

/**
 * Tenta di sincronizzare periodicamente tramite polling
 * @param {Object} apiInstance Istanza API (axios)
 * @param {number} intervalMs Intervallo di polling in millisecondi
 * @returns {Object} Controller per iniziare/fermare il polling
 */
export function createSyncPoller(apiInstance, intervalMs = 30000) {
  let timerId = null;
  let isRunning = false;
  
  // Funzione che esegue la sincronizzazione
  const performSync = async () => {
    try {
      // Verifica che ci siano dati da sincronizzare
      const db = await getDB();
      const tx = db.transaction(TIMBRATURE_STORE, 'readonly');
      const store = tx.objectStore(TIMBRATURE_STORE);
      
      const count = await new Promise((resolve) => {
        const countRequest = store.count();
        countRequest.onsuccess = () => resolve(countRequest.result);
        countRequest.onerror = () => resolve(0);
      });
      
      if (count > 0) {
        console.log(`Tentativo di sincronizzazione automatica: ${count} timbrature in attesa`);
        await syncOfflineData(apiInstance);
      }
    } catch (error) {
      console.error('Errore durante la sincronizzazione automatica:', error);
    }
  };
  
  // Controlli del poller
  return {
    // Avvia il polling
    start() {
      if (isRunning) return;
      
      console.log(`Avvio sincronizzazione automatica ogni ${intervalMs/1000} secondi`);
      timerId = setInterval(performSync, intervalMs);
      isRunning = true;
      
      // Esegui subito la prima sincronizzazione
      performSync();
    },
    
    // Ferma il polling
    stop() {
      if (!isRunning) return;
      
      clearInterval(timerId);
      timerId = null;
      isRunning = false;
      console.log('Sincronizzazione automatica disattivata');
    },
    
    // Stato corrente
    isRunning() {
      return isRunning;
    },
    
    // Forza una sincronizzazione immediata
    sync() {
      return performSync();
    }
  };
}