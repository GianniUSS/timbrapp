// src/App.js
import React, { useEffect, useState, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material';
import InstallPrompt from './components/InstallPrompt';
import OfflineIndicator from './components/OfflineIndicator';
import EnhancedApp from './components/EnhancedApp';
import { checkNetworkStatus } from './services/indexedDBService';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

// Lazy loading delle pagine con React.lazy
const Login = React.lazy(() => import('./pages/Login'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Requests = React.lazy(() => import('./pages/Requests'));
const AdminNotifications = React.lazy(() => import('./pages/AdminNotifications'));
const Documentazione = React.lazy(() => import('./pages/Documentazione'));
const ShiftsPage = React.lazy(() => import('./pages/ShiftsPage'));
const DashboardWeb = React.lazy(() => import('./pages/DashboardWeb'));
const EventiDashboard = React.lazy(() => import('./pages/EventiDashboard'));
const TestOptimizations = React.lazy(() => import('./pages/TestOptimizations'));

// Componente per proteggere le route che richiedono autenticazione
function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  
  if (!token) {
    // Se non c'è un token, reindirizza al login
    return <Navigate to="/login" replace />;
  }
  
  // Se c'è un token, renderizza il componente figlio
  return children;
}

// Loading component per React.lazy
function LoadingSpinner() {
  return (
    <Box 
      sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        backgroundColor: '#f5f5f5'
      }}
    >
      <CircularProgress size={60} thickness={4} />
    </Box>
  );
}

// Componente per proteggere le route che richiedono autenticazione + ruolo admin
function AdminRoute({ children }) {
  const token = localStorage.getItem('token');
  const isAdmin = localStorage.getItem('isAdmin') === 'true';
  
  if (!token) {
    // Se non c'è un token, reindirizza al login
    return <Navigate to="/login" replace />;
  }
  
  if (!isAdmin) {
    // Se l'utente non è admin, reindirizza alla dashboard
    return <Navigate to="/" replace />;
  }
  
  // Se l'utente è autenticato e admin, renderizza il componente figlio
  return children;
}

// Componente per proteggere la dashboard web/desktop
function WebDashboardRoute({ children }) {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (!token) return <Navigate to="/login" replace />;
  if (!user.isWebDashboard) return <Navigate to="/" replace />;
  return children;
}

// Componente principale ShortcutHandler che gestisce gli URL parameters
function ShortcutHandler({ children }) {
  const navigate = useNavigate();
  const [isProcessingShortcut, setIsProcessingShortcut] = useState(false);
  
  useEffect(() => {
    // Funzione per gestire i parametri dell'URL
    const handleAppShortcuts = () => {
      if (isProcessingShortcut) return;
      
      const urlParams = new URLSearchParams(window.location.search);
      const action = urlParams.get('action');
      const view = urlParams.get('view');
      
      // Se non ci sono parametri da processare, esci
      if (!action && !view) return;
      
      setIsProcessingShortcut(true);
      
      // Gestisce le azioni di timbratura
      if (action === 'timbra-entrata') {
        // Metti qui la logica per la timbratura di entrata
        console.log("Esecuzione timbratura ENTRATA...");
        
        // Esponi un evento personalizzato per la timbratura di entrata
        // che il componente Dashboard può ascoltare
        const event = new CustomEvent('performTimbratura', { 
          detail: { type: 'start' }
        });
        window.dispatchEvent(event);
      } 
      else if (action === 'timbra-uscita') {
        // Metti qui la logica per la timbratura di uscita
        console.log("Esecuzione timbratura USCITA...");
        
        // Esponi un evento personalizzato per la timbratura di uscita
        const event = new CustomEvent('performTimbratura', { 
          detail: { type: 'end' }
        });
        window.dispatchEvent(event);
      } 
      // Gestisce le viste specifiche
      else if (view === 'timbrature') {
        // Naviga alla visualizzazione delle timbrature
        navigate('/');
      }
      
      // Gestisce i contenuti condivisi (da Web Share Target API)
      const sharedTitle = urlParams.get('title');
      const sharedText = urlParams.get('text');
      const sharedUrl = urlParams.get('url');
      
      if (sharedTitle || sharedText || sharedUrl) {
        // Processa i dati condivisi come necessario
        console.log('Contenuto condiviso:', { sharedTitle, sharedText, sharedUrl });
        
        // Esempio: crea una nota con il contenuto condiviso
        if (sharedText) {
          localStorage.setItem('shared_note', JSON.stringify({
            title: sharedTitle || 'Nota condivisa',
            text: sharedText,
            url: sharedUrl,
            timestamp: new Date().toISOString()
          }));
        }
      }
      
      // Pulisci i parametri dall'URL senza ricaricare la pagina
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    };
    
    // Esegui la gestione degli shortcuts al caricamento dell'app
    handleAppShortcuts();
    
    // Esponi la funzione di timbratura per utilizzo globale
    window.performTimbratura = (type) => {
      // Implementa la logica di timbratura qui
      console.log(`Esecuzione timbratura di tipo: ${type}`);
      
      // Esponi un evento custom per un componente specifico
      const event = new CustomEvent('performTimbratura', { detail: { type } });
      window.dispatchEvent(event);
    };
    
    // Pulizia alla chiusura
    return () => {
      delete window.performTimbratura;
      setIsProcessingShortcut(false);
    };
  }, [navigate, isProcessingShortcut]);
  
  return children;
}

function isIos() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

