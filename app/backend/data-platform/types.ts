export type DatasetKind =
  | "tick"
  | "ohlc"
  | "news"
  | "economic-calendar"
  | "spread"
  | "session"
  | "metadata";

export type CompressionCodec = "none" | "gzip" | "brotli";

export interface BaseDataRecord {
  id: string;
  provider: string;
  asset?: string;
  ts: number;
  metadata?: Record<string, unknown>;
}

export interface TickRecord extends BaseDataRecord {
  kind: "tick";
  bid: number;
  ask: number;
}

export interface OHLCRecord extends BaseDataRecord {
  kind: "ohlc";
  timeframe: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface NewsRecord extends BaseDataRecord {
  kind: "news";
  headline: string;
  body?: string;
  sentiment?: "negative" | "neutral" | "positive";
  language?: string;
}

export interface EconomicCalendarRecord extends BaseDataRecord {
  kind: "economic-calendar";
  event: string;
  country?: string;
  currency?: string;
  impact?: "low" | "medium" | "high";
  actual?: string;
  forecast?: string;
  previous?: string;
}

export interface SpreadRecord extends BaseDataRecord {
  kind: "spread";
  spread: number;
}

export interface SessionRecord extends BaseDataRecord {
  kind: "session";
  sessionName: string;
  state: "open" | "closed";
  startTs: number;
  endTs?: number;
}

export interface MetadataRecord extends BaseDataRecord {
  kind: "metadata";
  key: string;
  value: string;
}

export type DataRecord =
  | TickRecord
  | OHLCRecord
  | NewsRecord
  | EconomicCalendarRecord
  | SpreadRecord
  | SessionRecord
  | MetadataRecord;

export interface IngestionCursor {
  kind: DatasetKind;
  provider: string;
  cursor: string;
}

export interface ProviderPullRequest {
  kind: DatasetKind;
  cursor?: string;
  fromTs?: number;
  toTs?: number;
  assets?: string[];
}

export interface ProviderPullResponse {
  records: DataRecord[];
  nextCursor?: string;
}

export interface DataProviderAdapter {
  id: string;
  priority: number;
  supports: DatasetKind[];
  pullIncremental(request: ProviderPullRequest): Promise<ProviderPullResponse>;
}

export interface DataQuery {
  kind: DatasetKind;
  asset?: string;
  provider?: string;
  fromTs?: number;
  toTs?: number;
  limit?: number;
  sort?: "asc" | "desc";
  mode?: "raw" | "aggregate";
}

export interface RepairAction {
  kind: "deduplicate" | "sort-by-ts" | "drop-invalid-number" | "rebuild-partition";
  reason: string;
  partitionPath: string;
}

export interface IntegrityIssue {
  kind: "checksum-mismatch" | "invalid-json" | "missing-manifest";
  partitionPath: string;
  detail: string;
}

export interface VersionRecord {
  id: string;
  kind: DatasetKind;
  createdAt: string;
  recordCount: number;
  partitionsUpdated: string[];
  checksum: string;
}

export interface DatasetLineageRecord {
  lineageId: string;
  versionId: string;
  kind: DatasetKind;
  providerIds: string[];
  assets: string[];
  fromTs: number;
  toTs: number;
  recordCount: number;
  partitionCount: number;
  checksum: string;
  createdAt: string;
}

export interface BenchmarkCaseResult {
  caseName: string;
  elapsedMs: number;
  recordsProcessed: number;
}

export interface BenchmarkSuiteResult {
  startedAt: string;
  finishedAt: string;
  cases: BenchmarkCaseResult[];
}
