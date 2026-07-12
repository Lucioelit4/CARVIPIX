import { DataProvider } from './dataProvider';
import { getDemoDataSource } from './demoDataSource';
import { MT5MarketDataAdapter } from './mt5MarketDataAdapter';
import { TwelveDataProvider } from './twelveDataProvider';
import {
  BrokerProviderId,
  ProviderSelectionConfig,
  ProviderResolution,
} from '../types/brokerProvider';
import { WarehouseDataProvider } from '../warehouse';

type ProviderFactoryFn = (config: ProviderSelectionConfig) => DataProvider;

const providerFactories: Partial<Record<BrokerProviderId, ProviderFactoryFn>> = {
  demo: () => getDemoDataSource(),
  mt5: (config) => new MT5MarketDataAdapter(config.assets, config.timeframes, {
    provider: 'mt5',
    ...config.realConfig,
  }),
  twelve_data: (config) => {
    const provider = new TwelveDataProvider(config.assets, config.timeframes, {
      provider: 'twelve_data',
      ...config.realConfig,
    });
    return provider;
  },
  institutional_warehouse: (config) => new WarehouseDataProvider(config.assets, config.timeframes),
};

/**
 * Permite registrar nuevos proveedores sin modificar el engine.
 */
export function registerProviderFactory(
  providerId: BrokerProviderId,
  factory: ProviderFactoryFn
): void {
  providerFactories[providerId] = factory;
}

function resolveFactory(providerId: BrokerProviderId): ProviderFactoryFn {
  const factory = providerFactories[providerId];
  if (!factory) {
    throw new Error(
      `No provider factory registered for '${providerId}'. Register it with registerProviderFactory().`
    );
  }
  return factory;
}

/**
 * Crea y conecta proveedor siguiendo politica de fallback.
 */
export async function createDataProvider(
  config: ProviderSelectionConfig
): Promise<{ provider: DataProvider; resolution: ProviderResolution }> {
  const fallbackPolicy = config.fallbackPolicy ?? 'fallback-demo';
  const requested = config.preferred;

  if (requested === 'mt5' && fallbackPolicy === 'fallback-demo') {
    throw new Error(
      "MT5 official mode requires strict fallback policy. Set CARVIPIX_DATA_FALLBACK=strict."
    );
  }

  const preferredFactory = resolveFactory(requested);
  const preferredProvider = preferredFactory(config);

  try {
    await preferredProvider.connect();
    return {
      provider: preferredProvider,
      resolution: {
        selected: requested,
        requested,
        usedFallback: false,
      },
    };
  } catch (error) {
    if (fallbackPolicy !== 'fallback-demo' || requested === 'demo') {
      throw error;
    }

    const fallbackFactory = resolveFactory('demo');
    const fallbackProvider = fallbackFactory({ ...config, preferred: 'demo' });
    await fallbackProvider.connect();

    return {
      provider: fallbackProvider,
      resolution: {
        selected: 'demo',
        requested,
        usedFallback: true,
        fallbackReason: error instanceof Error ? error.message : 'Unknown provider connection error',
      },
    };
  }
}
