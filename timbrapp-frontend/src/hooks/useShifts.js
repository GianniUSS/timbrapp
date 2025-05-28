import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { format, parse } from 'date-fns';
import { getFromCache, saveToCache, isCacheValid } from '../utils/cacheUtils';

/**
 * Hook personalizzato per gestire i turni/shifts del calendario
 * @param {Array} selectedCommesse - Elenco degli ID delle commesse selezionate
 * @param {boolean} useCache - Se usare la cache o forzare sempre il caricamento da API
 * @returns {Object} - Stato e funzioni per gestire i turni
 */
export default function useShifts(selectedCommesse = [], useCache = true) {
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastFetched, setLastFetched] = useState(null);

  /**
   * Funzione per convertire un turno in un evento per il calendario
   * @param {Object} shift - Il turno da convertire
   * @returns {Object} - L'evento formattato per il calendario
   */  const mapShiftToEvent = useCallback((shift) => {
    try {
      // Verifichiamo se abbiamo una data valida prima di procedere
      if (!shift.date) {
        console.error('Turno senza data valida:', shift);
        return null;
      }
      
      // Standardizziamo il formato della data
      let dateStr = shift.date;
      if (dateStr.includes('T')) {
        dateStr = dateStr.split('T')[0];
      }
      
      // Ricaviamo l'orario di inizio e fine con valori predefiniti sicuri
      let startTimeStr = shift.startTime || '09:00';
      let endTimeStr = shift.endTime || '18:00';
      
      // Puliamo i formati dei tempi
      if (startTimeStr.includes('T')) {
        startTimeStr = startTimeStr.split('T')[1].substring(0, 5);
      }
      if (endTimeStr.includes('T')) {
        endTimeStr = endTimeStr.split('T')[1].substring(0, 5);
      }
      
      // Verifica che i tempi siano formattati correttamente (HH:mm)
      const timeRegex = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/;
      if (!timeRegex.test(startTimeStr)) {
        startTimeStr = '09:00';
      }
      if (!timeRegex.test(endTimeStr)) {
        endTimeStr = '18:00';
      }
      
      // Creiamo le date a partire dai componenti con controlli aggiuntivi
      let startDate, endDate;
      try {
        startDate = parse(`${dateStr} ${startTimeStr}`, 'yyyy-MM-dd HH:mm', new Date());
        if (isNaN(startDate.getTime())) throw new Error("Data di inizio invalida");
      } catch (e) {
        console.warn(`Formato data inizio non valido per turno [${shift.id}], uso data corrente + orario specifico`, e);
        // Fallback usando data corrente
        const today = format(new Date(), 'yyyy-MM-dd');
        startDate = parse(`${today} ${startTimeStr}`, 'yyyy-MM-dd HH:mm', new Date());
      }
      
      try {
        endDate = parse(`${dateStr} ${endTimeStr}`, 'yyyy-MM-dd HH:mm', new Date());
        if (isNaN(endDate.getTime())) throw new Error("Data di fine invalida");
      } catch (e) {
        console.warn(`Formato data fine non valido per turno [${shift.id}], uso data corrente + orario specifico`, e);
        // Fallback usando data corrente
        const today = format(new Date(), 'yyyy-MM-dd');
        endDate = parse(`${today} ${endTimeStr}`, 'yyyy-MM-dd HH:mm', new Date());
      }
      
      // Assicuriamo che l'ora di fine sia dopo l'ora di inizio
      if (endDate <= startDate) {
        // Se l'ora di fine è prima o uguale all'ora di inizio, impostiamo fine = inizio + 1 ora
        endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
      }
      
      return {
        id: shift.id,
        title: shift.user ? 
          `${shift.user.nome}${shift.role ? ' (' + shift.role + ')' : ''}${shift.commessa && shift.commessa.codice ? ' - ' + shift.commessa.codice : ''}` 
          : 'Utente sconosciuto',
        start: startDate,
        end: endDate,
        commessa: shift.commessa,
        task: shift.task,
        location: shift.location,
        user: shift.user,
        role: shift.role,
        startTime: shift.startTime,
        endTime: shift.endTime,
        date: shift.date,
        notes: shift.notes
      };
    } catch (error) {
      console.error('Errore nella conversione delle date per il turno:', shift, error);
      return null;
    }
  }, []);

  /**
   * Filtra gli eventi in base alle commesse selezionate
   * @param {Array} events - Tutti gli eventi disponibili
   * @returns {Array} - Eventi filtrati in base alle commesse selezionate
   */
  const filterEvents = useCallback((events) => {
    if (!events || events.length === 0) return [];
    if (!selectedCommesse || selectedCommesse.length === 0) return events;

    return events.filter(ev => {
      const commessaId = ev.commessa?.id;
      return commessaId && selectedCommesse.includes(commessaId);
    });
  }, [selectedCommesse]);

  /**
   * Carica i turni dal server o dalla cache
   * @param {boolean} forceRefresh - Se forzare il refresh anche con cache valida
   */
  const fetchShifts = useCallback(async (forceRefresh = false) => {
    // Se ci sono dati in cache validi e non è richiesto il refresh forzato
    if (useCache && !forceRefresh && isCacheValid('shifts')) {
      const cachedShifts = getFromCache('shifts');
      if (cachedShifts && Array.isArray(cachedShifts)) {
        setCalendarEvents(cachedShifts);
        return;
      }
    }
    
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Token non trovato. Effettua nuovamente il login.');
        setCalendarEvents([]);
        setLoading(false);
        return;
      }
      
      // Costruisci i parametri per la query
      const commesseIds = selectedCommesse.join(',');
      const queryParams = commesseIds ? `?commesse=${commesseIds}` : '';
      
      // Ottieni i turni dal server
      const shiftsRes = await api.get(`/api/shifts${queryParams}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
    // Converti i turni in eventi per il calendario
      const shifts = shiftsRes.data || [];
      
      // Logga le statistiche iniziali
      console.log(`Ricevuti ${shifts.length} turni dal server`);
      
      const validShifts = shifts.filter(shift => {
        if (!shift) return false;
        if (!shift.date) {
          console.warn('Turno senza data:', shift);
          return false;
        }
        return true;
      });
      
      console.log(`${validShifts.length} turni hanno una data valida`);
      
      const mapped = validShifts
        .map(shift => {
          const event = mapShiftToEvent(shift);
          if (!event) {
            console.warn('Impossibile mappare il turno:', shift);
          }
          return event;
        })
        .filter(ev => ev !== null); // Rimuovi i turni con date invalide
      
      console.log(`${mapped.length} turni sono stati mappati con successo in eventi del calendario`);
      
      // Salva in cache se opportuno
      if (useCache) {
        saveToCache('shifts', mapped, 30); // Conserva per 30 minuti
      }
      
      setCalendarEvents(mapped);
      setLastFetched(new Date());
    } catch (err) {
      console.error('Errore nel caricamento dei turni:', err);
      setError('Errore nel caricamento dei turni: ' + (err.message || 'Errore sconosciuto'));
      setCalendarEvents([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCommesse, mapShiftToEvent, useCache]);

  // Ricarica i turni quando cambiano le commesse selezionate
  useEffect(() => {
    fetchShifts();
  }, [selectedCommesse, fetchShifts]);

  return {
    calendarEvents,
    filteredEvents: filterEvents(calendarEvents),
    loading,
    error,
    fetchShifts,
    lastFetched
  };
}
