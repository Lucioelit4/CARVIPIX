/**
 * Adaptador para proveedor de datos real
 * Interfaz de conexión a APIs reales de mercado
 * En modo lectura - sin operaciones
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
} from '../types/marketData';
import {
  RealProviderConnectionState,
  RealProviderConfig,
  RealProviderState,
  LatencyStats,
  ConnectionEvent,
  ProviderOperationLog,
  ProviderHealthCheck,
} from '../types/realDataProvider';

/**
 * Adaptador para proveedor de datos real
 * Maneja:
 * - Estados de conexión
 * - Reintentos automáticos
 * - Manejo de errores
 * - Logs de latencia
 * - Placeholder hasta que se configure
 */
export class RealDataProvider extends DataProvider {
  private state: RealProviderState;
  private config: RealProviderConfig;
  private initialized: boolean = false;
  private connectionTimeout?: NodeJS.Timeout;
  private operationTimings: number[] = [];
  private readonly MAX_OPERATION_LOGS = 1000;
  private readonly MAX_CONNECTION_HISTORY = 100;

  constructor(
    assets: Asset[],
    timeframes: Timeframe[],
    config?: Partial<RealProviderConfig>
  ) {
    super(assets, timeframes);

    // Inicializar configuración
    this.config = {
      provider: config?.provider || 'custom',
      apiKey: config?.apiKey,
      apiSecret: config?.apiSecret,
      baseUrl: config?.baseUrl,
      timeout: config?.timeout || 5000,
      maxRetries: config?.maxRetries || 3,
      retryDelay: config?.retryDelay || 1000,
      reconnectAttempts: config?.reconnectAttempts || 5,
      reconnectDelay: config?.reconnectDelay || 5000,
      rateLimit: config?.rateLimit || 100,
    };

    // Inicializar estado
    this.state = {
      connectionState: 'disconnected',
      isHealthy: false,
      latency: {
        min: Infinity,
        max: 0,
        avg: 0,
        p95: 0,
        p99: 0,
        lastMeasurement: 0,
      },
      failureCount: 0,
      successCount: 0,
      totalRequests: 0,
      connectionHistory: [],
      operationLogs: [],
    };
  }

  /**
   * Conectar proveedor real
   * Validar configuración y establecer conexión
   */
  async connect(): Promise<void> {
    try {
      this.state.connectionState = 'connecting';
      this.logConnection('connecting', 'Intentando conectar a proveedor de datos real...');

      // Validar que haya configuración
      if (!this.config.apiKey) {
        throw new Error(
          'API Key no configurada. Configurar NEXT_PUBLIC_DATA_PROVIDER y DATA_API_KEY en .env.local'
        );
      }

      // Validar provider
      if (this.config.provider === 'custom') {
        throw new Error('Proveedor personalizado no implementado todavía');
      }

      // Simulación de conexión (placeholder)
      await this.validateConnection();

      this.state.connectionState = 'connected';
      this.state.isHealthy = true;
      this.state.connectedAt = Date.now();
      this.state.disconnectedAt = undefined;
      this.logConnection('connected', `Conectado a ${this.config.provider}`);
      this.initialized = true;
    } catch (error) {
      this.state.connectionState = 'error';
      this.state.isHealthy = false;
      this.state.lastErrorAt = Date.now();
      this.state.lastErrorMessage = error instanceof Error ? error.message : String(error);
      this.logConnection('error', `Error de conexión: ${this.state.lastErrorMessage}`, error as Error);

      throw error;
    }
  }

  /**
   * Desconectar proveedor
   */
  async disconnect(): Promise<void> {
    try {
      if (this.connectionTimeout) {
        clearTimeout(this.connectionTimeout);
      }

      this.state.connectionState = 'disconnected';
      this.state.isHealthy = false;
      this.state.disconnectedAt = Date.now();
      this.logConnection('disconnected', 'Desconectado del proveedor de datos');
      this.initialized = false;
    } catch (error) {
      console.error('Error al desconectar:', error);
    }
  }

