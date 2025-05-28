import React from 'react';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';

function TimeEntriesSummary({ getTodayEntryByType }) {
  return (
    <Paper elevation={1} sx={{ 
      p: { xs: 2, sm: 2.5 }, 
      mb: { xs: 2, sm: 2.5 }, 
      borderRadius: 2 
    }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        py: { xs: 1, sm: 1.25 }
      }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', fontSize: { xs: '0.875rem', sm: '1rem' } }}>
          Entrata
        </Typography>
        <Typography variant="subtitle1" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
          {getTodayEntryByType('start')}
        </Typography>
      </Box>
      <Divider />
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        py: { xs: 1, sm: 1.25 }
      }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', fontSize: { xs: '0.875rem', sm: '1rem' } }}>
          Uscita
        </Typography>
        <Typography variant="subtitle1" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
          {getTodayEntryByType('end')}
        </Typography>
      </Box>
      <Divider />
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        py: { xs: 1, sm: 1.25 }
      }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', fontSize: { xs: '0.875rem', sm: '1rem' } }}>
          Break In
        </Typography>
        <Typography variant="subtitle1" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
          {getTodayEntryByType('break_start')}
        </Typography>
      </Box>
      <Divider />
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        py: { xs: 1, sm: 1.25 }
      }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', fontSize: { xs: '0.875rem', sm: '1rem' } }}>
          Break Out
        </Typography>
        <Typography variant="subtitle1" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
          {getTodayEntryByType('break_end')}
        </Typography>
      </Box>
    </Paper>
  );
}

export default TimeEntriesSummary;
