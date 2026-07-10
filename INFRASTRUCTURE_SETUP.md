# INFRASTRUCTURE_SETUP

## Objetivo
Preparar PostgreSQL y Redis como infraestructura persistente para pagos, membresías, sesiones, auditoría y runtime, sin depender de almacenamiento local para datos críticos.

## Alternativa A: Docker
Versiones recomendadas:
- PostgreSQL 17
- Redis 7

Variables de entorno:
- `DATABASE_URL`
- `DATABASE_SSL`
- `BACKEND_DB_POOL_MAX`
- `REDIS_URL`
- `LOG_LEVEL`
- `NODE_ENV`

Creación de base de datos:
1. Levantar PostgreSQL y Redis.
2. Crear base de datos para staging o desarrollo.
3. Configurar usuario con permisos limitados.
4. Verificar conectividad desde la aplicación.

Migraciones:
- Ejecutar migraciones de esquema antes de iniciar la app.
- Verificar tablas de pagos, membresías, auditores, webhooks, soporte y runtime.

Seeds permitidos solo para desarrollo:
- Datos de catálogo inicial
- Usuarios demo de desarrollo
- Entitlements mínimos para pruebas locales

Conexión segura:
- Usar TLS si el contenedor o el host lo soportan.
- Limitar acceso por red privada.
- No exponer puertos al exterior salvo necesidad de desarrollo local.

Cifrado:
- Secretos en entorno y no en código.
- Vault o secret manager para credenciales del proveedor.
- Rotación periódica de secretos críticos.

Backups:
- Backup programado de PostgreSQL.
- Verificación de restauración.
- Retención separada para staging y producción.

Recuperación:
- Restaurar backups en una base limpia.
- Validar órdenes, memberships y auditoría tras la restauración.

Logs:
- Log estructurado por categoría.
- Retención y rotación.
- Separar logs de aplicación, pagos y broker.

Salud del sistema:
- Endpoint de health
- Verificación de base de datos
- Verificación de Redis
- Verificación de runtime de pagos

Separación de entornos:
- Desarrollo
- Staging
- Producción

Validación de persistencia:
- Crear orden.
- Recibir webhook.
- Reconciliar transacción.
- Activar membresía.
- Reiniciar app.
- Confirmar que el estado persiste.

## Alternativa B: Instalación manual o servicios externos
Versiones recomendadas:
- PostgreSQL 17
- Redis 7

Variables de entorno:
- `DATABASE_URL`
- `DATABASE_SSL=true` si el proveedor exige TLS
- `BACKEND_DB_POOL_MAX`
- `REDIS_URL`
- `NODE_ENV`

Creación de base de datos:
1. Crear instancia en servicio administrado o servidor manual.
2. Crear usuario con permisos mínimos.
3. Crear base separada para cada entorno.

Migraciones:
- Ejecutarlas contra cada entorno por separado.
- No mezclar desarrollo con producción.

Seeds permitidos solo para desarrollo:
- Catálogo básico
- Usuarios de prueba
- Configuración no crítica

Conexión segura:
- TLS obligatorio en producción.
- Firewalls y allowlists.
- Acceso únicamente desde redes autorizadas.

Cifrado:
- Gestionar certificados y secretos en un almacén seguro.
- No guardar secretos en archivos versionados.

Backups:
- Política de backups del proveedor o del DBA.
- Probar restauración periódicamente.

Recuperación:
- Restaurar backup y comprobar la tabla de pagos, membresías y auditoría.

Logs:
- Logs de app, DB y proveedor de infraestructura.
- Correlación por `orderId`, `transactionId` y `webhookId`.

Salud del sistema:
- Verificación de lectura y escritura en PostgreSQL.
- Verificación de conectividad Redis.
- Verificación de colas y reintentos.

Separación de entornos:
- Mantener credenciales y bases independientes.
- No reutilizar sandbox en producción.

Validación de persistencia:
- Realizar un pago sandbox.
- Verificar activación.
- Reiniciar servicios.
- Confirmar persistencia del estado.

## Monitoreo y alertas
- Monitorear latencia y error rate de API de pagos.
- Monitorear conexiones activas y saturación de pool en PostgreSQL.
- Monitorear memoria, evictions y reconnects en Redis.
- Alertar por fallas de webhook, colas atascadas y reintentos excesivos.
- Correlación de incidentes por `orderId`, `transactionId`, `webhookId` y `requestId`.

## Health checks mínimos
- `/api/health`: disponibilidad general de aplicación.
- `/api/health/db`: prueba de lectura/escritura controlada a PostgreSQL.
- `/api/health/redis`: latencia y conectividad Redis.
- `/api/health/payments`: estado del runtime de pagos y proveedor configurado.

## Checklist por entorno
Desarrollo:
- Variables locales no versionadas.
- PostgreSQL y Redis funcionales.
- Migraciones aplicadas.

Staging:
- Credenciales en secret manager.
- Webhooks de sandbox/preproducción registrados.
- Backups y restore validados.
- Alertas activas y dashboards accesibles.

Producción:
- TLS y firewalls activos.
- Rotación de secretos planificada.
- DR drill ejecutado y documentado.
- No usar sandbox ni credenciales compartidas con staging.

## Restricción importante
No usar archivos locales como almacenamiento productivo de sesiones, pagos, membresías o información crítica. El almacenamiento local solo puede servir para utilidades de desarrollo o sandbox controlado si no hay alternativa temporal.