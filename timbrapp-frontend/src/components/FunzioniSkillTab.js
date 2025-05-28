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
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Divider from '@mui/material/Divider';
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
import MenuBookIcon from '@mui/icons-material/MenuBook';
import ListAltIcon from '@mui/icons-material/ListAlt';
import SchoolIcon from '@mui/icons-material/School';

import api from '../api';
import SkillsSelector from './SkillsSelector';
import VirtualScrollList from './VirtualScrollList';

/**
 * Componente per la visualizzazione e gestione delle funzioni e skill
 */
function FunzioniSkillTab() {
  // Stati per il tab corrente
  const [tabValue, setTabValue] = useState('funzioni');
  
  // Stati per caricamento dati
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
    // Stati per i dati
  const [funzioni, setFunzioni] = useState([]);
  const [skills, setSkills] = useState([]);
  
  // Stati per ricerca e filtri
  const [searchFunzioniTerm, setSearchFunzioniTerm] = useState('');
  const [searchSkillTerm, setSearchSkillTerm] = useState('');
  const [filterSkillCategoria, setFilterSkillCategoria] = useState('');
  
  // Stati per i dialoghi
  const [funzioneFormOpen, setFunzioneFormOpen] = useState(false);
  const [skillFormOpen, setSkillFormOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  
  // Stati per i form
  const [funzioneFormData, setFunzioneFormData] = useState({
    nome: '',
    descrizione: '',
    skillRichieste: []
  });
  
  const [skillFormData, setSkillFormData] = useState({
    nome: '',
    categoria: '',
    livello: 'Intermedio'
  });
  
  // Possibili categorie di skill
  const categorieSkill = [
    'Frontend', 'Backend', 'Database', 'DevOps', 
    'Design', 'Metodologia', 'Soft Skills', 'Altro'
  ];
  
  // Possibili livelli di skill
  const livelliSkill = [
    'Base', 'Intermedio', 'Avanzato', 'Esperto'
  ];
  
  // Notifiche
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
  
  // Caricamento dati
  useEffect(() => {
    fetchFunzioni();
    fetchSkills();
  }, []);
  
  // Funzione per caricare le funzioni
  const fetchFunzioni = async () => {
    try {
      setLoading(true);
      const response = await api.funzioniSkill.getAllFunzioni();
      setFunzioni(response.data);
      setError(null);
    } catch (err) {
      console.error('Errore nel caricamento delle funzioni:', err);
      setError('Impossibile caricare le funzioni. Riprova più tardi.');
      // Usa dati di esempio in caso di errore
      setFunzioni([
        { id: 1, nome: 'Sviluppo Frontend', descrizione: 'Sviluppo interfacce utente', skillRichieste: ['React', 'JavaScript', 'HTML/CSS'] },
        { id: 2, nome: 'Sviluppo Backend', descrizione: 'Sviluppo API e logica server', skillRichieste: ['Node.js', 'Express', 'SQL'] },
        { id: 3, nome: 'Project Management', descrizione: 'Gestione progetti e risorse', skillRichieste: ['Agile', 'Scrum', 'Comunicazione'] },
      ]);
    } finally {
      setLoading(false);
    }
  };
  
  // Funzione per caricare le skill
  const fetchSkills = async () => {
    try {
      setLoading(true);
      const response = await api.funzioniSkill.getAllSkill();
      setSkills(response.data);
      setError(null);
    } catch (err) {
      console.error('Errore nel caricamento delle skill:', err);
      setError('Impossibile caricare le skill. Riprova più tardi.');
      // Usa dati di esempio in caso di errore
      setSkills([
        { id: 1, nome: 'React', categoria: 'Frontend', utilizzato: 10, livello: 'Avanzato' },
        { id: 2, nome: 'Node.js', categoria: 'Backend', utilizzato: 8, livello: 'Intermedio' },
        { id: 3, nome: 'Agile', categoria: 'Metodologia', utilizzato: 15, livello: 'Esperto' },
        { id: 4, nome: 'SQL', categoria: 'Database', utilizzato: 7, livello: 'Intermedio' },
      ]);
    } finally {
      setLoading(false);
    }
  };
    // Filtraggio delle funzioni
  const filteredFunzioni = funzioni.filter(funzione => {
    return searchFunzioniTerm === '' || 
      funzione.nome.toLowerCase().includes(searchFunzioniTerm.toLowerCase()) ||
      funzione.descrizione.toLowerCase().includes(searchFunzioniTerm.toLowerCase());
  });
  
  // Filtraggio delle skill
  const filteredSkills = skills.filter(skill => {
    const searchMatch = searchSkillTerm === '' || 
      skill.nome.toLowerCase().includes(searchSkillTerm.toLowerCase()) ||
      skill.categoria.toLowerCase().includes(searchSkillTerm.toLowerCase());
    
    const categoriaMatch = filterSkillCategoria === '' || skill.categoria === filterSkillCategoria;
    
    return searchMatch && categoriaMatch;
  });
  
  // Gestione cambio tab
  const handleChangeTab = (event, newValue) => {
    setTabValue(newValue);
  };
  
  // Handler per la ricerca funzioni
  const handleSearchFunzioniChange = (event) => {
    setSearchFunzioniTerm(event.target.value);
  };
  
  // Handler per la ricerca skill
  const handleSearchSkillChange = (event) => {
    setSearchSkillTerm(event.target.value);
  };
  
  // Handler per il filtro categoria skill
  const handleFilterCategoriaChange = (event) => {
    setFilterSkillCategoria(event.target.value);
  };
  
  // Apertura form nuova funzione
  const handleOpenCreateFunzione = () => {
    setEditingItem(null);
    setFunzioneFormData({
      nome: '',
      descrizione: '',
      skillRichieste: []
    });
    setFunzioneFormOpen(true);
  };
  
  // Apertura form nuova skill
  const handleOpenCreateSkill = () => {
    setEditingItem(null);
    setSkillFormData({
      nome: '',
      categoria: '',
      livello: 'Intermedio'
    });
    setSkillFormOpen(true);
  };
  
  // Apertura form modifica funzione
  const handleOpenEditFunzione = (funzione) => {
    setEditingItem(funzione);
    setFunzioneFormData({
      nome: funzione.nome,
      descrizione: funzione.descrizione,
      skillRichieste: funzione.skillRichieste || []
    });
    setFunzioneFormOpen(true);
  };
  
  // Apertura form modifica skill
  const handleOpenEditSkill = (skill) => {
    setEditingItem(skill);
    setSkillFormData({
      nome: skill.nome,
      categoria: skill.categoria,
      livello: skill.livello
    });
    setSkillFormOpen(true);
  };
  
  // Apertura dialog dettagli
  const handleOpenDetails = (item, type) => {
    setSelectedItem({ ...item, type });
    setDetailsOpen(true);
  };
  
  // Apertura dialog conferma eliminazione
  const handleConfirmDelete = (item, type) => {
    setSelectedItem({ ...item, type });
    setConfirmDeleteOpen(true);
  };
  
  // Handler per il cambio dei dati del form funzione
  const handleFunzioneFormChange = (event) => {
    const { name, value } = event.target;
    setFunzioneFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Handler per il cambio dei dati del form skill
  const handleSkillFormChange = (event) => {
    const { name, value } = event.target;
    setSkillFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Handler per il cambio delle skill richieste
  const handleSkillRichiesteChange = (event) => {
    const { value } = event.target;
    setFunzioneFormData(prev => ({ ...prev, skillRichieste: value }));
  };
  
  // Salvataggio funzione
  const handleSaveFunzione = async (event) => {
    event.preventDefault();
    
    try {
      setLoading(true);
      
      if (editingItem) {
        // Modifica funzione esistente
        await api.funzioniSkill.updateFunzione(editingItem.id, funzioneFormData);
        
        // Aggiorna la lista locale
        setFunzioni(funzioni.map(f => 
          f.id === editingItem.id ? { ...f, ...funzioneFormData } : f
        ));
        
        setNotification({
          open: true,
          message: 'Funzione aggiornata con successo',
          severity: 'success'
        });
      } else {
        // Crea nuova funzione
        const response = await api.funzioniSkill.createFunzione(funzioneFormData);
        
        // Aggiungi alla lista locale
        setFunzioni([...funzioni, response.data]);
        
        setNotification({
          open: true,
          message: 'Funzione creata con successo',
          severity: 'success'
        });
      }
      
      setFunzioneFormOpen(false);
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
  
  // Salvataggio skill
  const handleSaveSkill = async (event) => {
    event.preventDefault();
    
    try {
      setLoading(true);
      
      if (editingItem) {
        // Modifica skill esistente
        await api.funzioniSkill.updateSkill(editingItem.id, skillFormData);
        
        // Aggiorna la lista locale
        setSkills(skills.map(s => 
          s.id === editingItem.id ? { ...s, ...skillFormData } : s
        ));
        
        setNotification({
          open: true,
          message: 'Competenza aggiornata con successo',
          severity: 'success'
        });
      } else {
        // Crea nuova skill
        const response = await api.funzioniSkill.createSkill(skillFormData);
        
        // Aggiungi alla lista locale
        setSkills([...skills, { ...response.data, utilizzato: 0 }]);
        
        setNotification({
          open: true,
          message: 'Competenza creata con successo',
          severity: 'success'
        });
      }
      
      setSkillFormOpen(false);
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
  
  // Eliminazione funzione o skill
  const handleDelete = async () => {
    if (!selectedItem) return;
    
    try {
      setLoading(true);
      
      if (selectedItem.type === 'funzione') {
        // Elimina funzione
        await api.funzioniSkill.deleteFunzione(selectedItem.id);
        
        // Aggiorna la lista locale
        setFunzioni(funzioni.filter(f => f.id !== selectedItem.id));
        
        setNotification({
          open: true,
          message: 'Funzione eliminata con successo',
          severity: 'success'
        });
      } else {
        // Elimina skill
        await api.funzioniSkill.deleteSkill(selectedItem.id);
        
        // Aggiorna la lista locale
        setSkills(skills.filter(s => s.id !== selectedItem.id));
        
        setNotification({
          open: true,
          message: 'Competenza eliminata con successo',
          severity: 'success'
        });
      }
      
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
      {/* Sub-tab per funzioni e skill */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs 
          value={tabValue} 
          onChange={handleChangeTab} 
          aria-label="funzioni-skill-tabs"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab 
            label={<Box sx={{ display: 'flex', alignItems: 'center' }}>
              <ListAltIcon fontSize="small" sx={{ mr: 1 }} /> Funzioni
            </Box>} 
            value="funzioni" 
          />
          <Tab 
            label={<Box sx={{ display: 'flex', alignItems: 'center' }}>
              <SchoolIcon fontSize="small" sx={{ mr: 1 }} /> Competenze (Skills)
            </Box>} 
            value="skills" 
          />
        </Tabs>
      </Box>
      
      {/* Contenuto tab Funzioni */}
      {tabValue === 'funzioni' && (
        <>
          {/* Filtri per funzioni */}
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={9}>
                <TextField
                  fullWidth
                  size="small"
                  label="Cerca funzioni"
                  variant="outlined"
                  placeholder="Nome, descrizione..."
                  value={searchFunzioniTerm}
                  onChange={handleSearchFunzioniChange}
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
                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={handleOpenCreateFunzione}
                >
                  Nuova Funzione
                </Button>
              </Grid>
            </Grid>
          </Box>          {/* Lista virtuale Funzioni */}
          {loading && funzioni.length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : filteredFunzioni.length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Nessuna funzione trovata.
              </Typography>
            </Box>
          ) : (
            <VirtualScrollList
              items={filteredFunzioni}
              itemHeight={100}
              renderItem={({ item: funzione, index, style }) => (
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
                          <ListAltIcon fontSize="small" sx={{ mr: 1, color: 'action.active' }} />
                          <Typography variant="subtitle2" noWrap>
                            {funzione.nome}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {funzione.descrizione}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {funzione.skillRichieste.slice(0, 2).map((skill, index) => (
                            <Chip
                              key={index}
                              label={skill}
                              size="small"
                              variant="outlined"
                              color="primary"
                            />
                          ))}
                          {funzione.skillRichieste.length > 2 && (
                            <Chip
                              label={`+${funzione.skillRichieste.length - 2}`}
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
                            <IconButton size="small" onClick={() => handleOpenDetails(funzione, 'funzione')}>
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Modifica">
                            <IconButton size="small" onClick={() => handleOpenEditFunzione(funzione)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Elimina">
                            <IconButton size="small" onClick={() => handleConfirmDelete(funzione, 'funzione')}>
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
        </>
      )}
        {/* Contenuto tab Skills */}
      {tabValue === 'skills' && (
        <>
          {/* Filtri per skills */}
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Cerca skill"
                  variant="outlined"
                  placeholder="Nome, categoria..."
                  value={searchSkillTerm}
                  onChange={handleSearchSkillChange}
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
                  label="Filtra per categoria"
                  variant="outlined"
                  value={filterSkillCategoria}
                  onChange={handleFilterCategoriaChange}
                  SelectProps={{
                    native: false,
                  }}
                >
                  <MenuItem value="">Tutte le categorie</MenuItem>
                  {categorieSkill.map(categoria => (
                    <MenuItem key={categoria} value={categoria}>{categoria}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={handleOpenCreateSkill}
                >
                  Nuova Skill
                </Button>
              </Grid>
            </Grid>
          </Box>
            {/* Lista virtuale Skills */}
          {loading && skills.length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : filteredSkills.length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Nessuna skill trovata.
              </Typography>
            </Box>
          ) : (
            <VirtualScrollList
              items={filteredSkills}
              itemHeight={80}
              renderItem={({ item: skill, index, style }) => (
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
                          <SchoolIcon fontSize="small" sx={{ mr: 1, color: 'action.active' }} />
                          <Typography variant="subtitle2" noWrap>
                            {skill.nome}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={2}>
                        <Chip
                          label={skill.categoria}
                          size="small"
                          variant="outlined"
                          color="secondary"
                        />
                      </Grid>
                      <Grid item xs={12} sm={2}>
                        <Typography variant="body2" color="text.secondary">
                          {skill.utilizzato} task
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={2}>
                        <Chip
                          label={skill.livello}
                          size="small"
                          color={
                            skill.livello === 'Esperto' ? 'success' :
                            skill.livello === 'Avanzato' ? 'primary' :
                            'default'
                          }
                          variant="outlined"
                        />
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <Tooltip title="Visualizza dettagli">
                            <IconButton size="small" onClick={() => handleOpenDetails(skill, 'skill')}>
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Modifica">
                            <IconButton size="small" onClick={() => handleOpenEditSkill(skill)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Elimina">
                            <IconButton size="small" onClick={() => handleConfirmDelete(skill, 'skill')}>
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
        </>
      )}
        {/* Sezione informativa */}
      <Paper sx={{ p: 2, m: 2, borderRadius: 1 }}>
        <Typography variant="subtitle2" color="text.secondary">
          In questa sezione puoi gestire le funzioni e le competenze (skills) utilizzate nei task.
        </Typography>
      </Paper>
      
      {/* Form di creazione/modifica funzione */}
      <Dialog 
        open={funzioneFormOpen} 
        onClose={() => setFunzioneFormOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingItem ? 'Modifica Funzione' : 'Nuova Funzione'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" noValidate sx={{ mt: 2 }} onSubmit={handleSaveFunzione}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  name="nome"
                  label="Nome funzione"
                  fullWidth
                  required
                  value={funzioneFormData.nome}
                  onChange={handleFunzioneFormChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="descrizione"
                  label="Descrizione"
                  fullWidth
                  multiline
                  rows={2}
                  value={funzioneFormData.descrizione}
                  onChange={handleFunzioneFormChange}
                />
              </Grid>
              <Grid item xs={12}>
                <SkillsSelector
                  value={funzioneFormData.skillRichieste}
                  onChange={(e) => setFunzioneFormData(prev => ({ ...prev, skillRichieste: e.target.value }))}
                  label="Competenze richieste"
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFunzioneFormOpen(false)}>Annulla</Button>
          <Button 
            variant="contained" 
            onClick={handleSaveFunzione}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Salva'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Form di creazione/modifica skill */}
      <Dialog 
        open={skillFormOpen} 
        onClose={() => setSkillFormOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingItem ? 'Modifica Competenza' : 'Nuova Competenza'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" noValidate sx={{ mt: 2 }} onSubmit={handleSaveSkill}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  name="nome"
                  label="Nome competenza"
                  fullWidth
                  required
                  value={skillFormData.nome}
                  onChange={handleSkillFormChange}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Categoria</InputLabel>
                  <Select
                    name="categoria"
                    value={skillFormData.categoria}
                    onChange={handleSkillFormChange}
                    label="Categoria"
                  >
                    <MenuItem value="">Seleziona una categoria</MenuItem>
                    {categorieSkill.map(cat => (
                      <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Livello</InputLabel>
                  <Select
                    name="livello"
                    value={skillFormData.livello}
                    onChange={handleSkillFormChange}
                    label="Livello"
                  >
                    {livelliSkill.map(liv => (
                      <MenuItem key={liv} value={liv}>{liv}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSkillFormOpen(false)}>Annulla</Button>
          <Button 
            variant="contained" 
            onClick={handleSaveSkill}
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
        {selectedItem && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {selectedItem.type === 'funzione' ? (
                  <ListAltIcon sx={{ mr: 1 }} />
                ) : (
                  <SchoolIcon sx={{ mr: 1 }} />
                )}
                {selectedItem.nome}
              </Box>
            </DialogTitle>
            <DialogContent>
              {selectedItem.type === 'funzione' ? (
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">Descrizione</Typography>
                    <Typography variant="body1">{selectedItem.descrizione}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">Competenze richieste</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                      {selectedItem.skillRichieste?.map((skill, index) => (
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
              ) : (
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary">Categoria</Typography>
                    <Typography variant="body1">{selectedItem.categoria}</Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary">Livello</Typography>
                    <Typography variant="body1">{selectedItem.livello}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">Utilizzo</Typography>
                    <Typography variant="body1">{selectedItem.utilizzato || 0} task</Typography>
                  </Grid>
                </Grid>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDetailsOpen(false)}>Chiudi</Button>
              <Button 
                color="primary" 
                onClick={() => {
                  setDetailsOpen(false);
                  if (selectedItem.type === 'funzione') {
                    handleOpenEditFunzione(selectedItem);
                  } else {
                    handleOpenEditSkill(selectedItem);
                  }
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
            Sei sicuro di voler eliminare {selectedItem?.nome}?
            Questa azione non può essere annullata.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDeleteOpen(false)}>Annulla</Button>
          <Button 
            color="error" 
            onClick={handleDelete}
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

export default FunzioniSkillTab;
