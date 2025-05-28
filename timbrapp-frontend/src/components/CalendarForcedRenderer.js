import React, { useEffect } from 'react';

/**
 * CalendarForcedRenderer - Componente che forza il rendering del calendario
 * Si attiva automaticamente all'avvio e riapplica gli stili necessari
 */
const CalendarForcedRenderer = ({ calendarRef }) => {
  useEffect(() => {
    // Funzione per forzare la visibilità del calendario
    const forceCalendarVisibility = () => {
      console.log('🔧 Forzatura visibilità calendario in corso...');
      
      // Seleziona tutti gli elementi del calendario che potrebbero essere invisibili
      const calendarElements = document.querySelectorAll(
        '.fc, .fc-view-harness, .fc-view, .fc-scrollgrid, ' +
        '.fc-daygrid-body, .fc-scrollgrid-sync-table, .fc-col-header, ' +
        '.fc-daygrid-body table, .fc-scrollgrid-sync-table tbody'
      );
      
      // Applica stili forzati a ciascun elemento
      calendarElements.forEach(el => {
        if (el) {
          el.style.setProperty('visibility', 'visible', 'important');
          el.style.setProperty('opacity', '1', 'important');
          
          // Determina il display appropriato in base al tag
          const display = 
            el.tagName === 'TABLE' ? 'table' : 
            el.tagName === 'TR' ? 'table-row' :
            el.tagName === 'TD' || el.tagName === 'TH' ? 'table-cell' : 
            'block';
            
          el.style.setProperty('display', display, 'important');
          
          // Imposta altezze minime per garantire spazio sufficiente
          if (el.classList.contains('fc-view-harness') || 
              el.classList.contains('fc-daygrid-body')) {
            el.style.setProperty('min-height', '500px', 'important');
          }
        }
      });
      
      // Aggiorna le dimensioni tramite API se disponibile
      if (calendarRef?.current) {
        try {
          const calendarApi = calendarRef.current.getApi();
          calendarApi.updateSize();
          console.log('✅ Dimensioni calendario aggiornate');
        } catch (error) {
          console.error('Errore nell\'aggiornamento dimensioni:', error);
        }
      }
    };
    
    // Esegui la forzatura più volte con ritardi crescenti
    forceCalendarVisibility(); // Immediato
    
    const timeouts = [
      setTimeout(forceCalendarVisibility, 200),
      setTimeout(forceCalendarVisibility, 500),
      setTimeout(forceCalendarVisibility, 1000),
      setTimeout(forceCalendarVisibility, 2000)
    ];
    
    // Pulisci i timeout al dismount
    return () => {
      timeouts.forEach(t => clearTimeout(t));
    };
  }, [calendarRef]);
  
  // Questo componente non renderizza nulla visualmente
  return null;
};

export default CalendarForcedRenderer;
