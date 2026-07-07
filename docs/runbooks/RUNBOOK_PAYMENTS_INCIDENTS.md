# RUNBOOK PAYMENTS INCIDENTS

## Alcance
Este runbook cubre incidencias de Fase 7 en pagos: webhook bloqueado, webhook duplicado, cola de email atorada y abuso de auth/admin.

## 1) Webhook rechazado (400/413/429)
1. Verificar respuesta del endpoint POST /api/payments/webhook y error devuelto.
2. Si error es Payload too large, revisar productor del webhook y reducir payload o aumentar PAYMENT_WEBHOOK_MAX_PAYLOAD_BYTES de forma controlada.
3. Si error es Missing webhook timestamp o out of tolerance, validar header x-mock-timestamp y ventana PAYMENT_WEBHOOK_TIMESTAMP_TOLERANCE_MS.
4. Si error es Too many webhook requests, revisar burst del emisor y ajustar PAYMENT_WEBHOOK_RATE_LIMIT solo con evidencia.
5. Confirmar que provider sea uno permitido: stripe, mercadopago, openpay, custom.

## 2) Eventos webhook duplicados
1. Consultar payment_webhook_events por provider_event_id y provider.
2. Verificar process_status y first_seen_at/processed_at.
3. Si duplicate=true en API, no reprocesar manualmente: la idempotencia ya protegió estado.
4. Revisar payment_timeline_events para confirmar que no hubo transiciones dobles.

## 3) Cola de emails atascada
1. Revisar payment_outbox_events con status pending/processing y available_at.
2. Ejecutar worker único: npm run worker:payments-email-once.
3. Si hay reintentos, validar last_error y attempts.
4. Si attempts alcanza maxRetries, confirmar eventos email_failed en timeline y escalar a soporte.
5. Nunca reinsertar mensajes sin dedupeKey nuevo controlado.

## 4) Abuso en auth/admin
1. Si admin session devuelve 429, verificar origen de IP y posible brute force.
2. Revisar origen de request (origin/referer) cuando hay 403 Origen no permitido.
3. Validar que cookies admin se emitan solo tras código correcto.
4. Rotar ADMIN_ACCESS_CODE si se detecta exposición.

## 5) Recuperación y verificación final
1. Repetir flujo con evento controlado de prueba.
2. Confirmar: webhook procesado, estado de transacción correcto, timeline consistente, email outbox estable.
3. Ejecutar suite de pruebas de pagos y build antes de cerrar incidente.
