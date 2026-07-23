/**
 * Real Data Ingestion Service — Feeds Twelve Data into MarketDataPipeline
 * Minimal implementation for Maestro V3 certification with real market data
 * 
 * Purpose: 
 * - Fetch real candles from Twelve Data
 * - Load historical data into pipeline at startup
 * - Maintain periodic updates for real-time analysis
 */

import type { MarketDataPipeline } from "../../engine/data/marketDataPipeline";
import type { IndicatorFramework } from "../../engine/data/indicatorFramework";
import type { CanonicalSymbol } from "./typesMaestroV3";
import { TwelveDataTimeSeriesService } from "../../backend/data-platform/providers/twelve-data/timeSeries";
import { getTwelveDataRuntimeConfig, isTwelveDataOfficialEnabled } from "../../backend/data-platform/providers/twelve-data/config";

/**
 * Mapeo de símbolos canónicos internos a símbolos de Twelve Data
 * Canonical (interno) → Twelve Data (proveedor)
 */
const SYMBOL_MAPPING: Record<CanonicalSymbol, string> = {
  XAUUSD: "XAU/USD",
  BTCUSD: "BTC/USD",
  EURUSD: "EUR/USD",
  GBPUSD: "GBP/USD",
  USDJPY: "USD/JPY",
  AUDUSD: "AUD/USD",
  USDCHF: "USD/CHF",
};

export const OFFICIAL_MARKET_DATA_SYMBOLS: CanonicalSymbol[] = ["XAUUSD", "EURUSD", "GBPUSD", "BTCUSD"];

interface IngestionOptions {
  h1OutputSize?: number;
  m30OutputSize?: number;
  m5OutputSize?: number;
  operation?: "initialization" | "refresh";
}

interface IngestionMetadata {
  lastIngestionMs: number;
  candles_h1: number;
  candles_m30: number;
  candles_m5: number;
  last_price: Partial<Record<CanonicalSymbol, number>>;
  errors: string[];
  timestamp_audit_samples: Array<{
    symbol: CanonicalSymbol;
    timeframe: "1H" | "30M" | "5M";
    raw: string;
    parsed_utc_ms: number | null;
    assumed_utc: boolean;
    reason: string | null;
  }>;
}

// Singleton metadata tracker
const ingestionState: IngestionMetadata = {
  lastIngestionMs: 0,
  candles_h1: 0,
  candles_m30: 0,
  candles_m5: 0,
  last_price: {},
  errors: [],
  timestamp_audit_samples: [],
};

function recordTimestampAuditSample(sample: IngestionMetadata["timestamp_audit_samples"][number]): void {
  ingestionState.timestamp_audit_samples.push(sample);
  if (ingestionState.timestamp_audit_samples.length > 200) {
    ingestionState.timestamp_audit_samples = ingestionState.timestamp_audit_samples.slice(-200);
  }
}

/**
 * Initialize pipeline with historical candles from Twelve Data
 * Called once at startup before scheduler begins
 */
