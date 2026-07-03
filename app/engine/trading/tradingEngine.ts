/**
 * CARVIPIX Trading Engine
 * Motor central: recibe datos, ejecuta reglas, valida señales, guarda resultados
 * Privado / Admin only
 */

export type SignalState =
  | 'PENDING'
  | 'ACTIVE'
  | 'TP_HIT'
  | 'SL_HIT'
  | 'BREAK_EVEN'
  | 'CANCELLED'
  | 'EXPIRED';

export type TrendConfidenceLevel = 'A+' | 'A' | 'B' | 'C';
export type OrderDirection = 'BUY' | 'SELL';
export type AlertType = 'SIGNAL' | 'UPDATE' | 'CLOSE' | 'CANCEL';

/**
 * Condiciones de tendencia (4 total)
 * Se cumplen individualmente, luego se clasifican A+/A/B/C
 */
export interface TrendCondition {
  name: 'PRICE_VS_EMA200' | 'EMA_ORDER' | 'EMA_SLOPE' | 'STRUCTURE';
  met: boolean;
  score: number; // 0-25 (cada condición = 25% del 100)
  reason: string;
  timestamp: number;
}

/**
 * Validación de tendencia por niveles
 */
export interface TrendValidation {
  timeframe: '1H';
  direction: OrderDirection | 'NEUTRAL';
  confidenceLevel: TrendConfidenceLevel;
  
  // 4 condiciones evaluadas
  conditions: TrendCondition[];
  
  // Score agregado (0-100)
  totalScore: number;
  
  // Detalles por condición
  priceVsEMA200: {
    met: boolean;
    price: number;
    ema200: number;
    distance: number; // pips/puntos
    reasoning: string; // PENDING: criterio exacto
  };
  
  emaOrder: {
    met: boolean;
    ema20: number;
    ema50: number;
    ema200: number;
    expectedOrder: string; // PENDING: qué orden es válida (20>50>200 / otro)
    actualOrder: string;
  };
  
  emaSlope: {
    met: boolean;
    ema20Slope: number;
    ema50Slope: number;
    ema200Slope: number;
    slopeDirection: OrderDirection | 'FLAT'; // PENDING: threshold para FLAT
    reasoning: string;
  };
  
  structure: {
    met: boolean;
    lastHighPrice: number;
    lastLowPrice: number;
    higherHighs: boolean; // para UP
    higherLows: boolean;  // para UP
    lowerHighs: boolean;  // para DOWN
    lowerLows: boolean;   // para DOWN
    priority: 'OVERRIDE_OTHERS' | 'CONFIRM' | 'SECONDARY'; // Estructura tiene prioridad
    contradicts: boolean; // Si estructura contradice dirección
  };
  
  timestamp: number;
}

/**
 * Contexto de retroceso en 45M
 */
export interface PullbackContext {
  timeframe: '45M';
  detected: boolean;
  
  // PENDING: criterios exactos v1.1
  pullbackDepthPercent?: number;
  pullbackType?: string; // 'SHALLOW' | 'NORMAL' | 'DEEP' | PENDING
  pullbackStage?: string; // 'EARLY' | 'MID' | 'LATE' | PENDING
  
  lastSwingHigh: number;
  lastSwingLow: number;
  currentPrice: number;
  
  isValidPullback: boolean; // PENDING: validación
  invalidationLevel?: number;
  
  timestamp: number;
}

/**
 * Confirmación de entrada en 5M
 */
export interface EntryConfirmation {
  timeframe: '5M';
  confirmed: boolean;
  
  // PENDING: trigger exacto v1.1
  triggerPattern?: string; // 'EMA_CROSS' | 'STRUCTURE_BREAK' | 'IMPULSE' | etc
  triggerPrice?: number;
  
  priceAction?: {
    lastCandle: { open: number; high: number; low: number; close: number };
    candle2: { open: number; high: number; low: number; close: number };
    pattern?: string; // PENDING
  };
  
  emaSignal?: {
    ema20: number;
    ema50: number;
    crossover?: boolean;
    direction?: OrderDirection;
  };
  
  structureBreak?: {
    level: number;
    broken: boolean;
    closureType?: string; // PENDING
  };
  
  isValidEntry: boolean; // PENDING: validación
  timestamp: number;
}

/**
 * Especificación de Risk-Reward
 */
export interface RiskRewardSpec {
  // PENDING: cálculos exactos v1.1
  entryPrice: number;
  
  stopLoss: {
    level: number;
    pointsFromEntry: number;
    calculationMethod?: string; // 'ATR' | 'STRUCTURE' | 'EMA' | PENDING
  };
  
  takeProfit: {
    tp1: { level: number; volumePercent: number };
    tp2: { level: number; volumePercent: number; trailing?: boolean };
    tp3: { level: number; volumePercent: number };
  };
  
  riskAmount: number;
  rewardAmount: number;
  ratio: number; // reward/risk (ej: 1.5 = 1:1.5)
  
  positionSize?: number; // PENDING: cálculo
  leverage?: number; // PENDING: máximo permitido
}

/**
 * Score de señal - desglose completo
 */
