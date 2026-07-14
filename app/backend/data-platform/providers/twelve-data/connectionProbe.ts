import { getTwelveDataRuntimeConfig } from "./config";
import { TwelveDataQuoteService } from "./quotes";
import { TwelveDataSymbolService } from "./symbols";
import { TwelveDataTimeSeriesService, type TwelveInterval } from "./timeSeries";
import { TwelveDataWebSocketClient } from "./websocket";
import type { TwelveDataProbeCheck, TwelveDataProbeSummary } from "./types";
import { TwelveDataHttpError } from "./errors";
import { withTwelveDataApikey } from "./auth";
import { TwelveDataRestClient } from "./restClient";

function appendError(checks: TwelveDataProbeCheck[], check: string, error: unknown): void {
  if (error instanceof TwelveDataHttpError) {
    checks.push({
      check,
      ok: false,
      details: error.message,
      endpoint: error.endpoint,
      blockedByPlan: error.blockedByPlan,
      blockedByAuth: error.status === 401,
      statusCode: error.status,
    });
    return;
  }

  checks.push({
    check,
    ok: false,
    details: error instanceof Error ? error.message : String(error),
  });
}

async function probeAssetTimeframes(input: {
  quoteService: TwelveDataQuoteService;
  seriesService: TwelveDataTimeSeriesService;
  checks: TwelveDataProbeCheck[];
  asset: "XAUUSD" | "BTCUSD" | "EURUSD" | "GBPUSD" | "USDJPY";
  intervals: TwelveInterval[];
}): Promise<{ selectedSymbol: string | null; exchange: string | null }> {
  const quote = await input.quoteService.quoteAsset(input.asset as "XAUUSD" | "BTCUSD" | "EURUSD" | "GBPUSD");
  if (!quote.quote || !quote.selectedSymbol) {
    input.checks.push({
      check: `quote:${input.asset}`,
      ok: false,
      details: "symbol_not_available",
      endpoint: "/quote",
    });
    return { selectedSymbol: null, exchange: null };
  }

  input.checks.push({
    check: `quote:${input.asset}`,
    ok: true,
    details: `providerSymbol=${quote.selectedSymbol}`,
    latencyMs: quote.quote.latencyMs,
    endpoint: "/quote",
  });

  for (const interval of input.intervals) {
    try {
      const series = await input.seriesService.getSeries({
        symbol: quote.selectedSymbol,
        interval,
        outputsize: 120,
      });
      input.checks.push({
        check: `time-series:${input.asset}:${interval}`,
        ok: series.rows.length > 0,
        details: `rows=${series.rows.length} timezone=${series.timezone ?? "unknown"} exchange=${series.exchange ?? "unknown"}`,
        latencyMs: series.latencyMs,
        endpoint: "/time_series",
      });
    } catch (error) {
      appendError(input.checks, `time-series:${input.asset}:${interval}`, error);
    }
  }

  return {
    selectedSymbol: quote.selectedSymbol,
    exchange: quote.quote.exchange ?? null,
  };
}

export async function runTwelveDataConnectionProbe(): Promise<TwelveDataProbeSummary> {
  const config = getTwelveDataRuntimeConfig();
  const checks: TwelveDataProbeCheck[] = [];

  const symbols = new TwelveDataSymbolService(config);
  const quotes = new TwelveDataQuoteService(config);
  const series = new TwelveDataTimeSeriesService(config);
  const ws = new TwelveDataWebSocketClient(config);
  const rest = new TwelveDataRestClient(config);

  for (const q of ["XAUUSD", "BTCUSD", "EURUSD", "GBPUSD", "USDJPY"]) {
    try {
      const found = await symbols.search(q);
      checks.push({
        check: `symbol-search:${q}`,
        ok: found.data.length > 0,
        details: `matches=${found.data.length}`,
        latencyMs: found.latencyMs,
        endpoint: "/symbol_search",
      });
    } catch (error) {
      appendError(checks, `symbol-search:${q}`, error);
    }
  }

  let btcSymbol: string | null = null;
  try {
    await probeAssetTimeframes({
      quoteService: quotes,
      seriesService: series,
      checks,
      asset: "XAUUSD",
      intervals: ["1min", "5min", "15min", "30min", "1h"],
    });

    const btc = await probeAssetTimeframes({
      quoteService: quotes,
      seriesService: series,
      checks,
      asset: "BTCUSD",
      intervals: ["5min", "1h"],
    });
    btcSymbol = btc.selectedSymbol;

    for (const fx of ["EURUSD", "GBPUSD"] as const) {
      await probeAssetTimeframes({
        quoteService: quotes,
        seriesService: series,
        checks,
        asset: fx,
        intervals: ["5min", "1h"],
      });
    }

    // USDJPY is not supported by Asset union in quoteService, so use direct symbol route.
    const directUsdJpyQuote = await quotes.quoteByProviderSymbol("USD/JPY");
    checks.push({
      check: "quote:USDJPY",
      ok: Number.isFinite(directUsdJpyQuote.price),
      details: `providerSymbol=USD/JPY`,
      latencyMs: directUsdJpyQuote.latencyMs,
      endpoint: "/quote",
    });

    for (const interval of ["5min", "1h"] as const) {
      const usdJpySeries = await series.getSeries({ symbol: "USD/JPY", interval, outputsize: 120 });
      checks.push({
        check: `time-series:USDJPY:${interval}`,
        ok: usdJpySeries.rows.length > 0,
        details: `rows=${usdJpySeries.rows.length} timezone=${usdJpySeries.timezone ?? "unknown"}`,
        latencyMs: usdJpySeries.latencyMs,
        endpoint: "/time_series",
      });
    }
  } catch (error) {
    appendError(checks, "asset-probe-core", error);
  }

  try {
    const usageUrl = withTwelveDataApikey(config, "/api_usage");
    const usage = await rest.getJson<{ current_usage?: number; plan?: string; credits?: number }>(usageUrl);
    checks.push({
      check: "plan-usage",
      ok: true,
      details: `current_usage=${usage.data.current_usage ?? "unknown"} plan=${usage.data.plan ?? "unknown"}`,
      latencyMs: usage.meta.latencyMs,
      endpoint: "/api_usage",
    });
  } catch (error) {
    appendError(checks, "plan-usage", error);
  }

  try {
    const wsProbe = await ws.probe({
      symbols: [btcSymbol ?? "BTC/USD", "EUR/USD"],
      durationMs: 9000,
    });
    checks.push({
      check: "websocket:connect+updates",
      ok: wsProbe.connected && wsProbe.updatesReceived > 0,
      details: `connected=${wsProbe.connected} updates=${wsProbe.updatesReceived} first_update_ms=${wsProbe.firstUpdateLatencyMs ?? "none"}`,
      latencyMs: wsProbe.firstUpdateLatencyMs ?? undefined,
      endpoint: "wss://ws.twelvedata.com/v1/quotes/price",
    });
  } catch (error) {
    appendError(checks, "websocket:connect+updates", error);
  }

  return {
    provider: "twelve-data",
    at: new Date().toISOString(),
    mode: "evaluation",
    checks,
  };
}
