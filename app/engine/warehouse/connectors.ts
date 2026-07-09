import type {
  DownloadBatchRequest,
  InstitutionalAsset,
  InstitutionalCandleRecord,
  InstitutionalProviderId,
  WarehouseConnectorDescriptor,
  WarehouseDownloadRequest,
  WarehouseTimeframe,
} from "./types";

export interface WarehouseConnector {
  readonly descriptor: WarehouseConnectorDescriptor;
  normalize(request: WarehouseDownloadRequest): DownloadBatchRequest;
}

abstract class BaseConnector implements WarehouseConnector {
  abstract readonly descriptor: WarehouseConnectorDescriptor;

  normalize(request: WarehouseDownloadRequest): DownloadBatchRequest {
    return {
      symbol: request.symbol,
      timeframe: request.timeframe,
      provider: this.descriptor.provider,
      version: request.version,
      downloadedBy: request.requestedBy,
      origin: request.mode === "incremental" || request.mode === "resume" ? "incremental" : "download",
      sourceTimezone: request.sourceTimezone,
      resumeToken: request.resumeToken,
      rows: this.normalizeRows(request),
    };
  }

  protected abstract normalizeRows(request: WarehouseDownloadRequest): Array<Partial<InstitutionalCandleRecord>>;

  protected ensureArrayPayload(request: WarehouseDownloadRequest): Array<Record<string, unknown>> {
    if (Array.isArray(request.sourcePayload)) {
      return request.sourcePayload as Array<Record<string, unknown>>;
    }
    if (!request.sourcePayload || typeof request.sourcePayload !== "object") {
      return [];
    }
    if (Array.isArray((request.sourcePayload as { values?: unknown[] }).values)) {
      return (request.sourcePayload as { values: Array<Record<string, unknown>> }).values;
    }
    return [];
  }

  protected toNumber(value: unknown): number | null {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === "string" && value.trim().length > 0) {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
  }

  protected defaultContext(symbol: InstitutionalAsset, spread: number | null, timestampUtc: number) {
    return {
      session: this.resolveSession(timestampUtc),
      market: this.resolveMarket(symbol),
      volatility: 0,
      liquidity: 0,
      spread: spread ?? 0,
      marketState: "open" as const,
      news: [],
      economicCalendar: [],
      holidays: [],
      tradingHour: new Date(timestampUtc).getUTCHours(),
      daylightSavingShift: false,
      classifications: [],
    };
  }

  private resolveSession(timestampUtc: number) {
    const hour = new Date(timestampUtc).getUTCHours();
    if (hour >= 0 && hour < 7) return "asian" as const;
    if (hour >= 7 && hour < 12) return "london" as const;
    if (hour >= 12 && hour < 16) return "overlap" as const;
    if (hour >= 16 && hour < 21) return "new_york" as const;
    return "off_session" as const;
  }

  private resolveMarket(symbol: InstitutionalAsset) {
    if (symbol === "BTCUSD") return "crypto" as const;
    if (symbol === "XAUUSD") return "metal" as const;
    if (symbol === "NAS100" || symbol === "US30") return "index" as const;
    return "fx" as const;
  }
}

class JsonOhlcConnector extends BaseConnector {
  constructor(public readonly descriptor: WarehouseConnectorDescriptor) {
    super();
  }

  protected normalizeRows(request: WarehouseDownloadRequest): Array<Partial<InstitutionalCandleRecord>> {
    const normalized: Array<Partial<InstitutionalCandleRecord> | null> = this.ensureArrayPayload(request)
      .map((row) => {
        const timestampUtc = this.toNumber(row.timestampUtc ?? row.timestamp ?? row.datetime);
        const open = this.toNumber(row.open ?? row.o);
        const high = this.toNumber(row.high ?? row.h);
        const low = this.toNumber(row.low ?? row.l);
        const close = this.toNumber(row.close ?? row.c);
        const bid = this.toNumber(row.bid);
        const ask = this.toNumber(row.ask);
        const spread = this.toNumber(row.spread);
        const volume = this.toNumber(row.volume ?? row.v);
        const tickVolume = this.toNumber(row.tickVolume ?? row.tick_volume);
        if (timestampUtc === null || open === null || high === null || low === null || close === null) {
          return null;
        }
        return {
          timestampUtc,
          open,
          high,
          low,
          close,
          bid,
          ask,
          spread,
          volume,
          tickVolume,
          context: this.defaultContext(request.symbol, spread, timestampUtc),
        };
      });

    return normalized.filter((row): row is Partial<InstitutionalCandleRecord> => row !== null);
  }
}

class CsvConnector extends BaseConnector {
  readonly descriptor: WarehouseConnectorDescriptor = {
    provider: "csv_import",
    label: "CSV Import",
    capabilities: { fullDownload: true, incremental: true, resume: true, retries: false, search: true },
    supportsTick: true,
  };

