import type {
  CanonicalSymbol,
  MarketVisualState,
  ScenarioClassification,
} from "@/app/ai/cadpV2/typesMaestroV3";

export type CommunityPublicationType =
  | "SESSION_OPEN"
  | "MARKET_STATUS"
  | "NO_TRADE_WAIT"
  | "MATERIAL_CHANGE"
  | "GENERAL_ANALYSIS"
  | "OFFICIAL_ALERT_CONTEXT"
  | "ACTIVE_OPERATION"
  | "OFFICIAL_RESULT"
  | "DAILY_CLOSE";

export type CommunityEditorialSource =
  | "MARKET_STATE"
  | "ANALYSIS_PUBLIC"
  | "OFFICIAL_SIGNAL_STATUS"
  | "OFFICIAL_OPERATION_STATUS"
  | "VERIFIED_ECONOMIC_CALENDAR"
  | "APPROVED_INSTITUTIONAL_CONTENT";

export type CommunitySession = "LONDON" | "NEW_YORK" | "TRANSITION" | "DAILY_CLOSE" | "BTC_24_7" | "OFF_SESSION";

export interface CommunityEditorialContext {
  category_hint?: CommunityPublicationType;
  source: CommunityEditorialSource;
  official_status?: "ACTIVE" | "TP_HIT" | "SL_HIT" | "CLOSED";
  material_change?: boolean;
  reason: string;
}

export interface CommunityMarketDossier {
  dossier_id: string;
  analysis_id: string;
  asset: CanonicalSymbol;
  market_state: MarketVisualState;
  context: string;
  reasons: string[];
  scenarios: string[];
  risk_level: "LOW" | "MEDIUM" | "HIGH";
  volatility: "LOW" | "NORMAL" | "HIGH";
  relevant_news: Array<{
    event_name: string;
    scheduled_iso: string;
    impact: "LOW" | "MEDIUM" | "HIGH";
  }>;
  scenario_classification: ScenarioClassification;
  timestamp: string;
  editorial: CommunityEditorialContext;
}

export interface CommunityContent {
  title: string;
  body: string;
  type: CommunityPublicationType;
  disclaimer: string;
}

export interface CommunityImage {
  image_id: string;
  mime_type: "image/png" | "image/jpeg" | "image/webp";
  bytes_base64: string;
  prompt_version: string;
  generated_at: string;
}

export interface CommunityPublication {
  publication_id: string;
  dossier_id: string;
  analysis_id: string;
  asset: CanonicalSymbol;
  content: CommunityContent;
  image: CommunityImage | null;
  category: CommunityPublicationType;
  source: CommunityEditorialSource;
  reason: string;
  content_hash: string;
  semantic_key: string;
  model_used: string;
  approximate_cost_usd: number;
  total_time_ms: number;
  labels: ["INFORMATIVO", "NO ES ALERTA", "NO CONTABILIZAR COMO RESULTADO"];
  created_at: string;
}

export interface CommunityEditorialDecision {
  allowed: boolean;
  category: CommunityPublicationType;
  priority: number;
  reason: string;
  session: CommunitySession;
  content_hash: string;
  semantic_key: string;
  cooldown_minutes: number;
  blocked_by?: "DUPLICATE" | "SEMANTIC_DUPLICATE" | "ASSET_COOLDOWN" | "CATEGORY_COOLDOWN" | "DAILY_LIMIT" | "NO_NEW_INFORMATION" | "ALERT_PRIORITY" | "WAIT_AGGREGATION";
}

export interface CommunityEditorialControl {
  evaluate(dossier: CommunityMarketDossier, now: Date): Promise<CommunityEditorialDecision>;
  reserve(decision: CommunityEditorialDecision, dossier: CommunityMarketDossier, traceId: string): Promise<boolean>;
  recordBlocked(decision: CommunityEditorialDecision, dossier: CommunityMarketDossier, traceId: string): Promise<void>;
  recordPublished(decision: CommunityEditorialDecision, publication: CommunityPublication): Promise<void>;
  recordFailed(dossier: CommunityMarketDossier, errorCode: string, totalTimeMs: number): Promise<void>;
}

export type CommunityStage =
  | "DOSSIER_RECEIVED"
  | "EDITORIAL_APPROVED"
  | "EDITORIAL_BLOCKED"
  | "CONTENT_GENERATED"
  | "IMAGE_GENERATED"
  | "TELEGRAM_DELIVERED"
  | "ANALYSIS_FEED_STORED";

export interface CommunityEvidenceEntry {
  trace_id: string;
  stage: CommunityStage;
  module: string;
  received: Record<string, unknown>;
  processed: Record<string, unknown>;
  sent: Record<string, unknown>;
  timestamp: string;
  result: "COMPLETED" | "FAILED";
}

export interface CommunityDeliveryResult {
  trace_id: string;
  publication_id: string;
  telegram_message_id: number;
  analysis_feed_id: string;
  evidence: CommunityEvidenceEntry[];
}

export interface CommunityBlockedResult {
  skipped: true;
  trace_id: string;
  analysis_id: string;
  category: CommunityPublicationType;
  reason: string;
  blocked_by: CommunityEditorialDecision["blocked_by"];
  evidence: CommunityEvidenceEntry[];
}

export type CommunityPublishResult = CommunityDeliveryResult | CommunityBlockedResult;

export interface CommunityContentGenerator {
  generate(dossier: CommunityMarketDossier): Promise<CommunityContent>;
}

export interface CommunityImageGenerator {
  generate(dossier: CommunityMarketDossier, content: CommunityContent): Promise<CommunityImage>;
}

export interface CommunityTelegramPublisher {
  publish(publication: CommunityPublication): Promise<{ message_id: number; sent_at: string }>;
}

export interface CommunityAnalysisFeed {
  store(publication: CommunityPublication): Promise<{ feed_id: string; stored_at: string }>;
}

export interface CommunityEvidenceStore {
  append(entry: CommunityEvidenceEntry): Promise<void>;
}