/**
 * CARVIPIX Platform - Module Index
 * Ubicación de todos los módulos principales
 * Privado / Admin only
 */

/**
 * STRUCTURE OVERVIEW
 *
 * Active official flow:
 * - app/engine/core/engine.ts
 * - app/backend/system/carvipix-execution-engine.ts
 * - app/ai/cadpV2/shadowFlow.ts
 * - app/engine/strategy/trendValidation.ts
 * - app/engine/strategy/pullbackValidator.ts
 *
 * Legacy / reference only:
 * - app/engine/trading/tradingEngine.ts
 * - app/engine/backtesting/backtestEngine.ts
 * - admin-facing historical diagnostics and docs
 */

/**
 * QUICK REFERENCE
 *
 * - Pullback validation is already integrated in the active signal flow.
 * - Entry5M and score breakdown remain unimplemented in the active codebase.
 * - Backtesting is isolated and must not be treated as the publication path.
 */

/**
 * PENDING RULES CHECKLIST (v1.1)
 * 
 * [ ] Trend Detection 1H
 *     └─ Criterio exacto: Price vs EMA200, EMA Order, Slope, Structure
 * 
 * [ ] Pullback Validation 45M
 *     └─ Profundidad %, invalidación, duración mínima
 * 
 * [ ] Entry Confirmation 5M
 *     └─ EMA Cross, Structure Break, Impulse - qué trigger exacto?
 * 
 * [ ] Stop Loss Calculation
 *     └─ ATR / Structure / EMA + buffer - cuál exactamente?
 * 
 * [ ] Take Profit Calculation
 *     └─ TP1/TP2/TP3 levels y trailing - fórmula exacta?
 * 
 * [ ] Confidence Score 0-100
 *     └─ Fórmula: suma ponderada? avg? custom?
 * 
 * [ ] Daily Limits
 *     └─ Max trades, drawdown, capital abierto
 * 
 * [ ] News Handling
 *     └─ ±X minutos veto, nivel de news
 * 
 * [ ] Pre-Entry Invalidation
 *     └─ Reglas que cancelan signal justo antes entrada
 * 
 * [ ] Trailing Stop Rules
 *     └─ Método exacto entre TP1 y TP2
 */

/**
 * TESTING CHECKLIST
 * 
 * Unit Tests:
 * [ ] TrendValidator.evaluateCondition1_PriceVsEMA200()
 * [ ] TrendValidator.evaluateCondition2_EMAOrder()
 * [ ] TrendValidator.evaluateCondition3_EMASlope()
 * [ ] TrendValidator.evaluateCondition4_Structure()
 * [ ] TrendValidator.determineConfidenceLevel()
 * [ ] CarvipixAlertManager.formatSignalMessage()
 * [ ] CarvipixAlertManager.getAlertStats()
 * 
 * Integration Tests:
 * [ ] TradingEngine feedCandle() → TrendValidation
 * [ ] TradingEngine generateSignal() → TradingSignal
 * [ ] TradingEngine createAlert() → CarvipixAlert
 * [ ] Backtesting con 354k velas XAUUSD 2025
 * [ ] Verificar WR 75%-85%, Avg RR 1.5+
 * [ ] Verificar 3-8 alertas/día objetivo
 * 
 * E2E Tests:
 * [ ] LiveCandle → Signal → Alert (full flow)
 * [ ] Signal states transitions (PENDING → ACTIVE → TP/SL)
 * [ ] Multiple concurrent signals
 * [ ] Daily limits enforcement
 */

/**
 * DOCUMENT LOCATIONS
 * 
 * Especificación:
 * ├── docs/CARVIPIX_STRATEGY_V1.md ........... Especificación oficial
 * └── app/engine/ARCHITECTURE.md ............ Diagrama arquitectura
 * 
 * Código:
 * ├── app/engine/trading/tradingEngine.ts .. Tipos e interfaces
 * ├── app/engine/strategy/trendValidation.ts Validador tendencia
 * ├── app/engine/alerts/carvipixAlerts.ts .. Sistema alertas
 * └── app/engine/strategy/carvipixStrategyConfig.ts .. Config
 * 
 * Reglas Pending:
 * └── Ver ARCHITECTURE.md sección "CAMPOS PENDING"
 * └── Ver carvipixStrategyConfig.ts pendingRules array
 */

export const MODULE_INDEX_VERSION = '1.0';
export const STATUS = 'Architecture_Defined_Ready_for_v1.1_Implementation';
