# CARVIPIX Intelligence Engine - Database Schema

Estado: Aprobado para integracion interna.
Alcance: solo almacenamiento y consulta segura. Sin estrategia, sin senales, sin IA, sin endpoints API.

## 1) Tablas creadas

### ie_market_ticks
- Proposito: almacenar datos de mercado en tiempo real (ticks) y spread historico.
- Campos obligatorios:
  - id (PK)
  - symbol
  - bid
  - ask
  - spread
  - mid_price
  - source
  - tick_time
- Otros campos:
  - ingest_time (default NOW)
  - payload (jsonb, default {})
- Restriccion:
  - CHECK (ask >= bid)

### ie_candles
- Proposito: velas por temporalidad para historicos por simbolo, timeframe y fecha.
- Campos obligatorios:
  - id (PK)
  - symbol
  - timeframe
  - open_time
  - close_time
  - open
  - high
  - low
  - close
  - volume (default 0)
  - source
- Otros campos:
  - spread_min
  - spread_max
  - spread_avg
  - ingest_time (default NOW)
- Restricciones:
  - CHECK (high >= low)
  - CHECK (close_time > open_time)

### ie_economic_news
- Proposito: noticias economicas y calendario.
- Campos obligatorios:
  - id (PK)
  - provider
  - title
  - published_at
- Otros campos:
  - event_id
  - country_code
  - currency
  - impact
  - actual_value
  - forecast_value
  - previous_value
  - event_time
  - tags (jsonb, default [])
  - payload (jsonb, default {})
  - ingest_time (default NOW)

### ie_system_logs
- Proposito: logs tecnicos del sistema consultables por modulo.
- Campos obligatorios:
  - id (PK)
  - module
  - level
  - message
  - logged_at
- Otros campos:
  - context (jsonb, default {})
  - trace_id
  - ingest_time (default NOW)

### ie_data_quality_reports
- Proposito: reportes de calidad de datos por dataset/simbolo/timeframe/rango.
- Campos obligatorios:
  - id (PK)
  - dataset
  - total_rows
  - missing_rows
  - duplicate_rows
  - invalid_rows
  - status
  - generated_at
- Otros campos:
  - symbol
  - timeframe
  - date_from
  - date_to
  - latency_ms_p95
  - score
  - details (jsonb, default {})
  - created_at (default NOW)

### ie_engine_decisions
- Proposito: registro de decisiones futuras del Engine (solo almacenamiento de estado/payload).
- Campos obligatorios:
  - id (PK)
  - decision_type
  - decided_at
  - state
- Otros campos:
  - symbol
  - timeframe
  - rationale
  - payload (jsonb, default {})
  - created_at (default NOW)

### ie_operation_results
- Proposito: resultados futuros de operaciones vinculables a decisiones.
- Campos obligatorios:
  - id (PK)
  - status
- Otros campos:
  - decision_id (FK -> ie_engine_decisions.id, ON DELETE SET NULL)
  - symbol
  - timeframe
  - side
  - entry_price
  - exit_price
  - stop_loss
  - take_profit
  - quantity
  - pnl
  - executed_at
  - closed_at
  - payload (jsonb, default {})
  - created_at (default NOW)

### ie_system_versions
- Proposito: versionado tecnico del sistema y despliegues.
- Campos obligatorios:
  - id (PK)
  - component
  - version
  - deployed_at
- Otros campos:
  - build_hash
  - release_channel
  - metadata (jsonb, default {})
  - created_at (default NOW)

## 2) Indices creados

### ie_candles
- ux_ie_candles_symbol_tf_open: UNIQUE (symbol, timeframe, open_time)
- idx_ie_candles_symbol_open: (symbol, open_time DESC)
- idx_ie_candles_timeframe_open: (timeframe, open_time DESC)
- idx_ie_candles_open_time_brin: BRIN (open_time)

### ie_market_ticks
- idx_ie_market_ticks_symbol_time: (symbol, tick_time DESC)
- idx_ie_market_ticks_time_brin: BRIN (tick_time)
- idx_ie_market_ticks_spread_time: (symbol, spread, tick_time DESC)

### ie_economic_news
- idx_ie_news_published: (published_at DESC)
- idx_ie_news_country_currency: (country_code, currency, published_at DESC)

### ie_system_logs
- idx_ie_logs_module_time: (module, logged_at DESC)
- idx_ie_logs_level_time: (level, logged_at DESC)

### ie_data_quality_reports
- idx_ie_dq_dataset_generated: (dataset, generated_at DESC)

### ie_engine_decisions
- idx_ie_decisions_symbol_time: (symbol, decided_at DESC)

### ie_operation_results
- idx_ie_results_symbol_exec: (symbol, executed_at DESC)

### ie_system_versions
- ux_ie_versions_component_version: UNIQUE (component, version)

## 3) Relacion entre tablas

- Relacion fisica:
  - ie_operation_results.decision_id -> ie_engine_decisions.id (FK, ON DELETE SET NULL)
- Relacion funcional (por claves de consulta):
  - ie_candles e ie_market_ticks se consultan por symbol + tiempo.
  - ie_candles agrega dimension timeframe para historico por temporalidad.
  - ie_system_logs se consulta por module + tiempo.

## 4) Ejemplos de consulta (parametrizables)

### Ultimas velas (simbolo + timeframe)
```sql
SELECT *
FROM ie_candles
WHERE symbol = $1
  AND timeframe = $2
ORDER BY open_time DESC
LIMIT $3;
```

### Historico por simbolo
```sql
SELECT *
FROM ie_candles
WHERE symbol = $1
  AND ($2::text IS NULL OR timeframe = $2)
  AND ($3::timestamptz IS NULL OR open_time >= $3)
  AND ($4::timestamptz IS NULL OR open_time <= $4)
ORDER BY open_time DESC
LIMIT $5;
```

### Historico por timeframe
```sql
SELECT *
FROM ie_candles
WHERE timeframe = $1
  AND ($2::text IS NULL OR symbol = $2)
  AND ($3::timestamptz IS NULL OR open_time >= $3)
  AND ($4::timestamptz IS NULL OR open_time <= $4)
ORDER BY open_time DESC
LIMIT $5;
```

### Datos por fecha (dia UTC)
```sql
SELECT *
FROM ie_candles
WHERE open_time >= $1
  AND open_time < $2
  AND ($3::text IS NULL OR symbol = $3)
  AND ($4::text IS NULL OR timeframe = $4)
ORDER BY open_time DESC
LIMIT $5;
```

### Spread historico
```sql
SELECT *
FROM ie_market_ticks
WHERE symbol = $1
  AND ($2::timestamptz IS NULL OR tick_time >= $2)
  AND ($3::timestamptz IS NULL OR tick_time <= $3)
ORDER BY tick_time DESC
LIMIT $4;
```

### Logs por modulo
```sql
SELECT *
FROM ie_system_logs
WHERE module = $1
  AND ($2::text IS NULL OR level = $2)
  AND ($3::timestamptz IS NULL OR logged_at >= $3)
  AND ($4::timestamptz IS NULL OR logged_at <= $4)
ORDER BY logged_at DESC
LIMIT $5;
```

## 5) Limites conocidos

- No hay particionamiento fisico por fecha en esta fase (se compensa con indices compuestos + BRIN).
- No hay politica de retencion automatica (purga/archivo) en esta fase.
- La carga batch de velas en el repositorio actual es secuencial por diseno de seguridad/consistencia.
- No se expone API publica ni endpoints en este alcance.
- No se implementa logica de estrategia, analisis o IA.
