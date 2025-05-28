# Documentazione della refactorizzazione della Dashboard

## Introduzione

Questa documentazione descrive la refactorizzazione eseguita sulla dashboard di TimbrApp. L'obiettivo principale era quello di modularizzare il codice, migliorare la leggibilità e la manutenibilità dell'applicazione, spostando la logica di business in custom hooks e i componenti UI in file separati.

## Struttura dei componenti

### Componenti principali

- **DashboardWeb.js**: Componente principale che coordina tutti gli altri componenti
- **DashboardSidebar.js**: Sidebar laterale con l'elenco delle commesse e dei task
- **CalendarSection.js**: Sezione del calendario che mostra i turni
- **TaskDialog.js**: Dialog per l'aggiunta/modifica dei task
- **LocationDialog.js**: Dialog per l'aggiunta/modifica delle location
- **StatusSnackbar.js**: Snackbar per i messaggi di stato
- **UserMenu.js**: Menu utente e impostazioni

### Custom Hooks

- **useCommesse.js**: Gestisce il caricamento e la manipolazione delle commesse
- **useShifts.js**: Gestisce il caricamento e la manipolazione dei turni
- **useTasks.js**: Gestisce le operazioni CRUD sui task
- **useLocations.js**: Gestisce le operazioni CRUD sulle location

## Custom Hooks in dettaglio

### useCommesse

```javascript
const {
  commesse, // Elenco delle commesse
  loading, // Indicatore di caricamento
  error, // Messaggio di errore
  selectedCommesse, // ID delle commesse selezionate
  expandedCommesse, // ID delle commesse espanse
  handleCommessaToggle, // Funzione per selezionare/deselezionare commesse
  handleCommessaExpand, // Funzione per espandere/ridurre commesse
  handleTaskToggle, // Funzione per attivare/disattivare task
  fetchCommesse, // Funzione per caricare le commesse
} = useCommesse();
```

### useShifts

```javascript
const {
  calendarEvents, // Eventi formattati per il calendario
  filteredEvents, // Eventi filtrati in base alle commesse selezionate
  loading, // Indicatore di caricamento
  error, // Messaggio di errore
  fetchShifts, // Funzione per caricare i turni
  lastFetched, // Data ultimo caricamento
} = useShifts(selectedCommesse);
```

### useTasks

```javascript
const {
  loading, // Indicatore di caricamento
  error, // Messaggio di errore
  successMessage, // Messaggio di successo
  addTask, // Funzione per aggiungere task
  deleteTask, // Funzione per eliminare task
  updateTask, // Funzione per aggiornare task
  toggleTaskStatus, // Funzione per cambiare lo stato (attivo/disattivo)
  clearMessages, // Funzione per pulire i messaggi
} = useTasks();
```

### useLocations

```javascript
const {
  loading, // Indicatore di caricamento
  error, // Messaggio di errore
  successMessage, // Messaggio di successo
  addLocation, // Funzione per aggiungere location
  deleteLocation, // Funzione per eliminare location
  updateLocation, // Funzione per aggiornare location
  getLocationsByCommessa, // Funzione per recuperare le location di una commessa
  clearMessages, // Funzione per pulire i messaggi
} = useLocations();
```

## Flusso dati principale

1. All'avvio dell'applicazione, `DashboardWeb.js` carica:

   - La lista delle commesse (tramite `useCommesse`)
   - I turni associati (tramite `useShifts`)

2. Quando l'utente seleziona o deseleziona commesse:

   - Si aggiorna l'array `selectedCommesse`
   - Il custom hook `useShifts` ricarica automaticamente i turni filtrati

3. Operazioni sui task:

   - L'aggiunta/eliminazione di task è gestita dal custom hook `useTasks`
   - Dopo l'operazione, si ricaricano le commesse per aggiornare la UI

4. Operazioni sulle location:
   - L'aggiunta/eliminazione di location è gestita dal custom hook `useLocations`
   - Dopo l'operazione, si ricaricano le commesse per aggiornare la UI

## Best practices implementate

- **Separazione delle responsabilità**: UI separata dalla logica di business
- **Hooks personalizzati**: Logica riutilizzabile isolata in hooks specifici
- **Gestione degli errori**: Ogni operazione include gestione degli errori
- **Feedback utente**: Messaggi di stato per tutte le operazioni
- **Responsive design**: UI adattiva per dispositivi mobili e desktop
- **Memorizzazione**: `useMemo` e `useCallback` per ottimizzare le performance

## Suggerimenti per future estensioni

1. **Cache offline**: Migliorare la gestione della cache per il funzionamento offline
2. **Paginazione**: Implementare paginazione per elenchi di dati corposi
3. **Test unitari**: Aggiungere test per i custom hooks
4. **Internazionalizzazione**: Preparare l'app per il multilinguaggio
5. **Tema chiaro/scuro**: Implementare switch tema chiaro/scuro
