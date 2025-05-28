import React, { useMemo, useState, useEffect, useCallback } from 'react';
import moment from 'moment';
import 'moment/locale/it';
import {
  Calendar,
  momentLocalizer,
} from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import CommesseLocationTaskTreeView from '../components/CommesseLocationTaskTreeView';

moment.locale('it');
const localizer = momentLocalizer(moment);

const CustomEvent = ({ event }) => {
  const codice = event.resource?.codice || '';
  const descrizione = event.resource?.descrizione || '';
  return (
    <div style={{
      height: '100%',
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      padding: '4px 6px',
      overflow: 'hidden',
      color: 'white'
    }}>
      <div style={{
        fontWeight: 'bold',
        fontSize: '12px',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        lineHeight: '1.2'
      }}>
        {codice || event.title?.split(' - ')[0] || ''}
      </div>
      <div style={{
        fontSize: '11px',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        opacity: 0.9,
        lineHeight: '1.2'
      }}>
        {descrizione || event.title?.split(' - ')[1] || ''}
      </div>
    </div>
  );
};

export default function DashboardWeb() {
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [menuOpen, setMenuOpen] = useState(false);

  const [commesse, setCommesse] = useState([]);
  const [commesseLoading, setCommesseLoading] = useState(true);
  const [commesseError, setCommesseError] = useState('');
  const [selectedCommesse, setSelectedCommesse] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [calendarEvents, setCalendarEvents] = useState([]);

  const [addLocationDialog, setAddLocationDialog] = useState({ open: false, commessaId: null });
  const [addTaskDialog, setAddTaskDialog] = useState({ open: false, locationId: null });
  const [newLocation, setNewLocation] = useState({ nome: '', indirizzo: '' });
  const [newTask, setNewTask] = useState({ nome: '', descrizione: '', stato: 'attivo' });
  const [addingLocation, setAddingLocation] = useState(false);
  const [addingTask, setAddingTask] = useState(false);

  // Caricamento dati commesse dal database
  useEffect(() => {
    async function fetchCommesse() {
      setCommesseLoading(true);
      setCommesseError('');
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setCommesseError('Token non trovato. Effettua nuovamente il login.');
          setCommesse([]);
          setCommesseLoading(false);
          return;
        }
        const response = await fetch('/api/commesse', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!response.ok) throw new Error(`Errore nel caricamento delle commesse: ${response.status}`);
        const commesseData = await response.json();
        setCommesse(commesseData);
        if (selectedCommesse.length === 0 && commesseData.length > 0) {
          setSelectedCommesse(commesseData.map(c => c.id));
        }
      } catch (err) {
        setCommesseError(`Errore nel caricamento delle commesse: ${err.message}`);
        setCommesse([]);
      } finally {
        setCommesseLoading(false);
      }
    }
    fetchCommesse();
  }, [selectedCommesse.length]);

  // Gestione della selezione/deselezione delle commesse
  const handleCommessaToggle = (commessaId) => {
    if (commessaId === 'select-all') {
      setSelectedCommesse(commesse.map(c => c.id));
      return;
    }
    if (commessaId === 'deselect-all') {
      setSelectedCommesse([]);
      return;
    }
    setSelectedCommesse(prev => {
      if (prev.includes(commessaId)) {
        return prev.filter(id => id !== commessaId);
      } else {
        return [...prev, commessaId];
      }
    });
  };

  // Gestione della selezione di un elemento
  const handleTreeItemSelect = (item) => setSelectedItem(item);

  // Gestione apertura dialog per aggiungere una location
  const handleOpenAddLocationDialog = (commessaId) => {
    setNewLocation({ nome: '', indirizzo: '' });
    setAddLocationDialog({ open: true, commessaId });
  };

  // Gestione apertura dialog per aggiungere un task
  const handleOpenAddTaskDialog = (locationId) => {
    setNewTask({ nome: '', descrizione: '', stato: 'attivo' });
    setAddTaskDialog({ open: true, locationId });
  };

  const handleSelectSlot = (slotInfo) => setSelectedDate(slotInfo.start);

  const formatEventInfo = (event) => {
    if (event.type === 'commessa') {
      const commessa = commesse.find(c => c.id === event.commessaId);
      if (!commessa) return '';
      return [
        `Commessa: ${commessa.codice} - ${commessa.descrizione}`,
        `Cliente: ${commessa.cliente}`,
        `Data inizio: ${moment(commessa.dataInizio).format('DD/MM/YYYY')}`,
        commessa.dataFine ? `Data fine: ${moment(commessa.dataFine).format('DD/MM/YYYY')}` : '',
        `Stato: ${commessa.stato}`,
        `Numero di location: ${commessa.locations?.length || 0}`
      ].filter(Boolean).join('\n');
    }
    return '';
  };
  const handleSelectEvent = (event) => {
    const message = formatEventInfo(event);
    if (message) alert(message);
  };

  // Dummy departments/employees
  const departments = [
    { id: 1, name: 'Amministrazione' },
    { id: 2, name: 'Sviluppo' },
    { id: 3, name: 'Marketing' },
    { id: 4, name: 'Risorse Umane' },
  ];
  const employees = [
    { id: 1, name: 'Mario Rossi', department: 1 },
    { id: 2, name: 'Luca Bianchi', department: 2 },
    { id: 3, name: 'Giulia Verdi', department: 3 },
    { id: 4, name: 'Anna Neri', department: 1 },
    { id: 5, name: 'Paolo Gialli', department: 4 },
  ];

  // Eventi calendario
  useEffect(() => {
    if (commesse.length === 0 || selectedCommesse.length === 0) {
      setCalendarEvents([]);
      return;
    }
    const normalizeDate = (date) => {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      return d;
    };
    const generateCommessaColor = (codice) => {
      if (!codice) return '#2986cc';
      const hash = codice.split('').reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0);
      const hue = Math.abs(hash) % 360;
      return `hsl(${hue}, 70%, 45%)`;
    };
    const generateCommessaEvent = (commessa) => {
      const startDate = commessa.dataInizio ? normalizeDate(commessa.dataInizio) : normalizeDate(new Date());
      let endDate = commessa.dataFine ? normalizeDate(commessa.dataFine) : new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000);
      const endDateExclusive = new Date(endDate.getTime() + 24 * 60 * 60 * 1000);
      const colorBase = generateCommessaColor(commessa.codice);
      return {
        id: `commessa-${commessa.id}`,
        title: `${commessa.codice} - ${commessa.descrizione}`,
        start: startDate,
        end: endDateExclusive,
        allDay: true,
        commessaId: commessa.id,
        type: 'commessa',
        color: colorBase,
        resource: {
          commessaId: commessa.id,
          codice: commessa.codice,
          descrizione: commessa.descrizione,
          dataInizio: startDate,
          dataFine: endDate
        }
      };
    };
    const filteredCommesse = commesse.filter(c => selectedCommesse.includes(c.id));
    const uniqueCommesse = Array.from(new Map(filteredCommesse.map(c => [c.id, c])).values());
    const newEvents = uniqueCommesse.map(generateCommessaEvent);
    setCalendarEvents(newEvents);
  }, [commesse, selectedCommesse]);

  // Nessuna height forzata. Solo vista "Mese".
  return (
    <div className="dashboard-container" style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      overflow: 'hidden',
      position: 'absolute',
      top: 0, left: 0, right: 0, bottom: 0,
      margin: 0, padding: 0
    }}>
      {/* Header */}
      <div className="dashboard-header" style={{
        height: '40px',
        backgroundColor: '#33466b',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        padding: '0 15px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
        flex: '0 0 auto'
      }}>
        <div
          onClick={() => setMenuOpen(!menuOpen)}
          style={{ cursor: 'pointer', fontSize: '18px', marginRight: '15px', display: 'flex', alignItems: 'center' }}
        >
          ☰
        </div>
        <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 'normal' }}>TimbrApp - Dashboard</h2>
      </div>
      <div className="dashboard-main" style={{ display: 'flex', flex: '1 1 auto', overflow: 'hidden', minHeight: 0, paddingBottom: 0 }}>
        {/* Pannello sinistro */}
        <div className="left-panel" style={{
          width: '320px',
          backgroundColor: '#f8f8f8',
          borderRight: '1px solid #e0e0e0',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'auto',
          flex: '0 0 auto'
        }}>
          <div style={{ padding: '10px 10px 0 10px' }}>
            <h3 style={{
              margin: '0 0 10px 0',
              fontSize: '14px',
              color: '#444',
              fontWeight: 'normal',
              padding: '5px',
              borderBottom: '1px solid #e0e0e0'
            }}>
              Commesse &gt; Location &gt; Task
            </h3>
            {commesseLoading ? (
              <div style={{ padding: '20px 10px', textAlign: 'center', color: '#666' }}>
                Caricamento commesse in corso...
              </div>
            ) : commesseError ? (
              <div style={{ padding: '10px', color: 'red' }}>
                {commesseError}
              </div>
            ) : (
              <CommesseLocationTaskTreeView
                data={commesse}
                selectedCommesse={selectedCommesse}
                onSelect={handleTreeItemSelect}
                onAddLocation={handleOpenAddLocationDialog}
                onAddTask={handleOpenAddTaskDialog}
                onToggleCommessa={handleCommessaToggle}
              />
            )}
          </div>
        </div>
        {/* Pannello centrale */}
        <div className="calendar-container" style={{
          flex: '1 1 auto',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          height: '100%',
        }}>
          <Calendar
            localizer={localizer}
            events={calendarEvents}
            date={selectedDate}
            onNavigate={date => setSelectedDate(date)}
            view="month"
            defaultView="month"
            onView={() => {}}
            views={["month"]}
            showMultiDayTimes
            step={60}
            popup
            selectable
            onSelectSlot={handleSelectSlot}
            onSelectEvent={handleSelectEvent}
            style={{ height: '100%', width: '100%' }}
            startAccessor="start"
            endAccessor="end"
            components={{
              event: CustomEvent,
            }}
            dayLayoutAlgorithm="no-overlap"
            culture="it"
            messages={{
              week: 'Settimana',
              work_week: 'Lavorativa',
              day: 'Giorno',
              month: 'Mese',
              previous: 'Indietro',
              next: 'Avanti',
              today: 'Oggi',
              agenda: 'Agenda',
              date: 'Data',
              time: 'Ora',
              event: 'Evento',
              showMore: total => `+${total} altri`,
            }}
            formats={{
              monthHeaderFormat: (date, culture, localizer) => localizer.format(date, 'MMMM YYYY', culture),
              weekdayFormat: (date, culture, localizer) => {
                const day = localizer.format(date, 'dddd', culture);
                return day.charAt(0).toUpperCase() + day.slice(1);
              },
              dayFormat: (date, culture, localizer) => localizer.format(date, 'DD', culture),
              dayHeaderFormat: (date, culture, localizer) => localizer.format(date, 'dddd D MMMM', culture),
            }}
            weekStartsOn={1}
            eventPropGetter={event => ({
              style: {
                backgroundColor: event.color || '#2986cc',
                color: 'white',
                border: '1px solid #1976d2',
                borderRadius: '4px',
                boxShadow: `0 2px 6px rgba(0, 0, 0, 0.15)`,
                padding: 0,
                margin: '2px 1px',
                height: 'auto',
                minHeight: '24px',
                cursor: 'pointer'
              }
            })}
          />
        </div>
        {/* Pannello destro */}
        <div className="right-panel" style={{
          width: '320px',
          backgroundColor: '#f8f8f8',
          borderLeft: '1px solid #e0e0e0',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'auto',
          flex: '0 0 auto'
        }}>
          <div style={{ padding: '10px' }}>
            <h3 style={{
              margin: '0 0 10px 0',
              fontSize: '14px',
              color: '#444',
              fontWeight: 'normal',
              padding: '5px',
              borderBottom: '1px solid #e0e0e0',
              display: 'flex',
              justifyContent: 'space-between'
            }}>
              <span>Dipendenti</span>
              <span style={{ fontSize: '13px' }}>
                {moment(selectedDate).format('DD/MM/YYYY')}
              </span>
            </h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {employees.map(emp => (
                <li key={emp.id}
                  style={{
                    padding: '8px 10px',
                    marginBottom: '2px',
                    backgroundColor: 'white',
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '13px',
                    alignItems: 'center'
                  }}>
                  <span>{emp.name}</span>
                  <span style={{
                    fontSize: '11px',
                    backgroundColor: emp.department === 1 ? '#e3f0f7' :
                      emp.department === 2 ? '#e8f5e9' :
                        emp.department === 3 ? '#fef6e6' : '#f0f0f0',
                    padding: '2px 6px',
                    borderRadius: '10px',
                    color: emp.department === 1 ? '#0277bd' :
                      emp.department === 2 ? '#2e7d32' :
                        emp.department === 3 ? '#ef6c00' : '#555'
                  }}>
                    {departments.find(d => d.id === emp.department)?.name.substring(0, 3)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