// Componente principale App
function App() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showUpdateBanner, setShowUpdateBanner] = useState(false);

  // Gestisce lo stato online/offline
  useEffect(() => {
    const handleOnline = () => {
      console.log('App è tornata online');
      setIsOnline(true);
      
      // Se c'è un flag per sincronizzare quando torna online
      if (localStorage.getItem('sync_on_reconnect') === 'true') {
        localStorage.removeItem('sync_on_reconnect');
        // Avvia la sincronizzazione 
        if (window.syncOfflineData) {
          window.syncOfflineData();
        }
      }
    };
    
    const handleOffline = () => {
      console.log('App è andata offline');
      setIsOnline(false);
    };
    
    // Controlla inizialmente lo stato di rete
    checkNetworkStatus().then(online => {
      setIsOnline(online);
    });
    
    // Aggiungi listener per gli eventi online/offline
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Imposta un intervallo per controllare periodicamente lo stato di rete
    const networkCheckInterval = setInterval(() => {
      checkNetworkStatus().then(online => {
        if (online !== isOnline) {
          setIsOnline(online);
        }
      });
    }, 30000); // Controlla ogni 30 secondi
    
    // Registra il service worker con callback onUpdate
    serviceWorkerRegistration.register({
      onUpdate: () => {
        console.log('[DEBUG] Service Worker onUpdate: nuova versione rilevata');
        setShowUpdateBanner(true);
      }
    });

    // Pulizia alla chiusura
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(networkCheckInterval);
    };
  }, [isOnline]);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'RELOAD_PAGE') {
          console.log('[DEBUG] Ricevuto messaggio RELOAD_PAGE dal SW');
          window.location.reload();
        }
      });
    }
  }, []);

  useEffect(() => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      // Controlla ogni 60 secondi se c'è una nuova versione del service worker
      const interval = setInterval(() => {
        navigator.serviceWorker.getRegistration().then(reg => {
          if (reg) {
            reg.update();
          }
        });
      }, 60000); // ogni 60 secondi
      return () => clearInterval(interval);
    }
  }, []);

  useEffect(() => {
    const checkVersion = async () => {
      try {
        const res = await fetch('/version.json', { cache: 'no-store' });
        const { version } = await res.json();
        const saved = localStorage.getItem('appVersion');
        if (saved && saved !== version) {
          console.log('[DEBUG] Polling version.json: nuova versione rilevata', version);
          setShowUpdateBanner(true);
        }
        localStorage.setItem('appVersion', version);
      } catch (e) {
        console.warn('[DEBUG] Errore fetch version.json', e);
      }
    };
    checkVersion();
    const id = setInterval(checkVersion, 5 * 60 * 1000); // ogni 5 minuti
    return () => clearInterval(id);
  }, []);

  const handleUpdate = () => {
    if (navigator.serviceWorker.controller) {
      console.log('[DEBUG] handleUpdate: invio SKIP_WAITING al SW');
      navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
    }
    window.location.reload();
  };

  return (
    <EnhancedApp>
      <Router>
        <ShortcutHandler>
        {/* Banner custom per update iOS/macOS e desktop */}
        {showUpdateBanner && (
          <div style={{
            position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 3000,
            background: '#1976d2', color: 'white', padding: 16, textAlign: 'center'
          }}>
            Nuova versione disponibile!
            <button onClick={handleUpdate} style={{
              marginLeft: 16, background: 'white', color: '#1976d2', border: 'none', padding: '8px 16px', borderRadius: 4, cursor: 'pointer'
            }}>
              Aggiorna ora
            </button>
            <div style={{ fontSize: '0.9em', marginTop: 8 }}>
              Su iOS potrebbe essere necessario chiudere e riaprire l’app per completare l’aggiornamento.
            </div>
          </div>
        )}
        {/* Componente per il prompt di installazione PWA */}
        <InstallPrompt />
        
        {/* Indicatore per lo stato offline */}
        {!isOnline && <OfflineIndicator />}
        
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            {/* Reindirizzamento iniziale alla pagina di login quando non autenticato */}
            <Route 
              path="/" 
              element={
                localStorage.getItem('token') 
                  ? <Dashboard /> 
                  : <Navigate to="/login" replace />
              } 
            />
            
            {/* Route pubblica */}
            <Route path="/login" element={<Login />} />
            
            {/* Route dashboard web/desktop */}
            <Route path="/dashboard-web" element={
              <WebDashboardRoute>
                <DashboardWeb />
              </WebDashboardRoute>
            } />
          
          {/* Route protette (richiedono autenticazione) */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/requests"
            element={
              <ProtectedRoute>
                <Requests />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/documentazione"
            element={
              <ProtectedRoute>
                <Documentazione />
              </ProtectedRoute>
            }
          />
          
          <Route path="/shifts" element={
            <ProtectedRoute>
              <ShiftsPage />
            </ProtectedRoute>
          } />
          
          {/* Route dashboard eventi/commesse per utenti web */}
          <Route path="/eventi-dashboard" element={
            <ProtectedRoute>
              <EventiDashboard />
            </ProtectedRoute>
          } />
          
          {/* Route di test per le ottimizzazioni */}
          <Route path="/test-optimizations" element={
            <ProtectedRoute>
              <TestOptimizations />
            </ProtectedRoute>
          } />
          
          {/* Route admin (richiedono autenticazione + ruolo admin) */}
          <Route
            path="/admin/notifications"
            element={
              <AdminRoute>
                <AdminNotifications />
              </AdminRoute>
            }
          />
          
          {/* Gestione route non trovate */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Suspense>
      </ShortcutHandler>
    </Router>
    </EnhancedApp>
  );
}

export default App;