import {
  ExternalHealthStatus,
  HistoricalSeries,
  HistoricalSeriesQuery,
  HistoricalSource,
} from './types';

function buildSeriesKey(query: Pick<HistoricalSeriesQuery, 'asset' | 'timeframe'>): string {
  return `${query.asset}:${query.timeframe}`;
}

export class InMemoryHistoricalSource implements HistoricalSource {
  readonly descriptor = {
    id: 'historical-in-memory',
    domain: 'historical' as const,
    name: 'In-Memory Historical Source',
    version: '1.0',
  };

  private connected = false;
  private readonly seriesMap: Map<string, HistoricalSeries>;

  constructor(seedSeries: HistoricalSeries[] = []) {
    this.seriesMap = new Map(seedSeries.map((series) => [buildSeriesKey(series), series]));
  }

  async connect(): Promise<void> {
    this.connected = true;
  }

  async disconnect(): Promise<void> {
    this.connected = false;
  }

  async getSeries(query: HistoricalSeriesQuery): Promise<HistoricalSeries> {
    this.ensureConnected();

    const key = buildSeriesKey(query);
    const base = this.seriesMap.get(key);

    if (!base) {
      return {
        asset: query.asset,
        timeframe: query.timeframe,
        candles: [],
        source: this.descriptor.id,
      };
    }

    let candles = base.candles.filter(
      (candle) => candle.timestamp >= query.from && candle.timestamp <= query.to
    );

    if (query.limit && query.limit > 0) {
      candles = candles.slice(-query.limit);
    }

    return {
      asset: base.asset,
      timeframe: base.timeframe,
      candles,
      source: base.source,
    };
  }

  async checkHealth(): Promise<ExternalHealthStatus> {
    return {
      sourceId: this.descriptor.id,
      domain: this.descriptor.domain,
      healthy: this.connected,
      lastCheckedAt: Date.now(),
      message: this.connected
        ? `Historical source ready with ${this.seriesMap.size} series`
        : 'Historical source disconnected',
    };
  }

  private ensureConnected(): void {
    if (!this.connected) {
      throw new Error('Historical source is not connected.');
    }
  }
}
