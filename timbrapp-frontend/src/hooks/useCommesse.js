import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';
import { getFromCache, saveToCache, isCacheValid } from '../utils/cacheUtils';

/**
 * Hook personalizzato per gestire il caricamento ottimizzato delle commesse
 * @param {boolean} useCache - Se usare la cache o forzare sempre il caricamento da API
 * @returns {Object} - Stato e funzioni per gestire le commesse
 */
export default function useCommesse(useCache = true) {
  const [commesse, setCommesse] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCommesse, setSelectedCommesse] = useState([]);
  const [expandedCommesse, setExpandedCommesse] = useState([]);
  const abortControllerRef = useRef(null);

  /**
   * Carica le commesse e i relativi tasks
   * @param {boolean} forceRefresh - Se forzare il refresh anche con cache valida
   */
  const fetchCommesse = useCallback(async (forceRefresh = false) => {
    // Controlla se ci sono dati in cache
    if (useCache && !forceRefresh && isCacheValid('commesse')) {
      const cachedData = getFromCache('commesse');
      setCommesse(cachedData);
      
      // Se nessuna commessa è selezionata, seleziona tutte le commesse per default
      if (selectedCommesse.length === 0 && cachedData.length > 0) {
        setSelectedCommesse(cachedData.map(c => c.id));
      }
      
      setLoading(false);
      return;
    }
    
    // Annulla richieste precedenti se in corso
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Crea un nuovo AbortController per questa richiesta
    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;
    
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Token non trovato. Effettua nuovamente il login.');
        setCommesse([]);
        setLoading(false);
        return;
      }
      
      // Ottieni tutte le commesse attive
      const commesseRes = await api.get('/api/commesse', {
        headers: { Authorization: `Bearer ${token}` },
        signal
      });
      
      let commesseWithTasks = [];
      
      try {
        // Per ogni commessa, carica i task associati (in parallelo)
        commesseWithTasks = await Promise.all(
          commesseRes.data.map(async (commessa) => {
            try {
              const tasksRes = await api.get(`/api/commesse/${commessa.id}/tasks`, {
                headers: { Authorization: `Bearer ${token}` },
                signal
              });
              
              // Verifica il formato e sanitizza i dati prima di restituirli
              let tasks = tasksRes.data || [];
              
              // Normalizza i valori dei task per evitare problemi di visualizzazione
              tasks = tasks.map(task => ({
                ...task,
                skills: task.skills ? (
                  typeof task.skills === 'string' ? 
                    JSON.parse(task.skills) : 
                    Array.isArray(task.skills) ? 
                      task.skills : 
                      []
                ) : [],
                durataPrevista: task.durataPrevista || null,
                numeroRisorse: task.numeroRisorse || 1,
                dataInizio: task.dataInizio || null,
                dataFine: task.dataFine || null
              }));
              
              return {
                ...commessa,
                tasks: tasks
              };
            } catch (err) {
              // Se c'è un errore nel caricamento dei task, ritorna la commessa con array vuoto
              console.error(`Errore nel caricamento dei task per la commessa ${commessa.id}:`, err);
              return {
                ...commessa,
                tasks: []
              };
            }
          })
        );
      } catch (taskError) {
        // Se c'è un errore nel Promise.all, usa le commesse senza task
        console.error('Errore durante il caricamento in parallelo dei task:', taskError);
        commesseWithTasks = commesseRes.data.map(commessa => ({
          ...commessa,
          tasks: []
        }));
      }
      
      // Aggiorna lo stato e salva in cache
      setCommesse(commesseWithTasks);
      if (useCache) {
        saveToCache('commesse', commesseWithTasks);
      }
      
      // Se nessuna commessa è selezionata, seleziona tutte le commesse per default
      if (selectedCommesse.length === 0 && commesseWithTasks.length > 0) {
        setSelectedCommesse(commesseWithTasks.map(c => c.id));
      }
      
    } catch (err) {
      // Ignora errori di abort (annullamento volontario)
      if (err.name !== 'AbortError' && err.message !== 'canceled') {
        console.error('Errore nel caricamento delle commesse:', err);
        setError('Errore nel caricamento delle commesse: ' + (err.message || err));
        setCommesse([]);
      } else {
        console.log('Richiesta annullata volontariamente');
      }
    } finally {
      // Solo se la richiesta non è stata annullata
      if (!signal || !signal.aborted) {
        setLoading(false);
      }
      abortControllerRef.current = null;
    }
  }, [useCache]);
  
  // Funzione per gestire la selezione/deselezione delle commesse
  const handleCommessaToggle = useCallback((commessaId) => {
    setSelectedCommesse(prev => {
      // Gestione casi speciali
      if (commessaId === 'select-all') {
        return commesse.map(c => c.id);
      }
      
      if (commessaId === 'deselect-all') {
        return [];
      }
      
      // Gestione normale toggle
      if (prev.includes(commessaId)) {
        return prev.filter(id => id !== commessaId);
      } else {
        return [...prev, commessaId];
      }
    });
  }, [commesse]);
  
  // Funzione per espandere/comprimere una commessa nella sidebar
  const handleCommessaExpand = useCallback((commessaId) => {
    setExpandedCommesse(prev => {
      if (prev.includes(commessaId)) {
        return prev.filter(id => id !== commessaId);
      } else {
        return [...prev, commessaId];
      }
    });
  }, []);
  
  // Funzione per gestire la selezione/deselezione di un task
  const handleTaskToggle = useCallback((taskId, commessaId) => {
    // Assicuriamoci che la commessa associata sia selezionata
    if (!selectedCommesse.includes(commessaId)) {
      handleCommessaToggle(commessaId);
    }
  }, [selectedCommesse, handleCommessaToggle]);
  
  // Carica le commesse all'avvio
  useEffect(() => {
    fetchCommesse();
    
    // Pulisci abort controller quando il componente viene smontato
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchCommesse]);
  
  return {
    commesse,
    loading,
    error,
    selectedCommesse,
    expandedCommesse,
    handleCommessaToggle,
    handleCommessaExpand,
    handleTaskToggle,
    fetchCommesse
  };
}
