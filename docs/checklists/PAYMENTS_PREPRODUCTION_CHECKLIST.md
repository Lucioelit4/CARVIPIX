# PAYMENTS PREPRODUCTION CHECKLIST

## Seguridad Webhook
- [ ] Provider validado contra allowlist.
- [ ] Limite de payload activo (PAYMENT_WEBHOOK_MAX_PAYLOAD_BYTES).
- [ ] Ventana anti-replay activa (PAYMENT_WEBHOOK_REQUIRE_TIMESTAMP=true).
- [ ] Tolerancia de timestamp definida (PAYMENT_WEBHOOK_TIMESTAMP_TOLERANCE_MS).
- [ ] Rate limit activo por provider + IP (PAYMENT_WEBHOOK_RATE_LIMIT).

## Seguridad Auth/Admin
- [ ] Login admin protegido por same-origin.
- [ ] Login admin con rate limiting y retryAfter.
- [ ] Endpoints admin de pagos protegidos por same-origin.
- [ ] Endpoints admin de pagos protegidos por rate limiting.

## Concurrencia e Idempotencia
- [ ] Worker de emails usa FOR UPDATE SKIP LOCKED.
- [ ] Worker incrementa attempts de forma atomica al tomar trabajo.
- [ ] Webhooks duplicados no reprocesan transicion de estado.
- [ ] Dedupe de outbox email activo por dedupeKey.

## Reintentos y Fallos
- [ ] Backoff por intento validado en pruebas.
- [ ] Finalizacion a failed al exceder maxRetries validada.
- [ ] Eventos timeline email_sent/email_failed disponibles para auditoria.

## Evidencia Tecnica
- [ ] Pruebas Fase 7 ejecutadas y pasando.
- [ ] Regresion de pagos (F3-F6) ejecutada y pasando.
- [ ] Build final ejecutado y en estado exitoso.
