import React, { useState, useEffect } from 'react';
// Ottimizzazione Material-UI Tree Shaking - Import specifici
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Autocomplete from '@mui/material/Autocomplete';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Tooltip from '@mui/material/Tooltip';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import EventIcon from '@mui/icons-material/Event';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PeopleIcon from '@mui/icons-material/People';
import BuildIcon from '@mui/icons-material/Build';

/**
 * Componente per la pianificazione dei turni delle risorse
 * in base alle commesse, task e skill necessari
 */
const ShiftPlanner = ({ 
  commesse, 
  skills = [],  // elenco delle competenze disponibili
  resources = [] // elenco delle risorse/dipendenti
}) => {
  const [shifts, setShifts] = useState([]);
  const [filteredCommesse, setFilteredCommesse] = useState([]);
  const [selectedCommessa, setSelectedCommessa] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentShift, setCurrentShift] = useState(null);
  const [view, setView] = useState('calendar'); // 'calendar' o 'resources'
  
  // Stato per il filtro
  const [filters, setFilters] = useState({
    commessaId: '',
    taskId: '',
    dateFrom: '',
    dateTo: '',
    resourceId: '',
    skill: ''
  });

  // Effetto per caricare i turni esistenti
  useEffect(() => {
    const fetchShifts = async () => {
      try {
        // Esempio di chiamata API per recuperare i turni
        const response = await fetch('/api/shifts');
        if (response.ok) {
          const data = await response.json();
          setShifts(data);
        }
      } catch (error) {
        console.error('Errore nel caricamento dei turni:', error);
      }
    };
    
    fetchShifts();
  }, []);
  
  // Filtra commesse in base ai task con tutte le info necessarie
  useEffect(() => {
    if (!commesse || commesse.length === 0) return;
    
    const filtered = commesse.filter(commessa => 
      commessa.tasks && commessa.tasks.some(task => 
        task.durataPrevista && 
        task.numeroRisorse &&
        task.skills
      )
    );
    
    setFilteredCommesse(filtered);
  }, [commesse]);
  
  const handleOpenDialog = (shift = null) => {
    setCurrentShift(shift);
    setIsDialogOpen(true);
    
    if (shift) {
      const commessa = commesse.find(c => c.id === shift.commessaId);
      setSelectedCommessa(commessa);
      if (commessa) {
        const task = commessa.tasks.find(t => t.id === shift.taskId);
        setSelectedTask(task);
      }
    }
  };
  
  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setCurrentShift(null);
    setSelectedCommessa(null);
    setSelectedTask(null);
  };
  
  const handleSaveShift = async () => {
    if (!currentShift || !selectedCommessa || !selectedTask) return;
    
    try {
      // Esempio di salvataggio di un turno
      const method = currentShift.id ? 'PUT' : 'POST';
      const url = currentShift.id ? `/api/shifts/${currentShift.id}` : '/api/shifts';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(currentShift)
      });
      
      if (response.ok) {
        // Aggiorna la lista dei turni
        if (method === 'POST') {
          const newShift = await response.json();
          setShifts([...shifts, newShift]);
        } else {
          const updatedShift = await response.json();
          setShifts(shifts.map(s => s.id === updatedShift.id ? updatedShift : s));
        }
        
        handleCloseDialog();
      }
    } catch (error) {
      console.error('Errore nel salvataggio del turno:', error);
    }
  };
  
  const handleDeleteShift = async (id) => {
    try {
      const response = await fetch(`/api/shifts/${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setShifts(shifts.filter(s => s.id !== id));
      }
    } catch (error) {
      console.error('Errore nell\'eliminazione del turno:', error);
    }
  };
  
  const handleFilterChange = (field, value) => {
    setFilters({
      ...filters,
      [field]: value
    });
  };
  
  // Renderizza la vista calendario
  const renderCalendarView = () => {
    // Raggruppa i turni per data
    const shiftsByDate = {};
    shifts.forEach(shift => {
      const date = shift.date.split('T')[0];
      if (!shiftsByDate[date]) shiftsByDate[date] = [];
      shiftsByDate[date].push(shift);
    });
    
    // Crea un array di date ordinato
    const dates = Object.keys(shiftsByDate).sort();
    
    return (
      <Box sx={{ mt: 3 }}>
        {dates.map(date => (
          <Card key={date} sx={{ mb: 2 }}>
            <CardHeader 
              title={new Date(date).toLocaleDateString('it-IT', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
              avatar={<EventIcon />}
              action={
                <Button 
                  startIcon={<AddIcon />}
                  onClick={() => {
                    setSelectedDate(date);
                    handleOpenDialog({
                      date,
                      commessaId: '',
                      taskId: '',
                      resourceId: '',
                      startTime: '09:00',
                      endTime: '18:00'
                    });
                  }}
                >
                  Aggiungi turno
                </Button>
              }
            />
            <CardContent>
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Commessa</TableCell>
                      <TableCell>Task</TableCell>
                      <TableCell>Risorsa</TableCell>
                      <TableCell>Orario</TableCell>
                      <TableCell align="right">Azioni</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {shiftsByDate[date].map(shift => {
                      const commessa = commesse.find(c => c.id === shift.commessaId);
                      const task = commessa?.tasks?.find(t => t.id === shift.taskId);
                      const resource = resources.find(r => r.id === shift.resourceId);
                      
                      return (
                        <TableRow key={shift.id}>
                          <TableCell>{commessa?.codice || 'N/A'}</TableCell>
                          <TableCell>{task?.nome || 'N/A'}</TableCell>
                          <TableCell>
                            {resource ? (
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Avatar 
                                  sx={{ width: 24, height: 24, mr: 1 }}
                                  src={resource.avatar}
                                >
                                  {resource.nome.charAt(0)}
                                </Avatar>
                                {resource.nome}
                              </Box>
                            ) : 'N/A'}
                          </TableCell>
                          <TableCell>
                            {shift.startTime} - {shift.endTime}
                          </TableCell>
                          <TableCell align="right">
                            <IconButton 
                              size="small" 
                              onClick={() => handleOpenDialog(shift)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton 
                              size="small" 
                              onClick={() => handleDeleteShift(shift.id)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        ))}
      </Box>
    );
  };
  
  // Renderizza la vista risorse
  const renderResourcesView = () => {
    // Raggruppa i turni per risorsa
    const shiftsByResource = {};
    shifts.forEach(shift => {
      if (!shiftsByResource[shift.resourceId]) shiftsByResource[shift.resourceId] = [];
      shiftsByResource[shift.resourceId].push(shift);
    });
    
    return (
      <Box sx={{ mt: 3 }}>
        <Grid container spacing={2}>
          {resources.map(resource => (
            <Grid item xs={12} sm={6} md={4} key={resource.id}>
              <Card>
                <CardHeader
                  title={resource.nome}
                  subheader={resource.ruolo}
                  avatar={
                    <Avatar src={resource.avatar}>
                      {resource.nome.charAt(0)}
                    </Avatar>
                  }
                />
                <CardContent>
                  <Box sx={{ mb: 2 }}>
                    {resource.skills?.map(skill => (
                      <Chip 
                        key={skill} 
                        label={skill} 
                        size="small" 
                        sx={{ mr: 0.5, mb: 0.5 }} 
                      />
                    ))}
                  </Box>
                  
                  {/* Mostra i turni assegnati alla risorsa */}
                  <Typography variant="subtitle2" gutterBottom>
                    Turni assegnati:
                  </Typography>
                  {shiftsByResource[resource.id]?.length > 0 ? (
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Data</TableCell>
                            <TableCell>Commessa</TableCell>
                            <TableCell>Orario</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {shiftsByResource[resource.id].map(shift => {
                            const commessa = commesse.find(c => c.id === shift.commessaId);
                            return (
                              <TableRow key={shift.id}>
                                <TableCell>
                                  {new Date(shift.date).toLocaleDateString('it-IT')}
                                </TableCell>
                                <TableCell>{commessa?.codice || 'N/A'}</TableCell>
                                <TableCell>
                                  {shift.startTime} - {shift.endTime}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Nessun turno assegnato
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  };
  
  // Dialog per aggiungere/modificare un turno
  const renderShiftDialog = () => {
    return (
      <Dialog 
        open={isDialogOpen} 
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {currentShift && currentShift.id ? 'Modifica turno' : 'Nuovo turno'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Commessa</InputLabel>
                <Select
                  value={selectedCommessa?.id || ''}
                  onChange={(e) => {
                    const commessa = commesse.find(c => c.id === e.target.value);
                    setSelectedCommessa(commessa);
                    setSelectedTask(null);
                    setCurrentShift({
                      ...currentShift,
                      commessaId: commessa?.id || '',
                      taskId: ''
                    });
                  }}
                  label="Commessa"
                >
                  {filteredCommesse.map(commessa => (
                    <MenuItem key={commessa.id} value={commessa.id}>
                      {commessa.codice} - {commessa.descrizione}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth disabled={!selectedCommessa}>
                <InputLabel>Task</InputLabel>
                <Select
                  value={selectedTask?.id || ''}
                  onChange={(e) => {
                    const task = selectedCommessa.tasks.find(t => t.id === e.target.value);
                    setSelectedTask(task);
                    setCurrentShift({
                      ...currentShift,
                      taskId: task?.id || ''
                    });
                  }}
                  label="Task"
                >
                  {selectedCommessa?.tasks
                    .filter(task => task.durataPrevista && task.numeroRisorse)
                    .map(task => (
                      <MenuItem key={task.id} value={task.id}>
                        {task.nome}
                        {task.skills && task.skills.length > 0 && (
                          <Tooltip title={`Skills: ${JSON.stringify(task.skills)}`}>
                            <BuildIcon sx={{ ml: 1, fontSize: '1rem' }} />
                          </Tooltip>
                        )}
                      </MenuItem>
                    ))
                  }
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                label="Data"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={currentShift?.date || selectedDate}
                onChange={(e) => setCurrentShift({
                  ...currentShift,
                  date: e.target.value
                })}
              />
            </Grid>
            
            <Grid item xs={6} sm={3}>
              <TextField
                label="Ora inizio"
                type="time"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={currentShift?.startTime || '09:00'}
                onChange={(e) => setCurrentShift({
                  ...currentShift,
                  startTime: e.target.value
                })}
              />
            </Grid>
            
            <Grid item xs={6} sm={3}>
              <TextField
                label="Ora fine"
                type="time"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={currentShift?.endTime || '18:00'}
                onChange={(e) => setCurrentShift({
                  ...currentShift,
                  endTime: e.target.value
                })}
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Risorsa</InputLabel>
                <Select
                  value={currentShift?.resourceId || ''}
                  onChange={(e) => setCurrentShift({
                    ...currentShift,
                    resourceId: e.target.value
                  })}
                  label="Risorsa"
                >
                  {/* Filtra le risorse in base alle skills richieste dal task */}
                  {resources
                    .filter(resource => 
                      !selectedTask?.skills || !selectedTask.skills.length || 
                      resource.skills?.some(skill => 
                        selectedTask.skills.includes(skill)
                      )
                    )
                    .map(resource => (
                      <MenuItem key={resource.id} value={resource.id}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar 
                            sx={{ width: 24, height: 24, mr: 1 }}
                            src={resource.avatar}
                          >
                            {resource.nome.charAt(0)}
                          </Avatar>
                          {resource.nome}
                          {resource.skills && (
                            <Box sx={{ ml: 1, display: 'flex', gap: 0.5 }}>
                              {resource.skills.map(skill => (
                                selectedTask?.skills?.includes(skill) ? (
                                  <Chip 
                                    key={skill}
                                    label={skill}
                                    size="small"
                                    color="success"
                                    sx={{ height: 20 }}
                                  />
                                ) : null
                              ))}
                            </Box>
                          )}
                        </Box>
                      </MenuItem>
                    ))
                  }
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                label="Note"
                fullWidth
                multiline
                rows={2}
                value={currentShift?.note || ''}
                onChange={(e) => setCurrentShift({
                  ...currentShift,
                  note: e.target.value
                })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Annulla</Button>
          <Button 
            onClick={handleSaveShift}
            startIcon={<SaveIcon />}
            variant="contained"
            disabled={!currentShift?.commessaId || !currentShift?.taskId || !currentShift?.resourceId}
          >
            Salva
          </Button>
        </DialogActions>
      </Dialog>
    );
  };
  
  return (
    <Box sx={{ my: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" component="h2">
          Pianificazione Turni
        </Typography>
        
        <Box>
          <Button 
            variant={view === 'calendar' ? 'contained' : 'outlined'}
            onClick={() => setView('calendar')}
            sx={{ mr: 1 }}
          >
            Calendario
          </Button>
          <Button 
            variant={view === 'resources' ? 'contained' : 'outlined'}
            onClick={() => setView('resources')}
          >
            Risorse
          </Button>
        </Box>
      </Box>
      
      {/* Filtri */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>Filtri</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Commessa</InputLabel>
              <Select
                value={filters.commessaId}
                onChange={(e) => handleFilterChange('commessaId', e.target.value)}
                label="Commessa"
              >
                <MenuItem value="">Tutte</MenuItem>
                {commesse.map(commessa => (
                  <MenuItem key={commessa.id} value={commessa.id}>
                    {commessa.codice}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="Da data"
              type="date"
              fullWidth
              size="small"
              InputLabelProps={{ shrink: true }}
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="A data"
              type="date"
              fullWidth
              size="small"
              InputLabelProps={{ shrink: true }}
              value={filters.dateTo}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Risorsa</InputLabel>
              <Select
                value={filters.resourceId}
                onChange={(e) => handleFilterChange('resourceId', e.target.value)}
                label="Risorsa"
              >
                <MenuItem value="">Tutte</MenuItem>
                {resources.map(resource => (
                  <MenuItem key={resource.id} value={resource.id}>
                    {resource.nome}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Bottone per creare nuovo turno */}
      <Box sx={{ mb: 2 }}>
        <Button 
          variant="contained" 
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog({
            date: new Date().toISOString().split('T')[0],
            commessaId: '',
            taskId: '',
            resourceId: '',
            startTime: '09:00',
            endTime: '18:00'
          })}
        >
          Nuovo Turno
        </Button>
      </Box>
      
      {/* Vista dinamica (calendario o risorse) */}
      {view === 'calendar' ? renderCalendarView() : renderResourcesView()}
      
      {/* Dialog per aggiunger/modificare turni */}
      {renderShiftDialog()}
    </Box>
  );
};

export default ShiftPlanner;
