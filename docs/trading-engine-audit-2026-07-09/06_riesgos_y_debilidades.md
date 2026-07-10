# Auditoria Trading Engine - Riesgos y Debilidades

Fecha: 2026-07-09

## Hallazgos priorizados

### Critico
- Pullback 45M sin logica final implementada.
- Impacto: confirmacion de retroceso incompleta antes de decision.
- Evidencia: app/engine/strategy/pullbackValidator.ts.
- Propuesta: cerrar especificacion cuantitativa y pruebas unitarias/integ.

### Alto
- Safety gates en modo provisional permiten pass con warning cuando faltan datos reales.
- Impacto: puede pasar una senal con observabilidad incompleta.
- Evidencia: app/engine/core/safetyGates.ts.
- Propuesta: gate estricto por entorno y kill-switch por calidad de datos.

### Alto
- Modelo de SL/TP no totalmente unificado entre capas.
- Impacto: divergencia entre backtest y runtime.
- Evidencia: app/engine/backtesting/backtestEngine.ts, app/engine/core/signalGenerationEngine.ts.
- Propuesta: contrato unico de riesgo con formulas versionadas.

### Medio
- Acoplamiento elevado en motor central.
- Impacto: mayor costo de mantenimiento y riesgo de regresion.
- Evidencia: app/engine/core/engine.ts.
- Propuesta: extraer servicios y puertos por dominio.

### Medio
- Sembrado de escenarios demo en adaptador backend.
- Impacto: riesgo de confundir estado demo vs productivo en analisis.
- Evidencia: app/backend/adapters/trading-engine-gateway-adapter.ts.
- Propuesta: bandera explicita de entorno y trazas separadas.

## Riesgos operativos transversales
- Dependencia de proveedores de datos externos.
- Sincronizacion de temporalidades y reconexion.
- Sesgo en entrenamiento/aprendizaje por muestra corta.

## Estado
- Lista de riesgos inicial consolidada.
- Requiere ciclo de remediacion controlado por prioridad.
