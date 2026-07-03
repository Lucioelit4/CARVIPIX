/**
 * Tipos y interfaces para proveedor de datos real
 * Define configuración, estados y conectores para APIs reales de mercado
 */

/**
 * Estados de conexión del proveedor real
 */
export type RealProviderConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error';

/**
 * Estadísticas de latencia
 */
export interface LatencyStats {
  min: number;
  max: number;
  avg: number;
  p95: number;
  p99: number;
  lastMeasurement: number;
}

/**
 * Evento de conexión/desconexión
 */
export interface ConnectionEvent {
  timestamp: number;
  type: 'connected' | 'disconnected' | 'connecting' | 'reconnecting' | 'error';
  message: string;
  error?: Error;
}

/**
 * Log de operación del proveedor real
 */
export interface ProviderOperationLog {
  timestamp: number;
  operation: string;
  asset?: string;
  timeframe?: string;
  duration: number;
  success: boolean;
  error?: string;
}

/**
 * Configuración del proveedor real
 */
export interface RealProviderConfig {
  provider: 'alpha-vantage' | 'oanda' | 'ninjatrader' | 'twelve_data' | 'custom';
  apiKey?: string;
  apiSecret?: string;
  baseUrl?: string;
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
  reconnectAttempts?: number;
  reconnectDelay?: number;
  rateLimit?: number; // requests per minute
}

/**
 * Estado actual del proveedor real
 */
export interface RealProviderState {
  connectionState: RealProviderConnectionState;
  isHealthy: boolean;
  connectedAt?: number;
  disconnectedAt?: number;
  lastErrorAt?: number;
  lastErrorMessage?: string;
  latency: LatencyStats;
  failureCount: number;
  successCount: number;
  totalRequests: number;
  connectionHistory: ConnectionEvent[];
  operationLogs: ProviderOperationLog[];
}

/**
 * Credenciales del proveedor (nunca en memoria prolongadamente)
 */
export interface ProviderCredentials {
  apiKey: string;
  apiSecret?: string;
  baseUrl?: string;
}

/**
 * Respuesta de healthcheck del proveedor
 */
export interface ProviderHealthCheck {
  timestamp: number;
  isHealthy: boolean;
  connectionState: RealProviderConnectionState;
  lastSuccessfulRequest?: number;
  latency: LatencyStats;
  failureCount: number;
  message: string;
}
