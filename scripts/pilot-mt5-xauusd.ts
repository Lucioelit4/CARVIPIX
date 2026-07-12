import { MT5MarketDataAdapter } from "../app/engine/data/mt5MarketDataAdapter";
import { MarketDataReadinessGate } from "../app/engine/data/marketDataReadinessGate";
import { CandleBuilder } from "../app/engine/data/candleBuilder";
import { IndicatorFramework } from "../app/engine/data/indicatorFramework";
import type { Candle } from "../app/engine/types/marketData";

function buildM45FromM5(m5: Candle[]): Candle[] {
  const builder = new CandleBuilder(5000);
  for (const candle of m5) {
    builder.ingestCandle({
      ...candle,
      timeframe: "45M",
    });
  }
  const lastTs = m5.at(-1)?.timestamp;
  if (typeof lastTs === "number") {
    builder.flushUntil(lastTs + 45 * 60 * 1000);
  }
  return builder.getRecent("XAUUSD", "45M", 1000);
}

function getLastClosed(candles: Candle[]): Candle | null {
  return [...candles].reverse().find((c) => c.complete) ?? null;
}

function isStrictlyOrderedUnique(candles: Candle[]): boolean {
  for (let i = 1; i < candles.length; i++) {
    if (candles[i].timestamp <= candles[i - 1].timestamp) {
      return false;
    }
  }
  return true;
}

function computeIndicators(candles: Candle[]) {
  const framework = new IndicatorFramework(6000);
  let latest = null;
  for (const candle of candles) {
    latest = framework.update("XAUUSD", candle.timeframe, candle, 0);
  }
  return latest;
}

async function main() {
  const bridgeBaseUrl = process.env.MT5_BRIDGE_BASE_URL || "http://127.0.0.1:18080";
  const adapter = new MT5MarketDataAdapter(["XAUUSD"], ["5M", "45M", "1H"]);

  await adapter.connect();

  const healthResponse = await fetch(`${bridgeBaseUrl}/health`, { cache: "no-store" });
  const bridgeHealth = await healthResponse.json();

  const resolveResponse = await fetch(`${bridgeBaseUrl}/symbols/resolve?requested=XAUUSD`, { cache: "no-store" });
  const resolvePayload = await resolveResponse.json() as { requested?: string; resolved?: string };

  const symbol = adapter.getResolvedSymbol("XAUUSD");
  const tick = await adapter.getTick("XAUUSD");
  const candles1h = await adapter.getHistoricalCandles("XAUUSD", "1H", 300);
  const candles5m = await adapter.getHistoricalCandles("XAUUSD", "5M", 3000);
  const candles45mAll = buildM45FromM5(candles5m);
  const candles45m = candles45mAll.slice(-300);
  const adapterHealth = await adapter.getHealthStatus();

  const ind1h = computeIndicators(candles1h);
  const ind5m = computeIndicators(candles5m);
  const ind45m = computeIndicators(candles45m);

  const now = Date.now();
  const tickAgeMs = tick ? now - tick.timestamp : null;
  const marketActive = tickAgeMs !== null && Number.isFinite(tickAgeMs) && tickAgeMs <= 120_000;

  const gate = new MarketDataReadinessGate();
  const readiness = gate.evaluate({
    asset: "XAUUSD",
    snapshotUtc: new Date().toISOString(),
    tick,
    marketActive,
    requiredTimeframes: [
      {
        timeframe: "1H",
        closedCandles: candles1h.filter((c) => c.complete).length,
        latestTimestamp: getLastClosed(candles1h)?.timestamp ?? null,
        indicators: {
          ema200: ind1h?.ema200 ?? 0,
          atr: ind1h?.atr ?? 0,
          adx: ind1h?.adx ?? 0,
        },
        chartImagePresent: true,
        candles: candles1h,
      },
      {
        timeframe: "45M",
        closedCandles: candles45m.filter((c) => c.complete).length,
        latestTimestamp: getLastClosed(candles45m)?.timestamp ?? null,
        indicators: {
          ema200: ind45m?.ema200 ?? 0,
          atr: ind45m?.atr ?? 0,
          adx: ind45m?.adx ?? 0,
        },
        chartImagePresent: true,
        candles: candles45m,
      },
      {
        timeframe: "5M",
        closedCandles: candles5m.filter((c) => c.complete).length,
        latestTimestamp: getLastClosed(candles5m)?.timestamp ?? null,
        indicators: {
          ema200: ind5m?.ema200 ?? 0,
          atr: ind5m?.atr ?? 0,
          adx: ind5m?.adx ?? 0,
        },
        chartImagePresent: true,
        candles: candles5m,
      },
    ],
    minCandlesByTimeframe: {
      "1H": 250,
      "45M": 250,
      "5M": 300,
    },
  });

  const output = {
    bridge_status: bridgeHealth.bridge_status,
    terminal_connected: bridgeHealth.terminal_connected,
    account_login: bridgeHealth.account_login_masked,
    server: bridgeHealth.server,
    symbol_requested: resolvePayload.requested ?? "XAUUSD",
    symbol_resolved: resolvePayload.resolved ?? symbol,
    market_active: marketActive,
    tick_age_ms: tickAgeMs,
    bid: tick?.bid ?? null,
    ask: tick?.ask ?? null,
    spread: tick?.spread ?? null,
    tick_time: tick?.timestamp ?? null,
    h1_candles_count: candles1h.filter((c) => c.complete).length,
    m5_candles_count: candles5m.filter((c) => c.complete).length,
    m45_candles_count: candles45m.filter((c) => c.complete).length,
    m45_alignment_rule: "bucket_start = floor(m5.timestamp_ms / 2700000) * 2700000",
    series_integrity: {
      H1: isStrictlyOrderedUnique(candles1h),
      M5: isStrictlyOrderedUnique(candles5m),
      M45: isStrictlyOrderedUnique(candles45m),
    },
    last_closed: {
      H1: getLastClosed(candles1h),
      M5: getLastClosed(candles5m),
      M45: getLastClosed(candles45m),
    },
    indicators: {
      H1: ind1h,
      M5: ind5m,
      M45: ind45m,
    },
    readiness_gate: readiness.status,
    readiness_reasons: readiness.reasons,
    readiness_details: readiness.details,
    adapter_health: adapterHealth,
  };

  console.log(JSON.stringify(output, null, 2));
  await adapter.disconnect();
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
});
