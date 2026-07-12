import type { Asset, Candle, Timeframe } from './marketData';

export type ProviderConnectionStatus = 'connected' | 'degraded' | 'disconnected' | 'blocked';

export interface HistoricalRequest {
  symbol: Asset;
  timeframe: 'M1' | Timeframe;
  fromUtc: string;
  toUtc: string;
  pageToken?: string;
  limit?: number;
}

export interface LatestRequest {
  symbol: Asset;
  timeframe: 'M1' | Timeframe;
  limit: number;
}

export interface Quote {
  symbol: Asset;
  bid: number;
  ask: number;
  timestamp: number;
  source: string;
}

export interface ProviderHealth {
  providerName: string;
  status: ProviderConnectionStatus;
  latencyMs: number;
  rateLimitRemaining?: number;
  message: string;
}

export interface ProviderError {
  code:
    | 'DATA_PROVIDER_NOT_CONNECTED'
    | 'MARKET_DATA_PROVIDER_NOT_CONFIGURED'
    | 'BLOCKED_BY_EXTERNAL_DEPENDENCY'
    | 'RATE_LIMITED'
    | 'REQUEST_TIMEOUT'
    | 'INVALID_CREDENTIALS'
    | 'SYMBOL_NOT_AVAILABLE'
    | 'INCOMPLETE_RESPONSE'
    | 'UNKNOWN_PROVIDER_ERROR';
  message: string;
  retryable: boolean;
}

export interface HistoricalResponse {
  candles: Candle[];
  nextPageToken?: string;
  source: string;
  receivedAt: number;
}

export interface MarketDataProvider {
  getHistoricalCandles(request: HistoricalRequest): Promise<HistoricalResponse>;
  getLatestCandles(request: LatestRequest): Promise<HistoricalResponse>;
  getQuote(symbol: Asset): Promise<Quote>;
  getHealth(): Promise<ProviderHealth>;
}

export interface MarketDataProviderConfig {
  provider: string;
  apiKey?: string;
  apiSecret?: string;
  baseUrl?: string;
  environment?: 'sandbox' | 'production';
}

export function buildProviderConfigFromEnv(): MarketDataProviderConfig {
  return {
    provider: (process.env.MARKET_DATA_PROVIDER || '').trim(),
    apiKey: (process.env.MARKET_DATA_API_KEY || '').trim() || undefined,
    apiSecret: (process.env.MARKET_DATA_API_SECRET || '').trim() || undefined,
    baseUrl: (process.env.MARKET_DATA_BASE_URL || '').trim() || undefined,
    environment: ((process.env.MARKET_DATA_ENVIRONMENT || 'sandbox').trim() as 'sandbox' | 'production'),
  };
}

export function resolveProviderBlockingError(config: MarketDataProviderConfig): ProviderError | null {
  if (!config.provider) {
    return {
      code: 'MARKET_DATA_PROVIDER_NOT_CONFIGURED',
      message: 'BLOCKED_BY_EXTERNAL_DEPENDENCY: MARKET_DATA_PROVIDER',
      retryable: false,
    };
  }

  if (!config.apiKey) {
    return {
      code: 'DATA_PROVIDER_NOT_CONNECTED',
      message: 'DATA_PROVIDER_NOT_CONNECTED: missing MARKET_DATA_API_KEY',
      retryable: false,
    };
  }

  return null;
}
