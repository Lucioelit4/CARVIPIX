export type ServiceDateLike = Date;

export type ServiceAlertType = "signal" | "risk" | "news" | "technical";
export type ServiceAlertPriority = "low" | "medium" | "high" | "critical";
export type ServiceAlertStatus = "active" | "triggered" | "resolved" | "archived";

export interface ServiceAlertRecord {
  id: string;
  type: ServiceAlertType;
  symbol: string;
  title: string;
  description: string;
  priority: ServiceAlertPriority;
  status: ServiceAlertStatus;
  timestamp: ServiceDateLike;
  actionUrl?: string;
  data?: Record<string, unknown>;
}

export interface ServiceAlertStats {
  total: number;
  active: number;
  triggered: number;
  resolved: number;
}

export interface ServiceAlertRule {
  id: string;
  userId: string;
  name: string;
  enabled: boolean;
  condition: string;
  symbols: string[];
  alertTypes: ServiceAlertType[];
  createdAt: Date;
}

export interface ServiceAlertHistory {
  id: string;
  userId: string;
  alertId: string;
  action: "viewed" | "dismissed" | "triggered";
  timestamp: Date;
}

export interface ServiceResultsBySource {
  alertas: {
    totalTrades: number;
    winRate: number;
    profitLoss: number;
  };
  bot: {
    totalTrades: number;
    winRate: number;
    profitLoss: number;
    avgTrade: number;
  };
  capital: {
    investorsCount: number;
    totalManaged: number;
    avgReturn: number;
    totalProfit: number;
  };
  fondeo: {
    accountsManaged: number;
    successRate: number;
    totalCapital: number;
  };
}

export interface ServicePlatformResults {
  period: "monthly" | "yearly" | "all-time";
  generatedAt: Date;
  bySource: ServiceResultsBySource;
  combinedStats: {
    totalTrades: number;
    avgWinRate: number;
    totalProfit: number;
    userCount: number;
  };
  masterSignal?: {
    signalId: string;
    analysisId: string;
    symbol: string;
    decision: "BUY" | "SELL" | "NONE";
    entry: number | null;
    stopLoss: number | null;
    takeProfit: number | null;
    strategyId: string;
    status: "SHADOW" | "CREATED" | "CONDITIONAL" | "ACTIVE" | "CANCELLED" | "EXPIRED" | "TP_HIT" | "SL_HIT" | "CLOSED";
  } | null;
}

export interface ServiceResultsHistoryRecord {
  id: string;
  month: string;
  metrics: ServiceResultsBySource;
}

export interface ServiceDashboardSnapshot {
  generatedAt: Date;
  activeAlerts: number;
  recentSignals: number;
  engineHealth: "healthy" | "degraded" | "offline";
}

export interface ServiceBotSnapshot {
  generatedAt: Date;
  runningInstances: number;
  connectedAccounts: number;
  health: "healthy" | "degraded" | "offline";
}

export interface ServiceCapitalSnapshot {
  generatedAt: Date;
  investorsCount: number;
  totalManaged: number;
  totalProfit: number;
}

export interface ServiceFundingSnapshot {
  generatedAt: Date;
  activePrograms: number;
  approvedAccounts: number;
  totalCapital: number;
}

export interface ServiceAdminSnapshot {
  generatedAt: Date;
  engineStatus: "healthy" | "degraded" | "offline";
  activeUsers: number;
  pendingIncidents: number;
  masterSignal?: {
    signalId: string;
    analysisId: string;
    decision: "BUY" | "SELL" | "NONE";
    strategyId: string;
    status: "SHADOW" | "CREATED" | "CONDITIONAL" | "ACTIVE" | "CANCELLED" | "EXPIRED" | "TP_HIT" | "SL_HIT" | "CLOSED";
    source: "CADP_V2";
    validationStatus: "VALIDATED" | "PENDING";
    mode: "SHADOW" | "PRODUCTION";
    humanReviewRequired: boolean;
    autoExecutionEligible: boolean;
  } | null;
}

export interface ServiceAIContext {
  generatedAt: Date;
  summary: string;
  contextVersion: string;
}

export interface ServiceHistoryEntry {
  id: string;
  module:
    | "alerts"
    | "bot"
    | "capital"
    | "funding"
    | "dashboard"
    | "results"
    | "admin"
    | "ai"
    | "stats";
  timestamp: Date;
  title: string;
  detail: string;
  signalId?: string;
  analysisId?: string;
  legacy?: boolean;
}

export interface ServiceMasterSignal {
  signalId: string;
  analysisId: string;
  symbol: string;
  analysisProfile: string;
  selectedStrategyId: string;
  direction: "BUY" | "SELL" | "NONE";
  entry: number | null;
  stopLoss: number | null;
  takeProfit: number | null;
  grossRR: number | null;
  netRR: number | null;
  expiresAt: string | null;
  status: "SHADOW" | "CREATED" | "CONDITIONAL" | "ACTIVE" | "CANCELLED" | "EXPIRED" | "TP_HIT" | "SL_HIT" | "CLOSED";
  humanReviewRequired: boolean;
  autoExecutionEligible: boolean;
  createdAt: string;
}

