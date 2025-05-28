import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Paper,
  List,
  ListItem,
  ListItemText,
  Chip,
  IconButton,
  Divider,
  CircularProgress,
  Snackbar,
  Alert
} from '@mui/material';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import VisibilityIcon from '@mui/icons-material/Visibility';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import axios from 'axios';
import { API_URL } from '../config';

export default function Documentazione() {
  const [tipologie, setTipologie] = useState([]);
  const [documenti, setDocumenti] = useState([]);  const [tipologiaSelezionata, setTipologiaSelezionata] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Carica tipologie e documenti dal backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Recupera token JWT
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Utente non autenticato');
        }
        
        // Imposta header autorizzazione
        const config = {
          headers: { Authorization: `Bearer ${token}` }
        };        
        // Carica tipologie e documenti in parallelo
        const [tipologieRes, documentiRes] = await Promise.all([
          axios.get(`/api/tipologie-documento`, config),
          axios.get(`/api/documenti-utente`, config)
        ]);
        
        setTipologie(tipologieRes.data);
        setDocumenti(documentiRes.data);
        setError(null);
      } catch (err) {
        console.error('Errore durante il caricamento dei dati:', err);
        setError('Impossibile caricare i documenti. Riprova più tardi.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Filtro documenti per tipologia
  const documentiFiltrati = tipologiaSelezionata
    ? documenti.filter(d => d.tipologiaId === parseInt(tipologiaSelezionata))
    : documenti;

  const handleChange = (e) => setTipologiaSelezionata(e.target.value);
  
  const handleCloseError = () => setError(null);
  const handleCloseSuccess = () => setSuccessMessage(null);
  
  // Funzione per aprire un documento e segnarlo come letto
  const handleOpenDocument = async (doc) => {
    try {
      // Apri il documento in una nuova finestra
      window.open(doc.url, '_blank', 'noopener,noreferrer');
      
      // Se il documento non è già stato letto, aggiornane lo stato
      if (doc.stato_lettura === 'non letto') {
        const token = localStorage.getItem('token');
        if (!token) return;
        
        const config = {
          headers: { Authorization: `Bearer ${token}` }
        };        
        await axios.patch(`/api/documenti-utente/${doc.id}/stato-lettura`, 
          { stato_lettura: 'letto' }, 
          config
        );
        
        // Aggiorna lo stato dei documenti
        setDocumenti(prev => prev.map(d => 
          d.id === doc.id ? { ...d, stato_lettura: 'letto' } : d
        ));
        
        setSuccessMessage('Documento segnato come letto');
        
        // Nascondi il messaggio dopo 3 secondi
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
      }
    } catch (err) {
      console.error('Errore durante l\'aggiornamento dello stato di lettura:', err);
    }
  };

  return (
    <>
      <AppBar 
        position="fixed"
        sx={{ 
          background: 'linear-gradient(90deg, #1976d2 0%, #2196f3 100%)',
          width: '100%',
          left: 0,
          top: 0,
          zIndex: 1300,
          paddingTop: 'env(safe-area-inset-top, 0px)',
          boxShadow: 'none',
          borderBottom: '1.5px solid #e3eaf2',
        }}
      >
        <Toolbar sx={{ 
          minHeight: { xs: '62px', sm: '70px' },
          px: { xs: 2, sm: 4 },
          py: { xs: 0.5, sm: 1 },
          display: 'flex',
          alignItems: 'center',
        }}>          <Typography variant="h6" component="div" sx={{ 
            fontWeight: 700,
            fontSize: { xs: '1.15rem', sm: '1.35rem' },
            color: 'white',
            letterSpacing: 0.2,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            Documentazione
          </Typography>
          {!loading && documenti.length > 0 && (
            <Chip
              label={`${documenti.filter(d => d.stato_lettura === 'non letto').length} non letti`}
              size="small"
              color={documenti.some(d => d.stato_lettura === 'non letto') ? 'warning' : 'success'}
              sx={{ ml: 1.5, color: 'white', fontWeight: 500 }}
            />
          )}
        </Toolbar>
      </AppBar>
      <Container
        maxWidth="sm"
        disableGutters
        sx={{
          pt: 'env(safe-area-inset-top, 0px)',
          pb: 'env(safe-area-inset-bottom, 0px)',
          px: { xs: 2, sm: 3 },
          minHeight: '100vh',
          bgcolor: '#f5f5f5',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 1.5
        }}
      >        <Box sx={{ height: { xs: '62px', sm: '70px' } }} />
          {/* Filtro per tipologie */}
        <Box sx={{ width: '100%', maxWidth: 500, mx: 'auto', mb: 2 }}>
          <FormControl fullWidth disabled={loading}>
            <InputLabel id="tipologia-label">Filtra per tipologia</InputLabel>
            <Select
              labelId="tipologia-label"
              value={tipologiaSelezionata}
              label="Filtra per tipologia"
              onChange={handleChange}
              variant="outlined"
              sx={{ backgroundColor: '#fff', borderRadius: 2 }}
            >
              <MenuItem value="">Tutte le tipologie</MenuItem>
              {tipologie.map(t => (
                <MenuItem key={t.id} value={t.id}>{t.nome}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        
        {/* Stato di caricamento */}
        {loading && (
          <Box 
            sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              justifyContent: 'center', 
              alignItems: 'center', 
              width: '100%', 
              mt: 4,
              gap: 2
            }}
          >
            <CircularProgress color="primary" />
            <Typography variant="body2" color="text.secondary">
              Caricamento documenti...
            </Typography>
          </Box>
        )}
          {/* Lista documenti mobile-friendly */}
        {!loading && documentiFiltrati.length === 0 ? (
          <Paper elevation={2} sx={{ width: '100%', maxWidth: 500, p: 3, textAlign: 'center', borderRadius: 2 }}>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
              {tipologiaSelezionata ? 'Nessun documento disponibile per questa tipologia' : 'Nessun documento disponibile'}
            </Typography>
            {tipologiaSelezionata && (
              <Button 
                variant="outlined" 
                size="small" 
                onClick={() => setTipologiaSelezionata('')}
                sx={{ mt: 1 }}
              >
                Mostra tutti i documenti
              </Button>
            )}
          </Paper>
        ) : (
          <Paper 
            elevation={2} 
            sx={{ 
              width: '100%',            maxWidth: 500, 
              mx: 'auto', 
              borderRadius: 2, 
              overflow: 'hidden'
            }}
          >
            <Box sx={{ px: 2, py: 1.5, bgcolor: 'primary.light', color: 'white' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 500 }}>
                {documentiFiltrati.length} {documentiFiltrati.length === 1 ? 'documento' : 'documenti'} 
                {tipologiaSelezionata ? ' di questa tipologia' : ''}
              </Typography>
            </Box>
            <List disablePadding>
              {documentiFiltrati.map((doc, index) => (
                <React.Fragment key={doc.id}>
                  {index > 0 && <Divider />}
                  <ListItem
                    secondaryAction={                      <IconButton 
                        edge="end" 
                        aria-label="visualizza" 
                        onClick={() => handleOpenDocument(doc)}
                        sx={{ color: 'primary.main' }}
                      >
                        <CloudDownloadIcon />
                      </IconButton>
                    }
                    sx={{ 
                      py: 2, 
                      bgcolor: doc.stato_lettura === 'non letto' ? '#f0f7ff' : 'white'
                    }}
                  >
                    <ListItemText                      primary={
                        <Typography variant="subtitle1" sx={{ 
                          fontWeight: 500,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1
                        }}>
                          {doc.nome}
                          {doc.stato_lettura === 'non letto' && (
                            <Box 
                              component="span" 
                              sx={{ 
                                width: 8, 
                                height: 8, 
                                bgcolor: 'warning.main', 
                                borderRadius: '50%',
                                display: 'inline-block',
                              }} 
                            />
                          )}
                        </Typography>
                      }
                      secondary={
                        <Box sx={{ mt: 0.5 }}>
                          <Chip 
                            size="small" 
                            label={doc.tipologia ? doc.tipologia.nome : 'N/D'} 
                            sx={{ 
                              mr: 1, 
                              bgcolor: 'primary.light', 
                              color: 'white',
                              fontSize: '0.75rem',
                              height: 24
                            }}
                          />                          <Chip 
                            size="small" 
                            label={doc.stato_lettura === 'letto' ? 'Letto' : 'Non letto'} 
                            sx={{ 
                              bgcolor: doc.stato_lettura === 'letto' ? 'success.light' : 'warning.light',
                              color: 'white',
                              fontSize: '0.75rem',
                              height: 24
                            }}
                          />
                          <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: 'text.secondary' }}>
                            {new Date(doc.createdAt).toLocaleDateString('it-IT', { 
                              day: '2-digit', 
                              month: '2-digit', 
                              year: 'numeric'
                            })}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                </React.Fragment>
              ))}
            </List>
          </Paper>
        )}
          {/* Snackbar per errori */}
        <Snackbar open={!!error} autoHideDuration={6000} onClose={handleCloseError}>
          <Alert onClose={handleCloseError} severity="error" sx={{ width: '100%' }}>
            {error}
          </Alert>
        </Snackbar>

        {/* Snackbar per messaggi di successo */}
        <Snackbar open={!!successMessage} autoHideDuration={3000} onClose={handleCloseSuccess}>
          <Alert onClose={handleCloseSuccess} severity="success" sx={{ width: '100%' }}>
            {successMessage}
          </Alert>
        </Snackbar>
      </Container>
    </>
  );
}
