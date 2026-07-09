export type InstitutionalAsset =
  | "XAUUSD"
  | "BTCUSD"
  | "EURUSD"
  | "GBPUSD"
  | "USDJPY"
  | "USDCHF"
  | "AUDUSD"
  | "NZDUSD"
  | "USDCAD"
  | "NAS100"
  | "US30";

export type AssetTier = "A" | "B" | "C";

export type WarehouseTimeframe =
  | "Tick"
  | "S1"
  | "M1"
  | "M5"
  | "M15"
  | "M30"
  | "H1"
  | "H4"
  | "D1"
  | "W1"
  | "MN1";

export type InstitutionalProviderId =
  | "institutional_warehouse"
  | "twelve_data"
  | "binance"
  | "polygon"
  | "alpha_vantage"
  | "csv_import"
  | "manual_certified"
  | "institutional_provider"
  | "certified_file"
  | "manual_data";

export type WarehouseOrigin = "download" | "correction" | "incremental" | "manual" | "recovery";

export type DataStatus = "raw" | "normalized" | "validated" | "corrected" | "certified" | "rejected";

export type CertificationStatus = "pending" | "certified" | "rejected";

export type MarketSession = "asian" | "london" | "new_york" | "overlap" | "off_session";

export type MarketClassification =
  | "bull_trend"
  | "bear_trend"
  | "range"
  | "accumulation"
  | "distribution"
  | "high_volatility"
  | "low_volatility"
  | "high_liquidity"
  | "low_liquidity"
  | "news_event"
  | "manipulation"
  | "false_breakout"
  | "pullback"
  | "continuation"
  | "breakout";

export interface CandleContext {
  session: MarketSession;
  market: "fx" | "crypto" | "index" | "metal";
  volatility: number;
  liquidity: number;
  spread: number;
  marketState: "open" | "closed" | "auction" | "holiday" | "rollover";
  news: string[];
  economicCalendar: string[];
  holidays: string[];
  tradingHour: number;
  daylightSavingShift: boolean;
  classifications: MarketClassification[];
}

export interface InstitutionalCandleRecord {
  symbol: InstitutionalAsset;
  timeframe: WarehouseTimeframe;
  timestampUtc: number;
  open: number;
  high: number;
  low: number;
  close: number;
  bid: number | null;
  ask: number | null;
  spread: number | null;
  volume: number | null;
  tickVolume: number | null;
  provider: InstitutionalProviderId;
  origin: WarehouseOrigin;
  checksum: string;
  version: string;
  qualityScore: number;
  coverage: number;
  dataStatus: DataStatus;
  context: CandleContext;
  corrected: boolean;
  certified: boolean;
}

export interface WarehouseDatasetVersion {
  datasetId: string;
  symbol: InstitutionalAsset;
  tier: AssetTier;
  timeframe: WarehouseTimeframe;
  version: string;
  provider: InstitutionalProviderId;
  checksum: string;
  coverage: number;
  rows: number;
  missingData: number;
  qualityScore: number;
  validationDate: number;
  certification: CertificationStatus;
  correctedRows: number;
  startTimestampUtc: number;
  endTimestampUtc: number;
  yearsCapacity: {
    targetMin: number;
    targetMax: number;
    scalableTo: number;
  };
  traceability: {
    downloadedBy: string;
    downloadedAt: number;
    provider: InstitutionalProviderId;
    version: string;
    qualityScore: number;
    checksum: string;
    corrected: boolean;
    certified: boolean;
  };
}

export interface DownloadBatchRequest {
  symbol: InstitutionalAsset;
  timeframe: WarehouseTimeframe;
  provider: InstitutionalProviderId;
  version: string;
  downloadedBy: string;
  rows: Array<Partial<InstitutionalCandleRecord>>;
  origin: WarehouseOrigin;
  sourceTimezone?: string;
  resumeToken?: string;
}

export interface QualityIssue {
  code:
    | "invalid_ohlc"
    | "duplicate_timestamp"
    | "negative_spread"
    | "incomplete_row"
    | "invalid_volume"
    | "temporal_gap"
    | "timestamp_order"
    | "missing_bid_ask"
    | "invalid_timezone"
    | "invalid_bid_ask";
  severity: "warning" | "error" | "critical";
  message: string;
  timestampUtc?: number;
}

