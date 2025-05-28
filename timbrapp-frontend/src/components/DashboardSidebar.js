import React from 'react';
import {
  Box,
  Toolbar,
  Typography,
  IconButton,
  Divider,
  TextField,
  Button,
  CircularProgress,
} from '@mui/material';
import Drawer from '@mui/material/Drawer';
import TreeView from '@mui/lab/TreeView';
import TreeItem from '@mui/lab/TreeItem';
import Checkbox from '@mui/material/Checkbox';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import RefreshIcon from '@mui/icons-material/Refresh';
import Chip from '@mui/material/Chip';

// CATEGORY_COLORS va importato o passato come prop

const DashboardSidebar = ({
  isMobile,
  drawerOpen,
  setDrawerOpen,
  searchCommesse,
  setSearchCommesse,
  fetchCommesse,
  commesseLoading,
  commesseError,
  commesseFiltrate,
  selectedCommesse,
  handleCommessaToggle,
  expandedCommesse,
  handleCommessaExpand,
  expandedLocations,
  handleLocationExpand,
  handleOpenAddTaskDialog,
  handleDeleteLocation,
  handleDeleteTask,
  handleOpenAddLocationDialog,
  CATEGORY_COLORS
}) => {
  return (
    <Drawer
      variant={isMobile ? 'temporary' : 'persistent'}
      anchor="left"
      open={drawerOpen}
      onClose={() => setDrawerOpen(false)}
      sx={{
        width: { xs: 250, sm: 270, md: 280 },
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: { xs: 250, sm: 270, md: 280 },
          boxSizing: 'border-box',
          borderRight: '1px solid rgba(0, 0, 0, 0.12)',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          position: 'relative',
        },
      }}
    >
      <Toolbar>
        <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
          Dashboard
        </Typography>
        <IconButton>
          <MoreVertIcon />
        </IconButton>
      </Toolbar>
      <Divider />
      <Box sx={{ p: 2 }}>
        <TextField
          variant="outlined"
          placeholder="Cerca commesse..."
          value={searchCommesse}
          onChange={(e) => setSearchCommesse(e.target.value)}
          size="small"
          fullWidth
          sx={{ mb: 2 }}
        />
        <Button
          variant="contained"
          color="primary"
          onClick={fetchCommesse}
          startIcon={<RefreshIcon />}
          fullWidth
        >
          Aggiorna
        </Button>
      </Box>
      <Divider />
      <Box sx={{
        overflowY: 'auto',
        overflowX: 'hidden',
        flexGrow: 1,
        p: 1,
        maxHeight: 'calc(100vh - 200px)',
        width: '100%'
      }}>
        {commesseLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress size={30} />
          </Box>
        ) : commesseError ? (
          <Box sx={{ p: 2 }}>
            <Typography color="error">{commesseError}</Typography>
            <Button
              variant="outlined"
              color="primary"
              size="small"
              onClick={fetchCommesse}
              sx={{ mt: 2 }}
            >
              Riprova
            </Button>
          </Box>
        ) : (
          <TreeView
            defaultCollapseIcon={<span>-</span>}
            defaultExpandIcon={<span>+</span>}
            sx={{
              flexGrow: 1,
              width: '100%',
              overflowX: 'hidden',
              '& .MuiTreeItem-content': {
                width: '100%',
                flexWrap: 'wrap',
                paddingRight: 1,
                overflow: 'hidden'
              },
              '& .MuiTreeItem-label': {
                width: '100%',
                maxWidth: '100%',
                overflow: 'hidden'
              },
              '& .MuiTreeItem-root': {
                width: '100%',
                maxWidth: '100%'
              },
              '& .MuiCollapse-root': {
                width: '100%'
              }
            }}
            expanded={[
              ...expandedCommesse.map(id => `commessa-${id}`),
              ...expandedLocations.map(id => `location-${id}`)
            ]}
          >
            {commesseFiltrate.map((commessa) => (
              <TreeItem
                key={`commessa-${commessa.id}`}
                nodeId={`commessa-${commessa.id}`}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', p: 0.5 }}>
                    <Checkbox
                      checked={selectedCommesse.includes(commessa.id)}
                      onChange={() => handleCommessaToggle(commessa.id)}
                      onClick={(e) => e.stopPropagation()}
                      size="small"
                      sx={{ p: 0.5 }}
                    />
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 500,
                        flexGrow: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        fontSize: { xs: '0.8rem', sm: '0.875rem' }
                      }}
                    >
                      {commessa.codice} - {commessa.descrizione || ''}
                    </Typography>                    <Box
                      component="span"
                      sx={{
                        borderRadius: '50%',
                        width: 16,
                        height: 16,
                        ml: 0.5,
                        bgcolor: (CATEGORY_COLORS && commessa.id) ? 
                          CATEGORY_COLORS[commessa.id % (CATEGORY_COLORS.length || 1)] || '#388e3c' : '#388e3c'
                      }}
                    />
                    <IconButton
                      size="small"
                      sx={{ ml: 0.5 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenAddTaskDialog(commessa.id);
                      }}
                    >
                      <AddIcon fontSize="small" />
                    </IconButton>
                  </Box>
                }
                onClick={() => handleCommessaExpand(commessa.id)}
              >
                {/* ...locations e tasks... */}
              </TreeItem>
            ))}
          </TreeView>
        )}
      </Box>
      <Divider />
      <Box sx={{ p: 2 }}>
        <Button
          variant="contained"
          color="primary"
          fullWidth
          startIcon={<AddIcon />}
          onClick={() => handleOpenAddLocationDialog(null)}
        >
          Aggiungi Location
        </Button>
      </Box>
    </Drawer>
  );
};

export default DashboardSidebar;
