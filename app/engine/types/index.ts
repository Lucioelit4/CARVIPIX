/**
 * CARVIPIX Trading Engine - Type Definitions
 * Core data models for professional trading analysis
 */

import type { CertifiedInputContract, ResearchProposalEnvelope } from './certifiedData';

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

export type EngineAction = 'EXECUTE_BLOCKED' | 'WAIT' | 'NO_TRADE' | 'ALERT_CREATED';

export type PriorityLevel = 'low' | 'medium' | 'high' | 'critical';

export interface ConflictDescriptor {
  source: string;
  severity: PriorityLevel;
  reason: string;
}

export interface SafetyGateFailure {
  gate: string;
  reason: string;
  reason_isDataMissing?: boolean;
}

export interface SafetyGateEvaluation {
  allPassed: boolean;
  modeProvisional: boolean;
  criticalFailures: SafetyGateFailure[];
}

export type EvidenceSource = 'market' | 'risk' | 'news' | 'session' | 'structure' | 'research' | 'memory' | 'context';

export interface EvidenceItem {
  id: string;
  source: EvidenceSource;
  key: string;
  value: number;
  weight: number;
  confidence: number;
  uncertainty: number;
  context?: Record<string, unknown>;
  createdAt: number;
  expiresAt: number;
}

export interface EvidenceInput {
  items: EvidenceItem[];
}

export interface EvidenceValidationIssue {
  itemId: string;
  reason: string;
  severity: 'warning' | 'critical';
}

export interface EvidenceValidationResult {
  valid: boolean;
  issues: EvidenceValidationIssue[];
}

export interface EvidenceConflict {
  leftId: string;
  rightId: string;
  reason: string;
  severity: PriorityLevel;
}

export interface EvidenceAssessment {
  evidenceCount: number;
  probability: number;
  confidence: number;
  uncertainty: number;
  decisionQuality: number;
  ranking: EvidenceItem[];
  conflicts: EvidenceConflict[];
  explainability: string[];
  valid: boolean;
  issues: EvidenceValidationIssue[];
}

export interface KnowledgeRecord {
  id: string;
  key: string;
  score: number;
  context?: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
  uses: number;
}

export type KnowledgeCategory =
  | 'market_structure'
  | 'risk_management'
  | 'execution_context'
  | 'macro_news'
  | 'session_behavior'
  | 'research_insight'
  | 'meta_learning'
  | 'other';

export type KnowledgeLifecycleState =
  | 'candidate'
  | 'active'
  | 'revalidate'
  | 'degraded'
  | 'retired'
  | 'merged'
  | 'split';

export type KnowledgePriority = 'low' | 'medium' | 'high' | 'critical';

export interface KnowledgeDependency {
  cardId: string;
  required: boolean;
}

export interface KnowledgeRelationship {
  cardId: string;
  relation: 'supports' | 'contradicts' | 'derives' | 'duplicates' | 'clusters_with';
  weight: number;
}

export interface KnowledgeCard {
  cardId: string;
  title: string;
  category: KnowledgeCategory;
  tags: string[];
  dependencies: KnowledgeDependency[];
  relationships: KnowledgeRelationship[];
  summary: string;
  validationScore: number;
  performanceScore: number;
  reliability: number;
  usageCount: number;
  reinforcementSignals: number;
  decayRate: number;
  lastValidatedAt: number;
  lastObservedAt: number;
  createdAt: number;
  updatedAt: number;
  lifecycle: KnowledgeLifecycleState;
  priority: KnowledgePriority;
  metadata?: Record<string, unknown>;
}

export interface KnowledgeConflict {
  leftCardId: string;
  rightCardId: string;
  reason: string;
  severity: PriorityLevel;
}

export interface KnowledgeSimilarity {
  leftCardId: string;
  rightCardId: string;
  score: number;
}

export interface KnowledgeCluster {
  clusterId: string;
  category: KnowledgeCategory;
  members: string[];
  centroidScore: number;
}

export interface KnowledgeEvolutionDecision {
  cardId: string;
  lifecycle: KnowledgeLifecycleState;
  evolvedScore: number;
  agingDays: number;
  shouldStrengthen: boolean;
  shouldDegrade: boolean;
  shouldReinvestigate: boolean;
  shouldRetire: boolean;
  shouldRemove: boolean;
  stillWorking: boolean;
  rationale: string[];
}

export interface KnowledgeMergePlan {
  sourceCardIds: string[];
  targetCardId: string;
}

export interface KnowledgeSplitPlan {
  sourceCardId: string;
  childCardIds: string[];
}

export interface KnowledgeEvolutionReport {
  generatedAt: number;
  decisions: KnowledgeEvolutionDecision[];
  ranking: Array<{
    cardId: string;
    score: number;
    priority: KnowledgePriority;
  }>;
  conflicts: KnowledgeConflict[];
  similarities: KnowledgeSimilarity[];
  clusters: KnowledgeCluster[];
  mergePlans: KnowledgeMergePlan[];
  splitPlans: KnowledgeSplitPlan[];
  summary: {
    totalCards: number;
    activeCards: number;
    revalidateCards: number;
    degradedCards: number;
    retiredCards: number;
  };
}

