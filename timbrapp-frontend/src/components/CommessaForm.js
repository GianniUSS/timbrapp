// file: CommessaForm.js
import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  TextField, Grid, MenuItem, Box, FormControl, InputLabel, Select,
  Chip, Typography, IconButton, Divider, LinearProgress,
  FormHelperText, Snackbar, Alert
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { format, isValid, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import BusinessIcon from '@mui/icons-material/Business';

import api from '../api';

/**
 * Form per la creazione e modifica di commesse
 */
function CommessaForm({ open, onClose, commessa, onSave, title = "Nuova Commessa", saving = false }) {
  // Stati per il form
  const [formData, setFormData] = useState({
    codice: '',
    descrizione: '',
    cliente: '',
    stato: 'attiva',
    dataInizio: new Date(),
    dataFine: null,
    budget: '',
    note: '',
    locations: []
  });
  
  // Stati per la validazione
  const [errors, setErrors] = useState({});
  
  // Stati per location
  const [newLocation, setNewLocation] = useState('');
  
  // Notification state
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
  
  // Popolamento dati iniziali in caso di modifica
  useEffect(() => {
    if (commessa) {
      setFormData({
        codice: commessa.codice || '',
        descrizione: commessa.descrizione || '',
        cliente: commessa.cliente || '',
        stato: commessa.stato || 'attiva',
        dataInizio: commessa.dataInizio ? parseISO(commessa.dataInizio) : new Date(),
        dataFine: commessa.dataFine ? parseISO(commessa.dataFine) : null,
        budget: commessa.budget || '',
        note: commessa.note || '',
        locations: commessa.locations || []
      });
    } else {
      // Reset dello stato per nuova commessa
      setFormData({
        codice: '',
        descrizione: '',
        cliente: '',
        stato: 'attiva',
        dataInizio: new Date(),
        dataFine: null,
        budget: '',
        note: '',
        locations: []
      });
    }
    // Reset errori
    setErrors({});
  }, [commessa, open]);
  
  // Gestione cambio input
  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for field if it exists
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  // Gestione date
  const handleDateChange = (name, date) => {
    setFormData(prev => ({ ...prev, [name]: date }));
    
    // Clear error for field if it exists
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  // Gestione input nuova location
  const handleNewLocationChange = (event) => {
    setNewLocation(event.target.value);
  };
  
  // Aggiunta location
  const handleAddLocation = () => {
    if (newLocation.trim() !== '' && !formData.locations.includes(newLocation.trim())) {
      setFormData(prev => ({
        ...prev,
        locations: [...prev.locations, newLocation.trim()]
      }));
      setNewLocation('');
    }
  };
  
  // Rimozione location
  const handleRemoveLocation = (location) => {
    setFormData(prev => ({
      ...prev,
      locations: prev.locations.filter(loc => loc !== location)
    }));
  };
  
  // Validazione form
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.codice.trim()) {
      newErrors.codice = 'Il codice è obbligatorio';
    }
    
    if (!formData.descrizione.trim()) {
      newErrors.descrizione = 'La descrizione è obbligatoria';
    }
    
    if (!formData.cliente.trim()) {
      newErrors.cliente = 'Il cliente è obbligatorio';
    }
    
    if (!formData.dataInizio) {
      newErrors.dataInizio = 'La data di inizio è obbligatoria';
    }
    
    if (formData.dataFine && formData.dataInizio && formData.dataFine < formData.dataInizio) {
      newErrors.dataFine = 'La data di fine deve essere successiva alla data di inizio';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Invio form
  const handleSubmit = (event) => {
    event.preventDefault();
    
    if (validateForm()) {
      // Formato dati per l'API
      const formattedData = {
        ...formData,
        dataInizio: isValid(formData.dataInizio) ? format(formData.dataInizio, 'yyyy-MM-dd') : null,
        dataFine: formData.dataFine && isValid(formData.dataFine) ? format(formData.dataFine, 'yyyy-MM-dd') : null,
        budget: formData.budget ? parseFloat(formData.budget) : null
      };
      
      onSave(formattedData);
    } else {
      setNotification({
        open: true,
        message: 'Ci sono errori nel form. Controlla i campi evidenziati.',
        severity: 'error'
      });
    }
  };
  
  // Chiusura notifica
  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };
  
  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <BusinessIcon sx={{ mr: 1 }} />
            {title}
          </Box>
        </DialogTitle>
        
        <DialogContent>
          {saving && <LinearProgress sx={{ mb: 2 }} />}
          
          <Box component="form" noValidate sx={{ mt: 1 }} onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              {/* Codice e Cliente */}
              <Grid item xs={12} sm={6}>
                <TextField
                  name="codice"
                  label="Codice Commessa"
                  fullWidth
                  required
                  value={formData.codice}
                  onChange={handleChange}
                  error={Boolean(errors.codice)}
                  helperText={errors.codice}
                  disabled={saving}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="cliente"
                  label="Cliente"
                  fullWidth
                  required
                  value={formData.cliente}
                  onChange={handleChange}
                  error={Boolean(errors.cliente)}
                  helperText={errors.cliente}
                  disabled={saving}
                />
              </Grid>
              
              {/* Descrizione */}
              <Grid item xs={12}>
                <TextField
                  name="descrizione"
                  label="Descrizione"
                  fullWidth
                  required
                  value={formData.descrizione}
                  onChange={handleChange}
                  error={Boolean(errors.descrizione)}
                  helperText={errors.descrizione}
                  disabled={saving}
                />
              </Grid>
              
              {/* Stato e Budget */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth disabled={saving}>
                  <InputLabel>Stato</InputLabel>
                  <Select
                    name="stato"
                    value={formData.stato}
                    onChange={handleChange}
                    label="Stato"
                  >
                    <MenuItem value="attiva">Attiva</MenuItem>
                    <MenuItem value="sospesa">Sospesa</MenuItem>
                    <MenuItem value="completata">Completata</MenuItem>
                    <MenuItem value="annullata">Annullata</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="budget"
                  label="Budget (€)"
                  type="number"
                  fullWidth
                  value={formData.budget}
                  onChange={handleChange}
                  disabled={saving}
                  InputProps={{
                    startAdornment: '€ ',
                  }}
                />
              </Grid>
              
              {/* Date */}
              <Grid item xs={12} sm={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={it}>
                  <DatePicker
                    label="Data Inizio"
                    value={formData.dataInizio}
                    onChange={(date) => handleDateChange('dataInizio', date)}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        required: true,
                        error: Boolean(errors.dataInizio),
                        helperText: errors.dataInizio,
                      }
                    }}
                    disabled={saving}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12} sm={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={it}>
                  <DatePicker
                    label="Data Fine (opzionale)"
                    value={formData.dataFine}
                    onChange={(date) => handleDateChange('dataFine', date)}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        error: Boolean(errors.dataFine),
                        helperText: errors.dataFine,
                      }
                    }}
                    disabled={saving}
                  />
                </LocalizationProvider>
              </Grid>
              
              {/* Locations */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Locations
                </Typography>
                <Box sx={{ display: 'flex', mb: 1 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Aggiungi location"
                    value={newLocation}
                    onChange={handleNewLocationChange}
                    disabled={saving}
                  />
                  <Button
                    variant="contained"
                    color="primary"
                    sx={{ ml: 1 }}
                    onClick={handleAddLocation}
                    disabled={!newLocation.trim() || saving}
                  >
                    <AddIcon />
                  </Button>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                  {formData.locations.map((location, index) => (
                    <Chip
                      key={index}
                      label={location}
                      onDelete={() => handleRemoveLocation(location)}
                      disabled={saving}
                    />
                  ))}
                  {formData.locations.length === 0 && (
                    <Typography variant="body2" color="text.secondary">
                      Nessuna location aggiunta
                    </Typography>
                  )}
                </Box>
              </Grid>
              
              {/* Note */}
              <Grid item xs={12}>
                <TextField
                  name="note"
                  label="Note"
                  fullWidth
                  multiline
                  rows={3}
                  value={formData.note}
                  onChange={handleChange}
                  disabled={saving}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={onClose} disabled={saving}>Annulla</Button>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleSubmit}
            disabled={saving}
          >
            Salva
          </Button>
        </DialogActions>
      </Dialog>
      
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.severity} 
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </>
  );
}

export default CommessaForm;
