import { createDataProvider } from '../data/providerFactory';
import { ProviderSelectionConfig, ProviderResolution } from '../types/brokerProvider';
import { Asset, DataHealthStatus, MarketData, Timeframe } from '../types/marketData';
import { BrokerSource, ExternalHealthStatus } from './types';

export class BrokerProviderSourceAdapter implements BrokerSource {
  readonly descriptor = {
    id: 'broker-provider-factory',
    domain: 'broker' as const,
    name: 'Provider Factory Broker Source',
    version: '1.0',
  };

  private readonly selection: ProviderSelectionConfig;
  private providerPromise: Promise<void> | null = null;
  private provider: Awaited<ReturnType<typeof createDataProvider>>['provider'] | null = null;
  private resolution: ProviderResolution | null = null;

  constructor(selection: ProviderSelectionConfig) {
    this.selection = selection;
  }

  async connect(): Promise<void> {
    if (this.providerPromise) {
      await this.providerPromise;
      return;
    }

    this.providerPromise = (async () => {
      const { provider, resolution } = await createDataProvider(this.selection);
      this.provider = provider;
      this.resolution = resolution;
    })();

    await this.providerPromise;
  }

  async disconnect(): Promise<void> {
    if (this.provider) {
      await this.provider.disconnect();
    }

    this.provider = null;
    this.resolution = null;
    this.providerPromise = null;
  }

  async getMarketData(asset: Asset, timeframe: Timeframe): Promise<MarketData | null> {
    const provider = await this.ensureProvider();
    return provider.getMarketData(asset, timeframe);
  }

  async getDataHealthStatus(): Promise<DataHealthStatus> {
    const provider = await this.ensureProvider();
    return provider.getHealthStatus();
  }

  getResolution(): ProviderResolution {
    if (!this.resolution) {
      throw new Error('Broker source is not initialized. Call connect() first.');
    }
    return this.resolution;
  }

  async checkHealth(): Promise<ExternalHealthStatus> {
    try {
      const status = await this.getDataHealthStatus();
      return {
        sourceId: this.descriptor.id,
        domain: 'broker',
        healthy: status.overallHealth >= 70,
        lastCheckedAt: Date.now(),
        latencyMs: status.avgLatency,
        message: `Provider=${status.dataProvider} health=${status.overallHealth.toFixed(1)}%`,
        details: {
          activeAssets: status.activeAssets,
          totalErrors: status.totalErrors,
          uptime: Number(status.uptime.toFixed(2)),
        },
      };
    } catch (error) {
      return {
        sourceId: this.descriptor.id,
        domain: 'broker',
        healthy: false,
        lastCheckedAt: Date.now(),
        message: error instanceof Error ? error.message : 'Unknown broker health error',
      };
    }
  }

  private async ensureProvider(): Promise<NonNullable<typeof this.provider>> {
    await this.connect();
    if (!this.provider) {
      throw new Error('Broker provider unavailable after connect().');
    }
    return this.provider;
  }
}

export function createBrokerSource(selection: ProviderSelectionConfig): BrokerProviderSourceAdapter {
  return new BrokerProviderSourceAdapter(selection);
}
