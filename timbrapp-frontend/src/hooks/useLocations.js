import { useState, useCallback, useEffect } from 'react';
import api from '../services/api';

/**
 * Hook personalizzato per gestire le operazioni sulle location
 * @returns {Object} - Funzioni e stati per gestire le location
 */
export default function useLocations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [locations, setLocations] = useState([]);
  /**
   * Carica tutte le locations dal server
   */
  const fetchLocations = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token non trovato. Effettua nuovamente il login.');
      }
      // Carica tutte le location direttamente
      const response = await api.get('/api/locations', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLocations(response.data || []);
    } catch (err) {
      console.error('Errore nel caricamento delle location:', err);
      setError('Errore nel caricamento delle location: ' + (err.message || 'Errore sconosciuto'));
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Aggiunge una nuova location a una commessa
   * @param {number} commessaId - ID della commessa
   * @param {Object} locationData - Dati della nuova location
   * @returns {Promise<Object>} - La location creata
   */
  const addLocation = useCallback(async (commessaId, locationData) => {
    setLoading(true);
    setError(null);
    setSuccessMessage('');
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token non trovato. Effettua nuovamente il login.');
      }
      
      // Costruisci l'oggetto location completo
      const location = {
        ...locationData,
        commessaId
      };
      
      // Invia la richiesta al server
      const response = await api.post('/api/locations', location, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSuccessMessage('Location creata con successo');
      return response.data;
    } catch (err) {
      setError('Errore nella creazione della location: ' + (err.message || 'Errore sconosciuto'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Elimina una location
   * @param {number} locationId - ID della location da eliminare
   * @returns {Promise<void>}
   */
  const deleteLocation = useCallback(async (locationId) => {
    setLoading(true);
    setError(null);
    setSuccessMessage('');
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token non trovato. Effettua nuovamente il login.');
      }
      
      // Invia la richiesta di eliminazione
      await api.delete(`/api/locations/${locationId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSuccessMessage('Location eliminata con successo');
    } catch (err) {
      setError('Errore nell\'eliminazione della location: ' + (err.message || 'Errore sconosciuto'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Aggiorna una location esistente
   * @param {number} locationId - ID della location da aggiornare
   * @param {Object} locationData - Nuovi dati della location
   * @returns {Promise<Object>} - La location aggiornata
   */
  const updateLocation = useCallback(async (locationId, locationData) => {
    setLoading(true);
    setError(null);
    setSuccessMessage('');
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token non trovato. Effettua nuovamente il login.');
      }
      
      // Invia la richiesta di aggiornamento
      const response = await api.put(`/api/locations/${locationId}`, locationData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSuccessMessage('Location aggiornata con successo');
      return response.data;
    } catch (err) {
      setError('Errore nell\'aggiornamento della location: ' + (err.message || 'Errore sconosciuto'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Recupera tutte le location per una commessa
   * @param {number} commessaId - ID della commessa
   * @returns {Promise<Array>} - Elenco delle location
   */
  const getLocationsByCommessa = useCallback(async (commessaId) => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token non trovato. Effettua nuovamente il login.');
      }
      
      // Ottieni le location per la commessa
      const response = await api.get(`/api/commesse/${commessaId}/locations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      return response.data || [];
    } catch (err) {
      setError('Errore nel recupero delle location: ' + (err.message || 'Errore sconosciuto'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);
  return {
    locations,
    loading,
    error,
    successMessage,
    addLocation,
    deleteLocation,
    updateLocation,
    getLocationsByCommessa,
    fetchLocations,
    clearMessages: () => {
      setError(null);
      setSuccessMessage('');
    }
  };
}
