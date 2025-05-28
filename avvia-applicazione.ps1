# Script di avvio per TimbrApp
# Esegue il backend che serve sia l'API che il frontend da un'unica origine

$ErrorActionPreference = "Stop"
Write-Host "Avvio TimbrApp su http://192.168.1.12:4000"

# Verifica se la porta 4000 è già in uso
$portInUse = $null
try {
    $portInUse = Get-NetTCPConnection -LocalPort 4000 -ErrorAction SilentlyContinue
} catch {
    # Ignora errori se il cmdlet non è disponibile
}

if ($portInUse) {
    Write-Host "La porta 4000 è già in uso. Tento di terminare il processo..."
    try {
        $processId = (Get-NetTCPConnection -LocalPort 4000).OwningProcess
        Stop-Process -Id $processId -Force
        Write-Host "Processo con PID $processId terminato con successo."
        # Attendi che la porta si liberi
        Start-Sleep -Seconds 2
    } catch {
        Write-Host "Impossibile terminare il processo automaticamente."
        Write-Host "Eseguire manualmente: taskkill /F /PID $processId"
        Write-Host "Oppure chiudere tutti i processi node.js: taskkill /F /IM node.exe"
        $choice = Read-Host "Vuoi provare a killare tutti i processi node.js? (s/n)"
        if ($choice -eq "s") {
            taskkill /F /IM node.exe
            Start-Sleep -Seconds 2
        } else {
            exit 1
        }
    }
}

# Assicurati che la build del frontend sia aggiornata
$frontendDir = "e:\timbrapp\timbrapp-frontend"
$frontendBuildDir = Join-Path $frontendDir "build"

Write-Host "Creazione della build ottimizzata del frontend..."
Set-Location $frontendDir
npm run build

if (-not (Test-Path $frontendBuildDir)) {
    Write-Host "Errore: La directory build non esiste dopo npm run build"
    exit 1
}

# Avvia il backend che servirà anche il frontend
$backendDir = "e:\timbrapp\timbrapp-backend"
Write-Host "Avvio del server backend che servirà l'applicazione completa..."
Set-Location $backendDir
node index.js

# Apri il browser all'indirizzo dell'applicazione
Start-Process "http://192.168.1.12:4000"
