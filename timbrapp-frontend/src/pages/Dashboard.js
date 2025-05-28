// src/pages/Dashboard.js
import React, { useEffect, useState } from 'react';
// Ottimizzazione Material-UI Tree Shaking - Import specifici
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import IconButton from '@mui/material/IconButton';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Typography from '@mui/material/Typography';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Paper from '@mui/material/Paper';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
// Versione dell'applicazione (allineata con version.json)
const APP_VERSION = 'v1.3.0';
// Icons
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ListAltIcon from '@mui/icons-material/ListAlt';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import MenuIcon from '@mui/icons-material/Menu';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import WorkIcon from '@mui/icons-material/Work';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import SyncIcon from '@mui/icons-material/Sync';
import NotificationsIcon from '@mui/icons-material/Notifications';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import NotificationsOffIcon from '@mui/icons-material/NotificationsOff';

import { useNavigate } from 'react-router-dom';
import api from '../api';
import NotificationList from '../components/NotificationList';
import { 
  isPushNotificationSupported,
  initializePushNotifications,
  unsubscribeFromPushNotifications
} from '../pushNotifications';

// Import servizi per IndexedDB
import {
  initDB,
  isOnline,
  saveOfflineTimbratura,
  getOfflineTimbrature,
  getCachedTimbrature,
  cacheServerTimbrature,
  syncOfflineData as syncOfflineDataService
} from '../services/indexedDBService';

import ShiftCard from '../components/ShiftCard';
import DashboardHeader from '../components/DashboardHeader';
import StatusIndicators from '../components/StatusIndicators';
import ActionButtons from '../components/ActionButtons';
import TimeEntriesSummary from '../components/TimeEntriesSummary';
import BottomNavBar from '../components/BottomNavBar';
import { useTimbrature } from '../hooks/useTimbrature';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { useTimbrAppPrefetch } from '../hooks/usePrefetch';
import { usePerformanceMonitor } from '../hooks/usePerformanceMonitor';
import MenuDrawer from '../components/MenuDrawer';

