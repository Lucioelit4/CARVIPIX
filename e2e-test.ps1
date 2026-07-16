$BASE_URL = "http://localhost:3000"

Write-Host "=== CICLO E2E CARVIPIX ===" -ForegroundColor Cyan

# PASO 1: Cerebro
Write-Host "`n1. Verificar Cerebro" -ForegroundColor Cyan
$brain = Invoke-RestMethod -Uri "$BASE_URL/api/admin/brain" -Method GET -ErrorAction Stop
Write-Host "Status: $($brain.status)" -ForegroundColor Green
Write-Host "Modulos: $($brain.connectedModules)/9" -ForegroundColor Green

# PASO 2: Señal
Write-Host "`n2. Generar Señal XAUUSD" -ForegroundColor Cyan
$signalId = "SIG-E2E-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
$signal = @{
    signal_id = $signalId
    analysis_id = "AN-E2E-$(Get-Date -Format 'HHmmss')"
    symbol = "XAUUSD"
    direction = "BUY"
    entry = 2450.50
    stop_loss = 2445.00
    take_profit = 2465.00
    quality = "A"
    confidence = 85
    risk_reward = 3.1
} | ConvertTo-Json

$event = Invoke-RestMethod -Uri "$BASE_URL/api/signals/master" -Method POST `
    -Headers @{'Content-Type'='application/json'} -Body $signal -ErrorAction Stop

Write-Host "Event: $($event.event_id)" -ForegroundColor Green
Write-Host "Signal: $signalId" -ForegroundColor Green

$eventId = $event.event_id

# PASO 3: Ejecución MT5
Write-Host "`n3. Ejecución MT5" -ForegroundColor Cyan
$ticket = 12345678
$execResp = Invoke-RestMethod -Uri "$BASE_URL/api/bot/mt5/execution" -Method POST `
    -Headers @{'Content-Type'='application/json'} `
    -Body (@{
        event_id = $eventId
        broker_ticket = $ticket
        entry_price = 2450.45
        status = "EXECUTED"
    } | ConvertTo-Json) -ErrorAction Stop

Write-Host "Ticket: $ticket" -ForegroundColor Green
Write-Host "Status: EXECUTED" -ForegroundColor Green

# PASO 4: Cierre
Write-Host "`n4. Cierre Posicion" -ForegroundColor Cyan
$closeResp = Invoke-RestMethod -Uri "$BASE_URL/api/bot/mt5/closure" -Method POST `
    -Headers @{'Content-Type'='application/json'} `
    -Body (@{
        event_id = $eventId
        broker_ticket = $ticket
        close_type = "TAKE_PROFIT"
        close_price = 2458.20
        pips = 82
        profit_loss = 82.00
    } | ConvertTo-Json) -ErrorAction Stop

Write-Host "Close Price: 2458.20" -ForegroundColor Green
Write-Host "Pips: 82" -ForegroundColor Green
Write-Host "Status: CLOSED" -ForegroundColor Green

# RESULTADO
Write-Host "`n=== RESULTADO EXITOSO ===" -ForegroundColor Green
Write-Host "Event ID: $eventId" -ForegroundColor White
Write-Host "Signal ID: $signalId" -ForegroundColor White
Write-Host "Broker Ticket: $ticket" -ForegroundColor White
