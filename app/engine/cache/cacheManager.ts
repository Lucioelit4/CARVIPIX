/**
 * Cache Manager - Almacenamiento local de datos históricos
 * Evita pedir los mismos datos múltiples veces de la API
 * Soporta XAUUSD, EURUSD, GBPUSD, BTCUSD en 1H, 45M, 5M
 */

// Re-export types
export * from './types';

import {
  Asset,
  Timeframe,
  CacheMetadata,
  CacheStatus,
  CacheStats,
  CandleData,
  CacheWriteResult,
  CacheReadResult,
  CacheClearResult,
} from './types';

const CACHE_DIR = './data/cache';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 horas
const ASSETS: Asset[] = ['XAUUSD', 'EURUSD', 'GBPUSD', 'BTCUSD'];
const TIMEFRAMES: Timeframe[] = ['1H', '45M', '5M'];

export class CacheManager {
  private cacheMap: Map<string, CacheMetadata> = new Map();
  private cacheHits = 0;
  private cacheMisses = 0;

  /**
   * Inicializar cache manager
   */
  async initialize(): Promise<void> {
    try {
      // En entorno servidor, cargar índice de cache
      // Por ahora, usar in-memory storage con fallback a demo
      this.loadCacheIndex();
    } catch (error) {
      console.warn('⚠️ Cache initialization warning:', error);
    }
  }

  /**
   * Cargar índice de cache existente
   */
  private loadCacheIndex(): void {
    // Placeholder: en producción, leer del FS o SQLite
    for (const asset of ASSETS) {
      for (const timeframe of TIMEFRAMES) {
        const key = `${asset}_${timeframe}`;
        // Iniciar con null - será populado cuando se cargue data
        // this.cacheMap.set(key, null);
      }
    }
  }

