// hooks/usePrefetch.js
import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Hook personalizzato per il prefetching intelligente delle risorse
 * Gestisce il caricamento anticipato di dati basato su pattern di utilizzo
 */
export const usePrefetch = () => {
  const [prefetchCache, setPrefetchCache] = useState(new Map());
  const [isPrefetching, setIsPrefetching] = useState(false);
  const prefetchQueue = useRef([]);
  const isProcessingQueue = useRef(false);

  // Funzione per aggiungere un elemento alla coda di prefetch
  const addToPrefetchQueue = useCallback((prefetchFn, key, priority = 1) => {
    if (!prefetchCache.has(key)) {
      prefetchQueue.current.push({ 
        fn: prefetchFn, 
        key, 
        priority,
        timestamp: Date.now()
      });
      
      // Ordina per priorità (più alta = prima)
      prefetchQueue.current.sort((a, b) => b.priority - a.priority);
    }
  }, [prefetchCache]);

  // Processa la coda di prefetch
  const processPrefetchQueue = useCallback(async () => {
    if (isProcessingQueue.current || prefetchQueue.current.length === 0) {
      return;
    }

    isProcessingQueue.current = true;
    setIsPrefetching(true);

    try {
      // Processa fino a 3 elementi alla volta per non sovraccaricare la rete
      const batch = prefetchQueue.current.splice(0, 3);
      
      const promises = batch.map(async (item) => {
        try {
          const data = await item.fn();
          setPrefetchCache(prev => new Map(prev).set(item.key, {
            data,
            timestamp: Date.now(),
            expires: Date.now() + (30 * 60 * 1000) // Cache per 30 minuti
          }));
          return { success: true, key: item.key };
        } catch (error) {
          console.warn(`Prefetch failed for ${item.key}:`, error);
          return { success: false, key: item.key, error };
        }
      });

      await Promise.allSettled(promises);
      
      // Continua a processare se ci sono altri elementi
      if (prefetchQueue.current.length > 0) {
        setTimeout(processPrefetchQueue, 100); // Piccolo delay tra i batch
      }
    } finally {
      isProcessingQueue.current = false;
      setIsPrefetching(prefetchQueue.current.length > 0);
    }
  }, []);

  // Effetto per iniziare il processing della coda quando necessario
  useEffect(() => {
    if (prefetchQueue.current.length > 0 && !isProcessingQueue.current) {
      const timer = setTimeout(processPrefetchQueue, 50);
      return () => clearTimeout(timer);
    }
  }, [processPrefetchQueue]);

  // Funzione per ottenere dati dalla cache o dal prefetch
  const getCachedData = useCallback((key) => {
    const cached = prefetchCache.get(key);
    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }
    return null;
  }, [prefetchCache]);

  // Pulisci cache scaduta ogni 5 minuti
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      setPrefetchCache(prev => {
        const newCache = new Map();
        for (const [key, value] of prev.entries()) {
          if (value.expires > now) {
            newCache.set(key, value);
          }
        }
        return newCache;
      });
    }, 5 * 60 * 1000);

    return () => clearInterval(cleanupInterval);
  }, []);

  // Prefetch intelligente basato sui pattern di navigazione
  const intelligentPrefetch = useCallback((currentRoute, userActions = []) => {
    // Pattern comuni di navigazione dell'applicazione
    const navigationPatterns = {
      '/dashboard': [
        () => import('../api').then(api => api.task.getAll()),
        () => import('../api').then(api => api.personale.getAll()),
      ],
      '/requests': [
        () => import('../api').then(api => api.requests.getAll()),
        () => import('../api').then(api => api.requests.getByUser()),
      ],
      '/events': [
        () => import('../api').then(api => api.eventi.getAll()),
        () => import('../api').then(api => api.calendar.getEvents()),
      ],
      '/resource-planner': [
        () => import('../api').then(api => api.personale.getAll()),
        () => import('../api').then(api => api.task.getAll()),
        () => import('../api').then(api => api.funzioniSkill.getAllFunzioni()),
        () => import('../api').then(api => api.funzioniSkill.getAllSkill()),
      ]
    };

    // Azioni che suggeriscono prefetching
    const actionBasedPrefetch = {
      'hover_task_card': () => import('../api').then(api => api.task.getDetails()),
      'hover_user_menu': () => import('../api').then(api => api.user.getProfile()),
      'open_calendar': () => import('../api').then(api => api.calendar.getEvents()),
    };

    // Prefetch basato sulla route corrente
    if (navigationPatterns[currentRoute]) {
      navigationPatterns[currentRoute].forEach((prefetchFn, index) => {
        addToPrefetchQueue(
          prefetchFn, 
          `${currentRoute}_${index}`, 
          3 // Alta priorità per dati della route corrente
        );
      });
    }

    // Prefetch basato sulle azioni dell'utente
    userActions.forEach(action => {
      if (actionBasedPrefetch[action.type]) {
        addToPrefetchQueue(
          () => actionBasedPrefetch[action.type](action.params),
          `action_${action.type}_${action.timestamp}`,
          2 // Media priorità per azioni utente
        );
      }
    });

    // Avvia il processing se non è già in corso
    if (!isProcessingQueue.current) {
      processPrefetchQueue();
    }
  }, [addToPrefetchQueue, processPrefetchQueue]);

  // Prefetch condizionale (solo quando la connessione è buona)
  const conditionalPrefetch = useCallback((prefetchFn, key, condition = true) => {
    if (condition && 'connection' in navigator) {
      const connection = navigator.connection;
      // Prefetch solo con connessioni buone (4G, WiFi, ecc.)
      const isGoodConnection = connection.effectiveType === '4g' || 
                              connection.type === 'wifi' ||
                              connection.downlink > 2;
      
      if (isGoodConnection) {
        addToPrefetchQueue(prefetchFn, key, 1);
      }
    } else if (condition) {
      // Fallback per browser che non supportano Network Information API
      addToPrefetchQueue(prefetchFn, key, 1);
    }
  }, [addToPrefetchQueue]);

  return {
    prefetch: addToPrefetchQueue,
    getCachedData,
    intelligentPrefetch,
    conditionalPrefetch,
    isPrefetching,
    cacheSize: prefetchCache.size,
    clearCache: () => setPrefetchCache(new Map())
  };
};

