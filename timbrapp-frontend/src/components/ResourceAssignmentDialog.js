import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, FormControl, InputLabel, MenuItem, Select,
  TextField, Grid, Typography, Chip, Box, Alert,
  CircularProgress, Autocomplete, Paper, Divider
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import WorkIcon from '@mui/icons-material/Work';
import EventIcon from '@mui/icons-material/Event';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker, TimePicker } from '@mui/x-date-pickers';
import { format, addHours, set } from 'date-fns';
import { it } from 'date-fns/locale';

import api from '../api';

/**
 * Componente per l'assegnazione di personale ai task
 * con possibilità di pianificare i turni
 */
function ResourceAssignmentDialog({ open, onClose, task = null, refreshData = () => {} }) {
  // Stato per gestire la selezione dei dipendenti
  const [dipendenti, setDipendenti] = useState([]);
  const [selectedDipendente, setSelectedDipendente] = useState(null);
  const [ruolo, setRuolo] = useState('');
  const [note, setNote] = useState('');
  
  // Stato per gestire i turni
  const [shiftDate, setShiftDate] = useState(new Date());
  const [startTime, setStartTime] = useState(
    set(new Date(), { hours: 9, minutes: 0, seconds: 0, milliseconds: 0 })
  );
  const [endTime, setEndTime] = useState(
    set(new Date(), { hours: 17, minutes: 0, seconds: 0, milliseconds: 0 })
  );
  const [shiftNote, setShiftNote] = useState('');
  
  // Stato per gestire il form
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [tab, setTab] = useState('dipendente'); // 'dipendente' o 'turno'
  
  // Carica i dipendenti quando il dialogo viene aperto
  useEffect(() => {
    if (open && task) {
      loadDipendenti();
    }
  }, [open, task]);
  
  // Carica l'elenco dei dipendenti
  const loadDipendenti = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.personale.getAll();
      setDipendenti(response.data);
    } catch (err) {
      console.error('Errore nel caricamento dei dipendenti:', err);
      setError('Errore nel caricamento dei dipendenti');
    } finally {
      setLoading(false);
    }
  };
  
  // Assegna un dipendente al task
  const handleAssignDipendente = async () => {
    if (!selectedDipendente || !task) return;
    
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      await api.task.assignPersonale(task.id, [selectedDipendente.id]);        // Se specificato un ruolo o delle note, aggiorna l'assegnazione
        if (ruolo || note) {
          // Recupera l'ID dell'assegnazione appena creata
          const assignments = await api.resourcePlanner.getAssignments({
            taskId: task.id,
            dipendenteId: selectedDipendente.id
          });
          
          if (assignments.data && assignments.data.length > 0) {
            const assignmentId = assignments.data[0].id;
            await api.resourcePlanner.updateAssignment(assignmentId, {
              ruolo,
              note
            });
          }
        }
      
      setSuccess('Dipendente assegnato con successo al task');
      resetForm();
      refreshData();
    } catch (err) {
      console.error('Errore nell\'assegnazione del dipendente:', err);
      setError('Errore nell\'assegnazione del dipendente');
    } finally {
      setLoading(false);
    }
  };
  
  // Crea un turno per il task
  const handleCreateShift = async () => {
    if (!selectedDipendente || !task || !shiftDate || !startTime || !endTime) return;
    
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
        // Formatta i dati per la creazione del turno
      const shiftData = {
        userId: selectedDipendente.id,
        date: format(shiftDate, 'yyyy-MM-dd'),
        startTime: format(startTime, 'HH:mm:ss'),
        endTime: format(endTime, 'HH:mm:ss'),
        note: shiftNote
      };
      
      await api.resourcePlanner.createShift(task.id, shiftData);
      
      setSuccess('Turno creato con successo');
      resetForm();
      refreshData();
    } catch (err) {
      console.error('Errore nella creazione del turno:', err);
      setError('Errore nella creazione del turno');
    } finally {
      setLoading(false);
    }
  };
  
  // Reset dei valori del form
  const resetForm = () => {
    setSelectedDipendente(null);
    setRuolo('');
    setNote('');
    setShiftDate(new Date());
    setStartTime(set(new Date(), { hours: 9, minutes: 0, seconds: 0, milliseconds: 0 }));
    setEndTime(set(new Date(), { hours: 17, minutes: 0, seconds: 0, milliseconds: 0 }));
    setShiftNote('');
  };
  
  // Gestione dei cambi di tab
  const handleChangeTab = (newTab) => {
    setTab(newTab);
    setError(null);
    setSuccess(null);
  };
  
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Pianificazione Risorse
        {task && (
          <Typography variant="subtitle1" color="text.secondary">
            Task: {task.nome}
          </Typography>
        )}
      </DialogTitle>
      
      <DialogContent dividers>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            
            {success && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {success}
              </Alert>
            )}
            
            <Box sx={{ mb: 2 }}>
              <Grid container spacing={1}>
                <Grid item xs={6}>
                  <Button 
                    variant={tab === 'dipendente' ? 'contained' : 'outlined'}
                    fullWidth
                    onClick={() => handleChangeTab('dipendente')}
                    startIcon={<PersonIcon />}
                  >
                    Assegna Dipendente
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button 
                    variant={tab === 'turno' ? 'contained' : 'outlined'}
                    fullWidth
                    onClick={() => handleChangeTab('turno')}
                    startIcon={<EventIcon />}
                  >
                    Pianifica Turno
                  </Button>
                </Grid>
              </Grid>
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            {/* Tab Assegnazione Dipendente */}
            {tab === 'dipendente' && (
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Autocomplete
                    options={dipendenti}
                    getOptionLabel={(option) => `${option.nome} ${option.cognome}`}
                    value={selectedDipendente}
                    onChange={(event, newValue) => {
                      setSelectedDipendente(newValue);
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Seleziona Dipendente"
                        fullWidth
                        required
                      />
                    )}
                    renderOption={(props, option) => (
                      <li {...props}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <PersonIcon sx={{ mr: 1, color: 'primary.main' }} />
                          <Box>
                            <Typography variant="body2">
                              {option.nome} {option.cognome}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {option.ruolo || 'Ruolo non specificato'}
                            </Typography>
                          </Box>
                        </Box>
                      </li>
                    )}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel id="ruolo-label">Ruolo nel Task</InputLabel>
                    <Select
                      labelId="ruolo-label"
                      value={ruolo}
                      onChange={(e) => setRuolo(e.target.value)}
                      label="Ruolo nel Task"
                    >
                      <MenuItem value="">Nessun ruolo specifico</MenuItem>
                      <MenuItem value="Responsabile">Responsabile</MenuItem>
                      <MenuItem value="Esecutore">Esecutore</MenuItem>
                      <MenuItem value="Supporto">Supporto</MenuItem>
                      <MenuItem value="Supervisore">Supervisore</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    label="Note sull'assegnazione"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    fullWidth
                    multiline
                    rows={3}
                  />
                </Grid>
              </Grid>
            )}
            
            {/* Tab Pianificazione Turno */}
            {tab === 'turno' && (
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Autocomplete
                    options={dipendenti}
                    getOptionLabel={(option) => `${option.nome} ${option.cognome}`}
                    value={selectedDipendente}
                    onChange={(event, newValue) => {
                      setSelectedDipendente(newValue);
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Seleziona Dipendente"
                        fullWidth
                        required
                      />
                    )}
                    renderOption={(props, option) => (
                      <li {...props}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <PersonIcon sx={{ mr: 1, color: 'primary.main' }} />
                          <Box>
                            <Typography variant="body2">
                              {option.nome} {option.cognome}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {option.ruolo || 'Ruolo non specificato'}
                            </Typography>
                          </Box>
                        </Box>
                      </li>
                    )}
                  />
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={it}>
                    <DatePicker
                      label="Data Turno"
                      value={shiftDate}
                      onChange={(newValue) => setShiftDate(newValue)}
                      renderInput={(params) => <TextField {...params} fullWidth required />}
                    />
                  </LocalizationProvider>
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={it}>
                    <TimePicker
                      label="Ora Inizio"
                      value={startTime}
                      onChange={(newValue) => {
                        setStartTime(newValue);
                        // Se l'ora di fine è prima dell'ora di inizio, aggiornala
                        if (newValue && endTime && newValue > endTime) {
                          setEndTime(addHours(newValue, 1));
                        }
                      }}
                      renderInput={(params) => <TextField {...params} fullWidth required />}
                    />
                  </LocalizationProvider>
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={it}>
                    <TimePicker
                      label="Ora Fine"
                      value={endTime}
                      onChange={(newValue) => setEndTime(newValue)}
                      renderInput={(params) => <TextField {...params} fullWidth required />}
                      minTime={startTime}
                    />
                  </LocalizationProvider>
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    label="Note sul turno"
                    value={shiftNote}
                    onChange={(e) => setShiftNote(e.target.value)}
                    fullWidth
                    multiline
                    rows={2}
                  />
                </Grid>
              </Grid>
            )}
            
            {task && (
              <Box sx={{ mt: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Dettagli Task
                </Typography>
                <Grid container spacing={1}>
                  <Grid item xs={12}>
                    <Chip 
                      icon={<WorkIcon />} 
                      label={task.nome} 
                      color="primary" 
                      variant="outlined" 
                      size="small"
                    />
                  </Grid>
                  {task.dataInizio && (
                    <Grid item xs={6}>
                      <Typography variant="caption" display="block" color="text.secondary">
                        Data Inizio: {format(new Date(task.dataInizio), 'dd/MM/yyyy')}
                      </Typography>
                    </Grid>
                  )}
                  {task.dataFine && (
                    <Grid item xs={6}>
                      <Typography variant="caption" display="block" color="text.secondary">
                        Data Fine: {format(new Date(task.dataFine), 'dd/MM/yyyy')}
                      </Typography>
                    </Grid>
                  )}
                  {task.durataPrevista && (
                    <Grid item xs={6}>
                      <Typography variant="caption" display="block" color="text.secondary">
                        Durata: {task.durataPrevista} ore
                      </Typography>
                    </Grid>
                  )}
                  {task.numeroRisorse && (
                    <Grid item xs={6}>
                      <Typography variant="caption" display="block" color="text.secondary">
                        Risorse Necessarie: {task.numeroRisorse}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </Box>
            )}
          </>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Chiudi
        </Button>
        
        {tab === 'dipendente' ? (
          <Button 
            onClick={handleAssignDipendente} 
            color="primary" 
            disabled={!selectedDipendente || loading}
            variant="contained"
          >
            Assegna
          </Button>
        ) : (
          <Button 
            onClick={handleCreateShift} 
            color="primary" 
            disabled={!selectedDipendente || !shiftDate || !startTime || !endTime || loading}
            variant="contained"
          >
            Crea Turno
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

export default ResourceAssignmentDialog;
