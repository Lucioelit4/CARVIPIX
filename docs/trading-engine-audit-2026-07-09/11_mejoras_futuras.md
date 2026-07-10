# Trading Engine - Mejoras Futuras Propuestas

Fecha: 2026-07-09
Principio: primero comprender y demostrar; luego proponer.

## Prioridad P0
- Cerrar implementacion de pullback 45M con criterios cuantitativos verificables.
- Unificar formula unica de SL/TP/R:R entre motor, backtesting y runtime.
- Crear reporte canonico de explicabilidad por decision para auditoria externa.

## Prioridad P1
- Endurecer safety gates por entorno (modo estricto en produccion).
- Definir paquete de validacion matematica automatica contra TradingView y MetaTrader.
- Versionado obligatorio de reglas de estrategia y formulas por release.

## Prioridad P2
- Reducir acoplamiento de app/engine/core/engine.ts en submodulos.
- Fortalecer analisis de correlacion y control de exposicion multi-activo.
- Estandarizar circuito de incidentes de datos y reconexion.

## Prioridad P3
- Consolidar laboratorio de robustez (walk-forward, monte-carlo, stress tests).
- Mejorar panel de observabilidad de decisiones y calidad de datos en tiempo real.

## Regla de gobierno tecnico
Ninguna mejora que altere comportamiento estrategico se ejecuta sin autorizacion expresa del Director General.
