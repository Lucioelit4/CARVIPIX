/**
 * CARVIPIX Strategy Type Definitions
 * Tipos base para la estrategia CARVIPIX v1.0
 * Privado / Admin only
 */

export type CarvipixStrategyVersion = '1.0' | '1.1' | '2.0';
export type StrategyStatus = 'definition' | 'implementation' | 'backtesting' | 'live';
export type Asset = 'XAUUSD' | 'BTCUSD' | 'EURUSD' | 'GBPUSD';
export type Timeframe = '1H' | '45M' | '5M';
export type TrendDirection = 'UP' | 'DOWN' | 'NEUTRAL' | 'UNDEFINED';
export type SignalType = 'SIGNAL_GENERATED' | 'SIGNAL_REJECTED' | 'SIGNAL_INVALIDATED' | 'TRADE_OPENED' | 'TRADE_CLOSED' | 'ALERT_SKIPPED';
export type OrderDirection = 'BUY' | 'SELL';
export type StateTransition = 
  | 'PENDING'
  | 'TREND_DETECTED'
  | 'PULLBACK_DETECTED'
  | 'CONFIRMATION_PENDING'
  | 'CONSENSUS_CHECK'
  | 'SIGNAL_READY'
  | 'ENTRY_TRIGGERED'
  | 'TRADE_OPEN'
  | 'TP1_HIT'
  | 'TP2_TRAILING'
  | 'SL_HIT'
  | 'TRADE_CLOSED'
  | 'NO_TREND'
  | 'PULLBACK_INVALID'
  | 'CONSENSUS_FAILED';

/**
 * Rol de cada timeframe en la estrategia
 */
export interface StrategyTimeframeRole {
  timeframe: Timeframe;
  role: 'primary_trend' | 'confirmation' | 'entry_tactical';
  emas: number[];
  description: string;
}

/**
 * Contexto de tendencia (1H)
 */
export interface TrendContext {
  timeframe: '1H';
  direction: TrendDirection;
  ema20: number;
  ema50: number;
  ema200: number;
  last3CandlesDirection: 'UP' | 'DOWN' | 'MIXED';
  trendStrength: 'STRONG' | 'WEAK' | 'UNCLEAR';
  timestamp: number;
  
  // PENDING: Criterios exactos en v1.1
  criteriaMetPending?: string;
}

/**
 * Contexto de estructura (máximos/mínimos)
 */
export interface StructureContext {
  timeframe: Timeframe;
  lastHighPrice: number;
  lastLowPrice: number;
  lastHighIndex: number;
  lastLowIndex: number;
  
  supportLevels: number[];
  resistanceLevels: number[];
  
  // PENDING: Reglas exactas en v1.1
  structureConfirmed: boolean;
  structureDescription?: string;
}

/**
 * Contexto de retroceso (45M)
 */
export interface PullbackContext {
  timeframe: '45M';
  detectedTime: number;
  pullbackDepthPercent: number;
  
  // PENDING: Criterios exactos min/max en v1.1
  isValidPullback: boolean;
  pullbackInvalidationLevel?: number;
  
  estimatedCompletionPercent?: number;
  description?: string;
}

/**
 * Confirmación de entrada (5M)
 */
export interface EntryConfirmation {
  timeframe: '5M';
  confirmed: boolean;
  confirmationTime: number;
  confirmationPattern: string; // 'EMA_CROSS', 'STRUCTURE_BREAK', 'IMPULSE', etc
  
  // PENDING: Trigger exacto en v1.1
  triggerCriteria?: string;
  priceAtConfirmation?: number;
}

/**
 * Especificación de SL (Stop Loss)
 */
export interface StopLossSpec {
  // PENDING: Cálculo exacto en v1.1
  level: number;
  calculationMethod: 'ATR' | 'STRUCTURE' | 'EMA' | 'PENDING';
  pointsFromEntry: number;
  risksPercent?: number;
}

/**
 * Especificación de TP (Take Profit)
 */
export interface TakeProfitSpec {
  // PENDING: Cálculo exacto en v1.1
  tp1: { level: number; volumePercent: number };
  tp2: { level: number; volumePercent: number };
  tp3: { level: number; volumePercent: number };
  
  maxTradeOpenMinutes?: number;
  trailingStopMethod?: 'ATR' | 'PERCENT' | 'FIXED_POINTS';
}

/**
 * Señal de entrada (completa)
 */
export interface SignalState {
  id: string;
  version: CarvipixStrategyVersion;
  status: StateTransition;
  timestamp: number;
  
  // Mercado
  asset: Asset;
  direction: OrderDirection;
  
  // Análisis
  trendContext: TrendContext;
  structureContext: StructureContext;
  pullbackContext?: PullbackContext;
  entryConfirmation?: EntryConfirmation;
  
  // Consenso
  agentVotes: {
    agentName: string;
    approved: boolean;
    score: number;
    reason: string;
  }[];
  totalAgents: number;
  approvedCount: number;
  confidenceScore: number; // 0-100
  
