@echo off
echo Avvio del frontend TimbrApp in modalità sviluppo...
cd /d e:\timbrapp\timbrapp-frontend

echo Pulizia cache di npm...
call npm cache clean --force

echo Pulizia della cartella node_modules...
rmdir /s /q node_modules
del /f /q package-lock.json

echo Reinstallazione dei moduli npm...
call npm install

echo Impostazione delle variabili d'ambiente...
set HTTPS=false
set HOST=0.0.0.0
set PORT=3001
set REACT_APP_API_URL=http://192.168.1.12:4000
set WDS_SOCKET_PORT=3001
set DISABLE_ESLINT_PLUGIN=true
set FAST_REFRESH=true

echo Avvio del server di sviluppo...
call npm start

echo Processo frontend avviato. Se non si apre automaticamente, accedi a http://localhost:3001
