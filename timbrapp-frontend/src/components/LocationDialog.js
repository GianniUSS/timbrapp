import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, FormControl,
  InputLabel, Select, MenuItem, CircularProgress, Typography, Divider, Box,
  List, ListItem, ListItemText, ListItemSecondaryAction, IconButton, Alert,
  Tooltip, InputAdornment, Tabs, Tab
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import BusinessIcon from '@mui/icons-material/Business';
import MapIcon from '@mui/icons-material/Map';
import api from '../api';
import LocationMapView from './LocationMapView';

// Dialog per gestione delle location (versione avanzata)
function LocationDialog({
  open,
  onClose,
  commesse,
  addLocationDialog = {},
  newLocation: propNewLocation,
  setNewLocation: propSetNewLocation,
  addingLocation: propAddingLocation,
  handleAddLocation: propHandleAddLocation,
  // Nuovi parametri per versione avanzata
  commessa = null,
  isAdvanced = false,
  onSave = null
}) {
  // Stati per la versione avanzata
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeLocationTab, setActiveLocationTab] = useState('list'); // 'list' o 'map'
  const [newLocation, setNewLocation] = useState({
    nome: '',
    indirizzo: '',
    lat: '',
    lng: '',
    commessaId: ''
  });
  const [gettingPosition, setGettingPosition] = useState(false);
  const [tabIndex, setTabIndex] = useState(0);
  
  // Gestisce la compatibilità tra vecchia e nuova implementazione
  const isSimpleMode = !isAdvanced;
  const activeNewLocation = isSimpleMode ? propNewLocation : newLocation;
  const activeSetNewLocation = isSimpleMode ? propSetNewLocation : setNewLocation;
  const activeAddingLocation = isSimpleMode ? propAddingLocation : loading;

  // Carica le location per la versione avanzata
  useEffect(() => {
    if (isAdvanced && open && commessa) {
      loadLocations(commessa.id);
      // Imposta automaticamente il commessaId
      setNewLocation(prev => ({ ...prev, commessaId: commessa.id }));
    }
  }, [isAdvanced, open, commessa]);

  // Carica le location della commessa
  const loadLocations = async (commessaId) => {
    if (!commessaId) return;
    
    setLoading(true);
    try {
      const res = await api.commesse.getLocations(commessaId);
      setLocations(Array.isArray(res.data) ? res.data : []);
      setError(null);
    } catch (err) {
      console.error('Errore nel caricamento delle location:', err);
      setError('Impossibile caricare le location. Riprova più tardi.');
      setLocations([]);
    } finally {
      setLoading(false);
    }
  };
  
  // Handler per il form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    activeSetNewLocation({ ...activeNewLocation, [name]: value });
  };
  
  // Handler per l'aggiunta in versione avanzata
  const handleAddLocationAdvanced = async () => {
    if (!activeNewLocation.nome) {
      setError('Il nome della location è obbligatorio');
      return;
    }

    setLoading(true);
    try {
      const commessaId = commessa?.id || activeNewLocation.commessaId;
      
      // Prepara i dati della location
      const locationData = { ...activeNewLocation, commessaId };

      // Controlla se lat e lng sono numeri validi o stringhe vuote
      if (locationData.lat === '') locationData.lat = null;
      if (locationData.lng === '') locationData.lng = null;

      // Chiama l'API per aggiungere la location
      const res = await api.commesse.addLocation(commessaId, locationData);
      
      // Aggiorna la lista delle location
      setLocations([...locations, res.data]);
      
      // Resetta il form
      setNewLocation({
        nome: '',
        indirizzo: '',
        lat: '',
        lng: '',
        commessaId: commessaId
      });
      
      setError(null);
    } catch (err) {
      console.error('Errore nell\'aggiunta della location:', err);
      setError('Impossibile aggiungere la location. Riprova più tardi.');
    } finally {
      setLoading(false);
    }
  };

  // Elimina una location
  const handleDeleteLocation = async (locationId) => {
    if (!window.confirm('Sei sicuro di voler eliminare questa location?')) return;
    
    setLoading(true);
    try {
      const commessaId = commessa?.id || activeNewLocation.commessaId;
      await api.commesse.deleteLocation(commessaId, locationId);
      
      // Rimuove la location dalla lista locale
      setLocations(locations.filter(loc => loc.id !== locationId));
      setError(null);
    } catch (err) {
      console.error('Errore nell\'eliminazione della location:', err);
      setError('Impossibile eliminare la location. Riprova più tardi.');
    } finally {
      setLoading(false);
    }
  };

  // Salva e chiude
  const handleSave = () => {
    if (isAdvanced && onSave) {
      onSave(locations);
    }
    onClose();
  };

  // Cambia la tab per la visualizzazione delle location
  const handleLocationTabChange = (event, newValue) => {
    setActiveLocationTab(newValue);
  };

  // Ottiene le coordinate attuali dell'utente
  const handleGetCurrentPosition = () => {
    if (!navigator.geolocation) {
      setError('Geolocalizzazione non supportata dal tuo browser');
      return;
    }
    
    setGettingPosition(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        activeSetNewLocation({
          ...activeNewLocation,
          lat: latitude.toFixed(6),
          lng: longitude.toFixed(6)
        });
        setGettingPosition(false);
        setError(null);
      },
      (err) => {
        console.error('Errore di geolocalizzazione:', err);
        setError(`Impossibile ottenere la posizione: ${err.message}`);
        setGettingPosition(false);
      },
      { 
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  // Determina il handler di aggiunta basato sulla modalità
  const effectiveAddHandler = isSimpleMode ? propHandleAddLocation : handleAddLocationAdvanced;

  return (
    <Dialog open={open} onClose={onClose} maxWidth={isAdvanced ? "md" : "sm"} fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center">
          <LocationOnIcon sx={{ mr: 1 }} />
          {isAdvanced 
            ? `Gestione Location: ${commessa?.descrizione || 'Commessa'}`
            : 'Aggiungi Location'
          }
        </Box>
      </DialogTitle>
      <DialogContent dividers={isAdvanced}>
        {error && isAdvanced && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Selezione della commessa nella modalità semplice */}
        {isSimpleMode && !addLocationDialog.commessaId && (
          <FormControl fullWidth variant="outlined" margin="dense" sx={{ mb: 2 }}>
            <InputLabel>Commessa</InputLabel>
            <Select
              value={activeNewLocation.commessaId || ''}
              onChange={(e) => activeSetNewLocation({ ...activeNewLocation, commessaId: e.target.value })}
              label="Commessa"
            >
              <MenuItem value="">
                <em>Seleziona una commessa</em>
              </MenuItem>
              {commesse?.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.codice} - {c.descrizione}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        {/* Form di aggiunta comune a entrambe le modalità */}
        {isAdvanced && <Typography variant="subtitle1" gutterBottom>
          Aggiungi nuova location
        </Typography>}
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            autoFocus
            margin="dense"
            label="Nome della location"
            name="nome"
            type="text"
            fullWidth
            variant="outlined"
            value={activeNewLocation.nome || ''}
            onChange={handleInputChange}
            sx={{ mb: 2 }}
            required
          />
          
          <TextField
            margin="dense"
            label="Indirizzo"
            name="indirizzo"
            type="text"
            fullWidth
            variant="outlined"
            value={activeNewLocation.indirizzo || ''}
            onChange={handleInputChange}
          />
          
          {/* Campi aggiuntivi per la versione avanzata */}
          {isAdvanced && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  label="Latitudine"
                  name="lat"
                  value={activeNewLocation.lat || ''}
                  onChange={handleInputChange}
                  type="number"
                  InputProps={{
                    startAdornment: <InputAdornment position="start">Lat</InputAdornment>,
                  }}
                  fullWidth
                />
                <TextField
                  label="Longitudine"
                  name="lng"
                  value={activeNewLocation.lng || ''}
                  onChange={handleInputChange}
                  type="number"
                  InputProps={{
                    startAdornment: <InputAdornment position="start">Lng</InputAdornment>,
                  }}
                  fullWidth
                />
              </Box>
              
              <Button
                variant="outlined"
                color="primary"
                startIcon={<LocationOnIcon />}
                onClick={handleGetCurrentPosition}
                disabled={gettingPosition}
              >
                {gettingPosition ? 
                  <CircularProgress size={24} /> : 
                  'Usa posizione attuale'
                }
              </Button>
            </Box>
          )}
          
          {/* Pulsante di aggiunta sempre visibile nella modalità avanzata */}
          {isAdvanced && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={effectiveAddHandler}
              disabled={activeAddingLocation || !activeNewLocation.nome || (!commessa?.id && !activeNewLocation.commessaId)}
              sx={{ mt: 2 }}
            >
              {activeAddingLocation ? <CircularProgress size={24} /> : 'Aggiungi Location'}
            </Button>
          )}
        </Box>
        
        {/* Lista delle location per la versione avanzata */}
        {isAdvanced && (
          <>
            <Divider sx={{ my: 2 }} />
            
            <Box sx={{ width: '100%', mb: 2 }}>
              <Tabs
                value={activeLocationTab}
                onChange={handleLocationTabChange}
                aria-label="visualizzazione location"
                centered
              >
                <Tab 
                  label={<Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <LocationOnIcon fontSize="small" sx={{ mr: 1 }} /> Lista
                  </Box>} 
                  value="list" 
                />
                <Tab 
                  label={<Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <MapIcon fontSize="small" sx={{ mr: 1 }} /> Mappa
                  </Box>} 
                  value="map" 
                />
              </Tabs>
            </Box>
            
            {activeLocationTab === 'list' ? (
              <>
                <Typography variant="subtitle1" gutterBottom>
                  Location esistenti
                </Typography>
                
                {loading && locations.length === 0 ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                    <CircularProgress />
                  </Box>
                ) : locations.length === 0 ? (
                  <Typography color="text.secondary">
                    Nessuna location per questa commessa
                  </Typography>
                ) : (
                  <List>
                    {locations.map((location) => (
                      <React.Fragment key={location.id}>
                        <ListItem>
                          <ListItemText
                            primary={location.nome}
                            secondary={
                              <>
                                {location.indirizzo || 'Nessun indirizzo'}<br />
                                {location.lat && location.lng ? `Lat: ${location.lat}, Lng: ${location.lng}` : 'Nessuna coordinata'}
                              </>
                            }
                          />
                          <ListItemSecondaryAction>
                            <IconButton edge="end" onClick={() => handleDeleteLocation(location.id)}>
                              <DeleteIcon />
                            </IconButton>
                          </ListItemSecondaryAction>
                        </ListItem>
                        <Divider component="li" />
                      </React.Fragment>
                    ))}
                  </List>
                )}
              </>
            ) : (
              <Box sx={{ width: '100%', mt: 2 }}>
                <LocationMapView locations={locations} height={400} />
              </Box>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Annulla
        </Button>
        {isSimpleMode ? (
          <Button 
            onClick={effectiveAddHandler} 
            color="primary" 
            disabled={activeAddingLocation || !activeNewLocation.nome || (!addLocationDialog.commessaId && !activeNewLocation.commessaId)}
            variant="contained"
          >
            {activeAddingLocation ? <CircularProgress size={24} /> : 'Aggiungi Location'}
          </Button>
        ) : (
          <Button 
            onClick={handleSave} 
            color="primary" 
            variant="contained"
          >
            Salva
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

export default LocationDialog;
