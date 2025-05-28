// src/components/LocationMapView.js
import React, { useEffect, useState, useRef } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import LocationOnIcon from '@mui/icons-material/LocationOn';

/**
 * Componente per visualizzare una mappa con le location di una commessa
 * Utilizza Leaflet per il rendering della mappa
 */
function LocationMapView({ locations = [], height = 300 }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  // Carica dinamicamente Leaflet solo quando il componente è montato
  useEffect(() => {
    // Funzione per caricare gli script di Leaflet
    const loadLeaflet = async () => {
      try {
        // Verifica se Leaflet è già stato caricato
        if (window.L) {
          setLeafletLoaded(true);
          return;
        }

        // Carica il CSS di Leaflet
        const linkElement = document.createElement('link');
        linkElement.rel = 'stylesheet';
        linkElement.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        linkElement.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
        linkElement.crossOrigin = '';
        document.head.appendChild(linkElement);

        // Carica lo script di Leaflet
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
        script.crossOrigin = '';
        script.async = true;
        
        // Attendi il caricamento dello script
        const loadPromise = new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
        });
        
        document.body.appendChild(script);
        await loadPromise;
        
        setLeafletLoaded(true);
      } catch (err) {
        console.error('Errore nel caricamento di Leaflet:', err);
        setError('Impossibile caricare la mappa. Verifica la tua connessione internet.');
        setLoading(false);
      }
    };

    loadLeaflet();
  }, []);

  // Inizializza e aggiorna la mappa quando i dati delle location cambiano
  useEffect(() => {
    if (!leafletLoaded) return;
    
    const initMap = () => {
      try {
        setLoading(true);
        
        // Pulisci mappa precedente se esiste
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
          markersRef.current = [];
        }
        
        // Crea nuova mappa
        const L = window.L;
        mapInstanceRef.current = L.map(mapRef.current).setView([41.9028, 12.4964], 5); // Default su Italia
        
        // Aggiungi layer OpenStreetMap
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(mapInstanceRef.current);
        
        // Aggiungi marker per ogni location con coordinate valide
        const validLocations = locations.filter(loc => 
          loc && loc.lat && loc.lng && 
          !isNaN(parseFloat(loc.lat)) && 
          !isNaN(parseFloat(loc.lng))
        );
        
        if (validLocations.length === 0) {
          setError('Nessuna location con coordinate valide da visualizzare sulla mappa.');
          setLoading(false);
          return;
        }
        
        const bounds = L.latLngBounds();
        
        validLocations.forEach(loc => {
          const lat = parseFloat(loc.lat);
          const lng = parseFloat(loc.lng);
          
          const marker = L.marker([lat, lng])
            .addTo(mapInstanceRef.current)
            .bindPopup(`<b>${loc.nome}</b><br>${loc.indirizzo || 'Nessun indirizzo'}`);
          
          markersRef.current.push(marker);
          bounds.extend([lat, lng]);
        });
        
        // Centra la mappa per mostrare tutti i marker
        if (validLocations.length > 0) {
          mapInstanceRef.current.fitBounds(bounds, {
            padding: [30, 30],
            maxZoom: 13
          });
        }
        
        setError(null);
      } catch (err) {
        console.error('Errore nell\'inizializzazione della mappa:', err);
        setError('Errore nell\'inizializzazione della mappa.');
      } finally {
        setLoading(false);
      }
    };
    
    // Inizializza la mappa con un breve ritardo per assicurarsi che il container sia renderizzato
    const timer = setTimeout(() => {
      if (mapRef.current) {
        initMap();
      }
    }, 100);
    
    return () => {
      clearTimeout(timer);
      // Pulisci mappa quando il componente viene smontato
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [locations, leafletLoaded]);

  return (
    <Paper 
      elevation={2} 
      sx={{ 
        width: '100%', 
        height: `${height}px`, 
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 1
      }}
    >
      {loading && (
        <Box 
          sx={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            backgroundColor: 'rgba(255,255,255,0.7)',
            zIndex: 1000
          }}
        >
          <CircularProgress />
        </Box>
      )}
      
      {error && (
        <Box 
          sx={{ 
            position: 'absolute', 
            top: 10, 
            left: 10, 
            right: 10, 
            zIndex: 1000
          }}
        >
          <Alert severity="error">{error}</Alert>
        </Box>
      )}
      
      {!leafletLoaded && !loading && !error && (
        <Box 
          sx={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            backgroundColor: '#f5f5f5',
            zIndex: 500
          }}
        >
          <Typography variant="body2" color="text.secondary">Caricamento mappa...</Typography>
        </Box>
      )}
      
      <Box 
        ref={mapRef} 
        sx={{ 
          width: '100%', 
          height: '100%',
          '& .leaflet-container': {
            width: '100%',
            height: '100%'
          }
        }}
      />
      
      {locations.length === 0 && !loading && (
        <Box 
          sx={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center', 
            justifyContent: 'center', 
            backgroundColor: '#f5f5f5',
            zIndex: 500
          }}
        >
          <LocationOnIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
          <Typography variant="body1" color="text.secondary">
            Nessuna location da visualizzare
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Aggiungi location con coordinate per visualizzarle sulla mappa
          </Typography>
        </Box>
      )}
    </Paper>
  );
}

export default LocationMapView;
