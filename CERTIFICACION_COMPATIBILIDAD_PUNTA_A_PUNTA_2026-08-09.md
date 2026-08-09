# CERTIFICACION DE COMPATIBILIDAD PUNTA A PUNTA CARVIPIX

Fecha: 2026-08-09  
Estado: **BLOQUEADA PARA DECLARACION FINAL**  
Alcance: local, determinista, sin servicios externos y sin despliegue.

## Cadena certificada

`EXPEDIENTE HISTORICO -> decision valida -> Signal Maestra -> lifecycle -> Alertas CARVIPIX -> Telegram -> master-event-dispatcher -> bot_mt5_signals -> signal-next -> MT5 -> ACK -> registro de ejecucion/resultado`

## Resultados PASS

- Cerebro historico congelado: 58/58.
- Scheduler, ciclo, WAIT, lease y slot: 18/18.
- Downstream Signal Maestra, lifecycle, Alertas, Telegram, MT5, ACK y OrderSend: 26/26.
- Signal Maestra conserva decision, direction, horizon, validity_minutes, expires_at y source.
- WAIT y NO_TRADE permanecen distintos y audit-only.
- Lifecycle aplica idempotencia por signal_id.
- Telegram usa un solo transporte; dispatcher recibe `sendTelegram: false`.
- `bot_mt5_signals` usa identidad y firma SHA-256 deterministas.
- EXTENDED conserva 1200 minutos y expiracion exacta.
- `signal-next` reclama la fila atomicamente con `FOR UPDATE SKIP LOCKED`.
- Routing conserva canonical symbol, broker symbol e installation_id.
- ACK certifica `RECEIVED -> DELIVERED`, `EXECUTED -> EXECUTED` y rechazo fail-closed.
- EA valida formato SHA-256, expiracion, BUY/SELL, retcode de OrderSend y reportes terminales.
- MetaEditor: 0 errores, 0 warnings; compilacion en carpeta temporal sin reemplazar el EX5 versionado.
- Next.js 16.2.9 webpack: build completo, TypeScript, 117 paginas y trazas PASS con `CARVIPIX_ENV=development` efimero.
- ESLint del alcance: 0 errores; 4 warnings legacy en master-event-dispatcher.
- `git diff --check`: PASS.

## Integridad congelada

Los nueve SHA-256 coinciden 9/9 con `QA_DOWNSTREAM_BASELINE_2026-08-09.md`. Ningun archivo congelado cambio despues de la captura.

## Bloqueo unico

La definicion fundacional de `bot_mt5_signals` conserva `UNIQUE(signal_id)`, pero el dispatcher crea una entrega por cada licencia activa. La primera licencia puede insertarse; la segunda colisiona antes de llegar a `signal-next`.

La FK actual `bot_mt5_executions(signal_id) -> bot_mt5_signals(signal_id)` impide retirar de forma aislada esa unicidad. Por ello, el fan-out multi-licencia no puede certificarse con el esquema actual.

## Correccion recomendada, pendiente de aprobacion

1. Crear constraint unico `(signal_id, license_id)`.
2. Migrar la FK de ejecuciones a `(signal_id, license_id)`.
3. Cambiar el insert idempotente a `ON CONFLICT (signal_id, license_id) DO NOTHING`.
4. Probar dos licencias, dos instalaciones, dos ACK y dos ejecuciones independientes.
5. Incluir migracion y rollback SQL transaccionales.

Ventajas: fan-out correcto, ownership por licencia e idempotencia real.  
Riesgos: cambio de contrato de datos y bloqueo breve durante constraints.  
Costo: bajo-medio; servicio, schema, migracion, rollback y pruebas de dos licencias.  
Impacto: limitado al downstream MT5; el cerebro historico permanece congelado.

## Rollback del candidato local

El candidato inicial esta preservado en Git objects:

```powershell
git cat-file blob b119f5d718a069fa7ac55734b2202e66664872d0
git cat-file blob e21be185bb97bd01eb580ea48eb466f3d98e5160
```

No se creo commit RC y no se realizo deploy. La declaracion final de compatibilidad queda expresamente retenida hasta certificar fan-out multi-licencia.