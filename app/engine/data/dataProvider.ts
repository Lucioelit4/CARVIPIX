/**
 * Adaptador base para proveedores de datos
 * Interfaz que deben cumplir todos los proveedores
 * (demo, real, históricos, etc)
 */

import {
  Asset,
  Candle,
  Tick,
  TechnicalIndicators,
  MarketData,
  Timeframe,
  DataQuality,
  ConnectionState,
  DataHealthStatus,
} from '../types/marketData';

/**
 * Interfaz abstracta para proveedores de datos
 * Todos los proveedores (demo, real, histórico) deben implementar esto
 */
export abstract class DataProvider {
  protected assets: Asset[];
  protected timeframes: Timeframe[];
  protected healthy: Map<string, boolean> = new Map();
  protected lastUpdate: Map<string, number> = new Map();
  protected errors: Map<string, number> = new Map();

  constructor(assets: Asset[], timeframes: Timeframe[]) {
    this.assets = assets;
    this.timeframes = timeframes;
    this.initializeHealthTracking();
  }

  /**
   * Inicializar tracking de salud
   */
  private initializeHealthTracking() {
    for (const asset of this.assets) {
      for (const tf of this.timeframes) {
        const key = `${asset}-${tf}`;
        this.healthy.set(key, true);
        this.lastUpdate.set(key, Date.now());
        this.errors.set(key, 0);
      }
    }
  }

  /**
   * Conectar proveedor
   * Implementación específica en subclases
   */
  abstract connect(): Promise<void>;

  /**
   * Desconectar proveedor
   */
  abstract disconnect(): Promise<void>;

  /**
   * Obtener vela para activo y temporalidad
   */
  abstract getCandle(asset: Asset, timeframe: Timeframe): Promise<Candle | null>;

  /**
   * Obtener tick en vivo
   */
  abstract getTick(asset: Asset): Promise<Tick | null>;

  /**
   * Calcular indicadores técnicos
   */
  abstract calculateIndicators(
    asset: Asset,
    timeframe: Timeframe
  ): Promise<TechnicalIndicators | null>;

  /**
   * Obtener datos completos de mercado
   */
  abstract getMarketData(asset: Asset, timeframe: Timeframe): Promise<MarketData | null>;

  /**
   * Verificar salud de la conexión
   */
  abstract checkHealth(): Promise<DataQuality>;

  /**
   * Obtener estado de conexión
   */
  abstract getConnectionState(asset: Asset, timeframe: Timeframe): Promise<ConnectionState>;

  /**
   * Obtener estado general de salud
   */
  abstract getHealthStatus(): Promise<DataHealthStatus>;

  /**
   * Marcar actualización exitosa
   */
  protected recordSuccess(asset: Asset, timeframe: Timeframe) {
    const key = `${asset}-${timeframe}`;
    this.lastUpdate.set(key, Date.now());
    const currentErrors = this.errors.get(key) || 0;
    if (currentErrors > 0) {
      this.errors.set(key, currentErrors - 1); // Reducir contador de errores
    }
  }

  /**
   * Registrar error
   */
  protected recordError(asset: Asset, timeframe: Timeframe) {
    const key = `${asset}-${timeframe}`;
    const currentErrors = (this.errors.get(key) || 0) + 1;
    this.errors.set(key, currentErrors);
    
    // Si hay demasiados errores, marcar como no saludable
    if (currentErrors > 5) {
      this.healthy.set(key, false);
    }
  }

  /**
   * Obtener activos soportados
   */
  getAssets(): Asset[] {
    return this.assets;
  }

  /**
   * Obtener temporalidades soportadas
   */
  getTimeframes(): Timeframe[] {
    return this.timeframes;
  }

  /**
   * Obtener salud actual
   */
  isHealthy(asset: Asset, timeframe: Timeframe): boolean {
    const key = `${asset}-${timeframe}`;
    return this.healthy.get(key) ?? false;
  }

  /**
   * Obtener tiempo desde última actualización
   */
  getTimeSinceLastUpdate(asset: Asset, timeframe: Timeframe): number {
    const key = `${asset}-${timeframe}`;
    const lastUpdate = this.lastUpdate.get(key) || Date.now();
    return Date.now() - lastUpdate;
  }

  /**
   * Obtener contador de errores
   */
  getErrorCount(asset: Asset, timeframe: Timeframe): number {
    const key = `${asset}-${timeframe}`;
    return this.errors.get(key) || 0;
  }

  /**
   * Resetear estado (para tests o reinicio)
   */
  reset() {
    this.healthy.clear();
    this.lastUpdate.clear();
    this.errors.clear();
    this.initializeHealthTracking();
  }
}
