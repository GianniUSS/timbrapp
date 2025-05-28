/**
 * Utility per la gestione avanzata del Service Worker
 */

/**
 * Stati del Service Worker
 */
export const SW_STATUS = {
  PENDING: 'pending',
  INSTALLED: 'installed',
  ACTIVATED: 'activated',
  REDUNDANT: 'redundant',
  ERROR: 'error',
  UPDATE_AVAILABLE: 'update-available',
  UP_TO_DATE: 'up-to-date',
  OFFLINE_READY: 'offline-ready',
  UNSUPPORTED: 'unsupported'
};

/**
 * Gestione dello stato del Service Worker con callback configurabili
 */
export class ServiceWorkerManager {
  constructor() {
    this.registration = null;
    this.status = SW_STATUS.PENDING;
    this.isUpdateAvailable = false;
    this.callbacks = {
      onSuccess: () => {},
      onUpdate: () => {},
      onError: () => {},
      onOfflineReady: () => {},
      onControllerChange: () => {}
    };
  }
  
  /**
   * Registra i callback per eventi del Service Worker
   * @param {Object} callbacks - Oggetto con i callback 
   */
  registerCallbacks(callbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }
  
  /**
   * Inizializza il Service Worker con gestione migliorata degli stati
   */  initialize() {
    if ('serviceWorker' in navigator) {
      try {
        // Usa lo stesso percorso del service worker standalone
        // per evitare conflitti di registrazione
        const swUrl = `${process.env.PUBLIC_URL}/service-worker-standalone.js`;
        navigator.serviceWorker.register(swUrl)
          .then(registration => {
            this.registration = registration;
            this.checkInitialState(registration);
            
            // Gestisce eventi di installazione
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing;
              if (newWorker) {
                this.trackWorkerState(newWorker);
              }
            });
            
            // Gestisce eventi di cambio controller
            if (navigator.serviceWorker.controller) {
              this.status = SW_STATUS.ACTIVATED;
              
              navigator.serviceWorker.addEventListener('controllerchange', () => {
                this.callbacks.onControllerChange();
              });
            }
          })
          .catch(error => {
            this.status = SW_STATUS.ERROR;
            this.callbacks.onError(error);
          });
      } catch (error) {
        this.status = SW_STATUS.ERROR;
        this.callbacks.onError(error);
      }
    } else {
      this.status = SW_STATUS.UNSUPPORTED;
      this.callbacks.onError(new Error('Service Worker non supportato'));
    }
  }
  
  /**
   * Controlla lo stato iniziale del Service Worker
   * @param {ServiceWorkerRegistration} registration 
   */
  checkInitialState(registration) {
    if (registration.waiting) {
      // L'aggiornamento è in attesa di attivazione
      this.isUpdateAvailable = true;
      this.status = SW_STATUS.UPDATE_AVAILABLE;
      this.callbacks.onUpdate(registration);
      return;
    }
    
    if (registration.active) {
      this.status = SW_STATUS.ACTIVATED;
      this.callbacks.onSuccess(registration);
      
      // Verifica aggiornamenti
      registration.update().catch(error => {
        console.error('Errore durante il controllo aggiornamenti:', error);
      });
    }
  }
  
  /**
   * Monitora i cambi di stato del Service Worker
   * @param {ServiceWorker} worker - Istanza worker da monitorare
   */
  trackWorkerState(worker) {
    worker.addEventListener('statechange', () => {
      switch (worker.state) {
        case 'installed':
          if (navigator.serviceWorker.controller) {
            // C'è un nuovo Service Worker in attesa
            this.isUpdateAvailable = true;
            this.status = SW_STATUS.UPDATE_AVAILABLE;
            this.callbacks.onUpdate(this.registration);
          } else {
            // Prima installazione completata
            this.status = SW_STATUS.INSTALLED;
            this.callbacks.onSuccess(this.registration);
            this.callbacks.onOfflineReady();
          }
          break;
          
        case 'activated':
          this.status = SW_STATUS.ACTIVATED;
          this.callbacks.onSuccess(this.registration);
          break;
          
        case 'redundant':
          this.status = SW_STATUS.REDUNDANT;
          this.callbacks.onError(new Error('Service worker diventato redundant'));
          break;
      }
    });
  }
  
  /**
   * Forza l'aggiornamento del Service Worker
   * @returns {Promise}
   */
  async update() {
    if (!this.registration) {
      throw new Error('Service Worker non registrato');
    }
    
    try {
      await this.registration.update();
      return this.status === SW_STATUS.UPDATE_AVAILABLE;
    } catch (error) {
      this.callbacks.onError(error);
      throw error;
    }
  }
  
  /**
   * Applica l'aggiornamento quando disponibile
   */
  applyUpdate() {
    if (this.registration && this.registration.waiting) {
      // Invia messaggio SKIP_WAITING al service worker in attesa
      this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    } else {
      throw new Error('Nessun aggiornamento disponibile');
    }
  }
  
  /**
   * Controlla se l'app è pronta per funzionare offline
   * @returns {boolean}
   */
  isOfflineReady() {
    return this.status === SW_STATUS.ACTIVATED || this.status === SW_STATUS.OFFLINE_READY;
  }
}

export const swManager = new ServiceWorkerManager();

/**
 * Funzione per agevolare l'inizializzazione del Service Worker
 * @param {Object} callbacks - Callbacks per eventi del SW 
 */
export function initializeServiceWorker(callbacks = {}) {
  swManager.registerCallbacks(callbacks);
  swManager.initialize();
  return swManager;
}
