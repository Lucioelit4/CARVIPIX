import { CARVIPIXEngine } from './engine';
import { Asset, DataHealthStatus, MarketData, Timeframe } from '../types/marketData';
import { ProviderResolution, ProviderSelectionConfig } from '../types/brokerProvider';
import {
  createDataIntegrationGateway,
  DataIntegrationGateway,
  EconomicCalendarQuery,
  EconomicEvent,
  HistoricalSeries,
  HistoricalSeriesQuery,
  IntegrationGatewayHealth,
  NewsItem,
  NewsQuery,
} from '../integrations';

/**
 * Runtime de integracion entre engine de decisiones y capa de market data.
 * Mantiene el engine desacoplado de brokers concretos.
 */
export class EngineDataRuntime {
  private readonly engine: CARVIPIXEngine;
  private gateway: DataIntegrationGateway | null = null;
  private resolution: ProviderResolution | null = null;

  constructor(engine?: CARVIPIXEngine) {
    this.engine = engine ?? new CARVIPIXEngine();
  }

  async initialize(selection: ProviderSelectionConfig): Promise<ProviderResolution> {
    const gateway = createDataIntegrationGateway(selection);
    await gateway.connectAll();

    this.gateway = gateway;
    this.resolution = gateway.getBrokerResolution();

    return this.resolution;
  }

  getEngine(): CARVIPIXEngine {
    return this.engine;
  }

  getProviderResolution(): ProviderResolution | null {
    return this.resolution;
  }

  async getMarketSnapshot(asset: Asset, timeframe: Timeframe): Promise<MarketData | null> {
    if (!this.gateway) {
      throw new Error('EngineDataRuntime is not initialized. Call initialize() first.');
    }

    const data = await this.gateway.getMarketSnapshot(asset, timeframe);
    return data;
  }

  async getDataHealthStatus(): Promise<DataHealthStatus> {
    if (!this.gateway) {
      throw new Error('EngineDataRuntime is not initialized. Call initialize() first.');
    }
    return this.gateway.getBrokerHealthStatus();
  }

  async getEconomicEvents(query: EconomicCalendarQuery): Promise<EconomicEvent[]> {
    if (!this.gateway) {
      throw new Error('EngineDataRuntime is not initialized. Call initialize() first.');
    }
    return this.gateway.getEconomicEvents(query);
  }

  async getNews(query: NewsQuery): Promise<NewsItem[]> {
    if (!this.gateway) {
      throw new Error('EngineDataRuntime is not initialized. Call initialize() first.');
    }
    return this.gateway.getNews(query);
  }

  async getHistoricalSeries(query: HistoricalSeriesQuery): Promise<HistoricalSeries> {
    if (!this.gateway) {
      throw new Error('EngineDataRuntime is not initialized. Call initialize() first.');
    }
    return this.gateway.getHistoricalSeries(query);
  }

  async getIntegrationHealth(): Promise<IntegrationGatewayHealth> {
    if (!this.gateway) {
      throw new Error('EngineDataRuntime is not initialized. Call initialize() first.');
    }
    return this.gateway.getGatewayHealth();
  }

  async shutdown(): Promise<void> {
    if (!this.gateway) {
      return;
    }

    await this.gateway.disconnectAll();
    this.gateway = null;
    this.resolution = null;
  }
}

/**
 * Construye configuracion desde entorno para despliegue backend.
 */
export function buildProviderSelectionFromEnv(
  defaults?: Partial<ProviderSelectionConfig>
): ProviderSelectionConfig {
  const preferred =
    (process.env.CARVIPIX_DATA_PROVIDER as ProviderSelectionConfig['preferred']) ||
    defaults?.preferred ||
    'mt5';

  const fallbackPolicy =
    (process.env.CARVIPIX_DATA_FALLBACK as ProviderSelectionConfig['fallbackPolicy']) ||
    defaults?.fallbackPolicy ||
    'strict';

  const resolvedRealProvider = preferred === 'demo' || preferred === 'institutional_warehouse'
    ? 'custom'
    : preferred;

  return {
    preferred,
    fallbackPolicy,
    assets: defaults?.assets || ['XAUUSD', 'EURUSD', 'GBPUSD', 'BTCUSD'],
    timeframes: defaults?.timeframes || ['1H', '45M', '5M'],
    realConfig: {
      provider: resolvedRealProvider,
      apiKey: process.env.MT5_BRIDGE_API_TOKEN ?? process.env.TWELVE_DATA_API_KEY,
      baseUrl: process.env.MT5_BRIDGE_BASE_URL,
      timeout: process.env.MT5_BRIDGE_TIMEOUT_MS ? Number(process.env.MT5_BRIDGE_TIMEOUT_MS) : undefined,
      ...defaults?.realConfig,
    },
  };
}