export interface ServiceDeliveryReference {
  signalId: string;
  analysisId: string;
  signalVersion: string;
}

export interface ServiceDeliveryJob {
  id: string;
  queue: string;
  type: string;
  status: "queued" | "processing" | "completed" | "failed";
  attempts: number;
  maxRetries: number;
  lastError?: string;
  createdAt: Date;
  reference: ServiceDeliveryReference;
}

export interface ServiceStatsSnapshot {
  generatedAt: Date;
  totalEvents: number;
  activeUsers: number;
  avgLatencyMs: number;
}

export type ServicePlanType = "demo" | "pro" | "premium" | "enterprise";

export interface ServicePlanPermissions {
  alertas: boolean;
  bot: boolean;
  capital: boolean;
  fondeo: boolean;
  reportes: boolean;
  soporte: boolean;
  aiBriefing: boolean;
  maxAlerts: number;
  maxBots: number;
}

export interface ServiceUserProfile {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  plan: ServicePlanType;
  estado: "activo" | "inactivo" | "suspendido";
  fechaActivacion: Date;
  fechaVencimiento?: Date;
  permisos: ServicePlanPermissions;
  verificado: boolean;
}

export interface ServiceMembership {
  userId: string;
  plan: ServicePlanType;
  estado: "activo" | "cancelado" | "vencido";
  fechaInicio: Date;
  fechaFin?: Date;
  renovacionAutomatica: boolean;
}

export type ServicePaymentProduct =
  | "bot"
  | "capital"
  | "fondeo"
  | "plan_pro"
  | "plan_premium"
  | "plan_enterprise";

export type ServicePaymentStatus = "pending" | "completed" | "failed" | "refunded";
export type ServicePaymentMethod = "card" | "crypto" | "bank_transfer";

export interface ServiceProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: "USD" | "USDT" | "BTC";
  type: ServicePaymentProduct;
  oneTime: boolean;
  features?: string[];
}

export interface ServicePayment {
  id: string;
  userId: string;
  productId: string;
  amount: number;
  currency: string;
  status: ServicePaymentStatus;
  method?: ServicePaymentMethod;
  fecha: Date;
  referenceId?: string;
}

export interface ServiceOrder {
  id: string;
  userId: string;
  productId: string;
  quantity: number;
  total: number;
  currency: string;
  status: "pending" | "processing" | "completed" | "cancelled";
  paymentId?: string;
  fechaCreacion: Date;
  fechaCompletado?: Date;
}

export type ServiceBotStatus = "inactive" | "running" | "paused" | "error";
export type ServiceBotStrategy = "grid" | "momentum" | "breakout" | "scalping";

export interface ServiceBotLicense {
  userId: string;
  licenseKey: string;
  purchaseDate: Date;
  expiryDate?: Date;
  active: boolean;
  brokerConnected?: "MT4" | "MT5";
}

export interface ServiceBotStats {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  profitLoss: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
}

export interface ServiceBotInstance {
  id: string;
  userId: string;
  name: string;
  strategy: ServiceBotStrategy;
  status: ServiceBotStatus;
  symbol: string;
  riskLevel: "low" | "medium" | "high";
  configuration: Record<string, unknown>;
  createdAt: Date;
  startedAt?: Date;
  stats: ServiceBotStats;
}

export interface ServiceBotUpdate {
  version: string;
  releaseDate: Date;
  features: string[];
  improvements: string[];
  bugFixes: string[];
}

export type ServiceCapitalStatus = "pending" | "active" | "paused" | "closed";
export type ServiceMovementType = "deposit" | "withdrawal" | "profit" | "fee";

export interface ServiceCapitalAccount {
  accountId: string;
  userId: string;
  initialCapital: number;
  currentBalance: number;
  utilidad: number;
  participacionCliente: number;
  participacionCARVIPIX: number;
  status: ServiceCapitalStatus;
  fechaInicio: Date;
  monthlyReturn: number;
  annualReturn: number;
}

export interface ServiceCapitalMovement {
  id: string;
  accountId: string;
  type: ServiceMovementType;
  amount: number;
  fecha: Date;
  description: string;
  balanceAfter: number;
}

export interface ServiceMonthlyReport {
  accountId: string;
  mes: string;
  capitalInicial: number;
  capitalFinal: number;
  utilidad: number;
  participacionCliente: number;
  participacionCARVIPIX: number;
  rendimiento: number;
}

export interface ServiceInvestorStats {
  totalCapitalManaged: number;
  totalInvestors: number;
  avgReturn: number;
  topMonth: {
    month: string;
    return: number;
  };
}

export interface ServiceOperationRecord {
  id: string;
  userId: string;
  accountId?: string;
  symbol: string;
  side: string;
  status: string;
  pnl: number;
  executedAt: Date;
  metadata: Record<string, unknown>;
}

export interface ServiceOperationSummary {
  totalOperations: number;
  winningOperations: number;
  losingOperations: number;
  totalPnl: number;
  winRate: number;
}
