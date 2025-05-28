import { useState, useEffect } from 'react';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  async function checkFullOnlineStatus() {
    if (!navigator.onLine) {
      setIsOnline(false);
      return;
    }
    try {
      // Prova a raggiungere il server solo se navigator.onLine è true
      const res = await fetch('/api/health', { method: 'HEAD', cache: 'no-store' });
      setIsOnline(res.ok);
    } catch {
      setIsOnline(false);
    }
  }

  useEffect(() => {
    const handleOnline = () => {
      // Quando torni online, verifica davvero la connessione
      checkFullOnlineStatus();
    };
    const handleOffline = () => {
      // Quando perdi la connessione, aggiorna subito
      setIsOnline(false);
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    // Poll ogni 10s per maggiore reattività
    const interval = setInterval(checkFullOnlineStatus, 10000);
    // Controllo iniziale
    checkFullOnlineStatus();
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  return isOnline;
}
