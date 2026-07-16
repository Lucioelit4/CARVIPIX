# Script para ejecutar primera operación automáticamente
$ErrorActionPreference = "SilentlyContinue"

# 1. Matar MT5
taskkill /IM terminal64.exe /F 2>$null
Start-Sleep 3

# 2. Compilar EA
Write-Output "Compilando EA..."
$experts = "C:\Users\user1\AppData\Roaming\MetaQuotes\Terminal\EC6CB01DD6EC087A123DA4B636574C06\MQL5\Experts"
$src_mq5 = "c:\Users\user1\carvipix\scripts\CARVIPIX_EA_MT5_V2_WITH_RETURNS.mq5"
$dst_mq5 = "$experts\CARVIPIX_EA_MT5_V2_WITH_RETURNS.mq5"

Copy-Item $src_mq5 $dst_mq5 -Force
& "C:\Program Files\OANDA MetaTrader 5 Terminal\metaeditor64.exe" "/compile:$dst_mq5" 2>$null
Start-Sleep 6

# 3. Verificar compilación
if (Test-Path "$experts\CARVIPIX_EA_MT5_V2_WITH_RETURNS.ex5") {
  Write-Output "✅ EA compilado exitosamente"
} else {
  Write-Output "❌ Error en compilación"
  exit 1
}

# 4. Abrir MT5
Write-Output "Abriendo MT5..."
& "C:\Program Files\OANDA MetaTrader 5 Terminal\terminal64.exe" 2>$null | Out-Null &
Start-Sleep 20

# 5. Crear señal
Write-Output "Creando señal..."
$body = '{"symbol":"XAUUSD","decision":"BUY","entry":"4033.00","stopLoss":"4023.00","takeProfit":"4053.00"}'
$r = Invoke-WebRequest -Uri "http://localhost:3000/api/admin/bot/mt5/signals/test" -Method POST -ContentType "application/json" -Body $body -UseBasicParsing -ErrorAction SilentlyContinue

if ($r) {
  $sig = $r.Content | ConvertFrom-Json
  Write-Output "✅ Señal: $($sig.signalId)"
} else {
  Write-Output "❌ No se pudo crear señal"
}

# 6. Esperar ejecución
Write-Output "Esperando ejecución..."
Start-Sleep 30

Write-Output "✅ COMPLETADO - Revisa MT5"
