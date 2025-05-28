# TimbrApp - Script di Test Automatico Ottimizzazioni
# Verifica tutte le ottimizzazioni implementate nel sistema

param(
    [switch]$SkipDevServer,
    [switch]$SkipBuild,
    [switch]$Verbose
)

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

# Header
Write-Host ""
Write-Host "=====================================" -ForegroundColor Magenta
Write-Host "   TIMBRAPP OPTIMIZATION TESTING    " -ForegroundColor Magenta
Write-Host "=====================================" -ForegroundColor Magenta
Write-Host ""

# Variabili globali
$frontendPath = "e:\timbrapp\timbrapp-frontend"
$testResults = @{}

# Test 1: Verifica struttura file ottimizzazioni
function Test-FileStructure {
    Write-Log "Test 1: Verifica struttura file ottimizzazioni" "INFO"
    
    $requiredFiles = @(
        "src\hooks\usePerformanceMonitor.js",
        "src\hooks\usePrefetch.js", 
        "src\hooks\usePWA.js",
        "src\components\EnhancedApp.js",
        "src\components\PerformanceDashboard.js",
        "src\components\VirtualScrollList.js",
        "src\pages\TestOptimizations.js",
        "src\utils\apiCache.js",
        "src\utils\cacheInterceptor.js",
        "public\sw-advanced.js",
        "craco.config.js",
        "OPTIMIZATION_REPORT.md",
        "OPTIMIZATION_GUIDE.md"
    )
    
    $missingFiles = @()
    foreach ($file in $requiredFiles) {
        $fullPath = Join-Path $frontendPath $file
        if (-not (Test-Path $fullPath)) {
            $missingFiles += $file
        }
    }
    
    if ($missingFiles.Count -eq 0) {
        Write-Log "Tutti i file delle ottimizzazioni sono presenti" "SUCCESS"
        $testResults.FileStructure = $true
    }
    else {
        Write-Log "File mancanti: $($missingFiles -join ', ')" "ERROR"
        $testResults.FileStructure = $false
    }
}

# Test 2: Verifica dipendenze npm
function Test-Dependencies {
    Write-Log "Test 2: Verifica dipendenze npm" "INFO"
    
    try {
        Set-Location $frontendPath
        $packageJson = Get-Content "package.json" | ConvertFrom-Json
        
        $requiredDeps = @(
            "@craco/craco",
            "webpack-bundle-analyzer", 
            "react-window",
            "react-virtualized-auto-sizer"
        )
        
        $missing = @()
        foreach ($dep in $requiredDeps) {
            if (-not ($packageJson.dependencies.PSObject.Properties.Name -contains $dep) -and 
                -not ($packageJson.devDependencies.PSObject.Properties.Name -contains $dep)) {
                $missing += $dep
            }
        }
        
        if ($missing.Count -eq 0) {
            Write-Log "Tutte le dipendenze sono presenti" "SUCCESS"
            $testResults.Dependencies = $true
        }
        else {
            Write-Log "Dipendenze mancanti: $($missing -join ', ')" "ERROR"
            $testResults.Dependencies = $false
        }
    }
    catch {
        Write-Log "Errore nel test dipendenze: $_" "ERROR"
        $testResults.Dependencies = $false
    }
}

# Test 3: Verifica configurazione Craco
function Test-CracoConfig {
    Write-Log "Test 3: Verifica configurazione Craco" "INFO"
    
    try {
        $cracoPath = Join-Path $frontendPath "craco.config.js"
        $content = Get-Content $cracoPath -Raw
        
        $checks = @(
            @{ Pattern = "BundleAnalyzerPlugin"; Name = "Bundle Analyzer" },
            @{ Pattern = "webpack.*optimization.*splitChunks"; Name = "Code Splitting" },
            @{ Pattern = "mui.*vendor"; Name = "MUI Vendor Chunk" },
            @{ Pattern = "setupMiddlewares"; Name = "Dev Server Setup" }
        )
        
        $passed = 0
        foreach ($check in $checks) {
            if ($content -match $check.Pattern) {
                Write-Log "$($check.Name): OK" "SUCCESS"
                $passed++
            }
            else {
                Write-Log "$($check.Name): MANCANTE" "WARNING"
            }
        }
        
        $testResults.CracoConfig = $passed -eq $checks.Count
    }
    catch {
        Write-Log "Errore nel test Craco config: $_" "ERROR"
        $testResults.CracoConfig = $false
    }
}

