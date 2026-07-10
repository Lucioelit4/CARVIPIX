# Trading Engine - Diseno del Sistema de Backtesting

Fecha: 2026-07-09
Objetivo: disenar el sistema, no reportar resultados finales.

## Base actual
- Motor principal de backtesting: app/engine/backtesting/backtestEngine.ts
- Calculo de metricas: app/engine/backtesting/calculations.ts
- Extensiones existentes: walkForward.ts, monteCarlo.ts, optimizer/*, research/*

## Requisitos metricos obligatorios
- Win rate
- Drawdown maximo y actual
- Profit factor
- Expectancy
- Sharpe
- Calmar
- Operaciones por sesion
- Operaciones por activo
- Operaciones por tendencia
- Operaciones por rango
- Resultado por clasificacion A+/A/B/C

## Diseno propuesto
1. Ingestion historica versionada por dataset y checksum.
2. Motor de simulacion unificado con mismas reglas del runtime.
3. Registro por trade con snapshot de contexto y decision.
4. Pipeline de metricas consolidado por corrida, activo y segmento.
5. Modulos de robustez: walk-forward, monte-carlo, sensibilidad de parametros.
6. Capa de auditoria: reporte reproducible por version de estrategia y engine.

## Contratos minimos por trade
- id corrida, id trade, timestamp entrada/salida
- setup y clasificacion
- precios entry/sl/tp
- riesgo en capital y R:R
- motivo de apertura/cierre
- estado de consenso y razones de rechazo cuando aplique

## Gaps abiertos
- Homologacion completa de formulas entre backtest y runtime.
- Definicion final de pullback 45M.
- Integracion formal de validacion externa de indicadores.
