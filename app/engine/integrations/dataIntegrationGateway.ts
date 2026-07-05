import { ProviderSelectionConfig } from '../types/brokerProvider';
import { Asset, DataHealthStatus, MarketData, Timeframe } from '../types/marketData';
import { createBrokerSource } from './brokerSource';
import { InMemoryEconomicCalendarSource } from './economicCalendarSource';
import { InMemoryHistoricalSource } from './historicalSource';
import { InMemoryNewsSource } from './newsSource';
import {
  BrokerSource,
  EconomicCalendarQuery,
  EconomicCalendarSource,
  EconomicEvent,
  ExternalDomain,
  ExternalSource,
  HistoricalSeries,
  HistoricalSeriesQuery,
  HistoricalSource,
  IntegrationGatewayHealth,
  NewsItem,
  NewsQuery,
  NewsSource,
} from './types';

/**
 * Punto unico de acceso para toda integracion externa.
 * El resto del sistema solo habla con este gateway.
 */
export class DataIntegrationGateway {
  private brokerSource: BrokerSource | null = null;
  private calendarSources: Map<string, EconomicCalendarSource> = new Map();
  private newsSources: Map<string, NewsSource> = new Map();
  private historicalSources: Map<string, HistoricalSource> = new Map();
  private customSources: Map<string, ExternalSource> = new Map();

  private selectedCalendarSourceId: string | null = null;
  private selectedNewsSourceId: string | null = null;
  private selectedHistoricalSourceId: string | null = null;

  setBrokerSource(source: BrokerSource): void {
    this.brokerSource = source;
  }

  registerSource(source: ExternalSource): void {
    switch (source.descriptor.domain) {
      case 'economic-calendar':
        this.calendarSources.set(source.descriptor.id, source as EconomicCalendarSource);
        this.selectedCalendarSourceId ??= source.descriptor.id;
        return;
      case 'news':
        this.newsSources.set(source.descriptor.id, source as NewsSource);
        this.selectedNewsSourceId ??= source.descriptor.id;
        return;
      case 'historical':
        this.historicalSources.set(source.descriptor.id, source as HistoricalSource);
        this.selectedHistoricalSourceId ??= source.descriptor.id;
        return;
      case 'custom':
        this.customSources.set(source.descriptor.id, source);
        return;
      case 'broker':
        this.setBrokerSource(source as BrokerSource);
        return;
      default:
        throw new Error(`Unsupported source domain: ${(source as ExternalSource).descriptor.domain}`);
    }
  }

  selectSource(domain: Exclude<ExternalDomain, 'broker'>, sourceId: string): void {
    if (domain === 'economic-calendar') {
      this.ensureSourceExists(this.calendarSources, sourceId, domain);
      this.selectedCalendarSourceId = sourceId;
      return;
    }

    if (domain === 'news') {
      this.ensureSourceExists(this.newsSources, sourceId, domain);
      this.selectedNewsSourceId = sourceId;
      return;
    }

    if (domain === 'historical') {
      this.ensureSourceExists(this.historicalSources, sourceId, domain);
      this.selectedHistoricalSourceId = sourceId;
      return;
    }

    this.ensureSourceExists(this.customSources, sourceId, domain);
  }

  async connectAll(): Promise<void> {
    const tasks: Array<Promise<void>> = [];

    if (this.brokerSource) {
      tasks.push(this.brokerSource.connect());
    }

    for (const source of this.calendarSources.values()) {
      tasks.push(source.connect());
    }

    for (const source of this.newsSources.values()) {
      tasks.push(source.connect());
    }

    for (const source of this.historicalSources.values()) {
      tasks.push(source.connect());
    }

    for (const source of this.customSources.values()) {
      tasks.push(source.connect());
    }

    await Promise.all(tasks);
  }

