# Auditoria Trading Engine - Arquitectura

Fecha: 2026-07-09
Alcance: solo auditoria tecnica, sin cambios de logica estrategica.

## 1. Nucleo decisional
- Motor central: app/engine/core/engine.ts
- Consenso: app/engine/core/decisionEngine.ts
- Director de inteligencia y bloqueo SAFE_MODE: app/engine/core/intelligenceDirector.ts, app/engine/core/safeModePolicy.ts
- Evidencia, auditoria y ciclo de vida: app/engine/core/evidenceEngine.ts, app/engine/core/auditEngine.ts, app/engine/core/lifecycleManager.ts

## 2. Capa de estrategia
- Configuracion oficial v1: app/engine/strategy/carvipixStrategyConfig.ts
- Validacion de tendencia 1H: app/engine/strategy/trendValidation.ts
- Validacion de pullback 45M: app/engine/strategy/pullbackValidator.ts (estado pending configuration)
- Generacion de senal 1H/45M/5M: app/engine/core/signalGenerationEngine.ts

## 3. Capa de agentes
- 11 agentes de scoring: app/engine/agents/index.ts
- Agentes criticos ponderados: RiskManager, MarketRegimeAnalyst, TradeValidator
- Sin agente unico decisor: la aprobacion final depende del consenso del motor

## 4. Capa de datos
- Contratos y tipos: app/engine/types/marketData.ts
- Validacion de calidad: app/engine/data/dataValidator.ts
- Proveedores: app/engine/data/realDataProvider.ts, app/engine/data/twelveDataProvider.ts, app/engine/data/demoDataSource.ts
- Salud y performance: app/engine/data/dataHealthMonitor.ts, app/engine/data/performanceMonitor.ts

## 5. Capa de ejecucion y sandbox
- Runtime de ejecucion: app/backend/system/execution-runtime.ts
- Broker sandbox: app/backend/system/broker-sandbox.ts
- Adaptador backend-engine: app/backend/adapters/trading-engine-gateway-adapter.ts
- Restriccion operativa: SAFE_MODE activo por defecto en app/engine/core/engine.ts

## 6. Capa de pruebas y evaluacion
- Backtesting: app/engine/backtesting/backtestEngine.ts
- Calculo de metricas: app/engine/backtesting/calculations.ts
- Optimizacion y validacion cuantitativa: app/engine/core/quantOptimizationEngine.ts, app/engine/core/quantValidationEngine.ts
- Warehouse institucional: app/engine/warehouse/institutionalDataWarehouse.ts

## 7. Dependencias internas relevantes
- Tipos centrales del motor: app/engine/types/index.ts
- Alertas y salida humana: app/engine/alerts/carvipixAlerts.ts
- API de investigacion backtesting: app/api/backtesting/research/route.ts

## 8. Conclusiones de arquitectura
- Arquitectura modular y auditable, con separacion razonable por capas.
- El punto de mayor acoplamiento actual es app/engine/core/engine.ts.
- Existen bloques funcionales marcados como pending (pullback y partes del flujo de entrada) que deben cerrarse antes de una fase institucional live.
