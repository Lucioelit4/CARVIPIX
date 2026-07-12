# Guia Exacta: PayPal Sandbox para CARVIPIX

Esta guia cubre solo Sandbox. No usar credenciales Live todavia.

## 1) Crear app Sandbox

1. Entra a https://developer.paypal.com/.
2. Ve a Dashboard > Apps & Credentials.
3. En la seccion Sandbox, crea una app nueva.
4. Asigna nombre: CARVIPIX Sandbox.
5. Copia estos valores:
   - Client ID -> PAYPAL_SANDBOX_CLIENT_ID
   - Secret -> PAYPAL_SANDBOX_CLIENT_SECRET
   - Client ID tambien en NEXT_PUBLIC_PAYPAL_CLIENT_ID

## 2) Configurar URL local

1. Levanta CARVIPIX en local (ejemplo: http://localhost:3000).
2. Verifica que la ruta de webhook exista en local:
   - /api/webhooks/paypal
3. Si vas a probar webhooks desde internet, usa un tunel HTTPS (ejemplo ngrok) y apunta a:
   - https://TU_URL_PUBLICA/api/webhooks/paypal

## 3) Crear Webhook en PayPal Developer

1. En la app Sandbox, abre la seccion Webhooks.
2. Crea un webhook con URL:
   - https://TU_URL_PUBLICA/api/webhooks/paypal
3. Suscribe estos eventos minimos:
   - CHECKOUT.ORDER.APPROVED
   - CHECKOUT.ORDER.COMPLETED
   - BILLING.SUBSCRIPTION.ACTIVATED
   - BILLING.SUBSCRIPTION.CANCELLED
   - BILLING.SUBSCRIPTION.SUSPENDED
   - BILLING.SUBSCRIPTION.EXPIRED
   - BILLING.SUBSCRIPTION.PAYMENT.FAILED
   - PAYMENT.CAPTURE.REFUNDED
4. Guarda y copia el Webhook ID.
5. Coloca ese valor en PAYPAL_SANDBOX_WEBHOOK_ID.

## 4) Variables de entorno requeridas

Completa en .env.local (no en git):

- PAYPAL_MODE=sandbox
- PAYPAL_SANDBOX_API_BASE=https://api-m.sandbox.paypal.com
- PAYPAL_SANDBOX_CLIENT_ID=...
- PAYPAL_SANDBOX_CLIENT_SECRET=...
- PAYPAL_SANDBOX_WEBHOOK_ID=...
- PAYPAL_BRAND_NAME=CARVIPIX
- NEXT_PUBLIC_PAYPAL_CLIENT_ID=...

## 5) Pruebas externas obligatorias en Sandbox

1. Prueba pago unico:
   - Producto: Bot CARVIPIX 999 USD.
   - Confirma que se capture orden y estado local pase a active.
2. Prueba suscripcion mensual (3 productos):
   - Plan Basico 19.99 USD
   - Plan Pro 150 USD
   - Membresia del Bot 150 USD
3. En cada caso valida:
   - No activar acceso por pagina success.
   - Activar solo tras captura PayPal o webhook verificado.
   - Webhook duplicado con mismo event id no reprocesa.

## 6) Evidencia que debe guardar el propietario

- Captura de App Sandbox creada.
- Captura de Webhook configurado y eventos seleccionados.
- Logs de respuesta 200 en /api/webhooks/paypal.
- IDs reales de ordenes y suscripciones Sandbox.
- Confirmacion de estados en base de datos local.

## 7) Criterios para pasar a Live (todavia NO ejecutar)

1. Cobertura de casos sandbox completada (exito, cancelacion, error, pago fallido, refund).
2. Verificacion de firma webhook funcionando al 100%.
3. Dedupe de eventos probado en eventos repetidos.
4. Sin activaciones falsas por front-end.
5. Aprobacion final del propietario para cambiar variables Live.
