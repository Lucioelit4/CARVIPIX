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

interface IngestionMetadata {
  lastIngestionMs: number;
  candles_h1: number;
  candles_m30: number;
  candles_m5: number;
  last_price: Partial<Record<CanonicalSymbol, number>>;
  errors: string[];
}

// Singleton metadata tracker
const ingestionState: IngestionMetadata = {
  lastIngestionMs: 0,
  candles_h1: 0,
  candles_m30: 0,
  candles_m5: 0,
  last_price: {},
  errors: [],
};

/**
 * Initialize pipeline with historical candles from Twelve Data
 * Called once at startup before scheduler begins
 */
export async function initializePipelineWithRealData(
  pipeline: MarketDataPipeline
): Promise<{ success: boolean; loaded_count: number; error?: string }> {
  try {
    if (!isTwelveDataOfficialEnabled()) {
      console.log("[RealDataIngestion] Twelve Data not configured. Using available data.");
      return { success: false, loaded_count: 0, error: "Twelve Data not configured" };
    }

    const config = getTwelveDataRuntimeConfig();
    const timeSeriesService = new TwelveDataTimeSeriesService(config);

    const symbols: CanonicalSymbol[] = ["XAUUSD", "EURUSD", "GBPUSD", "BTCUSD"];
    let totalLoaded = 0;

    console.log("[RealDataIngestion] Loading historical candles from Twelve Data...");

    for (const symbol of symbols) {
      try {
        // Map canonical symbol to Twelve Data format (e.g., XAUUSD → XAU/USD)
        const providerSymbol = SYMBOL_MAPPING[symbol];
        if (!providerSymbol) {
          throw new Error(`No mapping found for symbol ${symbol}`);
        }

        console.log(`[RealDataIngestion] Fetching ${symbol} (provider: ${providerSymbol})...`);

        // Fetch H1 candles (120 bars)
        const h1Data = await timeSeriesService.getSeries({
          symbol: providerSymbol,
          interval: "1h",
          outputsize: 120,
        });

        console.log(`[RealDataIngestion] H1 response for ${symbol}: ${h1Data.rows.length} rows, latency: ${h1Data.latencyMs}ms`);

        let h1Count = 0;
        for (const row of h1Data.rows) {
          const timestamp = new Date(row.datetime).getTime();
          const candle = {
            symbol: symbol, // FIX: Use canonical symbol (XAUUSD), NOT provider symbol (XAU/USD)
            timestamp,
            open: row.open,
            high: row.high,
            low: row.low,
            close: row.close,
            volume: row.volume,
            timeframe: "1H" as const,
          };
          const result = pipeline.ingestCandle(candle, "1H");
          if (result) {
            h1Count++;
            ingestionState.last_price[symbol] = row.close;
          }
        }

        // Fetch M30 candles (120 bars)
        const m30Data = await timeSeriesService.getSeries({
          symbol: providerSymbol,
          interval: "30min",
          outputsize: 120,
        });

        let m30Count = 0;
        for (const row of m30Data.rows) {
          const timestamp = new Date(row.datetime).getTime();
          const candle = {
            symbol: symbol, // FIX: Use canonical symbol (XAUUSD), NOT provider symbol (XAU/USD)
            timestamp,
            open: row.open,
            high: row.high,
            low: row.low,
            close: row.close,
            volume: row.volume,
            timeframe: "30M" as const,
          };
          const result = pipeline.ingestCandle(candle, "30M");
          if (result) {
            m30Count++;
          }
        }

        // Fetch M5 candles (144 bars)
        const m5Data = await timeSeriesService.getSeries({
          symbol: providerSymbol,
          interval: "5min",
          outputsize: 144,
        });

        let m5Count = 0;
        for (const row of m5Data.rows) {
          const timestamp = new Date(row.datetime).getTime();
          const candle = {
            symbol: symbol, // FIX: Use canonical symbol (XAUUSD), NOT provider symbol (XAU/USD)
            timestamp,
            open: row.open,
            high: row.high,
            low: row.low,
            close: row.close,
            volume: row.volume,
            timeframe: "5M" as const,
          };
          const result = pipeline.ingestCandle(candle, "5M");
          if (result) {
            m5Count++;
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
}
