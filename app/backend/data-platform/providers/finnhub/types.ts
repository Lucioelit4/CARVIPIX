export type FinnhubDataset = "tick" | "ohlc" | "news" | "economic-calendar" | "symbols";

export interface FinnhubRuntimeConfig {
  apiKey: string;
  restBaseUrl: string;
  wsBaseUrl: string;
  timeoutMs: number;
  maxRetries: number;
  retryBaseMs: number;
  evaluationMode: boolean;
}

export interface FinnhubRateLimitSnapshot {
  limit?: number;
  remaining?: number;
  reset?: number;
}

export interface FinnhubResponseMeta {
  url: string;
  status: number;
  latencyMs: number;
  fetchedAt: string;
  rateLimit: FinnhubRateLimitSnapshot;
}

export interface FinnhubProbeCheck {
  check: string;
  ok: boolean;
  details: string;
  latencyMs?: number;
  endpoint?: string;
  blockedByPlan?: boolean;
  blockedByAuth?: boolean;
  statusCode?: number;
}

export interface FinnhubProbeSummary {
  provider: "finnhub";
  at: string;
  mode: "evaluation";
  checks: FinnhubProbeCheck[];
}