  protected normalizeRows(request: WarehouseDownloadRequest): Array<Partial<InstitutionalCandleRecord>> {
    if (typeof request.sourcePayload !== "string") {
      return [];
    }

    const lines = request.sourcePayload
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
    if (lines.length < 2) {
      return [];
    }

    const headers = lines[0].split(",").map((header) => header.trim().toLowerCase());
    return lines.slice(1).map((line) => {
      const values = line.split(",");
      const row = Object.fromEntries(headers.map((header, index) => [header, values[index]]));
      const timestampUtc = this.toNumber(row.timestamputc ?? row.timestamp ?? row.datetime);
      const open = this.toNumber(row.open);
      const high = this.toNumber(row.high);
      const low = this.toNumber(row.low);
      const close = this.toNumber(row.close);
      const bid = this.toNumber(row.bid);
      const ask = this.toNumber(row.ask);
      const spread = this.toNumber(row.spread);
      const volume = this.toNumber(row.volume);
      const tickVolume = this.toNumber(row.tickvolume);
      return {
        timestampUtc: timestampUtc ?? 0,
        open: open ?? 0,
        high: high ?? 0,
        low: low ?? 0,
        close: close ?? 0,
        bid,
        ask,
        spread,
        volume,
        tickVolume,
        context: this.defaultContext(request.symbol, spread, timestampUtc ?? 0),
      };
    });
  }
}

class CertifiedFileConnector extends JsonOhlcConnector {
  readonly descriptor: WarehouseConnectorDescriptor = {
    provider: "certified_file",
    label: "Certified File",
    capabilities: { fullDownload: true, incremental: true, resume: true, retries: false, search: true },
    supportsTick: true,
  };
}

class ManualConnector extends JsonOhlcConnector {
  readonly descriptor: WarehouseConnectorDescriptor = {
    provider: "manual_data",
    label: "Manual Data",
    capabilities: { fullDownload: true, incremental: true, resume: true, retries: false, search: true },
    supportsTick: true,
  };
}

export function buildWarehouseConnectors(): Map<InstitutionalProviderId, WarehouseConnector> {
  const connectors = new Map<InstitutionalProviderId, WarehouseConnector>();

  const jsonConnectors: WarehouseConnectorDescriptor[] = [
    {
      provider: "twelve_data",
      label: "Twelve Data",
      capabilities: { fullDownload: true, incremental: true, resume: true, retries: true, search: true },
      supportsTick: false,
    },
    {
      provider: "polygon",
      label: "Polygon",
      capabilities: { fullDownload: true, incremental: true, resume: true, retries: true, search: true },
      supportsTick: true,
    },
    {
      provider: "alpha_vantage",
      label: "Alpha Vantage",
      capabilities: { fullDownload: true, incremental: true, resume: true, retries: true, search: true },
      supportsTick: false,
    },
    {
      provider: "binance",
      label: "Binance",
      capabilities: { fullDownload: true, incremental: true, resume: true, retries: true, search: true },
      supportsTick: true,
    },
    {
      provider: "manual_certified",
      label: "Manual Certified",
      capabilities: { fullDownload: true, incremental: true, resume: true, retries: false, search: true },
      supportsTick: true,
    },
    {
      provider: "institutional_provider",
      label: "Institutional Provider",
      capabilities: { fullDownload: true, incremental: true, resume: true, retries: true, search: true },
      supportsTick: true,
    },
    {
      provider: "institutional_warehouse",
      label: "Institutional Warehouse Local",
      capabilities: { fullDownload: false, incremental: false, resume: false, retries: false, search: true },
      supportsTick: true,
    },
  ];

  for (const descriptor of jsonConnectors) {
    connectors.set(descriptor.provider, new JsonOhlcConnector(descriptor));
  }

  connectors.set("csv_import", new CsvConnector());
  connectors.set("certified_file", new CertifiedFileConnector({
    provider: "certified_file",
    label: "Certified File",
    capabilities: { fullDownload: true, incremental: true, resume: true, retries: false, search: true },
    supportsTick: true,
  }));
  connectors.set("manual_data", new ManualConnector({
    provider: "manual_data",
    label: "Manual Data",
    capabilities: { fullDownload: true, incremental: true, resume: true, retries: false, search: true },
    supportsTick: true,
  }));

  return connectors;
}

export function listWarehouseConnectorDescriptors(): WarehouseConnectorDescriptor[] {
  return [...buildWarehouseConnectors().values()].map((connector) => connector.descriptor);
}

export function supportsTimeframe(provider: InstitutionalProviderId, timeframe: WarehouseTimeframe): boolean {
  const connector = buildWarehouseConnectors().get(provider);
  if (!connector) {
    return false;
  }
  if (timeframe === "Tick") {
    return connector.descriptor.supportsTick;
  }
  return true;
}