function Dashboard() {
  // User state
  const [user, setUser] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [bottomNavValue, setBottomNavValue] = useState(0);
  // Stato online/offline locale
  const [isNetworkOnline, setIsNetworkOnline] = useState(navigator.onLine);
  // Versione dell'applicazione (sincronizzata con version.json)
  const [appVersion, setAppVersion] = useState('');

  const [drawerOpen, setDrawerOpen] = useState(false);

  // Hook per performance monitoring
  const { startRenderMeasure, endRenderMeasure, performanceScore } = usePerformanceMonitor();
  
  // Hook per prefetching intelligente
  const { 
    prefetchDashboardData, 
    prefetchUserRequests, 
    isPrefetching 
  } = useTimbrAppPrefetch();

  // Performance measurement per il dashboard
  useEffect(() => {
    startRenderMeasure('Dashboard');
    return () => endRenderMeasure('Dashboard');
  }, [startRenderMeasure, endRenderMeasure]);

  const handleMenuClick = () => setDrawerOpen(true);
  const handleDrawerClose = () => setDrawerOpen(false);
  const handleMenuNavigate = (section) => {
    setDrawerOpen(false);
    // Prefetch data per la sezione selezionata
    if (user?.id) {
      switch (section) {
        case 'richieste':
          prefetchUserRequests(user.id);
          break;
        case 'dashboard':
          prefetchDashboardData();
          break;
      }
    }
    // Esempio: navigazione o azioni
    if (section === 'profile') navigate('/profile');
    if (section === 'history') navigate('/history');
    if (section === 'documentazione') navigate('/documentazione');
    if (section === 'settings') navigate('/settings');
    if (section === 'help') navigate('/help');
  };
  const handleLogout = () => {
    setDrawerOpen(false);
    // Esegui logout reale qui
    localStorage.clear();
    navigate('/login');
  };
  const handleSync = () => {
    setDrawerOpen(false);
    syncOfflineData();
    showSnackbar('Sincronizzazione avviata', 'info');
  };

  useEffect(() => {
    fetch('/version.json?ts=' + Date.now(), { cache: 'no-store' })
      .then(res => res.json())
      .then(data => setAppVersion(data.version || ''))
      .catch(() => setAppVersion(''));
  }, []);

  // Gestione eventi online/offline come Requests
  useEffect(() => {
    const handleOnline = () => {
      setIsNetworkOnline(true);
      setSnackbar({ open: true, message: 'Connessione ripristinata. Sincronizzazione in corso...', severity: 'success' });
      // Puoi chiamare qui eventuale syncOfflineData se vuoi
    };
    const handleOffline = () => {
      setIsNetworkOnline(false);
      setSnackbar({ open: true, message: 'Connessione persa. Sei offline.', severity: 'warning' });
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setIsNetworkOnline(navigator.onLine);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Shift info (in una vera app, questi dati arriverebbero dal server)
  const [shiftInfo, setShiftInfo] = useState({
    hours: '09:00 – 17:00',
    location: 'Sede Centrale',
    department: 'Assistenza Clienti'
  });
  
  const navigate = useNavigate();

  // Snackbar helpers
  const showSnackbar = (msg, sev = 'info') => setSnackbar({ open: true, message: msg, severity: sev });
  const handleCloseSnackbar = () => setSnackbar(prev => ({ ...prev, open: false }));

  // useTimbrature custom hook
  const {
    entries,
    offlineEntries,
    entriesSource,
    // isNetworkOnline, // RIMOSSO: ora viene da stato locale
    syncOfflineData,
    clockedIn,
    onBreak,
    mode,
    getTodayEntries,
    getTodayEntryByType,
    handleClockAction,
    handleBreakAction
  } = useTimbrature(showSnackbar, isNetworkOnline);

  // const isOnline = useOnlineStatus(); // RIMOSSO: usiamo solo isNetworkOnline

  const {
    notificationStatus,
    setNotificationStatus,
    checkNotificationStatus,
    togglePushNotifications
  } = usePushNotifications(showSnackbar);

  // Today's date
  const today = new Date();
  const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
  const todayString = today.toLocaleDateString('it-IT', options);

  // Renderizza icona notifiche in base allo stato
  const renderNotificationIcon = () => {
    if (notificationStatus === 'unsupported') {
      return null;
    }
    
    if (notificationStatus === 'enabled') {
      return (
        <IconButton 
          color="inherit" 
          onClick={togglePushNotifications}
          size="medium"
          sx={{ mr: 1 }}
          aria-label="disattiva notifiche"
        >
          <NotificationsActiveIcon sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem' } }} />
        </IconButton>
      );
    }
    
    if (notificationStatus === 'blocked') {
      return (
        <IconButton 
          color="inherit" 
          onClick={togglePushNotifications}
          size="medium"
          sx={{ mr: 1 }}
          aria-label="notifiche bloccate"
        >
          <NotificationsOffIcon sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem' } }} />
        </IconButton>
      );
    }
    
    return (
      <IconButton 
        color="inherit" 
        onClick={togglePushNotifications}
        size="medium"
        sx={{ mr: 1 }}
        aria-label="attiva notifiche"
      >
        <NotificationsIcon sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem' } }} />
      </IconButton>
    );
  };

  // Inizializzazione del database e gestione eventi online/offline
  useEffect(() => {
    // Inizializza il database IndexedDB
    initDB().catch(err => console.error('Errore inizializzazione DB:', err));

    // Funzioni per gestire eventi online/offline
    const handleOnline = () => {
      console.log('🌐 Connessione disponibile');
      
      // Tenta di sincronizzare i dati offline
      syncOfflineData();
    };
    
    const handleOffline = () => {
      console.log('⚠️ Connessione persa');
    };

    // Aggiungi i listener per gli eventi online/offline
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup degli event listener
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // Geolocation prompt
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        () => {},
        () => showSnackbar('Permesso posizione richiesto', 'warning')
      );
    }
  }, []);

  useEffect(() => {
    // Check for notification support and status
    checkNotificationStatus();
  }, []);

  // Fetch authenticated user
  useEffect(() => {
    console.log('📡 fetchUser effect eseguito');
    const fetchUser = async () => {
      try {
        if (!isNetworkOnline) { // usa solo isNetworkOnline
          // Se offline, prova a recuperare i dati utente dalla localStorage
          const cachedUserData = localStorage.getItem('userData');
          if (cachedUserData) {
            setUser(JSON.parse(cachedUserData));
            return;
          }
          return;
        }
        
        const res = await api.get('/api/user');
        console.log('📡 fetchUser response.data:', res.data);
        setUser(res.data);
        
        // Salva i dati utente in localStorage per uso offline
        localStorage.setItem('userData', JSON.stringify(res.data));
      } catch (err) {
        console.error('Errore caricamento utente:', err);
        
        // Se fallisce, prova a usare i dati cached
        const cachedUserData = localStorage.getItem('userData');
        if (cachedUserData) {
          setUser(JSON.parse(cachedUserData));
        }
      }
    };
    fetchUser();
  }, []);

  // Redirect until user loaded
  if (!user) {
    return <Typography>Caricamento dati utente...</Typography>;
  }

  // Navigation
  const handleBottomNavChange = (event, newValue) => {
    setBottomNavValue(newValue);
    if (newValue === 0) {
      // Already on dashboard/timbrature
    } else if (newValue === 1) {
      navigate('/requests');
    } else if (newValue === 2) {
      navigate('/activities');
    } else if (newValue === 3) {
      navigate('/shifts');
    }
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      minHeight: '100vh', 
      pb: { xs: 10, sm: 11 },
      bgcolor: '#f5f5f5',
      overflow: 'hidden', // Blocca scroll globale
      position: 'relative',
      height: '100vh', // Forza altezza viewport
    }}>
      {/* Header AppBar */}
      <Box sx={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1201 }}>
        <DashboardHeader 
          APP_VERSION={appVersion}
          renderNotificationIcon={renderNotificationIcon}
          getTodayEntries={getTodayEntries}
          entries={entries}
          NotificationList={NotificationList}
          onMenuClick={handleMenuClick}
          isOnline={isNetworkOnline}
          offlineEntries={offlineEntries}
          syncOfflineData={syncOfflineData}
        />
      </Box>
      {/* Spazio per compensare l'altezza della barra fissa */}
      <Box sx={{ height: { xs: '80px', sm: '90px' } }} />

      {/* Sezione scrollabile ottimizzata e coerente */}
      <Container
        maxWidth="sm"
        disableGutters
        sx={{
          flex: 1,
          pt: 'env(safe-area-inset-top, 0px)',
          pb: 'env(safe-area-inset-bottom, 0px)',
          px: { xs: 1, sm: 2 }, // padding esterno ridotto
          height: 'auto',
          minHeight: 'auto',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 0.5, // gap tra le card più compatto
        }}
      >
        {/* Spacer per compensare la AppBar */}
        <Box sx={{ height: { xs: '62px', sm: '70px' } }} />
        {/* Card: Turno di oggi */}
        <Box sx={{
          bgcolor: 'white',
          borderRadius: 0.75,
          boxShadow: '0 1px 3px 0 rgba(25, 118, 210, 0.05)',
          p: 1.2,
          width: '100%',
          mx: 0,
        }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1, pl: 1 }}>Turno di oggi</Typography>
          <ShiftCard shiftInfo={shiftInfo} />
        </Box>
        {/* Card: Azioni */}
        <Box sx={{
          bgcolor: 'white',
          borderRadius: 0.75,
          boxShadow: '0 1px 3px 0 rgba(25, 118, 210, 0.05)',
          p: 1.2,
          width: '100%',
          mx: 0,
        }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1, pl: 1 }}>Azioni</Typography>
          <ActionButtons
            clockedIn={clockedIn}
            onBreak={onBreak}
            isNetworkOnline={isNetworkOnline}
            handleClockAction={handleClockAction}
            handleBreakAction={handleBreakAction}
          />
        </Box>
        {/* Card: Riepilogo timbrature */}
        <Box sx={{
          bgcolor: 'white',
          borderRadius: 0.75,
          boxShadow: '0 1px 3px 0 rgba(25, 118, 210, 0.05)',
          p: 1.2,
          width: '100%',
          mx: 0,
        }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1, pl: 1 }}>Riepilogo timbrature</Typography>
          <TimeEntriesSummary getTodayEntryByType={getTodayEntryByType} />
        </Box>
      </Container>
      
      {/* Bottom Navigation */}
      <BottomNavBar 
        bottomNavValue={bottomNavValue}
        handleBottomNavChange={handleBottomNavChange}
      />
      
      {/* Snackbar for notifications */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={snackbar.message === 'Dati caricati dalla cache locale' ? 2000 : 6000}
        onClose={handleCloseSnackbar} 
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{ mb: { xs: 9, sm: 10 } }} // Margine aumentato per evitare sovrapposizioni con la barra
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity} 
          sx={{ 
            width: '100%',
            fontSize: { xs: '0.8rem', sm: '0.875rem' }
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
      
      <MenuDrawer
        open={drawerOpen}
        onClose={handleDrawerClose}
        onNavigate={handleMenuNavigate}
        onLogout={handleLogout}
        onSync={handleSync}
      />
    </Box>
  );
}

export default Dashboard;