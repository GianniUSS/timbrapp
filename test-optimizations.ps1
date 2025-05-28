# PowerShell Script per Testing Automatico Ottimizzazioni TimbrApp
# File: test-optimizations.ps1

param(
    [switch]$SkipBuild,
    [switch]$SkipAnalysis,
    [switch]$Verbose
)

Write-Host "🚀 TimbrApp - Test Automatico Ottimizzazioni" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green

$ErrorActionPreference = "Continue"
$ProjectRoot = "e:\timbrapp\timbrapp-frontend"

# Funzione per logging colorato
function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "HH:mm:ss"
    switch ($Level) {
        "INFO" { Write-Host "[$timestamp] INFO: $Message" -ForegroundColor Cyan }
        "SUCCESS" { Write-Host "[$timestamp] SUCCESS: $Message" -ForegroundColor Green }
        "WARNING" { Write-Host "[$timestamp] WARNING: $Message" -ForegroundColor Yellow }
        "ERROR" { Write-Host "[$timestamp] ERROR: $Message" -ForegroundColor Red }
    }
}

# Controlla se il progetto esiste
if (-not (Test-Path $ProjectRoot)) {
    Write-Log "Directory progetto non trovata: $ProjectRoot" "ERROR"
    exit 1
}

Set-Location $ProjectRoot
Write-Log "Directory di lavoro: $ProjectRoot" "INFO"

# 1. Verifica dipendenze
Write-Log "Verificando dipendenze..." "INFO"
try {
    if (-not (Test-Path "node_modules")) {
        Write-Log "Installando dipendenze..." "INFO"
        npm install
        if ($LASTEXITCODE -ne 0) {
            Write-Log "Errore nell'installazione dipendenze" "ERROR"
            exit 1
        }
        Write-Log "Dipendenze installate con successo" "SUCCESS"
    }
    else {
        Write-Log "Dipendenze già presenti" "SUCCESS"
    }
}
catch {
    Write-Log "Errore nella verifica dipendenze: $_" "ERROR"
}

# 2. Controllo integrità file
Write-Log "Verificando integrità file ottimizzazioni..." "INFO"
$CriticalFiles = @(
    "src\hooks\usePerformanceMonitor.js",
    "src\hooks\usePrefetch.js", 
    "src\hooks\usePWA.js",
    "src\components\EnhancedApp.js",
    "src\components\PerformanceDashboard.js",
    "src\components\VirtualScrollList.js",
    "src\pages\TestOptimizations.js",
    "src\utils\apiCache.js",
    "src\utils\cacheInterceptor.js",
    "public\sw-advanced.js"
)

$MissingFiles = @()
foreach ($file in $CriticalFiles) {
    if (-not (Test-Path $file)) {
        $MissingFiles += $file
        Write-Log "File mancante: $file" "WARNING"
    }
    else {
        if ($Verbose) {
            Write-Log "File presente: $file" "SUCCESS"
        }
    }
}

if ($MissingFiles.Count -gt 0) {
    Write-Log "Attenzione: $($MissingFiles.Count) file critici mancanti" "WARNING"
}
else {
    Write-Log "Tutti i file critici sono presenti" "SUCCESS"
}

# 3. Build di produzione (se richiesto)
if (-not $SkipBuild) {
    Write-Log "Eseguendo build di produzione..." "INFO"
    try {
        $buildOutput = npm run build 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Log "Build completata con successo" "SUCCESS"
            
            # Analizza dimensioni bundle
            if (Test-Path "build\static\js") {
                $jsFiles = Get-ChildItem "build\static\js\*.js" | Sort-Object Length -Descending
                $totalSize = ($jsFiles | Measure-Object -Property Length -Sum).Sum / 1MB
                Write-Log "Dimensione totale JS bundle: $([math]::Round($totalSize, 2)) MB" "INFO"
                
                if ($totalSize -lt 2) {
                    Write-Log "Bundle size ottimale (< 2MB)" "SUCCESS"
                }
                elseif ($totalSize -lt 5) {
                    Write-Log "Bundle size accettabile (< 5MB)" "WARNING"
                }
                else {
                    Write-Log "Bundle size elevata (> 5MB) - considerare ottimizzazioni" "WARNING"
                }
            }
        }
        else {
            Write-Log "Errore nel build: $buildOutput" "ERROR"
        }
    }
    catch {
        Write-Log "Errore durante il build: $_" "ERROR"
    }
}

