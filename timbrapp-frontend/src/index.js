// src/index.js
import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import reportWebVitals from './reportWebVitals';
import { initDB } from './services/indexedDBService';
import { FilterProvider } from './context/FilterContext';

// Inizializza il database IndexedDB porva
initDB()
  .then(() => console.log('IndexedDB inizializzato con successo'))
  .catch(err => console.error('Errore inizializzazione IndexedDB:', err));

// Aggiornamento a React 18 createRoot API
const container = document.getElementById('root');
const root = createRoot(container);
root.render(
  <FilterProvider>
    <App />
  </FilterProvider>
);

// Registra il service worker per funzionalità offline e PWA
serviceWorkerRegistration.register({
  onSuccess: (registration) => {
    console.log('[index.js] SW registrato con successo:', registration);
  },
  onUpdate: (registration) => {
    console.log('[index.js] SW aggiornato, nuova versione disponibile:', registration);
  },
  onError: (error) => {
    console.error('[index.js] Errore registrazione SW:', error);
  }
});

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();