/**
 * Hook per prefetching specifico dei dati TimbrApp
 */
export const useTimbrAppPrefetch = () => {
  const { prefetch, getCachedData, intelligentPrefetch, conditionalPrefetch } = usePrefetch();

  // Prefetch specifici per TimbrApp
  const prefetchTasks = useCallback((commessaId = null) => {
    const key = commessaId ? `tasks_commessa_${commessaId}` : 'tasks_all';
    conditionalPrefetch(
      async () => {
        const api = await import('../api');
        return commessaId ? 
          api.default.task.getByCommessa(commessaId) : 
          api.default.task.getAll();
      },
      key
    );
  }, [conditionalPrefetch]);

  const prefetchPersonnel = useCallback(() => {
    conditionalPrefetch(
      async () => {
        const api = await import('../api');
        return api.default.personale.getAll();
      },
      'personnel_all'
    );
  }, [conditionalPrefetch]);

  const prefetchUserRequests = useCallback((userId) => {
    conditionalPrefetch(
      async () => {
        const api = await import('../api');
        return api.default.requests.getByUser(userId);
      },
      `requests_user_${userId}`
    );
  }, [conditionalPrefetch]);

  const prefetchCalendarEvents = useCallback((startDate, endDate) => {
    const key = `calendar_${startDate}_${endDate}`;
    conditionalPrefetch(
      async () => {
        const api = await import('../api');
        return api.default.calendar.getEvents(startDate, endDate);
      },
      key
    );
  }, [conditionalPrefetch]);

  const prefetchSkillsAndFunctions = useCallback(() => {
    prefetch(
      async () => {
        const api = await import('../api');
        const [funzioni, skills] = await Promise.all([
          api.default.funzioniSkill.getAllFunzioni(),
          api.default.funzioniSkill.getAllSkill()
        ]);
        return { funzioni: funzioni.data, skills: skills.data };
      },
      'skills_and_functions',
      2 // Media priorità
    );
  }, [prefetch]);
  return {
    prefetchTasks,
    prefetchPersonnel,
    prefetchUserRequests,
    prefetchCalendarEvents,
    prefetchSkillsAndFunctions,
    getCachedData,
    intelligentPrefetch
  };
};
