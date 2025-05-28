# Avvio TimbrApp in modo semplificato
# Utilizza la modalità produzione per evitare problemi con il server di sviluppo

$ErrorActionPreference = "Stop"
Write-Host "Avvio TimbrApp su http://192.168.1.12:4000"

# Assicurati che non ci siano processi che usano la porta 4000
try {
    $processes = Get-NetTCPConnection -LocalPort 4000 -ErrorAction SilentlyContinue
    foreach ($process in $processes) {
        Stop-Process -Id $process.OwningProcess -Force -ErrorAction SilentlyContinue
        Write-Host "Terminato processo con PID $($process.OwningProcess)"
    }
} catch {}

# Crea la build ottimizzata del frontend in modo diretto
$frontendDir = "e:\timbrapp\timbrapp-frontend"
$frontendBuildDir = Join-Path $frontendDir "build"

# Verifica se esiste già una build valida
if (Test-Path (Join-Path $frontendBuildDir "index.html")) {
    Write-Host "Build frontend esistente trovata, utilizzo quella..."
} else {
    Write-Host "Build del frontend NON trovata. Creazione necessaria." -ForegroundColor Yellow
    Write-Host "ATTENZIONE: La creazione della build può richiedere diversi minuti." -ForegroundColor Yellow
    
    # Verifica se la directory node_modules esiste
    if (-not (Test-Path (Join-Path $frontendDir "node_modules"))) {
        Write-Host "Directory node_modules non trovata. Installazione dipendenze..." -ForegroundColor Yellow
        Set-Location $frontendDir
        npm install
    }
    
    # Installa craco localmente se non è presente
    if (-not (Test-Path (Join-Path $frontendDir "node_modules\.bin\craco.cmd"))) {
        Write-Host "Installazione di craco localmente..." -ForegroundColor Yellow
        Set-Location $frontendDir
        npm install --save-dev @craco/craco
    }

    Write-Host "Creazione della build ottimizzata del frontend..." -ForegroundColor Cyan
    Write-Host "Questo processo richiederà alcuni minuti, attendere..." -ForegroundColor Cyan
    Set-Location $frontendDir
    
    # Esegui la build con un timeout esteso
    $buildProcess = Start-Process -FilePath "npm" -ArgumentList "run", "build" -NoNewWindow -PassThru
    
    # Attendi fino a 10 minuti per il completamento della build
    $timeoutMinutes = 10
    $timeout = New-TimeSpan -Minutes $timeoutMinutes
    $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
    
    Write-Host "In attesa del completamento della build (timeout: $timeoutMinutes minuti)..." -ForegroundColor Yellow
    
    # Mostra un indicatore di progresso
    $i = 0
    $chars = '|', '/', '-', '\'
    
    while (-not $buildProcess.HasExited -and $stopwatch.Elapsed -lt $timeout) {
        Write-Host "`rAttesa build in corso... $($chars[$i % 4])" -NoNewline -ForegroundColor Cyan
        $i++
        Start-Sleep -Milliseconds 500
    }
    
    # Verifica se il processo è terminato correttamente
    if ($buildProcess.HasExited) {
        if ($buildProcess.ExitCode -eq 0) {
            Write-Host "`rBuild frontend completata con successo!                 " -ForegroundColor Green
        } else {
            Write-Host "`rErrore nella build del frontend (ExitCode: $($buildProcess.ExitCode))" -ForegroundColor Red
            exit 1
        }
    } else {
        # Il processo ha superato il timeout
        Write-Host "`rTimeout superato! Terminazione forzata del processo build." -ForegroundColor Red
        Stop-Process -Id $buildProcess.Id -Force
        exit 1
    }
    
    # Verifica se la build è stata creata con successo
    if (-not (Test-Path (Join-Path $frontendBuildDir "index.html"))) {
        Write-Host "ERRORE: La build del frontend non è stata creata correttamente!" -ForegroundColor Red
        exit 1
    }
}

# Avvia il backend che servirà anche il frontend
$backendDir = "e:\timbrapp\timbrapp-backend"
Write-Host "Avvio del server backend che servirà l'applicazione completa..." -ForegroundColor Cyan
Set-Location $backendDir

# Verifica se il file index.js esiste
if (Test-Path "index.js") {
    # Avvia il server backend
    try {
        Write-Host "Server backend avviato su http://192.168.1.12:4000" -ForegroundColor Green
        Write-Host "Apertura automatica del browser..." -ForegroundColor Green
        
        # Apre il browser e poi avvia il server
        Start-Process "http://192.168.1.12:4000"
        node index.js
    } catch {
        Write-Host "Errore durante l'avvio del server backend: $_" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "ERRORE: File index.js non trovato nella directory del backend!" -ForegroundColor Red
    exit 1
}
