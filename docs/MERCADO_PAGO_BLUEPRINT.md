# Blueprint Mercado Pago para CARVIPIX

## Decisión Técnica

La integración principal para CARVIPIX debe ser **Mercado Pago Subscriptions** para el cobro recurrente de membresías.

Motivo:

- CARVIPIX vende membresías, no solo pagos únicos.
- El Payment Core ya modela suscripciones, renovaciones, estados de membresía y webhook normalization.
- Checkout Pro es más simple, pero está más orientado a checkout hospedado y flujos de pago puntual.
- Checkout API Orders queda como camino complementario para pagos únicos o flujos personalizados si más adelante se requieren.

Conclusión operativa:

- **Principal:** Subscriptions.
- **Complementario:** Checkout API Orders.
- **No prioritario:** Checkout Pro.

## Regla de Arquitectura

Este proveedor no debe modificar el núcleo enterprise ya aprobado. Mercado Pago debe entrar como un adapter más dentro de la capa existente:

- [app/backend/payments/core/provider-adapter.ts](../app/backend/payments/core/provider-adapter.ts)
- [app/backend/payments/core/contracts.ts](../app/backend/payments/core/contracts.ts)
- [app/backend/payments/core/provider-config.ts](../app/backend/payments/core/provider-config.ts)
- [app/backend/payments/core/webhook-logic.ts](../app/backend/payments/core/webhook-logic.ts)
- [app/api/payments/webhook/route.ts](../app/api/payments/webhook/route.ts)
- [app/api/client/payment-orders/route.ts](../app/api/client/payment-orders/route.ts)

La lógica enterprise de órdenes, membresías, auditoría, seguridad y sesiones permanece intacta.

## Mapa de Integración

### Entrada principal

- El frontend o el flujo de cliente crea una orden en el Payment Core.
- El Payment Core resuelve el provider activo.
- El adapter de Mercado Pago genera la sesión o la suscripción.
- El usuario completa el pago en Mercado Pago.
- Mercado Pago notifica el evento por webhook.
- El webhook es normalizado y procesado por el orquestador existente.
- La membresía se activa o actualiza según el estado final del pago o de la suscripción.

### Qué debe resolver el adapter

- Crear sesión de checkout o suscripción.
- Verificar firma de webhook.
- Parsear eventos a formato canónico.
- Consultar estado remoto del pago cuando el webhook no sea suficiente.

## Credenciales Necesarias

### Producción

- Public Key
- Access Token
- Secret de Webhooks generado en el panel
- Opcionalmente Client ID y Client Secret si se usa OAuth o una integración futura que lo requiera

### Sandbox

- Public Key de prueba
- Access Token de prueba
- Secret de Webhooks de prueba

### Reglas de uso

- Public Key solo para frontend cuando sea necesario.
- Access Token solo para backend.
- Nunca exponer Access Token en navegador, logs, query params ni payloads públicos.
- Guardar credenciales en secretos seguros del entorno.

## Configuración en el Panel de Mercado Pago

### Aplicación

- Crear una aplicación en Your integrations.
- Completar datos de negocio.
- Activar credenciales de prueba primero.
- Activar credenciales productivas solo al final del ciclo de validación.

### Webhooks

Configurar URLs separadas para test y producción.

- Test URL
- Production URL

Eventos a registrar para el caso de CARVIPIX:

- `payment`
- `subscription_preapproval`
- `subscription_authorized_payment`
- `subscription_preapproval_plan` si se usa plan asociado
- `orders` solo si se activa Checkout API Orders
- `chargebacks` si se quiere visibilidad explícita de disputa

### Firma de notificaciones

- Habilitar la secret signature del webhook.
- Validar `x-signature` y los metadatos de la notificación.
- Rechazar notificaciones inválidas antes de afectar estados internos.

## URLs de CARVIPIX

### Webhook

