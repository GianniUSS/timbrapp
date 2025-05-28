// src/components/OfflineIndicator.js
import React, { useState, useEffect } from 'react';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import SyncIcon from '@mui/icons-material/Sync';
import { getOfflineTimbrature } from '../services/indexedDBService';

/**
 * Componente che mostra un indicatore quando l'app è offline
 * e mostra anche il numero di timbrature in attesa di sincronizzazione
 */
function OfflineIndicator() {
  const [showSnackbar, setShowSnackbar] = useState(true);
  const [showBanner, setShowBanner] = useState(false);
  const [offlineEntries, setOfflineEntries] = useState([]);
  
  // Carica il numero di timbrature offline
  useEffect(() => {
    const loadOfflineCount = async () => {
      try {
        const entries = await getOfflineTimbrature();
        setOfflineEntries(entries);
      } catch (err) {
        console.error('Errore caricamento timbrature offline:', err);
      }
    };
    
    // Carica all'inizio
    loadOfflineCount();
    
    // Imposta un intervallo per ricaricare periodicamente
    const interval = setInterval(loadOfflineCount, 10000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Gestisce la chiusura dello Snackbar
  const handleClose = (event, reason) => {
    if (reason === 'clickaway') return;
    setShowSnackbar(false);
    setShowBanner(true);
  };
  
  // Gestisce il clic sul pulsante "Sincronizza"
  const handleSync = () => {
    // Memorizziamo un flag per la sincronizzazione
    localStorage.setItem('sync_on_reconnect', 'true');
    alert('Le timbrature saranno sincronizzate quando tornerai online');
  };

  return null;
}

export default OfflineIndicator;