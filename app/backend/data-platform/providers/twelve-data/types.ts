export type TwelveDataDataset = "tick" | "ohlc" | "metadata" | "symbols";

export interface TwelveDataRuntimeConfig {
  apiKey: string;
  restBaseUrl: string;
  wsBaseUrl: string;
  timeoutMs: number;
  maxRetries: number;
  retryBaseMs: number;
  evaluationMode: boolean;
}

export interface TwelveDataRateLimitSnapshot {
  minute?: number;
  day?: number;
  creditsUsed?: number;
  creditsRemaining?: number;
  creditsLimit?: number;
}

export interface TwelveDataResponseMeta {
  url: string;
  status: number;
  latencyMs: number;
  fetchedAt: string;
}

export interface TwelveDataProbeCheck {
  check: string;
  ok: boolean;
  details: string;
  latencyMs?: number;
  endpoint?: string;
  blockedByPlan?: boolean;
  blockedByAuth?: boolean;
  statusCode?: number;
}

export interface TwelveDataProbeSummary {
  provider: "twelve-data";
  at: string;
  mode: "evaluation";
  checks: TwelveDataProbeCheck[];
  observedRateLimits?: TwelveDataRateLimitSnapshot;
}
