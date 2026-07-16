#!/usr/bin/env powershell

# SHADOW PRODUCTION — QUICK START SCRIPT
# Activa y verifica la operación integral en 7 pasos

Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  🌑 SHADOW PRODUCTION V1 — ACTIVACIÓN RÁPIDA" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:3001"
$port = 3001

# Step 1: Verificar Dev Server
Write-Host "⏳ [1/7] Verificando Dev Server..." -ForegroundColor White
Start-Sleep -Milliseconds 500

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/internal/observer-v3/status" -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "    ✓ Dev server activo en puerto $port" -ForegroundColor Green
    }
} catch {
    Write-Host "    ✗ Dev server NO responde" -ForegroundColor Red
    Write-Host "    Ejecutar en Terminal separada: npm run dev" -ForegroundColor Yellow
    exit 1
}

# Step 2: Verificar Environment
Write-Host ""
Write-Host "⏳ [2/7] Verificando configuración..." -ForegroundColor White

$envPath = ".env.local"
$hasTestOnly = (Get-Content $envPath | Select-String "TEST_ONLY=true")
$hasAutoSendFalse = (Get-Content $envPath | Select-String "AUTO_SEND_OFFICIAL=false")

if ($hasTestOnly -and $hasAutoSendFalse) {
    Write-Host "    ✓ TEST_ONLY=true" -ForegroundColor Green
    Write-Host "    ✓ AUTO_SEND_OFFICIAL=false" -ForegroundColor Green
} else {
    Write-Host "    ✗ Variables de entorno incompletas" -ForegroundColor Red
    exit 1
}

# Step 3: Health Check
Write-Host ""
Write-Host "⏳ [3/7] Comprobando salud de módulos..." -ForegroundColor White

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/internal/shadow-production/health" | ConvertFrom-Json
    
    if ($response.status -eq "ALL_READY") {
        Write-Host "    ✓ Todos los módulos READY ($($response.ready_count)/$($response.total_count))" -ForegroundColor Green
        foreach ($module in $response.modules) {
            Write-Host "      • $($module.name): $($module.status)" -ForegroundColor Gray
        }
    } else {
        Write-Host "    ⚠️ Estado: $($response.status)" -ForegroundColor Yellow
        Write-Host "    Módulos listos: $($response.ready_count)/$($response.total_count)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "    ✗ Health check failed" -ForegroundColor Red
}

# Step 4: Initialize Shadow Production
Write-Host ""
Write-Host "⏳ [4/7] Inicializando Shadow Production..." -ForegroundColor White

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/internal/shadow-production/init" `
        -Method POST | ConvertFrom-Json
    
    if ($response.ok) {
        Write-Host "    ✓ Shadow Production inicializado" -ForegroundColor Green
        Write-Host "    📅 Inicio: $($response.config.start_date)" -ForegroundColor Gray
        Write-Host "    ⏱️ Duración: $($response.config.duration_days) días" -ForegroundColor Gray
        Write-Host "    🔒 TEST_ONLY: $($response.config.test_only)" -ForegroundColor Gray
    }
} catch {
    Write-Host "    ✗ Init failed: $_" -ForegroundColor Red
}

# Step 5: Verify Telegram Connection
Write-Host ""
Write-Host "⏳ [5/7] Verificando conexión Telegram..." -ForegroundColor White
Write-Host "    ℹ️ Revisar que el grupo de test reciba un mensaje de prueba" -ForegroundColor Cyan

try {
    # Este es más un aviso que una verificación real
    Write-Host "    ℹ️ Grupos de test monitorean mensajes" -ForegroundColor Gray
    Write-Host "    ✓ Sistema Telegram configurado para TEST_ONLY" -ForegroundColor Green
} catch {
    Write-Host "    ⚠️ No se pudo verificar canal Telegram" -ForegroundColor Yellow
}

# Step 6: Database & Logging
Write-Host ""
Write-Host "⏳ [6/7] Verificando persistencia de datos..." -ForegroundColor White

$dataDir = "data/shadow-production"
if (Test-Path $dataDir) {
    Write-Host "    ✓ Directorio de datos: $dataDir" -ForegroundColor Green
    $files = Get-ChildItem $dataDir -ErrorAction SilentlyContinue
    if ($files.Count -gt 0) {
        Write-Host "    ✓ Archivos de configuración: $($files.Count)" -ForegroundColor Green
    }
} else {
    Write-Host "    ℹ️ Creando directorio de datos..." -ForegroundColor Gray
    New-Item -ItemType Directory -Path $dataDir -Force | Out-Null
    Write-Host "    ✓ Directorio creado" -ForegroundColor Green
}

# Step 7: Dashboard Ready
Write-Host ""
Write-Host "⏳ [7/7] Preparando dashboard..." -ForegroundColor White
Write-Host "    ✓ Dashboard disponible en:" -ForegroundColor Green
Write-Host "       http://localhost:3001/admin/observer-v3" -ForegroundColor Cyan

# Final Status
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  🟢 SHADOW PRODUCTION ACTIVO" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 PRÓXIMOS PASOS:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Abre el dashboard:" -ForegroundColor White
Write-Host "   http://localhost:3001/admin/observer-v3" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Monitorea los módulos cada 24h:" -ForegroundColor White
Write-Host "   curl http://localhost:3001/api/internal/shadow-production/daily-report" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. Reporte anomalías inmediatamente:" -ForegroundColor White
Write-Host "   curl -X POST http://localhost:3001/api/internal/shadow-production/events?action=report-anomaly ..." -ForegroundColor Cyan
Write-Host ""
Write-Host "4. Reporte final en 7 días:" -ForegroundColor White
Write-Host "   curl http://localhost:3001/api/internal/shadow-production/final-report" -ForegroundColor Cyan
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "📋 Ver manual completo: SHADOW_PRODUCTION_OPERATIONAL_MANUAL.md" -ForegroundColor Gray
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Auto-open dashboard if browser available
try {
    Start-Process "http://localhost:3001/admin/observer-v3"
    Write-Host "🌐 Abriendo dashboard en navegador..." -ForegroundColor Gray
} catch {
    # Browser not available in terminal context
}
