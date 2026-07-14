/**
 * Adaptador para proveedor Twelve Data
 * Conecta con la API de Twelve Data en modo lectura
 * Sin operaciones, sin claves en el código
 */

import { RealDataProvider } from './realDataProvider';
import {
  Asset,
  Candle,
  Tick,
  TechnicalIndicators,
  MarketData,
  DataQuality,
  Timeframe,
} from '../types/marketData';
import { LatencyStats, RealProviderConfig } from '../types/realDataProvider';

interface TwelveDataTickResponse {
  status: string;
  code?: number;
  message?: string;
  last_price?: string;
  bid?: string;
  ask?: string;
  timestamp?: number;
}

/**
 * Adaptador específico para Twelve Data
 * Implementa llamadas reales a la API
 */
export class TwelveDataProvider extends RealDataProvider {
  private baseUrl = 'https://api.twelvedata.com';
  private apiKey: string | null = null;

  constructor(assets: Asset[], timeframes: Timeframe[], config?: Partial<RealProviderConfig>) {
    super(assets, timeframes, {
      provider: 'twelve_data',
      ...config,
    });

    this.apiKey = config?.apiKey || process.env.TWELVE_DATA_API_KEY || null;
  }

  /**
   * Conectar a Twelve Data
   * En modo lectura solamente
   */
  async connect(): Promise<void> {
    if (!this.apiKey) {
      throw new Error(
        'TWELVE_DATA_API_KEY is not configured. Use providerFactory fallback policy for demo fallback.'
      );
    }

    await super.connect();
  }

  /**
   * Obtener candle desde Twelve Data
   */
  async getCandle(asset: Asset, timeframe: Timeframe): Promise<Candle | null> {
    const startTime = Date.now();

    try {
      if (this.getState().connectionState !== 'connected') {
        throw new Error('Proveedor Twelve Data no conectado');
      }

      // Validar parámetros
      const symbol = this.normalizeSymbol(asset);
      const interval = this.normalizeTimeframe(timeframe);

      // Llamada a API de Twelve Data
      const response = await this.fetchFromTwelveData(
        `/quote?symbol=${symbol}&interval=${interval}&apikey=${this.apiKey}`
      );

      const elapsedTime = Date.now() - startTime;
      this.recordLatencyMetric(elapsedTime);

      if (response.status === 'ok' && response.last_price) {
        const price = parseFloat(response.last_price || '0');
        // Convertir respuesta a formato Candle
        return {
          asset,
          timeframe,
          open: price,
          high: price,
          low: price,
          close: price,
          volume: 0,
          timestamp: response.timestamp || Date.now(),
          complete: false,
        };
      }

      return null;
    } catch (error) {
      const elapsedTime = Date.now() - startTime;
      this.recordLatencyMetric(elapsedTime);
      console.error('[TwelveDataProvider] Error en getCandle:', error);
      return null;
    }
  }

  /**
   * Obtener tick en vivo desde Twelve Data
   */
  async getTick(asset: Asset): Promise<Tick | null> {
    const startTime = Date.now();

    try {
      if (this.getState().connectionState !== 'connected') {
        throw new Error('Proveedor Twelve Data no conectado');
      }

      const symbol = this.normalizeSymbol(asset);

      // Llamada a API de Twelve Data para precio en vivo
      const response = await this.fetchFromTwelveData(
        `/quote?symbol=${symbol}&apikey=${this.apiKey}`
      );

      const elapsedTime = Date.now() - startTime;
      this.recordLatencyMetric(elapsedTime);

      if (response.status === 'ok') {
        const bid = response.bid ? parseFloat(response.bid) : parseFloat(response.last_price || '0');
        const ask = response.ask ? parseFloat(response.ask) : parseFloat(response.last_price || '0');
        return {
          asset,
          bid,
          ask,
          spread: ask - bid,
          timestamp: response.timestamp || Date.now(),
          volume: 0,
          lastUpdate: Date.now(),
        };
      }

      return null;
    } catch (error) {
      const elapsedTime = Date.now() - startTime;
      this.recordLatencyMetric(elapsedTime);
      console.error('[TwelveDataProvider] Error en getTick:', error);
      return null;
    }
  }

