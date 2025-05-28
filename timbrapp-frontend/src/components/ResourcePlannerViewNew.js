// src/components/ResourcePlannerViewNew.js
import React, { useState, useEffect } from 'react';
import VirtualScrollList from './VirtualScrollList';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemButton from '@mui/material/ListItemButton';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import Tooltip from '@mui/material/Tooltip';
import Avatar from '@mui/material/Avatar';
import Badge from '@mui/material/Badge';
import LinearProgress from '@mui/material/LinearProgress';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Collapse from '@mui/material/Collapse';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import { 
  Work as WorkIcon,
  Person as PersonIcon,
  Event as EventIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Cancel as CancelIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Add as AddIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  ArrowForward as ArrowForwardIcon,
  Check as CheckIcon,
  Group as GroupIcon,
  Schedule as ScheduleIcon,
  LocalOffer as TagIcon,
  LocationOn as LocationIcon,
  CalendarToday as CalendarTodayIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowRightIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import TaskForm from './TaskForm';
import api from '../api';
import { withPerformanceMonitoring } from '../hooks/usePerformanceMonitor';
import { useTimbrAppPrefetch } from '../hooks/usePrefetch';
import { 
  format, isAfter, isBefore, isWithinInterval, parseISO, addDays, 
  startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, differenceInDays, 
  startOfDay, isValid, formatDistanceToNow
} from 'date-fns';
import { it } from 'date-fns/locale';

/**
 * Visualizzazione avanzata per la pianificazione delle risorse
 * Mostra in parallelo:
 * 1. I task attivi e pianificati
 * 2. Le risorse richieste per ogni task
 * 3. I dipendenti disponibili per data
 */
function ResourcePlannerViewNew({ commessa = null }) {  // --- STATO COMPONENTE ---
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [personnel, setPersonnel] = useState([]);
  const [assegnazioni, setAssegnazioni] = useState([]);
  const [richiesteFerie, setRichiesteFerie] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(startOfMonth(new Date()));
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedTasks, setExpandedTasks] = useState({});
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedPersonId, setSelectedPersonId] = useState('');
  const [saving, setSaving] = useState(false);
  
  // --- STATO PER CREAZIONE TASK ---
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    nome: '',
    descrizione: '',
    commessaId: commessa ? commessa.id : '',
    stato: 'attivo',
    durataPrevista: '',
    numeroRisorse: 1,
    skills: [],
    dataInizio: format(new Date(), 'yyyy-MM-dd'),
    dataFine: '',
    locationId: '',
    priorita: 'media'
  });
  const [locations, setLocations] = useState([]);
  const [funzioni, setFunzioni] = useState([]);
  const [skills, setSkills] = useState([]);

  // --- FILTRI ---
  const [filtri, setFiltri] = useState({
    stato: '',
    priorita: '',
    dataInizio: '',
    dataFine: ''
  });

  // --- CARICAMENTO DATI ---
  useEffect(() => {
    loadTasks();
    loadPersonnel();
    loadAssignments();
    loadRequests();
    loadLocations();
    loadFunzioniSkill();
  }, [commessa]);

  // Carica tutti i task
  const loadTasks = async () => {
    try {
      setLoading(true);
      let response;
      if (commessa) {
        response = await api.task.getByCommessa(commessa.id);
      } else {
        response = await api.task.getAll();
      }
      setTasks(response.data);
    } catch (err) {
      setError('Errore nel caricamento dei task: ' + err.message);
      console.error('Errore nel caricamento dei task:', err);
    } finally {
      setLoading(false);
    }
  };

  // Carica il personale
  const loadPersonnel = async () => {
    try {
      setLoading(true);
      const response = await api.personale.getAll();
      setPersonnel(response.data);
    } catch (err) {
      setError('Errore nel caricamento del personale: ' + err.message);
      console.error('Errore nel caricamento del personale:', err);
    } finally {
      setLoading(false);
    }
  };

  // Carica le assegnazioni esistenti
  const loadAssignments = async () => {
    try {
      // In un'applicazione reale, qui dovresti chiamare la tua API
      // Esempio: const response = await api.resourcePlanner.getAssignments();
      // Per ora utilizziamo dei dati fittizi
      setAssegnazioni([
        { id: 1, taskId: 1, dipendenteId: 3, data: '2025-05-24' },
        { id: 2, taskId: 2, dipendenteId: 1, data: '2025-05-25' },
        { id: 3, taskId: 2, dipendenteId: 2, data: '2025-05-26' }
      ]);
    } catch (err) {
      console.error('Errore nel caricamento delle assegnazioni:', err);
    }
  };
  // Carica le richieste di ferie/permessi
  const loadRequests = async () => {
    try {
      // In un'applicazione reale, qui dovresti chiamare la tua API
      // Esempio: const response = await api.requests.getAll();
      // Per ora utilizziamo dei dati fittizi
      setRichiesteFerie([
        { id: 1, userId: 1, type: 'ferie', startDate: '2025-05-26', endDate: '2025-05-30', status: 'approved' },
        { id: 2, userId: 3, type: 'permesso', startDate: '2025-05-25', endDate: '2025-05-25', status: 'approved' },
        { id: 3, userId: 2, type: 'sts', startDate: '2025-05-27', endDate: '2025-05-27', status: 'pending' },
      ]);
    } catch (err) {
      console.error('Errore nel caricamento delle richieste:', err);
    }
  };
  
  // Carica le locations
  const loadLocations = async () => {
    try {
      if (commessa) {
        const response = await api.commesse.getLocations(commessa.id);
        setLocations(response.data);
      } else {
        // Se non c'è una commessa selezionata, potresti caricare tutte le locations o lasciarle vuote
        // Per ora lasciamo vuoto l'array
        setLocations([]);
      }
    } catch (err) {
      console.error('Errore nel caricamento delle locations:', err);
    }
  };
  
  // Carica funzioni e skills
  const loadFunzioniSkill = async () => {
    try {
      const [funzioniResponse, skillsResponse] = await Promise.all([
        api.funzioniSkill.getAllFunzioni(),
        api.funzioniSkill.getAllSkill()
      ]);
      
      setFunzioni(funzioniResponse.data);
      setSkills(skillsResponse.data);
    } catch (err) {
      console.error('Errore nel caricamento di funzioni e skills:', err);
    }
  };

  // --- GESTIONE ESPANSIONE TASK ---
  const toggleTaskExpansion = (taskId) => {
    setExpandedTasks(prev => ({
      ...prev,
      [taskId]: !prev[taskId]
    }));
  };
  
  // --- GESTIONE CLICK SU TASK ---
  const handleTaskClick = (taskId) => {
    setSelectedTaskId(taskId);
    // Qui puoi fare qualcosa quando l'utente seleziona un task
  };

  // --- GESTIONE CAMBIO MESE ---
  const handlePrevMonth = () => {
    setSelectedMonth(prevMonth => {
      const newMonth = new Date(prevMonth);
      newMonth.setMonth(newMonth.getMonth() - 1);
      return startOfMonth(newMonth);
    });
  };

  const handleNextMonth = () => {
    setSelectedMonth(prevMonth => {
      const newMonth = new Date(prevMonth);
      newMonth.setMonth(newMonth.getMonth() + 1);
      return startOfMonth(newMonth);
    });
  };

  const handleCurrentMonth = () => {
    setSelectedMonth(startOfMonth(new Date()));
  };

  // --- GESTIONE ASSEGNAZIONI ---
  const handleOpenAssignDialog = (taskId, date) => {
    setSelectedTaskId(taskId);
    setSelectedDate(date);
    setSelectedPersonId('');
    setAssignDialogOpen(true);
  };
  const handleSaveAssignment = async () => {
    if (!selectedTaskId || !selectedPersonId || !selectedDate) return;
    
    setSaving(true);
    try {
      // Qui dovresti chiamare la tua API per salvare l'assegnazione
      // Esempio: await api.resourcePlanner.createAssignment({ ... });
      
      // Per ora aggiungiamo solo l'assegnazione allo stato locale
      const nuovaAssegnazione = {
        id: Date.now(), // id fittizio per demo
        taskId: selectedTaskId,
        dipendenteId: parseInt(selectedPersonId),
        data: format(selectedDate, 'yyyy-MM-dd')
      };
      
      setAssegnazioni(prev => [...prev, nuovaAssegnazione]);
      setAssignDialogOpen(false);
      
    } catch (err) {
      setError('Errore durante il salvataggio dell\'assegnazione');
      console.error('Errore durante il salvataggio dell\'assegnazione:', err);
    } finally {
      setSaving(false);
    }
  };
  
  // --- GESTIONE CREAZIONE TASK ---
  const handleOpenTaskDialog = () => {
    // Reimposta i valori di default con la commessa corrente (se esiste)
    setNewTask({
      nome: '',
      descrizione: '',
      commessaId: commessa ? commessa.id : '',
      stato: 'attivo',
      durataPrevista: '',
      numeroRisorse: 1,
      skills: [],
      dataInizio: format(new Date(), 'yyyy-MM-dd'),
      dataFine: '',
      locationId: '',
      priorita: 'media'
    });
    setTaskDialogOpen(true);
  };
  
  const handleTaskInputChange = (e) => {
    const { name, value } = e.target;
    setNewTask(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSkillsChange = (event) => {
    const {
      target: { value },
    } = event;
    
    // value è un array di stringhe
    setNewTask(prev => ({
      ...prev,
      skills: typeof value === 'string' ? value.split(',') : value
    }));
  };
  
  const handleSaveTask = async () => {
    setSaving(true);
    try {
      // Validazione di base
      if (!newTask.nome || !newTask.dataInizio || !newTask.commessaId) {
        setError('Nome, data inizio e commessa sono campi obbligatori');
        setSaving(false);
        return;
      }
      
      // Chiamata API per creare un nuovo task
      const response = await api.task.create(newTask);
      
      // Aggiungi il nuovo task all'elenco esistente
      setTasks(prev => [...prev, response.data]);
      
      // Chiudi il dialog
      setTaskDialogOpen(false);
      
      // Opzionalmente, seleziona il task appena creato
      setSelectedTaskId(response.data.id);
    } catch (err) {
      setError('Errore durante la creazione del task: ' + (err.response?.data?.error || err.message));
      console.error('Errore durante la creazione del task:', err);
    } finally {
      setSaving(false);
    }
  };

  // --- FILTRI ---
  const filteredTasks = tasks.filter(task => {
    // Filtra per nome o descrizione
    const searchMatch = !searchTerm || 
      task.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (task.descrizione && task.descrizione.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Filtra per stato
    const statoMatch = !filtri.stato || task.stato === filtri.stato;
    
    // Filtra per priorità
    const prioritaMatch = !filtri.priorita || task.priorita === filtri.priorita;
    
    // Filtra per date
    let dateMatch = true;
    if (filtri.dataInizio && task.dataInizio) {
      dateMatch = dateMatch && isAfter(parseISO(task.dataInizio), parseISO(filtri.dataInizio));
    }
    if (filtri.dataFine && task.dataFine) {
      dateMatch = dateMatch && isBefore(parseISO(task.dataFine), parseISO(filtri.dataFine));
    }
    
    return searchMatch && statoMatch && prioritaMatch && dateMatch;
  });

  // --- HELPER FUNCTIONS ---
  // Verifica se un dipendente è disponibile in una data
  const isDipendenteDisponibile = (dipendenteId, data) => {
    // Converti dipendenteId in userId se necessario
    const dipendente = personnel.find(p => p.id === dipendenteId);
    if (!dipendente || !dipendente.userId) return true;
    
    const userId = dipendente.userId;
    
    // Controlla se ci sono richieste di ferie/permessi approvate che includono questa data
    const dataObj = new Date(data);
    const inFerie = richiesteFerie.some(richiesta => 
      richiesta.userId === userId &&
      richiesta.status === 'approved' &&
      isWithinInterval(dataObj, {
        start: parseISO(richiesta.startDate),
        end: parseISO(richiesta.endDate)
      })
    );
    
    return !inFerie;
  };

  // Ottiene dipendenti assegnati a un task per una data specifica
  const getDipendentiPerTask = (taskId, data) => {
    return assegnazioni
      .filter(a => a.taskId === taskId && a.data === data)
      .map(a => personnel.find(p => p.id === a.dipendenteId))
      .filter(Boolean);
  };
  // Ottieni l'elenco dei giorni del mese corrente
  const daysInMonth = eachDayOfInterval({
    start: selectedMonth,
    end: endOfMonth(selectedMonth)
  });

  // Variabili per la paginazione dei giorni
  const [currentPage, setCurrentPage] = useState(0);
  const giorniPerPagina = 17;
  const totalPages = Math.ceil(daysInMonth.length / giorniPerPagina);
  
  // Giorni da visualizzare nella pagina corrente
  const visibleDays = daysInMonth.slice(
    currentPage * giorniPerPagina, 
    (currentPage + 1) * giorniPerPagina
  );

  // Funzioni per la navigazione tra le pagine dei giorni
  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages - 1));
  };

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 0));
  };

  // Stati dei task
  const getTaskStatusColor = (status) => {
    switch(status) {
      case 'attivo': return 'primary.main';
      case 'completato': return 'success.main';
      case 'annullato': return 'error.main';
      default: return 'text.disabled';
    }
  };

  const getTaskStatusIcon = (status) => {
    switch(status) {
      case 'attivo': return <WorkIcon fontSize="small" />;
      case 'completato': return <CheckCircleIcon fontSize="small" />;
      case 'annullato': return <CancelIcon fontSize="small" />;
      default: return <WorkIcon fontSize="small" />;
    }
  };

  // Priorità dei task
  const getTaskPriorityColor = (priority) => {
    switch(priority) {
      case 'alta': return 'error';
      case 'media': return 'primary';
      case 'bassa': return 'info';
      case 'urgente': return 'error';
      default: return 'default';
    }
  };

  // Calcola la percentuale di risorse assegnate rispetto a quelle necessarie
  const getTaskResourcePercentage = (task) => {
    if (!task || !task.numeroRisorse) return 0;
    
    // Contiamo quanti dipendenti distinti sono assegnati a questo task
    const dipendenteIds = new Set();
    assegnazioni
      .filter(a => a.taskId === task.id)
      .forEach(a => dipendenteIds.add(a.dipendenteId));
    
    return Math.min(100, (dipendenteIds.size / task.numeroRisorse) * 100);
  };
  // --- RENDERING COMPONENTI ---  // Rendering delle schede per i giorni del mese
  const renderGiorniMese = () => {
    return (
      <Box sx={{ mb: 3 }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 1.5
        }}>
          <Typography variant="subtitle1" sx={{ 
            fontWeight: 'medium',
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}>
            <CalendarTodayIcon fontSize="small" color="primary" />
            Disponibilità per {format(selectedMonth, 'MMMM yyyy', { locale: it })}
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Pagina {currentPage + 1} di {totalPages}
            </Typography>
            <ButtonGroup size="small" aria-label="Naviga tra i giorni">
              <Button 
                onClick={handlePrevPage} 
                disabled={currentPage === 0}
                sx={{
                  borderRadius: '8px 0 0 8px',
                  minWidth: '36px',
                  p: 0.5
                }}
              >
                <ArrowBackIcon fontSize="small" />
              </Button>
              <Button 
                onClick={handleNextPage} 
                disabled={currentPage === totalPages - 1 || totalPages === 0}
                sx={{
                  borderRadius: '0 8px 8px 0',
                  minWidth: '36px',
                  p: 0.5
                }}
              >
                <ArrowRightIcon fontSize="small" />
              </Button>
            </ButtonGroup>
          </Box>
        </Box>
        <Box sx={{ 
          display: 'flex', 
          flexWrap: 'nowrap', 
          gap: 1,
          overflow: 'hidden',
          pb: 1,
          px: 0.5,
          borderRadius: '12px',
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'rgba(0,0,0,0.01)',
          position: 'relative',
          height: '166px'
        }}>
          {visibleDays.map(day => {
          const isToday = isSameDay(day, new Date());
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          
          // Calcola quanti dipendenti sono disponibili per questa data
          const disponibili = personnel.filter(p => isDipendenteDisponibile(p.id, format(day, 'yyyy-MM-dd'))).length;
          const percentualeDisponibili = personnel.length > 0 ? (disponibili / personnel.length) * 100 : 0;
          
          // Conteggio task attivi per questa data
          const taskCount = tasks.filter(task => {
            if (!task.dataInizio || !task.dataFine) return false;
            const dataTask = new Date(day);
            return isWithinInterval(dataTask, {
              start: parseISO(task.dataInizio),
              end: parseISO(task.dataFine)
            });
          }).length;
          
          return (
            <Box
              key={format(day, 'yyyy-MM-dd')}
              sx={{
                minWidth: '70px',
                p: 0.8,
                mx: 0.25,
                border: '1px solid',
                borderColor: isSelected ? 'primary.main' : isToday ? 'primary.light' : 'divider',
                borderRadius: 1,
                bgcolor: isSelected ? 'primary.lighter' : isToday ? 'rgba(25, 118, 210, 0.08)' : 'background.paper',
                textAlign: 'center',
                cursor: 'pointer',
                '&:hover': {
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  bgcolor: 'action.hover'
                }
              }}
              onClick={() => setSelectedDate(day)}
            >
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column',
                position: 'relative'
              }}>
                {/* Giorno della settimana */}
                <Typography 
                  variant="caption" 
                  display="block" 
                  color="text.secondary" 
                  sx={{ fontWeight: isToday || isSelected ? 'medium' : 'normal' }}
                >
                  {format(day, 'EEEEEE', { locale: it }).toUpperCase()}
                </Typography>
                
                {/* Numero del giorno */}
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: isToday || isSelected ? 'bold' : 'medium',
                    lineHeight: 1.2,
                    fontSize: '1.1rem'
                  }}
                >
                  {format(day, 'dd')}
                </Typography>
                
                {/* Indicatore di disponibilità */}
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  alignItems: 'center', 
                  mt: 0.5 
                }}>
                  <LinearProgress
                    variant="determinate"
                    value={percentualeDisponibili}
                    color={percentualeDisponibili > 70 ? 'success' : percentualeDisponibili > 30 ? 'warning' : 'error'}
                    sx={{ width: '100%', height: 3, borderRadius: 1 }}
                  />
                  
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    width: '100%',
                    mt: 0.5 
                  }}>
                    <Tooltip title="Dipendenti disponibili">
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <PersonIcon sx={{ fontSize: '0.8rem', mr: 0.2, color: 'text.secondary' }} />
                        <Typography variant="caption" sx={{ lineHeight: 1 }}>
                          {disponibili}/{personnel.length}
                        </Typography>
                      </Box>
                    </Tooltip>
                    
                    <Tooltip title="Task attivi">
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <WorkIcon sx={{ fontSize: '0.8rem', mr: 0.2, color: 'text.secondary' }} />
                        <Typography variant="caption" sx={{ lineHeight: 1 }}>
                          {taskCount}
                        </Typography>
                      </Box>
                    </Tooltip>
                  </Box>
                </Box>
              </Box>
            </Box>
          );        })}
      </Box>
    </Box>
    );
  };
  // Rendering della lista task
  const renderTaskList = () => {
    if (filteredTasks.length === 0) {
      return (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">Nessun task trovato</Typography>
        </Box>
      );
    }

    // Componente per il rendering di un singolo task
    const TaskItem = ({ index, style }) => {
      const task = filteredTasks[index];
      if (!task) return null;

      return (
        <div style={style}>
          <Box sx={{ px: 1, pb: 1 }}>
            {renderSingleTask(task)}
          </Box>
        </div>
      );
    };

    return (
      <VirtualScrollList
        itemCount={filteredTasks.length}
        itemHeight={180}
        renderItem={TaskItem}
        height={Math.min(filteredTasks.length * 180, 600)}
        overscan={3}
      />
    );
  };

  // Funzione separata per il rendering di un singolo task
  const renderSingleTask = (task) => {
          // Calcola lo stato di avanzamento delle assegnazioni
          const resourcePercentage = getTaskResourcePercentage(task);
          const isExpanded = expandedTasks[task.id] || false;
          
          return (
            <React.Fragment key={task.id}>
              <ListItem
                disablePadding
                sx={{ 
                  mb: 1, 
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  bgcolor: selectedTaskId === task.id ? 'action.selected' : 'background.paper',
                  '&:hover': { bgcolor: 'action.hover' }
                }}
              >
                <ListItemButton onClick={() => handleTaskClick(task.id)} sx={{ py: 1.5 }}>
                  <Grid container alignItems="center" spacing={1}>
                    <Grid item xs={0.5}>
                      <IconButton size="small" onClick={(e) => {
                        e.stopPropagation();
                        toggleTaskExpansion(task.id);
                      }}>
                        {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </IconButton>
                    </Grid>
                    <Grid item xs={8} md={4}>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'medium', display: 'flex', alignItems: 'center' }}>
                          {getTaskStatusIcon(task.stato)}
                          <Box component="span" sx={{ ml: 1 }}>{task.nome}</Box>
                          {task.priorita && (
                            <Chip 
                              label={task.priorita.toUpperCase()} 
                              color={getTaskPriorityColor(task.priorita)} 
                              size="small" 
                              sx={{ ml: 1, height: 20 }}
                            />
                          )}
                        </Typography>
                        {task.descrizione && (
                          <Typography variant="body2" color="text.secondary" noWrap>
                            {task.descrizione}
                          </Typography>
                        )}
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={3} sx={{ display: { xs: 'none', md: 'block' } }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <CalendarTodayIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2">
                          {task.dataInizio && 
                            format(parseISO(task.dataInizio), 'dd/MM/yyyy') + 
                            (task.dataFine ? ` - ${format(parseISO(task.dataFine), 'dd/MM/yyyy')}` : '')}
                          {!task.dataInizio && 'Non pianificato'}
                        </Typography>
                      </Box>
                      {task.location && (
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                          <LocationIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                          <Typography variant="body2">
                            {task.location.nome}
                          </Typography>
                        </Box>
                      )}
                    </Grid>
                    <Grid item xs={3.5} md={2}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <GroupIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2">
                          Risorse: {task.numeroRisorse || 1}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                        <LinearProgress 
                          variant="determinate" 
                          value={resourcePercentage} 
                          sx={{ flexGrow: 1, mr: 1, height: 6, borderRadius: 1 }} 
                          color={resourcePercentage >= 100 ? 'success' : 'primary'} 
                        />
                        <Typography variant="caption">
                          {Math.round(resourcePercentage)}%
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={2.5} sx={{ textAlign: 'right' }}>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenAssignDialog(task.id, selectedDate || new Date());
                        }}
                        sx={{ mr: 1 }}
                      >
                        Assegna
                      </Button>
                    </Grid>
                  </Grid>
                </ListItemButton>
              </ListItem>
              
              <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                <Paper variant="outlined" sx={{ mb: 2, mx: 2, p: 0 }}>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Data</TableCell>
                          <TableCell>Dipendente</TableCell>
                          <TableCell>Stato</TableCell>
                          <TableCell align="right">Azioni</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {assegnazioni
                          .filter(a => a.taskId === task.id)
                          .map(assegnazione => {
                            const dipendente = personnel.find(p => p.id === assegnazione.dipendenteId);
                            return (
                              <TableRow key={assegnazione.id}>
                                <TableCell>
                                  {format(parseISO(assegnazione.data), 'dd/MM/yyyy')}
                                </TableCell>
                                <TableCell>
                                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Avatar sx={{ width: 24, height: 24, mr: 1, fontSize: '0.8rem' }}>
                                      {dipendente ? dipendente.nome[0] + dipendente.cognome[0] : '?'}
                                    </Avatar>
                                    {dipendente ? `${dipendente.nome} ${dipendente.cognome}` : 'N/D'}
                                  </Box>
                                </TableCell>
                                <TableCell>
                                  {isDipendenteDisponibile(assegnazione.dipendenteId, assegnazione.data) ? (
                                    <Chip label="Disponibile" size="small" color="success" />
                                  ) : (
                                    <Chip label="Non disponibile" size="small" color="error" />
                                  )}
                                </TableCell>
                                <TableCell align="right">
                                  <Tooltip title="Rimuovi assegnazione">
                                    <IconButton size="small" color="error" onClick={() => {
                                      // Qui dovresti chiamare una funzione per rimuovere l'assegnazione
                                      setAssegnazioni(prev => prev.filter(a => a.id !== assegnazione.id));
                                    }}>
                                      <CancelIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        {assegnazioni.filter(a => a.taskId === task.id).length === 0 && (
                          <TableRow>
                            <TableCell colSpan={4} align="center" sx={{ py: 2 }}>
                              <Typography variant="body2" color="text.secondary">
                                Nessuna risorsa assegnata
                              </Typography>
                            </TableCell>
                          </TableRow>
                        )}                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              </Collapse>
            </React.Fragment>
          );
        };

  // Rendering della sezione dipendenti disponibili
  const renderDipendentiDisponibili = () => {
    // Filtriamo i dipendenti disponibili per la data selezionata (se c'è)
    const dataFiltro = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null;
    
    const dipendentiList = dataFiltro
      ? personnel.filter(p => isDipendenteDisponibile(p.id, dataFiltro))
      : personnel;
    
    if (dipendentiList.length === 0) {
      return (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">
            Nessun dipendente disponibile {dataFiltro ? `per il ${format(parseISO(dataFiltro), 'dd/MM/yyyy')}` : ''}
          </Typography>
        </Box>
      );
    }

    // Componente per il rendering di un singolo dipendente
    const DipendenteItem = ({ index, style }) => {
      const dipendente = dipendentiList[index];
      if (!dipendente) return null;

      return (
        <div style={style}>
          <Box sx={{ px: 1, pb: 1 }}>
            {renderSingleDipendente(dipendente)}
          </Box>
        </div>
      );
    };

    return (
      <VirtualScrollList
        itemCount={dipendentiList.length}
        itemHeight={140}
        renderItem={DipendenteItem}
        height={Math.min(dipendentiList.length * 140, 560)}
        overscan={3}
      />
    );
  };

  // Funzione separata per il rendering di un singolo dipendente
  const renderSingleDipendente = (dipendente) => {
    return (
      <Card variant="outlined" sx={{ 
        height: '120px',
        transition: 'all 0.2s',
        '&:hover': {
          boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
          transform: 'translateY(-2px)'
        }
      }}>
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 }, height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Avatar 
              sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}
            >
              {dipendente.nome[0]}{dipendente.cognome[0]}
            </Avatar>
            <Box sx={{ ml: 1, flex: 1 }}>
              <Typography variant="subtitle1" noWrap>
                {dipendente.nome} {dipendente.cognome}
              </Typography>
              <Typography variant="body2" color="text.secondary" noWrap>
                {dipendente.ruolo || 'Ruolo non specificato'}
              </Typography>
            </Box>
            {selectedTaskId && (
              <Button 
                size="small" 
                variant="outlined" 
                color="primary"
                startIcon={<ArrowForwardIcon />}
                onClick={() => {
                  setSelectedPersonId(dipendente.id.toString());
                  handleSaveAssignment();
                }}
                sx={{ ml: 1 }}
              >
                Assegna
              </Button>
            )}
          </Box>
          
          {dipendente.skills && dipendente.skills.length > 0 && (
            <Box sx={{ mt: 'auto' }}>
              <Typography variant="caption" color="text.secondary">Skills:</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                {dipendente.skills.slice(0, 3).map((skill, index) => (
                  <Chip 
                    key={index} 
                    label={skill} 
                    size="small" 
                    color="info" 
                    variant="outlined" 
                  />
                ))}
                {dipendente.skills.length > 3 && (
                  <Chip 
                    label={`+${dipendente.skills.length - 3}`} 
                    size="small" 
                    color="default" 
                    variant="outlined" 
                  />
                )}
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };
  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Box sx={{ mb: 2 }}>
        {/* Header compatto con tutti i controlli principali */}
        <Grid container spacing={1} alignItems="center" sx={{ mb: 1 }}>
          {/* Titolo e commessa */}
          <Grid item xs={12} sm={5} md={4}>
            <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
              <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold', mr: 1 }}>
                Pianificazione Risorse
              </Typography>
              {commessa && (
                <Chip 
                  label={`${commessa.codice}`} 
                  color="primary" 
                  size="small" 
                  icon={<WorkIcon />} 
                  title={commessa.descrizione}
                />
              )}
            </Box>
          </Grid>
          
          {/* Selettore mese compatto */}
          <Grid item xs={7} sm={3} md={2}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
              <IconButton size="small" onClick={handlePrevMonth} sx={{ p: 0.5 }}>
                <ArrowBackIcon fontSize="small" />
              </IconButton>
              <Button
                onClick={handleCurrentMonth}
                variant="text"
                size="small"
                sx={{ px: 1, minWidth: 'auto', typography: 'body2' }}
              >
                {format(selectedMonth, 'MMM yyyy', { locale: it })}
              </Button>
              <IconButton size="small" onClick={handleNextMonth} sx={{ p: 0.5 }}>
                <ArrowRightIcon fontSize="small" />
              </IconButton>
              <Tooltip title="Aggiorna dati">
                <IconButton size="small" onClick={() => {
                  loadTasks();
                  loadPersonnel();
                  loadAssignments();
                  loadRequests();
                }} sx={{ ml: 0.5, p: 0.5 }}>
                  <RefreshIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Grid>
            {/* Ricerca e filtri */}
          <Grid item xs={12} sm={4} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
              <TextField
                size="small"
                variant="outlined"
                placeholder="Cerca task..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                sx={{ 
                  width: { xs: '100%', md: '220px' },
                  '& .MuiOutlinedInput-root': { 
                    height: '36px',
                    borderRadius: '18px'
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  )
                }}
              />
              <Tooltip title="Filtra task">
                <IconButton 
                  size="small" 
                  color={Object.values(filtri).some(v => v !== '') ? 'primary' : 'default'}
                  sx={{ ml: 0.5 }}
                >
                  <FilterListIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Crea nuovo task">
                <IconButton 
                  size="small" 
                  color="primary"
                  sx={{ ml: 0.5 }}
                  onClick={handleOpenTaskDialog}
                >
                  <AddIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Grid>
        </Grid>
        
        {/* Tabs per navigazione tra viste */}
        <Tabs 
          value={activeTab} 
          onChange={(e, newValue) => setActiveTab(newValue)}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
          sx={{ 
            borderBottom: 1, 
            borderColor: 'divider',
            minHeight: '36px',
            '& .MuiTab-root': { 
              minHeight: '36px',
              py: 0.5
            }
          }}
        >
          <Tab label="Panoramica" icon={<CalendarTodayIcon fontSize="small" />} iconPosition="start" />
          <Tab label="Task Attivi" icon={<WorkIcon fontSize="small" />} iconPosition="start" />
          <Tab label="Assegnazioni" icon={<GroupIcon fontSize="small" />} iconPosition="start" />
        </Tabs>
      </Box>
      
      {/* Messaggi di errore */}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* PANORAMICA */}
          {activeTab === 0 && (
            <Box>
              {/* Calendario del mese */}
              {renderGiorniMese()}
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={selectedDate ? 7 : 12}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Task in corso & pianificati
                    </Typography>
                    <Divider />
                  </Box>
                  {renderTaskList()}
                </Grid>
                
                {selectedDate && (
                  <Grid item xs={12} md={5}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="h6" gutterBottom>
                        Dipendenti disponibili {format(selectedDate, 'dd/MM/yyyy')}
                      </Typography>
                      <Divider />
                    </Box>
                    {renderDipendentiDisponibili()}
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
            {/* TASK ATTIVI */}
          {activeTab === 1 && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="h6">
                  Lista Task
                </Typography>
                <Button 
                  variant="contained" 
                  size="small" 
                  color="primary" 
                  startIcon={<AddIcon />}
                  onClick={handleOpenTaskDialog}
                >
                  Nuovo Task
                </Button>
              </Box>
              <Divider sx={{ mb: 2 }} />
              {renderTaskList()}
            </Box>
          )}
          
          {/* ASSEGNAZIONI */}
          {activeTab === 2 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Assegnazioni Task
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              {/* Qui potresti aggiungere una visualizzazione diversa delle assegnazioni,
                  magari con un calendario, una tabella con più dettagli, ecc. */}
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Task</TableCell>
                      <TableCell>Commessa</TableCell>
                      <TableCell>Dipendente</TableCell>
                      <TableCell>Data</TableCell>
                      <TableCell>Stato</TableCell>
                      <TableCell align="right">Azioni</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {assegnazioni.map(assegnazione => {
                      const task = tasks.find(t => t.id === assegnazione.taskId);
                      const dipendente = personnel.find(p => p.id === assegnazione.dipendenteId);
                      const isDisponibile = isDipendenteDisponibile(assegnazione.dipendenteId, assegnazione.data);
                      
                      return (
                        <TableRow key={assegnazione.id}>
                          <TableCell>{task ? task.nome : 'N/D'}</TableCell>
                          <TableCell>{task && task.commessa ? task.commessa.codice : 'N/D'}</TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Avatar sx={{ width: 24, height: 24, mr: 1, fontSize: '0.8rem' }}>
                                {dipendente ? dipendente.nome[0] + dipendente.cognome[0] : '?'}
                              </Avatar>
                              {dipendente ? `${dipendente.nome} ${dipendente.cognome}` : 'N/D'}
                            </Box>
                          </TableCell>
                          <TableCell>{assegnazione.data && format(parseISO(assegnazione.data), 'dd/MM/yyyy')}</TableCell>
                          <TableCell>
                            {isDisponibile ? (
                              <Chip label="Disponibile" size="small" color="success" />
                            ) : (
                              <Chip label="Non disponibile" size="small" color="error" />
                            )}
                          </TableCell>
                          <TableCell align="right">
                            <IconButton size="small" color="error" onClick={() => {
                              setAssegnazioni(prev => prev.filter(a => a.id !== assegnazione.id));
                            }}>
                              <CancelIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {assegnazioni.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                          <Typography color="text.secondary">Nessuna assegnazione trovata</Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}        </>
      )}
      
      {/* Dialog assegnazione task */}
      <Dialog 
        open={assignDialogOpen} 
        onClose={() => setAssignDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Assegna Task a Dipendente
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1" gutterBottom>Task selezionato</Typography>
                {tasks.find(t => t.id === selectedTaskId) ? (
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6">
                        {tasks.find(t => t.id === selectedTaskId).nome}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {tasks.find(t => t.id === selectedTaskId).descrizione}
                      </Typography>
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                          <GroupIcon fontSize="small" sx={{ mr: 1 }} />
                          Risorse necessarie: {tasks.find(t => t.id === selectedTaskId).numeroRisorse || 1}
                        </Typography>
                        <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                          <ScheduleIcon fontSize="small" sx={{ mr: 1 }} />
                          Durata prevista: {tasks.find(t => t.id === selectedTaskId).durataPrevista || '-'} ore
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                ) : (
                  <Typography color="text.secondary">Nessun task selezionato</Typography>
                )}
              </Box>
              
              <Box>
                <Typography variant="subtitle1" gutterBottom>Seleziona data</Typography>
                <TextField
                  fullWidth
                  type="date"
                  value={selectedDate ? format(selectedDate, 'yyyy-MM-dd') : ''}
                  onChange={(e) => setSelectedDate(parseISO(e.target.value))}
                />
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>Seleziona dipendente</Typography>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel id="dipendente-select-label">Dipendente</InputLabel>
                <Select
                  labelId="dipendente-select-label"
                  value={selectedPersonId}
                  label="Dipendente"
                  onChange={(e) => setSelectedPersonId(e.target.value)}
                >
                  {personnel
                    .filter(p => selectedDate ? isDipendenteDisponibile(p.id, format(selectedDate, 'yyyy-MM-dd')) : true)
                    .map(dipendente => (
                      <MenuItem key={dipendente.id} value={dipendente.id}>
                        {dipendente.nome} {dipendente.cognome}
                      </MenuItem>
                    ))
                  }
                </Select>
              </FormControl>
              
              {selectedPersonId && (
                <Card variant="outlined">
                  <CardContent>
                    {(() => {
                      const dipendente = personnel.find(p => p.id === parseInt(selectedPersonId));
                      if (!dipendente) return null;
                      
                      return (
                        <>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar sx={{ bgcolor: 'primary.main', mr: 1 }}>
                              {dipendente.nome[0]}{dipendente.cognome[0]}
                            </Avatar>
                            <Box>
                              <Typography variant="h6">{dipendente.nome} {dipendente.cognome}</Typography>
                              <Typography variant="body2" color="text.secondary">
                                {dipendente.ruolo || 'Ruolo non specificato'}
                              </Typography>
                            </Box>
                          </Box>
                          
                          {dipendente.skills && dipendente.skills.length > 0 && (
                            <Box sx={{ mt: 2 }}>
                              <Typography variant="subtitle2" gutterBottom>Skills:</Typography>
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {dipendente.skills.map((skill, index) => (
                                  <Chip key={index} label={skill} size="small" />
                                ))}
                              </Box>
                            </Box>
                          )}
                        </>
                      );
                    })()}
                  </CardContent>
                </Card>
              )}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignDialogOpen(false)}>Annulla</Button>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleSaveAssignment}
            disabled={!selectedTaskId || !selectedPersonId || !selectedDate || saving}
          >
            {saving ? "Salvataggio..." : "Salva Assegnazione"}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Dialog creazione task */}
      <Dialog 
        open={taskDialogOpen} 
        onClose={() => setTaskDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <WorkIcon sx={{ mr: 1 }} />
            Crea Nuovo Task
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            {/* Colonna sinistra */}
            <Grid item xs={12} md={6}>
              {/* Nome Task */}
              <TextField
                fullWidth
                margin="normal"
                label="Nome Task *"
                name="nome"
                value={newTask.nome}
                onChange={handleTaskInputChange}
                variant="outlined"
                required
              />
              
              {/* Descrizione */}
              <TextField
                fullWidth
                margin="normal"
                label="Descrizione"
                name="descrizione"
                value={newTask.descrizione}
                onChange={handleTaskInputChange}
                variant="outlined"
                multiline
                rows={3}
              />
              
              {/* Commessa */}
              <FormControl fullWidth margin="normal" required disabled={!!commessa}>
                <InputLabel>Commessa *</InputLabel>
                <Select
                  name="commessaId"
                  value={newTask.commessaId}
                  onChange={handleTaskInputChange}
                  label="Commessa *"
                >
                  {/* Mostreremo solo la commessa corrente se è stata passata come prop */}
                  {commessa ? (
                    <MenuItem value={commessa.id}>
                      {commessa.codice} - {commessa.descrizione}
                    </MenuItem>
                  ) : (
                    // Altrimenti qui andrebbe la lista delle commesse disponibili
                    <MenuItem value="">
                      <em>Seleziona una commessa</em>
                    </MenuItem>
                  )}
                </Select>
              </FormControl>
              
              {/* Location */}
              <FormControl fullWidth margin="normal">
                <InputLabel>Location</InputLabel>
                <Select
                  name="locationId"
                  value={newTask.locationId}
                  onChange={handleTaskInputChange}
                  label="Location"
                >
                  <MenuItem value="">
                    <em>Nessuna location</em>
                  </MenuItem>
                  {locations.map(loc => (
                    <MenuItem key={loc.id} value={loc.id}>
                      {loc.nome}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            {/* Colonna destra */}
            <Grid item xs={12} md={6}>
              {/* Date */}
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  fullWidth
                  margin="normal"
                  label="Data Inizio *"
                  name="dataInizio"
                  type="date"
                  value={newTask.dataInizio}
                  onChange={handleTaskInputChange}
                  variant="outlined"
                  required
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  fullWidth
                  margin="normal"
                  label="Data Fine"
                  name="dataFine"
                  type="date"
                  value={newTask.dataFine}
                  onChange={handleTaskInputChange}
                  variant="outlined"
                  InputLabelProps={{ shrink: true }}
                />
              </Box>
              
              {/* Durata e Risorse */}
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  fullWidth
                  margin="normal"
                  label="Durata Prevista (ore)"
                  name="durataPrevista"
                  type="number"
                  value={newTask.durataPrevista}
                  onChange={handleTaskInputChange}
                  variant="outlined"
                  InputProps={{ inputProps: { min: 0 } }}
                />
                <TextField
                  fullWidth
                  margin="normal"
                  label="Numero Risorse"
                  name="numeroRisorse"
                  type="number"
                  value={newTask.numeroRisorse}
                  onChange={handleTaskInputChange}
                  variant="outlined"
                  InputProps={{ inputProps: { min: 1 } }}
                />
              </Box>
              
              {/* Stato e Priorità */}
              <Box sx={{ display: 'flex', gap: 2 }}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Stato</InputLabel>
                  <Select
                    name="stato"
                    value={newTask.stato}
                    onChange={handleTaskInputChange}
                    label="Stato"
                  >
                    <MenuItem value="attivo">Attivo</MenuItem>
                    <MenuItem value="completato">Completato</MenuItem>
                    <MenuItem value="annullato">Annullato</MenuItem>
                  </Select>
                </FormControl>
                
                <FormControl fullWidth margin="normal">
                  <InputLabel>Priorità</InputLabel>
                  <Select
                    name="priorita"
                    value={newTask.priorita}
                    onChange={handleTaskInputChange}
                    label="Priorità"
                  >
                    <MenuItem value="bassa">Bassa</MenuItem>
                    <MenuItem value="media">Media</MenuItem>
                    <MenuItem value="alta">Alta</MenuItem>
                    <MenuItem value="urgente">Urgente</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              
              {/* Skills richieste */}
              <FormControl fullWidth margin="normal">
                <InputLabel>Skills Richieste</InputLabel>
                <Select
                  multiple
                  name="skills"
                  value={newTask.skills}
                  onChange={handleSkillsChange}
                  label="Skills Richieste"
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}                    </Box>
                  )}
                >
                  {skills.map((skill) => (
                    <MenuItem key={skill.id} value={skill.nome}>
                      {skill.nome}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTaskDialogOpen(false)}>Annulla</Button>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleSaveTask}
            disabled={!newTask.nome || !newTask.dataInizio || !newTask.commessaId || saving}
          >
            {saving ? "Creazione in corso..." : "Crea Task"}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}

export default withPerformanceMonitoring(ResourcePlannerViewNew);
