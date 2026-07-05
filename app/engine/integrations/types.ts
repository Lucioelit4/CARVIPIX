import { Asset, DataHealthStatus, MarketData, Timeframe } from '../types/marketData';
import { ProviderResolution } from '../types/brokerProvider';

export type ExternalDomain =
  | 'broker'
  | 'economic-calendar'
  | 'news'
  | 'historical'
  | 'custom';

export interface ExternalSourceDescriptor {
  id: string;
  domain: ExternalDomain;
  name: string;
  version?: string;
}

export interface ExternalHealthStatus {
  sourceId: string;
  domain: ExternalDomain;
  healthy: boolean;
  lastCheckedAt: number;
  latencyMs?: number;
  message?: string;
  details?: Record<string, string | number | boolean>;
}

export interface ExternalSource {
  descriptor: ExternalSourceDescriptor;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  checkHealth(): Promise<ExternalHealthStatus>;
}

export interface BrokerSource extends ExternalSource {
  descriptor: ExternalSourceDescriptor & { domain: 'broker' };
  getMarketData(asset: Asset, timeframe: Timeframe): Promise<MarketData | null>;
  getDataHealthStatus(): Promise<DataHealthStatus>;
  getResolution(): ProviderResolution;
}

export type EconomicEventSeverity = 'low' | 'medium' | 'high';

export interface EconomicEvent {
  id: string;
  title: string;
  country: string;
  currency: string;
  severity: EconomicEventSeverity;
  scheduledAt: number;
  actual?: string;
  forecast?: string;
  previous?: string;
  source: string;
}

export interface EconomicCalendarQuery {
  from: number;
  to: number;
  currencies?: string[];
  minSeverity?: EconomicEventSeverity;
  limit?: number;
}

export interface EconomicCalendarSource extends ExternalSource {
  descriptor: ExternalSourceDescriptor & { domain: 'economic-calendar' };
  getEvents(query: EconomicCalendarQuery): Promise<EconomicEvent[]>;
}

export interface NewsItem {
  id: string;
  title: string;
  summary?: string;
  url?: string;
  publishedAt: number;
  sentiment?: 'negative' | 'neutral' | 'positive';
  symbols?: Asset[];
  source: string;
}

export interface NewsQuery {
  from: number;
  to: number;
  symbols?: Asset[];
  limit?: number;
}

export interface NewsSource extends ExternalSource {
  descriptor: ExternalSourceDescriptor & { domain: 'news' };
  getHeadlines(query: NewsQuery): Promise<NewsItem[]>;
}

export interface HistoricalCandle extends Omit<MarketData['candle'], 'complete'> {
  complete: true;
}

export interface HistoricalSeriesQuery {
  asset: Asset;
  timeframe: Timeframe;
  from: number;
  to: number;
  limit?: number;
}

export interface HistoricalSeries {
  asset: Asset;
  timeframe: Timeframe;
  candles: HistoricalCandle[];
  source: string;
}

export interface HistoricalSource extends ExternalSource {
  descriptor: ExternalSourceDescriptor & { domain: 'historical' };
  getSeries(query: HistoricalSeriesQuery): Promise<HistoricalSeries>;
}

export interface IntegrationGatewayHealth {
  checkedAt: number;
  broker?: ExternalHealthStatus;
  economicCalendar: ExternalHealthStatus[];
  news: ExternalHealthStatus[];
  historical: ExternalHealthStatus[];
  custom: ExternalHealthStatus[];
}