  // Ready para entrada
  readyForEntry: boolean;
  
  // Rejection reason (si aplica)
  rejectionReason?: string;
}

/**
 * Especificación de riesgo
 */
export interface RiskSpecification {
  entryPrice: number;
  stopLoss: StopLossSpec;
  takeProfits: TakeProfitSpec;
  
  riskAmountUSD: number;
  riskPercentageOfCapital: number;
  positionSize: number;
  positionSizeUnit: 'units' | 'contracts' | 'lots';
  
  estimatedRewardRatio: number; // TP / SL
}

/**
 * Payload de alerta (JSON structure)
 */
export interface AlertPayload {
  alert: {
    id: string;
    timestamp: string; // ISO8601
    version: CarvipixStrategyVersion;
    status: SignalType;
    
    market: {
      asset: Asset;
      direction: OrderDirection;
      timeframe_primary: Timeframe;
      timeframe_confirm: Timeframe;
      timeframe_entry: Timeframe;
    };
    
    price_levels: {
      entry: number;
      entry_type: 'market' | 'pending';
      stop_loss: number;
      tp_level_1: number;
      tp_level_1_volume_pct: number;
      tp_level_2: number;
      tp_level_2_volume_pct: number;
      tp_level_3: number;
      tp_level_3_volume_pct: number;
    };
    
    analysis: {
      trend_context: string;
      pullback_depth_pct: number;
      confirmation_pattern: string;
      structure_level_tested: number;
      structure_confirmed: boolean;
    };
    
    consensus: {
      total_agents: number;
      approved_count: number;
      approval_threshold: number;
      confidence_score: number;
      agents_approved: string[];
      agents_rejected: string[];
    };
    
    risk_metrics: {
      risk_amount_usd: number;
      risk_percentage: number;
      reward_ratio_estimated: number;
      position_size: number;
      position_size_currency: string;
    };
    
    execution_notes: string;
    state_diagram: string;
  };
}

/**
 * Regla pendiente de v1.1
 */
export interface StrategyPendingRule {
  name: string;
  category: 
    | 'trend_detection'
    | 'pullback_validation'
    | 'entry_confirmation'
    | 'stop_loss_calculation'
    | 'take_profit_calculation'
    | 'risk_management'
    | 'news_handling'
    | 'daily_limits'
    | 'score_confidence';
  
  status: 'pending' | 'implemented' | 'backtested';
  description: string;
  
  // Opciones que se están considerando
  candidateImplementations?: string[];
  
  // Versión cuando se espera que se complete
  targetVersion: CarvipixStrategyVersion;
}

/**
 * Estado de backtesting
 */
export interface BacktestingProgress {
  version: CarvipixStrategyVersion;
  status: 'not_started' | 'in_progress' | 'completed';
  
  datasetsTested: {
    asset: Asset;
    startDate: number;
    endDate: number;
    totalCandles: number;
    completedTrades: number;
    winRate: number;
    profitFactor: number;
    maxDrawdown: number;
  }[];
  
  overallStats: {
    totalTrades: number;
    winRate: number;
    profitFactor: number;
    averageRR: number;
    maxDrawdown: number;
    sharpeRatio?: number;
  };
  
  readyForNextPhase: boolean;
  notes?: string;
}

/**
 * Configuración de agentes votantes
 */
export interface AgentConfig {
  name: string;
  purpose: string;
  weightInConsensus: number; // 0-1
  implementationStatus: 'active' | 'pending' | 'stub';
}

/**
 * Configuración completa de estrategia
 */
export interface CarvipixStrategyConfig {
  version: CarvipixStrategyVersion;
  name: 'CARVIPIX';
  status: StrategyStatus;
  
  assets: Asset[];
  timeframes: StrategyTimeframeRole[];
  emas: number[];
  
  agents: AgentConfig[];
  consensusThreshold: number; // Ej: 7 de 11
  alternativeThresholds: {
    strict: number; // Ej: 8/11
    ultraStrict: number; // Ej: 9/11
  };
  
  pendingRules: StrategyPendingRule[];
  
  // Límites (PENDING definición exacta v1.1)
  dailyLimits?: {
    maxTrades?: number;
    maxDrawdownPercent?: number;
  };
  
  backtestingProgress: BacktestingProgress;
}

export type AllTypes = 
  | CarvipixStrategyVersion
  | Asset
  | Timeframe
  | TrendDirection
  | SignalType
  | OrderDirection
  | StateTransition
  | StrategyTimeframeRole
  | TrendContext
  | StructureContext
  | PullbackContext
  | EntryConfirmation
  | StopLossSpec
  | TakeProfitSpec
  | SignalState
  | RiskSpecification
  | AlertPayload
  | StrategyPendingRule
  | BacktestingProgress
  | AgentConfig
  | CarvipixStrategyConfig;