  async disconnectAll(): Promise<void> {
    const tasks: Array<Promise<void>> = [];

    if (this.brokerSource) {
      tasks.push(this.brokerSource.disconnect());
    }

    for (const source of this.calendarSources.values()) {
      tasks.push(source.disconnect());
    }

    for (const source of this.newsSources.values()) {
      tasks.push(source.disconnect());
    }

    for (const source of this.historicalSources.values()) {
      tasks.push(source.disconnect());
    }

    for (const source of this.customSources.values()) {
      tasks.push(source.disconnect());
    }

    await Promise.all(tasks);
  }

  async getMarketSnapshot(asset: Asset, timeframe: Timeframe): Promise<MarketData | null> {
    const broker = this.requireBrokerSource();
    return broker.getMarketData(asset, timeframe);
  }

  async getBrokerHealthStatus(): Promise<DataHealthStatus> {
    const broker = this.requireBrokerSource();
    return broker.getDataHealthStatus();
  }

  getBrokerResolution() {
    const broker = this.requireBrokerSource();
    return broker.getResolution();
  }

  async getEconomicEvents(query: EconomicCalendarQuery): Promise<EconomicEvent[]> {
    const source = this.getSelectedSource(this.calendarSources, this.selectedCalendarSourceId, 'economic-calendar');
    return source.getEvents(query);
  }

  async getNews(query: NewsQuery): Promise<NewsItem[]> {
    const source = this.getSelectedSource(this.newsSources, this.selectedNewsSourceId, 'news');
    return source.getHeadlines(query);
  }

  async getHistoricalSeries(query: HistoricalSeriesQuery): Promise<HistoricalSeries> {
    const source = this.getSelectedSource(this.historicalSources, this.selectedHistoricalSourceId, 'historical');
    return source.getSeries(query);
  }

  async getGatewayHealth(): Promise<IntegrationGatewayHealth> {
    const checkedAt = Date.now();
    const health: IntegrationGatewayHealth = {
      checkedAt,
      economicCalendar: [],
      news: [],
      historical: [],
      custom: [],
    };

    if (this.brokerSource) {
      health.broker = await this.brokerSource.checkHealth();
    }

    health.economicCalendar = await Promise.all(
      Array.from(this.calendarSources.values()).map((source) => source.checkHealth())
    );

    health.news = await Promise.all(
      Array.from(this.newsSources.values()).map((source) => source.checkHealth())
    );

    health.historical = await Promise.all(
      Array.from(this.historicalSources.values()).map((source) => source.checkHealth())
    );

    health.custom = await Promise.all(
      Array.from(this.customSources.values()).map((source) => source.checkHealth())
    );

    return health;
  }

  private requireBrokerSource(): BrokerSource {
    if (!this.brokerSource) {
      throw new Error('Broker source is not configured in DataIntegrationGateway.');
    }
    return this.brokerSource;
  }

  private getSelectedSource<T extends ExternalSource>(
    sourceMap: Map<string, T>,
    selectedId: string | null,
    domain: ExternalDomain
  ): T {
    if (!selectedId) {
      throw new Error(`No source selected for domain '${domain}'.`);
    }

    const source = sourceMap.get(selectedId);
    if (!source) {
      throw new Error(`Selected source '${selectedId}' for domain '${domain}' is not registered.`);
    }

    return source;
  }

  private ensureSourceExists<T extends ExternalSource>(
    sourceMap: Map<string, T>,
    sourceId: string,
    domain: ExternalDomain
  ): void {
    if (!sourceMap.has(sourceId)) {
      throw new Error(`Source '${sourceId}' is not registered for domain '${domain}'.`);
    }
  }
}

export function createDataIntegrationGateway(selection: ProviderSelectionConfig): DataIntegrationGateway {
  const gateway = new DataIntegrationGateway();
  gateway.setBrokerSource(createBrokerSource(selection));

  // Default safe sources so every domain passes through this gateway from day one.
  gateway.registerSource(new InMemoryEconomicCalendarSource());
  gateway.registerSource(new InMemoryNewsSource());
  gateway.registerSource(new InMemoryHistoricalSource());

  return gateway;
}