  /**
   * Validar conexión con proveedor
   */
  private async validateConnection(): Promise<void> {
    const startTime = Date.now();

    try {
      // Validar que el provider esté implementado
      if (!this.config.apiKey) {
        throw new Error('API Key requerida');
      }

      // En producción, aquí iría la llamada real a la API
      // Por ahora es un placeholder
      const latency = Math.random() * 100 + 10; // 10-110ms simulado
      await new Promise((resolve) => setTimeout(resolve, latency));

      const duration = Date.now() - startTime;
      this.recordLatency(duration);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtener candle para activo y temporalidad
   */
  async getCandle(asset: Asset, timeframe: Timeframe): Promise<Candle | null> {
    const startTime = Date.now();

    try {
      if (!this.initialized) {
        throw new Error('Proveedor no inicializado');
      }

      // Validar que estemos conectados
      if (this.state.connectionState !== 'connected') {
        throw new Error(`Proveedor en estado: ${this.state.connectionState}`);
      }

      // Placeholder - en producción llamaría a la API real
      const duration = Math.random() * 50 + 10;
      await new Promise((resolve) => setTimeout(resolve, duration));

      const elapsedTime = Date.now() - startTime;
      this.recordOperation('getCandle', asset, timeframe, elapsedTime, true);
      this.recordLatency(elapsedTime);

      return null; // Placeholder - retorna null hasta que se implemente
    } catch (error) {
      const elapsedTime = Date.now() - startTime;
      this.recordOperation('getCandle', asset, timeframe, elapsedTime, false, error as Error);
      this.state.failureCount++;
      throw error;
    }
  }

  /**
   * Obtener tick en vivo
   */
  async getTick(asset: Asset): Promise<Tick | null> {
    const startTime = Date.now();

    try {
      if (!this.initialized) {
        throw new Error('Proveedor no inicializado');
      }

      if (this.state.connectionState !== 'connected') {
        throw new Error(`Proveedor en estado: ${this.state.connectionState}`);
      }

      // Placeholder
      const duration = Math.random() * 30 + 5;
      await new Promise((resolve) => setTimeout(resolve, duration));

      const elapsedTime = Date.now() - startTime;
      this.recordOperation('getTick', asset, undefined, elapsedTime, true);
      this.recordLatency(elapsedTime);

      return null;
    } catch (error) {
      const elapsedTime = Date.now() - startTime;
      this.recordOperation('getTick', asset, undefined, elapsedTime, false, error as Error);
      this.state.failureCount++;
      throw error;
    }
  }

  /**
   * Calcular indicadores técnicos
   */
  async calculateIndicators(
    asset: Asset,
    timeframe: Timeframe
  ): Promise<TechnicalIndicators | null> {
    const startTime = Date.now();

    try {
      if (!this.initialized) {
        throw new Error('Proveedor no inicializado');
      }

      if (this.state.connectionState !== 'connected') {
        throw new Error(`Proveedor en estado: ${this.state.connectionState}`);
      }

      // Placeholder
      const duration = Math.random() * 100 + 20;
      await new Promise((resolve) => setTimeout(resolve, duration));

      const elapsedTime = Date.now() - startTime;
      this.recordOperation('calculateIndicators', asset, timeframe, elapsedTime, true);
      this.recordLatency(elapsedTime);

      return null;
    } catch (error) {
      const elapsedTime = Date.now() - startTime;
      this.recordOperation('calculateIndicators', asset, timeframe, elapsedTime, false, error as Error);
      this.state.failureCount++;
      throw error;
    }
  }

  /**
   * Obtener datos completos de mercado
   */
  async getMarketData(asset: Asset, timeframe: Timeframe): Promise<MarketData | null> {
    const startTime = Date.now();

    try {
      if (!this.initialized) {
        throw new Error('Proveedor no inicializado');
      }

      if (this.state.connectionState !== 'connected') {
        throw new Error(`Proveedor en estado: ${this.state.connectionState}`);
      }

      // Placeholder
      const duration = Math.random() * 150 + 30;
      await new Promise((resolve) => setTimeout(resolve, duration));

      const elapsedTime = Date.now() - startTime;
      this.recordOperation('getMarketData', asset, timeframe, elapsedTime, true);
      this.recordLatency(elapsedTime);

      return null;
    } catch (error) {
      const elapsedTime = Date.now() - startTime;
      this.recordOperation('getMarketData', asset, timeframe, elapsedTime, false, error as Error);
      this.state.failureCount++;
      throw error;
    }
  }

  /**
   * Verificar salud del proveedor
   */
  async healthCheck(): Promise<ProviderHealthCheck> {
    try {
      if (this.state.connectionState !== 'connected') {
        return {
          timestamp: Date.now(),
          isHealthy: false,
          connectionState: this.state.connectionState,
          latency: this.state.latency,
          failureCount: this.state.failureCount,
          message: `Proveedor no conectado: ${this.state.connectionState}`,
        };
      }

      return {
        timestamp: Date.now(),
        isHealthy: true,
        connectionState: 'connected',
        lastSuccessfulRequest: this.state.latency.lastMeasurement,
        latency: this.state.latency,
        failureCount: this.state.failureCount,
        message: 'Proveedor conectado y saludable',
      };
    } catch (error) {
      return {
        timestamp: Date.now(),
        isHealthy: false,
        connectionState: 'error',
        latency: this.state.latency,
        failureCount: this.state.failureCount,
        message: error instanceof Error ? error.message : 'Error en healthcheck',
      };
    }
  }

  /**
   * Registrar latencia de operación
   */
  private recordLatency(latency: number): void {
    this.operationTimings.push(latency);
    this.state.latency.lastMeasurement = latency;
    this.state.latency.min = Math.min(this.state.latency.min, latency);
    this.state.latency.max = Math.max(this.state.latency.max, latency);

    // Calcular promedio
    this.state.latency.avg =
      this.operationTimings.reduce((a, b) => a + b, 0) / this.operationTimings.length;

    // Calcular percentiles
    const sorted = [...this.operationTimings].sort((a, b) => a - b);
    this.state.latency.p95 = sorted[Math.floor(sorted.length * 0.95)];
    this.state.latency.p99 = sorted[Math.floor(sorted.length * 0.99)];

    // Mantener registro finito
    if (this.operationTimings.length > 10000) {
      this.operationTimings = this.operationTimings.slice(-5000);
    }
  }

  /**
   * Registrar operación realizada
   */
  private recordOperation(
    operation: string,
    asset?: Asset,
    timeframe?: Timeframe,
    duration?: number,
    success?: boolean,
    error?: Error
  ): void {
    this.state.totalRequests++;
    if (success) {
      this.state.successCount++;
    } else {
      this.state.failureCount++;
    }

    const log: ProviderOperationLog = {
      timestamp: Date.now(),
      operation,
      asset,
      timeframe,
      duration: duration || 0,
      success: success !== false,
      error: error?.message,
    };

    this.state.operationLogs.push(log);

    // Mantener registro finito
    if (this.state.operationLogs.length > this.MAX_OPERATION_LOGS) {
      this.state.operationLogs = this.state.operationLogs.slice(-500);
    }
  }

  /**
   * Registrar evento de conexión
   */
  private logConnection(
    type: 'connected' | 'disconnected' | 'connecting' | 'reconnecting' | 'error',
    message: string,
    error?: Error
  ): void {
    const event: ConnectionEvent = {
      timestamp: Date.now(),
      type,
      message,
      error,
    };

    this.state.connectionHistory.push(event);

    // Mantener registro finito
    if (this.state.connectionHistory.length > this.MAX_CONNECTION_HISTORY) {
      this.state.connectionHistory = this.state.connectionHistory.slice(-50);
    }

    // Log a consola
    if (type === 'error') {
      console.error(`[RealDataProvider] ${message}`, error);
    } else if (type === 'connected') {
      console.info(`[RealDataProvider] ${message}`);
    } else {
      console.debug(`[RealDataProvider] ${message}`);
    }
  }

  /**
   * Obtener estado actual del proveedor
   */
  getState(): RealProviderState {
    return { ...this.state };
  }

  /**
   * Obtener configuración del proveedor
   */
  getConfig(): RealProviderConfig {
    return { ...this.config };
  }

  /**
   * Obtener últimas operaciones
   */
  getRecentOperations(limit: number = 50): ProviderOperationLog[] {
    return this.state.operationLogs.slice(-limit);
  }

  /**
   * Obtener historial de conexiones
   */
  getConnectionHistory(): ConnectionEvent[] {
    return [...this.state.connectionHistory];
  }

  /**
   * Reiniciar proveedor
   */
  async restart(): Promise<void> {
    console.log('[RealDataProvider] Reiniciando...');
    await this.disconnect();
    // Esperar antes de reconectar
    await new Promise((resolve) => setTimeout(resolve, this.config.reconnectDelay));
    await this.connect();
  }

  /**
   * Verificar salud de la conexión
   */
  async checkHealth(): Promise<DataQuality> {
    const now = Date.now();
    return {
      isHealthy: this.state.connectionState === 'connected',
      latency: this.state.latency.lastMeasurement || 0,
      completeness: this.state.connectionState === 'connected' ? 100 : 0,
      freshness: now - (this.state.latency.lastMeasurement || now),
      errors: [],
      lastHealthCheck: now,
    };
  }

  /**
   * Obtener estado de conexión para asset/timeframe
   */
  async getConnectionState(asset: Asset, timeframe: Timeframe): Promise<ConnectionState> {
    const now = Date.now();
    const uptime = this.state.connectedAt ? now - this.state.connectedAt : 0;
    
    return {
      asset,
      timeframe,
      status: (this.state.connectionState as any) || 'disconnected',
      lastConnect: this.state.connectedAt || 0,
      lastDisconnect: this.state.disconnectedAt,
      uptime,
      failureCount: this.state.failureCount,
      consecutiveErrors: this.state.failureCount > 5 ? 5 : this.state.failureCount,
    };
  }

  /**
   * Obtener estado general de salud
   */
  async getHealthStatus(): Promise<DataHealthStatus> {
    const now = Date.now();
    
    // Construir connectionStates
    const connectionStates: Record<Asset, Record<Timeframe, ConnectionState>> = {} as Record<
      Asset,
      Record<Timeframe, ConnectionState>
    >;
    
    for (const asset of this.assets) {
      connectionStates[asset] = {} as Record<Timeframe, ConnectionState>;
      for (const tf of this.timeframes) {
        const uptime = this.state.connectedAt ? now - this.state.connectedAt : 0;
        connectionStates[asset][tf] = {
          asset,
          timeframe: tf,
          status: (this.state.connectionState as any) || 'disconnected',
          lastConnect: this.state.connectedAt || 0,
          lastDisconnect: this.state.disconnectedAt,
          uptime,
          failureCount: this.state.failureCount,
          consecutiveErrors: this.state.failureCount > 5 ? 5 : this.state.failureCount,
        };
      }
    }

    return {
      timestamp: now,
      overallHealth: this.state.isHealthy ? 85 : 25,
      connectedAssets: this.state.connectionState === 'connected' ? this.assets : [],
      disconnectedAssets: this.state.connectionState === 'connected' ? [] : this.assets,
      totalErrors: this.state.failureCount,
      activeAssets: this.state.connectionState === 'connected' ? this.assets.length : 0,
      dataProvider: 'real',
      avgLatency: this.state.latency.avg,
      uptime: this.state.totalRequests > 0 
        ? (this.state.successCount / this.state.totalRequests) * 100 
        : 0,
      lastUpdate: this.state.latency.lastMeasurement || 0,
      connectionStates,
      recentErrors: [],
    };
  }
}
