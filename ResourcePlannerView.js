// src/components/ResourcePlannerView.js
import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, CircularProgress, Alert, Grid, Card, CardContent, CardHeader, 
  Chip, Divider, List, ListItem, ListItemText, ListItemIcon, ListItemAvatar, ListItemButton,
  IconButton, Button, Tooltip, Avatar, Badge, LinearProgress, TextField, InputAdornment,
  Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Collapse,
  Tab, Tabs, ButtonGroup
} from '@mui/material';
import {
  WorkOutline as WorkIcon,
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
  ListAlt as ListAltIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import api from '../api';
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
function ResourcePlannerView({ commessa = null }) {
  // --- STATO COMPONENTE ---
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
  const [selectedDate, setSelectedDate] = useState(null);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedPersonId, setSelectedPersonId] = useState('');
  const [saving, setSaving] = useState(false);

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
  };  // Ottieni l'elenco dei giorni del mese corrente
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
  // --- RENDERING COMPONENTI ---  
  // Rendering delle schede per i giorni del mese  const renderGiorniMese = () => {
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
          
          return (
            <Box
              key={format(day, 'yyyy-MM-dd')}
              sx={{
                minWidth: '100px',
                p: 1.5,
                m: 0.5,
                border: '1px solid',
                borderColor: isSelected ? 'primary.main' : isToday ? 'primary.light' : 'divider',
                borderRadius: 2,
                bgcolor: isSelected ? 'primary.lighter' : isToday ? 'rgba(25, 118, 210, 0.04)' : 'background.paper',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                boxShadow: isSelected ? '0 4px 12px rgba(25, 118, 210, 0.15)' : isToday ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
                '&:hover': {
                  boxShadow: '0 6px 12px rgba(0,0,0,0.1)',
                  transform: 'translateY(-4px)',
                  borderColor: 'primary.main',
                  zIndex: 1
                },
                '&::after': isToday ? {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: '0',
                  height: '0',
                  borderStyle: 'solid',
                  borderWidth: '0 12px 12px 0',
                  borderColor: 'transparent primary.main transparent transparent',
                } : {}
              }}
              onClick={() => setSelectedDate(day)}
            >
              <Typography 
                variant="caption" 
                display="block" 
                color={isSelected ? 'primary.main' : 'text.secondary'} 
                sx={{ 
                  fontWeight: 'bold', 
                  textTransform: 'uppercase',
                  mb: 0.5
                }}
              >
                {format(day, 'EEEE', { locale: it }).substring(0, 3)}
              </Typography>
              <Typography 
                variant="h5" 
                sx={{ 
                  fontWeight: isSelected || isToday ? 'bold' : 'medium', 
                  color: isSelected ? 'primary.main' : 'inherit',
                  mb: 1
                }}
              >
                {format(day, 'dd')}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 0.5 }}>
                <LinearProgress
                  variant="determinate"
                  value={percentualeDisponibili}
                  color={percentualeDisponibili > 70 ? 'success' : percentualeDisponibili > 30 ? 'warning' : 'error'}
                  sx={{ 
                    width: '100%', 
                    my: 0.5, 
                    height: 6, 
                    borderRadius: 3,
                    '& .MuiLinearProgress-bar': {
                      transition: 'transform 1s cubic-bezier(0.4, 0, 0.2, 1)'
                    }
                  }}
                />
              </Box>
              <Typography 
                variant="caption" 
                display="block" 
                sx={{ 
                  fontWeight: 'medium',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 0.5
                }}
              >
                <Box 
                  component="span" 
                  sx={{ 
                    color: percentualeDisponibili > 70 ? 'success.main' : percentualeDisponibili > 30 ? 'warning.main' : 'error.main', 
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  {disponibili}
                </Box>
                <Box component="span">/{personnel.length}</Box>
                <Box 
                  component="span" 
                  sx={{ 
                    fontSize: '0.7rem', 
                    bgcolor: percentualeDisponibili > 70 ? 'success.lighter' : percentualeDisponibili > 30 ? 'warning.lighter' : 'error.lighter',
                    color: percentualeDisponibili > 70 ? 'success.darker' : percentualeDisponibili > 30 ? 'warning.darker' : 'error.darker',
                    px: 0.8,
                    py: 0.2,
                    borderRadius: '4px',
                    ml: 0.5
                  }}
                >
                  disponibili
                </Box>
              </Typography>
            </Box>
          );
        })}
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

    return (
      <List sx={{ width: '100%' }}>
        {filteredTasks.map(task => {
          // Calcola lo stato di avanzamento delle assegnazioni
          const resourcePercentage = getTaskResourcePercentage(task);
          const isExpanded = expandedTasks[task.id] || false;
          
          return (
            <React.Fragment key={task.id}>
              <ListItem
                disablePadding
                sx={{ 
                  mb: 1.5, 
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  bgcolor: selectedTaskId === task.id ? 'action.selected' : 'background.paper',
                  overflow: 'hidden',
                  transition: 'all 0.2s',
                  boxShadow: selectedTaskId === task.id ? '0 4px 12px rgba(0,0,0,0.08)' : '0 1px 3px rgba(0,0,0,0.02)',
                  '&:hover': { 
                    bgcolor: 'action.hover',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 12px rgba(0,0,0,0.08)',
                    borderColor: 'primary.light'
                  }
                }}
              >
                <ListItemButton 
                  onClick={() => handleTaskClick(task.id)} 
                  sx={{ 
                    py: 1.5,
                    transition: 'all 0.2s',
                    '&:hover': {
                      bgcolor: 'transparent'
                    }
                  }}
                >
                  <Grid container alignItems="center" spacing={1}>
                    <Grid item xs={0.5}>
                      <IconButton 
                        size="small" 
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleTaskExpansion(task.id);
                        }}
                        sx={{
                          transition: 'transform 0.3s',
                          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                          color: isExpanded ? 'primary.main' : 'text.secondary'
                        }}
                      >
                        <ExpandMoreIcon />
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
                    <Grid item xs={12} md={2.5} sx={{ textAlign: 'right' }}>                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenAssignDialog(task.id, new Date());
                        }}
                        sx={{ 
                          mr: 1,
                          borderRadius: '8px',
                          textTransform: 'none',
                          borderColor: 'primary.light',
                          transition: 'all 0.2s',
                          '&:hover': {
                            borderColor: 'primary.main',
                            bgcolor: 'primary.lighter',
                            boxShadow: '0 2px 8px rgba(25, 118, 210, 0.15)',
                            transform: 'translateY(-2px)'
                          }
                        }}
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
                                    }}
                                    sx={{
                                      transition: 'all 0.2s',
                                      '&:hover': {
                                        bgcolor: 'error.lighter',
                                        transform: 'scale(1.1)'
                                      }
                                    }}
                                    >
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
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              </Collapse>
            </React.Fragment>
          );
        })}
      </List>
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

    return (
      <Grid container spacing={1}>
        {dipendentiList.map(dipendente => (
          <Grid item xs={12} sm={6} md={4} key={dipendente.id}>
            <Card variant="outlined" sx={{ 
              height: '100%', 
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              borderRadius: '12px',
              overflow: 'hidden',
              position: 'relative',
              borderColor: 'divider',
              '&:hover': {
                boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
                transform: 'translateY(-4px)',
                borderColor: 'primary.light'
              },
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                backgroundColor: 'primary.light',
                opacity: 0,
                transition: 'opacity 0.3s',
              },
              '&:hover::before': {
                opacity: 1,
              }
            }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                  <Avatar 
                    sx={{ 
                      bgcolor: 'primary.main', 
                      width: 48, 
                      height: 48, 
                      fontSize: '1.2rem',
                      fontWeight: 'bold',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                    }}
                  >
                    {dipendente.nome[0]}{dipendente.cognome[0]}
                  </Avatar>
                  <Box sx={{ ml: 1.5 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'medium', mb: 0.5 }}>
                      {dipendente.nome} {dipendente.cognome}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      gap: 0.5
                    }}>
                      <WorkIcon fontSize="small" />
                      {dipendente.ruolo || 'Ruolo non specificato'}
                    </Typography>
                  </Box>
                </Box>
                
                {dipendente.skills && dipendente.skills.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ 
                      display: 'block', 
                      mb: 0.5,
                      fontWeight: 'medium'
                    }}>
                      Skills:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8, mt: 0.8 }}>
                      {dipendente.skills.map((skill, index) => (
                        <Chip 
                          key={index} 
                          label={skill} 
                          size="small" 
                          color="info" 
                          variant="outlined" 
                          sx={{ 
                            borderRadius: '6px',
                            fontWeight: 'medium',
                            transition: 'all 0.2s',
                            '&:hover': {
                              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                              backgroundColor: 'info.lighter'
                            }
                          }}
                        />
                      ))}
                    </Box>
                  </Box>
                )}
                
                {selectedTaskId && (
                  <Box sx={{ mt: 2.5, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button 
                      size="small" 
                      variant="contained" 
                      color="primary"
                      startIcon={<ArrowForwardIcon />}
                      onClick={() => {
                        setSelectedPersonId(dipendente.id.toString());
                        handleSaveAssignment();
                      }}
                      sx={{
                        borderRadius: '8px',
                        textTransform: 'none',
                        boxShadow: '0 2px 6px rgba(25, 118, 210, 0.2)',
                        transition: 'all 0.2s',
                        px: 2,
                        '&:hover': {
                          boxShadow: '0 4px 10px rgba(25, 118, 210, 0.3)',
                          transform: 'translateY(-2px)'
                        }
                      }}
                    >
                      Assegna al task
                    </Button>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };
  return (
    <Paper 
      sx={{ 
        p: 3, 
        mb: 3, 
        borderRadius: '16px', 
        boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
        background: 'linear-gradient(to right bottom, #ffffff, #fcfcff)',
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: 'linear-gradient(to right, primary.main, primary.light)',
          borderRadius: '4px 4px 0 0',
        },
      }}
    >
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="h5" component="h2" sx={{ 
              fontWeight: 'bold', 
              display: 'flex', 
              alignItems: 'center',
              position: 'relative',
              '&::after': {
                content: '""',
                position: 'absolute',
                bottom: -4,
                left: 0,
                width: '40%',
                height: '3px',
                backgroundColor: 'primary.main',
                borderRadius: '8px',
              }
            }}>
              <EventIcon sx={{ mr: 1, color: 'primary.main' }} />
              Pianificazione Risorse
              {commessa && (
                <Chip 
                  label={`${commessa.codice} - ${commessa.descrizione}`} 
                  color="primary" 
                  size="small" 
                  sx={{ 
                    ml: 2,
                    borderRadius: '6px',
                    fontWeight: 'medium',
                    '& .MuiChip-icon': {
                      color: 'inherit'
                    }
                  }} 
                  icon={<WorkIcon />} 
                />
              )}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box sx={{ mr: 2, display: 'flex', alignItems: 'center', border: '1px solid', borderColor: 'divider', borderRadius: '8px', px: 1, bgcolor: 'background.paper', boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}>
              <IconButton 
                onClick={handlePrevMonth} 
                size="small"
                sx={{ 
                  borderRadius: '6px', 
                  transition: 'all 0.2s', 
                  '&:hover': { 
                    bgcolor: 'action.hover', 
                    transform: 'translateX(-2px)' 
                  } 
                }}
              >
                <ArrowBackIcon />
              </IconButton>
              <Button
                onClick={handleCurrentMonth}
                variant="text"
                sx={{ 
                  fontWeight: 'bold', 
                  textTransform: 'capitalize',
                  mx: 1,
                  px: 2,
                  borderRadius: '6px',
                  transition: 'all 0.2s',
                  '&:hover': { 
                    bgcolor: 'primary.lighter',
                  }
                }}
              >
                {format(selectedMonth, 'MMMM yyyy', { locale: it })}
              </Button>              <IconButton 
                onClick={handleNextMonth} 
                size="small"
                sx={{ 
                  borderRadius: '6px', 
                  transition: 'all 0.2s', 
                  '&:hover': { 
                    bgcolor: 'action.hover', 
                    transform: 'translateX(2px)' 
                  } 
                }}
              >
                <ArrowForwardIcon />
              </IconButton>            </Box>
              <Box>
              <TextField
                size="small"
                variant="outlined"
                placeholder="Cerca task..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="primary" />
                    </InputAdornment>
                  ),
                  sx: { 
                    borderRadius: '8px',
                    pl: 1,
                    '&.Mui-focused': {
                      boxShadow: '0 0 0 2px rgba(25, 118, 210, 0.2)'
                    }
                  }
                }}
                sx={{ 
                  minWidth: '220px',
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                    transition: 'all 0.2s',
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'primary.main',
                    },
                  } 
                }}
              />
            </Box>
          </Box>
        </Box>
        
        <Tabs 
          value={activeTab} 
          onChange={(e, newValue) => setActiveTab(newValue)}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
          sx={{ 
            '& .MuiTabs-indicator': { 
              height: 3, 
              borderRadius: '3px 3px 0 0',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            },
            '& .Mui-selected': { 
              fontWeight: 'bold',
              transition: 'all 0.2s'
            },
            '& .MuiTab-root': {
              transition: 'all 0.2s',
              minHeight: '48px',
              borderRadius: '8px 8px 0 0',
              '&:hover': {
                backgroundColor: 'rgba(25, 118, 210, 0.04)',
                color: 'primary.main'
              }
            }
          }}
        >
          <Tab 
            icon={<WorkIcon fontSize="small" />} 
            iconPosition="start" 
            label="Panoramica" 
            sx={{ 
              borderTopLeftRadius: '8px', 
              borderTopRightRadius: '8px',
              px: 3
            }}
          />
          <Tab 
            icon={<ListAltIcon fontSize="small" />} 
            iconPosition="start" 
            label="Task Attivi" 
            sx={{ 
              borderTopLeftRadius: '8px', 
              borderTopRightRadius: '8px',
              px: 3
            }}
          />
          <Tab 
            icon={<GroupIcon fontSize="small" />} 
            iconPosition="start" 
            label="Assegnazioni" 
            sx={{ 
              borderTopLeftRadius: '8px', 
              borderTopRightRadius: '8px',
              px: 3
            }}
          />
        </Tabs>
      </Box>
      
      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            mb: 2, 
            borderRadius: '8px', 
            boxShadow: '0 2px 8px rgba(211, 47, 47, 0.15)',
            '& .MuiAlert-icon': {
              color: 'error.main'
            }
          }}
        >
          {error}
        </Alert>
      )}
        {loading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 6 }}>
          <CircularProgress size={40} thickness={4} sx={{ mb: 2, color: 'primary.main' }} />
          <Typography variant="body2" color="text.secondary">Caricamento dati in corso...</Typography>
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
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" gutterBottom>
                  <ListAltIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                  Lista Task
                </Typography>                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  size="small"
                  sx={{ 
                    borderRadius: '8px', 
                    textTransform: 'none',
                    boxShadow: '0 2px 6px rgba(25, 118, 210, 0.2)',
                    transition: 'all 0.2s',
                    '&:hover': {
                      boxShadow: '0 4px 10px rgba(25, 118, 210, 0.3)',
                      transform: 'translateY(-2px)'
                    }
                  }}
                  onClick={() => {
                    // Qui puoi aggiungere la logica per creare un nuovo task
                    console.log('Crea nuovo task');
                  }}
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
            <Box>              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                mb: 3
              }}>
                <Box>
                  <Typography variant="h6" sx={{ 
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    position: 'relative',
                    mb: 0.5,
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      bottom: -8,
                      left: 0,
                      width: '40px',
                      height: '4px',
                      borderRadius: '2px',
                      backgroundColor: 'primary.main'
                    }
                  }}>
                    <GroupIcon sx={{ mr: 1.5, color: 'primary.main', fontSize: '1.8rem' }} />
                    Assegnazioni Task
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 0.5, mt: 1.5 }}>
                    Visualizza e gestisci le assegnazioni dei task ai dipendenti
                  </Typography>
                </Box>
                
                <Button
                  variant="contained"
                  color="primary"
                  size="medium"
                  startIcon={<AddIcon />}
                  onClick={() => handleOpenAssignDialog(null, new Date())}
                  sx={{ 
                    borderRadius: '8px',
                    textTransform: 'none',
                    boxShadow: '0 2px 8px rgba(25, 118, 210, 0.3)',
                    transition: 'all 0.3s',
                    '&:hover': {
                      boxShadow: '0 6px 12px rgba(25, 118, 210, 0.4)',
                      transform: 'translateY(-2px)'
                    },
                    px: 2.5
                  }}
                >
                  Nuova Assegnazione
                </Button>
              </Box>
              
              <Divider sx={{ mb: 3 }} />
                <TableContainer component={Paper} variant="outlined" sx={{ 
                borderRadius: '12px', 
                overflow: 'hidden',
                border: '1px solid',
                borderColor: 'divider',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                transition: 'box-shadow 0.3s ease-in-out',
                '&:hover': {
                  boxShadow: '0 6px 16px rgba(0,0,0,0.12)'
                }
              }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ 
                      bgcolor: 'primary.lighter',
                      '& .MuiTableCell-head': {
                        color: 'primary.dark',
                        fontSize: '0.875rem',
                        borderBottom: '2px solid',
                        borderColor: 'primary.light',
                        paddingY: 1.5
                      }
                    }}>
                      <TableCell sx={{ fontWeight: 'bold' }}>Task</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Commessa</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Dipendente</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Data</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Stato</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>Azioni</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {assegnazioni.length > 0 ? (
                      assegnazioni.map(assegnazione => {
                        const task = tasks.find(t => t.id === assegnazione.taskId);
                        const dipendente = personnel.find(p => p.id === assegnazione.dipendenteId);
                        const isDisponibile = isDipendenteDisponibile(assegnazione.dipendenteId, assegnazione.data);
                        
                        return (                          <TableRow key={assegnazione.id} sx={{ 
                            '&:hover': { 
                              bgcolor: 'action.hover',
                            },
                            '&:nth-of-type(odd)': {
                              bgcolor: 'rgba(0, 0, 0, 0.02)',
                            },
                            borderLeft: '3px solid',
                            borderColor: isDisponibile ? 'success.light' : 'error.light',
                            transition: 'all 0.2s ease-in-out',
                            '&:hover': {
                              bgcolor: 'action.hover',
                              transform: 'translateY(-1px)',
                              boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
                            },
                          }}>
                            <TableCell>                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                {getTaskStatusIcon(task?.stato)}
                                <Typography sx={{ 
                                  ml: 1,
                                  fontWeight: task?.priorita === 'ALTA' ? 'bold' : 'normal',
                                  color: task?.priorita === 'ALTA' ? 'primary.dark' : 'text.primary',
                                  display: 'flex',
                                  alignItems: 'center'
                                }}>
                                  {task ? task.nome : 'N/D'}
                                  {task?.priorita === 'ALTA' && (
                                    <Chip
                                      label="Priorità Alta"
                                      size="small"
                                      color="error"
                                      sx={{
                                        ml: 1,
                                        height: '18px',
                                        fontSize: '0.65rem',
                                        fontWeight: 'bold'
                                      }}
                                    />
                                  )}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>                              {task && task.commessa ? (
                                <Chip 
                                  label={task.commessa.codice} 
                                  size="small" 
                                  color="primary"
                                  variant="outlined"
                                  sx={{ 
                                    borderRadius: '4px',
                                    fontWeight: 'medium',
                                    fontSize: '0.75rem',
                                    background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.05) 0%, rgba(25, 118, 210, 0.1) 100%)',
                                    border: '1px solid',
                                    borderColor: 'primary.light',
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                    '&:hover': {
                                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                    },
                                    transition: 'all 0.2s'
                                  }}
                                />
                              ) : 'N/D'}
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>                                <Avatar sx={{ 
                                  width: 32, 
                                  height: 32, 
                                  mr: 1.5, 
                                  fontSize: '0.8rem',
                                  bgcolor: dipendente?.ruolo === 'Manager' ? 'secondary.main' : 'primary.main',
                                  fontWeight: 'bold',
                                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                  border: '2px solid',
                                  borderColor: 'background.paper'
                                }}>
                                  {dipendente ? dipendente.nome[0] + dipendente.cognome[0] : '?'}
                                </Avatar>                                <Box>
                                  <Typography variant="body2" sx={{
                                    fontWeight: 'medium',
                                    color: 'text.primary'
                                  }}>
                                    {dipendente ? `${dipendente.nome} ${dipendente.cognome}` : 'N/D'}
                                  </Typography>
                                  {dipendente && dipendente.ruolo && (
                                    <Typography variant="caption" sx={{
                                      color: dipendente.ruolo === 'Manager' ? 'secondary.main' : 'text.secondary',
                                      fontWeight: dipendente.ruolo === 'Manager' ? 'medium' : 'normal',
                                      display: 'flex',
                                      alignItems: 'center',
                                      fontSize: '0.7rem'
                                    }}>
                                      {dipendente.ruolo}
                                      {dipendente.ruolo === 'Manager' && (
                                        <Chip 
                                          label="Manager" 
                                          size="small" 
                                          color="secondary"
                                          sx={{ 
                                            ml: 0.5,
                                            height: '16px',
                                            fontSize: '0.65rem',
                                            fontWeight: 'bold',
                                            lineHeight: '12px',
                                            '& .MuiChip-label': {
                                              px: 0.75
                                            }
                                          }}
                                        />
                                      )}
                                    </Typography>
                                  )}
                                </Box>
                              </Box>
                            </TableCell>
                            <TableCell>                              <Typography variant="body2" sx={{ 
                                fontWeight: 'medium',
                                color: 'text.primary',
                                display: 'flex',
                                alignItems: 'center'
                              }}>
                                <CalendarTodayIcon sx={{ 
                                  fontSize: '1rem', 
                                  mr: 0.5, 
                                  color: 'primary.main' 
                                }} />
                                {assegnazione.data && format(parseISO(assegnazione.data), 'dd/MM/yyyy')}
                              </Typography>
                            </TableCell>
                            <TableCell>                              {isDisponibile ? (
                                <Chip 
                                  label="Disponibile" 
                                  size="small" 
                                  color="success" 
                                  icon={<CheckCircleIcon />}
                                  sx={{ 
                                    borderRadius: '16px', 
                                    fontWeight: 'medium',
                                    fontSize: '0.75rem',
                                    height: '24px',
                                    background: 'linear-gradient(135deg, #e0f2f1 0%, #b2dfdb 100%)',
                                    color: '#00695c',
                                    border: '1px solid',
                                    borderColor: '#80cbc4',
                                    '& .MuiChip-icon': {
                                      color: '#00695c'
                                    },
                                    boxShadow: '0 1px 3px rgba(0,105,92,0.2)',
                                    transition: 'all 0.2s',
                                    '&:hover': {
                                      boxShadow: '0 2px 5px rgba(0,105,92,0.3)',
                                      transform: 'translateY(-1px)'
                                    }
                                  }}
                                />
                              ) : (
                                <Chip 
                                  label="Non disponibile" 
                                  size="small" 
                                  color="error" 
                                  icon={<CancelIcon />}
                                  sx={{ 
                                    borderRadius: '16px', 
                                    fontWeight: 'medium',
                                    fontSize: '0.75rem',
                                    height: '24px',
                                    background: 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)',
                                    color: '#b71c1c',
                                    border: '1px solid',
                                    borderColor: '#ef9a9a',
                                    '& .MuiChip-icon': {
                                      color: '#b71c1c'
                                    },
                                    boxShadow: '0 1px 3px rgba(183,28,28,0.2)',
                                    transition: 'all 0.2s',
                                    '&:hover': {
                                      boxShadow: '0 2px 5px rgba(183,28,28,0.3)',
                                      transform: 'translateY(-1px)'
                                    }
                                  }}
                                />
                              )}
                            </TableCell>
                            <TableCell align="right">                              <Tooltip title="Rimuovi assegnazione" arrow>
                                <IconButton 
                                  size="small" 
                                  color="error"
                                  onClick={() => {
                                    setAssegnazioni(prev => prev.filter(a => a.id !== assegnazione.id));
                                  }}
                                  sx={{
                                    transition: 'all 0.2s',
                                    border: '1px solid',
                                    borderColor: 'error.light',
                                    backgroundColor: 'rgba(244, 67, 54, 0.04)',
                                    '&:hover': {
                                      bgcolor: 'error.lighter',
                                      transform: 'scale(1.1)',
                                      boxShadow: '0 2px 6px rgba(244, 67, 54, 0.25)'
                                    }
                                  }}
                                >
                                  <CancelIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                          <Box sx={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: 'center',
                            gap: 2,
                            backgroundColor: 'rgba(0, 0, 0, 0.01)',
                            py: 4,
                            borderRadius: '12px',
                            border: '1px dashed',
                            borderColor: 'divider'
                          }}>
                            <GroupIcon sx={{ 
                              fontSize: '4rem', 
                              color: 'text.disabled',
                              opacity: 0.7
                            }} />
                            <Typography color="text.secondary" sx={{ 
                              mb: 1,
                              fontSize: '1rem',
                              fontWeight: 'medium'
                            }}>
                              Nessuna assegnazione trovata
                            </Typography>
                            <Typography color="text.secondary" sx={{ 
                              mb: 2,
                              fontSize: '0.875rem',
                              maxWidth: '80%',
                              textAlign: 'center'
                            }}>
                              Inizia ad assegnare i task ai dipendenti per visualizzarli in questa tabella
                            </Typography>
                            <Button
                              variant="contained"
                              size="medium"
                              startIcon={<AddIcon />}
                              onClick={() => handleOpenAssignDialog(null, new Date())}
                              sx={{ 
                                borderRadius: '8px',
                                textTransform: 'none',
                                px: 3,
                                py: 1,
                                boxShadow: '0 4px 12px rgba(25, 118, 210, 0.2)',
                                transition: 'all 0.3s',
                                '&:hover': {
                                  boxShadow: '0 6px 16px rgba(25, 118, 210, 0.3)',
                                  transform: 'translateY(-2px)'
                                }
                              }}
                            >
                              Crea la prima assegnazione
                            </Button>
                          </Box>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </>
      )}
      
      {/* DIALOG ASSEGNAZIONE */}
      <Dialog
        open={assignDialogOpen}
        onClose={() => setAssignDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {selectedTaskId ? 'Assegna risorsa al task' : 'Crea nuova assegnazione'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 2,
            mt: 1
          }}>
            <FormControl fullWidth variant="outlined">
              <InputLabel>Task</InputLabel>
              <Select
                value={selectedTaskId || ''}
                onChange={e => setSelectedTaskId(e.target.value)}
                label="Task"
                disabled
              >
                {tasks.map(task => (
                  <MenuItem key={task.id} value={task.id}>
                    {task.nome}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl fullWidth variant="outlined">
              <InputLabel>Dipendente</InputLabel>
              <Select
                value={selectedPersonId}
                onChange={e => setSelectedPersonId(e.target.value)}
                label="Dipendente"
              >
                {personnel.map(persona
