# Disabilita temporaneamente il controllo dei certificati SSL self-signed
[System.Net.ServicePointManager]::ServerCertificateValidationCallback = { $true }

# === PARAMETRI ===
$BaseUrl  = 'https://192.168.1.12:4000'
$Email    = 'mario@example.com'      # sostituisci con la tua email
$Password = 'secret'             # sostituisci con la tua password

# === LOGIN PER OTTENERE JWT ===
Write-Host "[INFO] Effettuo login su $BaseUrl/auth/login..." -ForegroundColor Cyan
$loginPayload = @{ email = $Email; password = $Password } | ConvertTo-Json
try {
    $loginResponse = Invoke-RestMethod -Uri "$BaseUrl/auth/login" -Method Post -Body $loginPayload -ContentType 'application/json' -ErrorAction Stop
    $token = $loginResponse.token
    if (-not $token) { throw "Nessun token ricevuto in risposta." }
    Write-Host "[OK] Login avvenuto con successo. Token ricevuto." -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Errore login: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# === ESECUZIONE TEST WEBPUSH ===
$uri = "$BaseUrl/webpush/test"
Write-Host "[INFO] Invio POST di test push a: $uri" -ForegroundColor Cyan
$headers = @{ 'Authorization' = "Bearer $token"; 'Content-Type' = 'application/json' }
try {
    $response = Invoke-RestMethod -Uri $uri -Method Post -Headers $headers -ErrorAction Stop
    Write-Host "[OK] WebPush test response:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 4 | Write-Host
} catch {
    Write-Host "[ERROR] Errore durante il test WebPush: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $body = $_.Exception.Response.GetResponseStream() |
                New-Object System.IO.StreamReader |
                ForEach-Object { $_.ReadToEnd() }
        Write-Host "Response body:" -ForegroundColor Yellow
        Write-Host $body
    }
    exit 1
}
