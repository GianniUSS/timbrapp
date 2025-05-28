import { useState, useEffect, useCallback } from 'react';
import api from '../api';
import {
  initDB,
  saveOfflineTimbratura,
  getOfflineTimbrature,
  getCachedTimbrature,
  cacheServerTimbrature,
  syncOfflineData as syncOfflineDataService
} from '../services/indexedDBService';

export function useTimbrature(showSnackbar, isNetworkOnline) {
  const [entries, setEntries] = useState([]);
  const [offlineEntries, setOfflineEntries] = useState([]);
  const [entriesSource, setEntriesSource] = useState('server');
  const [syncInProgress, setSyncInProgress] = useState(false);
  const [clockedIn, setClockedIn] = useState(false);
  const [onBreak, setOnBreak] = useState(false);
  const [mode, setMode] = useState('start');

  // Inizializza DB e listener online/offline
  useEffect(() => {
    initDB().catch(err => console.error('Errore inizializzazione DB:', err));
    return () => {
      // RIMOSSO: window.removeEventListener('online', handleOnline);
      // RIMOSSO: window.removeEventListener('offline', handleOffline);
    };
    // eslint-disable-next-line
  }, []);
  // --- FUNZIONI HOISTATE ---  
  const getTodayEntries = useCallback((all) => {
    // Verifica che 'all' sia un array valido per evitare errori
    if (!all || !Array.isArray(all)) return [];
    
    const today = new Date();
    const todayDate = today.toLocaleDateString('it-IT', { timeZone: 'Europe/Rome' });
    
    return all.filter(
      e => new Date(e.timestamp).toLocaleDateString('it-IT', { timeZone: 'Europe/Rome' }) === todayDate
    );
  }, []);
  const formatTime = useCallback((ts) => {
    if (!ts) return '—';
    try {
      return new Date(ts).toLocaleTimeString('it-IT', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Europe/Rome'
      });
    } catch (err) {
      console.error('Errore nel formattare il timestamp:', err);
      return '—';
    }
  }, []);
  const getTodayEntryByType = useCallback((type) => {
    // Creo un array sicuramente valido unendo entries e offlineEntries
    const combinedEntries = Array.isArray(entries) ? entries : [];
    const validOfflineEntries = Array.isArray(offlineEntries) ? offlineEntries : [];
    
    const todayEntries = getTodayEntries([...combinedEntries, ...validOfflineEntries]);
    
    // Assicuriamoci che todayEntries sia un array prima di filtrarlo
    if (!Array.isArray(todayEntries)) return '—';
    
    const typeEntries = todayEntries.filter(e => e.type === type);
    return typeEntries.length > 0 ? formatTime(typeEntries[0].timestamp) : '—';
  }, [entries, offlineEntries, getTodayEntries]);

  function updateStateFromEntries(allEntries) {
    const todayEntries = getTodayEntries(allEntries);
    if (todayEntries.length > 0) {
      const lastEntry = todayEntries[todayEntries.length - 1];
      if (lastEntry.type === 'start') {
        setClockedIn(true);
        setOnBreak(false);
        setMode('end');
      } else if (lastEntry.type === 'end') {
        setClockedIn(false);
        setOnBreak(false);
        setMode('start');
      } else if (lastEntry.type === 'break_start') {
        setClockedIn(true);
        setOnBreak(true);
        setMode('break_end');
      } else if (lastEntry.type === 'break_end') {
        setClockedIn(true);
        setOnBreak(false);
        setMode('end');
      }
    } else {
      setClockedIn(false);
      setOnBreak(false);
      setMode('start');
    }
  }

  async function loadOfflineEntries() {
    try {
      const offline = await getOfflineTimbrature();
      const formattedOffline = offline.map(item => ({
        ...item.timbratura,
        offlineId: item.id,
        isOffline: true
      }));
      setOfflineEntries(formattedOffline);
    } catch (err) {
      console.error('Errore caricamento timbrature offline:', err);
    }
  }

  async function loadCachedEntries() {
    try {
      const cached = await getCachedTimbrature();
      if (cached && cached.length > 0) {
        setEntries(cached);
        setEntriesSource('cache');
        updateStateFromEntries(cached);
        showSnackbar && showSnackbar('Dati caricati dalla cache locale', 'info');
      } else {
        showSnackbar && showSnackbar('Nessun dato disponibile nella cache', 'warning');
      }
      await loadOfflineEntries();
    } catch (err) {
      console.error('Errore caricamento cache:', err);
      showSnackbar && showSnackbar('Errore caricamento dati dalla cache', 'error');
    }
  }

  async function loadEntries() {
    if (!isNetworkOnline) { // usa la variabile reattiva
      return loadCachedEntries();
    }
    try {
      const res = await api.get('/timbrature');
      setEntries(res.data);
      setEntriesSource('server');
      await cacheServerTimbrature(res.data);
      updateStateFromEntries(res.data);
      await loadOfflineEntries();
    } catch (err) {
      console.error('Errore caricamento timbrature:', err);
      showSnackbar && showSnackbar('Errore caricamento timbrature', 'error');
      loadCachedEntries();
    }
  }

  async function syncOfflineData() {
    try {
      if (syncInProgress) return;
      setSyncInProgress(true);
      const offline = await getOfflineTimbrature();
      if (offline.length === 0) {
        setSyncInProgress(false);
        return;
      }
      showSnackbar && showSnackbar(`Sincronizzazione di ${offline.length} timbrature in corso...`, 'info');
      const result = await syncOfflineDataService(api);
      if (result.success) {
        if (result.syncedCount > 0) {
          showSnackbar && showSnackbar(`${result.syncedCount} timbrature sincronizzate con successo`, 'success');
          await loadEntries();
        } else if (result.totalCount > 0) {
          showSnackbar && showSnackbar(`${result.failedCount} timbrature non sincronizzate`, 'warning');
        }
      } else {
        showSnackbar && showSnackbar(`Errore sincronizzazione: ${result.error}`, 'error');
      }
      await loadOfflineEntries();
      setSyncInProgress(false);
    } catch (err) {
      console.error('Errore sincronizzazione dati offline:', err);
      showSnackbar && showSnackbar('Errore sincronizzazione dati', 'error');
      setSyncInProgress(false);
    }
  }

  // Azioni clock/break
  const handleClockAction = useCallback(() => {
    if (onBreak) {
      showSnackbar && showSnackbar('Devi terminare la pausa prima di fare Clock Out', 'warning');
      return;
    }
    const punchType = clockedIn ? 'end' : 'start';
    handlePunch(punchType);
  }, [clockedIn, onBreak, isNetworkOnline]);

  const handleBreakAction = useCallback(() => {
    if (!clockedIn) {
      showSnackbar && showSnackbar('Devi fare Clock In prima di iniziare una pausa', 'warning');
      return;
    }
    const punchType = onBreak ? 'break_end' : 'break_start';
    handlePunch(punchType);
  }, [clockedIn, onBreak, isNetworkOnline]);

  // Gestione punch (clock/break)
  const handlePunch = useCallback((punchType) => {
    // DEBUG: Mostra sempre lo stato della rete al click
    console.log('[DEBUG] handlePunch - isNetworkOnline:', isNetworkOnline, '| punchType:', punchType);
    showSnackbar && showSnackbar(`[DEBUG] Stato rete: ${isNetworkOnline ? 'ONLINE' : 'OFFLINE'}`, 'info');
    if (isNetworkOnline) {
      navigator.geolocation.getCurrentPosition(
        async pos => {
          const { latitude: lat, longitude: lon } = pos.coords;
          try {
            await api.post('/timbrature', { type: punchType, lat, lon });
            if (punchType === 'start') {
              setClockedIn(true);
              setOnBreak(false);
              setMode('end');
              showSnackbar && showSnackbar('Timbratura entrata registrata', 'success');
            } else if (punchType === 'end') {
              setClockedIn(false);
              setOnBreak(false);
              setMode('start');
              showSnackbar && showSnackbar('Timbratura uscita registrata', 'success');
            } else if (punchType === 'break_start') {
              setOnBreak(true);
              setMode('break_end');
              showSnackbar && showSnackbar('Inizio pausa registrato', 'success');
            } else if (punchType === 'break_end') {
              setOnBreak(false);
              setMode('end');
              showSnackbar && showSnackbar('Fine pausa registrato', 'success');
            }
            setTimeout(loadEntries, 500);
          } catch (err) {
            console.error('Errore invio timbratura:', err);
            showSnackbar && showSnackbar('Errore invio timbratura al server', 'error');
          }
        },
        () => showSnackbar && showSnackbar('Impossibile ottenere la posizione', 'error'),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      navigator.geolocation.getCurrentPosition(
        async pos => {
          const { latitude: lat, longitude: lon } = pos.coords;
          const timbratura = { type: punchType, lat, lon };
          const result = await saveOfflineTimbratura(timbratura);
          if (result.success) {
            showSnackbar && showSnackbar(`Timbratura offline salvata! (${punchType})`, 'success');
            console.log('Timbratura offline salvata:', timbratura);
            if (punchType === 'start') {
              setClockedIn(true);
              setOnBreak(false);
              setMode('end');
            } else if (punchType === 'end') {
              setClockedIn(false);
              setOnBreak(false);
              setMode('start');
            } else if (punchType === 'break_start') {
              setOnBreak(true);
              setMode('break_end');
            } else if (punchType === 'break_end') {
              setOnBreak(false);
              setMode('end');
            }
            showSnackbar && showSnackbar(`Timbratura offline salvata. ${result.message}`, 'success');
            await loadOfflineEntries();
          } else {
            showSnackbar && showSnackbar(`Errore salvataggio offline: ${result.error}`, 'error');
            console.error('Errore salvataggio timbratura offline:', result.error);
          }
        },
        () => showSnackbar && showSnackbar('Impossibile ottenere la posizione', 'error'),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  }, [isNetworkOnline, showSnackbar]);

  useEffect(() => {
    loadEntries();
    // eslint-disable-next-line
  }, []);

  return {
    entries,
    offlineEntries,
    entriesSource,
    // isNetworkOnline, // RIMOSSO
    syncOfflineData,
    clockedIn,
    onBreak,
    mode,
    getTodayEntries,
    getTodayEntryByType,
    handleClockAction,
    handleBreakAction
  };
}
