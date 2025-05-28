import React, { useState, useEffect } from 'react';
// Ottimizzazione Material-UI Tree Shaking - Import specifici
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DateTimePicker } from '@mui/x-date-pickers';
import { it } from 'date-fns/locale';
import api from '../api';
import SkillsSelector from './SkillsSelector';

// Icone
import AssignmentIcon from '@mui/icons-material/Assignment';
import BusinessIcon from '@mui/icons-material/Business';
import ScheduleIcon from '@mui/icons-material/Schedule';
import GroupIcon from '@mui/icons-material/Group';
import WorkIcon from '@mui/icons-material/Work';
import MenuBookIcon from '@mui/icons-material/MenuBook';

/**
 * Componente per il form di creazione/modifica di un task
 */
function TaskForm({
  open,
  onClose,
  task = null,
  commesse = [],
  onSave,
  saving = false,
  title = "Nuovo Task"
}) {
  // Stato del form
  const [formData, setFormData] = useState({
    nome: '',
    descrizione: '',
    commessaId: '',
    locationId: '',
    stato: 'attivo',
    dataInizio: null,
    dataFine: null,
    durataPrevista: '',
    numeroRisorse: 1,
    skills: [],
    funzioneId: ''
  });

  // Stato per dati aggiuntivi
  const [locations, setLocations] = useState([]);
  const [funzioni, setFunzioni] = useState([]);
  const [loadingFunzioni, setLoadingFunzioni] = useState(false);
  // Carica i dati quando il componente si apre
  useEffect(() => {
    if (open) {
      // Se stiamo modificando un task esistente
      if (task) {
        setFormData({
          id: task.id,
          nome: task.nome || '',
          descrizione: task.descrizione || '',
          commessaId: task.commessa?.id || task.commessaId || '',
          stato: task.stato || 'attivo',
          dataInizio: task.dataInizio ? new Date(task.dataInizio) : null,
          dataFine: task.dataFine ? new Date(task.dataFine) : null,
          durataPrevista: task.durataPrevista || '',
          numeroRisorse: task.numeroRisorse || 1,
          locationId: task.locationId || '',
          skills: task.skills || [],
          funzioneId: task.funzioneId || ''
        });
        
        // Se abbiamo una commessa, carichiamo le location
        if (task.commessa?.id || task.commessaId) {
          fetchLocations(task.commessa?.id || task.commessaId);
        }
      } else {
        // Reset per nuovo task
        setFormData({
          nome: '',
          descrizione: '',
          commessaId: task?.commessaId || '',
          locationId: '',
          stato: 'attivo',
          dataInizio: null,
          dataFine: null,
          durataPrevista: '',
          numeroRisorse: 1,
          skills: [],
          funzioneId: ''
        });
      }
      
      // Carica location e funzioni
      fetchFunzioni();
    }
  }, [open, task]);
  // Carica le location per una commessa
  const fetchLocations = async (commessaId) => {
    if (!commessaId) {
      setLocations([]);
      return;
    }
    
    try {
      console.log(`Recupero locations per commessa ID: ${commessaId}`);
      
      const commessa = commesse.find(c => c.id === commessaId);
      if (commessa && commessa.locations) {
        console.log('Locations trovate nella commessa:', commessa.locations);
        setLocations(commessa.locations.filter(loc => !loc.virtual));
      } else {
        // Se non abbiamo le location nella commessa, le recuperiamo dall'API
        console.log('Locations non trovate nella commessa, chiamata API');
        const res = await api.commesse.getLocations(commessaId);
          if (res && res.data) {
          console.log('Locations ricevute da API:', res.data);
          // Verifichiamo che res.data sia un array
          if (Array.isArray(res.data)) {
            setLocations(res.data.filter(loc => !loc.virtual || loc.virtual === undefined));
          } else {
            console.warn('API ha restituito un formato non valido per locations (non è un array):', res.data);
            setLocations([]);
          }
        } else {
          console.warn('API ha restituito dati non validi per locations');
          setLocations([]);
        }
      }
    } catch (err) {
      console.error('Errore dettagliato nel recupero delle location:', err);
      
      // Mostra messaggio di errore più dettagliato nella console
      if (err.response) {
        console.error(`Status: ${err.response.status}`, err.response.data);
      } else if (err.request) {
        console.error('Nessuna risposta ricevuta:', err.request);
      } else {
        console.error('Errore di configurazione:', err.message);
      }
      
      setLocations([]);
    }
  };  // Carica tutte le funzioni disponibili
  const fetchFunzioni = async () => {
    setLoadingFunzioni(true);    try {
      console.log('Recupero funzioni disponibili da URL: /api/funzioniSkill/funzioni');
      
      const res = await api.funzioniSkill.getAllFunzioni();
      
      console.log('Risposta completa API funzioni:', res);
      
      if (res && res.data !== undefined) {
        console.log('Funzioni ricevute - tipo:', typeof res.data, 'valore:', res.data);
        // Verifica che res.data sia un array prima di assegnarlo
        if (Array.isArray(res.data)) {
          console.log(`È un array con ${res.data.length} elementi`);
          setFunzioni(res.data);
        } else {
          console.warn('API ha restituito dati non validi (non è un array):', res.data);
          console.warn('Tipo dei dati ricevuti:', typeof res.data);
          setFunzioni([]);
        }
      } else {
        console.warn('API ha restituito dati non validi per funzioni');
        setFunzioni([]);
      }
    } catch (err) {
      console.error('Errore dettagliato nel recupero delle funzioni:', err);
      
      // Mostra messaggio di errore più dettagliato nella console
      if (err.response) {
        console.error(`Status: ${err.response.status}`, err.response.data);
      } else if (err.request) {
        console.error('Nessuna risposta ricevuta:', err.request);
      } else {
        console.error('Errore di configurazione:', err.message);
      }
      
      setFunzioni([]);
    } finally {
      setLoadingFunzioni(false);
    }
  };

  // Cambia commessa e ricarica le location
  const handleCommessaChange = (e) => {
    const commessaId = e.target.value;
    setFormData(prev => ({
      ...prev,
      commessaId,
      locationId: '' // Reset location quando cambia la commessa
    }));
    fetchLocations(commessaId);
  };  // Validazione form
  const isFormValid = () => {
    // Verifica che commessa e stato siano selezionati
    if (!formData.commessaId || !formData.stato) {
      return false;
    }
    
    // La funzione è obbligatoria e determina il nome del task
    if (!formData.funzioneId) {
      // Non mostriamo l'alert durante la validazione automatica, solo quando l'utente tenta di salvare
      return false;
    }
    
    // Imposta il nome del task dalla funzione selezionata se vuoto
    if (!formData.nome) {
      const funzioneSelezionata = funzioni.find(f => f.id === formData.funzioneId);
      setFormData(prev => ({
        ...prev,
        nome: funzioneSelezionata?.nome || ''
      }));
    }
    
    return true;
  };  // Handler invio form
  const handleSubmit = () => {
    // Verifica se la funzione è selezionata prima di procedere
    if (!formData.funzioneId) {
      alert('È necessario selezionare una funzione per il task');
      return;
    }
    
    if (isFormValid()) {
      // Verifica che il nome del task sia impostato dalla funzione selezionata
      const funzioneSelezionata = funzioni.find(f => f.id === formData.funzioneId);
      
      // Formatta le date in formato ISO
      const formattedData = { 
        ...formData,
        // Assicurati che il nome sia preso dalla funzione
        nome: funzioneSelezionata?.nome || formData.nome,
        // Converti date in formato ISO string se presenti, altrimenti null
        dataInizio: formData.dataInizio ? formData.dataInizio.toISOString() : null,
        dataFine: formData.dataFine ? formData.dataFine.toISOString() : null,
        // Converti altri campi numerici esplicitamente
        numeroRisorse: parseInt(formData.numeroRisorse) || 1,
        durataPrevista: formData.durataPrevista ? parseFloat(formData.durataPrevista) : null
      };
      
      console.log("Dati del task formattati:", formattedData);
      onSave(formattedData);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <AssignmentIcon sx={{ mr: 1 }} />
            <Typography variant="h6">{title}</Typography>
          </Box>
          {formData.nome && (
            <Chip 
              label={formData.nome} 
              color="primary" 
              variant="outlined" 
              sx={{ ml: 2 }}
            />
          )}
        </Box>
      </DialogTitle><DialogContent dividers>
        <Grid container spacing={2}>
          {/* Competenze e funzione - spostato in alto */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              <MenuBookIcon fontSize="small" sx={{ mr: 0.5, verticalAlign: 'text-bottom' }} />
              Funzione e competenze
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth variant="outlined" margin="dense">
                  <InputLabel>Funzione (definisce il nome del task)</InputLabel>
                  <Select
                    value={formData.funzioneId}
                    onChange={(e) => {
                      // Trova la funzione selezionata
                      const funzioneSelezionata = funzioni.find(f => f.id === e.target.value);
                      // Aggiorna sempre il nome del task con la funzione selezionata
                      setFormData(prev => ({
                        ...prev,
                        funzioneId: e.target.value,
                        // Aggiorna il nome del task dalla funzione selezionata
                        nome: funzioneSelezionata?.nome || ''
                      }));
                    }}
                    label="Funzione (definisce il nome del task)"
                    required
                    disabled={loadingFunzioni}
                    autoFocus
                  >                    <MenuItem value="">
                      <em>Seleziona una funzione</em>
                    </MenuItem>
                    {Array.isArray(funzioni) ? funzioni.map((f) => (
                      <MenuItem key={f.id} value={f.id}>
                        {f.nome}
                      </MenuItem>
                    )) : <MenuItem disabled>Nessuna funzione disponibile</MenuItem>}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <SkillsSelector 
                  value={formData.skills}
                  onChange={(e) => setFormData(prev => ({ ...prev, skills: e.target.value }))}
                  label="Competenze richieste"
                />
              </Grid>
            </Grid>
          </Grid>

          {/* Divider */}
          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
          </Grid>
          
          {/* Sezione principale - descrizione */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Informazioni principali
            </Typography>
            <Grid container spacing={2}>
              {/* Campo nome nascosto, viene impostato automaticamente dalla funzione */}
              <input
                type="hidden"
                value={formData.nome}
              />
              <Grid item xs={12}>
                <TextField
                  label="Descrizione"
                  fullWidth
                  variant="outlined"
                  value={formData.descrizione}
                  onChange={(e) => setFormData(prev => ({ ...prev, descrizione: e.target.value }))}
                  multiline
                  rows={3}
                  margin="dense"
                />
              </Grid>
            </Grid>
          </Grid>

          {/* Divider */}
          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
          </Grid>
          
          {/* Selezione commessa e stato */}
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              <WorkIcon fontSize="small" sx={{ mr: 0.5, verticalAlign: 'text-bottom' }} />
              Commessa e stato
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth variant="outlined" margin="dense">
                  <InputLabel>Commessa *</InputLabel>
                  <Select
                    value={formData.commessaId}
                    onChange={handleCommessaChange}
                    label="Commessa *"
                    required
                  >
                    <MenuItem value="">
                      <em>Seleziona una commessa</em>
                    </MenuItem>
                    {commesse.map((c) => (
                      <MenuItem key={c.id} value={c.id}>
                        {c.codice} - {c.descrizione}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth variant="outlined" margin="dense">
                  <InputLabel>Stato *</InputLabel>
                  <Select
                    value={formData.stato}
                    onChange={(e) => setFormData(prev => ({ ...prev, stato: e.target.value }))}
                    label="Stato *"
                    required
                  >
                    <MenuItem value="attivo">Attivo</MenuItem>
                    <MenuItem value="completato">Completato</MenuItem>
                    <MenuItem value="annullato">Annullato</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth variant="outlined" margin="dense">
                  <InputLabel>Location</InputLabel>
                  <Select
                    value={formData.locationId}
                    onChange={(e) => setFormData(prev => ({ ...prev, locationId: e.target.value }))}
                    label="Location"
                    disabled={!formData.commessaId || locations.length === 0}
                  >
                    <MenuItem value="">
                      <em>Nessuna location</em>
                    </MenuItem>
                    {locations.map((loc) => (
                      <MenuItem key={loc.id} value={loc.id}>
                        {loc.nome} {loc.indirizzo ? `(${loc.indirizzo})` : ''}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Grid>
          
          {/* Tempistiche e risorse */}
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              <ScheduleIcon fontSize="small" sx={{ mr: 0.5, verticalAlign: 'text-bottom' }} />
              Tempistiche e risorse
            </Typography>
            <Grid container spacing={2}>              <Grid item xs={12}>
                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={it}>
                  <DateTimePicker
                    label="Data e ora inizio"
                    value={formData.dataInizio}
                    onChange={(date) => setFormData(prev => ({ ...prev, dataInizio: date }))}
                    slotProps={{ textField: { variant: 'outlined', fullWidth: true, margin: 'dense' } }}
                    ampm={false}
                    format="dd/MM/yyyy HH:mm"
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12}>
                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={it}>
                  <DateTimePicker
                    label="Data e ora fine"
                    value={formData.dataFine}
                    onChange={(date) => setFormData(prev => ({ ...prev, dataFine: date }))}
                    minDate={formData.dataInizio}
                    slotProps={{ textField: { variant: 'outlined', fullWidth: true, margin: 'dense' } }}
                    ampm={false}
                    format="dd/MM/yyyy HH:mm"
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Durata prevista (ore)"
                  type="number"
                  fullWidth
                  variant="outlined"
                  value={formData.durataPrevista}
                  onChange={(e) => setFormData(prev => ({ ...prev, durataPrevista: e.target.value }))}
                  inputProps={{ min: 0, step: 0.5 }}
                  margin="dense"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Numero risorse"
                  type="number"
                  fullWidth
                  variant="outlined"
                  value={formData.numeroRisorse}
                  onChange={(e) => setFormData(prev => ({ ...prev, numeroRisorse: Math.max(1, parseInt(e.target.value) || 1) }))}
                  inputProps={{ min: 1, step: 1 }}
                  margin="dense"
                />
              </Grid>
            </Grid>
          </Grid>
          
          {/* Divider */}
          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
          </Grid>
            {/* La sezione Competenze e funzione è stata spostata all'inizio del form */}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Annulla</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          disabled={saving || !isFormValid()}
        >
          {saving ? <CircularProgress size={24} /> : (task ? 'Salva Modifiche' : 'Crea Task')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default TaskForm;
