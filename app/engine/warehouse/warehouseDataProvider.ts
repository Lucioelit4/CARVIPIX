import { DataProvider } from "../data/dataProvider";
import type {
  Asset,
  Candle,
  ConnectionState,
  DataHealthStatus,
  DataQuality,
  MarketData,
  TechnicalIndicators,
  Tick,
  Timeframe,
} from "../types/marketData";
import { getInstitutionalDataWarehouse, InstitutionalDataWarehouse } from "./institutionalDataWarehouse";

export class WarehouseDataProvider extends DataProvider {
  private connected = false;

  constructor(
    assets: Asset[],
    timeframes: Timeframe[],
    private readonly warehouse: InstitutionalDataWarehouse = getInstitutionalDataWarehouse(),
  ) {
    super(assets, timeframes);
  }

  async connect(): Promise<void> {
    this.connected = true;
  }

  async disconnect(): Promise<void> {
    this.connected = false;
  }

  async getCandle(asset: Asset, timeframe: Timeframe): Promise<Candle | null> {
    const marketData = await this.getMarketData(asset, timeframe);
    return marketData?.candle ?? null;
  }

  async getTick(asset: Asset): Promise<Tick | null> {
    const marketData = await this.getMarketData(asset, "5M");
    return marketData?.tick ?? null;
  }

  async calculateIndicators(asset: Asset, timeframe: Timeframe): Promise<TechnicalIndicators | null> {
    const marketData = await this.getMarketData(asset, timeframe);
    return marketData?.indicators ?? null;
  }

  async getMarketData(asset: Asset, timeframe: Timeframe): Promise<MarketData | null> {
    if (!this.connected) {
      this.recordError(asset, timeframe);
      return null;
    }

    const data = this.warehouse.buildEngineMarketData(asset, timeframe);
    if (!data) {
      this.recordError(asset, timeframe);
      return null;
    }

    this.recordSuccess(asset, timeframe);
    return data;
  }

  async checkHealth(): Promise<DataQuality> {
    const status = this.warehouse.buildHealthStatus();
    return {
      isHealthy: status.overallHealth >= 80,
      latency: status.avgLatency,
      completeness: status.overallHealth,
      freshness: 0,
      errors: status.recentErrors,
      lastHealthCheck: status.timestamp,
    };
  }

  async getConnectionState(asset: Asset, timeframe: Timeframe): Promise<ConnectionState> {
    const status = this.warehouse.buildHealthStatus();
    return status.connectionStates[asset][timeframe];
  }

  async getHealthStatus(): Promise<DataHealthStatus> {
    return this.warehouse.buildHealthStatus();
  }
}
