import React, { useEffect, useState, useCallback } from 'react';
import {
  Typography, Box, Chip, Button, IconButton,
  AppBar, Toolbar, Drawer, ListItemIcon, ListItemText, Menu, MenuItem,
  CircularProgress, Snackbar, Alert, TextField, Dialog, DialogTitle,
  DialogContent, DialogActions, Divider, List, ListItem, Paper, Link,
  Tabs, Tab, Grid, Avatar
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import LogoutIcon from '@mui/icons-material/Logout';
import RefreshIcon from '@mui/icons-material/Refresh';
import AddIcon from '@mui/icons-material/Add';
import TaskIcon from '@mui/icons-material/Task';
import InfoIcon from '@mui/icons-material/Info';
import WifiIcon from '@mui/icons-material/Wifi';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import BugReportIcon from '@mui/icons-material/BugReport';
import UpdateIcon from '@mui/icons-material/Update';
import MemoryIcon from '@mui/icons-material/Memory';
import EventIcon from '@mui/icons-material/Event';
import PeopleIcon from '@mui/icons-material/People';
import ErrorBoundary from '../components/ErrorBoundary';
import api from '../services/api';
import { formatBytes, getNetworkInfo } from '../utils/diagnostics';
import OptimizedCommesseTreeView from '../components/OptimizedCommesseTreeView';
import ShiftPlanner from '../components/ShiftPlanner';
import useCommesse from '../hooks/useCommesse';
import { swManager, initializeServiceWorker } from '../utils/serviceWorkerManager';
import { debounce } from '../utils/cacheUtils';

// --- PALETTE COLORI PER CATEGORIE ---
const CATEGORY_COLORS = [
  '#388e3c', // verde
  '#1976d2', // blu
  '#fbc02d', // giallo
  '#d32f2f', // rosso
  '#8e24aa', // viola
  '#ff9800', // arancione
  '#0097a7', // azzurro
  '#7b1fa2', // viola scuro
];

export default function DashboardWebOttimizzata() {
  // Hook personalizzato per gestire le commesse in modo ottimizzato
  const {
    commesse,
    loading: commesseLoading,
    error: commesseError,
    selectedCommesse,
    expandedCommesse,
    handleCommessaToggle,
    handleCommessaExpand,
    handleTaskToggle,
    fetchCommesse
  } = useCommesse(true); // true = usa la cache
  
  // Stato per diagnostica e rete
  const [networkStatus, setNetworkStatus] = useState(navigator.onLine ? 'online' : 'offline');
  const [networkInfo, setNetworkInfo] = useState(null);
  
  // Performance metrics
  const [performanceMetrics, setPerformanceMetrics] = useState({
    initialLoad: 0,
    lastRefresh: 0,
    memoryUsage: 0
  });
  
  // Stato per versione dell'applicazione
  const [appVersion, setAppVersion] = useState('');
  const [buildDate, setBuildDate] = useState('');
    
  // Stato per il dialogo di creazione di un nuovo task
  const [addTaskDialog, setAddTaskDialog] = useState({ 
    open: false, 
    commessaId: null 
  });
  const [newTask, setNewTask] = useState({ 
    nome: '', 
    descrizione: '', 
    stato: 'attivo' 
  });
  const [addingTask, setAddingTask] = useState(false);

  // Stato per il dialogo delle informazioni diagnostiche
  const [diagnosticDialog, setDiagnosticDialog] = useState(false);
  const [diagnosticInfo, setDiagnosticInfo] = useState(null);
  
  // Stati per menu hamburger a destra
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const menuOpen = Boolean(menuAnchorEl);
    
  // Stati per Service Worker
  const [swMessage, setSwMessage] = useState('');
  const [swStatus, setSwStatus] = useState('');
  const [showSwMessage, setShowSwMessage] = useState(false);
  const [swRegistration, setSwRegistration] = useState(null);
  const [updateReady, setUpdateReady] = useState(false);

  // Stati per la vista tabbed nel contenuto principale
  const [tabIndex, setTabIndex] = useState(0);
  
  // Dati di esempio per le risorse da utilizzare nel pianificatore turni
  const [resources, setResources] = useState([
    { 
      id: 1, 
      nome: 'Mario Rossi', 
      ruolo: 'Sviluppatore Senior',
      skills: ['React', 'Node.js', 'API'] 
    },
    { 
      id: 2, 
      nome: 'Laura Bianchi', 
      ruolo: 'Designer UX/UI',
      skills: ['Design', 'Figma', 'UI'] 
    },
    { 
      id: 3, 
      nome: 'Giovanni Verdi', 
      ruolo: 'Project Manager',
      skills: ['Management', 'Agile', 'Planning'] 
    },
    { 
      id: 4, 
      nome: 'Sofia Esposito', 
      ruolo: 'Sviluppatore Backend',
      skills: ['Java', 'SQL', 'API'] 
    }
  ]);
  
  // Dati di esempio per gli skill disponibili
  const [availableSkills, setAvailableSkills] = useState([
    'React', 'Node.js', 'API', 'Design', 'Figma', 'UI', 
    'Management', 'Agile', 'Planning', 'Java', 'SQL'
  ]);

  // Funzione per gestire gli eventi di rete
  useEffect(() => {
    // Funzioni per gestire lo stato della rete con debounce per evitare aggiornamenti troppo frequenti
    const handleOnline = debounce(() => {
      setNetworkStatus('online');
      setSwMessage('Connessione di rete ripristinata');
      setSwStatus('success');
      setShowSwMessage(true);
      updateNetworkInfo();
    }, 500);
    
    const handleOffline = debounce(() => {
      setNetworkStatus('offline');
      setSwMessage('Connessione di rete persa. Modalità offline attiva.');
      setSwStatus('warning');
      setShowSwMessage(true);
      updateNetworkInfo();
    }, 500);
    
    // Aggiorna le informazioni di rete
    function updateNetworkInfo() {
      try {
        const info = getNetworkInfo();
        setNetworkInfo(info);
      } catch (error) {
        console.error('Errore nel recupero delle informazioni di rete:', error);
      }
    }
    
    // Aggiungi i listener per gli eventi di rete
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Inizializza le informazioni di rete
    updateNetworkInfo();
    
    // Pulisci i listener quando il componente viene smontato
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // Funzione per registrare il Service Worker con il gestore ottimizzato
  useEffect(() => {
    const startTime = performance.now();
    
    if ('serviceWorker' in navigator) {
      // Inizializza il service worker usando la classe di gestione ottimizzata
      initializeServiceWorker({
        onSuccess: (registration) => {
          console.log('Service Worker registrato con successo:', registration);
          setSwRegistration(registration);
          setSwStatus('success');
          setSwMessage('Service Worker registrato con successo');
          setShowSwMessage(true);
        },
        onUpdate: (registration) => {
          console.log('Service Worker aggiornato:', registration);
          setSwRegistration(registration);
          setUpdateReady(true);
          setSwStatus('info');
          setSwMessage('Aggiornamento disponibile. Clicca su "Aggiorna applicazione".');
          setShowSwMessage(true);
        },
        onError: (error) => {
          console.error('Errore nella registrazione del Service Worker:', error);
          setSwStatus('error');
          setSwMessage('Errore nella registrazione del Service Worker');
          setShowSwMessage(true);
        },
        onOfflineReady: () => {
          setSwStatus('success');
          setSwMessage('Applicazione pronta per l\'utilizzo offline');
          setShowSwMessage(true);
        },
        onControllerChange: () => {
          console.log('Service Worker controller cambiato, ricaricamento pagina...');
          window.location.reload();
        }
      });
    } else {
      console.log('Service Worker non supportato dal browser');
      setSwStatus('warning');
      setSwMessage('Service Worker non supportato dal browser');
      setShowSwMessage(true);
    }
    
    const loadTime = performance.now() - startTime;
    setPerformanceMetrics(prev => ({
      ...prev,
      initialLoad: loadTime
    }));
  }, []);

  // Funzione per caricare la versione dell'applicazione
  useEffect(() => {
    fetch('/version.json')
      .then(response => response.json())
      .then(data => {
        setAppVersion(data.version || '1.0.0');
        if (data.buildDate) {
          const date = new Date(data.buildDate);
          setBuildDate(date.toLocaleDateString('it-IT', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
          }));
        }
      })
      .catch(error => {
        console.error('Errore nel caricamento della versione:', error);
        setAppVersion('1.0.0');
      });
  }, []);

  // Monitora l'utilizzo della memoria (se disponibile)
  useEffect(() => {
    // Funzione per aggiornare le metriche di performance
    const updatePerformanceMetrics = debounce(() => {
      if ('memory' in performance) {
        const memoryInfo = performance.memory;
        setPerformanceMetrics(prev => ({
          ...prev,
          memoryUsage: memoryInfo.usedJSHeapSize
        }));
      }
    }, 5000);
    
    // Aggiorna le metriche periodicamente
    const interval = setInterval(updatePerformanceMetrics, 30000);
    
    // Aggiorna all'inizio
    updatePerformanceMetrics();
    
    // Pulizia
    return () => clearInterval(interval);
  }, []);

  // Funzione per aprire il menu hamburger a destra
  const handleMenuOpen = (event) => {
    setMenuAnchorEl(event.currentTarget);
  };
  
  // Funzione per aggiornare manualmente il Service Worker
  const handleUpdateServiceWorker = () => {
    if (!swManager.registration) {
      setSwStatus('warning');
      setSwMessage('Nessun Service Worker registrato');
      setShowSwMessage(true);
      return;
    }
    
    if (swManager.isUpdateAvailable) {
      try {
        // Usa il metodo della classe di gestione SW
        swManager.applyUpdate();
        
        setSwStatus('success');
        setSwMessage('Applicazione aggiornata! Ricaricamento in corso...');
        setShowSwMessage(true);
      } catch (err) {
        setSwStatus('error');
        setSwMessage('Errore nell\'aggiornamento: ' + err.message);
        setShowSwMessage(true);
      }
    } else {
      // Controlla se ci sono aggiornamenti disponibili
      swManager.update()
        .then(updateAvailable => {
          if (updateAvailable) {
            setUpdateReady(true);
            setSwStatus('info');
            setSwMessage('Aggiornamento disponibile. Ricarica la pagina.');
            setShowSwMessage(true);
          } else {
            setSwStatus('success');
            setSwMessage('L\'applicazione è già aggiornata all\'ultima versione');
            setShowSwMessage(true);
          }
        })
        .catch(error => {
          console.error('Errore nell\'aggiornamento del Service Worker:', error);
          setSwStatus('error');
          setSwMessage('Errore nell\'aggiornamento del Service Worker');
          setShowSwMessage(true);
        });
    }
  };

  // Funzione per chiudere il menu hamburger a destra
  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };
  
  // Funzione per gestire il logout
  const handleLogout = () => {
    try {
      // Rimuovi i dati di autenticazione
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Reindirizza alla pagina di login
      window.location.href = '/login';
    } catch (error) {
      console.error('Errore durante il logout:', error);
    }
  };
  
  // Funzione per aprire il dialog diagnostico
  const handleOpenDiagnosticDialog = () => {
    const startTime = performance.now();
    
    try {
      const info = {
        browser: {
          userAgent: navigator.userAgent,
          language: navigator.language,
          platform: navigator.platform
        },
        screen: {
          width: window.screen.width,
          height: window.screen.height
        },
        network: networkInfo || { online: navigator.onLine },
        serviceWorker: {
          supported: 'serviceWorker' in navigator,
          controller: navigator.serviceWorker && navigator.serviceWorker.controller ? true : false,
          status: swManager.status
        },
        performance: {
          initialLoad: performanceMetrics.initialLoad.toFixed(2) + 'ms',
          memoryUsage: formatBytes(performanceMetrics.memoryUsage)
        }
      };
      
      setDiagnosticInfo(info);
      setDiagnosticDialog(true);
      
      // Aggiorna il tempo dell'ultima operazione di refresh
      const refreshTime = performance.now() - startTime;
      setPerformanceMetrics(prev => ({
        ...prev,
        lastRefresh: refreshTime
      }));
    } catch (error) {
      console.error('Errore durante il recupero delle informazioni di diagnostica:', error);
      setSwStatus('error');
      setSwMessage('Errore durante il recupero delle informazioni di diagnostica');
      setShowSwMessage(true);
    }
  };

  // Funzione per gestire l'apertura del dialogo di creazione di un nuovo task
  const handleOpenAddTaskDialog = (commessaId) => {
    setNewTask({ nome: '', descrizione: '', stato: 'attivo' });
    setAddTaskDialog({ open: true, commessaId });
  };
  
  // Funzione per gestire la creazione di un nuovo task
  const handleAddTask = async () => {
    if (!newTask.nome || !addTaskDialog.commessaId) return;
    
    setAddingTask(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token non trovato. Effettua nuovamente il login.');
      }
      
      console.log(`Creazione task per commessa ${addTaskDialog.commessaId}:`, newTask);
      
      await api.post(`/api/commesse/${addTaskDialog.commessaId}/tasks`, newTask, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Chiudi il dialogo e ricarica i dati
      setAddTaskDialog({ open: false, commessaId: null });
      setSwStatus('success');
      setSwMessage('Task creato con successo');
      setShowSwMessage(true);
      
      // Forza il refresh delle commesse
      fetchCommesse(true);
    } catch (err) {
      console.error('Errore nella creazione del task:', err);
      setSwStatus('error');
      setSwMessage('Errore nella creazione del task: ' + (err.message || 'Errore sconosciuto'));
      setShowSwMessage(true);
    } finally {
      setAddingTask(false);
    }
  };

  // Forza refresh delle commesse con monitoraggio performance
  const handleForceRefresh = () => {
    const startTime = performance.now();
    
    fetchCommesse(true) // true = force refresh
      .then(() => {
        const refreshTime = performance.now() - startTime;
        setPerformanceMetrics(prev => ({
          ...prev,
          lastRefresh: refreshTime
        }));
      });
  };

  return (
    <ErrorBoundary>
      <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f5f6fa' }}>
        {/* AppBar con menu */}
        <AppBar position="fixed" sx={{ 
          zIndex: 1201, 
          background: '#fff', 
          color: '#222', 
          boxShadow: '0 1px 6px 0 #e0e0e0', 
          width: { sm: `calc(100% - 340px)` }, 
          ml: { sm: '340px' } 
        }}>
          <Toolbar>
            <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700, color: '#1976d2', fontSize: 22, letterSpacing: 0.5 }}>
              Commesse attive
            </Typography>
            <Button 
              color="primary" 
              onClick={handleForceRefresh} 
              startIcon={<RefreshIcon />}
              sx={{ textTransform: 'none', fontWeight: 500, borderRadius: 2, px: 2, bgcolor: '#f5f6fa', boxShadow: 'none', mr: 1 }}
              disabled={commesseLoading}
            >
              Aggiorna
            </Button>
            {/* Menu hamburger a destra */}
            <IconButton 
              onClick={handleMenuOpen}
              size="large"
              color="inherit"
              aria-label="menu"
              aria-controls={menuOpen ? 'menu-appbar' : undefined}
              aria-haspopup="true"
              aria-expanded={menuOpen ? 'true' : undefined}
              sx={{ position: 'relative' }}
            >
              <MoreVertIcon />
              {updateReady && (
                <Box 
                  sx={{
                    position: 'absolute',
                    top: 6,
                    right: 6,
                    width: 10,
                    height: 10,
                    bgcolor: 'error.main',
                    borderRadius: '50%',
                    border: '1px solid white'
                  }}
                />
              )}
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={menuAnchorEl}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={menuOpen}
              onClose={handleMenuClose}
            >
              <MenuItem onClick={handleUpdateServiceWorker}>
                <ListItemIcon>
                  <RefreshIcon fontSize="small" color={updateReady ? "error" : "inherit"} />
                </ListItemIcon>
                <ListItemText 
                  primary={updateReady ? "Aggiorna applicazione (nuova versione)" : "Controlla aggiornamenti"} 
                  primaryTypographyProps={{
                    color: updateReady ? "error" : "inherit",
                    fontWeight: updateReady ? 500 : 400
                  }}
                />
              </MenuItem>
              <MenuItem onClick={handleOpenDiagnosticDialog}>
                <ListItemIcon>
                  <BugReportIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Informazioni diagnostiche" />
              </MenuItem>
              <Divider sx={{ my: 1 }} />
              <MenuItem onClick={handleForceRefresh}>
                <ListItemIcon>
                  <TaskIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Aggiorna commesse" />
              </MenuItem>
              <Divider sx={{ my: 1 }} />
              <MenuItem onClick={handleLogout}>
                <ListItemIcon>
                  <LogoutIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Logout" />
              </MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>
        
        {/* Drawer laterale fisso */}
        <Drawer
          variant="permanent"
          sx={{
            width: 340,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: 340, // larghezza del pannello
              boxSizing: 'border-box',
              fontFamily: 'Segoe UI, Roboto, Arial, sans-serif', // font moderno e leggibile
              fontSize: 15,
              background: '#f8fafc',
              borderRight: '1px solid #e0e0e0',
              paddingTop: 8 // spazio per l'AppBar
            }
          }}
        >
          <Box sx={{ width: '100%', p: 2, fontFamily: 'inherit' }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, fontFamily: 'inherit' }}>
              Commesse attive
            </Typography>
            
            {/* Utilizziamo il componente ottimizzato per le commesse */}
            <OptimizedCommesseTreeView
              commesse={commesse}
              loading={commesseLoading}
              error={commesseError}
              selectedCommesse={selectedCommesse}
              expandedCommesse={expandedCommesse}
              onCommessaToggle={handleCommessaToggle}
              onCommessaExpand={handleCommessaExpand}
              onTaskToggle={handleTaskToggle}
              onAddTask={handleOpenAddTaskDialog}
              onRetry={() => fetchCommesse(true)}
            />
          </Box>
        </Drawer>
        
        {/* Contenuto principale */}
        <Box sx={{ 
          flexGrow: 1, 
          bgcolor: '#f5f6fa', 
          p: 3, 
          width: { sm: `calc(100% - 340px)` }, 
          ml: { sm: '340px' },
          mt: 8 // spazio per l'AppBar
        }}>
          <Box sx={{ maxWidth: 1200, mx: 'auto', width: '100%', p: 3, bgcolor: 'white', borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <Typography variant="h5" sx={{ mb: 2 }}>Dashboard Commesse</Typography>
            
            {/* Tab per navigare tra diverse viste */}
            <Box sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={tabIndex} onChange={(e, newValue) => setTabIndex(newValue)} aria-label="dashboard tabs">
                <Tab icon={<TaskIcon />} iconPosition="start" label="Commesse" />
                <Tab icon={<EventIcon />} iconPosition="start" label="Pianificazione Turni" />
                <Tab icon={<PeopleIcon />} iconPosition="start" label="Risorse" />
              </Tabs>
            </Box>
            
            {/* Contenuto in base al tab selezionato */}
            {tabIndex === 0 && (
              <Box>
                <Typography variant="body1">
                  Seleziona le commesse dal pannello laterale per visualizzare i dettagli.
                </Typography>
                
                <Typography variant="body1" sx={{ mt: 2, color: 'text.secondary' }}>
                  Commesse selezionate: {selectedCommesse.length}
                </Typography>
                
                {/* Mostra le commesse selezionate in modo efficiente */}
                <Box sx={{ mt: 4 }}>
                  {selectedCommesse.length > 0 && (
                    <Box component="div" sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, maxHeight: 300, overflowY: 'auto' }}>
                      {commesse
                        .filter(c => selectedCommesse.includes(c.id))
                        .map(commessa => (
                          <Chip 
                            key={commessa.id}
                            label={`${commessa.codice} - ${commessa.descrizione}`}
                            sx={{ 
                              bgcolor: CATEGORY_COLORS[commessa.id % CATEGORY_COLORS.length] || '#388e3c',
                              color: 'white',
                              fontWeight: 500,
                              my: 0.5
                            }}
                          />
                        ))
                      }
                    </Box>
                  )}
                </Box>
              </Box>
            )}
            
            {/* Tab Pianificazione Turni */}
            {tabIndex === 1 && (
              <ShiftPlanner 
                commesse={commesse.filter(c => selectedCommesse.includes(c.id))}
                resources={resources}
                skills={availableSkills}
              />
            )}
            
            {/* Tab Risorse */}
            {tabIndex === 2 && (
              <Box>
                <Typography variant="h6" gutterBottom>Gestione Risorse</Typography>
                <Box sx={{ mt: 2 }}>
                  <Grid container spacing={2}>
                    {resources.map(resource => (
                      <Grid item xs={12} sm={6} md={3} key={resource.id}>
                        <Paper sx={{ p: 2, height: '100%' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Avatar sx={{ mr: 2 }}>
                              {resource.nome.charAt(0)}
                            </Avatar>
                            <Box>
                              <Typography variant="subtitle1">{resource.nome}</Typography>
                              <Typography variant="body2" color="text.secondary">{resource.ruolo}</Typography>
                            </Box>
                          </Box>
                          <Box>
                            <Typography variant="body2" sx={{ mb: 1 }}>Competenze:</Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {resource.skills.map(skill => (
                                <Chip 
                                  key={`${resource.id}-${skill}`}
                                  label={skill}
                                  size="small"
                                  sx={{ mb: 0.5 }}
                                />
                              ))}
                            </Box>
                          </Box>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              </Box>
            )}
            
            {/* Informazioni sul service worker */}
            <Box sx={{ mt: 4, pt: 4, borderTop: '1px solid #eee' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center' }}>
                  <InfoIcon sx={{ mr: 1, fontSize: 18, color: 'primary.main' }} />
                  Stato applicazione
                </Typography>
                <Button 
                  size="small" 
                  variant="outlined" 
                  startIcon={<BugReportIcon />}
                  onClick={handleOpenDiagnosticDialog}
                >
                  Diagnostica
                </Button>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <Chip 
                  icon={<InfoIcon fontSize="small" />}
                  label={`Service Worker: ${swManager.registration ? 'Attivo' : 'Non attivo'}`} 
                  color={swManager.registration ? 'success' : 'default'}
                  size="small"
                  variant="outlined"
                />
                <Chip 
                  icon={updateReady ? <RefreshIcon fontSize="small" /> : null}
                  label={updateReady ? 'Aggiornamento disponibile' : 'Applicazione aggiornata'} 
                  color={updateReady ? 'warning' : 'success'}
                  size="small"
                  variant="outlined"
                />
                <Chip 
                  icon={networkStatus === 'online' ? <WifiIcon fontSize="small" /> : <WifiOffIcon fontSize="small" />}
                  label={`Rete: ${networkStatus === 'online' ? 'Online' : 'Offline'}`}
                  color={networkStatus === 'online' ? 'success' : 'error'}
                  size="small"
                  variant="outlined"
                />
                <Chip 
                  icon={<MemoryIcon fontSize="small" />}
                  label={`Memoria: ${formatBytes(performanceMetrics.memoryUsage)}`}
                  size="small"
                  variant="outlined"
                />
                <Chip 
                  icon={<UpdateIcon fontSize="small" />}
                  label={`Versione: ${appVersion}${buildDate ? ` (${buildDate})` : ''}`} 
                  size="small"
                  variant="outlined"
                />
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
      
      <Snackbar open={showSwMessage} autoHideDuration={6000} onClose={() => setShowSwMessage(false)}>
        <Alert onClose={() => setShowSwMessage(false)} severity={swStatus} sx={{ width: '100%' }}>
          {swMessage}
        </Alert>
      </Snackbar>
      
      {/* Dialog per aggiungere task */}
      <Dialog open={addTaskDialog.open} onClose={() => setAddTaskDialog({ open: false, commessaId: null })}>
        <DialogTitle>Nuovo Task</DialogTitle>
        <DialogContent>
          <TextField
            label="Nome task"
            value={newTask.nome}
            onChange={e => setNewTask(t => ({ ...t, nome: e.target.value }))}
            fullWidth
            sx={{ mb: 2, mt: 1 }}
          />
          <TextField
            label="Descrizione"
            value={newTask.descrizione}
            onChange={e => setNewTask(t => ({ ...t, descrizione: e.target.value }))}
            fullWidth
            multiline
            minRows={2}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddTaskDialog({ open: false, commessaId: null })}>Annulla</Button>
          <Button 
            onClick={handleAddTask} 
            disabled={addingTask || !newTask.nome} 
            variant="contained"
            color="primary"
          >
            {addingTask ? 'Aggiunta in corso...' : 'Aggiungi'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog per informazioni diagnostiche */}
      <Dialog 
        open={diagnosticDialog} 
        onClose={() => setDiagnosticDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <BugReportIcon sx={{ mr: 1 }} />
            Informazioni diagnostiche
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {diagnosticInfo ? (
            <Box>
              {/* Sezione Applicazione */}
              <Typography variant="h6" sx={{ mb: 1, fontWeight: 500 }}>Informazioni applicazione</Typography>
              <Paper variant="outlined" sx={{ mb: 3, p: 2 }}>
                <List dense disablePadding>
                  <ListItem>
                    <Typography variant="body2">
                      <strong>Versione:</strong> {appVersion} {buildDate ? `(${buildDate})` : ''}
                    </Typography>
                  </ListItem>
                  <ListItem>
                    <Typography variant="body2">
                      <strong>Service Worker:</strong> {diagnosticInfo.serviceWorker.supported ? 'Supportato' : 'Non supportato'}
                      {diagnosticInfo.serviceWorker.controller ? ' (Attivo)' : ' (Inattivo)'}
                    </Typography>
                  </ListItem>
                  <ListItem>
                    <Typography variant="body2">
                      <strong>Stato SW:</strong> {diagnosticInfo.serviceWorker.status}
                    </Typography>
                  </ListItem>
                  <ListItem>
                    <Typography variant="body2">
                      <strong>Aggiornamento disponibile:</strong> {updateReady ? 'Sì' : 'No'}
                    </Typography>
                  </ListItem>
                </List>
              </Paper>

              {/* Sezione Performance */}
              <Typography variant="h6" sx={{ mb: 1, fontWeight: 500 }}>Performance</Typography>
              <Paper variant="outlined" sx={{ mb: 3, p: 2 }}>
                <List dense disablePadding>
                  <ListItem>
                    <Typography variant="body2">
                      <strong>Tempo caricamento iniziale:</strong> {diagnosticInfo.performance.initialLoad}
                    </Typography>
                  </ListItem>
                  <ListItem>
                    <Typography variant="body2">
                      <strong>Tempo ultimo refresh:</strong> {performanceMetrics.lastRefresh.toFixed(2)}ms
                    </Typography>
                  </ListItem>
                  <ListItem>
                    <Typography variant="body2">
                      <strong>Utilizzo memoria:</strong> {diagnosticInfo.performance.memoryUsage}
                    </Typography>
                  </ListItem>
                </List>
              </Paper>

              {/* Sezione Rete */}
              <Typography variant="h6" sx={{ mb: 1, fontWeight: 500 }}>Informazioni di rete</Typography>
              <Paper variant="outlined" sx={{ mb: 3, p: 2 }}>
                <List dense disablePadding>
                  <ListItem>
                    <Typography variant="body2">
                      <strong>Stato connessione:</strong> {networkStatus === 'online' ? 'Online' : 'Offline'}
                    </Typography>
                  </ListItem>
                  {diagnosticInfo.network.effectiveType && diagnosticInfo.network.effectiveType !== 'unknown' && (
                    <ListItem>
                      <Typography variant="body2">
                        <strong>Tipo di connessione:</strong> {diagnosticInfo.network.effectiveType}
                      </Typography>
                    </ListItem>
                  )}
                  {diagnosticInfo.network.downlink && diagnosticInfo.network.downlink > 0 && (
                    <ListItem>
                      <Typography variant="body2">
                        <strong>Velocità stimata:</strong> {diagnosticInfo.network.downlink} Mbps
                      </Typography>
                    </ListItem>
                  )}
                  {diagnosticInfo.network.rtt && diagnosticInfo.network.rtt > 0 && (
                    <ListItem>
                      <Typography variant="body2">
                        <strong>Latenza stimata (RTT):</strong> {diagnosticInfo.network.rtt} ms
                      </Typography>
                    </ListItem>
                  )}
                </List>
              </Paper>

              {/* Sezione Browser */}
              <Typography variant="h6" sx={{ mb: 1, fontWeight: 500 }}>Informazioni browser</Typography>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <List dense disablePadding>
                  <ListItem>
                    <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                      <strong>User Agent:</strong> {diagnosticInfo.browser.userAgent}
                    </Typography>
                  </ListItem>
                  <ListItem>
                    <Typography variant="body2">
                      <strong>Lingua:</strong> {diagnosticInfo.browser.language}
                    </Typography>
                  </ListItem>
                  <ListItem>
                    <Typography variant="body2">
                      <strong>Piattaforma:</strong> {diagnosticInfo.browser.platform}
                    </Typography>
                  </ListItem>
                  <ListItem>
                    <Typography variant="body2">
                      <strong>Risoluzione schermo:</strong> {diagnosticInfo.screen.width}x{diagnosticInfo.screen.height}
                    </Typography>
                  </ListItem>
                </List>
              </Paper>
            </Box>
          ) : (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <CircularProgress />
              <Typography sx={{ mt: 2 }}>Caricamento informazioni...</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDiagnosticDialog(false)} color="primary">
            Chiudi
          </Button>
        </DialogActions>
      </Dialog>
    </ErrorBoundary>
  );
}
