import { Asset, Timeframe } from './marketData';
import { RealProviderConfig } from './realDataProvider';

/**
 * Brokers soportados por la capa de datos del engine.
 * Nuevos brokers deben agregarse aqui y registrarse en el factory.
 */
export type BrokerProviderId =
  | 'institutional_warehouse'
  | 'demo'
  | 'mt5'
  | 'twelve_data'
  | 'oanda'
  | 'alpha-vantage'
  | 'ninjatrader'
  | 'custom';

/**
 * Politica de fallback de proveedor.
 * strict: falla si el broker preferido no conecta
 * fallback-demo: cambia automaticamente a demo si falla el broker preferido
 */
export type ProviderFallbackPolicy = 'strict' | 'fallback-demo';

/**
 * Configuracion unificada para seleccionar proveedor de datos.
 */
export interface ProviderSelectionConfig {
  preferred: BrokerProviderId;
  fallbackPolicy?: ProviderFallbackPolicy;
  assets: Asset[];
  timeframes: Timeframe[];
  realConfig?: Partial<RealProviderConfig>;
}

/**
 * Metadatos de seleccion de proveedor para logging/observabilidad.
 */
export interface ProviderResolution {
  selected: BrokerProviderId;
  requested: BrokerProviderId;
  usedFallback: boolean;
  fallbackReason?: string;
}