export interface QualityAssessmentResult {
  normalizedRows: InstitutionalCandleRecord[];
  issues: QualityIssue[];
  missingData: number;
  duplicatesRemoved: number;
  correctedRows: number;
  qualityScore: number;
  coverage: number;
  certified: boolean;
}

export interface WarehouseQuery {
  symbol: InstitutionalAsset;
  timeframe: WarehouseTimeframe;
  startTimestampUtc?: number;
  endTimestampUtc?: number;
  limit?: number;
  certifiedOnly?: boolean;
}

export interface WarehouseCoverageSummary {
  symbol: InstitutionalAsset;
  timeframe: WarehouseTimeframe;
  versions: number;
  rows: number;
  certifiedRows: number;
  provider: InstitutionalProviderId | null;
  qualityScore: number;
  coverage: number;
  latestVersion: string | null;
  startTimestampUtc: number | null;
  endTimestampUtc: number | null;
}

export interface WarehouseStressReport {
  totalRowsProcessed: number;
  durationMs: number;
  rowsPerSecond: number;
  datasetCount: number;
  maxRowsSingleDataset: number;
}

export interface WarehouseDownloadRequest {
  symbol: InstitutionalAsset;
  timeframe: WarehouseTimeframe;
  provider: InstitutionalProviderId;
  mode: "full" | "incremental" | "resume";
  requestedBy: string;
  version: string;
  sourcePayload?: string | Record<string, unknown> | Array<Record<string, unknown>>;
  sourceTimezone?: string;
  resumeToken?: string;
}

export interface WarehouseDownloadResult {
  request: WarehouseDownloadRequest;
  manifest: WarehouseDatasetVersion;
  assessment: QualityAssessmentResult;
  resumeToken: string | null;
}

export interface WarehouseConnectorCapability {
  fullDownload: boolean;
  incremental: boolean;
  resume: boolean;
  retries: boolean;
  search: boolean;
}

export interface WarehouseConnectorDescriptor {
  provider: InstitutionalProviderId;
  label: string;
  capabilities: WarehouseConnectorCapability;
  supportsTick: boolean;
}

export interface WarehouseDownloadCheckpoint {
  provider: InstitutionalProviderId;
  symbol: InstitutionalAsset;
  timeframe: WarehouseTimeframe;
  version: string;
  lastTimestampUtc: number | null;
  resumeToken: string | null;
  attempts: number;
  updatedAt: number;
  status: "idle" | "running" | "completed" | "failed";
  lastError?: string;
}

export interface WarehouseAuditEntry {
  datasetId: string;
  provider: InstitutionalProviderId;
  downloadedBy: string;
  downloadedAt: number;
  version: string;
  checksum: string;
  coverage: number;
  qualityScore: number;
  certification: CertificationStatus;
  errors: QualityIssue[];
  correctedRows: number;
}

export interface AssetWarehouseStatus {
  symbol: InstitutionalAsset;
  tier: AssetTier;
  coverage: number;
  quality: number;
  certifiedDatasets: string[];
  yearsAvailable: number;
  providerUsage: InstitutionalProviderId[];
  missingTimeframes: WarehouseTimeframe[];
  missingYearsTo10: number;
}

export interface WarehouseDashboardSnapshot {
  generatedAt: number;
  assets: AssetWarehouseStatus[];
  certifiedDatasets: string[];
  pendingDownloads: Array<{
    symbol: InstitutionalAsset;
    missingTimeframes: WarehouseTimeframe[];
    currentCoverage: number;
  }>;
  providers: WarehouseConnectorDescriptor[];
}

export const OFFICIAL_ASSET_TIERS: Record<InstitutionalAsset, AssetTier> = {
  XAUUSD: "A",
  BTCUSD: "A",
  EURUSD: "B",
  GBPUSD: "B",
  USDJPY: "B",
  USDCHF: "C",
  AUDUSD: "C",
  NZDUSD: "C",
  USDCAD: "C",
  NAS100: "C",
  US30: "C",
};

export const OFFICIAL_TIMEFRAMES: WarehouseTimeframe[] = [
  "Tick",
  "S1",
  "M1",
  "M5",
  "M15",
  "M30",
  "H1",
  "H4",
  "D1",
  "W1",
  "MN1",
];