export async function initializePipelineWithRealData(
  pipeline: MarketDataPipeline,
  indicators?: IndicatorFramework,
  options: IngestionOptions = {},
): Promise<{ success: boolean; loaded_count: number; error?: string }> {
  try {
    if (!isTwelveDataOfficialEnabled()) {
      console.log("[RealDataIngestion] Twelve Data not configured. Using available data.");
      return { success: false, loaded_count: 0, error: "Twelve Data not configured" };
    }

    const config = getTwelveDataRuntimeConfig();
    const timeSeriesService = new TwelveDataTimeSeriesService(config);

    const symbols = OFFICIAL_MARKET_DATA_SYMBOLS;
    const h1OutputSize = options.h1OutputSize ?? 120;
    const m30OutputSize = options.m30OutputSize ?? 120;
    const m5OutputSize = options.m5OutputSize ?? 144;
    const operation = options.operation ?? "initialization";
    let totalLoaded = 0;

    console.log(`[RealDataIngestion] Starting ${operation} from Twelve Data...`);

    for (const symbol of symbols) {
      try {
        // Map canonical symbol to Twelve Data format (e.g., XAUUSD → XAU/USD)
        const providerSymbol = SYMBOL_MAPPING[symbol];
        if (!providerSymbol) {
          throw new Error(`No mapping found for symbol ${symbol}`);
        }

        console.log(`[RealDataIngestion] Fetching ${symbol} (provider: ${providerSymbol})...`);

        // Fetch H1 candles
        const h1Data = await timeSeriesService.getSeries({
          symbol: providerSymbol,
          interval: "1h",
          outputsize: h1OutputSize,
        });

        console.log(`[RealDataIngestion] H1 response for ${symbol}: ${h1Data.rows.length} rows, latency: ${h1Data.latencyMs}ms`);

        let h1Count = 0;
        for (const row of h1Data.rows) {
          if (row.timestampUtcMs === null) {
            const msg = `INVALID_TIMESTAMP ${symbol} 1H raw='${row.datetimeRaw}' reason='${row.timestampParseReason ?? "UNKNOWN"}'`;
            ingestionState.errors.push(msg);
            recordTimestampAuditSample({
              symbol,
              timeframe: "1H",
              raw: row.datetimeRaw,
              parsed_utc_ms: null,
              assumed_utc: row.timestampAssumedUtc,
              reason: row.timestampParseReason,
            });
            continue;
          }
          const timestamp = row.timestampUtcMs;
          recordTimestampAuditSample({
            symbol,
            timeframe: "1H",
            raw: row.datetimeRaw,
            parsed_utc_ms: timestamp,
            assumed_utc: row.timestampAssumedUtc,
            reason: row.timestampParseReason,
          });
          const candle = {
            symbol: symbol, // Use canonical symbol (XAUUSD)
            timestamp,
            open: row.open,
            high: row.high,
            low: row.low,
            close: row.close,
            volume: row.volume,
            timeframe: "1H" as const,
            complete: true, // CRITICAL FIX: Mark historical candles as complete (closed)
          };
          const result = pipeline.ingestCandle(candle, "1H");
          if (result) {
            h1Count++;
            indicators?.update(result.asset, "1H", result);
            ingestionState.last_price[symbol] = row.close;
          }
        }

        // Fetch M30 candles
        const m30Data = await timeSeriesService.getSeries({
          symbol: providerSymbol,
          interval: "30min",
          outputsize: m30OutputSize,
        });

        let m30Count = 0;
        for (const row of m30Data.rows) {
          if (row.timestampUtcMs === null) {
            const msg = `INVALID_TIMESTAMP ${symbol} 30M raw='${row.datetimeRaw}' reason='${row.timestampParseReason ?? "UNKNOWN"}'`;
            ingestionState.errors.push(msg);
            recordTimestampAuditSample({
              symbol,
              timeframe: "30M",
              raw: row.datetimeRaw,
              parsed_utc_ms: null,
              assumed_utc: row.timestampAssumedUtc,
              reason: row.timestampParseReason,
            });
            continue;
          }
          const timestamp = row.timestampUtcMs;
          recordTimestampAuditSample({
            symbol,
            timeframe: "30M",
            raw: row.datetimeRaw,
            parsed_utc_ms: timestamp,
            assumed_utc: row.timestampAssumedUtc,
            reason: row.timestampParseReason,
          });
          const candle = {
            symbol: symbol, // Use canonical symbol (XAUUSD)
            timestamp,
            open: row.open,
            high: row.high,
            low: row.low,
            close: row.close,
            volume: row.volume,
            timeframe: "30M" as const,
            complete: true, // CRITICAL FIX: Mark historical candles as complete (closed)
          };
          const result = pipeline.ingestCandle(candle, "30M");
          if (result) {
            m30Count++;
            indicators?.update(result.asset, "30M", result);
          }
        }

        // Fetch M5 candles
        const m5Data = await timeSeriesService.getSeries({
          symbol: providerSymbol,
          interval: "5min",
          outputsize: m5OutputSize,
        });

        let m5Count = 0;
        for (const row of m5Data.rows) {
          if (row.timestampUtcMs === null) {
            const msg = `INVALID_TIMESTAMP ${symbol} 5M raw='${row.datetimeRaw}' reason='${row.timestampParseReason ?? "UNKNOWN"}'`;
            ingestionState.errors.push(msg);
            recordTimestampAuditSample({
              symbol,
              timeframe: "5M",
              raw: row.datetimeRaw,
              parsed_utc_ms: null,
              assumed_utc: row.timestampAssumedUtc,
              reason: row.timestampParseReason,
            });
            continue;
          }
          const timestamp = row.timestampUtcMs;
          recordTimestampAuditSample({
            symbol,
            timeframe: "5M",
            raw: row.datetimeRaw,
            parsed_utc_ms: timestamp,
            assumed_utc: row.timestampAssumedUtc,
            reason: row.timestampParseReason,
          });
          const candle = {
            symbol: symbol, // Use canonical symbol (XAUUSD)
            timestamp,
            open: row.open,
            high: row.high,
            low: row.low,
            close: row.close,
            volume: row.volume,
            timeframe: "5M" as const,
            complete: true, // CRITICAL FIX: Mark historical candles as complete (closed)
          };
          const result = pipeline.ingestCandle(candle, "5M");
          if (result) {
            m5Count++;
            indicators?.update(result.asset, "5M", result);
          }
        }

        console.log(
          `[RealDataIngestion] ${symbol} (${providerSymbol}): ${h1Count} H1, ${m30Count} M30, ${m5Count} M5 candles loaded`
        );

        ingestionState.candles_h1 += h1Count;
        ingestionState.candles_m30 += m30Count;
        ingestionState.candles_m5 += m5Count;
        totalLoaded += h1Count + m30Count + m5Count;
      } catch (symbolErr) {
        const msg = `Failed to load ${symbol}: ${
          symbolErr instanceof Error ? symbolErr.message : String(symbolErr)
        }`;
        console.error("[RealDataIngestion]", msg);
        ingestionState.errors.push(msg);
      }
    }

    ingestionState.lastIngestionMs = Date.now();
    console.log(`[RealDataIngestion] Complete. ${totalLoaded} total candles loaded.`);

    return { success: true, loaded_count: totalLoaded };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    console.error("[RealDataIngestion] Initialization failed:", error);
    ingestionState.errors.push(error);
    return { success: false, loaded_count: 0, error };
  }
}

export async function refreshPipelineWithRealData(
  pipeline: MarketDataPipeline,
  indicators: IndicatorFramework,
): Promise<{ success: boolean; loaded_count: number; error?: string }> {
  return initializePipelineWithRealData(pipeline, indicators, {
    h1OutputSize: 2,
    m30OutputSize: 2,
    m5OutputSize: 2,
    operation: "refresh",
  });
}

/**
 * Get current ingestion state (for monitoring)
 */
export function getIngestionState(): IngestionMetadata {
  return { ...ingestionState };
}

/**
 * Reset ingestion state (for testing)
 */
export function resetIngestionState(): void {
  ingestionState.lastIngestionMs = 0;
  ingestionState.candles_h1 = 0;
  ingestionState.candles_m30 = 0;
  ingestionState.candles_m5 = 0;
  ingestionState.last_price = {};
  ingestionState.errors = [];
  ingestionState.timestamp_audit_samples = [];
}
