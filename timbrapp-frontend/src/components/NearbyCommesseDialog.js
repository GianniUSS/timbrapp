// src/components/NearbyCommesseDialog.js
import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box,
  List, ListItem, ListItemText, CircularProgress, Alert, Slider, Grid,
  IconButton, Divider, Chip, TextField, InputAdornment
} from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import SearchIcon from '@mui/icons-material/Search';
import WorkIcon from '@mui/icons-material/Work';
import api from '../api';

/**
 * Dialog che mostra le commesse nelle vicinanze di una posizione
 */
function NearbyCommesseDialog({ open, onClose, onSelectCommessa }) {
  const [loading, setLoading] = useState(false);
  const [nearbyCommesse, setNearbyCommesse] = useState([]);
  const [error, setError] = useState(null);
  const [coords, setCoords] = useState({ lat: '', lng: '' });
  const [searchRadius, setSearchRadius] = useState(10);
  const [gettingPosition, setGettingPosition] = useState(false);

  // Ottiene la posizione attuale dell'utente
  const handleGetCurrentPosition = () => {
    if (!navigator.geolocation) {
      setError('Geolocalizzazione non supportata dal tuo browser');
      return;
    }
    
    setGettingPosition(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCoords({
          lat: latitude.toFixed(6),
          lng: longitude.toFixed(6)
        });
        setGettingPosition(false);
        // Esegue subito la ricerca
        searchNearbyCommesse(latitude, longitude, searchRadius);
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

  // Gestisce il cambio del raggio di ricerca
  const handleRadiusChange = (event, newValue) => {
    setSearchRadius(newValue);
  };

  // Gestisce il cambio dei valori di input per le coordinate
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCoords(prev => ({ ...prev, [name]: value }));
  };

  // Funzione per cercare commesse vicine
  const searchNearbyCommesse = async (lat, lng, radius) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.commesse.findNearby(lat, lng, radius);
      setNearbyCommesse(response.data);
      
      if (response.data.length === 0) {
        setError(`Nessuna commessa trovata nel raggio di ${radius}km dalla posizione specificata.`);
      }
    } catch (err) {
      console.error('Errore nella ricerca di commesse vicine:', err);
      setError(`Errore nella ricerca: ${err.response?.data?.message || err.message}`);
      setNearbyCommesse([]);
    } finally {
      setLoading(false);
    }
  };

  // Avvia la ricerca con le coordinate e il raggio specificati
  const handleSearch = () => {
    if (!coords.lat || !coords.lng) {
      setError('Inserisci entrambe le coordinate per iniziare la ricerca');
      return;
    }
    
    const lat = parseFloat(coords.lat);
    const lng = parseFloat(coords.lng);
    
    if (isNaN(lat) || isNaN(lng)) {
      setError('Le coordinate devono essere numeri validi');
      return;
    }
    
    searchNearbyCommesse(lat, lng, searchRadius);
  };

  // Seleziona una commessa e chiude il dialog
  const handleSelectCommessa = (commessa) => {
    if (onSelectCommessa) {
      onSelectCommessa(commessa);
    }
    onClose();
  };

  // Resetta lo stato quando il dialog si chiude
  useEffect(() => {
    if (!open) {
      setNearbyCommesse([]);
      setError(null);
    }
  }, [open]);

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" alignItems="center">
          <LocationOnIcon sx={{ mr: 1 }} />
          Commesse nelle vicinanze
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        {/* Sezione ricerca */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Cerca commesse vicino a una posizione
          </Typography>
          
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <TextField
                label="Latitudine"
                name="lat"
                value={coords.lat}
                onChange={handleInputChange}
                fullWidth
                type="number"
                InputProps={{
                  startAdornment: <InputAdornment position="start">Lat</InputAdornment>,
                }}
                margin="dense"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Longitudine"
                name="lng"
                value={coords.lng}
                onChange={handleInputChange}
                fullWidth
                type="number"
                InputProps={{
                  startAdornment: <InputAdornment position="start">Lng</InputAdornment>,
                }}
                margin="dense"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<LocationOnIcon />}
                onClick={handleGetCurrentPosition}
                disabled={gettingPosition}
                sx={{ mt: 1 }}
              >
                {gettingPosition ? <CircularProgress size={24} /> : 'Usa posizione attuale'}
              </Button>
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 2, px: 2 }}>
            <Typography id="radius-slider" gutterBottom>
              Raggio di ricerca: {searchRadius} km
            </Typography>
            <Slider
              value={searchRadius}
              onChange={handleRadiusChange}
              aria-labelledby="radius-slider"
              min={1}
              max={50}
              marks={[
                { value: 1, label: '1km' },
                { value: 10, label: '10km' },
                { value: 25, label: '25km' },
                { value: 50, label: '50km' }
              ]}
            />
          </Box>
          
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              startIcon={<SearchIcon />}
              onClick={handleSearch}
              disabled={loading || !coords.lat || !coords.lng}
            >
              Cerca
            </Button>
          </Box>
        </Box>
        
        <Divider sx={{ my: 2 }} />
        
        {/* Risultati della ricerca */}
        <Typography variant="subtitle1" gutterBottom>
          Risultati della ricerca
        </Typography>
        
        {error && (
          <Alert severity="info" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : nearbyCommesse.length > 0 ? (
          <List>
            {nearbyCommesse.map(commessa => (
              <React.Fragment key={commessa.id}>
                <ListItem button onClick={() => handleSelectCommessa(commessa)}>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <WorkIcon sx={{ mr: 1, fontSize: 'small', color: 'primary.main' }} />
                        <Typography variant="subtitle2">
                          {commessa.codice} - {commessa.descrizione}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <>
                        <Typography variant="body2" component="span">
                          Cliente: {commessa.cliente}
                        </Typography>
                        <Box sx={{ mt: 0.5 }}>
                          <Chip 
                            label={commessa.stato} 
                            size="small" 
                            color={
                              commessa.stato === 'attiva' ? 'success' : 
                              commessa.stato === 'completata' ? 'default' :
                              commessa.stato === 'sospesa' ? 'warning' : 'error'
                            } 
                            variant="outlined" 
                          />
                        </Box>
                      </>
                    }
                  />
                </ListItem>
                <Divider />
              </React.Fragment>
            ))}
          </List>
        ) : nearbyCommesse.length === 0 && !error && coords.lat && coords.lng ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography color="text.secondary">
              Nessuna commessa trovata nel raggio specificato.
            </Typography>
          </Box>
        ) : !coords.lat || !coords.lng ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography color="text.secondary">
              Inserisci le coordinate o usa la tua posizione attuale per iniziare la ricerca.
            </Typography>
          </Box>
        ) : null}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Chiudi
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default NearbyCommesseDialog;
