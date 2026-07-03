/**
 * CARVIPIX Platform - Module Index
 * Ubicación de todos los módulos principales
 * Privado / Admin only
 */

/**
 * STRUCTURE OVERVIEW
 * 
 * app/
 * ├── engine/
 * │   ├── ARCHITECTURE.md ......................... Diagrama completo de la plataforma
 * │   ├── trading/
 * │   │   └── tradingEngine.ts ................... Motor central (tipos e interfaces)
 * │   │       • TradingSignal
 * │   │       • CarvipixAlert
 * │   │       • ITradingEngine
 * │   │       • SignalState, TrendValidation
 * │   │
 * │   ├── strategy/
 * │   │   ├── carvipixStrategyTypes.ts .......... Tipos base estrategia
 * │   │   │   • CarvipixStrategyConfig
 * │   │   │   • StrategyPendingRule
 * │   │   │   • BacktestingProgress
 * │   │   │
 * │   │   ├── carvipixStrategyConfig.ts ........ Configuración oficial v1.0
 * │   │   │   • CARVIPIX_STRATEGY_V1
 * │   │   │   • CARVIPIX_CONSTANTS
 * │   │   │   • 10 pending rules definidas
 * │   │   │
 * │   │   └── trendValidation.ts ............... Validador de tendencia por niveles
 * │   │       • TrendValidator
 * │   │       • 4 condiciones (Price/EMA, EMA Order, Slope, Structure)
 * │   │       • A+/A/B/C classification
 * │   │       • Structure OVERRIDE priority
 * │   │
 * │   └── alerts/
 * │       └── carvipixAlerts.ts ................. Sistema de alertas
 * │           • CarvipixAlertManager
 * │           • createSignalAlert()
 * │           • createUpdateAlert()
 * │           • createCloseAlert()
 * │           • getAlertStats()
 * │
 * ├── admin/components/
 * │   ├── BacktestExecutor.tsx .................. Panel ejecución backtests
 * │   │   • Aviso: CARVIPIX v1.0 registrada
 * │   │   • MultiDatasetLoader
 * │   │   • Integración SignalDiagnosticsPanel
 * │   │
 * │   └── SignalDiagnosticsPanel.tsx .......... Panel diagnóstico privado
 * │       • Autorización grandes datasets
 * │       • Score breakdown (si se extiende)
 * │       • Agentes estadísticas
 * │
 * ├── engine/backtesting/backtestEngine.ts .... Engine de backtesting existente
 * │   • runDemoBacktest()
 * │   • Integrar con TradingEngine
 * │
 * └── [Otros archivos sin cambios]
 * 
 * docs/
 * └── CARVIPIX_STRATEGY_V1.md .................. Especificación completa
 *     • Objetivo estratégico
 *     • 4 condiciones validación
 *     • Estados de señal
 *     • 10 reglas pending
 */

/**
 * QUICK REFERENCE
 * 
 * CREAR NUEVA SIGNAL:
 * 1. Crear TradingSignal con todos los campos
 * 2. Llenar trendValidation usando TrendValidator.validateTrend()
 * 3. Llenar pullback45M con análisis manual (PENDING cálculos)
 * 4. Llenar entry5M con análisis manual (PENDING trigger)
 * 5. Llenar scoreBreakdown (7 componentes)
 * 6. Crear alerta con CarvipixAlertManager.createSignalAlert()
 * 
 * VALIDAR TENDENCIA:
 * const validation = TrendValidator.validateTrend({
 *   timeframe: '1H',
 *   asset: 'XAUUSD',
 *   currentPrice: 2500.50,
 *   ema20: 2498.00,
 *   ema50: 2495.00,
 *   ema200: 2490.00,
 *   ema20Slope: 0.5,
 *   ema50Slope: 0.3,
 *   ema200Slope: 0.1,
 * });
 * // Retorna: TrendValidation con confidenceLevel A+/A/B/C
 * 
 * CREAR ALERTA:
 * const alertManager = getAlertManager();
 * const alert = alertManager.createSignalAlert(signal);
 * 
 * VERIFICAR STATS:
 * const stats = alertManager.getAlertStats(1); // últimas 24h
 * if (!stats.isWithinTarget) console.log('⚠️ Fuera de rango 3-8/día');
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
