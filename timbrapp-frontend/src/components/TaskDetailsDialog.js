import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Grid, Typography, Chip, Box, Divider,
  ListItem, ListItemText, List
} from '@mui/material';

// Icone
import AssignmentIcon from '@mui/icons-material/Assignment';
import BusinessIcon from '@mui/icons-material/Business';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import PeopleIcon from '@mui/icons-material/People';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import WorkIcon from '@mui/icons-material/Work';

/**
 * Componente per visualizzare i dettagli di un task
 */
function TaskDetailsDialog({ 
  open, 
  onClose,
  task,
  onEdit,
  onDelete
}) {
  if (!task) return null;
  
  // Funzione per formattare le date
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      // Assumiamo che la data sia nel formato ISO o compatibile
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return date.toLocaleDateString('it-IT');
    } catch (e) {
      return dateString;
    }
  };
  
  // Ottiene il colore per lo stato del task
  const getStatusColor = (stato) => {
    switch(stato) {
      case 'attivo': return 'success';
      case 'completato': return 'primary';
      case 'annullato': return 'error';
      default: return 'default';
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">
            <AssignmentIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            {task.nome}
          </Typography>
          <Chip
            label={task.stato?.charAt(0).toUpperCase() + task.stato?.slice(1)}
            color={getStatusColor(task.stato)}
            size="small"
          />
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" fontWeight="bold">Informazioni Task</Typography>
            <Box sx={{ mt: 1 }}>
              <Typography variant="body2">
                <HourglassEmptyIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 1 }} />
                Durata prevista: <strong>{task.durataPrevista ? `${task.durataPrevista} ore` : 'Non specificata'}</strong>
              </Typography>
              <Typography variant="body2">
                <CalendarTodayIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 1 }} />
                Periodo: <strong>{formatDate(task.dataInizio)} - {formatDate(task.dataFine)}</strong>
              </Typography>
              <Typography variant="body2">
                <PeopleIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 1 }} />
                Risorse necessarie: <strong>{task.numeroRisorse || 1}</strong>
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" fontWeight="bold">Commessa</Typography>
            <Box sx={{ mt: 1 }}>
              <Typography variant="body2">
                <WorkIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 1 }} />
                Codice: <strong>{task.commessa?.codice || '-'}</strong>
              </Typography>
              <Typography variant="body2">
                <BusinessIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 1 }} />
                Cliente: <strong>{task.commessa?.cliente || '-'}</strong>
              </Typography>
              <Typography variant="body2">
                <BusinessIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 1 }} />
                Location: <strong>{task.location?.nome || 'Non specificata'}</strong>
              </Typography>
            </Box>
          </Grid>
          
          {task.descrizione && (
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" fontWeight="bold">Descrizione</Typography>
              <Typography variant="body2" sx={{ mt: 1, whiteSpace: 'pre-line' }}>
                {task.descrizione}
              </Typography>
            </Grid>
          )}
          
          {task.skills && task.skills.length > 0 && (
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" fontWeight="bold">Competenze richieste</Typography>
              <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {task.skills.map((skill, index) => (
                  <Chip 
                    key={index} 
                    label={skill} 
                    size="small" 
                    color="info" 
                    variant="outlined" 
                  />
                ))}
              </Box>
            </Grid>
          )}
          
          {/* Sezione riservata per futuri sviluppi: personale assegnato */}
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle1" fontWeight="bold">Personale assegnato</Typography>
            {false ? (
              <List dense>
                {/* Personale assegnato - esempio per sviluppo futuro */}
                <ListItem>
                  <ListItemText 
                    primary="Nome Cognome" 
                    secondary="Ruolo / Funzione" 
                  />
                </ListItem>
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Nessun personale assegnato a questo task
              </Typography>
            )}
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Chiudi</Button>
        {onDelete && (
          <Button 
            color="error"
            startIcon={<DeleteIcon />}
            onClick={() => onDelete(task.id)}
          >
            Elimina
          </Button>
        )}
        {onEdit && (
          <Button 
            variant="contained" 
            color="primary"
            startIcon={<EditIcon />}
            onClick={() => onEdit(task)}
          >
            Modifica
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

export default TaskDetailsDialog;
