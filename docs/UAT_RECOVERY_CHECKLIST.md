# CARVIPIX UAT Recovery Checklist

## Incident Trigger
- Identificar modulo afectado (cliente/admin/pagos/bot/sistema).
- Confirmar entorno impactado (dev/test/shadow/prod).

## Immediate Actions
- Aislar trafico si aplica.
- Preservar logs del incidente.
- Verificar estado DB y conectividad bridge.
- Verificar integridad de variables criticas.

## Recovery
- Restaurar servicio desde artefacto estable previo.
- Ejecutar smoke de login, dashboard, admin, pagos, bot.
- Verificar que no hay fuga de secretos en logs.

## Post-Recovery
- Documentar causa raiz.
- Documentar impacto por rol (cliente/admin).
- Registrar acciones correctivas pendientes para UAT.
