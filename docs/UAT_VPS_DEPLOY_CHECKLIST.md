# CARVIPIX UAT VPS Deploy Checklist

## Pre-deploy
- Confirmar entorno objetivo: DEVELOPMENT / TEST / SHADOW / PRODUCTION.
- Verificar que la base de datos del entorno es independiente.
- Verificar credenciales independientes por entorno (sin reutilizacion cruzada).
- Confirmar variables criticas presentes:
  - ADMIN_SECRET
  - OPENAI_API_KEY
  - MT5_BRIDGE_BASE_URL
  - DATABASE_URL
  - CARVIPIX_JWT_SECRET
  - COOKIE_SIGNING_SECRET
  - PAYMENT_GATEWAY_PROVIDER
  - PAYMENT_WEBHOOK_MOCK_SECRET
  - SANDBOX_VAULT_KEY
  - CARVIPIX_DATA_CLASSIFICATION
- Confirmar clasificacion visible esperada (REAL/SANDBOX/DEMO/MOCK).

## Deploy
- Ejecutar build en VPS con entorno objetivo cargado.
- Desplegar imagen/artefacto versionado.
- Levantar servicio con usuario no root.
- Validar health endpoint.

## Post-deploy
- Verificar login cliente y admin.
- Verificar acceso restringido admin (401/403 para no admin).
- Verificar banner de origen de datos en vistas criticas.
- Ejecutar smoke de APIs: alerts, bot, reports, admin/system.
- Revisar logs sanitizados (sin secretos).
