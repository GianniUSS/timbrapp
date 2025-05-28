// src/components/InstallPrompt.js
import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Snackbar, 
  Paper, 
  Typography, 
  IconButton, 
  Stack 
} from '@mui/material';
import AddToHomeScreenIcon from '@mui/icons-material/AddToHomeScreen';
import CloseIcon from '@mui/icons-material/Close';

// Funzione per rilevare iOS 16.4+
function isIOS164OrAbove() {
  const ua = window.navigator.userAgent;
  if (!/iPad|iPhone|iPod/.test(ua) || window.MSStream) return false;
  // Cerca la versione di iOS
  const match = ua.match(/OS (\d+)[._](\d+)(?:[._](\d+))?/);
  if (!match) return false;
  const major = parseInt(match[1], 10);
  const minor = parseInt(match[2] || '0', 10);
  // iOS 16.4+ => major >= 17 oppure major == 16 && minor >= 4
  return (major > 16) || (major === 16 && minor >= 4);
}

function InstallPrompt() {
  const [installPromptEvent, setInstallPromptEvent] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [isIOSDevice, setIsIOSDevice] = useState(false);
  const [isIOS164, setIsIOS164] = useState(false);
  const [isOldIOS, setIsOldIOS] = useState(false);

  useEffect(() => {
    // Controlla se è un dispositivo iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOSDevice(isIOS);
    setIsIOS164(isIOS && isIOS164OrAbove());
    setIsOldIOS(isIOS && !isIOS164OrAbove());

    // Memorizza l'evento beforeinstallprompt per attivarlo più tardi
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setInstallPromptEvent(e);
      setShowPrompt(true);
    };

    // Controlla se l'app è già installata
    const isAppInstalled = window.matchMedia('(display-mode: standalone)').matches 
      || window.navigator.standalone === true;

    if (!isAppInstalled) {
      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      
      // Per iOS, che non supporta l'evento beforeinstallprompt, mostra istruzioni manuali
      if (isIOS && isIOS164OrAbove()) {
        // Controlla se l'utente ha già visto le istruzioni
        const hasSeenInstructions = localStorage.getItem('installPromptDismissed');
        if (!hasSeenInstructions) {
          // Mostra le istruzioni dopo 3 secondi dall'apertura dell'app
          setTimeout(() => {
            setShowInstructions(true);
          }, 3000);
        }
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPromptEvent) return;

    // Mostra il prompt di installazione nativo
    installPromptEvent.prompt();
    
    // Aspetta che l'utente risponda al prompt
    const choiceResult = await installPromptEvent.userChoice;
    
    if (choiceResult.outcome === 'accepted') {
      console.log('Utente ha accettato di installare l\'app');
    } else {
      console.log('Utente ha rifiutato di installare l\'app');
    }
    
    // Resetta l'evento prompt - può essere usato solo una volta
    setInstallPromptEvent(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setShowInstructions(false);
    // Memorizza che l'utente ha chiuso il prompt (per non mostrarlo ad ogni visita)
    localStorage.setItem('installPromptDismissed', 'true');
  };

  // Istruzioni per iOS (Safari)
  const iOSInstructions = (
    <Paper
      elevation={3}
      sx={{
        p: 2,
        position: 'fixed',
        bottom: 16,
        left: 16,
        right: 16,
        zIndex: 1000,
        maxWidth: 600,
        mx: 'auto',
        backgroundColor: '#f5f5f5'
      }}
    >
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
        <Typography variant="h6" component="div">
          Installa TimbrApp
        </Typography>
        <IconButton size="small" onClick={handleDismiss} aria-label="chiudi">
          <CloseIcon />
        </IconButton>
      </Box>
      
      <Typography variant="body2" gutterBottom>
        Per installare l'app sulla schermata Home:
      </Typography>
      
      <Stack spacing={1} sx={{ mt: 1 }}>
        <Typography variant="body2">1. Tocca l'icona di condivisione <span style={{ fontWeight: 'bold' }}>📤</span></Typography>
        <Typography variant="body2">2. Scorri verso il basso e tocca "Aggiungi a Home"</Typography>
        <Typography variant="body2">3. Tocca "Aggiungi" nel popup</Typography>
      </Stack>
      
      <Typography variant="body2" sx={{ mt: 2, fontStyle: 'italic' }}>
        Usa l'app dalla schermata Home per lavorare anche offline!
      </Typography>
    </Paper>
  );

  // Messaggio per iOS troppo vecchio
  const oldIOSMessage = (
    <Paper elevation={3} sx={{ p: 2, position: 'fixed', bottom: 16, left: 16, right: 16, zIndex: 1000, maxWidth: 600, mx: 'auto', backgroundColor: '#f5f5f5' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
        <Typography variant="h6" component="div">iOS non supportato</Typography>
        <IconButton size="small" onClick={handleDismiss} aria-label="chiudi">
          <CloseIcon />
        </IconButton>
      </Box>
      <Typography variant="body2">
        Per usare tutte le funzionalità offline e le notifiche push, aggiorna il tuo iPhone/iPad almeno a iOS 16.4.<br />
        Versioni precedenti non supportano le notifiche push per le PWA.
      </Typography>
    </Paper>
  );

  // Banner di installazione per Android e altri browser compatibili
  const installBanner = (
    <Snackbar
      open={showPrompt}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      sx={{ bottom: { xs: 90, sm: 16 } }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#f5f5f5',
          width: '100%',
          maxWidth: 500
        }}
      >
        <Box display="flex" alignItems="center">
          <AddToHomeScreenIcon sx={{ mr: 1.5 }} />
          <Typography variant="body1">
            Installa TimbrApp per usarla offline
          </Typography>
        </Box>
        <Box>
          <Button 
            variant="contained" 
            size="small" 
            onClick={handleInstallClick}
            color="primary"
            sx={{ mr: 1 }}
          >
            Installa
          </Button>
          <IconButton size="small" onClick={handleDismiss} aria-label="chiudi">
            <CloseIcon />
          </IconButton>
        </Box>
      </Paper>
    </Snackbar>
  );

  return (
    <>
      {isIOSDevice && isOldIOS && oldIOSMessage}
      {isIOSDevice && isIOS164 && showInstructions && iOSInstructions}
      {!isIOSDevice && installBanner}
    </>
  );
}

export default InstallPrompt;