import { useState, useCallback, useEffect } from 'react';
import api from '../services/api';

/**
 * Hook personalizzato per gestire le operazioni sui task
 * @returns {Object} - Funzioni e stati per gestire i task
 */
export default function useTasks() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [tasks, setTasks] = useState([]);
  /**
   * Carica tutti i task dal server
   */
  const fetchTasks = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token non trovato. Effettua nuovamente il login.');
      }
      
      // Ottieni tutte le commesse
      console.log('Chiamata API per recuperare commesse e poi i task: /api/commesse');
      const commesseResponse = await api.get('/api/commesse', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const commesse = commesseResponse.data || [];
      
      // Ottenere tutti i task per ogni commessa
      const allTasks = [];
      
      // Per ogni commessa, ottieni i task associati
      for (const commessa of commesse) {
        try {
          console.log(`Chiamata API per recuperare task per commessa ${commessa.id}: /api/commesse/${commessa.id}/tasks`);
          const tasksResponse = await api.get(`/api/commesse/${commessa.id}/tasks`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          const commessaTasks = tasksResponse.data || [];
          allTasks.push(...commessaTasks);
        } catch (err) {
          console.error(`Errore nel recupero dei task per la commessa ${commessa.id}:`, err);
        }
      }
      
      console.log('Tutti i task caricati:', allTasks);
      setTasks(allTasks);
    } catch (err) {
      console.error('Errore nel caricamento dei task:', err);
      setError('Errore nel caricamento dei task: ' + (err.message || 'Errore sconosciuto'));
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Aggiunge un nuovo task a una commessa
   * @param {number} commessaId - ID della commessa
   * @param {Object} taskData - Dati del nuovo task
   * @returns {Promise<Object>} - Il task creato
   */
  const addTask = useCallback(async (commessaId, taskData) => {
    setLoading(true);
    setError(null);
    setSuccessMessage('');
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token non trovato. Effettua nuovamente il login.');
      }
      
      // Costruisci l'oggetto task completo
      const task = {
        ...taskData,
        commessaId
      };
      
      // Invia la richiesta al server
      const response = await api.post('/api/tasks', task, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSuccessMessage('Task creato con successo');
      return response.data;
    } catch (err) {
      setError('Errore nella creazione del task: ' + (err.message || 'Errore sconosciuto'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Elimina un task
   * @param {number} taskId - ID del task da eliminare
   * @returns {Promise<void>}
   */
  const deleteTask = useCallback(async (taskId) => {
    setLoading(true);
    setError(null);
    setSuccessMessage('');
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token non trovato. Effettua nuovamente il login.');
      }
      
      // Invia la richiesta di eliminazione
      await api.delete(`/api/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSuccessMessage('Task eliminato con successo');
    } catch (err) {
      setError('Errore nell\'eliminazione del task: ' + (err.message || 'Errore sconosciuto'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Aggiorna un task esistente
   * @param {number} taskId - ID del task da aggiornare
   * @param {Object} taskData - Nuovi dati del task
   * @returns {Promise<Object>} - Il task aggiornato
   */
  const updateTask = useCallback(async (taskId, taskData) => {
    setLoading(true);
    setError(null);
    setSuccessMessage('');
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token non trovato. Effettua nuovamente il login.');
      }
      
      // Invia la richiesta di aggiornamento
      const response = await api.put(`/api/tasks/${taskId}`, taskData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSuccessMessage('Task aggiornato con successo');
      return response.data;
    } catch (err) {
      setError('Errore nell\'aggiornamento del task: ' + (err.message || 'Errore sconosciuto'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Attiva o disattiva un task
   * @param {number} taskId - ID del task
   * @param {boolean} isActive - Se il task deve essere attivo o disattivo
   * @returns {Promise<Object>} - Il task aggiornato
   */
  const toggleTaskStatus = useCallback(async (taskId, isActive) => {
    setLoading(true);
    setError(null);
    setSuccessMessage('');
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token non trovato. Effettua nuovamente il login.');
      }
      
      // Invia la richiesta di aggiornamento stato
      const response = await api.patch(`/api/tasks/${taskId}/status`, { 
        stato: isActive ? 'attivo' : 'disattivo' 
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSuccessMessage(`Task ${isActive ? 'attivato' : 'disattivato'} con successo`);
      return response.data;
    } catch (err) {
      setError(`Errore nella modifica dello stato del task: ${err.message || 'Errore sconosciuto'}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);
  return {
    tasks,
    loading,
    error,
    successMessage,
    addTask,
    deleteTask,
    updateTask,
    toggleTaskStatus,
    fetchTasks,
    clearMessages: () => {
      setError(null);
      setSuccessMessage('');
    }
  };
}
