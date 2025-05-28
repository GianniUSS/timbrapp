@echo off
echo.
echo ===================================
echo  AVVIO SEMPLIFICATO TIMBRAPP HTTP
echo ===================================
echo.

REM Termina qualsiasi processo sulla porta 4000
echo Chiusura di eventuali istanze precedenti...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :4000') do (
    echo Terminazione processo: %%a
    taskkill /F /PID %%a >nul 2>&1
)

REM Verifica se esiste già una build del frontend
if exist "e:\timbrapp\timbrapp-frontend\build\index.html" (
    echo Build frontend trovata.
) else (
    echo Build frontend NON trovata!
    echo Questo processo potrebbe richiedere alcuni minuti...
    echo.
    
    REM Verifica/installa craco
    cd /d e:\timbrapp\timbrapp-frontend
    if not exist "node_modules\.bin\craco.cmd" (
        echo Installazione di craco...
        call npm install --save-dev @craco/craco
    )
    
    echo Creazione build ottimizzata...
    call npm run build
    
    REM Verifica se la build è stata creata correttamente
    if not exist "build\index.html" (
        echo ERRORE: Build non creata correttamente!
        pause
        exit /b 1
    )
    
    echo Build creata con successo!
)

REM Avvia il server backend
echo.
echo Avvio del server backend...
cd /d e:\timbrapp\timbrapp-backend
start "" "http://192.168.1.12:4000"
node index.js

echo.
pause
