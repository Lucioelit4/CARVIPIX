# Trading Engine - Preparacion para Forward Test

Fecha: 2026-07-09
Regla: sin conexion de dinero real, sin retiro de SAFE_MODE.

## Objetivo
Disenar entorno de validacion operativa en demo y paper trading con trazabilidad completa.

## Capacidades existentes
- Runtime de ejecucion y cola: app/backend/system/execution-runtime.ts
- Sandbox broker y reconexion: app/backend/system/broker-sandbox.ts
- Bloqueo SAFE_MODE: app/engine/core/safeModePolicy.ts
- Registro de auditoria de decisiones: app/engine/core/auditEngine.ts

## Diseño del entorno forward
1. Canal de datos de mercado validado con monitoreo de latencia y freshness.
2. Canal de decisiones del engine con evento estructurado por cada senal.
3. Canal de ejecucion sandbox con confirmacion de estado por orden/posicion.
4. Tablero comparativo:
- Decision del engine
- Evolucion del mercado real
- Referencia TradingView
- Referencia MetaTrader
5. Registro de desvio de decision y desvio de precio.

## KPIs de forward obligatorios
- Precision de direccion
- Distribucion de decisiones (BUY/SELL/WAIT/NO_TRADE)
- Tiempo medio de respuesta
- Diferencia de indicadores vs referencias
- Tasa de invalidaciones y causas
- Drawdown y riesgo operativo en demo

## Restricciones activas
- SAFE_MODE obligatorio
- Broker real deshabilitado
- Sin cambios de estrategia principal sin autorizacion
