// src/serviceWorkerRegistration.js

// Controllo localhost
const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
  window.location.hostname === '[::1]' ||
  window.location.hostname.match(
    /^127(?:\.(?:25[0-5]|2[0-4]\d|[01]?\d?\d)){3}$/
  )
);

// Flag per evitare registrazioni multiple
let serviceWorkerRegistered = false;

export function register(config) {
  if (serviceWorkerRegistered) {
    console.log('Service Worker già registrato, skip');
    return;
  }

  if ('serviceWorker' in navigator) {
    serviceWorkerRegistered = true;
    // Utilizziamo il service worker standalone che non richiede import
    const swUrl = `${process.env.PUBLIC_URL}/service-worker-standalone.js`;
    
    // Imposta timeout più lungo per iOS
    const registerOptions = {
      scope: '/',
      updateViaCache: 'none'  // Forza il controllo degli aggiornamenti
    };

    window.addEventListener('load', () => {
      if (isLocalhost) {
        // Sviluppo locale
        fetch(swUrl)
          .then(response => {
            if (response.status === 404 ||
                response.headers.get('content-type').indexOf('javascript') === -1) {
              console.warn('Service Worker non trovato o non valido');
              navigator.serviceWorker.ready.then(reg => reg.unregister());
            } else {
              navigator.serviceWorker
                .register(swUrl, registerOptions)
                .then(registration => {
                  console.log('SW registrato con scope:', registration.scope);
                  if (registration.waiting) {
                    if (config && config.onUpdate) config.onUpdate(registration);
                  }
                  registration.onupdatefound = () => {
                    const installingWorker = registration.installing;
                    installingWorker.onstatechange = () => {
                      if (installingWorker.state === 'installed') {
                        if (navigator.serviceWorker.controller) {
                          if (config && config.onUpdate) config.onUpdate(registration);
                        } else {
                          if (config && config.onSuccess) config.onSuccess(registration);
                        }
                      }
                    };
                  };
                })
                .catch(error => {
                  console.error('SW registration failed:', error);
                });
            }
          })
          .catch(() => {
            console.log('No internet connection. SW non registrato.');
          });
      } else {
        // Ambiente di produzione
        // Ambiente di produzione
        navigator.serviceWorker
          .register(swUrl, registerOptions)
          .then(registration => {
            console.log('SW registrato con scope:', registration.scope);
            if (registration.waiting) {
              if (config && config.onUpdate) config.onUpdate(registration);
            }
            registration.onupdatefound = () => {
              const installingWorker = registration.installing;
              installingWorker.onstatechange = () => {
                if (installingWorker.state === 'installed') {
                  if (navigator.serviceWorker.controller) {
                    console.log('Nuovo Service Worker in attesa di attivazione');
                    if (config && config.onUpdate) config.onUpdate(registration);
                  } else {
                    console.log('Content is cached for offline use.');
                    if (config && config.onSuccess) config.onSuccess(registration);
                  }
                }
              };
            };
          })
          .catch(error => {
            console.error('SW registration failed:', error);
          });
      }
    });
  }
}

export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(registration => {
      registration.unregister();
    });
  }
}
