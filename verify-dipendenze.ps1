# verify-deps.ps1
# Script per verificare dipendenze in backend e frontend

# Array delle cartelle del progetto
$folders = @("timbrapp-backend", "timbrapp-frontend")

foreach ($f in $folders) {
    Write-Host "=== Verifica in $f ===" -ForegroundColor Cyan
    Push-Location "$PSScriptRoot\$f"

    Write-Host "`n1) Controllo installazione pacchetti (npm ci)..."
    npm ci

    Write-Host "`n2) Dipendenze obsolete (npm outdated):"
    npm outdated

    Write-Host "`n3) Controllo vulnerabilità (npm audit --audit-level=low):"
    npm audit --audit-level=low

    Pop-Location
    Write-Host "`n"
}

Write-Host "Verifica completata." -ForegroundColor Green
