// src/pages/Requests.js
// Modifica solo le parti essenziali per risolvere il problema dell'indicatore offline

import React, { useState, useEffect } from 'react';
// Ottimizzazione Material-UI Tree Shaking - Import specifici
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Grid from '@mui/material/Grid';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import api from '../api';
import OfflineIndicator from '../components/OfflineIndicator';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import { isOnline, saveOfflineRequest } from '../services/indexedDBService';

const RequestTypes = [
  { value: 'ferie', label: 'Ferie' },
  { value: 'permesso', label: 'Permesso' },
  { value: 'sts', label: 'STS' },
];

const RequestStatus = {
  pending: { label: 'In attesa', color: 'warning' },
  approved: { label: 'Approvata', color: 'success' },
  rejected: { label: 'Respinta', color: 'error' },
  offline: { label: 'Offline', color: 'error' }
};

function Requests() {
  const [requests, setRequests] = useState([]);
  const [offlineRequests, setOfflineRequests] = useState([]);
  const [type, setType] = useState('ferie');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  
  // Inizializza lo stato della rete allo stesso modo di Dashboard
  const [isNetworkOnline, setIsNetworkOnline] = useState(navigator.onLine);
  const [dataSource, setDataSource] = useState('server');
  
  // Snackbar helpers
  const showSnackbar = (message, severity = 'info') => 
    setSnackbar({ open: true, message, severity });
  const handleCloseSnackbar = () => 
    setSnackbar(prev => ({ ...prev, open: false }));

  // Monitor online/offline status
  useEffect(() => {
    // Mostra un messaggio iniziale se l'app è offline
    if (!navigator.onLine) {
      showSnackbar('Sei offline. Lavorerai in modalità offline.', 'warning');
    } else {
      showSnackbar('Sei online. Sincronizzazione in corso...', 'success');
    }

    // Gestione eventi online/offline allo stesso modo di Dashboard
    const handleOnline = () => {
      console.log('🌐 Connessione disponibile');
      setIsNetworkOnline(true);
      showSnackbar('Connessione ripristinata. Sincronizzazione in corso...', 'success');
      loadRequests();
    };
    
    const handleOffline = () => {
      console.log('⚠️ Connessione persa');
      setIsNetworkOnline(false);
      showSnackbar('Connessione persa. Sei offline.', 'warning');
    };

    // Aggiungi listener per gli eventi online/offline
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Imposta lo stato iniziale
    setIsNetworkOnline(navigator.onLine);

    return () => {
      // Rimuovi i listener quando il componente viene smontato
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Carica le richieste
  const loadRequests = async () => {
    if (!navigator.onLine) {
      // Se offline, usa i dati dalla cache
      showSnackbar('Sei offline. Mostro dati dalla cache locale.', 'warning');
      setDataSource('cache');
      
      // Carica dati dalla cache localStorage
      const cachedRequests = localStorage.getItem('cachedRequests');
      if (cachedRequests) {
        setRequests(JSON.parse(cachedRequests));
      }
      
      return;
    }
    
    try {
      const res = await api.get('/api/requests');
      // Garantisce array anche se res.data non è un array
      const data = Array.isArray(res.data) ? res.data : (Array.isArray(res.data.requests) ? res.data.requests : []);
      setRequests(data);
      setDataSource('server');
      // Cache dei dati array per uso offline
      localStorage.setItem('cachedRequests', JSON.stringify(data));
    } catch (err) {
      console.error('Errore caricamento richieste:', err);
      showSnackbar('Errore caricamento richieste', 'error');

      // Prova a usare i dati dalla cache
      const cached = localStorage.getItem('cachedRequests');
      if (cached) {
        const parsed = JSON.parse(cached);
        setRequests(Array.isArray(parsed) ? parsed : []);
        setDataSource('cache');
        showSnackbar('Mostro dati dalla cache locale', 'info');
      }
    }
    
    // Carica richieste offline
    try {
      // Qui dovresti caricare le richieste salvate offline
      // Per semplicità simuliamo con un array vuoto
      setOfflineRequests([]);
    } catch (err) {
      console.error('Errore caricamento richieste offline:', err);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  // Gestione del form
  const resetForm = () => {
    setType('ferie');
    setStartDate(new Date());
    setEndDate(new Date());
    setNote('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Formatta le date in formato ISO
    const formattedStartDate = format(startDate, 'yyyy-MM-dd');
    const formattedEndDate = format(endDate, 'yyyy-MM-dd');
    
    const requestData = {
      type,
      startDate: formattedStartDate,
      endDate: formattedEndDate,
      note
    };
    
    // Usiamo navigator.onLine per verificare lo stato della rete
    if (navigator.onLine) {
      // Online submission
      try {
        const res = await api.post('/api/requests', requestData);
        showSnackbar('Richiesta inviata con successo', 'success');
        resetForm();
        loadRequests();
      } catch (err) {
        console.error('Errore invio richiesta:', err);
        showSnackbar('Errore invio richiesta', 'error');
      }
    } else {
      // Offline submission
      try {
        const result = await saveOfflineRequest(requestData);
        
        if (result.success) {
          showSnackbar(`Richiesta salvata offline. ${result.message}`, 'success');
          resetForm();
          
          // Aggiorna la lista delle richieste offline
          const newOfflineRequest = {
            id: `offline-${result.id}`,
            ...requestData,
            status: 'offline',
            isOffline: true,
            createdAt: new Date().toISOString()
          };
          
          setOfflineRequests(prev => [newOfflineRequest, ...prev]);
        } else {
          showSnackbar(`Errore: ${result.error}`, 'error');
        }
      } catch (error) {
        console.error('Errore salvataggio offline:', error);
        showSnackbar('Errore salvataggio richiesta offline', 'error');
      }
    }
    
    setIsSubmitting(false);
  };

  // Formato data per la tabella
  const formatDateForDisplay = (dateString) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: it });
    } catch (e) {
      return dateString;
    }
  };

  // Trovare label dal valore
  const getTypeLabel = (typeValue) => {
    const found = RequestTypes.find(t => t.value === typeValue);
    return found ? found.label : typeValue;
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={it}>
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        bgcolor: '#f5f5f5',
        overflow: 'hidden',
        position: 'relative',
        height: '100vh',
      }}>
        {/* Spazio per AppBar fissa (80/90px) */}
        <Box sx={{ height: { xs: '80px', sm: '90px' } }} />
        {/* Sezione centrale scrollabile e coerente */}
        <Container
          maxWidth="sm"
          disableGutters
          sx={{
            flex: 1,
            pt: 'env(safe-area-inset-top, 0px)',
            pb: 'env(safe-area-inset-bottom, 0px)',
            px: { xs: 2, sm: 0 },
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            height: {
              xs: 'calc(100vh - 80px - 64px - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px))',
              sm: 'calc(100vh - 90px - 72px - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px))',
            },
            minHeight: 0,
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          {/* Card: Header richieste */}
          <Box sx={{ bgcolor: 'white', borderRadius: 3, boxShadow: 2, p: 2, mb: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>Richieste Ferie e Permessi</Typography>
            <Box display="flex" alignItems="center">
              {!isNetworkOnline && (
                <Tooltip title="Modalità offline - Le richieste verranno sincronizzate quando sarai online">
                  <Chip
                    icon={<WifiOffIcon />}
                    label="Offline"
                    color="error"
                    size="small"
                    sx={{ mr: 1, fontWeight: 'bold' }}
                  />
                </Tooltip>
              )}
            </Box>
          </Box>
          {/* Card: Alert offline/cache */}
          {(!isNetworkOnline || (dataSource === 'cache' && isNetworkOnline)) && (
            <Box sx={{ bgcolor: 'white', borderRadius: 3, boxShadow: 2, p: 2, mb: 1 }}>
              {!isNetworkOnline && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  Sei offline. Le richieste verranno salvate localmente e sincronizzate quando tornerai online.
                </Alert>
              )}
              {dataSource === 'cache' && isNetworkOnline && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  Dati caricati dalla cache locale.
                  <Button 
                    size="small" 
                    color="info" 
                    sx={{ ml: 2 }} 
                    onClick={loadRequests}
                  >
                    Ricarica
                  </Button>
                </Alert>
              )}
            </Box>
          )}
          {/* Card: Nuova richiesta */}
          <Box sx={{ bgcolor: 'white', borderRadius: 3, boxShadow: 2, p: 2, mb: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>Nuova richiesta</Typography>
            <form onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <TextField
                    select
                    label="Tipo richiesta"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    fullWidth
                    required
                  >
                    {RequestTypes.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={it}>
                    <DatePicker
                      label="Data inizio"
                      value={startDate}
                      onChange={setStartDate}
                      slotProps={{ textField: { fullWidth: true, required: true } }}
                    />
                  </LocalizationProvider>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={it}>
                    <DatePicker
                      label="Data fine"
                      value={endDate}
                      onChange={setEndDate}
                      slotProps={{ textField: { fullWidth: true, required: true } }}
                      minDate={startDate}
                    />
                  </LocalizationProvider>
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    label="Note (opzionale)"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    fullWidth
                    multiline
                    rows={3}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Invio in corso...' : 'Invia Richiesta'}
                    {!isNetworkOnline && ' (Offline)'}
                  </Button>
                </Grid>
              </Grid>
            </form>
          </Box>
          {/* Card: Tabella richieste */}
          <Box sx={{ bgcolor: 'white', borderRadius: 3, boxShadow: 2, p: 2, mb: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>Storico richieste</Typography>
            <TableContainer component={Paper} sx={{ boxShadow: 'none' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Tipo</TableCell>
                    <TableCell>Inizio</TableCell>
                    <TableCell>Fine</TableCell>
                    <TableCell>Note</TableCell>
                    <TableCell>Stato</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {/* Mostra prima le richieste offline */}
                  {offlineRequests.map((req) => (
                    <TableRow key={req.id} sx={{ bgcolor: 'rgba(255, 244, 229, 0.25)' }}>
                      <TableCell>{getTypeLabel(req.type)}</TableCell>
                      <TableCell>{formatDateForDisplay(req.startDate)}</TableCell>
                      <TableCell>{formatDateForDisplay(req.endDate)}</TableCell>
                      <TableCell>{req.note || '-'}</TableCell>
                      <TableCell>
                        <Chip
                          label="In attesa di sincronizzazione"
                          color="warning"
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                  
                  {/* Poi mostra le richieste dal server */}
                  {Array.isArray(requests) && requests.map((req) => (
                    <TableRow key={req.id}>
                      <TableCell>{getTypeLabel(req.type)}</TableCell>
                      <TableCell>{formatDateForDisplay(req.startDate)}</TableCell>
                      <TableCell>{formatDateForDisplay(req.endDate)}</TableCell>
                      <TableCell>{req.note || '-'}</TableCell>
                      <TableCell>
                        <Chip
                          label={RequestStatus[req.status]?.label || req.status}
                          color={RequestStatus[req.status]?.color || 'default'}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                  
                  {((!Array.isArray(requests) || requests.length === 0) && offlineRequests.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        Nessuna richiesta presente.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          <Snackbar
            open={snackbar.open}
            autoHideDuration={6000}
            onClose={handleCloseSnackbar}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          >
            <Alert
              onClose={handleCloseSnackbar}
              severity={snackbar.severity}
              sx={{ width: '100%' }}
            >
              {snackbar.message}
            </Alert>
          </Snackbar>
        </Container>
      </Box>
    </LocalizationProvider>
  );
}

export default Requests;