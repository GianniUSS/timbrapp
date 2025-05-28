@echo off
echo Avvio rapido del server backend TimbrApp
cd /d e:\timbrapp\timbrapp-backend

REM Termina eventuali processi sulla porta 4000
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :4000') do (
    echo Termino processo: %%a
    taskkill /F /PID %%a >nul 2>&1
)

echo Avvio del server backend...
node index.js
