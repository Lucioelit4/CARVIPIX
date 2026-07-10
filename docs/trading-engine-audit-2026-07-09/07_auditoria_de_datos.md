# Auditoria Trading Engine - Datos

Fecha: 2026-07-09

## Origenes de datos
- Proveedor real: app/engine/data/twelveDataProvider.ts
- Proveedor runtime: app/engine/data/realDataProvider.ts
- Fuente demo: app/engine/data/demoDataSource.ts
- Warehouse institucional: app/engine/warehouse/institutionalDataWarehouse.ts

## Validacion de calidad
- Reglas por activo (latencia, completitud, freshness, spread, ATR): app/engine/data/dataValidator.ts
- Reglas de sanidad OHLC y ticks: app/engine/data/dataValidator.ts
- Monitoreo de salud y alertas: app/engine/data/dataHealthMonitor.ts

## Integridad, perdidas y duplicados
- Deteccion de calidad y issues de batch: app/engine/warehouse/qualityEngine.ts
- Gestion de errores de datos y anomalias: app/engine/types/marketData.ts
- Riesgo detectado: duplicados y faltantes requieren umbrales de alerta operativa mas estrictos.

## Sincronizacion temporalidades
- Timeframes de estrategia operativa: 1H, 45M, 5M.
- Timeframes de inventario historico soportados: Tick, M1, M5, M15, M30, H1, H4, D1, W1, MN.
- Riesgo: desfase entre serie historica, runtime y cierres por timeframe.

## Manejo de desconexiones
- Runtime y reconexion en sandbox: app/backend/system/execution-runtime.ts, app/backend/system/broker-sandbox.ts
- Estado actual: robustez razonable en sandbox, pendiente homologacion full para escenario real.

## Dictamen de datos
- Cobertura de validacion: buena base.
- Confiabilidad institucional end-to-end: parcial, condicionada por modo provisional y fuentes externas.
