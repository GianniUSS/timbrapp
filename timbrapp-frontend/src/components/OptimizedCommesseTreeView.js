import React, { useState, useEffect, useCallback, memo } from 'react';
import { 
  Box, 
  Typography, 
  Checkbox, 
  IconButton, 
  Button, 
  Chip,
  CircularProgress,
  Skeleton,
  Tooltip
} from '@mui/material';
import { TreeView, TreeItem } from '@mui/lab';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import AddIcon from '@mui/icons-material/Add';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PeopleIcon from '@mui/icons-material/People';
import BuildIcon from '@mui/icons-material/Build';
import { FixedSizeList } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { getFromCache, saveToCache, isCacheValid } from '../utils/cacheUtils';

// --- PALETTE COLORI PER CATEGORIE ---
const CATEGORY_COLORS = [
  '#388e3c', // verde
  '#1976d2', // blu
  '#fbc02d', // giallo
  '#d32f2f', // rosso
  '#8e24aa', // viola
  '#ff9800', // arancione
  '#0097a7', // azzurro
  '#7b1fa2', // viola scuro
];

/**
 * Componente ottimizzato per visualizzare commesse e task in modalità virtualizzata
 */
const OptimizedCommesseTreeView = memo(({
  commesse,
  loading,
  error,
  selectedCommesse,
  expandedCommesse,
  onCommessaToggle,
  onCommessaExpand,
  onTaskToggle,
  onAddTask,
  onRetry
}) => {
  // Memorizza i commesse flattened per la virtualizzazione
  const [flattenedItems, setFlattenedItems] = useState([]);
  
  // Altezza stimata degli elementi per la virtualizzazione
  const ITEM_HEIGHT = 40;
  const TASK_ITEM_HEIGHT = 36;
  
  // Appiattisce la struttura gerarchica per la virtualizzazione
  useEffect(() => {
    if (!commesse || commesse.length === 0) {
      setFlattenedItems([]);
      return;
    }
    
    const items = [];
    commesse.forEach(commessa => {
      // Aggiungi la commessa
      items.push({
        id: `commessa-${commessa.id}`,
        type: 'commessa',
        data: commessa,
        level: 0,
        isExpanded: expandedCommesse.includes(commessa.id)
      });
      
      // Se la commessa è espansa, aggiungi i suoi task
      if (expandedCommesse.includes(commessa.id)) {
        if (commessa.tasks && commessa.tasks.length > 0) {
          commessa.tasks.forEach(task => {
            items.push({
              id: `task-${task.id}`,
              type: 'task',
              data: task,
              parentId: commessa.id,
              level: 1
            });
          });
        } else {
          items.push({
            id: `no-tasks-${commessa.id}`,
            type: 'no-tasks',
            parentId: commessa.id,
            level: 1
          });
        }
      }
    });
    
    setFlattenedItems(items);
  }, [commesse, expandedCommesse]);

  // Rendering dello stato di caricamento
  if (loading) {
    return (
      <Box sx={{ width: '100%' }}>
        {[1, 2, 3, 4, 5].map((_, index) => (
          <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1.5, px: 1 }}>
            <Skeleton variant="circular" width={24} height={24} sx={{ mr: 1 }} />
            <Skeleton variant="text" width="80%" height={24} />
          </Box>
        ))}
      </Box>
    );
  }

  // Rendering dello stato di errore
  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="error">{error}</Typography>
        <Button 
          variant="outlined" 
          color="primary" 
          size="small" 
          onClick={onRetry} 
          sx={{ mt: 2 }}
        >
          Riprova
        </Button>
      </Box>
    );
  }

  // Nessuna commessa disponibile
  if (!commesse || commesse.length === 0) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography>Nessuna commessa attiva disponibile</Typography>
      </Box>
    );
  }

  // Rendering dell'elemento della lista virtualizzata
  const renderRow = ({ index, style }) => {
    const item = flattenedItems[index];
    
    if (item.type === 'commessa') {
      const commessa = item.data;
      return (
        <Box
          key={item.id}
          style={{
            ...style,
            paddingLeft: item.level * 16,
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <Box 
            onClick={() => onCommessaExpand(commessa.id)} 
            sx={{ 
              cursor: 'pointer',
              mr: 1,
              display: 'flex',
              alignItems: 'center'
            }}
          >
            {item.isExpanded ? (
              <ExpandMoreIcon fontSize="small" />
            ) : (
              <ChevronRightIcon fontSize="small" />
            )}
          </Box>
          <Checkbox
            checked={selectedCommesse.includes(commessa.id)}
            onChange={() => onCommessaToggle(commessa.id)}
            onClick={(e) => e.stopPropagation()}
            size="small"
            sx={{ p: 0.5 }}
          />          <Typography
            variant="body2"
            sx={{
              fontWeight: 500,
              flexGrow: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {commessa.codice} - {commessa.descrizione}
          </Typography>
          
          {/* Badge stato commessa */}
          <Chip 
            label={commessa.stato} 
            size="small"
            color={
              commessa.stato === 'attiva' ? 'success' :
              commessa.stato === 'completata' ? 'default' : 
              commessa.stato === 'sospesa' ? 'warning' : 'error'
            }
            sx={{ 
              height: 20, 
              mr: 1,
              '& .MuiChip-label': { 
                px: 1, 
                fontSize: '0.7rem' 
              } 
            }}
          />
          
          {/* Icona date commessa */}
          {commessa.dataInizio && (
            <Tooltip title={
              `Periodo: ${new Date(commessa.dataInizio).toLocaleDateString('it-IT')} - 
               ${commessa.dataFine ? new Date(commessa.dataFine).toLocaleDateString('it-IT') : 'In corso'}`
            }>
              <CalendarTodayIcon fontSize="small" sx={{ mr: 1, fontSize: '1rem', color: 'text.secondary' }} />
            </Tooltip>
          )}
          
          <Box
            component="span"
            sx={{
              borderRadius: '50%',
              width: 16,
              height: 16,
              ml: 0.5,
              bgcolor: CATEGORY_COLORS[commessa.id % CATEGORY_COLORS.length] || '#388e3c'
            }}
          />
          <IconButton 
            size="small" 
            sx={{ ml: 0.5 }}
            onClick={(e) => {
              e.stopPropagation();
              onAddTask(commessa.id);
            }}
          >
            <AddIcon fontSize="small" />
          </IconButton>
        </Box>
      );
    } else if (item.type === 'task') {
      const task = item.data;
      return (
        <Box
          key={item.id}
          style={{
            ...style,
            paddingLeft: (item.level * 16) + 24,
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <Checkbox
            checked={selectedCommesse.includes(item.parentId)}
            onChange={() => onTaskToggle(task.id, item.parentId)}
            onClick={(e) => e.stopPropagation()}
            size="small"
            sx={{ p: 0.5 }}
          />          <Typography
            variant="body2"
            sx={{
              fontStyle: task.stato === 'completato' ? 'italic' : 'normal',
              textDecoration: task.stato === 'completato' ? 'line-through' : 'none',
              color: task.stato === 'completato' ? 'text.disabled' : 'text.primary',
              flexGrow: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {task.nome}
          </Typography>
            {/* Indicatori delle informazioni aggiuntive del task */}
          <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
            {task.durataPrevista && Number(task.durataPrevista) > 0 && (
              <Tooltip title={`Durata prevista: ${task.durataPrevista} ore`}>
                <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
                  <AccessTimeIcon sx={{ fontSize: '0.875rem', color: 'text.secondary' }} />
                  <Typography variant="caption" sx={{ ml: 0.2 }}>
                    {task.durataPrevista}h
                  </Typography>
                </Box>
              </Tooltip>
            )}
            
            {task.numeroRisorse && Number(task.numeroRisorse) > 1 && (
              <Tooltip title={`Risorse necessarie: ${task.numeroRisorse}`}>
                <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
                  <PeopleIcon sx={{ fontSize: '0.875rem', color: 'text.secondary' }} />
                  <Typography variant="caption" sx={{ ml: 0.2 }}>
                    {task.numeroRisorse}
                  </Typography>
                </Box>
              </Tooltip>
            )}
              {task.skills && (
              <Tooltip title={`Skills: ${Array.isArray(task.skills) ? task.skills.join(', ') : 
                typeof task.skills === 'string' ? task.skills : 
                typeof task.skills === 'object' ? JSON.stringify(task.skills) : 'N/A'}`}>
                <BuildIcon sx={{ fontSize: '0.875rem', color: 'text.secondary', mr: 1 }} />
              </Tooltip>
            )}
          </Box>
          
          <Chip 
            label={task.stato} 
            size="small"
            color={
              task.stato === 'attivo' ? 'primary' :
              task.stato === 'completato' ? 'success' : 'default'
            }
            sx={{ 
              height: 20, 
              '& .MuiChip-label': { 
                px: 1, 
                fontSize: '0.7rem' 
              } 
            }}
          />
        </Box>
      );
    } else if (item.type === 'no-tasks') {
      return (
        <Box
          key={item.id}
          style={{
            ...style,
            paddingLeft: (item.level * 16) + 24
          }}
        >
          <Typography 
            variant="body2" 
            sx={{ 
              color: 'text.secondary', 
              fontStyle: 'italic' 
            }}
          >
            Nessun task disponibile
          </Typography>
        </Box>
      );
    }
    
    return null;
  };

  // Calcola l'altezza totale dell'elenco virtualizzato
  const getListHeight = () => {
    let totalHeight = 0;
    flattenedItems.forEach(item => {
      if (item.type === 'task' || item.type === 'no-tasks') {
        totalHeight += TASK_ITEM_HEIGHT;
      } else {
        totalHeight += ITEM_HEIGHT;
      }
    });
    return totalHeight;
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          Seleziona commesse:
        </Typography>
        <Button 
          size="small" 
          variant="outlined"
          onClick={() => {
            if (selectedCommesse.length === commesse.length) {
              onCommessaToggle('deselect-all');
            } else {
              onCommessaToggle('select-all');
            }
          }}
        >
          {selectedCommesse.length === commesse.length ? 'Deseleziona tutte' : 'Seleziona tutte'}
        </Button>
      </Box>
      
      <Box sx={{ height: Math.min(getListHeight(), 400), width: '100%' }}>
        <AutoSizer>
          {({ height, width }) => (
            <FixedSizeList
              height={height}
              width={width}
              itemCount={flattenedItems.length}
              itemSize={ITEM_HEIGHT}
              overscanCount={5}
            >
              {renderRow}
            </FixedSizeList>
          )}
        </AutoSizer>
      </Box>
    </Box>
  );
});

export default OptimizedCommesseTreeView;
