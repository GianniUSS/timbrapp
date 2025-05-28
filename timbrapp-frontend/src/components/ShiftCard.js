import React from 'react';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import WorkIcon from '@mui/icons-material/Work';

function ShiftCard({ shiftInfo, label }) {
  return (
    <Paper 
      elevation={2} 
      sx={{ 
        p: { xs: 2.5, sm: 3.5 },
        mb: { xs: 2.5, sm: 3 },
        borderRadius: 2,
        boxShadow: '0 2px 10px rgba(0,0,0,0.08)'
      }}
    >
      <Typography variant="h5" component="h2" sx={{ 
        mb: { xs: 2, sm: 3 }, 
        fontWeight: 'bold',
        fontSize: { xs: '1.25rem', sm: '1.5rem' }
      }}>
        {label || 'Turno di oggi'}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 1.8, sm: 2.2 } }}>
        <AccessTimeIcon sx={{ mr: { xs: 1.5, sm: 2 }, color: 'text.secondary', fontSize: { xs: '1.2rem', sm: '1.5rem' } }} />
        <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
          {shiftInfo.hours}
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 1.8, sm: 2.2 } }}>
        <LocationOnIcon sx={{ mr: { xs: 1.5, sm: 2 }, color: 'text.secondary', fontSize: { xs: '1.2rem', sm: '1.5rem' } }} />
        <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
          {shiftInfo.location}
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 1.8, sm: 2.2 } }}>
        <WorkIcon sx={{ mr: { xs: 1.5, sm: 2 }, color: 'text.secondary', fontSize: { xs: '1.2rem', sm: '1.5rem' } }} />
        <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
          {shiftInfo.department}
        </Typography>
      </Box>
      {shiftInfo.commessa && (
        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1.5 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 500, color: 'text.secondary', mr: 1 }}>
            Commessa:
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 600 }}>
            {shiftInfo.commessa.codice} - {shiftInfo.commessa.descrizione}
          </Typography>
        </Box>
      )}
    </Paper>
  );
}

export default ShiftCard;