  /**
   * Obtener datos del cache o generar demo
   */
  async getCandles(
    asset: Asset,
    timeframe: Timeframe,
    startDate: number,
    endDate: number
  ): Promise<CacheReadResult> {
    const startTime = Date.now();
    const key = `${asset}_${timeframe}`;

    try {
      // Verificar si está en cache y es válido
      const cachedData = this.cacheMap.get(key);
      if (cachedData && this.isCacheValid(cachedData, startDate, endDate)) {
        this.cacheHits++;
        const candles = this.generateDemoCandlesFromCache(asset, timeframe, startDate, endDate);
        return {
          success: true,
          candles,
          metadata: cachedData,
          duration: Date.now() - startTime,
          fromCache: true,
        };
      }

      // Si no está en cache, usar demo (fallback)
      this.cacheMisses++;
      const demoCandles = this.generateDemoCandles(asset, timeframe, startDate, endDate);

      // Registrar en cache map (simulado)
      const metadata: CacheMetadata = {
        asset,
        timeframe,
        candleCount: demoCandles.length,
        startDate,
        endDate,
        lastUpdated: Date.now(),
        expiresAt: Date.now() + CACHE_TTL,
        hash: this.hashMetadata(asset, timeframe),
        fileSize: demoCandles.length * 40, // ~40 bytes por candle
        source: 'demo',
      };
      this.cacheMap.set(key, metadata);

      return {
        success: true,
        candles: demoCandles,
        metadata,
        duration: Date.now() - startTime,
        fromCache: false,
      };
    } catch (error) {
      return {
        success: false,
        candles: [],
        metadata: null,
        duration: Date.now() - startTime,
        fromCache: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Guardar datos en cache
   */
  async writeCandles(
    asset: Asset,
    timeframe: Timeframe,
    candles: CandleData[]
  ): Promise<CacheWriteResult> {
    const startTime = Date.now();

    try {
      if (!candles || candles.length === 0) {
        return {
          success: false,
          asset,
          timeframe,
          candlesWritten: 0,
          duration: Date.now() - startTime,
          error: 'No candles to write',
        };
      }

      const key = `${asset}_${timeframe}`;
      const startDate = Math.min(...candles.map((c) => c.timestamp));
      const endDate = Math.max(...candles.map((c) => c.timestamp));

      const metadata: CacheMetadata = {
        asset,
        timeframe,
        candleCount: candles.length,
        startDate,
        endDate,
        lastUpdated: Date.now(),
        expiresAt: Date.now() + CACHE_TTL,
        hash: this.hashMetadata(asset, timeframe),
        fileSize: candles.length * 40,
        source: 'api',
      };

      this.cacheMap.set(key, metadata);

      return {
        success: true,
        asset,
        timeframe,
        candlesWritten: candles.length,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        asset,
        timeframe,
        candlesWritten: 0,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Obtener estado de cache para un activo/timeframe
   */
  getCacheStatus(asset: Asset, timeframe: Timeframe): CacheStatus {
    const key = `${asset}_${timeframe}`;
    const metadata = this.cacheMap.get(key);

    if (!metadata) {
      return {
        isValid: false,
        age: Infinity,
        percentComplete: 0,
        message: 'Cache no disponible',
      };
    }

    const age = Date.now() - metadata.lastUpdated;
    const isValid = age < CACHE_TTL;
    const percentComplete = isValid ? 100 : Math.max(0, 100 - (age / CACHE_TTL) * 100);

    return {
      isValid,
      age,
      percentComplete,
      message: isValid
        ? `✓ Válido (${this.formatDate(metadata.lastUpdated)})`
        : `⚠️ Expirado hace ${this.formatDuration(age)}`,
    };
  }

  /**
   * Obtener estadísticas globales de cache
   */
  getCacheStats(): CacheStats {
    const datasets = Array.from(this.cacheMap.values());
    const totalCandleCount = datasets.reduce((sum, m) => sum + m.candleCount, 0);
    const totalFileSize = datasets.reduce((sum, m) => sum + m.fileSize, 0);
    const totalHits = this.cacheHits + this.cacheMisses;
    const cacheHitRate = totalHits > 0 ? (this.cacheHits / totalHits) * 100 : 0;

    return {
      totalAssets: ASSETS.length,
      totalTimeframes: TIMEFRAMES.length,
      totalCandleCount,
      totalFileSize,
      cacheHitRate,
      datasets: datasets.map((d) => ({
        ...d,
        fileSize: Math.round(d.fileSize / 1024), // KB
      })),
    };
  }

  /**
   * Limpiar cache completamente
   */
  async clearCache(): Promise<CacheClearResult> {
    const startTime = Date.now();

    try {
      const totalCandles = Array.from(this.cacheMap.values()).reduce(
        (sum, m) => sum + m.candleCount,
        0
      );
      const totalSize = Array.from(this.cacheMap.values()).reduce((sum, m) => sum + m.fileSize, 0);

      this.cacheMap.clear();
      this.cacheHits = 0;
      this.cacheMisses = 0;

      return {
        success: true,
        assetsCleared: ASSETS.length,
        candlesRemoved: totalCandles,
        spacedFreed: totalSize,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        assetsCleared: 0,
        candlesRemoved: 0,
        spacedFreed: 0,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Limpiar cache de un activo/timeframe específico
   */
  async clearCacheFor(asset: Asset, timeframe: Timeframe): Promise<CacheClearResult> {
    const startTime = Date.now();

    try {
      const key = `${asset}_${timeframe}`;
      const metadata = this.cacheMap.get(key);

      if (!metadata) {
        return {
          success: false,
          assetsCleared: 0,
          candlesRemoved: 0,
          spacedFreed: 0,
          duration: Date.now() - startTime,
          error: 'Cache not found',
        };
      }

      this.cacheMap.delete(key);

      return {
        success: true,
        assetsCleared: 1,
        candlesRemoved: metadata.candleCount,
        spacedFreed: metadata.fileSize,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        assetsCleared: 0,
        candlesRemoved: 0,
        spacedFreed: 0,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Validar si cache es vigente para rango de fechas
   */
  private isCacheValid(metadata: CacheMetadata, startDate: number, endDate: number): boolean {
    const now = Date.now();
    const isNotExpired = now < metadata.expiresAt;
    const coversRange = metadata.startDate <= startDate && metadata.endDate >= endDate;
    return isNotExpired && coversRange;
  }

  /**
   * Generar velas demo (fallback cuando no hay cache)
   */
  private generateDemoCandles(
    asset: Asset,
    timeframe: Timeframe,
    startDate: number,
    endDate: number
  ): CandleData[] {
    const candles: CandleData[] = [];
    const timeframeMs = this.timeframeToMs(timeframe);
    const basePrice = this.getBasePrice(asset);
    const volatility = this.getVolatility(asset);

    let timestamp = Math.floor(startDate / timeframeMs) * timeframeMs;
    let price = basePrice;

    while (timestamp <= endDate) {
      const change = (Math.random() - 0.5) * volatility;
      const open = price;
      const close = price * (1 + change);
      const high = Math.max(open, close) * (1 + Math.random() * 0.005);
      const low = Math.min(open, close) * (1 - Math.random() * 0.005);
      const volume = 1000000 + Math.random() * 500000;

      candles.push({
        timestamp,
        open,
        high,
        low,
        close,
        volume,
      });

      price = close;
      timestamp += timeframeMs;
    }

    return candles;
  }

  /**
   * Generar velas demo desde metadata de cache
   */
  private generateDemoCandlesFromCache(
    asset: Asset,
    timeframe: Timeframe,
    startDate: number,
    endDate: number
  ): CandleData[] {
    // En producción, leerías del FS/SQLite
    // Por ahora, regenerar (no es ideal pero mantiene demo funcional)
    return this.generateDemoCandles(asset, timeframe, startDate, endDate);
  }

  /**
   * Conversión de timeframe a milisegundos
   */
  private timeframeToMs(timeframe: Timeframe): number {
    const map: Record<Timeframe, number> = {
      '1H': 60 * 60 * 1000,
      '45M': 45 * 60 * 1000,
      '5M': 5 * 60 * 1000,
    };
    return map[timeframe];
  }

  /**
   * Precio base para demo data generación
   */
  private getBasePrice(asset: Asset): number {
    const prices: Record<Asset, number> = {
      XAUUSD: 2000,
      EURUSD: 1.1,
      GBPUSD: 1.27,
      BTCUSD: 65000,
    };
    return prices[asset];
  }

  /**
   * Volatilidad para demo data generación
   */
  private getVolatility(asset: Asset): number {
    const volatilities: Record<Asset, number> = {
      XAUUSD: 0.008, // 0.8%
      EURUSD: 0.006, // 0.6%
      GBPUSD: 0.007, // 0.7%
      BTCUSD: 0.04, // 4%
    };
    return volatilities[asset];
  }

  /**
   * Hash para validación
   */
  private hashMetadata(asset: Asset, timeframe: Timeframe): string {
    const str = `${asset}_${timeframe}_${Date.now()}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convertir a 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Formatear fecha
   */
  private formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleString();
  }

  /**
   * Formatear duración
   */
  private formatDuration(ms: number): string {
    if (ms < 60000) return `${Math.round(ms / 1000)}s`;
    if (ms < 3600000) return `${Math.round(ms / 60000)}m`;
    return `${Math.round(ms / 3600000)}h`;
  }
}

// Singleton instance
let cacheManagerInstance: CacheManager | null = null;

export async function getCacheManager(): Promise<CacheManager> {
  if (!cacheManagerInstance) {
    cacheManagerInstance = new CacheManager();
    await cacheManagerInstance.initialize();
  }
  return cacheManagerInstance;
}

export async function resetCacheManager(): Promise<void> {
  cacheManagerInstance = null;
}
