import React, { useEffect, useState, useRef, useCallback } from 'react';
import api from '../services/api';
import {
  Card, CardContent, Typography, Box, Container, Chip, Button, TextField,
  AppBar, Toolbar, IconButton, Drawer, List, ListItem, ListItemIcon, ListItemText, Divider, Collapse, Menu, MenuItem
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import MoreVertIcon from '@mui/icons-material/MoreVert'; // Icona per menu hamburger a destra
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { it } from 'date-fns/locale';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import itLocale from '@fullcalendar/core/locales/it';
import ErrorBoundary from '../components/ErrorBoundary';
import dashboardCache from '../services/dashboardCache';
import TreeView from '@mui/lab/TreeView';
import TreeItem from '@mui/lab/TreeItem';
import Checkbox from '@mui/material/Checkbox';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import AddIcon from '@mui/icons-material/Add';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import FilterListIcon from '@mui/icons-material/FilterList';
import FolderIcon from '@mui/icons-material/Folder';
import LinkIcon from '@mui/icons-material/Link';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import ExpandLess from '@mui/icons-material/ExpandLess';
import momentTimezonePlugin from '@fullcalendar/moment-timezone';

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

// Funzione di rendering degli eventi estratta completamente dal componente per evitare l'errore React #185
const renderEventContent = (arg) => {
  try {
    // Validazione dell'oggetto arg e dell'evento
    if (!arg || typeof arg !== 'object') return null;
    if (!arg.event || typeof arg.event !== 'object') return null;
    
    // Estrazione delle extended props con validazione
    const ev = (arg.event.extendedProps && typeof arg.event.extendedProps === 'object') 
      ? arg.event.extendedProps 
      : {};
    
    // Prepara i dati validati con valori predefiniti per proprietà mancanti
    const title = typeof arg.event.title === 'string' && arg.event.title.trim() !== '' 
      ? arg.event.title 
      : '-';
    
    // Validazione orari
    const hasValidTimes = ev.startTime && typeof ev.startTime === 'string' && 
                       ev.endTime && typeof ev.endTime === 'string';
    const time = hasValidTimes 
      ? `${ev.startTime} - ${ev.endTime}` 
      : '';
    
    // Validazione commessa
    const commessaDesc = ev.commessa && 
                      typeof ev.commessa === 'object' && 
                      ev.commessa.descrizione && 
                      typeof ev.commessa.descrizione === 'string'
      ? ev.commessa.descrizione
      : '';
    
    // Render con controlli di validazione per ogni elemento
    return (
      <Box sx={{ padding: '2px', overflow: 'hidden' }}>
        <div style={{ fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {title}
        </div>
        {time && (
          <div style={{ fontSize: 12, color: '#555', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {time}
          </div>
        )}
        {commessaDesc && (
          <div style={{ fontSize: 11, color: '#888', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {commessaDesc}
          </div>
        )}
      </Box>
    );
  } catch (e) {
    console.error("Errore nel rendering dell'evento:", e);
    // Se qualcosa va storto, renderizza un elemento minimo sicuro
    return (<Box sx={{ p: 1 }}>Evento</Box>);
  }
};

export default function DashboardWeb() {
  const [groupedShifts, setGroupedShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [dateFrom, setDateFrom] = useState(new Date());
  const [dateTo, setDateTo] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [calendarView, setCalendarView] = useState('dayGridMonth');
  const [currentRange, setCurrentRange] = useState({ start: null, end: null });
  const calendarRef = useRef(null);
  
  // Stati per le commesse e i task
  const [commesse, setCommesse] = useState([]);
  const [commesseLoading, setCommesseLoading] = useState(true);
  const [commesseError, setCommesseError] = useState('');
  const [selectedCommesse, setSelectedCommesse] = useState([]);
  const [expandedCommesse, setExpandedCommesse] = useState([]);
  
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
  
  // Gestione sicura dell'utente dal localStorage
  const [user, setUser] = useState(null);
  
  // Carica l'utente in modo sicuro all'avvio del componente
  useEffect(() => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const parsedUser = JSON.parse(userStr);
        if (parsedUser && typeof parsedUser === 'object') {
          setUser(parsedUser);
        }
      }
    } catch (error) {
      console.error('Errore nel caricamento dei dati utente:', error);
      // In caso di problemi con il localStorage, reindirizza al login
      window.location.href = '/login';
    }
  }, []);

  // Funzione per aprire il menu hamburger a destra
  const handleMenuOpen = (event) => {
    setMenuAnchorEl(event.currentTarget);
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

  // Usa ancora lo stato vecchio dei filtri (verrà rimosso in seguito)
  const [sidebarFilters, setSidebarFilters] = useState({
    produzione: true, // "produzione" principale
    work: true,
    logistica: true,
    produzioneItinera: false,
    eventiConfermati: false,
    appuntamentiCommerciali: false,
    attivitaSopralluogo: false,
  });
  const handleSidebarFilterChange = (filterName) => {
    setSidebarFilters(prev => ({ ...prev, [filterName]: !prev[filterName] }));
  };

  // Funzione per caricare le commesse attive
  const fetchCommesse = useCallback(async () => {
    setCommesseLoading(true);
    setCommesseError('');
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setCommesseError('Token non trovato. Effettua nuovamente il login.');
        setCommesse([]);
        setCommesseLoading(false);
        return;
      }
      
      // Ottieni tutte le commesse attive
      const commesseRes = await api.get('/api/commesse', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Per ogni commessa, carica i task associati
      const commesseWithTasks = await Promise.all(
        commesseRes.data.map(async (commessa) => {
          try {
            const tasksRes = await api.get(`/api/commesse/${commessa.id}/tasks`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            return {
              ...commessa,
              tasks: tasksRes.data || []
            };
          } catch (err) {
            console.error(`Errore nel caricamento dei task per la commessa ${commessa.id}:`, err);
            return {
              ...commessa,
              tasks: []
            };
          }
        })
      );
      
      setCommesse(commesseWithTasks);
      
      // Se nessuna commessa è selezionata, seleziona tutte le commesse per default
      if (selectedCommesse.length === 0 && commesseWithTasks.length > 0) {
        setSelectedCommesse(commesseWithTasks.map(c => c.id));
      }
      
    } catch (err) {
      console.error('Errore nel caricamento delle commesse:', err);
      setCommesseError('Errore nel caricamento delle commesse');
      setCommesse([]);
    } finally {
      setCommesseLoading(false);
    }
  }, [selectedCommesse.length]);
  
  // Carica le commesse all'avvio e quando viene richiesto un refresh
  useEffect(() => {
    fetchCommesse();
  }, [fetchCommesse, refresh]);
  
  // Funzione per gestire la selezione/deselezione delle commesse
  const handleCommessaToggle = (commessaId) => {
    setSelectedCommesse(prev => {
      if (prev.includes(commessaId)) {
        return prev.filter(id => id !== commessaId);
      } else {
        return [...prev, commessaId];
      }
    });
  };
  
  // Funzione per espandere/comprimere una commessa nella sidebar
  const handleCommessaExpand = (commessaId) => {
    setExpandedCommesse(prev => {
      if (prev.includes(commessaId)) {
        return prev.filter(id => id !== commessaId);
      } else {
        return [...prev, commessaId];
      }
    });
  };
  // Funzione per gestire la selezione/deselezione di un task
  const handleTaskToggle = (taskId, commessaId) => {
    // Implementazione futura: gestione separata dei task selezionati
    // Per ora, assicuriamoci che la commessa associata sia selezionata
    if (!selectedCommesse.includes(commessaId)) {
      handleCommessaToggle(commessaId);
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
      
      await api.post(`/api/commesse/${addTaskDialog.commessaId}/tasks`, newTask, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Chiudi il dialogo e ricarica i dati
      setAddTaskDialog({ open: false, commessaId: null });
      fetchCommesse(); // Ricarica le commesse con i nuovi task
    } catch (err) {
      console.error('Errore nella creazione del task:', err);
    } finally {
      setAddingTask(false);
    }
  };

  async function fetchShifts(start, end) {
    setLoading(true);
    setError('');
    
    try {
      // Verifica se abbiamo i dati in cache
      const cacheKey = dashboardCache.createShiftsKey(start, end);
      const cachedData = dashboardCache.get(cacheKey);
      
      if (cachedData) {
        console.log('Using cached shifts data');
        setEvents(cachedData);
        setLoading(false);
        return;
      }
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Token non trovato. Effettua nuovamente il login.');
        setEvents([]);
        setLoading(false);
        return;
      }
      
      const res = await api.get('/api/shifts', {
        params: { dateFrom: start, dateTo: end },
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Verifica e sanitizza i dati prima di mapparli
      if (!res || !res.data) {
        setEvents([]);
        return;
      }
      
      // Mappa i turni come eventi FullCalendar con validazioni per ogni proprietà
      const mapped = Array.isArray(res.data) ? res.data
        .filter(shift => shift && typeof shift === 'object') // verifica che ogni shift sia valido
        .map(shift => {
          // Estrai valori con validazione
          const shiftId = shift.id ? String(shift.id) : '';
          const userName = shift.user && typeof shift.user === 'object' && shift.user.nome 
            ? shift.user.nome 
            : '-';
          const roleText = shift.role ? ` (${shift.role})` : '';
          const commessaCode = shift.commessa && typeof shift.commessa === 'object' && shift.commessa.codice 
            ? ` - ${shift.commessa.codice}` 
            : '';
          
          // Validazione delle date
          const validDate = shift.date && typeof shift.date === 'string';
          const validStartTime = shift.startTime && typeof shift.startTime === 'string';
          const validEndTime = shift.endTime && typeof shift.endTime === 'string';
          
          // Costruzione evento con proprietà validate
          return {
            id: shiftId,
            title: `${userName}${roleText}${commessaCode}`,
            start: validDate && validStartTime ? `${shift.date}T${shift.startTime}` : undefined,
            end: validDate && validEndTime ? `${shift.date}T${shift.endTime}` : undefined,
            backgroundColor: shift.user && user && shift.user.id === user.id ? '#1976d2' : '#1976d233',
            borderColor: shift.commessa && typeof shift.commessa === 'object' ? undefined : '#888',
            extendedProps: { ...shift }
          };
        })
        .filter(ev => ev.start && ev.end) // rimuovi eventi con date invalide
        : [];
      
      // Salva i dati nella cache
      dashboardCache.set(cacheKey, mapped);
      
      setEvents(mapped);
    } catch (err) {
      console.error('Errore nel caricamento dei turni:', err);
      setError('Errore nel caricamento dei turni');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }  // Gestione delle date modificata per evitare errori React #185
  const handleDatesSet = useCallback((arg) => {
    try {
      // Validazione dell'oggetto arg e delle date
      if (!arg || typeof arg !== 'object') return; // Aggiunto return esplicito
      
      // Verifica che le stringhe di date siano valide
      const startStr = arg.startStr && typeof arg.startStr === 'string' ? arg.startStr : null;
      const endStr = arg.endStr && typeof arg.endStr === 'string' ? arg.endStr : null;
      
      if (!startStr || !endStr) {
        console.error('Date non valide in handleDatesSet');
        return;
      }
      
      // Memorizza l'intervallo di date corrente
      setCurrentRange({ start: startStr, end: endStr });
      
      // Salva anche la vista corrente se disponibile
      if (arg.view && arg.view.type) {
        setCalendarView(arg.view.type);
      }
      
      // Esegui il fetch dei turni con le date validate 
      fetchShifts(startStr, endStr);
    } catch (error) {
      console.error('Errore in handleDatesSet:', error);
    }
  }, []);  // L'array vuoto impedisce loop infiniti
  // Funzione per forzare il refresh dei dati (cancella cache)
  const forceRefresh = () => {
    try {
      // Ricarica le commesse
      fetchCommesse();
      
      if (currentRange.start && currentRange.end) {
        // Cancella la cache per questo intervallo di date
        const cacheKey = dashboardCache.createShiftsKey(currentRange.start, currentRange.end);
        dashboardCache.delete(cacheKey);
        
        // Ricarica i dati
        fetchShifts(currentRange.start, currentRange.end);
      } else {
        // Incrementa il counter di refresh generale
        setRefresh(prev => prev + 1);
      }
    } catch (error) {
      console.error('Errore durante il refresh forzato:', error);
    }
  };
  useEffect(() => {
    // Risolve l'errore #185 evitando l'uso di async/await direttamente nell'effetto
    const loadData = () => {
      fetchShifts(dateFrom, dateTo);
    };
    loadData();
      // eslint-disable-next-line
    }, [dateFrom, dateTo, refresh]);

  // Esempio: fetchShifts recupera tutti gli eventi, ma mostriamo solo quelli delle commesse selezionate
  const eventiFiltrati = events.filter(ev => {
    // Se nessuna commessa è selezionata, non mostrare nulla
    if (selectedCommesse.length === 0) {
      return false;
    }

    // Ottieni l'ID della commessa associata all'evento
    const commessaId = ev.extendedProps?.commessa?.id;
    
    // Verifica se la commessa di questo evento è tra quelle selezionate
    if (commessaId && selectedCommesse.includes(commessaId)) {
      return true;
    }
    
    // Se l'evento non ha una commessa associata ma almeno una commessa è selezionata
    // (e volessimo mostrare anche gli eventi senza commessa)
    if (!commessaId && selectedCommesse.length > 0) {
      // Questo è un evento senza commessa - possiamo decidere se mostrarlo o meno
      // Per ora, non lo mostriamo
      return false;
    }

    return false;
  });
  // Rendering della sidebar con le commesse e i task
  function renderCommesseSidebar() {
    if (commesseLoading) {
      return (
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Typography>Caricamento commesse...</Typography>
        </Box>
      );
    }

    if (commesseError) {
      return (
        <Box sx={{ p: 2 }}>
          <Typography color="error">{commesseError}</Typography>
          <Button 
            variant="outlined" 
            color="primary" 
            size="small" 
            onClick={fetchCommesse} 
            sx={{ mt: 2 }}
          >
            Riprova
          </Button>
        </Box>
      );
    }

    if (commesse.length === 0) {
      return (
        <Box sx={{ p: 2 }}>
          <Typography>Nessuna commessa attiva disponibile</Typography>
        </Box>
      );
    }    return (      <Box sx={{ width: 280 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Seleziona commesse:
          </Typography>
          <Button 
            size="small" 
            variant="outlined"
            onClick={() => {
              if (selectedCommesse.length === commesse.length) {
                // Deseleziona tutte
                setSelectedCommesse([]);
              } else {
                // Seleziona tutte
                setSelectedCommesse(commesse.map(c => c.id));
              }
            }}
          >
            {selectedCommesse.length === commesse.length ? 'Deseleziona tutte' : 'Seleziona tutte'}
          </Button>
        </Box>
        <TreeView
          defaultCollapseIcon={<ExpandMoreIcon />}
          defaultExpandIcon={<ChevronRightIcon />}
          sx={{ flexGrow: 1, p: 1 }}
          expanded={expandedCommesse.map(id => `commessa-${id}`)}
        >
          {commesse.map((commessa) => (
            <TreeItem
              key={`commessa-${commessa.id}`}
              nodeId={`commessa-${commessa.id}`}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', p: 0.5 }}>
                  <Checkbox
                    checked={selectedCommesse.includes(commessa.id)}
                    onChange={() => handleCommessaToggle(commessa.id)}
                    onClick={(e) => e.stopPropagation()} // Previene l'espansione/compressione quando si clicca la checkbox
                    size="small"
                    sx={{ p: 0.5 }}
                  />
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 500,
                      flexGrow: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {commessa.codice} - {commessa.descrizione}
                  </Typography>
                  <Box
                    component="span"
                    sx={{
                      borderRadius: '50%',
                      width: 16,
                      height: 16,
                      ml: 0.5,
                      bgcolor: CATEGORY_COLORS[commessa.id % CATEGORY_COLORS.length] || '#388e3c'
                    }}
                  />
                  <IconButton 
                    size="small" 
                    sx={{ ml: 0.5 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenAddTaskDialog(commessa.id);
                    }}
                  >
                    <AddIcon fontSize="small" />
                  </IconButton>
                </Box>
              }
              onClick={() => handleCommessaExpand(commessa.id)}
            >
              {commessa.tasks.length > 0 ? (
                commessa.tasks.map((task) => (
                  <TreeItem
                    key={`task-${task.id}`}
                    nodeId={`task-${task.id}`}
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', p: 0.5 }}>
                        <Checkbox
                          checked={selectedCommesse.includes(commessa.id)}
                          onChange={() => handleTaskToggle(task.id, commessa.id)}
                          onClick={(e) => e.stopPropagation()}
                          size="small"
                          sx={{ p: 0.5 }}
                        />
                        <Typography
                          variant="body2"
                          sx={{
                            fontStyle: task.stato === 'completato' ? 'italic' : 'normal',
                            textDecoration: task.stato === 'completato' ? 'line-through' : 'none',
                            color: task.stato === 'completato' ? 'text.disabled' : 'text.primary',
                            flexGrow: 1,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {task.nome}
                        </Typography>
                        <Chip 
                          label={task.stato} 
                          size="small"
                          color={
                            task.stato === 'attivo' ? 'primary' :
                            task.stato === 'completato' ? 'success' : 'default'
                          }
                          sx={{ 
                            height: 20, 
                            '& .MuiChip-label': { 
                              px: 1, 
                              fontSize: '0.7rem' 
                            } 
                          }}
                        />
                      </Box>
                    }
                  />
                ))
              ) : (
                <TreeItem
                  nodeId={`no-tasks-${commessa.id}`}
                  label={
                    <Typography variant="body2" sx={{ pl: 2, color: 'text.secondary', fontStyle: 'italic' }}>
                      Nessun task disponibile
                    </Typography>
                  }
                />
              )}
            </TreeItem>
          ))}
        </TreeView>
      </Box>
    );
  }

  // Stati per menu hamburger a destra
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const menuOpen = Boolean(menuAnchorEl);

  return (
    <ErrorBoundary>
      <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f5f6fa' }}>
        {/* AppBar con menu */}
        {/* --- HEADER MINIMAL --- */}
        <AppBar position="fixed" sx={{ zIndex: 1201, background: '#fff', color: '#222', boxShadow: '0 1px 6px 0 #e0e0e0' }}>
          <Toolbar>            <IconButton edge="start" color="inherit" onClick={() => setDrawerOpen(true)} sx={{ mr: 2 }}>
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700, color: '#1976d2', fontSize: 22, letterSpacing: 0.5 }}>
              Commesse attive
            </Typography>
            <Button 
              color="primary" 
              onClick={forceRefresh} 
              sx={{ textTransform: 'none', fontWeight: 500, borderRadius: 2, px: 2, bgcolor: '#f5f6fa', boxShadow: 'none' }}
              disabled={loading || commesseLoading}
            >
              Aggiorna
            </Button>
            <IconButton
              edge="end"
              color="inherit"
              onClick={(e) => setMenuAnchorEl(e.currentTarget)}
              sx={{ ml: 2 }}
            >
              <MoreVertIcon />
            </IconButton>
            <Menu
              anchorEl={menuAnchorEl}
              open={menuOpen}
              onClose={() => setMenuAnchorEl(null)}
            >
              <MenuItem onClick={handleLogout}>
                <LogoutIcon sx={{ mr: 1 }} />
                Logout
              </MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>
        
        {/* Drawer laterale */}
        <Drawer
          anchor="left"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          sx={{
            '& .MuiDrawer-paper': {
              width: 340, // aumentata la larghezza
              boxSizing: 'border-box',
              fontFamily: 'Segoe UI, Roboto, Arial, sans-serif', // font moderno e leggibile
              fontSize: 15,
              background: '#f8fafc',
              borderRight: '1px solid #e0e0e0',
              paddingTop: 2
            }
          }}
        >          <Box sx={{ width: '100%', p: 2, fontFamily: 'inherit' }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, fontFamily: 'inherit' }}>
              Commesse attive
            </Typography>
            {renderCommesseSidebar()}
          </Box>
        </Drawer>
        
        {/* Contenuto principale */}
        <Box sx={{ display: 'flex', flexGrow: 1, bgcolor: '#f5f6fa' }}>
          {/* Calendario principale */}
          {/* --- CALENDARIO MODERNO --- */}
          <Box sx={{ flexGrow: 1, p: { xs: 1, sm: 3 }, pt: 10, maxWidth: 1200, mx: 'auto', width: '100%' }}>
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView={calendarView}
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
              }}
              locales={[itLocale]}
              locale="it"              events={eventiFiltrati.map(ev => {
                // Assegna colori agli eventi in base all'ID della commessa
                const commessaId = ev.extendedProps?.commessa?.id;
                let colorIndex = 0;
                
                if (commessaId) {
                  // Usa l'ID della commessa per determinare l'indice del colore
                  // Questo garantisce che tutti gli eventi della stessa commessa abbiano lo stesso colore
                  colorIndex = commessaId % CATEGORY_COLORS.length;
                } else {
                  // Usa l'indice 0 per eventi senza commessa
                  colorIndex = 0;
                }
                
                return {
                  ...ev,
                  backgroundColor: CATEGORY_COLORS[colorIndex] || '#1976d2',
                  borderColor: '#fff',
                  textColor: '#fff',
                };
              })}
              height="auto"
              nowIndicator
              eventTimeFormat={{
                hour: '2-digit',
                minute: '2-digit',
                meridiem: false
              }}
              eventDisplay="block"
              firstDay={1}
              businessHours={{
                daysOfWeek: [1, 2, 3, 4, 5],
                startTime: '08:00',
                endTime: '18:00'
              }}              eventContent={renderEventContent}
              datesSet={handleDatesSet}
              eventClick={info => {
                try {
                  if (!info || !info.event || typeof info.event.extendedProps !== 'object') return;
                  const ev = info.event.extendedProps;
                  const userName = ev.user && typeof ev.user === 'object' && ev.user.nome ? ev.user.nome : '-';
                  const startTime = ev.startTime || '-';
                  const endTime = ev.endTime || '-';
                  const commessaCode = ev.commessa && typeof ev.commessa === 'object' && ev.commessa.codice ? ev.commessa.codice : '-';
                  const role = ev.role || '-';
                  const location = ev.location || '-';
                  const notes = ev.notes || '';
                  alert(
                    `Turno di ${userName}\n` +
                    `${startTime} - ${endTime}\n` +
                    `Commessa: ${commessaCode}\n` +
                    `Ruolo: ${role}\n` +
                    `Sede: ${location}\n` +
                    `Note: ${notes}`
                  );
                } catch (error) {
                  alert('Impossibile visualizzare i dettagli del turno');
                }
              }}
            />
          </Box>
        </Box>      </Box>
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
        <DialogActions>          <Button onClick={() => setAddTaskDialog({ open: false, commessaId: null })}>Annulla</Button>
          <Button 
            onClick={handleAddTask} 
            disabled={addingTask || !newTask.nome} 
            variant="contained"
          >
            {addingTask ? 'Aggiunta in corso...' : 'Aggiungi'}
          </Button>
        </DialogActions>
      </Dialog>
    </ErrorBoundary>
  );
}
