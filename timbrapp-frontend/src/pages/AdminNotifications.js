// src/pages/AdminNotifications.js
import React, { useState, useEffect } from 'react';
import {
  Container, Typography, Paper, Box, TextField, Button,
  FormControl, InputLabel, Select, MenuItem, Grid, 
  Table, TableHead, TableBody, TableRow, TableCell, Snackbar, Alert
} from '@mui/material';
import api from '../api';

export default function AdminNotifications() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({
    userId: '',
    message: '',
    type: 'system'
  });
  const [sentNotifications, setSentNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Carica la lista degli utenti e notifiche inviate
  useEffect(() => {
    const loadData = async () => {
      try {
        // Carica la lista degli utenti
        const usersResponse = await api.get('/admin/users');
        setUsers(usersResponse.data);
        
        // Carica la lista delle notifiche inviate
        const notificationsResponse = await api.get('/admin/notifications');
        setSentNotifications(notificationsResponse.data);
      } catch (error) {
        console.error('Errore caricamento dati:', error);
        setSnackbar({
          open: true,
          message: 'Errore caricamento dati',
          severity: 'error'
        });
      }
    };

    loadData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post('/admin/notifications', form);
      
      // Mostra messaggio di successo
      setSnackbar({
        open: true,
        message: 'Notifica inviata con successo!',
        severity: 'success'
      });
      
      // Resetta il form
      setForm({ userId: '', message: '', type: 'system' });
      
      // Aggiorna la lista delle notifiche inviate
      const response = await api.get('/admin/notifications');
      setSentNotifications(response.data);
    } catch (error) {
      console.error('Errore invio notifica:', error);
      setSnackbar({
        open: true,
        message: 'Errore durante l\'invio della notifica',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Chiudi snackbar
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Formatta la data
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('it-IT');
  };

  return (
    <Container sx={{ mt: 3, mb: 4 }}>
      <Typography variant="h5" gutterBottom>Gestione Notifiche</Typography>
      
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>Invia Nuova Notifica</Typography>
        
        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Destinatario</InputLabel>
                <Select
                  name="userId"
                  value={form.userId}
                  onChange={handleChange}
                  required
                >
                  {users.map(user => (
                    <MenuItem key={user.id} value={user.id}>
                      {user.email}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Tipo</InputLabel>
                <Select
                  name="type"
                  value={form.type}
                  onChange={handleChange}
                >
                  <MenuItem value="system">Sistema</MenuItem>
                  <MenuItem value="timbratura">Timbratura</MenuItem>
                  <MenuItem value="richiesta">Richiesta</MenuItem>
                  <MenuItem value="avviso">Avviso</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                name="message"
                label="Messaggio"
                fullWidth
                multiline
                rows={3}
                value={form.message}
                onChange={handleChange}
                required
              />
            </Grid>
            
            <Grid item xs={12}>
              <Button 
                type="submit" 
                variant="contained" 
                disabled={loading}
              >
                {loading ? 'Invio...' : 'Invia Notifica'}
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>
      
      <Paper>
        <Typography variant="h6" sx={{ p: 2 }}>Notifiche Inviate</Typography>
        
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Data</TableCell>
              <TableCell>Destinatario</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell>Messaggio</TableCell>
              <TableCell>Stato</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sentNotifications.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  Nessuna notifica inviata
                </TableCell>
              </TableRow>
            ) : (
              sentNotifications.map(notification => (
                <TableRow key={notification.id}>
                  <TableCell>
                    {formatDate(notification.createdAt)}
                  </TableCell>
                  <TableCell>
                    {notification.User ? notification.User.email : `Utente ${notification.userId}`}
                  </TableCell>
                  <TableCell>{notification.type}</TableCell>
                  <TableCell>{notification.message}</TableCell>
                  <TableCell>
                    {notification.isRead ? 'Letta' : 'Non letta'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Paper>
      
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
