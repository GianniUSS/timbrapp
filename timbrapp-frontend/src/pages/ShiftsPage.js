import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ShiftCard from '../components/ShiftCard';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import { LocalizationProvider, StaticDatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import itLocale from 'date-fns/locale/it';
import MuiPickersDay from '../components/MuiPickersDayProxy';

export default function ShiftsPage() {
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [userId, setUserId] = useState(null);

  // Recupera userId dal token o localStorage
  useEffect(() => {
    try {
      const userRaw = localStorage.getItem('user');
      if (userRaw && userRaw !== 'undefined') {
        const user = JSON.parse(userRaw);
        if (user && user.id) setUserId(user.id);
      }
    } catch (e) {
      setUserId(null);
    }
  }, []);

  // Carica i turni dell'utente corrente
  useEffect(() => {
    if (!userId) return;
    const fetchShifts = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`/api/shifts?userId=${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setShifts(res.data);
      } catch (err) {
        setError('Errore nel caricamento dei turni');
      }
      setLoading(false);
    };
    fetchShifts();
  }, [userId]);

  // DEBUG: Mostra tutti i turni se userId non trovato o per debug
  useEffect(() => {
    if (userId) return;
    const fetchAllShifts = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`/api/shifts`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setShifts(res.data);
      } catch (err) {
        setError('Errore nel caricamento dei turni (tutti gli utenti)');
      }
      setLoading(false);
    };
    fetchAllShifts();
  }, [userId]);

  // Filtra i turni per la data selezionata
  const selectedShifts = shifts.filter(s => s.date === selectedDate.toISOString().slice(0, 10));

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>I miei turni</Typography>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : (
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={itLocale}>
          <Box sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
          }}>
            <StaticDatePicker
              displayStaticWrapperAs="desktop"
              value={selectedDate}
              onChange={setSelectedDate}
              showToolbar={false}
              // Rimuove i pulsanti CANCEL/OK
              slotProps={{
                actionBar: { actions: [] }
              }}
              sx={{
                mb: 3,
                bgcolor: 'white',
                borderRadius: 3,
                boxShadow: '0 4px 24px 0 rgba(25, 118, 210, 0.08)',
                border: '1px solid #e0e3e7',
                p: { xs: 1, sm: 2 },
                minWidth: 320,
                maxWidth: 380,
                '& .MuiPickersDay-root': {
                  fontSize: '1.05rem',
                  width: 36,
                  minWidth: 36,
                  maxWidth: 36,
                  height: 36,
                  marginLeft: '1px',
                  marginRight: '1px',
                  p: 0,
                },
                '& .MuiPickersCalendarHeader-label': {
                  fontSize: '1.25rem',
                  fontWeight: 600,
                  letterSpacing: 0.2,
                  textTransform: 'capitalize',
                },
                '& .MuiDayCalendar-weekDayLabel': {
                  fontWeight: 600,
                  color: '#607d8b',
                  fontSize: '0.95rem',
                  width: 36,
                  minWidth: 36,
                  maxWidth: 36,
                  textAlign: 'center',
                  p: 0,
                },
                '& .MuiDayCalendar-header': {
                  mb: 1,
                },
                '& .MuiDayCalendar-weekContainer': {
                  mb: 0.3,
                },
                overflow: 'visible',
              }}
              slots={{
                day: (props) => {
                  const dayStr = props.day?.toLocaleDateString('it-IT');
                  const hasShift = shifts.some(s => {
                    const shiftDate = new Date(s.date + 'T00:00:00');
                    return shiftDate.toLocaleDateString('it-IT') === dayStr;
                  });
                  return (
                    <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
                      <MuiPickersDay {...props} />
                      {hasShift && (
                        <Box sx={{
                          position: 'absolute',
                          left: '50%',
                          top: '70%',
                          transform: 'translate(-50%, 0)',
                          width: 6,
                          height: 6,
                          bgcolor: 'primary.main',
                          borderRadius: '50%',
                          pointerEvents: 'none',
                          boxShadow: '0 0 2px 1px rgba(25, 118, 210, 0.10)',
                        }} />
                      )}
                    </Box>
                  );
                }
              }}
            />
          </Box>
        </LocalizationProvider>
      )}
      <Box sx={{ mt: 3 }}>
        {selectedShifts.length > 0 ? (
          selectedShifts.map((selectedShift, idx) => (
            <ShiftCard
              key={selectedShift.id || idx}
              shiftInfo={{
                hours: `${selectedShift.startTime} - ${selectedShift.endTime}`,
                location: selectedShift.location,
                department: selectedShift.role,
                date: selectedShift.date,
                notes: selectedShift.notes,
                commessa: selectedShift.commessa // aggiunta commessa
              }}
              label={(() => {
                const today = new Date();
                const sel = selectedDate;
                const isToday = sel.getDate() === today.getDate() && sel.getMonth() === today.getMonth() && sel.getFullYear() === today.getFullYear();
                const dateStr = sel.toLocaleDateString('it-IT');
                return isToday ? `Turno di oggi · ${dateStr}` : `Turno del ${dateStr}`;
              })()}
            />
          ))
        ) : (
          <Typography align="center" color="text.secondary">Nessun turno per la data selezionata.</Typography>
        )}
      </Box>
    </Container>
  );
}
