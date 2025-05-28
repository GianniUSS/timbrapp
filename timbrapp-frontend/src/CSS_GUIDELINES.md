# Linee Guida per la Gestione dei CSS

## Approccio Consolidato

A seguito dell'ottimizzazione dei file CSS del calendario, è stato adottato un approccio "consolidato" per la gestione degli stili CSS nel progetto TimbrApp. Queste linee guida servono a mantenere il codice pulito, evitare duplicazioni e facilitare la manutenzione.

## Principi Generali

1. **Un file CSS per componente**: Ogni componente React principale dovrebbe avere al massimo un file CSS dedicato.

2. **Evitare CSS sparsi**: Non creare nuovi file CSS per risolvere problemi specifici. Aggiungere invece le correzioni al file CSS esistente nella sezione appropriata.

3. **Organizzazione delle regole**: Strutturare i file CSS in sezioni logiche con commenti descrittivi.

4. **Nomenclatura BEM**: Utilizzare la convenzione BEM (Block-Element-Modifier) per i nomi delle classi CSS:

   ```css
   /* Block */
   .calendar {
   }

   /* Element */
   .calendar__day {
   }

   /* Modifier */
   .calendar__day--today {
   }
   ```

5. **Specificity**: Evitare selettori eccessivamente specifici. Preferire classi dedicate invece di selettori annidati profondi.

## Struttura Consigliata dei File CSS

```css
/* 
 * nome-componente.css
 * Descrizione dello scopo del file CSS
 */

/* ===== VARIABILI ===== */
:root {
  --primary-color: #33466b;
  --text-color: #333;
}

/* ===== LAYOUT GENERALE ===== */
.componente-container {
  /* Stili */
}

/* ===== SEZIONE SPECIFICA ===== */
.componente-elemento {
  /* Stili */
}

/* ===== RESPONSIVE ===== */
@media (max-width: 768px) {
  /* Stili responsivi */
}
```

## Gestione delle Modifiche

1. **Documentare le modifiche**: Aggiungere commenti che spiegano il motivo di regole CSS particolari.

2. **Fix e Correzioni**: Incorporare i fix direttamente nel file CSS principale, aggiungendo un commento che spiega il problema risolto.

3. **CSS Legacy**: Non rimuovere CSS esistente senza verificare che non sia più utilizzato.

## Evitare CSS Inline

Limitare l'uso di stili inline nel JSX. Se uno stile è utilizzato più volte, spostarlo nel file CSS.

```jsx
// Da evitare
<div style={{ fontSize: '14px', color: 'red', padding: '10px' }}>...</div>

// Preferire
<div className="error-message">...</div>
```

## Linting e Formattazione

È stato configurato Stylelint per garantire la coerenza del codice CSS. Eseguire regolarmente:

```
npx stylelint "src/**/*.css"
```

prima di committare modifiche CSS.
