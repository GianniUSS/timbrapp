import React, { useMemo, useState, useEffect } from 'react';
import moment from 'moment';
import 'moment/locale/it';
import {
  Calendar,
  Views,
  momentLocalizer,
} from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './calendar-custom.css'; // Importo CSS personalizzato
import './TimbrAppCalendarContainer.css'; // Importo CSS per il container
import './calendar-fix-vertical-lines.css'; // Importo CSS per risolvere il problema delle linee verticali
import './calendar-fix-additional.css'; // Importo CSS aggiuntivo per garantire la corretta visualizzazione
import './calendar-fix-final.css'; // Importo CSS finale per la risoluzione completa del problema
import CommesseLocationTaskTreeView from '../components/CommesseLocationTaskTreeView'; // Importo il componente TreeView

// Configurazione di moment in italiano
moment.locale('it');
const localizer = momentLocalizer(moment);

// Array vuoto per gli eventi
const events = [];

export default function DashboardWeb() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [menuOpen, setMenuOpen] = useState(false);
  
  // Stati per gestire commesse, location e task
  const [commesse, setCommesse] = useState([]);
  const [commesseLoading, setCommesseLoading] = useState(true);
  const [commesseError, setCommesseError] = useState('');
  const [selectedCommesse, setSelectedCommesse] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  
  // Stati per i dialog di aggiunta
  const [addLocationDialog, setAddLocationDialog] = useState({ open: false, commessaId: null });
  const [addTaskDialog, setAddTaskDialog] = useState({ open: false, locationId: null });
  const [newLocation, setNewLocation] = useState({ nome: '', indirizzo: '' });
  const [newTask, setNewTask] = useState({ nome: '', descrizione: '', stato: 'attivo' });
  const [addingLocation, setAddingLocation] = useState(false);
  const [addingTask, setAddingTask] = useState(false);

  // Uso useMemo per calcolare i valori del calendario basandosi sulla data corrente
  const { defaultDate, max, views } = useMemo(
    () => {
      const today = new Date();
      const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      return {
        defaultDate: today,
        max: moment(lastDayOfMonth).endOf('day').toDate(),
        views: Object.keys(Views).map((k) => Views[k]),
      };
    },
    []
  );
  
  // Caricamento dati commesse (simulato per questo esempio)
  useEffect(() => {
    // Qui in un'implementazione reale faremmo una chiamata API
    // Per questo esempio, generiamo dati di esempio
    setTimeout(() => {
      const datiEsempio = [
        {
          id: 1,
          codice: 'COM-001',
          descrizione: 'Progetto Web',
          dataInizio: '2025-01-01',
          dataFine: '2025-12-31',
          locations: [
            {
              id: 101,
              nome: 'Sede centrale',
              indirizzo: 'Via Roma 123',
              tasks: [
                { id: 1001, nome: 'Design UI', descrizione: 'Progettazione interfaccia utente', stato: 'attivo' },
                { id: 1002, nome: 'Sviluppo backend', descrizione: 'Implementazione API RESTful', stato: 'attivo' }
              ]
            },
            {
              id: 102,
              nome: 'Sede cliente',
              indirizzo: 'Corso Italia 456',
              tasks: [
                { id: 1003, nome: 'Testing', descrizione: 'Test funzionali', stato: 'attivo' }
              ]
            }
          ]
        },
        {
          id: 2,
          codice: 'COM-002',
          descrizione: 'Manutenzione server',
          dataInizio: '2025-02-01',
          dataFine: null,
          locations: [
            {
              id: 201,
              nome: 'Data center',
              indirizzo: 'Via Milano 789',
              tasks: [
                { id: 2001, nome: 'Backup giornaliero', descrizione: 'Backup dei dati', stato: 'attivo' },
                { id: 2002, nome: 'Monitoraggio sistema', descrizione: 'Controllo performance', stato: 'attivo' }
              ]
            }
          ]
        }
      ];
      
      setCommesse(datiEsempio);
      setSelectedCommesse(datiEsempio.map(c => c.id)); // Seleziona tutte le commesse per default
      setCommesseLoading(false);
    }, 500); // Simuliamo un ritardo di caricamento
  }, []);
  
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
  const handleTreeItemSelect = (item) => {
    console.log('Elemento selezionato:', item);
    setSelectedItem(item);
  };
  
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
  
  // Gestione dell'aggiunta di una location
  const handleAddLocation = () => {
    // In una implementazione reale, qui salveremmo la location tramite API
    console.log('Aggiungi location:', newLocation, 'alla commessa:', addLocationDialog.commessaId);
    
    // Simuliamo l'aggiunta della location
    const newLocationId = Date.now(); // Genera un ID unico
    const updatedCommesse = commesse.map(commessa => {
      if (commessa.id === addLocationDialog.commessaId) {
        return {
          ...commessa,
          locations: [
            ...commessa.locations,
            { 
              id: newLocationId, 
              nome: newLocation.nome, 
              indirizzo: newLocation.indirizzo,
              tasks: [] 
            }
          ]
        };
      }
      return commessa;
    });
    
    setCommesse(updatedCommesse);
    setAddLocationDialog({ open: false, commessaId: null });
  };
  
  // Gestione dell'aggiunta di un task
  const handleAddTask = () => {
    // In una implementazione reale, qui salveremmo il task tramite API
    console.log('Aggiungi task:', newTask, 'alla location:', addTaskDialog.locationId);
    
    // Simuliamo l'aggiunta del task
    const newTaskId = Date.now(); // Genera un ID unico
    const updatedCommesse = commesse.map(commessa => {
      return {
        ...commessa,
        locations: commessa.locations.map(location => {
          if (location.id === addTaskDialog.locationId) {
            return {
              ...location,
              tasks: [
                ...location.tasks,
                { 
                  id: newTaskId, 
                  nome: newTask.nome, 
                  descrizione: newTask.descrizione,
                  stato: newTask.stato 
                }
              ]
            };
          }
          return location;
        })
      };
    });
    
    setCommesse(updatedCommesse);
    setAddTaskDialog({ open: false, locationId: null });
  };

  // Gestori di eventi
  const handleSelectSlot = (slotInfo) => {
    setSelectedDate(slotInfo.start);
  };

  const handleSelectEvent = (event) => {
    console.log('Evento selezionato:', event);
    // Qui potresti aprire un modale di dettaglio evento
  };

  // Dummy data per il pannello laterale
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

  // Ottiene il nome del mese corrente per l'intestazione
  const currentMonthYear = moment(defaultDate).format('MMMM YYYY');

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100vh',
      overflow: 'hidden',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      margin: 0,
      padding: 0
    }}>
      {/* Barra superiore */}
      <div style={{ 
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

      {/* Container principale */}
      <div style={{ display: 'flex', flex: '1 1 auto', overflow: 'hidden', minHeight: 0, paddingBottom: 0 }}>
        {/* Pannello sinistro - Commesse */}
        <div style={{ 
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

        {/* Pannello centrale (calendario) */}
        <div style={{ 
          flex: '1 1 auto', 
          padding: '5px 5px 0 5px',
          overflow: 'hidden', 
          display: 'flex', 
          flexDirection: 'column', 
          minHeight: 0
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            padding: '5px 0',
            marginBottom: '5px',
            flex: '0 0 auto'
          }}>
            <div style={{ display: 'flex' }}>
              <button style={{
                margin: '0 2px',
                padding: '4px 10px',
                background: '#fff',
                border: '1px solid #ddd',
                borderRadius: '3px',
                cursor: 'pointer',
                fontSize: '12px'
              }}>Oggi</button>
              <button style={{
                margin: '0 2px',
                padding: '4px 10px',
                background: '#fff',
                border: '1px solid #ddd',
                borderRadius: '3px',
                cursor: 'pointer',
                fontSize: '12px'
              }}>Indietro</button>
              <button style={{
                margin: '0 2px',
                padding: '4px 10px',
                background: '#fff',
                border: '1px solid #ddd',
                borderRadius: '3px',
                cursor: 'pointer',
                fontSize: '12px'
              }}>Avanti</button>
            </div>
            <h3 style={{ 
              margin: 0, 
              fontWeight: 'normal',
              fontSize: '15px',
              color: '#444'
            }}>{currentMonthYear}</h3>
            <div style={{ display: 'flex', height: '28px' }}>
              <button style={{
                margin: '0',
                padding: '4px 10px',
                background: '#eef0f5',
                border: '1px solid #ddd',
                borderRadius: '3px 0 0 3px',
                cursor: 'pointer',
                fontSize: '12px',
                color: '#2986cc',
                fontWeight: '500'
              }}>Mese</button>
              <button style={{
                margin: '0',
                padding: '4px 10px',
                background: '#fff',
                border: '1px solid #ddd',
                borderLeft: 'none',
                cursor: 'pointer',
                fontSize: '12px'
              }}>Settimana</button>
              <button style={{
                margin: '0',
                padding: '4px 10px',
                background: '#fff',
                border: '1px solid #ddd',
                borderLeft: 'none',
                cursor: 'pointer',
                fontSize: '12px'
              }}>Lavorativa</button>
              <button style={{
                margin: '0',
                padding: '4px 10px',
                background: '#fff',
                border: '1px solid #ddd',
                borderLeft: 'none',
                cursor: 'pointer',
                fontSize: '12px'
              }}>Giorno</button>
              <button style={{
                margin: '0',
                padding: '4px 10px',
                background: '#fff',
                border: '1px solid #ddd',
                borderLeft: 'none',
                borderRadius: '0 3px 3px 0',
                cursor: 'pointer',
                fontSize: '12px'
              }}>Agenda</button>
            </div>
          </div>

          <div style={{ 
            border: '1px solid #e0e0e0', 
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)', 
            display: 'flex', 
            flexDirection: 'column', 
            flex: '1 1 auto',
            minHeight: 0,
            overflow: 'hidden',
            marginBottom: 0,
            borderBottom: 'none',
            width: '100%'
          }} className="calendar-container">
            {/* Calendario */}
            <div style={{ 
              flex: '1 1 auto', 
              minHeight: 0, 
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              width: '100%'
            }}>
              <Calendar
                localizer={localizer}
                events={events}
                defaultDate={defaultDate}
                max={max}
                view="month"
                views={["month", "week", "work_week", "day", "agenda"]}
                showMultiDayTimes
                step={60}
                popup
                selectable
                onSelectSlot={handleSelectSlot}
                onSelectEvent={handleSelectEvent}
                style={{ height: '100%', width: '100%' }}
                startAccessor="start"
                endAccessor="end"
                className="fixed-calendar"
                // Colorazione delle celle
                dayPropGetter={(date) => ({
                  style: {
                    backgroundColor: date.getMonth() === new Date(defaultDate).getMonth() ? 'white' : '#f5f5f5',
                  }
                })}
                // Personalizzazione componenti
                components={{
                  toolbar: () => null, // Nascondi toolbar predefinito poiché lo abbiamo personalizzato
                  event: (props) => (
                    <div style={{
                      color: 'white',
                      padding: '0 5px',
                      fontSize: '0.75rem',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      height: '18px',
                      lineHeight: '18px'
                    }}>
                      {props.title}
                    </div>
                  )
                }}
                // Imposta layout eventi
                dayLayoutAlgorithm="no-overlap"
                // Settimana da lunedì a domenica
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
                    // Formato esteso con prima lettera maiuscola (Lunedì, Martedì, ecc.)
                    const day = localizer.format(date, 'dddd', culture);
                    return day.charAt(0).toUpperCase() + day.slice(1);
                  },
                  dateFormat: (date, culture, localizer) => localizer.format(date, 'DD', culture), // Per i numeri nelle celle del mese (01, 02, etc.)
                  dayFormat: (date, culture, localizer) => localizer.format(date, 'DD', culture), // Usato anche per la vista Agenda se non specificato diversamente
                  dayHeaderFormat: (date, culture, localizer) => localizer.format(date, 'dddd D MMMM', culture), // Es. "lunedì 1 aprile" per intestazioni giornaliere
                }}
                // Inizio settimana da lunedì
                weekStartsOn={1}
                // Attributi di base per eventuali eventi futuri
                eventPropGetter={(event) => {
                  return {
                    style: {
                      color: 'white',
                      border: 'none',
                      borderRadius: 0,
                      backgroundColor: '#2986cc'
                    }
                  };
                }}
              />
            </div>
            
            {/* Toolbar sotto il calendario */}
            <div className="calendar-toolbar" style={{ 
              height: '50px', 
              backgroundColor: '#f8f8f8', 
              borderTop: '1px solid #dcdfe3',
              borderBottom: 'none',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0 15px',
              flex: '0 0 auto',
              marginTop: 'auto',
              position: 'sticky',
              bottom: 0,
              left: 0,
              width: '100%',
              boxSizing: 'border-box'
            }}>
              {/* Pulsanti azioni a sinistra */}
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <button style={{
                  margin: '0 8px 0 0',
                  padding: '6px 12px',
                  background: '#2986cc',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <span style={{ marginRight: '5px', fontSize: '14px' }}>+</span>
                  Nuovo
                </button>
                <button style={{
                  margin: '0 8px 0 0',
                  padding: '6px 12px',
                  background: 'white',
                  border: '1px solid #dcdfe3',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <span style={{ marginRight: '5px', fontSize: '14px' }}>↓</span>
                  Esporta
                </button>
                <button style={{
                  margin: '0 8px 0 0',
                  padding: '6px 12px',
                  background: 'white',
                  border: '1px solid #dcdfe3',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <span style={{ marginRight: '5px', fontSize: '14px' }}>⟳</span>
                  Aggiorna
                </button>
              </div>
              
              {/* Navigazione pagine a destra */}
              <div style={{ display: 'flex', alignItems: 'center', fontSize: '13px' }}>
                <span style={{ marginRight: '10px', color: '#666' }}>Pagina 1 di 1</span>
                <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #dcdfe3', borderRadius: '4px' }}>
                  <span style={{ padding: '4px 8px', color: '#888', cursor: 'pointer', borderRight: '1px solid #dcdfe3' }}>«</span>
                  <span style={{ padding: '4px 8px', color: '#444', cursor: 'pointer' }}>1</span>
                  <span style={{ padding: '4px 8px', color: '#888', cursor: 'pointer', borderLeft: '1px solid #dcdfe3' }}>»</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pannello destro - Dipendenti */}
        <div style={{ 
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
                <li 
                  key={emp.id} 
                  style={{ 
                    padding: '8px 10px',
                    marginBottom: '2px',
                    backgroundColor: 'white',
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '13px',
                    alignItems: 'center'
                  }}
                >
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
      
      {/* Dialog per aggiungere una location */}
      <div 
        style={{
          display: addLocationDialog.open ? 'flex' : 'none', 
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}
      >
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '20px',
          width: '400px',
          maxWidth: '90%',
          boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
        }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#333' }}>Aggiungi Location</h3>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#555' }}>Nome Location</label>
            <input 
              type="text" 
              value={newLocation.nome} 
              onChange={(e) => setNewLocation({...newLocation, nome: e.target.value})}
              style={{
                width: '100%',
                padding: '8px 10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            />
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#555' }}>Indirizzo</label>
            <input 
              type="text" 
              value={newLocation.indirizzo} 
              onChange={(e) => setNewLocation({...newLocation, indirizzo: e.target.value})}
              style={{
                width: '100%',
                padding: '8px 10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button 
              onClick={() => setAddLocationDialog({open: false, commessaId: null})}
              style={{
                padding: '8px 15px',
                background: '#fff',
                border: '1px solid #ddd',
                borderRadius: '4px',
                marginRight: '10px',
                cursor: 'pointer'
              }}
            >Annulla</button>
            <button 
              onClick={handleAddLocation}
              disabled={!newLocation.nome || addingLocation}
              style={{
                padding: '8px 15px',
                background: '#2986cc',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: !newLocation.nome || addingLocation ? 'not-allowed' : 'pointer',
                opacity: !newLocation.nome || addingLocation ? 0.7 : 1
              }}
            >
              {addingLocation ? 'Aggiunta in corso...' : 'Aggiungi'}
            </button>
          </div>
        </div>
      </div>
      
      {/* Dialog per aggiungere un task */}
      <div 
        style={{
          display: addTaskDialog.open ? 'flex' : 'none', 
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}
      >
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '20px',
          width: '400px',
          maxWidth: '90%',
          boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
        }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#333' }}>Aggiungi Task</h3>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#555' }}>Nome Task</label>
            <input 
              type="text" 
              value={newTask.nome} 
              onChange={(e) => setNewTask({...newTask, nome: e.target.value})}
              style={{
                width: '100%',
                padding: '8px 10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            />
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#555' }}>Descrizione</label>
            <textarea 
              value={newTask.descrizione} 
              onChange={(e) => setNewTask({...newTask, descrizione: e.target.value})}
              style={{
                width: '100%',
                padding: '8px 10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
                minHeight: '80px',
                resize: 'vertical'
              }}
            />
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#555' }}>Stato</label>
            <select 
              value={newTask.stato} 
              onChange={(e) => setNewTask({...newTask, stato: e.target.value})}
              style={{
                width: '100%',
                padding: '8px 10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
                backgroundColor: 'white'
              }}
            >
              <option value="attivo">Attivo</option>
              <option value="completato">Completato</option>
              <option value="sospeso">Sospeso</option>
            </select>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button 
              onClick={() => setAddTaskDialog({open: false, locationId: null})}
              style={{
                padding: '8px 15px',
                background: '#fff',
                border: '1px solid #ddd',
                borderRadius: '4px',
                marginRight: '10px',
                cursor: 'pointer'
              }}
            >Annulla</button>
            <button 
              onClick={handleAddTask}
              disabled={!newTask.nome || addingTask}
              style={{
                padding: '8px 15px',
                background: '#2986cc',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: !newTask.nome || addingTask ? 'not-allowed' : 'pointer',
                opacity: !newTask.nome || addingTask ? 0.7 : 1
              }}
            >
              {addingTask ? 'Aggiunta in corso...' : 'Aggiungi'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
