/* Script di utility per risolvere il problema di visualizzazione del calendario */
(function() {
    // Funzione per forzare il rendering del calendario
    function forceCalendarRender() {
        console.log("[TimbrApp] Applicazione fix calendario...");
        
        // Seleziona gli elementi del calendario
        const calendarElements = document.querySelectorAll('.rbc-calendar, .react-big-calendar-container');
        if (calendarElements.length > 0) {
            calendarElements.forEach(el => {
                // Forza stili inline per sovrascrivere qualsiasi CSS
                el.style.display = 'block';
                el.style.visibility = 'visible';
                el.style.opacity = '1';
                el.style.height = '700px'; 
                el.style.minHeight = '600px';
                el.style.width = '100%';
                el.style.maxWidth = '100%';
                el.style.position = 'relative';
                el.style.zIndex = '9999';
                
                // Aggiungi una classe speciale
                el.classList.add('calendar-force-visible');
                
                console.log("[TimbrApp] Fix applicato a:", el);
            });
            
            // Forza un repaint del browser
            document.body.style.display = 'none';
            document.body.offsetHeight; // Forza il reflow
            document.body.style.display = '';
            
            console.log("[TimbrApp] Calendario dovrebbe essere visibile ora");
        } else {
            console.log("[TimbrApp] Calendario non trovato, ritento tra 500ms");
            setTimeout(forceCalendarRender, 500);
        }
    }

    // Esegui dopo il caricamento completo e dopo un breve ritardo
    window.addEventListener('load', function() {
        setTimeout(forceCalendarRender, 1000);
        
        // Riprova più volte a intervalli
        const intervals = [2000, 3000, 5000, 8000];
        intervals.forEach(interval => {
            setTimeout(forceCalendarRender, interval);
        });
        
        // Setup un observer per rilevare modifiche al DOM
        const observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                if (mutation.type === 'childList') {
                    // Se è stato aggiunto il calendario, applica fix
                    if (document.querySelector('.rbc-calendar')) {
                        forceCalendarRender();
                    }
                }
            });
        });
        
        // Inizia ad osservare l'elemento root
        observer.observe(document.getElementById('root'), {
            childList: true,
            subtree: true
        });
    });
})();
