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
  Timeframe,
} from '../types/marketData';
import { RealProviderConfig } from '../types/realDataProvider';

/**
 * Interfaz para respuesta de Twelve Data
 */
interface TwelveDataCandleResponse {
  meta?: {
    symbol: string;
    interval: string;
    currency: string;
    exchange_timezone: string;
  };
  status: string;
  code?: number;
  message?: string;
  data?: {
    o: string;
    h: string;
    l: string;
    c: string;
    v: string;
    datetime: string;
  }[];
}

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
  private useRealData: boolean = false;

  constructor(assets: Asset[], timeframes: Timeframe[], config?: Partial<RealProviderConfig>) {
    super(assets, timeframes, {
      provider: 'twelve_data',
      ...config,
    });

    // Cargar API key desde variables de entorno
    // En navegador, usar solo NEXT_PUBLIC_* si está disponible
    if (typeof window === 'undefined') {
      // En servidor
      this.apiKey = process.env.TWELVE_DATA_API_KEY || null;
    } else {
      // En cliente - no acceder a variables privadas
      this.apiKey = null;
    }

    // Si hay API key, usar datos reales; si no, usar modo demo
    this.useRealData = !!this.apiKey;
  }

  /**
   * Conectar a Twelve Data
   * En modo lectura solamente
   */
  async connect(): Promise<void> {
    try {
      // Si no hay API key, volver a demo automáticamente
      if (!this.useRealData) {
        console.warn(
          '[TwelveDataProvider] Sin API key configurada. Usando modo demo. Configurar TWELVE_DATA_API_KEY en .env.local para datos reales.'
        );
        // Simular conexión de demostración
        await this.simulateDemoConnection();
        return;
      }

      // Conectar a API real
      await super.connect();
    } catch (error) {
      console.error('[TwelveDataProvider] Error de conexión:', error);
      // Fallback a demo
      console.warn('[TwelveDataProvider] Fallback a modo demo');
      this.useRealData = false;
      await this.simulateDemoConnection();
    }
  }

  /**
   * Obtener candle desde Twelve Data
   */
  async getCandle(asset: Asset, timeframe: Timeframe): Promise<Candle | null> {
    const startTime = Date.now();

    try {
      if (!this.useRealData) {
        // Retornar null para usar datos demo
        return null;
      }

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
        // Convertir respuesta a formato Candle
        return {
          asset,
          timeframe,
          open: parseFloat(response.last_price || '0'),
          high: parseFloat(response.last_price || '0'),
          low: parseFloat(response.last_price || '0'),
          close: parseFloat(response.last_price || '0'),
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
      if (!this.useRealData) {
        return null;
      }

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
        return {
          asset,
          bid: response.bid ? parseFloat(response.bid) : parseFloat(response.last_price || '0'),
          ask: response.ask ? parseFloat(response.ask) : parseFloat(response.last_price || '0'),
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
      if (!this.useRealData) {
        return null;
      }

      if (this.getState().connectionState !== 'connected') {
        throw new Error('Proveedor Twelve Data no conectado');
      }

      // Para indicadores técnicos, usaría el endpoint /ta
      // pero por ahora retornamos null para mantener modo lectura puro
      const elapsedTime = Date.now() - startTime;
      this.recordLatencyMetric(elapsedTime);

      return null; // Indicadores disponibles pero no implementados por seguridad
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
      if (!this.useRealData) {
        return null;
      }

      if (this.getState().connectionState !== 'connected') {
        throw new Error('Proveedor Twelve Data no conectado');
      }

      // Por ahora, retornamos null
      // getMarketData sería complejo con la estructura actual
      // Se puede implementar cuando sea necesario
      const elapsedTime = Date.now() - startTime;
      this.recordLatencyMetric(elapsedTime);

      return null;
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
    // CARVIPIX soporta: 1H, 45M, 5M
    const timeframeMap: Record<Timeframe, string> = {
      '1H': '1h',
      '45M': '45min',
      '5M': '5min',
    };

    return timeframeMap[timeframe] || '1h';
  }

  /**
   * Hacer llamada a API de Twelve Data
   */
  private async fetchFromTwelveData(endpoint: string): Promise<any> {
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

      const data = await response.json();

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
    const state = this.getState();
    // Ya está manejado en la clase base, pero aquí podríamos agregar lógica específica
    if (latency > 1000) {
      console.warn(`[TwelveDataProvider] Latencia alta: ${latency}ms`);
    }
  }

  /**
   * Simular conexión de demostración
   */
  private async simulateDemoConnection(): Promise<void> {
    // Simular conexión sin datos reales
    const startTime = Date.now();
    await new Promise((resolve) => setTimeout(resolve, 100));

    const state = this.getState();
    state.connectionState = 'connected';
    state.isHealthy = true;

    console.info('[TwelveDataProvider] Conectado en modo demo (sin API key)');
  }

  /**
   * Obtener estado incluido si usa datos reales o demo
   */
  getProviderStatus(): {
    provider: string;
    mode: 'real-readonly' | 'demo';
    connected: boolean;
    latency: any;
  } {
    const state = this.getState();
    return {
      provider: 'twelve_data',
      mode: this.useRealData ? 'real-readonly' : 'demo',
      connected: state.connectionState === 'connected',
      latency: state.latency,
    };
  }
}
