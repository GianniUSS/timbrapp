import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
// Ottimizzazione Material-UI Tree Shaking - Import specifici
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Grid from '@mui/material/Grid';
import InputAdornment from '@mui/material/InputAdornment';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Badge from '@mui/material/Badge';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';
import TablePagination from '@mui/material/TablePagination';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { format, parseISO, isValid, addMonths, subMonths } from 'date-fns';
import { it } from 'date-fns/locale';

// Icone
import WorkIcon from '@mui/icons-material/Work';
import AssignmentIcon from '@mui/icons-material/Assignment';
import GroupIcon from '@mui/icons-material/Group';
import ListAltIcon from '@mui/icons-material/ListAlt';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import RefreshIcon from '@mui/icons-material/Refresh';
import PersonIcon from '@mui/icons-material/Person';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import BusinessIcon from '@mui/icons-material/Business';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import AddIcon from '@mui/icons-material/Add';
import ClearIcon from '@mui/icons-material/Clear';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import EventNoteIcon from '@mui/icons-material/EventNote';

import apiClient from '../api';
import DashboardHeader from '../components/DashboardHeader';
import MenuDrawer from '../components/MenuDrawer';
import TaskDetailsDialog from '../components/TaskDetailsDialog';
import TaskForm from '../components/TaskForm';
import CommessaForm from '../components/CommessaForm';
import TaskPersonaleForm from '../components/TaskPersonaleForm';
import PersonaleTab from '../components/PersonaleTab';
import FunzioniSkillTab from '../components/FunzioniSkillTab';
import LocationDialog from '../components/LocationDialog';
import NearbyCommesseDialog from '../components/NearbyCommesseDialog';
import ResourcePlannerView from '../components/ResourcePlannerViewNew';

const APP_VERSION = 'v1.3.0';

