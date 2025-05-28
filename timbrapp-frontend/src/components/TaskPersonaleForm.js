// file: TaskPersonaleForm.js
import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  TextField, Grid, MenuItem, Box, FormControl, InputLabel, Select,
  Chip, Typography, Avatar, List, ListItem, ListItemAvatar, 
  ListItemText, ListItemSecondaryAction, IconButton, Divider,
  CircularProgress, Snackbar, Alert, InputAdornment
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonIcon from '@mui/icons-material/Person';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import WorkIcon from '@mui/icons-material/Work';

import api from '../api';

/**
 * Componente per assegnare personale ai task
 */
function TaskPersonaleForm({ open, onClose, task, onSave, saving = false }) {
  // Stati per i dati
  const [personale, setPersonale] = useState([]);
  const [assignedPersonale, setAssignedPersonale] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Notifiche
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
  
  // Caricamento personale
  useEffect(() => {
    if (open) {
      fetchPersonale();
      
      if (task && task.id) {
        fetchAssignedPersonale(task.id);
      } else {
        setAssignedPersonale([]);
      }
    }
  }, [open, task]);
    // Funzione per caricare il personale
  const fetchPersonale = async () => {
    try {
      setLoading(true);
      // Modifica: utilizziamo api.task.getDipendenti() invece di api.personale.getAll()
      const response = await api.task.getDipendenti();
      setPersonale(response.data);
    } catch (err) {
      console.error('Errore nel caricamento del personale:', err);
      setNotification({
        open: true,
        message: 'Errore nel caricamento del personale. Riprova più tardi.',
        severity: 'error'
      });
      // Dati di esempio in caso di errore
      setPersonale([
        { id: 1, nome: 'Mario Rossi', email: 'mario.rossi@example.com', ruolo: 'Sviluppatore', skills: ['React', 'JavaScript', 'Node.js'] },
        { id: 2, nome: 'Laura Bianchi', email: 'laura.bianchi@example.com', ruolo: 'Project Manager', skills: ['Project Management', 'Agile', 'Scrum'] },
        { id: 3, nome: 'Giovanni Verdi', email: 'giovanni.verdi@example.com', ruolo: 'Designer', skills: ['UI/UX', 'Figma', 'Photoshop'] },
      ]);
    } finally {
      setLoading(false);
    }
  };
  // Funzione per caricare il personale assegnato a un task
  const fetchAssignedPersonale = async (taskId) => {
    try {
      setLoading(true);
      console.log(`Richiesta personale assegnato per task ID: ${taskId}`);
      
      // Tentativo di recuperare il personale assegnato
      const response = await api.task.getAssignedPersonale(taskId);
      
      if (response && response.data) {
        console.log(`Personale ricevuto:`, response.data);
        setAssignedPersonale(response.data);
      } else {
        console.warn('Risposta API ricevuta ma senza dati per il personale assegnato');
        setAssignedPersonale([]);
      }
    } catch (err) {
      console.error('Errore dettagliato nel caricamento del personale assegnato:', err);
      
      // Mostra dettagli più specifici sull'errore
      let errorMessage = 'Errore nel caricamento del personale assegnato.';
      
      if (err.response) {
        // Errore dal server con risposta
        errorMessage += ` Status: ${err.response.status}. `;
        if (err.response.data && err.response.data.message) {
          errorMessage += err.response.data.message;
        }
      } else if (err.request) {
        // Nessuna risposta ricevuta
        errorMessage += ' Nessuna risposta dal server.';
      } else {
        // Errore nella configurazione della richiesta
        errorMessage += ` ${err.message}`;
      }
      
      setNotification({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
      
      // Nessun dato in caso di errore
      setAssignedPersonale([]);
    } finally {
      setLoading(false);
    }
  };
  
  // Filtraggio del personale
  const filteredPersonale = personale.filter(persona => {
    const isAssigned = assignedPersonale.some(p => p.id === persona.id);
    const matchesSearch = searchTerm === '' || 
      persona.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      persona.ruolo.toLowerCase().includes(searchTerm.toLowerCase());
    
    return !isAssigned && matchesSearch;
  });
  
  // Handler per la ricerca
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };
  
  // Aggiunta personale
  const handleAddPersona = (persona) => {
    setAssignedPersonale(prev => [...prev, persona]);
  };
  
  // Rimozione personale
  const handleRemovePersona = (personaId) => {
    setAssignedPersonale(prev => prev.filter(p => p.id !== personaId));
  };
  // Salvataggio assegnazioni
  const handleSave = async () => {
    try {
      // Lista degli ID del personale da assegnare
      const personaleIds = assignedPersonale.map(p => p.id);
      console.log(`Tentativo di assegnazione personale al task ID: ${task?.id}`, personaleIds);
      
      if (task && task.id) {
        try {
          // Effettua la chiamata API per l'assegnazione
          const response = await api.task.assignPersonale(task.id, personaleIds);
          console.log('Risposta assegnazione personale:', response.data);
          
          // Mostra notifica di successo
          setNotification({
            open: true,
            message: 'Personale assegnato con successo',
            severity: 'success'
          });
        } catch (apiError) {
          console.error('Errore dettagliato API nell\'assegnazione del personale:', apiError);
          
          // Crea un messaggio di errore dettagliato
          let errorMessage = 'Errore durante l\'assegnazione del personale.';
          
          if (apiError.response) {
            errorMessage += ` Status: ${apiError.response.status}. `;
            if (apiError.response.data && apiError.response.data.message) {
              errorMessage += apiError.response.data.message;
            }
          } else if (apiError.request) {
            errorMessage += ' Nessuna risposta dal server.';
          } else {
            errorMessage += ` ${apiError.message}`;
          }
          
          // Notifica l'errore ma procedi con il salvataggio locale
          setNotification({
            open: true,
            message: errorMessage + ' I dati sono stati salvati solo localmente.',
            severity: 'warning'
          });
        }
      } else {
        console.warn('Tentativo di salvataggio senza task o task ID valido.');
        setNotification({
          open: true, 
          message: 'Impossibile salvare: task non valido o non specificato.',
          severity: 'error'
        });
        return; // Interrompe l'esecuzione in caso di task non valido
      }
      
      // Informa il componente genitore delle modifiche (anche in caso di errore API)
      onSave(assignedPersonale);
    } catch (err) {
      console.error('Errore generale durante il processo di assegnazione:', err);
      setNotification({
        open: true,
        message: `Errore imprevisto: ${err.message}`,
        severity: 'error'
      });
    }
  };
  
  // Chiusura notifica
  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
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
            <AssignmentIndIcon sx={{ mr: 1 }} />
            Assegna Personale al Task
          </Box>
          {task && (
            <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1 }}>
              Task: {task.nome}
            </Typography>
          )}
        </DialogTitle>
        
        <DialogContent>
          <Grid container spacing={2}>
            {/* Personale assegnato */}
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                Personale Assegnato
              </Typography>
              <List sx={{ backgroundColor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                    <CircularProgress size={24} />
                  </Box>
                ) : assignedPersonale.length > 0 ? (
                  assignedPersonale.map(persona => (
                    <React.Fragment key={persona.id}>
                      <ListItem>
                        <ListItemAvatar>
                          <Avatar>
                            <PersonIcon />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={persona.nome}
                          secondary={
                            <Box>
                              <Typography variant="body2" component="span">
                                {persona.ruolo}
                              </Typography>
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                                {persona.skills && persona.skills.slice(0, 2).map((skill, idx) => (
                                  <Chip
                                    key={idx}
                                    label={skill}
                                    size="small"
                                    variant="outlined"
                                    color="info"
                                  />
                                ))}
                                {persona.skills && persona.skills.length > 2 && (
                                  <Chip
                                    label={`+${persona.skills.length - 2}`}
                                    size="small"
                                    variant="outlined"
                                  />
                                )}
                              </Box>
                            </Box>
                          }
                        />
                        <ListItemSecondaryAction>
                          <IconButton edge="end" onClick={() => handleRemovePersona(persona.id)} disabled={saving}>
                            <DeleteIcon />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                      <Divider variant="inset" component="li" />
                    </React.Fragment>
                  ))
                ) : (
                  <ListItem>
                    <ListItemText
                      primary="Nessun personale assegnato"
                      secondary="Utilizza la lista a destra per aggiungere personale al task"
                    />
                  </ListItem>
                )}
              </List>
            </Grid>
            
            {/* Personale disponibile */}
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                Personale Disponibile
              </Typography>
              <TextField
                fullWidth
                size="small"
                label="Cerca personale"
                variant="outlined"
                placeholder="Nome, ruolo..."
                value={searchTerm}
                onChange={handleSearchChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  )
                }}
                sx={{ mb: 2 }}
              />
              <List sx={{ backgroundColor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                    <CircularProgress size={24} />
                  </Box>
                ) : filteredPersonale.length > 0 ? (
                  filteredPersonale.map(persona => (
                    <React.Fragment key={persona.id}>
                      <ListItem>
                        <ListItemAvatar>
                          <Avatar>
                            <PersonIcon />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={persona.nome}
                          secondary={
                            <Box>
                              <Typography variant="body2" component="span">
                                {persona.ruolo}
                              </Typography>
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                                {persona.skills && persona.skills.slice(0, 2).map((skill, idx) => (
                                  <Chip
                                    key={idx}
                                    label={skill}
                                    size="small"
                                    variant="outlined"
                                    color="info"
                                  />
                                ))}
                                {persona.skills && persona.skills.length > 2 && (
                                  <Chip
                                    label={`+${persona.skills.length - 2}`}
                                    size="small"
                                    variant="outlined"
                                  />
                                )}
                              </Box>
                            </Box>
                          }
                        />
                        <ListItemSecondaryAction>
                          <IconButton edge="end" onClick={() => handleAddPersona(persona)} disabled={saving}>
                            <AddIcon />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                      <Divider variant="inset" component="li" />
                    </React.Fragment>
                  ))
                ) : (
                  <ListItem>
                    <ListItemText
                      primary="Nessun personale disponibile"
                      secondary={searchTerm ? "Prova a modificare i criteri di ricerca" : "Tutto il personale è già assegnato"}
                    />
                  </ListItem>
                )}
              </List>
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={onClose} disabled={saving}>Annulla</Button>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? <CircularProgress size={24} /> : 'Salva'}
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

export default TaskPersonaleForm;
