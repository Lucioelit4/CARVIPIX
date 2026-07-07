# PAYMENTS PHASE 7 ENV

Variables recomendadas para hardening pre-produccion:

- PAYMENT_WEBHOOK_MAX_PAYLOAD_BYTES=262144
- PAYMENT_WEBHOOK_REQUIRE_TIMESTAMP=true
- PAYMENT_WEBHOOK_TIMESTAMP_TOLERANCE_MS=300000
- PAYMENT_WEBHOOK_RATE_LIMIT=120
- ADMIN_ACCESS_CODE=<codigo-seguro>

Notas:
- Mantener PAYMENT_WEBHOOK_REQUIRE_TIMESTAMP=true salvo pruebas locales controladas.
- Ajustar limites solo con metricas y evidencia de carga.
- No habilitar proveedor real en esta fase.
