/**
 * Community Publisher V1 — Types & Contracts
 * Fase 2: Núcleo interno
 */

// ─── Publication Types ────────────────────────────────────────────────────────

export type PublicationType =
  | 'FREE_ALERT'
  | 'TRADE_RESULT'
  | 'MARKET_STATUS'
  | 'OPPORTUNITY_DEVELOPING'
  | 'EDUCATIONAL_OR_PROMOTIONAL';

export const PRIORITY_MAP: Record<PublicationType, number> = {
  FREE_ALERT: 1,
  TRADE_RESULT: 2,
  MARKET_STATUS: 3,
  OPPORTUNITY_DEVELOPING: 4,
  EDUCATIONAL_OR_PROMOTIONAL: 5,
};

export type PublicationStatus =
  | 'PENDING'
  | 'READY'
  | 'DELIVERED'
  | 'FAILED'
  | 'SKIPPED'
  | 'DEAD_LETTER'
  | 'CANCELLED';

export type SkipReason =
  | 'SKIPPED_AUTOMATION_DISABLED'
  | 'SKIPPED_INVALID_INPUT'
  | 'SKIPPED_SECURITY'
  | 'SKIPPED_ELIGIBILITY'
  | 'SKIPPED_DAILY_LIMIT'
  | 'SKIPPED_DUPLICATE'
  | 'SKIPPED_EXPIRED'
  | 'SKIPPED_NO_TRADE'
  | 'SKIPPED_INACTIVE_DECISION'
  | 'SKIPPED_NO_PRIOR_ALERT';

export type OriginType = 'PAPER' | 'DEMO' | 'LIVE';

export type Decision =
  | 'ENTER_BUY'
  | 'ENTER_SELL'
  | 'WAIT'
  | 'NO_TRADE'
  | 'CONDITIONAL_ENTRY';

// ─── Publication Record ────────────────────────────────────────────────────────

export interface Publication {
  publication_id: string;
  publication_type: PublicationType;
  analysis_id: string;
  signal_id: string;
  paper_trade_id?: string;
  channel_id: string;
  priority: number;
  status: PublicationStatus;
  skip_reason?: SkipReason;
  skip_detail?: string;
  created_at: string;
  expires_at?: string;
  content_preview: string;     // texto seguro sin datos privados
  template_id?: string;
  template_variant?: string;
  attempts: number;
  max_attempts: number;
  last_error?: string;
  last_attempt_at?: string;
  delivered_at?: string;
  telegram_message_id?: number;
  instrument: string;
  origin: OriginType;
  test_only: boolean;
  idempotency_key: string;     // signal_id:channel_id:publication_type
  linked_publication_id?: string;  // CP-FREE_ALERT-* si es TRADE_RESULT vinculado
  metadata: Record<string, unknown>;  // solo datos públicos permitidos
}

// ─── Event Contracts ─────────────────────────────────────────────────────────

export interface AnalysisPublicBlock {
  entry?: number;
  stop_loss?: number;
  take_profit?: number;
  risk_reward?: number;
  validity_minutes?: number;
  expiry_utc_ms?: number;
  market_context?: string;
  confidence_level?: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface AnalysisCompletedEvent {
  event_type: 'ANALYSIS_COMPLETED';
  analysis_id: string;
  signal_id: string;
  instrument: string;
  timestamp_utc_ms: number;
  decision: Decision;
  public_status: string;
  origin: OriginType;
  analysis_public: AnalysisPublicBlock;
}

export interface TradeResultPublicBlock {
  result: 'WIN' | 'LOSS' | 'BREAKEVEN';
  pnl_pips?: number;
  pnl_percent?: number;
  duration_minutes?: number;
  close_reason?: string;
}

export interface TradeClosedEvent {
  event_type: 'TRADE_CLOSED';
  paper_trade_id: string;
  signal_id: string;
  analysis_id: string;
  instrument: string;
  timestamp_utc_ms: number;
  origin: OriginType;
  trade_result_public: TradeResultPublicBlock;
}

export type CPEvent = AnalysisCompletedEvent | TradeClosedEvent;

// ─── Filter / Processor Results ──────────────────────────────────────────────

export interface FilterResult {
  passed: boolean;
  status?: SkipReason;
  reason?: string;
}

export interface ProcessorResult {
  accepted: boolean;
  publication?: Publication;
  skip_reason?: SkipReason;
  skip_detail?: string;
  processing_id: string;
  processed_at: string;
}

// ─── Config ──────────────────────────────────────────────────────────────────

export interface CPConfig {
  paused: boolean;
  auto_send: boolean;        // SIEMPRE false en Fase 2
  test_only: boolean;
  timezone: string;
  max_free_alerts_per_day: number;
  max_attempts: number;
  updated_at: string;
}

export const DEFAULT_CONFIG: CPConfig = {
  paused: false,
  auto_send: false,
  test_only: true,
  timezone: 'America/Mazatlan',
  max_free_alerts_per_day: 2,
  max_attempts: 3,
  updated_at: new Date().toISOString(),
};

// ─── Daily Counters ───────────────────────────────────────────────────────────

export interface DailyCounters {
  [date: string]: {
    [channelId: string]: number;
  };
}

// ─── Queue Stats ─────────────────────────────────────────────────────────────

export interface QueueStats {
  total: number;
  pending: number;
  ready: number;
  delivered: number;
  failed: number;
  skipped: number;
  dead_letter: number;
  cancelled: number;
  free_alerts_today: number;
  daily_limit: number;
  last_processed_at?: string;
  last_error?: string;
  auto_send: boolean;
  paused: boolean;
  test_only: boolean;
}