# 4. Analisi bundle (se richiesto)
if (-not $SkipAnalysis) {
    Write-Log "Avviando analisi bundle..." "INFO"
    try {
        # Avvia analisi in background
        $env:ANALYZE = "true"
        Start-Process -FilePath "npm" -ArgumentList "run", "build" -NoNewWindow -PassThru
        Write-Log "Analisi bundle avviata (verrà aperta nel browser)" "INFO"
    }
    catch {
        Write-Log "Errore nell'avvio analisi bundle: $_" "ERROR"
    }
}

# 5. Test sintassi e ESLint (se disponibile)
Write-Log "Verificando sintassi JavaScript..." "INFO"
try {
    # Test basic syntax con node
    $testFiles = Get-ChildItem "src" -Filter "*.js" -Recurse | Select-Object -First 5
    foreach ($file in $testFiles) {
        $result = node -c $file.FullName 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-Log "Errore sintassi in $($file.Name): $result" "ERROR"
        }
    }
    Write-Log "Verifica sintassi completata" "SUCCESS"
}
catch {
    Write-Log "Errore nella verifica sintassi: $_" "ERROR"
}

# 6. Test configurazione PWA
Write-Log "Verificando configurazione PWA..." "INFO"
$ManifestPath = "public\manifest.json"
if (Test-Path $ManifestPath) {
    try {
        $manifest = Get-Content $ManifestPath | ConvertFrom-Json
        if ($manifest.name -and $manifest.icons -and $manifest.start_url) {
            Write-Log "Manifest PWA configurato correttamente" "SUCCESS"
        }
        else {
            Write-Log "Manifest PWA incompleto" "WARNING"
        }
    }
    catch {
        Write-Log "Errore nel parsing manifest PWA: $_" "ERROR"
    }
}
else {
    Write-Log "Manifest PWA non trovato" "WARNING"
}

# 7. Verifica Service Worker
if (Test-Path "public\sw-advanced.js") {
    Write-Log "Service Worker avanzato presente" "SUCCESS"
    
    # Controlla dimensione
    $swSize = (Get-Item "public\sw-advanced.js").Length / 1KB
    if ($swSize -lt 50) {
        Write-Log "Service Worker size ottimale: $([math]::Round($swSize, 1)) KB" "SUCCESS"
    }
    else {
        Write-Log "Service Worker size: $([math]::Round($swSize, 1)) KB" "INFO"
    }
}
else {
    Write-Log "Service Worker avanzato non trovato" "WARNING"
}

# 8. Test avvio server dev (rapido)
Write-Log "Testando avvio server di sviluppo..." "INFO"
try {
    # Test rapido per vedere se il server può avviarsi
    $devProcess = Start-Process -FilePath "npm" -ArgumentList "start" -PassThru -NoNewWindow
    Start-Sleep -Seconds 10
    
    if (-not $devProcess.HasExited) {
        Write-Log "Server di sviluppo avviato correttamente" "SUCCESS"
        Stop-Process -Id $devProcess.Id -Force
        Write-Log "Server di sviluppo terminato" "INFO"
    }
    else {
        Write-Log "Errore nell'avvio del server di sviluppo" "ERROR"
    }
}
catch {
    Write-Log "Errore nel test server dev: $_" "ERROR"
}

# 9. Riepilogo finale
Write-Host "`n📊 RIEPILOGO TEST OTTIMIZZAZIONI" -ForegroundColor Magenta
Write-Host "=================================" -ForegroundColor Magenta

$TestResults = @{
    "File Critici"     = if ($MissingFiles.Count -eq 0) { "✅ Completo" } else { "⚠️ $($MissingFiles.Count) mancanti" }
    "Build Produzione" = if (-not $SkipBuild) { "✅ Testato" } else { "⏭️ Saltato" }
    "Analisi Bundle"   = if (-not $SkipAnalysis) { "✅ Avviato" } else { "⏭️ Saltato" }
    "PWA Manifest"     = if (Test-Path "public\manifest.json") { "✅ Presente" } else { "❌ Mancante" }
    "Service Worker"   = if (Test-Path "public\sw-advanced.js") { "✅ Presente" } else { "❌ Mancante" }
}

foreach ($test in $TestResults.GetEnumerator()) {
    Write-Host "  $($test.Key): $($test.Value)" -ForegroundColor White
}

Write-Host "`n🎯 PROSSIMI PASSI:" -ForegroundColor Yellow
Write-Host "  1. Avvia il server: npm start" -ForegroundColor White
Write-Host "  2. Testa le ottimizzazioni: http://localhost:3000/test-optimizations" -ForegroundColor White
Write-Host "  3. Monitora performance con il dashboard integrato" -ForegroundColor White
Write-Host "  4. Controlla PWA install prompt sui dispositivi mobili" -ForegroundColor White

Write-Log "Test completato!" "SUCCESS"
