# PAYMENTS_PRODUCTION_REQUIREMENTS

## 1. Proveedor que puede conectarse con la arquitectura actual
La arquitectura actual está preparada para conectarse con **Mercado Pago** como proveedor principal. El código ya contempla `stripe`, `mercadopago`, `openpay` y `custom`, pero la ruta más directa hoy es Mercado Pago porque existe configuración de entorno específica, normalización de credenciales y soporte de webhooks en la capa de pagos.

## 2. Credenciales que necesito conseguir
Necesitas obtener credenciales reales del proveedor elegido para dos entornos separados:
- Sandbox
- Producción

Para Mercado Pago, la base actual requiere:
- `MERCADOPAGO_SANDBOX_PUBLIC_KEY`
- `MERCADOPAGO_SANDBOX_ACCESS_TOKEN`
- `MERCADOPAGO_SANDBOX_WEBHOOK_SECRET`
- `MERCADOPAGO_SANDBOX_APPLICATION_ID` o `MERCADOPAGO_SANDBOX_CLIENT_ID` / `MERCADOPAGO_SANDBOX_CLIENT_SECRET` si el flujo lo exige
- `MERCADOPAGO_PRODUCTION_PUBLIC_KEY`
- `MERCADOPAGO_PRODUCTION_ACCESS_TOKEN`
- `MERCADOPAGO_PRODUCTION_WEBHOOK_SECRET`
- `MERCADOPAGO_PRODUCTION_APPLICATION_ID` o `MERCADOPAGO_PRODUCTION_CLIENT_ID` / `MERCADOPAGO_PRODUCTION_CLIENT_SECRET`

Además, para el runtime de pagos:
- `PAYMENT_GATEWAY_PROVIDER`
- `PAYMENT_GATEWAY_ENV`
- `PAYMENT_WEBHOOK_MOCK_SECRET` solo para pruebas internas controladas

## 3. Dónde deben configurarse
Las credenciales deben configurarse fuera del repositorio:
- Variables de entorno locales no versionadas para desarrollo
- Secret manager del entorno de staging
- Secret manager del entorno de producción
- Base de configuración segura del proveedor si se usa rotación de secretos

No deben ponerse en frontend, `localStorage`, `sessionStorage`, documentación pública ni archivos versionados.

## 4. Qué productos debo crear en el proveedor
Debes crear, como mínimo, los productos/precios equivalentes a estos identificadores internos:
- `plan-basic`
- `plan-advanced`
- `bot-carvipix-license`
- `capital-gestionado`

Si el proveedor trabaja con productos + precios separados, debes definir:
- Un precio recurrente mensual para `plan-basic`
- Un precio recurrente mensual para `plan-advanced`
- Un precio único para `bot-carvipix-license`
- Un flujo aparte para `capital-gestionado`, si se cobra como servicio privado o cotización manual

## 5. Webhooks que deben registrarse
Debes registrar webhooks capaces de reportar, como mínimo:
- Pago aprobado
- Pago rechazado
- Pago pendiente
- Suscripción creada
- Suscripción renovada
- Suscripción cancelada
- Suscripción vencida
- Reintento de cobro
- Reembolso aprobado
- Reembolso rechazado
- Contracargo o disputa si el proveedor lo expone

La aplicación necesita reconciliar cada evento con orden interna, transacción interna y estado de membresía.

## 6. Variables de entorno que necesita CARVIPIX
Las variables mínimas ya previstas por la arquitectura son:
- `PAYMENT_GATEWAY_PROVIDER`
- `PAYMENT_GATEWAY_ENV`
- `PAYMENT_WEBHOOK_MOCK_SECRET`
- `MERCADOPAGO_SANDBOX_PUBLIC_KEY`
- `MERCADOPAGO_SANDBOX_ACCESS_TOKEN`
- `MERCADOPAGO_SANDBOX_WEBHOOK_SECRET`
- `MERCADOPAGO_SANDBOX_APPLICATION_ID`
- `MERCADOPAGO_SANDBOX_CLIENT_ID`
- `MERCADOPAGO_SANDBOX_CLIENT_SECRET`
- `MERCADOPAGO_PRODUCTION_PUBLIC_KEY`
- `MERCADOPAGO_PRODUCTION_ACCESS_TOKEN`
- `MERCADOPAGO_PRODUCTION_WEBHOOK_SECRET`
- `MERCADOPAGO_PRODUCTION_APPLICATION_ID`
- `MERCADOPAGO_PRODUCTION_CLIENT_ID`
- `MERCADOPAGO_PRODUCTION_CLIENT_SECRET`
- `DATABASE_URL`
- `DATABASE_SSL`
- `BACKEND_DB_POOL_MAX`
- `ADMIN_ACCESS_CODE`
- `ADMIN_SESSION_SECRET`
- `SANDBOX_VAULT_KEY`

