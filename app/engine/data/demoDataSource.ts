/**
 * Fuente de datos demo
 * Simula datos de mercado reales para testing y desarrollo
 * Estructura compatible con proveedores reales
 * Datos ficticios realistas
 */

import { DataProvider } from './dataProvider';
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
  DataError,
} from '../types/marketData';

/**
 * Generador de datos demo realistas
 */
class DemoDataSource extends DataProvider {
  private isConnected: boolean = false;
  private startTime: number = Date.now();
  private connectionErrors: DataError[] = [];
  private maxErrors: number = 50;

  // Precios base realistas (2026)
  private basePrices: Record<Asset, number> = {
    XAUUSD: 2450,
    EURUSD: 1.0850,
    GBPUSD: 1.2680,
    BTCUSD: 67500,
  };

  // Volatilidad típica por activo (%)
  private volatility: Record<Asset, number> = {
    XAUUSD: 0.5,
    EURUSD: 0.3,
    GBPUSD: 0.35,
    BTCUSD: 2.5,
  };

  // Spread típico en pips
  private spreads: Record<Asset, number> = {
    XAUUSD: 2,
    EURUSD: 1,
    GBPUSD: 1.5,
    BTCUSD: 50,
  };

  constructor() {
    const assets: Asset[] = ['XAUUSD', 'EURUSD', 'GBPUSD', 'BTCUSD'];
    const timeframes: Timeframe[] = ['1H', '45M', '5M'];
    super(assets, timeframes);
  }

  /**
   * Conectar fuente demo
   */
  async connect(): Promise<void> {
    this.isConnected = true;
    this.startTime = Date.now();
    this.recordSuccess(this.assets[0], this.timeframes[0]);
    console.log('[DataProvider] Demo source connected');
  }

  /**
   * Desconectar
   */
  async disconnect(): Promise<void> {
    this.isConnected = false;
    console.log('[DataProvider] Demo source disconnected');
  }

  /**
   * Generar vela realista
   */
  async getCandle(asset: Asset, timeframe: Timeframe): Promise<Candle | null> {
    if (!this.isConnected) {
      this.recordError(asset, timeframe);
      return null;
    }

    try {
      const basePrice = this.basePrices[asset];
      const volatilityPercent = this.volatility[asset];
      
      // Simular movimiento de precio con ruido realista
      const priceVariation = (Math.random() - 0.5) * volatilityPercent;
      
      const open = basePrice * (1 + priceVariation);
      const close = basePrice * (1 + priceVariation + (Math.random() - 0.5) * volatilityPercent);
      const high = Math.max(open, close) * (1 + Math.random() * 0.001);
      const low = Math.min(open, close) * (1 - Math.random() * 0.001);
      
      const candle: Candle = {
        timestamp: Math.floor(Date.now() / 1000) * 1000,
        open,
        high,
        low,
        close,
        volume: Math.floor(Math.random() * 1000000) + 100000,
        asset,
        timeframe,
        complete: Math.random() > 0.1, // 90% completas
      };

      this.recordSuccess(asset, timeframe);
      return candle;
    } catch (error) {
      this.recordError(asset, timeframe);
      return null;
    }
  }

  /**
   * Generar tick en vivo realista
   */
  async getTick(asset: Asset): Promise<Tick | null> {
    if (!this.isConnected) {
      this.recordError(asset, '5M');
      return null;
    }

    try {
      const basePrice = this.basePrices[asset];
      const volatilityPercent = this.volatility[asset];
      
      const mid = basePrice * (1 + (Math.random() - 0.5) * volatilityPercent);
      const spreadValue = this.spreads[asset] / 10000; // Convertir pips a valor
      
      const bid = mid - spreadValue / 2;
      const ask = mid + spreadValue / 2;

      const tick: Tick = {
        timestamp: Date.now(),
        bid,
        ask,
        asset,
        spread: ask - bid,
        volume: Math.floor(Math.random() * 100000) + 10000,
        lastUpdate: Date.now(),
      };

      this.recordSuccess(asset, '5M');
      return tick;
    } catch (error) {
      this.recordError(asset, '5M');
      return null;
    }
  }

  /**
   * Calcular indicadores realistas
   */
  async calculateIndicators(
    asset: Asset,
    timeframe: Timeframe
  ): Promise<TechnicalIndicators | null> {
    if (!this.isConnected) {
      this.recordError(asset, timeframe);
      return null;
    }

    try {
      // Indicadores simulados realistas
      const rsi = 30 + Math.random() * 40; // 30-70
      const volatilityPercent = this.volatility[asset];
      
      const indicators: TechnicalIndicators = {
        ema20: this.basePrices[asset] * (1 + (Math.random() - 0.5) * 0.01),
        ema50: this.basePrices[asset] * (1 + (Math.random() - 0.5) * 0.015),
        ema200: this.basePrices[asset] * (1 + (Math.random() - 0.5) * 0.02),
        atr: (this.basePrices[asset] * volatilityPercent) / 100,
        rsi,
        spread: this.spreads[asset] / 10000,
        volatility: volatilityPercent,
        timestamp: Date.now(),
      };

      this.recordSuccess(asset, timeframe);
      return indicators;
    } catch (error) {
      this.recordError(asset, timeframe);
      return null;
    }
  }

