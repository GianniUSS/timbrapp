import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Collapse from '@mui/material/Collapse';
import ListItemText from '@mui/material/ListItemText';
import Checkbox from '@mui/material/Checkbox';
import Button from '@mui/material/Button';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import FolderIcon from '@mui/icons-material/FolderOutlined';
import AddIcon from '@mui/icons-material/Add';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';

/**
 * Tree-view minimale a 3 livelli: Commesse > Location > Task
 * Props:
 * - data: [{ id, codice, descrizione, locations: [{ id, nome, tasks: [{ id, nome }] }] }]
 * - selectedCommesse: array degli ID delle commesse selezionate
 * - onSelect: funzione chiamata con { type, id } quando selezioni commessa/location/task
 * - onAddLocation: funzione chiamata con l'id della commessa quando si vuole aggiungere una location
 * - onAddTask: funzione chiamata con l'id della location quando si vuole aggiungere un task
 * - onToggleCommessa: funzione chiamata con l'id della commessa quando viene selezionata/deselezionata
 */

export default function CommesseLocationTaskTreeView({ 
  data = [], 
  selectedCommesse = [], 
  onSelect, 
  onAddLocation, 
  onAddTask,
  onToggleCommessa
}) {
  const [expandedCommesse, setExpandedCommesse] = useState([]);
  const [expandedLocations, setExpandedLocations] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  // Utilizza direttamente i dati dal database
  useEffect(() => {
    // Log dei dati ricevuti per verificare la struttura
    console.log('Dati commesse ricevuti nella treeview:', data);
    
    // Espandi automaticamente tutte le commesse all'avvio per mostrare le location
    if (data && data.length > 0) {
      setExpandedCommesse(data.map(c => c.id));
      
      // Verifica che la struttura dati rispetti il formato previsto
      const hasValidStructure = data.every(commessa => 
        commessa.id && 
        commessa.codice && 
        commessa.descrizione &&
        Array.isArray(commessa.locations)
      );
      
      if (!hasValidStructure) {
        console.warn('La struttura dei dati delle commesse non è valida:', data);
      } else {
        const totalLocations = data.reduce((count, c) => count + (c.locations ? c.locations.length : 0), 0);
        console.log('Numero di location trovate:', totalLocations);
        
        if (totalLocations === 0) {
          console.warn('Non sono state trovate location nelle commesse');
        }
        
        // Conta il numero totale di task
        const taskCount = data.reduce((count, c) => {
          return count + c.locations.reduce((locCount, loc) => {
            return locCount + (loc.tasks ? loc.tasks.length : 0);
          }, 0);
        }, 0);
        
        console.log('Numero di task trovati:', taskCount);
      }
    }
  }, [data]);

  const handleCommessaExpand = (id) => {
    setExpandedCommesse(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleLocationExpand = (id) => {
    setExpandedLocations(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };
  
  // Funzione per formattare una data in formato italiano
  const formatDateIt = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date) ? 
      date.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '';
  };
    
  const handleSelect = (type, id) => {
    const newSelection = { type, id };
    console.log('Selezione nella tree-view:', newSelection);
    setSelectedItem(newSelection);
    if (onSelect) onSelect(newSelection);
  };
  
  // Gestione separata per i checkbox delle commesse
  const handleCommessaCheckboxToggle = (event, commessaId) => {
    // Ferma la propagazione per evitare che l'evento raggiunga anche la row
    event.stopPropagation();
    
    if (onToggleCommessa) {
      onToggleCommessa(commessaId);
    }
  };
  
  // Espandi automaticamente le location quando viene espansa una commessa
  useEffect(() => {
    if (data && data.length > 0) {
      // Per ogni commessa espansa, espandi automaticamente le sue location
      const locationsToExpand = [];
      data.forEach(commessa => {
        if (expandedCommesse.includes(commessa.id) && commessa.locations && commessa.locations.length > 0) {
          commessa.locations.forEach(location => {
            locationsToExpand.push(location.id);
          });
        }
      });
        // Aggiorna le location espanse solo se ci sono nuove location da espandere
      if (locationsToExpand.length > 0) {
        setExpandedLocations(prev => {
          const newExpanded = [...prev];
          locationsToExpand.forEach(id => {
            if (!newExpanded.includes(id)) {
              newExpanded.push(id);
            }
          });
          return newExpanded;
        });
      }
    }
  }, [data, expandedCommesse]);
  
  return (
    <Box sx={{ width: '100%', mt: 1 }} className="commesse-treeview">
      {/* Pulsanti di azione rapida */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        mb: 1,
        px: 1,
        py: 0.5,
        borderBottom: '1px solid #eee'
      }}>
        <Box>
          <Button
            size="small"
            variant="text"
            sx={{ fontSize: '0.75rem', px: 1 }}
            onClick={() => onToggleCommessa && onToggleCommessa('select-all')}
          >
            Seleziona tutto
          </Button>
          <Button
            size="small"
            variant="text"
            sx={{ fontSize: '0.75rem', px: 1 }}
            onClick={() => onToggleCommessa && onToggleCommessa('deselect-all')}
          >
            Deseleziona tutto
          </Button>
        </Box>
        <Box>
          <Button
            size="small"
            variant="text"
            color="primary"
            sx={{ fontSize: '0.75rem', px: 1 }}
            onClick={() => {
              // Espandi tutto
              if (data && data.length > 0) {
                setExpandedCommesse(data.map(c => c.id));
                const allLocations = data.reduce((acc, commessa) => {
                  if (commessa.locations && commessa.locations.length > 0) {
                    return [...acc, ...commessa.locations.map(l => l.id)];
                  }
                  return acc;
                }, []);
                setExpandedLocations(allLocations);
              }
            }}
          >
            Espandi tutto
          </Button>
        </Box>
      </Box>
      
      {data && data.length > 0 ? (
        data.map(commessa => (          <Box key={commessa.id} sx={{ mb: 0.5, borderRadius: 0 }}>
          <Box 
            sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', py: 0.5, pl: 0.5 }}
            className={`commessa-item ${selectedItem && selectedItem.type === 'commessa' && selectedItem.id === commessa.id ? 'selected' : ''}`}
          >
            <IconButton size="small" sx={{ p: 0.5 }} onClick={() => handleCommessaExpand(commessa.id)}>
              {expandedCommesse.includes(commessa.id) ? <ExpandMoreIcon fontSize="small" /> : <ChevronRightIcon fontSize="small" />}
            </IconButton>              <Checkbox 
              size="small" 
              sx={{ p: 0.5 }} 
              checked={selectedCommesse.includes(commessa.id)}
              onClick={(e) => handleCommessaCheckboxToggle(e, commessa.id)} 
            />
            <Typography 
              variant="body2" 
              sx={{ fontWeight: 500, fontSize: '0.85rem', cursor: 'pointer' }}
              onClick={() => handleSelect('commessa', commessa.id)}
            >
              {commessa.codice} - {commessa.descrizione}            </Typography>
            <IconButton 
              size="small" 
              sx={{ p: 0.5, ml: 'auto', color: '#1976d2' }} 
              onClick={() => onAddLocation && onAddLocation(commessa.id)}
            >
              <AddIcon fontSize="small" />
            </IconButton>
          </Box>
          
          {/* Periodo della commessa */}
          <Box sx={{ pl: 5, fontSize: '0.75rem', color: 'text.secondary', mb: 0.5, display: 'flex', alignItems: 'center' }}>
            <CalendarTodayIcon sx={{ fontSize: '0.9rem', mr: 0.5 }} />
            <Typography variant="caption">
              {commessa.dataInizio ? 
                `Periodo: ${formatDateIt(commessa.dataInizio)} - ${commessa.dataFine ? formatDateIt(commessa.dataFine) : 'In corso'}` : 
                'Nessuna data definita'}
            </Typography>
          </Box>
          
          <Collapse in={expandedCommesse.includes(commessa.id)} timeout="auto" unmountOnExit>{commessa.locations && commessa.locations.length > 0 ? commessa.locations.map(location => (              <Box key={location.id} sx={{ pl: 3, borderTop: '1px solid #f5f5f5' }}>
                <Box 
                  sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', py: 0.5 }}
                  className={`location-item ${selectedItem && selectedItem.type === 'location' && selectedItem.id === location.id ? 'selected' : ''}`}
                >
                  <IconButton size="small" sx={{ p: 0.5 }} onClick={() => handleLocationExpand(location.id)}>
                    {expandedLocations.includes(location.id) ? <ExpandMoreIcon fontSize="small" /> : <ChevronRightIcon fontSize="small" />}
                  </IconButton>                  <Checkbox 
                    size="small" 
                    sx={{ p: 0.5 }} 
                    checked={selectedItem && selectedItem.type === 'location' && selectedItem.id === location.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelect('location', location.id);
                    }} 
                  />
                  <Typography 
                    variant="body2" 
                    sx={{ fontSize: '0.85rem', cursor: 'pointer' }}
                    onClick={() => handleSelect('location', location.id)}
                  >
                    {location.nome}
                  </Typography>
                  <IconButton 
                    size="small" 
                    sx={{ p: 0.5, ml: 'auto', color: '#1976d2' }} 
                    onClick={() => onAddTask && onAddTask(location.id)}
                  >
                    <AddIcon fontSize="small" />
                  </IconButton>
                </Box>
                <Collapse in={expandedLocations.includes(location.id)} timeout="auto" unmountOnExit>                  {location.tasks && location.tasks.length > 0 ? location.tasks.map(task => (
                    <Box 
                      key={task.id} 
                      sx={{ pl: 3, display: 'flex', alignItems: 'center', py: 0.5 }}
                      className={`task-item ${selectedItem && selectedItem.type === 'task' && selectedItem.id === task.id ? 'selected' : ''}`}
                    >                      <Checkbox 
                        size="small" 
                        sx={{ p: 0.5, ml: 1.5 }}
                        checked={selectedItem && selectedItem.type === 'task' && selectedItem.id === task.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelect('task', task.id);
                        }} 
                      />
                      <Typography 
                        variant="body2" 
                        sx={{ fontSize: '0.85rem', cursor: 'pointer' }}
                        onClick={() => handleSelect('task', task.id)}
                      >
                        {task.nome}
                      </Typography>
                    </Box>
                  )) : (
                    <Typography variant="body2" sx={{ pl: 5, py: 0.5, color: 'text.secondary', fontStyle: 'italic', fontSize: '0.8rem' }}>
                      Nessun task
                    </Typography>
                  )}
                </Collapse>
              </Box>
            )) : (
              <Box sx={{ pl: 5, py: 0.5, display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic', fontSize: '0.8rem' }}>
                  Nessuna location
                </Typography>
                <IconButton 
                  size="small" 
                  sx={{ p: 0.5, ml: 1, color: '#1976d2' }} 
                  onClick={() => onAddLocation && onAddLocation(commessa.id)}
                >
                  <AddIcon fontSize="small" />
                </IconButton>
              </Box>
            )}
          </Collapse>
          </Box>
        ))
      ) : (
        <Typography variant="body2" sx={{ pl: 2, py: 1, color: 'text.secondary', fontStyle: 'italic' }}>
          Nessuna commessa disponibile nel database
        </Typography>
      )}
    </Box>
  );
}
