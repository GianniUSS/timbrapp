import React from 'react';

// Funzione per il rendering personalizzato del contenuto degli eventi
export const renderEventContent = (eventInfo) => {
  try {
    if (!eventInfo || !eventInfo.event) return null;
    
    const event = eventInfo.event;
    const title = event.title || '';
    const timeText = event.start ? event.start.toLocaleTimeString('it-IT', {hour: '2-digit', minute: '2-digit'}) : '';
    const commessaText = event.extendedProps?.commessa?.codice || '';
    
    return (
      <div style={{padding: '2px', overflow: 'hidden'}}>
        <div style={{fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis'}}>{title}</div>
        {timeText && (
          <div style={{fontSize: '12px', color: '#555', overflow: 'hidden', textOverflow: 'ellipsis'}}>{timeText}</div>
        )}
        {commessaText && (
          <div style={{fontSize: '11px', color: '#888', overflow: 'hidden', textOverflow: 'ellipsis'}}>
            {commessaText}
          </div>
        )}
      </div>
    );
  } catch (error) {
    console.error('Errore nel rendering dell\'evento:', error);
    return <div>Evento</div>;
  }
};