export interface SignalScoreBreakdown {
  // Cada componente suma 0-20 (total 100)
  
  trendScore: {
    value: number; // 0-20
    level: TrendConfidenceLevel;
    reasoning: string;
  };
  
  emaScore: {
    value: number; // 0-20
    ema20Position: string; // PENDING
    ema50Position: string; // PENDING
    ema200Position: string; // PENDING
    reasoning: string;
  };
  
  structureScore: {
    value: number; // 0-20
    swingHighs: boolean;
    swingLows: boolean;
    reasoning: string;
  };
  
  pullbackScore: {
    value: number; // 0-20
    depth: string;
    stage: string;
    reasoning: string;
  };
  
  entryScore: {
    value: number; // 0-20
    pattern: string;
    confirmation: boolean;
    reasoning: string;
  };
  
  riskScore: {
    value: number; // 0-20
    riskRewardRatio: number;
    positionSize: string;
    reasoning: string;
  };
  
  confidenceScore: {
    value: number; // 0-20 (resumen de confianza general)
    alignmentMultiTF: number; // % de alineación 1H-45M-5M
    reasoning: string;
  };
  
  totalScore: number; // suma 0-100
}

/**
 * Señal de trading completa
 */
export interface TradingSignal {
  id: string;
  
  // Identidad
  version: '1.0' | '1.1' | string;
  timestamp: number;
  state: SignalState;
  alertType: AlertType;
  
  // Mercado
  asset: 'XAUUSD' | 'BTCUSD' | 'EURUSD' | 'GBPUSD';
  direction: OrderDirection;
  
  // Análisis multi-timeframe
  trend1H: TrendValidation;
  pullback45M: PullbackContext;
  entry5M: EntryConfirmation;
  
  // Especificación de entrada
  entry: {
    price: number;
    orderType: 'MARKET' | 'PENDING';
  };
  
  // Riesgo y recompensa
  riskReward: RiskRewardSpec;
  
  // Score desglosado
  scoreBreakdown: SignalScoreBreakdown;
  
  // Estado de ejecución (PENDING: implementar)
  execution?: {
    openedAt?: number;
    openPrice?: number;
    closedAt?: number;
    closePrice?: number;
    closeReason?: 'TP1' | 'TP2' | 'TP3' | 'SL' | 'BREAK_EVEN' | 'CANCELLED' | 'EXPIRED';
    profit?: number;
    profitPercent?: number;
  };
  
  // Notas
  reasoning: string;
  warnings?: string[];
}

/**
 * Alerta para operador
 */
export interface CarvipixAlert {
  id: string;
  timestamp: number;
  type: AlertType; // SIGNAL, UPDATE, CLOSE, CANCEL
  
  signal: TradingSignal;
  
  // Formato legible
  message: string;
  
  // Acciones sugeridas
  suggestedAction?: string;
  
  // Privacidad
  private: true; // Siempre privado
  adminOnly: true;
}

/**
 * Estado de backtesting
 */
export interface BacktestResult {
  signalId: string;
  signal: TradingSignal;
  
  executed: boolean;
  
  // Resultados (PENDING: cálculos)
  result?: {
    entryPrice: number;
    exitPrice: number;
    pipsProfit: number;
    percentProfit: number;
    won: boolean;
    reason: 'TP' | 'SL' | 'MANUAL_EXIT' | 'EXPIRED';
  };
}

/**
 * Estadísticas de sesión / período
 */
export interface TradingStats {
  period: {
    start: number;
    end: number;
  };
  
  totalSignals: number;
  executedTrades: number;
  
  // Resultados
  wins: number;
  losses: number;
  winRate: number; // % (objetivo 75-85%)
  
  totalPips: number;
  averagePips: number;
  maxProfit: number;
  maxLoss: number;
  
  // Risk-Reward
  averageRR: number;
  
  // Confianza
  averageSignalScore: number;
  
  // Alertas
  totalAlerts: number;
}

/**
 * Interfaz del Trading Engine
 */
export interface ITradingEngine {
  // Entrada de datos
  feedCandle(candle: {
    timestamp: number;
    asset: string;
    timeframe: string;
    o: number; // open
    h: number; // high
    l: number; // low
    c: number; // close
    v: number; // volume
  }): Promise<void>;

  // Análisis
  analyzeTrend(timeframe: '1H', asset: string): Promise<TrendValidation>;
  analyzeRetroceso(timeframe: '45M', asset: string): Promise<PullbackContext>;
  analyzeEntry(timeframe: '5M', asset: string): Promise<EntryConfirmation>;

  // Generación de señales
  generateSignal(
    trend: TrendValidation,
    pullback: PullbackContext,
    entry: EntryConfirmation
  ): Promise<TradingSignal | null>;

  // Alertas
  createAlert(signal: TradingSignal): Promise<CarvipixAlert>;

  // Estadísticas
  getStats(period: { start: number; end: number }): Promise<TradingStats>;
}

/**
 * Factory para crear instancia del engine
 */
export class TradingEngineFactory {
  static createEngine(): ITradingEngine {
    // PENDING: implementación
    throw new Error('TradingEngine not yet implemented');
  }
}