  /**
   * Obtener datos completos de mercado
   */
  async getMarketData(asset: Asset, timeframe: Timeframe): Promise<MarketData | null> {
    if (!this.isConnected) {
      this.recordError(asset, timeframe);
      return null;
    }

    try {
      const [candle, tick, indicators] = await Promise.all([
        this.getCandle(asset, timeframe),
        this.getTick(asset),
        this.calculateIndicators(asset, timeframe),
      ]);

      if (!candle || !tick || !indicators) {
        this.recordError(asset, timeframe);
        return null;
      }

      const quality: DataQuality = {
        isHealthy: this.isHealthy(asset, timeframe),
        latency: Math.floor(Math.random() * 100), // 0-100ms
        completeness: 95 + Math.random() * 5,
        freshness: Date.now() - candle.timestamp,
        errors: this.connectionErrors.slice(-5),
        lastHealthCheck: Date.now(),
      };

      const marketData: MarketData = {
        asset,
        timeframe,
        candle,
        tick,
        indicators,
        lastUpdate: Date.now(),
        quality,
      };

      this.recordSuccess(asset, timeframe);
      return marketData;
    } catch (error) {
      this.recordError(asset, timeframe);
      return null;
    }
  }

  /**
   * Verificar salud de conexión
   */
  async checkHealth(): Promise<DataQuality> {
    const totalAssets = this.assets.length * this.timeframes.length;
    let healthyCount = 0;

    for (const asset of this.assets) {
      for (const tf of this.timeframes) {
        if (this.isHealthy(asset, tf)) {
          healthyCount++;
        }
      }
    }

    return {
      isHealthy: this.isConnected && healthyCount > totalAssets * 0.8,
      latency: Math.floor(Math.random() * 150),
      completeness: (healthyCount / totalAssets) * 100,
      freshness: this.getTimeSinceLastUpdate(this.assets[0], this.timeframes[0]),
      errors: this.connectionErrors.slice(-10),
      lastHealthCheck: Date.now(),
    };
  }

  /**
   * Obtener estado de conexión
   */
  async getConnectionState(asset: Asset, timeframe: Timeframe): Promise<ConnectionState> {
    const uptime = Date.now() - this.startTime;

    return {
      asset,
      timeframe,
      status: this.isConnected && this.isHealthy(asset, timeframe) ? 'connected' : 'disconnected',
      lastConnect: this.startTime,
      uptime,
      failureCount: Math.max(0, this.getErrorCount(asset, timeframe) - 1),
      consecutiveErrors: this.getErrorCount(asset, timeframe),
    };
  }

  /**
   * Obtener estado general de salud
   */
  async getHealthStatus(): Promise<DataHealthStatus> {
    const connectedAssets: Asset[] = [];
    const disconnectedAssets: Asset[] = [];
    const connectionStates: Record<Asset, Record<Timeframe, ConnectionState>> = {} as Record<
      Asset,
      Record<Timeframe, ConnectionState>
    >;

    for (const asset of this.assets) {
      connectionStates[asset] = {} as Record<Timeframe, ConnectionState>;

      for (const tf of this.timeframes) {
        connectionStates[asset][tf] = await this.getConnectionState(asset, tf);
      }

      if (this.isHealthy(asset, this.timeframes[0])) {
        connectedAssets.push(asset);
      } else {
        disconnectedAssets.push(asset);
      }
    }

    // Calcular latencia promedio
    const latencies = Array.from(this.lastUpdate.values()).map(
      (lastUpdate) => Date.now() - lastUpdate
    );
    const avgLatency = latencies.length > 0 ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0;

    const totalErrors = Array.from(this.errors.values()).reduce((a, b) => a + b, 0);
    const uptime = Math.min(100, ((Date.now() - this.startTime) / 86400000) * 100); // Simular uptime

    return {
      timestamp: Date.now(),
      overallHealth: this.isConnected ? 85 + Math.random() * 15 : 0,
      connectedAssets,
      disconnectedAssets,
      totalErrors,
      activeAssets: connectedAssets.length,
      dataProvider: 'demo',
      avgLatency,
      uptime,
      lastUpdate: Math.min(...Array.from(this.lastUpdate.values())),
      connectionStates,
      recentErrors: this.connectionErrors.slice(-5),
    };
  }

  /**
   * Registrar error con detalles
   */
  private addError(error: DataError) {
    this.connectionErrors.push(error);
    if (this.connectionErrors.length > this.maxErrors) {
      this.connectionErrors.shift();
    }
  }

  /**
   * Obtener errores recientes
   */
  getRecentErrors(): DataError[] {
    return this.connectionErrors.slice(-10);
  }
}

/**
 * Instancia global del proveedor demo
 * Singleton para uso en toda la aplicación
 */
let demoInstance: DemoDataSource | null = null;

export function getDemoDataSource(): DemoDataSource {
  if (!demoInstance) {
    demoInstance = new DemoDataSource();
  }
  return demoInstance;
}

export default DemoDataSource;
