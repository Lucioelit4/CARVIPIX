import type { Asset, Candle } from '../types/marketData';
import {
  buildProviderConfigFromEnv,
  resolveProviderBlockingError,
  type HistoricalRequest,
  type HistoricalResponse,
  type LatestRequest,
  type MarketDataProvider,
  type ProviderError,
  type ProviderHealth,
  type Quote,
} from '../types/externalMarketDataProvider';

const SYMBOL_MAP: Record<Asset, string> = {
  XAUUSD: 'XAUUSD',
  EURUSD: 'EURUSD',
  GBPUSD: 'GBPUSD',
  BTCUSD: 'BTCUSD',
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildBlockedError(): ProviderError {
  const config = buildProviderConfigFromEnv();
  return (
    resolveProviderBlockingError(config) || {
      code: 'BLOCKED_BY_EXTERNAL_DEPENDENCY',
      message: 'BLOCKED_BY_EXTERNAL_DEPENDENCY: MARKET_DATA_PROVIDER',
      retryable: false,
    }
  );
}

export class ExternalApiProvider implements MarketDataProvider {
  private readonly maxRetries = 3;
  private readonly baseBackoffMs = 200;

  private ensureConfiguredOrThrow(): void {
    const blocking = resolveProviderBlockingError(buildProviderConfigFromEnv());
    if (blocking) {
      const error = new Error(blocking.message) as Error & { code: string; retryable: boolean };
      error.code = blocking.code;
      error.retryable = blocking.retryable;
      throw error;
    }
  }

  private async withRetry<T>(operation: () => Promise<T>): Promise<T> {
    let attempt = 0;
    let lastError: unknown;

    while (attempt <= this.maxRetries) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        attempt += 1;
        if (attempt > this.maxRetries) break;
        await delay(this.baseBackoffMs * attempt);
      }
    }

    throw lastError instanceof Error ? lastError : new Error('UNKNOWN_PROVIDER_ERROR');
  }

  private normalizeSymbol(symbol: Asset): string {
    return SYMBOL_MAP[symbol] || symbol;
  }

  async getHistoricalCandles(_request: HistoricalRequest): Promise<HistoricalResponse> {
    this.ensureConfiguredOrThrow();
    return await this.withRetry(async () => {
      // Adapter scaffold only: no implicit demo/local fallback allowed.
      return {
        candles: [] as Candle[],
        nextPageToken: undefined,
        source: 'external-api-adapter',
        receivedAt: Date.now(),
      };
    });
  }

  async getLatestCandles(_request: LatestRequest): Promise<HistoricalResponse> {
    this.ensureConfiguredOrThrow();
    return await this.withRetry(async () => ({
      candles: [] as Candle[],
      source: 'external-api-adapter',
      receivedAt: Date.now(),
    }));
  }

  async getQuote(symbol: Asset): Promise<Quote> {
    this.ensureConfiguredOrThrow();
    const providerSymbol = this.normalizeSymbol(symbol);

    return await this.withRetry(async () => ({
      symbol,
      bid: NaN,
      ask: NaN,
      timestamp: Date.now(),
      source: `external-api-adapter:${providerSymbol}`,
    }));
  }

  async getHealth(): Promise<ProviderHealth> {
    const config = buildProviderConfigFromEnv();
    const blocking = resolveProviderBlockingError(config);
    if (blocking) {
      return {
        providerName: config.provider || 'not-configured',
        status: 'blocked',
        latencyMs: 0,
        message: blocking.message,
      };
    }

    return {
      providerName: config.provider,
      status: 'degraded',
      latencyMs: 0,
      message: 'DATA_PROVIDER_NOT_CONNECTED',
    };
  }

  static getBlockingErrorForCurrentEnv(): ProviderError {
    return buildBlockedError();
  }
}
