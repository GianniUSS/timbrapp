# send-notification.ps1

# === PARAMETRI ===
# URL base della tua API (senza slash finale)
$baseUrl = 'https://192.168.1.12:4000'
# Credenziali di login
$email = 'a@a.it'
$password = 'a'
# Dati notifica da inviare
$userId = 11
$title = 'Titolo notifica di prova'
$body = 'Ciao! Questa è una notifica di test.'
# Se vuoi passare altri dati strutturati, modificali qui:
$data = @{
    foo = 'bar'
} 

# === LOGIN PER OTTENERE JWT ===
Write-Host "Eseguo il login su $baseUrl/auth/login..."
$loginPayload = @{
    email    = $email
    password = $password
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod `
        -Uri ("$baseUrl/auth/login") `
        -Method Post `
        -Body $loginPayload `
        -ContentType 'application/json'
    $token = $loginResponse.token
    if (-not $token) {
        throw "Nessun token ricevuto in risposta."
    }
    Write-Host "Login avvenuto con successo. Token ricevuto."
}
catch {
    Write-Error "Errore in fase di login: $_"
    exit 1
}

# === CREAZIONE E INVIO NOTIFICA ===
Write-Host "Invio notifica a userId=$userId..."
$notifPayload = @{
    userId = $userId
    title  = $title
    body   = $body
    data   = $data
} | ConvertTo-Json

$headers = @{
    'Content-Type'  = 'application/json'
    'Authorization' = "Bearer $token"
}

try {
    $response = Invoke-RestMethod `
        -Uri ("$baseUrl/notifications") `
        -Method Post `
        -Headers $headers `
        -Body $notifPayload
    Write-Host "Risposta server:" ($response | ConvertTo-Json -Depth 5)
    if ($response.success) {
        Write-Host "Notifica creata e inviata con successo!" -ForegroundColor Green
    }
    else {
        Write-Warning "Richiesta eseguita, ma server ha risposto con success: false."
    }
}
catch {
    Write-Error "Errore durante l'invio della notifica: $_"
    exit 1
}