# Test 4: Build di produzione
function Test-ProductionBuild {
    if ($SkipBuild) {
        Write-Log "Test 4: Build di produzione - SALTATO" "WARNING"
        return
    }
    
    Write-Log "Test 4: Build di produzione" "INFO"
    
    try {
        Set-Location $frontendPath
        $buildResult = & npm run build 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Log "Build completata con successo" "SUCCESS"
            
            # Verifica presenza chunks
            $buildPath = Join-Path $frontendPath "build\static\js"
            $jsFiles = Get-ChildItem $buildPath -Filter "*.js"
            
            $hasMainChunk = $jsFiles | Where-Object { $_.Name -like "main.*" }
            $hasVendorChunks = $jsFiles | Where-Object { $_.Name -like "*vendor*" }
            $hasChunks = $jsFiles | Where-Object { $_.Name -like "*.chunk.js" }
            
            if ($hasMainChunk -and $hasVendorChunks -and $hasChunks) {
                Write-Log "Code splitting verificato: main chunk + vendor chunks + lazy chunks" "SUCCESS"
                $testResults.ProductionBuild = $true
            }
            else {
                Write-Log "Code splitting non ottimale" "WARNING"
                $testResults.ProductionBuild = $false
            }
        }
        else {
            Write-Log "Build fallita" "ERROR"
            $testResults.ProductionBuild = $false
        }
    }
    catch {
        Write-Log "Errore nel test build: $_" "ERROR"
        $testResults.ProductionBuild = $false
    }
}

# Test 5: Analisi bundle size
function Test-BundleAnalysis {
    Write-Log "Test 5: Analisi bundle size" "INFO"
    
    try {
        Set-Location $frontendPath
        
        # Avvia bundle analyzer in background
        $analyzerProcess = Start-Process -FilePath "npm" -ArgumentList "run", "build:analyze" -NoNewWindow -PassThru -RedirectStandardOutput "analyzer.log"
        
        Start-Sleep -Seconds 10
        
        if (-not $analyzerProcess.HasExited) {
            Write-Log "Bundle analyzer avviato correttamente" "SUCCESS"
            $testResults.BundleAnalysis = $true
            
            # Termina il processo
            Stop-Process -Id $analyzerProcess.Id -Force -ErrorAction SilentlyContinue
        }
        else {
            Write-Log "Errore nell'avvio bundle analyzer" "ERROR"
            $testResults.BundleAnalysis = $false
        }
    }
    catch {
        Write-Log "Errore nel test bundle analysis: $_" "ERROR"
        $testResults.BundleAnalysis = $false
    }
}

# Test 6: Verifica route TestOptimizations
function Test-TestOptimizationsRoute {
    Write-Log "Test 6: Verifica route TestOptimizations" "INFO"
    
    try {
        $appPath = Join-Path $frontendPath "src\App.js"
        $content = Get-Content $appPath -Raw
        $hasLazyImport = $content -match "React\.lazy.*TestOptimizations"
        $hasRoute = $content -match "test-optimizations"
        $hasProtectedRoute = $content -match "ProtectedRoute.*>.*TestOptimizations"
        
        if ($hasLazyImport -and $hasRoute -and $hasProtectedRoute) {
            Write-Log "Route TestOptimizations configurata correttamente" "SUCCESS"
            $testResults.TestRoute = $true
        }
        else {
            Write-Log "Configurazione route TestOptimizations incompleta" "ERROR"
            $testResults.TestRoute = $false
        }
    }
    catch {
        Write-Log "Errore nel test route: $_" "ERROR"
        $testResults.TestRoute = $false
    }
}

# Esegui tutti i test
Write-Log "Inizio testing ottimizzazioni TimbrApp" "INFO"

Test-FileStructure
Test-Dependencies  
Test-CracoConfig
Test-ProductionBuild
Test-BundleAnalysis
Test-TestOptimizationsRoute

# Report finale
Write-Host ""
Write-Host "=====================================" -ForegroundColor Magenta
Write-Host "        RISULTATI FINALI             " -ForegroundColor Magenta
Write-Host "=====================================" -ForegroundColor Magenta

$totalTests = $testResults.Count
$passedTests = ($testResults.Values | Where-Object { $_ -eq $true }).Count

foreach ($test in $testResults.GetEnumerator()) {
    $status = if ($test.Value) { "PASS" } else { "FAIL" }
    $color = if ($test.Value) { "Green" } else { "Red" }
    Write-Host "$($test.Key): $status" -ForegroundColor $color
}

Write-Host ""
Write-Host "TOTALE: $passedTests/$totalTests test superati" -ForegroundColor $(if ($passedTests -eq $totalTests) { "Green" } else { "Yellow" })

if ($passedTests -eq $totalTests) {
    Write-Log "Tutte le ottimizzazioni sono state implementate correttamente!" "SUCCESS"
}
else {
    Write-Log "Alcune ottimizzazioni necessitano di correzioni" "WARNING"
}

Write-Host ""
Write-Log "Testing completato" "INFO"
