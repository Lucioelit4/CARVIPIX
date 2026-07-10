/**
 * Tipos de datos de mercado para Trading Engine
 * Solo lectura - no operaciones
 */

export type Timeframe = '1H' | '45M' | '5M';
export type Asset = 'XAUUSD' | 'EURUSD' | 'GBPUSD' | 'BTCUSD';

/**
 * Vela OHLC (Open, High, Low, Close)
 * Estructura base para datos históricos
 */
export interface Candle {
  timestamp: number; // Unix timestamp en ms
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  asset: Asset;
  timeframe: Timeframe;
  complete: boolean; // True si vela está cerrada
}

/**
 * Tick de precio en vivo
 * Estructura para datos de tiempo real
 */
export interface Tick {
  timestamp: number; // Unix timestamp en ms
  bid: number;
  ask: number;
  asset: Asset;
  spread?: number; // Ask - Bid
  volume?: number;
  lastUpdate: number;
}

/**
 * Indicadores técnicos calculados
 */
export interface TechnicalIndicators {
  ema20: number;
  ema50: number;
  ema200: number;
  atr: number;
  adx: number;
  rsi: number;
  spread: number;
  volatility: number;
  timestamp: number;
  internal?: {
    close: number;
  };
}

/**
 * Datos completos de mercado
 * Combina velas, ticks e indicadores
 */
export interface MarketData {
  asset: Asset;
  timeframe: Timeframe;
  candle: Candle;
  tick: Tick;
  indicators: TechnicalIndicators;
  lastUpdate: number;
  quality: DataQuality;
}

/**
 * Calidad de datos
 * Información sobre salud y estado de la fuente
 */
export interface DataQuality {
  isHealthy: boolean;
  latency: number; // ms
  completeness: number; // 0-100 %
  freshness: number; // ms desde última actualización
  errors: DataError[];
  lastHealthCheck: number;
}

/**
 * Error de datos
 * Registro de problemas con la fuente
 */
export interface DataError {
  timestamp: number;
  asset: Asset;
  timeframe?: Timeframe;
  errorType: 'latency' | 'incomplete' | 'delayed' | 'disconnected' | 'invalid';
  message: string;
  severity: 'warning' | 'error' | 'critical';
  recoveryAttempt?: boolean;
  recoveredAt?: number;
}

/**
 * Estado de conexión de fuente
 */
export interface ConnectionState {
  asset: Asset;
  timeframe: Timeframe;
  status: 'connected' | 'disconnected' | 'reconnecting' | 'error';
  lastConnect: number;
  lastDisconnect?: number;
  uptime: number; // ms
  failureCount: number;
  consecutiveErrors: number;
}

/**
 * Configuración de datos
 */
export interface DataConfig {
  assets: Asset[];
  timeframes: Timeframe[];
  enableRealData: boolean; // False = demo, True = real
  dataProvider: 'demo' | 'real'; // Tipo de proveedor
  refreshInterval: number; // ms
  maxErrorsBeforeAlert: number;
  healthCheckInterval: number; // ms
}

/**
 * Estado general de datos
 * Vista de todo el sistema de datos
 */
export interface DataHealthStatus {
  timestamp: number;
  overallHealth: number; // 0-100 %
  connectedAssets: Asset[];
  disconnectedAssets: Asset[];
  totalErrors: number;
  activeAssets: number;
  dataProvider: 'demo' | 'real';
  avgLatency: number;
  uptime: number; // %
  lastUpdate: number;
  connectionStates: Record<Asset, Record<Timeframe, ConnectionState>>;
  recentErrors: DataError[];
}

/**
 * Respuesta de salud de datos
 * Para panel admin
 */
export interface DataHealthResponse {
  status: DataHealthStatus;
  assets: {
    asset: Asset;
    health: number;
    latency: number;
    errors: number;
    lastUpdate: number;
    completeness: number;
  }[];
  timeframes: {
    timeframe: Timeframe;
    assets: Asset[];
  }[];
  recentFailures: DataError[];
  systemMessage: string;
}
