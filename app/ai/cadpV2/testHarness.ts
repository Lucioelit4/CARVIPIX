/**
 * Maestro V3 Test Harness — Datos de prueba para certificación E2E
 * Genera pipeline y indicators con candles reales sintéticos para XAUUSD.
 * No requiere conexión a broker ni a Twelve Data.
 */

import { MarketDataPipeline } from "../../engine/data/marketDataPipeline";
import { IndicatorFramework } from "../../engine/data/indicatorFramework";
import type { Candle } from "../../engine/types/marketData";
import type { Asset } from "../../engine/types/marketData";

const XAUUSD_BASE_PRICE = 2435.0;

/**
 * Generate realistic synthetic candles for a given timeframe.
 * Simulates an uptrend with pullback.
 */
export function generateSyntheticCandles(
  count: number,
  basePrice: number,
  tfMs: number,
  startTs: number,
  volatility = 0.003, // 0.3% per candle
): Array<Omit<Candle, "asset" | "timeframe">> {
  const candles: Array<Omit<Candle, "asset" | "timeframe">> = [];
  let price = basePrice;
  const now = Date.now();

  for (let i = 0; i < count; i++) {
    const ts = startTs + i * tfMs;
    const isOpen = ts + tfMs > now; // Last candle might be open

    // Simulate market movement — gentle uptrend with noise
    const trend = i < count * 0.6 ? 0.0002 : -0.0001; // Pullback after impulse
    const noise = (Math.random() - 0.5) * volatility;
    const changeMultiplier = 1 + trend + noise;
    const open = price;
    const close = price * changeMultiplier;
    const high = Math.max(open, close) * (1 + Math.random() * 0.001);
    const low = Math.min(open, close) * (1 - Math.random() * 0.001);
    price = close;

    candles.push({
      timestamp: ts,
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
      volume: Math.floor(Math.random() * 1000) + 100,
      complete: !isOpen,
    });
  }

  return candles;
}

export function buildMockPipelineAndIndicators(asset: Asset = "XAUUSD"): {
  pipeline: MarketDataPipeline;
  indicators: IndicatorFramework;
} {
  const pipeline = new MarketDataPipeline();
  const indicators = new IndicatorFramework();

  const now = Date.now();
  const H1_MS = 60 * 60 * 1000;
  const M30_MS = 30 * 60 * 1000;
  const M5_MS = 5 * 60 * 1000;

  // Generate 120 H1 candles (5 days of hourly data)
  const h1Start = now - 120 * H1_MS;
  const h1Candles = generateSyntheticCandles(120, XAUUSD_BASE_PRICE, H1_MS, h1Start, 0.004);

  // Generate 120 M30 candles (2.5 days)
  const m30Start = now - 120 * M30_MS;
  const m30Candles = generateSyntheticCandles(120, XAUUSD_BASE_PRICE, M30_MS, m30Start, 0.002);

  // Generate 144 M5 candles (12 hours)
  const m5Start = now - 144 * M5_MS;
  const m5Candles = generateSyntheticCandles(144, XAUUSD_BASE_PRICE, M5_MS, m5Start, 0.0008);

  // Feed all candles into pipeline and indicators
  for (const c of h1Candles) {
    const fullCandle = { ...c, asset, timeframe: "1H" as const };
    pipeline.ingestCandle(fullCandle, "1H");
    indicators.update(asset, "1H", fullCandle);
  }
  for (const c of m30Candles) {
    const fullCandle = { ...c, asset, timeframe: "30M" as const };
    pipeline.ingestCandle(fullCandle, "30M");
    indicators.update(asset, "30M", fullCandle);
  }
  for (const c of m5Candles) {
    const fullCandle = { ...c, asset, timeframe: "5M" as const };
    pipeline.ingestCandle(fullCandle, "5M");
    indicators.update(asset, "5M", fullCandle);
  }

  return { pipeline, indicators };
}

export function buildStaleDataPipeline(asset: Asset = "XAUUSD"): {
  pipeline: MarketDataPipeline;
  indicators: IndicatorFramework;
} {
  const pipeline = new MarketDataPipeline();
  const indicators = new IndicatorFramework();

  // Generate candles from 4 hours ago — will be STALE
  const now = Date.now();
  const H1_MS = 60 * 60 * 1000;
  const staleStart = now - 8 * H1_MS;
  const h1Candles = generateSyntheticCandles(5, XAUUSD_BASE_PRICE, H1_MS, staleStart, 0.004);

  for (const c of h1Candles) {
    const fullCandle = { ...c, asset, timeframe: "1H" as const };
    pipeline.ingestCandle(fullCandle, "1H");
    indicators.update(asset, "1H", fullCandle);
  }

  return { pipeline, indicators };
}
