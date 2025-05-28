import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Button from '@mui/material/Button';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import CircularProgress from '@mui/material/CircularProgress';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonIcon from '@mui/icons-material/Person';
import WorkIcon from '@mui/icons-material/Work';
import AssignmentIcon from '@mui/icons-material/Assignment';
import SchoolIcon from '@mui/icons-material/School';

import api from '../api';
import SkillsSelector from './SkillsSelector';
import VirtualScrollList from './VirtualScrollList';

/**
 * Componente per la visualizzazione e gestione del personale
 */
function PersonaleTab() {
  // Stati per i dati
  const [personale, setPersonale] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Stati per filtri e ricerca
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRuolo, setFilterRuolo] = useState('');
  
  // Stati per form e dialoghi
  const [formOpen, setFormOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [editingPersona, setEditingPersona] = useState(null);
  const [selectedPersona, setSelectedPersona] = useState(null);
  
  // Stati per notifiche
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
  
  // Stati per i ruoli disponibili
  const [ruoli, setRuoli] = useState([
    'Sviluppatore', 'Project Manager', 'Designer', 'Tecnico', 'Amministrativo', 'Altro'
  ]);
  
  // Form state
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    ruolo: '',
    skills: []
  });
  
  // Caricamento dati
  useEffect(() => {
    fetchPersonale();
  }, []);
    // Funzione per caricare il personale
  const fetchPersonale = async () => {
    try {
      setLoading(true);
      const response = await api.personale.getAll();
      // Verifica che response.data sia un array prima di assegnarlo
      if (Array.isArray(response.data)) {
        console.log('Personale caricato:', response.data.length, 'record');
        setPersonale(response.data);
        setError(null);
      } else {
        console.error('La risposta API non contiene un array:', response.data);
        throw new Error('Formato risposta API non valido');
      }
    } catch (err) {
      console.error('Errore nel caricamento del personale:', err);
      setError('Impossibile caricare i dati del personale. Riprova più tardi.');
    } finally {
      setLoading(false);
    }  };
  
  // Filtraggio del personale
  const filteredPersonale = Array.isArray(personale) ? personale.filter(persona => {
    const searchMatch = searchTerm === '' || 
      (persona.nome?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (persona.email?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (persona.ruolo?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const ruoloMatch = filterRuolo === '' || persona.ruolo === filterRuolo;
    
    return searchMatch && ruoloMatch;
  }) : [];
  
  // Handler per la ricerca
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };
  
  // Handler per il filtro ruolo
  const handleRuoloFilterChange = (event) => {
    setFilterRuolo(event.target.value);
  };
  
  // Handler per aprire il form di creazione
  const handleOpenCreateForm = () => {
    setEditingPersona(null);
    setFormData({
      nome: '',
      email: '',
      ruolo: '',
      skills: []
    });
    setFormOpen(true);
  };
  
  // Handler per aprire il form di modifica
  const handleOpenEditForm = (persona) => {
    setEditingPersona(persona);
    setFormData({
      nome: persona.nome,
      email: persona.email,
      ruolo: persona.ruolo,
      skills: persona.skills || []
    });
    setFormOpen(true);
  };
  
  // Handler per aprire i dettagli
  const handleOpenDetails = (persona) => {
    setSelectedPersona(persona);
    setDetailsOpen(true);
  };
  
  // Handler per confermare l'eliminazione
  const handleConfirmDelete = (persona) => {
    setSelectedPersona(persona);
    setConfirmDeleteOpen(true);
  };
  
  // Handler per il cambio dei dati del form
  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Handler per il salvataggio del personale
  const handleSavePersona = async (event) => {
    if (event) event.preventDefault();
    
    try {
      setLoading(true);
      
      if (editingPersona) {
        // Modifica persona esistente
        await api.personale.update(editingPersona.id, formData);
        
        // Aggiorna la lista locale
        setPersonale(personale.map(p => 
          p.id === editingPersona.id ? { ...p, ...formData, commesse: p.commesse } : p
        ));
        
        setNotification({
          open: true,
          message: 'Persona modificata con successo',
          severity: 'success'
        });
      } else {
        // Crea nuova persona
        const response = await api.personale.create(formData);
        
        // Aggiungi alla lista locale
        setPersonale([...personale, { ...response.data, commesse: 0 }]);
        
        setNotification({
          open: true,
          message: 'Persona creata con successo',
          severity: 'success'
        });
      }
      
      setFormOpen(false);
    } catch (err) {
      console.error('Errore nel salvataggio:', err);
      setNotification({
        open: true,
        message: 'Errore durante il salvataggio. Riprova più tardi.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Eliminazione del personale
  const handleDeletePersona = async () => {
    if (!selectedPersona) return;
    
    try {
      setLoading(true);
      
      await api.personale.delete(selectedPersona.id);
      
      // Aggiorna la lista locale
      setPersonale(personale.filter(p => p.id !== selectedPersona.id));
      
      setNotification({
        open: true,
        message: 'Persona eliminata con successo',
        severity: 'success'
      });
      
      setConfirmDeleteOpen(false);
    } catch (err) {
      console.error('Errore durante l\'eliminazione:', err);
      setNotification({
        open: true,
        message: 'Errore durante l\'eliminazione. Riprova più tardi.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Chiusura notifica
  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Filtri per il personale */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={7}>
            <TextField
              fullWidth
              size="small"
              label="Cerca personale"
              variant="outlined"
              placeholder="Nome, email, ruolo..."
              value={searchTerm}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                )
              }}
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              select
              fullWidth
              size="small"
              label="Filtra per ruolo"
              variant="outlined"
              value={filterRuolo}
              onChange={handleRuoloFilterChange}
              SelectProps={{
                native: false,
              }}
            >
              <MenuItem value="">Tutti i ruoli</MenuItem>
              {ruoli.map(ruolo => (
                <MenuItem key={ruolo} value={ruolo}>{ruolo}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={2}>
            <Button
              fullWidth
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleOpenCreateForm}
            >
              Nuovo
            </Button>
          </Grid>
        </Grid>
      </Box>
        {/* Lista virtuale del personale */}
      {loading && personale.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : filteredPersonale.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Nessun personale trovato.
          </Typography>
        </Box>
      ) : (
        <VirtualScrollList
          items={filteredPersonale}
          itemHeight={80}
          renderItem={({ item: persona, index, style }) => (
            <div style={style}>
              <Paper
                sx={{
                  p: 2,
                  mx: 1,
                  mb: 1,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.04)',
                    transform: 'translateY(-1px)',
                    boxShadow: 2
                  }
                }}
              >
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={3}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <PersonIcon sx={{ mr: 1, color: 'action.active' }} />
                      <Box>
                        <Typography variant="subtitle2" noWrap>
                          {persona.nome}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" noWrap>
                          {persona.email}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={2}>
                    <Chip
                      label={persona.ruolo}
                      size="small"
                      color={persona.ruolo === 'Project Manager' ? 'primary' : 'default'}
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12} sm={2}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <WorkIcon fontSize="small" sx={{ mr: 0.5, color: 'action.active' }} />
                      <Typography variant="body2">
                        {persona.commesse} commesse
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {persona.skills.slice(0, 3).map((skill, index) => (
                        <Chip
                          key={index}
                          label={skill}
                          size="small"
                          variant="outlined"
                          color="info"
                        />
                      ))}
                      {persona.skills.length > 3 && (
                        <Chip
                          label={`+${persona.skills.length - 3}`}
                          size="small"
                          variant="outlined"
                          color="default"
                        />
                      )}
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={2}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <Tooltip title="Visualizza dettagli">
                        <IconButton size="small" onClick={() => handleOpenDetails(persona)}>
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Modifica">
                        <IconButton size="small" onClick={() => handleOpenEditForm(persona)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Elimina">
                        <IconButton size="small" onClick={() => handleConfirmDelete(persona)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            </div>
          )}
          containerStyle={{ flexGrow: 1, overflow: 'hidden' }}
        />
      )}
      
      {/* Form di creazione/modifica */}
      <Dialog 
        open={formOpen} 
        onClose={() => setFormOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingPersona ? 'Modifica Persona' : 'Nuova Persona'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" noValidate sx={{ mt: 2 }} onSubmit={handleSavePersona}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  name="nome"
                  label="Nome completo"
                  fullWidth
                  required
                  value={formData.nome}
                  onChange={handleFormChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="email"
                  label="Email"
                  type="email"
                  fullWidth
                  required
                  value={formData.email}
                  onChange={handleFormChange}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Ruolo</InputLabel>
                  <Select
                    name="ruolo"
                    value={formData.ruolo}
                    onChange={handleFormChange}
                    label="Ruolo"
                  >
                    <MenuItem value="">Seleziona un ruolo</MenuItem>
                    {ruoli.map(ruolo => (
                      <MenuItem key={ruolo} value={ruolo}>{ruolo}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <SkillsSelector
                  value={formData.skills}
                  onChange={(e) => setFormData(prev => ({ ...prev, skills: e.target.value }))}
                  label="Competenze"
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFormOpen(false)}>Annulla</Button>
          <Button 
            variant="contained" 
            onClick={handleSavePersona}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Salva'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Dialog Dettagli */}
      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedPersona && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <PersonIcon sx={{ mr: 1 }} />
                {selectedPersona.nome}
              </Box>
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">Email</Typography>
                  <Typography variant="body1">{selectedPersona.email}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">Ruolo</Typography>
                  <Typography variant="body1">{selectedPersona.ruolo}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">Competenze</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                    {selectedPersona.skills.map((skill, index) => (
                      <Chip 
                        key={index}
                        label={skill} 
                        variant="outlined" 
                        color="primary" 
                      />
                    ))}
                  </Box>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDetailsOpen(false)}>Chiudi</Button>
              <Button 
                color="primary" 
                onClick={() => {
                  setDetailsOpen(false);
                  handleOpenEditForm(selectedPersona);
                }}
              >
                Modifica
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
      
      {/* Dialog Conferma Eliminazione */}
      <Dialog
        open={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
      >
        <DialogTitle>Conferma eliminazione</DialogTitle>
        <DialogContent>
          <Typography>
            Sei sicuro di voler eliminare {selectedPersona?.nome}?
            Questa azione non può essere annullata.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDeleteOpen(false)}>Annulla</Button>
          <Button 
            color="error" 
            onClick={handleDeletePersona}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Elimina'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Notifica */}
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
    </Box>
  );
}

export default PersonaleTab;
