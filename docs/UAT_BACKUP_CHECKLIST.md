# CARVIPIX UAT Backup Checklist

## Database
- Confirmar backup automatizado activo por entorno.
- Validar retencion minima definida.
- Ejecutar backup manual pre-UAT.

## Application State
- Versionar configuracion de despliegue.
- Respaldar archivos operativos no reproducibles.

## Verification
- Probar restauracion en entorno aislado.
- Verificar consistencia de datos restaurados.
- Verificar acceso de cliente/admin tras restore.