export interface RuntimeProfileSnapshot {
  section: string;
  elapsedMs: number;
  timestamp: number;
}

export interface BenchmarkResult {
  runId: string;
  iterations: number;
  averageMs: number;
  minMs: number;
  maxMs: number;
  p95Ms: number;
  totalMs: number;
}

export interface NumericSearchSpace {
  min: number;
  max: number;
  step?: number;
}

export interface QuantCandidateConfiguration {
  id: string;
  parameters: Record<string, number>;
  weights: Record<string, number>;
  thresholds: Record<string, number>;
  features: string[];
}

export type OptimizationDirection = 'maximize' | 'minimize';

export interface OptimizationObjective {
  metric: string;
  direction: OptimizationDirection;
  weight: number;
}

export interface OptimizationConstraint {
  target: 'parameters' | 'weights' | 'thresholds';
  key: string;
  min?: number;
  max?: number;
}

export interface FeatureConstraint {
  required?: string[];
  forbidden?: string[];
}

export interface OptimizationSearchConfig {
  gridSamples?: number;
  randomSamples?: number;
  bayesianIterations?: number;
  seed?: number;
}

export interface QuantOptimizationInput {
  baseConfiguration: QuantCandidateConfiguration;
  parameterSpace: Record<string, NumericSearchSpace>;
  weightSpace: Record<string, NumericSearchSpace>;
  thresholdSpace: Record<string, NumericSearchSpace>;
  featureCandidates: string[];
  objectives: OptimizationObjective[];
  constraints?: OptimizationConstraint[];
  featureConstraints?: FeatureConstraint;
  search?: OptimizationSearchConfig;
}

export interface QuantOptimizationEvaluation {
  candidate: QuantCandidateConfiguration;
  metrics: Record<string, number>;
  feasible: boolean;
  discarded: boolean;
  discardReasons: string[];
  objectiveScore: number;
  multiObjectiveScore: number;
  evidenceScore: number;
  confidenceScore: number;
  probabilityScore: number;
  knowledgeScore: number;
  featureScore: number;
}

export interface OptimizerDelta {
  improved: string[];
  worsened: string[];
}

export interface OptimizationSearchDiagnostics {
  gridEvaluated: number;
  randomEvaluated: number;
  bayesianEvaluated: number;
  cacheHits: number;
  totalEvaluated: number;
  discarded: number;
}

export interface OptimizationDashboardSnapshot {
  totalRuns: number;
  bestRunId?: string;
  bestScore: number;
  averageScore: number;
  latestRunId?: string;
  topCandidates: Array<{
    runId: string;
    candidateId: string;
    score: number;
    feasible: boolean;
  }>;
}

export interface QuantOptimizationResult {
  runId: string;
  createdAt: number;
  bestConfiguration: QuantCandidateConfiguration;
  bestEvaluation: QuantOptimizationEvaluation;
  ranking: QuantOptimizationEvaluation[];
  discarded: QuantOptimizationEvaluation[];
  diagnostics: OptimizationSearchDiagnostics;
  weightOptimizer: OptimizerDelta;
  parameterOptimizer: OptimizerDelta;
  thresholdOptimizer: OptimizerDelta;
  featureOptimizer: {
    selected: string[];
    dropped: string[];
  };
  evidenceOptimizer: {
    before: number;
    after: number;
  };
  confidenceOptimizer: {
    before: number;
    after: number;
  };
  probabilityOptimizer: {
    before: number;
    after: number;
  };
  knowledgeOptimizer: {
    before: number;
    after: number;
  };
  optimizationRanking: Array<{
    position: number;
    candidateId: string;
    score: number;
    feasible: boolean;
  }>;
  report: string[];
  dashboard: OptimizationDashboardSnapshot;
}

export interface CreateAlertOptions {
  conflicts?: ConflictDescriptor[];
  priority?: PriorityLevel;
  executionRequested?: boolean;
  dataIntegrityValid?: boolean;
  certifiedInput?: CertifiedInputContract;
  researchProposalEnvelope?: ResearchProposalEnvelope;
  evidenceInput?: EvidenceInput;
  knowledgeHints?: string[];
  contextSnapshot?: Record<string, unknown>;
}

export interface LifecycleTransitionRecord {
  from: AlertState;
  to: AlertState;
  allowed: boolean;
  reason: string;
  timestamp: number;
}

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
  action?: EngineAction;
  priority?: PriorityLevel;
  conflicts?: ConflictDescriptor[];
  
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
  safeMode: boolean;
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

export type {
  CertifiedDatasetEnvelope,
  CertifiedDatasetSource,
  CertifiedDatasetStatus,
  CertifiedInputContract,
  ResearchProposalEnvelope,
} from './certifiedData';

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
