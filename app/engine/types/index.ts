/**
 * CARVIPIX Trading Engine - Type Definitions
 * Core data models for professional trading analysis
 */

// ============================================
// AGENT TYPES
// ============================================

export type AgentType =
  | 'MarketRegimeAnalyst'
  | 'TrendAnalyst'
  | 'StructureAnalyst'
  | 'MomentumAnalyst'
  | 'PullbackAnalyst'
  | 'SessionAnalyst'
  | 'NewsAnalyst'
  | 'RiskManager'
  | 'ConfidenceScoring'
  | 'TradeValidator'
  | 'LearningEngine';

export interface AgentScore {
  agent: AgentType;
  score: number; // 0-100
  reasoning: string; // Why this score?
  confidence: number; // 0-100
  timestamp: number;
  keyMetrics?: Record<string, number | string>;
}

// ============================================
// DECISION & CONSENSUS
// ============================================

export type DecisionOutcome = 'approved' | 'rejected' | 'pending';

export interface ConsensusResult {
  outcome: DecisionOutcome;
  agentScores: AgentScore[];
  approvalCount: number;
  rejectionCount: number;
  consensusThreshold: number;
  averageScore: number;
  overallConfidence: number;
  reasonForDecision: string;
  timestamp: number;
}

// ============================================
// ALERT STATES
// ============================================

export type AlertState =
  | 'activa' // Active, waiting for TP or SL
  | 'tp' // Took profit
  | 'sl' // Stop loss hit
  | 'breakeven' // Moved to breakeven
  | 'cancelada' // Manually cancelled
  | 'caducada' // Expired (time-based)
  | 'pendiente'; // Waiting for consensus approval

export interface TradeAlert {
  id: string;
  symbol: string;
  type: 'compra' | 'venta';
  state: AlertState;
  
  // Price levels
  entryPrice: number;
  takeProfitPrice: number;
  stopLossPrice: number;
  
  // Analysis
  timeframe: string;
  riskRewardRatio: number;
  
  // Decision
  consensusResult: ConsensusResult;
  
  // Timestamps
  createdAt: number;
  triggeredAt?: number;
  closedAt?: number;
  
  // Metadata
  reasoning: string; // Plain English explanation
  tags: string[];
  source?: string; // e.g., "demo", "mt4", "mt5"
  
  // Performance (if closed)
  profitLossPercentage?: number;
  profitLossAmount?: number;
}

// ============================================
// DECISION LOG
// ============================================

export interface DecisionLogEntry {
  id: string;
  timestamp: number;
  
  // What was evaluated
  symbol: string;
  type: 'compra' | 'venta';
  timeframe: string;
  
  // Analysis result
  consensus: ConsensusResult;
  
  // Action taken
  alertCreated?: string; // Alert ID if created
  reason: string;
}

// ============================================
// TRADE SIGNAL
// ============================================

export interface TradeSignal {
  id: string;
  timestamp: number;
  
  symbol: string;
  type: 'compra' | 'venta';
  timeframe: string;
  
  // Price targets
  entryPrice: number;
  takeProfitPrice: number;
  stopLossPrice: number;
  
  // Quality metrics
  consensusScore: number; // 0-100
  confidenceScore: number; // 0-100
  riskRewardRatio: number;
  
  // Reasoning
  primaryReason: string;
  agentContributions: string[]; // List of agents that approved
  riskWarnings: string[]; // Any risk factors
  
  // Status
  status: 'ready_for_approval' | 'approved' | 'rejected';
  approvalTimestamp?: number;
}

// ============================================
// ENGINE STATE
// ============================================

export interface EngineMetrics {
  totalAlertsGenerated: number;
  activeAlerts: number;
  closedAlerts: number;
  successfulTrades: number;
  failedTrades: number;
  averageWinRate: number;
  averageRiskReward: number;
  consensusApprovalRate: number;
  lastDecisionTime: number;
}

export interface EngineState {
  isRunning: boolean;
  lastUpdate: number;
  alerts: TradeAlert[];
  decisionLog: DecisionLogEntry[];
  metrics: EngineMetrics;
  agents: AgentType[];
}

// ============================================
// ENGINE CONFIGURATION
// ============================================

export interface EngineConfig {
  consensusThreshold: number; // How many agents (9/11)
  confidenceThreshold: number; // Min 70+
  timeframesAnalyzed: string[]; // ['1H', '4H', 'D']
  maxActiveAlerts: number; // Max concurrent alerts
  alertExpiry: number; // milliseconds
  enableLearning: boolean;
}

// ============================================
// LEARNING DATA
// ============================================

export interface TradeOutcome {
  alertId: string;
  symbol: string;
  type: 'compra' | 'venta';
  entryPrice: number;
  exitPrice: number;
  outcome: 'win' | 'loss' | 'breakeven';
  profitPercentage: number;
  agentScores: AgentScore[];
  timestamp: number;
}

// ============================================
// MARKET DATA TYPES (Datos Reales)
// ============================================

// Re-export all market data types from marketData.ts
export type {
  Timeframe,
  Asset,
  Candle,
  Tick,
  TechnicalIndicators,
  MarketData,
  DataQuality,
  DataError,
  ConnectionState,
  DataConfig,
  DataHealthStatus,
  DataHealthResponse,
} from './marketData';

// ============================================
// REAL DATA PROVIDER TYPES
// ============================================

// Re-export real data provider types
export type {
  RealProviderConnectionState,
  LatencyStats,
  ConnectionEvent,
  ProviderOperationLog,
  RealProviderConfig,
  RealProviderState,
  ProviderCredentials,
  ProviderHealthCheck,
} from './realDataProvider';

// ============================================
// BROKER PROVIDER RESOLUTION TYPES
// ============================================

export type {
  BrokerProviderId,
  ProviderFallbackPolicy,
  ProviderSelectionConfig,
  ProviderResolution,
} from './brokerProvider';

// ============================================
// BACKTESTING TYPES (Privado - Admin Only)
// ============================================

// Re-export backtesting types
export type {
  BacktestConfig,
  BacktestTrade,
  BacktestResult,
  BacktestMetrics,
  BacktestStatus,
  BacktestError,
  BacktestWarning,
  BacktestSession,
  BacktestReport,
} from './backtesting';
