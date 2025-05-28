import React, { useEffect, useRef } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import RefreshIcon from '@mui/icons-material/Refresh';

/**
 * CalendarWrapper - Componente che isola il calendario in un iframe
 * Questo approccio radicale garantisce la visualizzazione del calendario
 * indipendentemente dai problemi di CSS e rendering nel contesto principale
 */
const CalendarWrapper = ({
  calendarEvents,
  commesseLoading,
  commesseError,
  fetchShifts,
  CATEGORY_COLORS
}) => {
  const iframeRef = useRef(null);
  
  // Genera l'HTML del calendario isolato
  useEffect(() => {
    if (!iframeRef.current) return;
    
    // Converti gli eventi in un formato JSON sicuro per essere inserito nell'HTML
    const eventsJSON = JSON.stringify(calendarEvents.map(ev => ({
      id: ev.id,
      title: ev.title || '',
      start: ev.start,
      end: ev.end,
      backgroundColor: (ev.commessa && CATEGORY_COLORS) ? 
        CATEGORY_COLORS[ev.commessa.id % (CATEGORY_COLORS.length || 1)] : '#1976d2',
      commessa: ev.commessa ? {
        id: ev.commessa.id,
        codice: ev.commessa.codice
      } : null,
      user: ev.user ? {
        nome: ev.user.nome
      } : null,
      startTime: ev.startTime,
      endTime: ev.endTime,
      role: ev.role,
      notes: ev.notes
    })));
    
    // HTML completo per l'iframe, con FullCalendar incluso
    const iframeContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Calendario Turni</title>
      
      <!-- FullCalendar CSS -->
      <link href="https://cdn.jsdelivr.net/npm/fullcalendar@6.1.8/main.min.css" rel="stylesheet">
      
      <!-- Stile personalizzato -->
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 0;
          height: 100vh;
          overflow: hidden;
        }
        
        #calendar {
          height: 100%;
          width: 100%;
          background-color: white;
        }
        
        .fc {
          height: 100%;
        }
        
        .fc-event {
          cursor: pointer;
        }
        
        .fc-toolbar-title {
          font-size: 1.5em !important;
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      <div id="calendar"></div>
      
      <!-- Script di FullCalendar -->
      <script src="https://cdn.jsdelivr.net/npm/fullcalendar@6.1.8/index.global.min.js"></script>
      
      <script>
        // Funzione per inizializzare il calendario
        document.addEventListener('DOMContentLoaded', function() {
          const calendarEl = document.getElementById('calendar');
          const events = ${eventsJSON};
          
          const calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth',
            headerToolbar: {
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay'
            },
            events: events,
            height: '100%',
            locale: 'it',
            firstDay: 1,
            nowIndicator: true,
            eventClick: function(info) {
              const event = info.event;
              const extendedProps = event.extendedProps;
              
              alert(
                'Turno di ' + (extendedProps.user?.nome || 'Utente sconosciuto') + '\\n' +
                extendedProps.startTime + ' - ' + extendedProps.endTime + '\\n' +
                'Commessa: ' + (extendedProps.commessa?.codice || '-') + '\\n' +
                'Ruolo: ' + (extendedProps.role || '-') + '\\n' +
                'Note: ' + (extendedProps.notes || '-')
              );
            }
          });
          
          calendar.render();
          
          // Comunica al frame parent che il calendario è stato renderizzato
          window.parent.postMessage('calendar-rendered', '*');
        });
      </script>
    </body>
    </html>
    `;
    
    // Aggiorna il contenuto dell'iframe
    const iframe = iframeRef.current;
    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
    
    iframeDoc.open();
    iframeDoc.write(iframeContent);
    iframeDoc.close();
  }, [iframeRef, calendarEvents, CATEGORY_COLORS]);
  
  // Gestisce il messaggio dal frame che indica che il calendario è stato renderizzato
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data === 'calendar-rendered') {
        console.log('🎉 Calendario renderizzato con successo nell\'iframe!');
      }
    };
    
    window.addEventListener('message', handleMessage);
    
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);
  
  return (
    <Box sx={{
      display: 'flex',
      flex: 1,
      flexDirection: 'column',
      width: '100%',
      maxWidth: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      mx: 'auto',
      boxSizing: 'border-box',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <Paper
        elevation={1}
        sx={{
          mb: 3,
          p: 2,
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600, color: '#1976d2' }}>
          Calendario Turni
        </Typography>
        
        <Button
          variant="contained"
          color="primary"
          onClick={fetchShifts}
          startIcon={<RefreshIcon />}
        >
          Aggiorna Turni
        </Button>
      </Paper>
      
      <Paper
        elevation={3}
        sx={{
          flex: '1 1 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          maxWidth: '100%',
          minWidth: 0,
          minHeight: 0,
          borderRadius: 2,
          boxShadow: (theme) => theme.shadows[4],
          backgroundColor: '#fff',
          p: { xs: 0, sm: 1 },
          boxSizing: 'border-box',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {commesseLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 500 }}>
            <CircularProgress />
          </Box>
        ) : commesseError ? (
          <Box sx={{ p: 3 }}>
            <Alert severity="error">{commesseError}</Alert>
          </Box>
        ) : (
          <Box
            component="iframe"
            ref={iframeRef}
            title="Calendario Turni"
            sx={{
              width: '100%',
              height: '700px',
              border: 'none',
              borderRadius: 1,
            }}
            sandbox="allow-scripts allow-same-origin"
            loading="lazy"
          ></Box>
        )}
      </Paper>
    </Box>
  );
};

export default CalendarWrapper;