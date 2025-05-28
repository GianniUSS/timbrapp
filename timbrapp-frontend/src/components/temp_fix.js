// Fix per la sezione calendario
const renderGiorniMese = () => {
  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 1.5
      }}>
        <Typography variant="subtitle1" sx={{ 
          fontWeight: 'medium',
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          <CalendarTodayIcon fontSize="small" color="primary" />
          Disponibilità per {format(selectedMonth, 'MMMM yyyy', { locale: it })}
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Pagina {currentPage + 1} di {totalPages}
          </Typography>
          <ButtonGroup size="small" aria-label="Naviga tra i giorni">
            <Button 
              onClick={handlePrevPage} 
              disabled={currentPage === 0}
              sx={{
                borderRadius: '8px 0 0 8px',
                minWidth: '36px',
                p: 0.5
              }}
            >
              <ArrowBackIcon fontSize="small" />
            </Button>
            <Button 
              onClick={handleNextPage} 
              disabled={currentPage === totalPages - 1 || totalPages === 0}
              sx={{
                borderRadius: '0 8px 8px 0',
                minWidth: '36px',
                p: 0.5
              }}
            >
              <ArrowRightIcon fontSize="small" />
            </Button>
          </ButtonGroup>
        </Box>
      </Box>
      <Box sx={{ 
        display: 'flex', 
        flexWrap: 'nowrap', 
        gap: 1,
        overflow: 'hidden',
        pb: 1,
        px: 0.5,
        borderRadius: '12px',
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'rgba(0,0,0,0.01)',
        position: 'relative',
        height: '166px'
      }}>
        {visibleDays.map(day => {
          const isToday = isSameDay(day, new Date());
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          
          // Calcola quanti dipendenti sono disponibili per questa data
          const disponibili = personnel.filter(p => isDipendenteDisponibile(p.id, format(day, 'yyyy-MM-dd'))).length;
          const percentualeDisponibili = personnel.length > 0 ? (disponibili / personnel.length) * 100 : 0;
          
          return (
            <Box
              key={format(day, 'yyyy-MM-dd')}
              sx={{
                minWidth: '100px',
                p: 1.5,
                m: 0.5,
                border: '1px solid',
                borderColor: isSelected ? 'primary.main' : isToday ? 'primary.light' : 'divider',
                borderRadius: 2,
                bgcolor: isSelected ? 'primary.lighter' : isToday ? 'rgba(25, 118, 210, 0.04)' : 'background.paper',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                boxShadow: isSelected ? '0 4px 12px rgba(25, 118, 210, 0.15)' : isToday ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
                '&:hover': {
                  boxShadow: '0 6px 12px rgba(0,0,0,0.1)',
                  transform: 'translateY(-4px)',
                  borderColor: 'primary.main',
                  zIndex: 1
                },
                '&::after': isToday ? {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: '0',
                  height: '0',
                  borderStyle: 'solid',
                  borderWidth: '0 12px 12px 0',
                  borderColor: 'transparent primary.main transparent transparent',
                } : {}
              }}
              onClick={() => setSelectedDate(day)}
            >
              <Typography 
                variant="caption" 
                display="block" 
                color={isSelected ? 'primary.main' : 'text.secondary'} 
                sx={{ 
                  fontWeight: 'bold', 
                  textTransform: 'uppercase',
                  mb: 0.5
                }}
              >
                {format(day, 'EEEE', { locale: it }).substring(0, 3)}
              </Typography>
              <Typography 
                variant="h5" 
                sx={{ 
                  fontWeight: isSelected || isToday ? 'bold' : 'medium', 
                  color: isSelected ? 'primary.main' : 'inherit',
                  mb: 1
                }}
              >
                {format(day, 'dd')}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 0.5 }}>
                <LinearProgress
                  variant="determinate"
                  value={percentualeDisponibili}
                  color={percentualeDisponibili > 70 ? 'success' : percentualeDisponibili > 30 ? 'warning' : 'error'}
                  sx={{ 
                    width: '100%', 
                    my: 0.5, 
                    height: 6, 
                    borderRadius: 3,
                    '& .MuiLinearProgress-bar': {
                      transition: 'transform 1s cubic-bezier(0.4, 0, 0.2, 1)'
                    }
                  }}
                />
              </Box>
              <Typography 
                variant="caption" 
                display="block" 
                sx={{ 
                  fontWeight: 'medium',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 0.5
                }}
              >
                <Box 
                  component="span" 
                  sx={{ 
                    color: percentualeDisponibili > 70 ? 'success.main' : percentualeDisponibili > 30 ? 'warning.main' : 'error.main', 
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  {disponibili}
                </Box>
                <Box component="span">/{personnel.length}</Box>
                <Box 
                  component="span" 
                  sx={{ 
                    fontSize: '0.7rem', 
                    bgcolor: percentualeDisponibili > 70 ? 'success.lighter' : percentualeDisponibili > 30 ? 'warning.lighter' : 'error.lighter',
                    color: percentualeDisponibili > 70 ? 'success.darker' : percentualeDisponibili > 30 ? 'warning.darker' : 'error.darker',
                    px: 0.8,
                    py: 0.2,
                    borderRadius: '4px',
                    ml: 0.5
                  }}
                >
                  disponibili
                </Box>
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

// Aggiungere al componente
const [currentPage, setCurrentPage] = useState(0);
const giorniPerPagina = 17;
const totalPages = Math.ceil(daysInMonth.length / giorniPerPagina);

// Giorni da visualizzare nella pagina corrente
const visibleDays = daysInMonth.slice(
  currentPage * giorniPerPagina, 
  (currentPage + 1) * giorniPerPagina
);

// Funzioni per la navigazione tra le pagine dei giorni
const handleNextPage = () => {
  setCurrentPage(prev => Math.min(prev + 1, totalPages - 1));
};

const handlePrevPage = () => {
  setCurrentPage(prev => Math.max(prev - 1, 0));
};
