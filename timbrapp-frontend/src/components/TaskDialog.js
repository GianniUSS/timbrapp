import React from 'react';
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

function TaskDialog({
  open,
  onClose,
  commesse,
  addTaskDialog,
  newTask,
  setNewTask,
  addingTask,
  handleAddTask
}) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Aggiungi Task</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Nome del task"
          type="text"
          fullWidth
          variant="outlined"
          value={newTask.nome}
          onChange={(e) => setNewTask({ ...newTask, nome: e.target.value })}
          sx={{ mb: 2 }}
        />
        <TextField
          margin="dense"
          label="Descrizione"
          type="text"
          fullWidth
          variant="outlined"
          value={newTask.descrizione}
          onChange={(e) => setNewTask({ ...newTask, descrizione: e.target.value })}
          multiline
          rows={3}
          sx={{ mb: 2 }}
        />
        {/* Selezione della commessa */}
        {!addTaskDialog.commessaId && (
          <FormControl fullWidth variant="outlined" margin="dense" sx={{ mb: 2 }}>
            <InputLabel>Commessa</InputLabel>
            <Select
              value={newTask.commessaId || ''}
              onChange={(e) => setNewTask({ ...newTask, commessaId: e.target.value })}
              label="Commessa"
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
        )}
        {/* Selezione della location */}
        {(addTaskDialog.commessaId || newTask.commessaId) && !newTask.locationId && (
          <FormControl fullWidth variant="outlined" margin="dense" sx={{ mb: 2 }}>
            <InputLabel>Location</InputLabel>
            <Select
              value={newTask.locationId || ''}
              onChange={(e) => setNewTask({ ...newTask, locationId: e.target.value })}
              label="Location"
            >
              <MenuItem value="">
                <em>Seleziona una location</em>
              </MenuItem>
              {commesse
                .find(c => c.id === (addTaskDialog.commessaId || newTask.commessaId))
                ?.locations?.filter(loc => !loc.virtual)
                .map((loc) => (
                  <MenuItem key={loc.id} value={loc.id}>
                    {loc.nome} {loc.indirizzo ? `(${loc.indirizzo})` : ''}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
        )}
        {/* Stato del task */}
        <FormControl fullWidth variant="outlined" margin="dense">
          <InputLabel>Stato</InputLabel>
          <Select
            value={newTask.stato}
            onChange={(e) => setNewTask({ ...newTask, stato: e.target.value })}
            label="Stato"
          >
            <MenuItem value="attivo">Attivo</MenuItem>
            <MenuItem value="completato">Completato</MenuItem>
            <MenuItem value="sospeso">Sospeso</MenuItem>
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Annulla
        </Button>
        <Button 
          onClick={handleAddTask} 
          color="primary" 
          disabled={addingTask || !newTask.nome || (!addTaskDialog.commessaId && !newTask.commessaId)}
          variant="contained"
        >
          {addingTask ? <CircularProgress size={24} /> : 'Aggiungi Task'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default TaskDialog;