## 7. Qué base de datos necesita
CARVIPIX necesita una base PostgreSQL persistente para:
- Órdenes de pago
- Transacciones
- Timeline de eventos
- Webhooks
- Membresías
- Reembolsos
- Auditar reconciliación
- Estado de checkout

No debe depender de almacenamiento local para nada crítico.

## 8. Cómo se ejecutará la prueba sandbox
La prueba sandbox debe seguir este flujo:
1. Configurar `PAYMENT_GATEWAY_ENV=sandbox`.
2. Configurar credenciales sandbox reales.
3. Registrar webhook sandbox en el proveedor.
4. Crear una orden de prueba desde `/checkout`.
5. Generar checkout session.
6. Completar el flujo con cuenta sandbox del proveedor.
7. Confirmar webhook recibido.
8. Confirmar cambio de estado en orden interna.
9. Confirmar activación de membresía solo después de confirmación real.

## 9. Cómo se certificará el primer pago real
El primer pago real se certificará solo cuando existan todas estas evidencias:
- Orden interna creada
- Sesión de checkout creada por el proveedor
- Pago aprobado por el proveedor
- Webhook recibido y validado por firma
- Orden reconciliada en base de datos
- Transacción marcada correctamente
- Membresía activada después de confirmación real
- Acceso del usuario actualizado
- Evidencia de auditoría persistida

## 10. Qué acciones no pueden probarse sin credenciales
Sin credenciales externas no se puede probar de forma real:
- Cargo con tarjeta real
- Renovación automática real
- Suscripción real
- Reembolso real en proveedor
- Contracargo real
- Webhook firmado por proveedor
- Reconciliación contra cuenta real del proveedor
- Activación real basada en evento externo

## 11. Idempotencia y control de duplicados
- Cada orden debe salir con `idempotencyKey` único y trazable.
- Reintentos del cliente con la misma llave deben devolver la misma orden, no crear otra.
- El webhook debe deduplicar por `providerEventId` + fingerprint de payload.
- No se debe activar membresía dos veces para la misma transacción.

## 12. Reconciliación operativa obligatoria
- Conciliar `paymentOrderId`, `paymentTransactionId`, `providerCheckoutId` y `providerPaymentId`.
- Comparar estado interno vs estado del proveedor en cada transición.
- Persistir timeline de eventos con actor, source y timestamps.
- Registrar divergencias para revisión operativa y auditoría.

## 13. Renovación, cancelación y ciclo de suscripción
- Renovación: solo tras evento real de cobro exitoso del proveedor.
- Cancelación: registrar evento de proveedor y actualizar estado de membresía sin eliminar histórico.
- Vencimiento: marcar membresía expirada cuando no exista renovación confirmada.
- Reintentos de cobro: mantener estado pendiente y no activar beneficios hasta confirmación final.

## 14. Pagos únicos y productos no recurrentes
- `bot-carvipix-license` debe tratarse como pago único no recurrente.
- El flujo debe crear orden, transacción y evidencia de cumplimiento sin renovar automáticamente.
- Reembolso de pago único debe dejar rastro auditable y estado coherente de acceso.

## 15. Pendientes de prueba antes de producción
- Validar webhook firmado en sandbox y staging.
- Validar reintentos idempotentes desde cliente y desde webhook.
- Validar renovación y cancelación con eventos reales del proveedor.
- Validar reconciliación completa después de reinicio de servicios.
- Validar fallback de errores sin pantallas blancas ni errores técnicos al cliente.

## Pasos y comandos para infraestructura
Responsable de infraestructura:
1. Definir proveedor principal y entorno inicial.
2. Crear productos y precios en sandbox.
3. Registrar webhooks en sandbox.
4. Cargar variables de entorno en staging.
5. Configurar PostgreSQL persistente.
6. Ejecutar migraciones de pagos y membresías.
7. Probar checkout sandbox de extremo a extremo.
8. Validar activación de membresía tras webhook.
9. Repetir en staging con credenciales de preproducción.
10. Solo después de eso, pasar a producción.

Comandos de referencia:
- `npm run build`
- `npm run test:payments-phase7`
- `npm run test:system`
- `npm run test:engine`
- `npm run test`

## Estado actual
- La arquitectura ya soporta la separación sandbox/producción.
- El checkout aún necesita credenciales reales para abandonar el estado bloqueado.
- No hay soporte para simular pagos exitosos como sustituto de proveedor real.
- La activación de membresía debe depender exclusivamente de confirmación real.