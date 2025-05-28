param(
    [string]$ApiUrl = 'http://192.168.1.12:4000/api/auth/register'
)

# Chiedo i dati
$nome = Read-Host 'Inserisci il tuo nome'
$email = Read-Host 'Inserisci la tua email'
$password = Read-Host 'Inserisci la tua password'

# Preparo il JSON
$body = @{
    nome     = $nome
    email    = $email
    password = $password
} | ConvertTo-Json

# Invio la richiesta
try {
    $resp = Invoke-RestMethod -Uri $ApiUrl `
        -Method Post `
        -Body $body `
        -ContentType 'application/json'
    Write-Host "✅ Utente registrato! ID:" $resp.id
}
catch {
    Write-Host "❌ Errore:" $_.Exception.Message
}
