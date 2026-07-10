# Auditoria Trading Engine - Indicadores y Validacion Matematica

Fecha: 2026-07-09
Alcance: inventario de calculos y plan de validacion matematica externa.

## Indicadores y calculos localizados
- EMA 20/50/200: app/engine/backtesting/backtestEngine.ts (calculateEMA)
- ATR: app/engine/backtesting/backtestEngine.ts (calculateATR)
- RSI: app/engine/backtesting/backtestEngine.ts (calculateRSI)
- MACD base: app/engine/backtesting/backtestEngine.ts (calculateMACD)
- Slope de EMAs y estructura: app/engine/strategy/trendValidation.ts
- SL/TP y R:R operativo: app/engine/core/signalGenerationEngine.ts, app/engine/agents/index.ts
- Candles OHLC y validaciones: app/engine/data/dataValidator.ts

## Observaciones tecnicas
- ADX: no se encontro implementacion activa en el flujo principal.
- Calculo de entrada/salida en backtesting actual mezcla reglas simplificadas y reglas por ATR en distintas partes.
- Pullback 45M permanece pendiente de reglas exactas: app/engine/strategy/pullbackValidator.ts.

## Protocolo obligatorio de validacion matematica
1. Definir dataset canonico por activo y timeframe (OHLCV limpio).
2. Recalcular EMA/ATR/RSI/MACD con script independiente y tolerancias fijas.
3. Comparar salida del motor contra referencia externa:
- TradingView
- MetaTrader
- Calculo independiente
4. Registrar desviacion por indicador y por timestamp.
5. Clasificar discrepancias:
- Formula distinta
- Convencion distinta (warmup, smoothing, rounding)
- Error de implementacion
6. Emitir dictamen por indicador: conforme, conforme con notas, no conforme.

## Matriz de tolerancias propuesta
- EMA: tolerancia absoluta <= 1e-6 del precio normalizado
- ATR: tolerancia relativa <= 0.25%
- RSI: tolerancia absoluta <= 0.25 puntos
- MACD: tolerancia absoluta <= 1e-5
- SL/TP y R:R: tolerancia cero en formula declarada

## Estado actual
- Inventario completo de formulas: parcialmente completo.
- Verificacion cruzada TradingView/MetaTrader: pendiente de ejecucion formal.
- Cierre de fase matematica: NO COMPLETADO.