  /**
   * Calcular indicadores técnicos
   * (En Twelve Data, se obtienen vía query parameters)
   */
  async calculateIndicators(
    asset: Asset,
    timeframe: Timeframe
  ): Promise<TechnicalIndicators | null> {
    const startTime = Date.now();

    try {
      if (this.getState().connectionState !== 'connected') {
        throw new Error('Proveedor Twelve Data no conectado');
      }

      const [candle, tick] = await Promise.all([
        this.getCandle(asset, timeframe),
        this.getTick(asset),
      ]);

      if (!candle || !tick) {
        return null;
      }

      const close = candle.close;
      const spread = typeof tick.spread === 'number' ? tick.spread : Math.max(0, tick.ask - tick.bid);
      const elapsedTime = Date.now() - startTime;
      this.recordLatencyMetric(elapsedTime);

      // Indicadores baseline para primera integracion real.
      return {
        ema20: close,
        ema50: close,
        ema200: close,
        atr: Math.abs(candle.high - candle.low),
        adx: 0,
        rsi: 50,
        spread,
        volatility: close > 0 ? (Math.abs(candle.high - candle.low) / close) * 100 : 0,
        timestamp: Date.now(),
      };
    } catch (error) {
      const elapsedTime = Date.now() - startTime;
      this.recordLatencyMetric(elapsedTime);
      console.error('[TwelveDataProvider] Error en calculateIndicators:', error);
      return null;
    }
  }

  /**
   * Obtener datos completos de mercado
   */
  async getMarketData(asset: Asset, timeframe: Timeframe): Promise<MarketData | null> {
    const startTime = Date.now();

    try {
      if (this.getState().connectionState !== 'connected') {
        throw new Error('Proveedor Twelve Data no conectado');
      }

      const [candle, tick, indicators] = await Promise.all([
        this.getCandle(asset, timeframe),
        this.getTick(asset),
        this.calculateIndicators(asset, timeframe),
      ]);

      if (!candle || !tick || !indicators) {
        return null;
      }

      const elapsedTime = Date.now() - startTime;
      this.recordLatencyMetric(elapsedTime);

      const quality: DataQuality = {
        isHealthy: true,
        latency: elapsedTime,
        completeness: 100,
        freshness: Date.now() - candle.timestamp,
        errors: [],
        lastHealthCheck: Date.now(),
      };

      return {
        asset,
        timeframe,
        candle,
        tick,
        indicators,
        lastUpdate: Date.now(),
        quality,
      };
    } catch (error) {
      const elapsedTime = Date.now() - startTime;
      this.recordLatencyMetric(elapsedTime);
      console.error('[TwelveDataProvider] Error en getMarketData:', error);
      return null;
    }
  }

  /**
   * Normalizar símbolo para Twelve Data
   */
  private normalizeSymbol(asset: Asset): string {
    // Twelve Data usa símbolos estándar
    const symbolMap: Record<Asset, string> = {
      XAUUSD: 'XAUUSD',
      EURUSD: 'EURUSD',
      GBPUSD: 'GBPUSD',
      BTCUSD: 'BTCUSD',
    };

    return symbolMap[asset] || asset;
  }

  /**
   * Normalizar timeframe para Twelve Data
   */
  private normalizeTimeframe(timeframe: Timeframe): string {
    // Twelve Data usa: 1min, 5min, 15min, 30min, 1h, etc.
    // CARVIPIX soporta: 1H, 30M, 45M, 5M
    const timeframeMap: Record<Timeframe, string> = {
      '1H': '1h',
      '30M': '30min',
      '45M': '45min',
      '5M': '5min',
    };

    return timeframeMap[timeframe] || '1h';
  }

  /**
   * Hacer llamada a API de Twelve Data
   */
  private async fetchFromTwelveData(endpoint: string): Promise<TwelveDataTickResponse> {
    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = (await response.json()) as TwelveDataTickResponse;

      // Validar respuesta
      if (data.code && data.code !== 0) {
        throw new Error(data.message || `Error en API: ${data.code}`);
      }

      return data;
    } catch (error) {
      console.error('[TwelveDataProvider] Error en llamada a API:', error);
      throw error;
    }
  }

  /**
   * Registrar métrica de latencia
   */
  private recordLatencyMetric(latency: number): void {
    // Ya está manejado en la clase base, pero aquí podríamos agregar lógica específica
    if (latency > 1000) {
      console.warn(`[TwelveDataProvider] Latencia alta: ${latency}ms`);
    }
  }

  /**
   * Obtener estado operativo del conector.
   */
  getProviderStatus(): {
    provider: string;
    mode: 'real-readonly';
    connected: boolean;
    hasApiKey: boolean;
    latency: LatencyStats;
  } {
    const state = this.getState();
    return {
      provider: 'twelve_data',
      mode: 'real-readonly',
      connected: state.connectionState === 'connected',
      hasApiKey: !!this.apiKey,
      latency: state.latency,
    };
  }
}