- Producción: `/api/payments/webhook?provider=mercadopago`
- Sandbox: misma ruta lógica, pero apuntando al entorno de prueba o a una configuración de test separada

### Flujo de cliente

- Alta o reactivación de membresía: usar el flujo actual del cliente que crea órdenes de pago.
- Retorno visual del checkout: mantener la ruta actual de checkout de la aplicación.
- El adapter no debe inventar una nueva superficie pública si el flujo actual ya existe.

### Reconciliación

- Cuando el webhook llegue con solo un ID, el orquestador debe poder consultar el recurso remoto.
- Si el webhook no llega, la conciliación debe apoyarse en consulta directa al recurso de Mercado Pago.

## Eventos y Mapeo Canónico

### Subscriptions

- `subscription_preapproval` -> alta, cancelación o cambio de estado de suscripción
- `subscription_authorized_payment` -> renovación autorizada o cobro de cuota
- `subscription_preapproval_plan` -> sincronización de plan cuando exista plan asociado

### Payments

- `payment` -> pago aprobado, fallido, reembolsado o en revisión, según el estado remoto

### Chargebacks

- `chargebacks` -> disputa o contracargo

### Reglas canónicas internas

- Aprobado/capturado -> `paid` o `captured`
- Fallido -> `failed`
- Reembolsado -> `refunded` o `partially_refunded`
- Renovación de suscripción exitosa -> `subscription_renewed`
- Renovación fallida -> `subscription_payment_failed`
- Baja de suscripción -> `subscription_cancelled`

## Test Plan Antes de Producción

### 1. Prueba de credenciales

- Confirmar que sandbox y producción usan claves distintas.
- Confirmar que el backend usa Access Token y el frontend solo Public Key cuando corresponda.

### 2. Prueba de webhook

- Enviar eventos de prueba desde el panel.
- Validar firma.
- Validar respuesta HTTP `200` o `201` dentro del límite esperado.
- Confirmar idempotencia frente a reintentos.

### 3. Prueba de compra aprobada

- Usar tarjeta de prueba aprobada.
- Verificar que la orden pasa a estado pagado.
- Verificar que la membresía se activa correctamente.

### 4. Prueba de rechazo

- Usar escenario de rechazo.
- Verificar que la orden quede como fallida.
- Verificar que no se active membresía.

### 5. Prueba de renovación

- Simular una renovación de suscripción.
- Confirmar que el ciclo de membresía se extiende.
- Confirmar que la trazabilidad queda registrada.

### 6. Prueba de reembolso

- Simular devolución total o parcial.
- Verificar el mapeo a `refunded` o `partially_refunded`.
- Verificar impacto sobre la membresía y la conciliación.

### 7. Prueba de reintentos

- Forzar una respuesta no-200 para validar reintentos.
- Confirmar que el sistema no duplica efectos.

### 8. Prueba de seguridad

- Confirmar que `x-signature` es validado.
- Confirmar que payloads grandes o inválidos son rechazados.
- Confirmar que el endpoint soporta rate limiting y no expone credenciales.

## Recomendación de Implementación Posterior

Cuando se apruebe este blueprint, el siguiente paso debe ser crear el adapter real de Mercado Pago dentro de la capa existente, sin tocar la arquitectura enterprise:

- Implementar `ProviderPaymentAdapter` para `mercadopago`.
- Añadir normalización de eventos de suscripción y pago.
- Completar la verificación de firma real de Mercado Pago.
- Implementar consulta de estado remoto para conciliación.
- Mantener la compatibilidad con la state machine y con las rutas ya existentes.

## Criterio de Aprobación

Este blueprint queda aprobado solo si Mercado Pago se integra como un proveedor más del Payment Core, sin rediseñar:

- autenticación
- sesiones
- estados de membresía
- auditoría
- webhook route
- orquestación de pagos

Si eso se respeta, Mercado Pago encaja bien en la arquitectura actual de CARVIPIX.