// Dashboard moderna per la gestione delle commesse/eventi
function EventiDashboard() {
  // Stati principali
  const [commesse, setCommesse] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedCommessa, setSelectedCommessa] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('commesse'); // commesse, task, personale, funzioni, pianificazione
  
  // Stati per filtri e ordinamento
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStato, setFilterStato] = useState('all'); // all, attiva, completata, sospesa, annullata
  const [filterPeriodo, setFilterPeriodo] = useState('current'); // current, custom
  const [filterLocation, setFilterLocation] = useState('all'); // all, hasLocation, noLocation
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1)); // primo del mese corrente
  const [endDate, setEndDate] = useState(new Date()); // oggi
  
  // Stati per paginazione e ordinamento
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [orderBy, setOrderBy] = useState('dataInizio');
  const [order, setOrder] = useState('desc');
  
  // Stati per la generazione di report o grafici
  const [showStats, setShowStats] = useState(false);

  // Stati per gestire la tab Task
  const [tasks, setTasks] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [searchTaskTerm, setSearchTaskTerm] = useState('');
  const [filterTaskCommessa, setFilterTaskCommessa] = useState('all');
  const [filterTaskStato, setFilterTaskStato] = useState('all');
  
  // Stati per paginazione dei task
  const [taskPage, setTaskPage] = useState(0);
  const [taskRowsPerPage, setTaskRowsPerPage] = useState(10);
  const [taskOrderBy, setTaskOrderBy] = useState('dataInizio');
  const [taskOrder, setTaskOrder] = useState('desc');
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
    // Stati per operazioni CRUD sui task
  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [savingTask, setSavingTask] = useState(false);
  const [deletingTask, setDeletingTask] = useState(false);
  
  // Stati per operazioni CRUD sulle commesse
  const [commessaFormOpen, setCommessaFormOpen] = useState(false);
  const [editingCommessa, setEditingCommessa] = useState(null);
  const [savingCommessa, setSavingCommessa] = useState(false);
  const [deletingCommessa, setDeletingCommessa] = useState(false);
  const [confirmDeleteCommessaOpen, setConfirmDeleteCommessaOpen] = useState(false);
  
  // Stati per gestione personale nei task
  const [taskPersonaleFormOpen, setTaskPersonaleFormOpen] = useState(false);
  const [selectedTaskForPersonale, setSelectedTaskForPersonale] = useState(null);
    // Stati per la gestione delle location
  const [locationDialogOpen, setLocationDialogOpen] = useState(false);
  const [selectedCommessaForLocation, setSelectedCommessaForLocation] = useState(null);
  const [nearbyCommesseDialogOpen, setNearbyCommesseDialogOpen] = useState(false);
  
  // Notifiche
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
  
  // Caricamento iniziale delle commesse
  useEffect(() => {
    fetchCommesse();
  }, []);
  // Funzione per creare una nuova commessa
  const handleCreateCommessa = () => {
    setEditingCommessa(null);
    setCommessaFormOpen(true);
  };
  
  // Funzione per modificare una commessa
  const handleEditCommessa = (commessa) => {
    setEditingCommessa(commessa);
    setCommessaFormOpen(true);
  };
  
  // Funzione per eliminare una commessa
  const handleDeleteCommessa = (commessaId) => {
    const commessa = commesse.find(c => c.id === commessaId);
    if (commessa) {
      setEditingCommessa(commessa);
      setConfirmDeleteCommessaOpen(true);
    }
  };
  
  // Funzione per salvare una commessa (creazione o modifica)
  const handleSaveCommessa = async (commessaData) => {
    try {
      setSavingCommessa(true);
      
      if (editingCommessa) {
        try {
          // Modifica commessa esistente
          const response = await apiClient.commesse.update(editingCommessa.id, commessaData);
          
          // Aggiorna la lista locale
          setCommesse(commesse.map(c => 
            c.id === editingCommessa.id ? { ...c, ...response.data } : c
          ));
          
          setNotification({
            open: true,
            message: 'Commessa aggiornata con successo',
            severity: 'success'
          });
        } catch (apiError) {
          console.error('Errore API durante l\'aggiornamento della commessa:', apiError);
          setNotification({
            open: true,
            message: `Errore durante l'aggiornamento della commessa: ${apiError.response?.data?.message || apiError.message || 'Errore di connessione al server'}`,
            severity: 'error'
          });
          throw apiError; // Rilancia l'errore per evitare di chiudere il form
        }
      } else {
        try {
          // Crea nuova commessa
          const response = await apiClient.commesse.create(commessaData);
          
          // Aggiungi alla lista locale
          setCommesse([...commesse, response.data]);
          
          setNotification({
            open: true,
            message: 'Commessa creata con successo',
            severity: 'success'
          });
        } catch (apiError) {
          console.error('Errore API durante la creazione della commessa:', apiError);
          setNotification({
            open: true,
            message: `Errore durante la creazione della commessa: ${apiError.response?.data?.message || apiError.message || 'Errore di connessione al server'}`,
            severity: 'error'
          });
          throw apiError; // Rilancia l'errore per evitare di chiudere il form
        }
      }
      
      setCommessaFormOpen(false);
    } catch (err) {
      console.error('Errore nel salvataggio della commessa:', err);
      // La notifica è già gestita nei blocchi try/catch interni
    } finally {
      setSavingCommessa(false);
    }
  };
  
  // Funzione per confermare l'eliminazione di una commessa
  const handleConfirmDeleteCommessa = async () => {
    if (!editingCommessa) return;
    
    try {
      setDeletingCommessa(true);
      
      await apiClient.commesse.delete(editingCommessa.id);
      
      // Aggiorna la lista locale
      setCommesse(commesse.filter(c => c.id !== editingCommessa.id));
      
      setNotification({
        open: true,
        message: 'Commessa eliminata con successo',
        severity: 'success'
      });
      
      setConfirmDeleteCommessaOpen(false);
    } catch (err) {
      console.error('Errore durante l\'eliminazione della commessa:', err);
      setNotification({
        open: true,
        message: 'Errore durante l\'eliminazione della commessa. Riprova più tardi.',
        severity: 'error'
      });
    } finally {
      setDeletingCommessa(false);
    }
  };
    // Funzione per gestire il personale assegnato a un task
  const handleManageTaskPersonale = (task) => {
    if (!task) {
      setNotification({
        open: true,
        message: 'Errore: task non specificato',
        severity: 'error'
      });
      return;
    }
    setSelectedTaskForPersonale(task);
    setTaskPersonaleFormOpen(true);
  };
  
  // Funzione per salvare le assegnazioni del personale
  const handleSaveTaskPersonale = (assignedPersonale) => {
    // Aggiorna i dati locali se necessario
    if (selectedTaskForPersonale) {
      // Trova la commessa che contiene il task
      const updatedCommesse = commesse.map(commessa => {
        if (commessa.tasks) {
          const updatedTasks = commessa.tasks.map(task => {
            if (task.id === selectedTaskForPersonale.id) {
              return { ...task, personale: assignedPersonale };
            }
            return task;
          });
          
          if (updatedTasks.some(t => t.id === selectedTaskForPersonale.id)) {
            return { ...commessa, tasks: updatedTasks };
          }
        }
        return commessa;
      });
      
      setCommesse(updatedCommesse);
    }
      setTaskPersonaleFormOpen(false);
    
    setNotification({
      open: true,
      message: 'Personale assegnato con successo',
      severity: 'success'
    });
  };  // Funzione per caricare le commesse
  const fetchCommesse = async () => {
    try {
      setLoading(true);
      
      // Recupera anche l'utente autenticato come in Dashboard.js per verifica token
      const res = await apiClient.commesse.getAll();
      
      // Debug: console.log per vedere la struttura delle commesse
      console.log('Commesse caricate:', res.data);
      if (res.data && res.data.length > 0) {
        console.log('Esempio di commessa:', res.data[0]);
        console.log('Location della commessa:', res.data[0].location);
      }
      
      // Verifica e imposta le commesse ricevute
      setCommesse(Array.isArray(res.data) ? res.data : []);
      setError(null);
    } catch (err) {
      console.error('Errore nel caricamento delle commesse:', err);
      setError('Errore nel caricamento delle commesse');
      setCommesse([]);
    } finally {
      setLoading(false);
    }
  };

  // Estrae tutti i task da tutte le commesse
  useEffect(() => {
    if (commesse.length > 0) {
      const tasks = commesse.flatMap(commessa => 
        (commessa.tasks || []).map(task => ({
          ...task,
          commessa: {
            id: commessa.id,
            codice: commessa.codice,
            descrizione: commessa.descrizione
          }
        }))
      );
      setAllTasks(tasks);
    }
  }, [commesse]);

  // Gestione filtri
  const handleSearchChange = (event) => setSearchTerm(event.target.value);
  const handleFilterStatoChange = (event) => setFilterStato(event.target.value);
  const handleFilterLocationChange = (event) => {
    setFilterLocation(event.target.value);
    setPage(0);
  };
  const handlePeriodoChange = (event) => setFilterPeriodo(event.target.value);
  const handleClearFilters = () => {
    setSearchTerm('');
    setFilterStato('all');
    setFilterPeriodo('current');
    setFilterLocation('all');
    setStartDate(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
    setEndDate(new Date());
  };

  // Resetta tutti i filtri
  const handleResetFilters = () => {
    setSearchTerm('');
    setFilterStato('all');
    setFilterPeriodo('all');
    setFilterLocation('all');
    setStartDate(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
    setEndDate(new Date());
    setPage(0);
  };

  // Funzioni per la paginazione
  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Gestione ordinamento
  const createSortHandler = (property) => (event) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  // Funzioni per i periodi di date predefiniti
  const handleSetPeriod = (period) => {
    const today = new Date();
    
    switch(period) {
      case 'currentMonth':
        setStartDate(new Date(today.getFullYear(), today.getMonth(), 1));
        setEndDate(new Date(today.getFullYear(), today.getMonth() + 1, 0));
        break;
      case 'lastMonth':
        setStartDate(new Date(today.getFullYear(), today.getMonth() - 1, 1));
        setEndDate(new Date(today.getFullYear(), today.getMonth(), 0));
        break;
      case 'currentYear':
        setStartDate(new Date(today.getFullYear(), 0, 1));
        setEndDate(new Date(today.getFullYear(), 11, 31));
        break;
      case 'all':
        setStartDate(null);
        setEndDate(null);
        break;
      default:
        break;
    }
  };

  // Applica filtri e ordinamento alle commesse
  const filteredCommesse = useMemo(() => {
    return commesse.filter(commessa => {
      // Filtro di ricerca testuale
      const matchesSearch = 
        searchTerm === '' || 
        commessa.codice.toLowerCase().includes(searchTerm.toLowerCase()) ||
        commessa.descrizione.toLowerCase().includes(searchTerm.toLowerCase()) ||
        commessa.cliente.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Filtro per stato
      const matchesStato = filterStato === 'all' || commessa.stato === filterStato;
      
      // Filtro per periodo
      let matchesPeriodo = true;
      if (filterPeriodo === 'custom' && startDate && endDate) {
        const dataInizio = new Date(commessa.dataInizio);
        const dataFine = commessa.dataFine ? new Date(commessa.dataFine) : new Date();
        
        // Una commessa corrisponde se il suo periodo si sovrappone al filtro
        matchesPeriodo = 
          (dataInizio <= endDate && dataFine >= startDate);
      }
      
      // Filtro per location
      let matchesLocation = true;
      if (filterLocation !== 'all') {
        const hasLocations = Array.isArray(commessa.location) 
          ? commessa.location.length > 0
          : commessa.location && typeof commessa.location === 'object';
        
        matchesLocation = 
          (filterLocation === 'hasLocation' && hasLocations) ||
          (filterLocation === 'noLocation' && !hasLocations);
      }
      
      return matchesSearch && matchesStato && matchesPeriodo && matchesLocation;
    }).sort((a, b) => {
      const isAsc = order === 'asc';
      
      // Funzione per confrontare valori, considerando anche i null/undefined
      function compare(a, b) {
        if (a === undefined || a === null) return isAsc ? -1 : 1;
        if (b === undefined || b === null) return isAsc ? 1 : -1;
        if (a < b) return isAsc ? -1 : 1;
        if (a > b) return isAsc ? 1 : -1;
        return 0;
      }
      
      switch (orderBy) {
        case 'codice': return compare(a.codice, b.codice);
        case 'descrizione': return compare(a.descrizione, b.descrizione);
        case 'cliente': return compare(a.cliente, b.cliente);
        case 'stato': return compare(a.stato, b.stato);
        case 'dataInizio': 
          return compare(
            a.dataInizio ? new Date(a.dataInizio) : null, 
            b.dataInizio ? new Date(b.dataInizio) : null
          );
        case 'dataFine': 
          return compare(
            a.dataFine ? new Date(a.dataFine) : null, 
            b.dataFine ? new Date(b.dataFine) : null
          );
        default: return 0;
      }
    });
  }, [commesse, searchTerm, filterStato, filterPeriodo, filterLocation, startDate, endDate, orderBy, order]);

  // Estrae commesse paginate per la visualizzazione corrente
  const paginatedCommesse = useMemo(() => {
    return filteredCommesse.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [filteredCommesse, page, rowsPerPage]);

  // Filtra e ordina i task
  const filteredTasks = useMemo(() => {
    return allTasks.filter(task => {
      // Filtro per testo di ricerca
      const searchMatch = searchTaskTerm === '' || 
        task.nome?.toLowerCase().includes(searchTaskTerm.toLowerCase()) ||
        task.descrizione?.toLowerCase().includes(searchTaskTerm.toLowerCase());
      
      // Filtro per commessa
      const commessaMatch = filterTaskCommessa === 'all' || task.commessa?.id === filterTaskCommessa;
      
      // Filtro per stato
      const statoMatch = filterTaskStato === 'all' || task.stato === filterTaskStato;
      
      return searchMatch && commessaMatch && statoMatch;
    }).sort((a, b) => {
      const isAsc = taskOrder === 'asc';
      
      function compare(a, b) {
        if (a === undefined || a === null) return isAsc ? -1 : 1;
        if (b === undefined || b === null) return isAsc ? 1 : -1;
        if (a < b) return isAsc ? -1 : 1;
        if (a > b) return isAsc ? 1 : -1;
        return 0;
      }
      
      switch (taskOrderBy) {
        case 'nome': return compare(a.nome, b.nome);
        case 'descrizione': return compare(a.descrizione, b.descrizione);
        case 'commessa': return compare(a.commessa?.codice, b.commessa?.codice);
        case 'stato': return compare(a.stato, b.stato);
        case 'dataInizio': return compare(
          a.dataInizio ? new Date(a.dataInizio) : null,
          b.dataInizio ? new Date(b.dataInizio) : null
        );
        case 'dataFine': return compare(
          a.dataFine ? new Date(a.dataFine) : null,
          b.dataFine ? new Date(b.dataFine) : null
        );
        case 'durataPrevista': return compare(a.durataPrevista, b.durataPrevista);
        case 'numeroRisorse': return compare(a.numeroRisorse, b.numeroRisorse);
        default: return 0;
      }
    });
  }, [allTasks, searchTaskTerm, filterTaskCommessa, filterTaskStato, taskOrderBy, taskOrder]);

  // Pagina i task filtrati
  const paginatedTasks = useMemo(() => {
    return filteredTasks.slice(taskPage * taskRowsPerPage, taskPage * taskRowsPerPage + taskRowsPerPage);
  }, [filteredTasks, taskPage, taskRowsPerPage]);
  
  // Gestione ordinamento task
  const handleTaskSortRequest = (property) => {
    const isAsc = taskOrderBy === property && taskOrder === 'asc';
    setTaskOrder(isAsc ? 'desc' : 'asc');
    setTaskOrderBy(property);
  };

  // Gestione paginazione task
  const handleTaskChangePage = (event, newPage) => {
    setTaskPage(newPage);
  };

  const handleTaskChangeRowsPerPage = (event) => {
    setTaskRowsPerPage(parseInt(event.target.value, 10));
    setTaskPage(0);
  };
  
  // Gestione apertura dettaglio task
  const handleOpenTaskDetails = (task) => {
    setSelectedTask(task);
    setTaskDialogOpen(true);
  };

  // Gestione filtri task
  const handleSearchTaskChange = (event) => setSearchTaskTerm(event.target.value);
  const handleFilterTaskCommessaChange = (event) => setFilterTaskCommessa(event.target.value);
  const handleFilterTaskStatoChange = (event) => setFilterTaskStato(event.target.value);
  
  // Funzioni per la gestione dei task (CRUD)
  const handleCreateTask = () => {
    setEditingTask(null);
    setTaskFormOpen(true);
  };
  
  const handleEditTask = (task) => {
    setEditingTask(task);
    setTaskFormOpen(true);
  };
    const handleSaveTask = async (taskData) => {
    setSavingTask(true);
    try {
      let updatedTask;
      
      if (taskData.id) {
        // Aggiornamento task esistente
        try {
          const res = await apiClient.task.update(taskData.id, taskData);
          updatedTask = res.data;
          setNotification({
            open: true,
            message: 'Task aggiornato con successo',
            severity: 'success'
          });
        } catch (apiError) {
          console.error('Errore API durante l\'aggiornamento del task:', apiError);
          setNotification({
            open: true,
            message: `Errore durante l'aggiornamento del task: ${apiError.response?.data?.message || apiError.message || 'Errore di connessione al server'}`,
            severity: 'error'
          });
          throw apiError; // Rilancia l'errore per evitare di chiudere il form
        }
      } else {
        // Creazione nuovo task
        try {
          const res = await apiClient.task.create(taskData);
          updatedTask = res.data;
          setNotification({
            open: true,
            message: 'Task creato con successo',
            severity: 'success'
          });
        } catch (apiError) {
          console.error('Errore API durante la creazione del task:', apiError);
          setNotification({
            open: true,
            message: `Errore durante la creazione del task: ${apiError.response?.data?.message || apiError.message || 'Errore di connessione al server'}`,
            severity: 'error'
          });
          throw apiError; // Rilancia l'errore per evitare di chiudere il form
        }
      }
      
      // Aggiorna la lista delle commesse per includere il nuovo/aggiornato task
      try {
        await fetchCommesse();
      } catch (fetchError) {
        console.error('Errore durante il ricaricamento delle commesse:', fetchError);
        // Non blocchiamo il flusso per questo tipo di errore
      }
      
      // Chiude il form
      setTaskFormOpen(false);
      
    } catch (error) {
      console.error('Errore durante il salvataggio del task:', error);
      // La notifica è già gestita nei blocchi try/catch interni
    } finally {
      setSavingTask(false);
    }
  };
  
  const handleDeleteTask = async (taskId) => {
    if (window.confirm('Sei sicuro di voler eliminare questo task?')) {
      setDeletingTask(true);
      try {
        await apiClient.task.delete(taskId);
        
        // Aggiorna la lista delle commesse
        await fetchCommesse();
        
        setNotification({
          open: true,
          message: 'Task eliminato con successo',
          severity: 'success'
        });
        
        // Chiude eventuali dialog aperti
        setTaskDialogOpen(false);
        
      } catch (error) {
        console.error('Errore durante l\'eliminazione del task:', error);
        setNotification({
          open: true,
          message: `Errore: ${error.response?.data?.message || error.message || 'Errore durante l\'eliminazione'}`,
          severity: 'error'
        });
      } finally {
        setDeletingTask(false);
      }
    }
  };
  
  // Chiude la notifica
  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };
  
  // Gestione apertura/chiusura drawer e navigazione
  const handleMenuClick = () => setDrawerOpen(true);
  const handleDrawerClose = () => setDrawerOpen(false);
  const handleMenuNavigate = (section) => {
    setDrawerOpen(false);
  };
  const handleLogout = () => {
    setDrawerOpen(false);
    localStorage.clear();
    window.location.href = '/login';
  };
  const handleSync = () => {
    setDrawerOpen(false);
    fetchCommesse();
  };

  // Visualizza dettagli di una commessa
  const handleOpenDetails = (commessa) => {
    setSelectedCommessa(commessa);
    setDetailsOpen(true);
  };

  // Gestione dialog per le location
  const handleOpenLocationDialog = (commessa) => {
    setSelectedCommessaForLocation(commessa);
    setLocationDialogOpen(true);
  };

  // Gestione dialog per commesse nelle vicinanze
  const handleOpenNearbyCommesseDialog = () => {
    setNearbyCommesseDialogOpen(true);
  };

  const handleSelectNearbyCommessa = (commessa) => {
    // Trova la commessa completa nel nostro stato
    const completeCommessa = commesse.find(c => c.id === commessa.id);
    if (completeCommessa) {
      handleOpenDetails(completeCommessa);
    } else {
      // Se non la troviamo, ricarichiamo tutte le commesse
      fetchCommesse().then(() => {
        const updatedCommessa = commesse.find(c => c.id === commessa.id);
        if (updatedCommessa) {
          handleOpenDetails(updatedCommessa);
        }
      });
    }
  };

  // Formatta date per la visualizzazione
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = parseISO(dateString);
      return isValid(date) ? format(date, 'dd/MM/yyyy') : dateString;
    } catch (e) {
      return dateString;
    }
  };

  // Genera il colore del chip in base allo stato della commessa
  const getStatusColor = (status) => {
    switch(status) {
      case 'attiva': return 'success';
      case 'completata': return 'primary';
      case 'sospesa': return 'warning';
      case 'annullata': return 'error';
      default: return 'default';
    }
  };

  // Cambia tab attiva
  const handleChangeTab = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      bgcolor: '#f5f5f5',
      overflow: 'hidden',
    }}>
      {/* Header stile Dashboard */}
      <Box sx={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1201 }}>        <DashboardHeader 
          APP_VERSION={APP_VERSION}
          renderNotificationIcon={() => null}
          getTodayEntries={() => []} // Questo restituisce sempre un array vuoto
          entries={[]}
          NotificationList={() => null}
          onMenuClick={handleMenuClick}
          syncOfflineData={() => {}}
          isOnline={true}
          offlineEntries={[]}
        />
      </Box>
      
      {/* Spazio per l'header */}
      <Box sx={{ height: { xs: '80px', sm: '90px' } }} />
      
      {/* Layout principale */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        height: 'calc(100vh - 90px)',
        overflow: 'hidden',
        maxWidth: '100%',
      }}>
        <Container maxWidth="xl" sx={{ py: 2, flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <Grid container spacing={2}>
            {/* Titolo e bottoni principali */}
            <Grid item xs={12} md={8}>
              <Typography variant="h4" fontWeight="bold">
                Gestione Eventi e Commesse
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                Visualizza e gestisci commesse, task, personale e funzioni/skill
              </Typography>
            </Grid>

            {/* Bottoni azioni principali */}
            <Grid item xs={12} md={4} sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-start', gap: 1 }}>
              <Button 
                variant="contained" 
                startIcon={<AddIcon />} 
                color="primary"
                onClick={handleCreateCommessa}
              >
                Nuova Commessa
              </Button>
              <Button
                variant="outlined"
                startIcon={<LocationOnIcon />}
                onClick={handleOpenNearbyCommesseDialog}
              >
                Commesse Vicine
              </Button>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={fetchCommesse}
              >
                Aggiorna
              </Button>
            </Grid>

            {/* Sezione Filtri */}
            <Grid item xs={12}>
              <Paper sx={{ p: 2, mb: 2 }}>
                <Grid container spacing={2} alignItems="center">
                  {/* Barra di ricerca */}
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      variant="outlined"
                      label="Cerca commesse"
                      value={searchTerm}
                      onChange={handleSearchChange}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon />
                          </InputAdornment>
                        ),
                        endAdornment: searchTerm ? (
                          <InputAdornment position="end">
                            <IconButton size="small" onClick={() => setSearchTerm('')}>
                              <ClearIcon fontSize="small" />
                            </IconButton>
                          </InputAdornment>
                        ) : null
                      }}
                      size="small"
                    />
                  </Grid>
                  
                  {/* Filtro Stato */}
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Stato</InputLabel>
                      <Select
                        value={filterStato}
                        onChange={handleFilterStatoChange}
                        label="Stato"
                      >
                        <MenuItem value="all">Tutti gli stati</MenuItem>
                        <MenuItem value="attiva">Attiva</MenuItem>
                        <MenuItem value="completata">Completata</MenuItem>
                        <MenuItem value="sospesa">Sospesa</MenuItem>
                        <MenuItem value="annullata">Annullata</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  {/* Filtro Periodo */}
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Periodo</InputLabel>
                      <Select
                        value={filterPeriodo}
                        onChange={handlePeriodoChange}
                        label="Periodo"
                      >
                        <MenuItem value="all">Tutti i periodi</MenuItem>
                        <MenuItem value="current">Mese corrente</MenuItem>
                        <MenuItem value="custom">Personalizzato</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  {/* Filtro Location */}
                  <Grid item xs={12} sm={6} md={2}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Location</InputLabel>
                      <Select
                        value={filterLocation}
                        onChange={handleFilterLocationChange}
                        label="Location"
                      >
                        <MenuItem value="all">Tutte</MenuItem>
                        <MenuItem value="hasLocation">Con location</MenuItem>
                        <MenuItem value="noLocation">Senza location</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  {/* Bottone Reset Filtri */}
                  <Grid item xs={12} md={2} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      variant="outlined"
                      onClick={handleClearFilters}
                      startIcon={<ClearIcon />}
                      size="small"
                      sx={{ whiteSpace: 'nowrap' }}
                    >
                      Reset Filtri
                    </Button>
                  </Grid>
                  
                  {/* Selezione Date personalizzate - visibile solo se periodo = custom */}
                  {filterPeriodo === 'custom' && (
                    <>
                      <Grid item xs={12} sm={6} md={3}>                        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={it}>
                          <DatePicker
                            label="Data inizio"
                            value={startDate}
                            onChange={setStartDate}
                            format="dd/MM/yyyy"
                            slotProps={{ textField: { size: "small", fullWidth: true } }}
                          />
                        </LocalizationProvider>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>                        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={it}>
                          <DatePicker
                            label="Data fine"
                            value={endDate}
                            onChange={setEndDate}
                            minDate={startDate}
                            format="dd/MM/yyyy"
                            slotProps={{ textField: { size: "small", fullWidth: true } }}
                          />
                        </LocalizationProvider>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Stack direction="row" spacing={1}>
                          <Button size="small" onClick={() => handleSetPeriod('currentMonth')}>Mese corrente</Button>
                          <Button size="small" onClick={() => handleSetPeriod('lastMonth')}>Mese scorso</Button>
                          <Button size="small" onClick={() => handleSetPeriod('currentYear')}>Anno corrente</Button>
                        </Stack>
                      </Grid>
                    </>
                  )}
                  
                  {/* Conteggio risultati */}
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      {filteredCommesse.length} commesse trovate
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          </Grid>

          {/* Tabs per navigare tra commesse, task, personale, funzioni */}
          <Paper sx={{ mb: 2 }}>
            <Tabs
              value={activeTab}
              onChange={handleChangeTab}
              variant="scrollable"
              scrollButtons="auto"
              aria-label="sezioni dashboard"
            >
              <Tab
                label={<Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <WorkIcon fontSize="small" sx={{ mr: 1 }} /> Commesse
                </Box>}
                value="commesse"
              />
              <Tab
                label={<Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <AssignmentIcon fontSize="small" sx={{ mr: 1 }} /> Task
                </Box>}
                value="task"
              />
              <Tab
                label={<Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <PersonIcon fontSize="small" sx={{ mr: 1 }} /> Personale
                </Box>}
                value="personale"
              />
              <Tab
                label={<Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <ListAltIcon fontSize="small" sx={{ mr: 1 }} /> Funzioni/Skill
                </Box>}
                value="funzioni"
              />
              <Tab
                label={<Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <EventNoteIcon fontSize="small" sx={{ mr: 1 }} /> Pianificazione
                </Box>}
                value="pianificazione"
              />
            </Tabs>
          </Paper>

          {/* Contenuto principale */}
          <Paper sx={{ flexGrow: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <CircularProgress />
              </Box>
            ) : error ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography color="error">{error}</Typography>
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={fetchCommesse}
                  startIcon={<RefreshIcon />}
                  sx={{ mt: 2 }}
                >
                  Riprova
                </Button>
              </Box>
            ) : activeTab === 'commesse' && filteredCommesse.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography color="text.secondary">
                  Nessuna commessa disponibile con i filtri selezionati.
                </Typography>
              </Box>
            ) : activeTab === 'commesse' ? (
              <TableContainer sx={{ flexGrow: 1, overflow: 'auto' }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>
                        <TableSortLabel
                          active={orderBy === 'codice'}
                          direction={orderBy === 'codice' ? order : 'asc'}
                          onClick={createSortHandler('codice')}
                        >
                          Codice
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={orderBy === 'descrizione'}
                          direction={orderBy === 'descrizione' ? order : 'asc'}
                          onClick={createSortHandler('descrizione')}
                        >
                          Descrizione
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={orderBy === 'cliente'}
                          direction={orderBy === 'cliente' ? order : 'asc'}
                          onClick={createSortHandler('cliente')}
                        >
                          Cliente
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={orderBy === 'stato'}
                          direction={orderBy === 'stato' ? order : 'asc'}
                          onClick={createSortHandler('stato')}
                        >
                          Stato
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={orderBy === 'dataInizio'}
                          direction={orderBy === 'dataInizio' ? order : 'asc'}
                          onClick={createSortHandler('dataInizio')}
                        >
                          Data Inizio
                        </TableSortLabel>
                      </TableCell>                      <TableCell>
                        <TableSortLabel
                          active={orderBy === 'dataFine'}
                          direction={orderBy === 'dataFine' ? order : 'asc'}
                          onClick={createSortHandler('dataFine')}
                        >
                          Data Fine
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>
                        <TableSortLabel>
                          Location
                        </TableSortLabel>
                      </TableCell>
                      <TableCell align="center">Task</TableCell>
                      <TableCell align="right">Azioni</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedCommesse.map((commessa) => (
                      <TableRow
                        key={commessa.id}
                        hover
                        sx={{
                          cursor: 'pointer',
                          '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' }
                        }}
                        onClick={() => handleOpenDetails(commessa)}
                      >                        <TableCell>{commessa.codice}</TableCell>
                        <TableCell>{commessa.descrizione}</TableCell>
                        <TableCell>{commessa.cliente}</TableCell>
                        <TableCell>
                          <Chip
                            label={commessa.stato?.charAt(0).toUpperCase() + commessa.stato?.slice(1)}
                            color={getStatusColor(commessa.stato)}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>{formatDate(commessa.dataInizio)}</TableCell>
                        <TableCell>{formatDate(commessa.dataFine)}</TableCell>                        <TableCell>
                          {commessa.location ? (
                            Array.isArray(commessa.location) && commessa.location.length > 0 ? (
                              <Tooltip title={commessa.location.map(loc => `${loc.nome} (${loc.indirizzo || 'No indirizzo'})`).join(', ')}>
                                <Chip 
                                  label={`${commessa.location.length} location`} 
                                  size="small" 
                                  variant="outlined" 
                                  color="info"
                                  icon={<BusinessIcon fontSize="small" />}
                                />
                              </Tooltip>
                            ) : !Array.isArray(commessa.location) && commessa.location.nome ? (
                              <Tooltip title={`${commessa.location.nome} (${commessa.location.indirizzo || 'No indirizzo'})`}>
                                <Chip 
                                  label={commessa.location.nome} 
                                  size="small" 
                                  variant="outlined" 
                                  color="info"
                                  icon={<BusinessIcon fontSize="small" />}
                                />
                              </Tooltip>
                            ) : (
                              <Chip 
                                label="Nessuna" 
                                size="small" 
                                variant="outlined" 
                                color="default"
                              />
                            )
                          ) : (
                            <Chip 
                              label="Nessuna" 
                              size="small" 
                              variant="outlined" 
                              color="default"
                            />
                          )}
                        </TableCell>
                        <TableCell align="center">
                          <Badge badgeContent={commessa.tasks?.length || 0} color="primary" showZero>
                            <AssignmentIcon color="action" />
                          </Badge>
                        </TableCell>                        <TableCell align="right">
                          <Tooltip title="Visualizza dettagli">
                            <IconButton size="small" onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDetails(commessa);
                            }}>
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Modifica">
                            <IconButton size="small" onClick={(e) => {
                              e.stopPropagation();
                              // Funzione di modifica (da implementare)
                            }}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Gestisci Location">
                            <IconButton size="small" onClick={(e) => {
                              e.stopPropagation();
                              handleOpenLocationDialog(commessa);
                            }}>
                              <BusinessIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : activeTab === 'task' ? (
              // Tab Task
              <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                {/* Filtri per i task */}
                <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Cerca task"
                        variant="outlined"
                        placeholder="Nome, descrizione..."
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <SearchIcon fontSize="small" />
                            </InputAdornment>
                          )
                        }}
                        value={searchTaskTerm}
                        onChange={handleSearchTaskChange}
                      />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Filtro commessa</InputLabel>
                        <Select
                          label="Filtro commessa"
                          value={filterTaskCommessa}
                          onChange={handleFilterTaskCommessaChange}
                        >
                          <MenuItem value="all">Tutte le commesse</MenuItem>
                          {commesse.map(c => (
                            <MenuItem key={c.id} value={c.id}>{c.codice} - {c.descrizione}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Stato</InputLabel>
                        <Select
                          label="Stato"
                          value={filterTaskStato}
                          onChange={handleFilterTaskStatoChange}
                        >
                          <MenuItem value="all">Tutti</MenuItem>
                          <MenuItem value="attivo">Attivo</MenuItem>
                          <MenuItem value="completato">Completato</MenuItem>
                          <MenuItem value="annullato">Annullato</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>                    <Grid item xs={12} sm={2}>
                      <Button
                        fullWidth
                        variant="contained"
                        color="primary"
                        startIcon={<AddIcon />}
                        onClick={handleCreateTask}
                      >
                        Nuovo Task
                      </Button>
                    </Grid>
                  </Grid>
                </Box>
                
                {/* Tabella Task */}
                <TableContainer sx={{ flexGrow: 1, overflow: 'auto' }}>
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Nome</TableCell>
                        <TableCell>Descrizione</TableCell>
                        <TableCell>Commessa</TableCell>
                        <TableCell>Stato</TableCell>
                        <TableCell>Data Inizio</TableCell>
                        <TableCell>Data Fine</TableCell>
                        <TableCell>Durata (ore)</TableCell>
                        <TableCell>Risorse</TableCell>
                        <TableCell align="right">Azioni</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {/* Raccogliamo tutti i task da tutte le commesse */}
                      {commesse.flatMap(commessa => 
                        (commessa.tasks || []).map(task => (
                          <TableRow 
                            key={`task-${task.id}`}
                            hover
                            sx={{ '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' } }}
                          >
                            <TableCell>{task.nome}</TableCell>
                            <TableCell>{task.descrizione}</TableCell>
                            <TableCell>
                              <Chip 
                                label={commessa.codice} 
                                size="small" 
                                variant="outlined" 
                                color="primary"
                              />
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={task.stato?.charAt(0).toUpperCase() + task.stato?.slice(1)} 
                                size="small"
                                color={
                                  task.stato === 'attivo' ? 'success' : 
                                  task.stato === 'completato' ? 'primary' : 'default'
                                }
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell>{formatDate(task.dataInizio)}</TableCell>
                            <TableCell>{formatDate(task.dataFine)}</TableCell>
                            <TableCell>{task.durataPrevista || '-'}</TableCell>
                            <TableCell>{task.numeroRisorse || 1}</TableCell>
                            <TableCell align="right">
                              <Tooltip title="Visualizza dettagli">
                                <IconButton size="small" onClick={() => handleOpenTaskDetails(task)}>
                                  <VisibilityIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>                              <Tooltip title="Modifica">
                                <IconButton size="small" onClick={() => handleEditTask(task)}>
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Elimina">
                                <IconButton size="small" onClick={() => handleDeleteTask(task.id)}>
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </TableCell>                          </TableRow>
                        ))
                      )}
                      
                      {commesse.flatMap(c => c.tasks || []).length === 0 && (
                        <TableRow>
                          <TableCell colSpan={9} align="center">
                            <Typography variant="body2" sx={{ py: 3, color: 'text.secondary' }}>
                              Nessun task trovato.
                            </Typography>
                          </TableCell>
                        </TableRow>                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>            ) : activeTab === 'personale' ? (
              <PersonaleTab />
            ) : activeTab === 'funzioni' ? (
              <FunzioniSkillTab />
            ) : activeTab === 'pianificazione' ? (
              <ResourcePlannerView commessa={selectedCommessa} />
            ) : (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography>Sezione '{activeTab}' in fase di sviluppo</Typography>
              </Box>
            )}

            {/* Paginazione (solo per tab commesse) */}
            {activeTab === 'commesse' && !loading && !error && filteredCommesse.length > 0 && (
              <TablePagination
                rowsPerPageOptions={[5, 10, 25, 50]}
                component="div"
                count={filteredCommesse.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                labelRowsPerPage="Righe per pagina:"
                labelDisplayedRows={({ from, to, count }) => `${from}-${to} di ${count}`}
              />
            )}

            {/* Paginazione (per tab task) */}
            {activeTab === 'task' && !loading && !error && filteredTasks.length > 0 && (
              <TablePagination
                rowsPerPageOptions={[5, 10, 25, 50]}
                component="div"
                count={filteredTasks.length}
                rowsPerPage={taskRowsPerPage}
                page={taskPage}
                onPageChange={handleTaskChangePage}
                onRowsPerPageChange={handleTaskChangeRowsPerPage}
                labelRowsPerPage="Righe per pagina:"
                labelDisplayedRows={({ from, to, count }) => `${from}-${to} di ${count}`}
              />
            )}
          </Paper>
        </Container>
      </Box>

      {/* Drawer menu laterale */}
      <MenuDrawer
        open={drawerOpen}
        onClose={handleDrawerClose}
        onNavigate={handleMenuNavigate}
        onLogout={handleLogout}
        onSync={handleSync}
      />
      
      {/* Dialog Dettagli Commessa */}
      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedCommessa && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="h6">
                  <WorkIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  {selectedCommessa.codice} - {selectedCommessa.descrizione}
                </Typography>
                <Chip
                  label={selectedCommessa.stato?.charAt(0).toUpperCase() + selectedCommessa.stato?.slice(1)}
                  color={getStatusColor(selectedCommessa.stato)}
                  size="small"
                />
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" fontWeight="bold">Informazioni generali</Typography>
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body2">
                      <BusinessIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 1 }} />
                      Cliente: <strong>{selectedCommessa.cliente}</strong>
                    </Typography>
                    <Typography variant="body2">
                      <CalendarTodayIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 1 }} />
                      Periodo: <strong>{formatDate(selectedCommessa.dataInizio)} - {formatDate(selectedCommessa.dataFine)}</strong>
                    </Typography>
                    {selectedCommessa.budget && (
                      <Typography variant="body2">
                        Budget: <strong>€ {selectedCommessa.budget}</strong>
                      </Typography>
                    )}
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" fontWeight="bold">Stato attività</Typography>
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body2">
                      Task: <strong>{selectedCommessa.tasks?.length || 0} totali</strong>
                    </Typography>
                    <Typography variant="body2">
                      Personale assegnato: <strong>--</strong>
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle1" fontWeight="bold">Task</Typography>
                  {selectedCommessa.tasks?.length > 0 ? (
                    <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Nome</TableCell>
                            <TableCell>Descrizione</TableCell>
                            <TableCell align="right">Stato</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {selectedCommessa.tasks.map(task => (
                            <TableRow key={task.id}>
                              <TableCell>{task.nome}</TableCell>
                              <TableCell>{task.descrizione}</TableCell>
                              <TableCell align="right">
                                <Chip 
                                  label={task.stato} 
                                  size="small" 
                                  color={task.stato === 'attivo' ? 'success' : 'default'} 
                                  variant="outlined" 
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Nessun task associato a questa commessa
                    </Typography>
                  )}
                </Grid>
              </Grid>
            </DialogContent>            <DialogActions>
              <Button onClick={() => setDetailsOpen(false)}>Chiudi</Button>
              <Button 
                variant="outlined" 
                color="primary"
                startIcon={<AssignmentIcon />}
                onClick={() => {
                  // Chiudiamo il dialog dei dettagli
                  setDetailsOpen(false);
                  // Creiamo un nuovo task precompilato con la commessa selezionata
                  setEditingTask({
                    commessaId: selectedCommessa.id,
                    commessa: {
                      id: selectedCommessa.id,
                      codice: selectedCommessa.codice,
                      descrizione: selectedCommessa.descrizione
                    }
                  });
                  setTaskFormOpen(true);
                }}
              >
                Aggiungi Task
              </Button>
              <Button 
                variant="contained" 
                color="primary"
                startIcon={<EditIcon />}
                onClick={() => {
                  // Chiudiamo il dialog dei dettagli
                  setDetailsOpen(false);
                  // Apriamo il form di modifica con la commessa selezionata
                  handleEditCommessa(selectedCommessa);
                }}
              >
                Modifica Commessa
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>      {/* Dialog Dettagli Task */}
      <TaskDetailsDialog
        open={taskDialogOpen}
        onClose={() => setTaskDialogOpen(false)}
        task={selectedTask}
        onEdit={(task) => {
          setTaskDialogOpen(false);
          handleEditTask(task);
        }}
        onDelete={(taskId) => {
          setTaskDialogOpen(false);
          handleDeleteTask(taskId);
        }}
      />
      
      {/* Form Creazione/Modifica Task */}
      <TaskForm
        open={taskFormOpen}
        onClose={() => setTaskFormOpen(false)}
        task={editingTask}
        commesse={commesse}
        onSave={handleSaveTask}
        saving={savingTask}
        title={editingTask ? "Modifica Task" : "Nuovo Task"}
      />
      
      {/* Dialog di creazione/modifica commessa */}
      <CommessaForm
        open={commessaFormOpen}
        onClose={() => setCommessaFormOpen(false)}
        commessa={editingCommessa}
        onSave={handleSaveCommessa}
        saving={savingCommessa}
      />
      
      {/* Form assegnazione personale ai task */}
      <TaskPersonaleForm 
        open={taskPersonaleFormOpen} 
        onClose={() => setTaskPersonaleFormOpen(false)} 
        task={selectedTaskForPersonale}
        onSave={handleSaveTaskPersonale}
      />
      
      {/* Dialog gestione location */}
      <LocationDialog 
        open={locationDialogOpen}
        onClose={() => setLocationDialogOpen(false)}
        commessa={selectedCommessaForLocation}
        isAdvanced={true}
        onSave={() => {
          // Ricarica le commesse per aggiornare i dati delle location
          fetchCommesse();
        }}
      />
      
      {/* Dialog per commesse nelle vicinanze */}
      <NearbyCommesseDialog
        open={nearbyCommesseDialogOpen}
        onClose={() => setNearbyCommesseDialogOpen(false)}
        onSelectCommessa={handleSelectNearbyCommessa}
      />
      
      {/* Snackbar notifiche */}
      <Snackbar 
        open={notification.open} 
        autoHideDuration={6000} 
        onClose={() => setNotification({ ...notification, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setNotification({ ...notification, open: false })} 
          severity={notification.severity}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default EventiDashboard;
