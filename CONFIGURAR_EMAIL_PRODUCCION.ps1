# ============================================================================
# CONFIGURACIÓN DE EMAIL PARA PRODUCCIÓN — CARVIPIX BETA PRIVADA
# ============================================================================
# 
# Este script prepara el email de Resend para producción.
# Ejecuta los pasos siguientes EN ORDEN.
#
# ============================================================================

Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  CONFIGURAR EMAIL REAL EN PRODUCCIÓN                          ║" -ForegroundColor Cyan
Write-Host "║  CARVIPIX Beta Privada — Resend + Vercel                     ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

Write-Host "`n=== PASO 1: VERIFICAR DOMINIO EN RESEND ===" -ForegroundColor Yellow
Write-Host "1. Abre https://resend.com/domains"
Write-Host "2. Busca o crea el dominio 'carvipix.com'"
Write-Host "3. Verifica DNS records (SPF, DKIM, DMARC, Return-Path)"
Write-Host "4. Confirma que el estado dice 'Verified' o 'Active'"
Write-Host "`nℹ️  Si no está verificado, Resend te mostrará los records DNS a agregar"
Write-Host "    en tu proveedor de dominio (normalmente en 5-15 minutos)."
Read-Host "Presiona ENTER cuando el dominio esté verificado"

Write-Host "`n=== PASO 2: ACTUALIZAR VARIABLE EN VERCEL ===" -ForegroundColor Yellow
Write-Host "Ejecuta este comando exactamente:  "
Write-Host "  npx vercel env add RESEND_FROM_EMAIL" -ForegroundColor Green
Write-Host "`nCuando te pregunte:  "
Write-Host "  - Environment: selecciona 'Production' (o todas)"
Write-Host "  - Valor: ingresa exactamente: noreply@carvipix.com" -ForegroundColor Green
Write-Host ""
Pause

Write-Host "`n=== PASO 3: DESPLEGAR EN PRODUCCIÓN ===" -ForegroundColor Yellow
Write-Host "Ejecuta:"
Write-Host "  npm run build" -ForegroundColor Green
Write-Host "  npx vercel --prod" -ForegroundColor Green
Write-Host ""
Pause

Write-Host "`n=== PASO 4: VERIFICAR EN PRODUCCIÓN ===" -ForegroundColor Yellow
Write-Host "1. Ve a https://carvipix.com"
Write-Host "2. Crea una cuenta nueva (NO uses cuentas de prueba)"
Write-Host "3. Completa el formulario con:"
Write-Host "   - Email real: TU_EMAIL@gmail.com (o similar)"
Write-Host "   - Código: FOUNDER-001"
Write-Host "4. Revisa tu bandeja de entrada"
Write-Host "`n   Debería recibir:"
Write-Host "   ✅ Email de bienvenida desde noreply@carvipix.com"
Write-Host "   ✅ Enlace de verificación"
Write-Host "   ✅ Acceso al dashboard"
Write-Host ""
Pause

Write-Host "`n=== RESULTADO ===" -ForegroundColor Green
Write-Host "✅ Email real funcionando"
Write-Host "✅ Resend + Vercel correctamente configurado"
Write-Host "✅ CARVIPIX listo para Fundadores reales"
Write-Host ""
Write-Host "El siguiente paso: Invitar a los 5 Fundadores"
