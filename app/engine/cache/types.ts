/**
 * Types para sistema de cache local
 * Almacenamiento de datos históricos sin depender de APIs
 */

export type Asset = 'XAUUSD' | 'EURUSD' | 'GBPUSD' | 'BTCUSD';
export type Timeframe = '1H' | '45M' | '5M';

export interface CacheMetadata {
  asset: Asset;
  timeframe: Timeframe;
  candleCount: number;
  startDate: number; // timestamp
  endDate: number; // timestamp
  lastUpdated: number; // timestamp
  expiresAt: number; // timestamp (validez del cache)
  hash: string; // hash para validación
  fileSize: number; // bytes
  source: 'api' | 'demo';
}

export interface CacheStatus {
  isValid: boolean;
  age: number; // milliseconds desde última actualización
  percentComplete: number; // 0-100
  message: string;
}

export interface CacheStats {
  totalAssets: number;
  totalTimeframes: number;
  totalCandleCount: number;
  totalFileSize: number; // bytes
  cacheHitRate: number; // 0-100
  datasets: CacheMetadata[];
}

export interface CandleData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface CacheWriteResult {
  success: boolean;
  asset: Asset;
  timeframe: Timeframe;
  candlesWritten: number;
  duration: number; // ms
  error?: string;
}

export interface CacheReadResult {
  success: boolean;
  candles: CandleData[];
  metadata: CacheMetadata | null;
  duration: number; // ms
  fromCache: boolean; // true si es del cache, false si es demo
  error?: string;
}

export interface CacheClearResult {
  success: boolean;
  assetsCleared: number;
  candlesRemoved: number;
  spacedFreed: number; // bytes
  duration: number; // ms
  error?: string;
}
