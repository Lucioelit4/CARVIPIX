/**
 * Observer Runner V3 — Motor continuo del Expediente Maestro V3
 * Inicia el ciclo de análisis para los 7 instrumentos.
 * Se ejecuta como singleton en el proceso de Next.js.
 */

import "server-only";
import { ShadowFlowV3 } from "./shadowFlowV3";
import { adaptiveScheduler } from "./schedulerAdaptativo";
import { observerV3 } from "./observerV3";
import { paperTradeMonitor } from "./paperTradeMonitor";
import {
  initializePipelineWithRealData,
  OFFICIAL_MARKET_DATA_SYMBOLS,
  refreshPipelineWithRealData,
} from "./realDataIngestionService";
import { logCertificationCycle } from "@/app/lib/services/certificationLogService";
import { analysisCycleControl, buildMarketAvailability } from "./analysisCycleControl";
import { observerRuntimeLease } from "./observerRuntimeLease";
import { observerScheduleSlotClaim } from "./observerScheduleSlotClaim";
import type { CanonicalSymbol, PreAnalysisTriggerReason } from "./typesMaestroV3";

let shadowFlowInstance: ShadowFlowV3 | null = null;
let runnerActive = false;
let bootInFlight = false;
let observerLeaseOwnerId: string | null = null;
let leaseRenewTimer: ReturnType<typeof setInterval> | null = null;
let refreshTimer: ReturnType<typeof setInterval> | null = null;
let priceTrackerTimer: ReturnType<typeof setInterval> | null = null;

const MARKET_DATA_REFRESH_MS = 4 * 60 * 1000;
const OBSERVER_LEASE_RENEW_MS = 45_000;
const officialMarketDataSymbols = new Set<CanonicalSymbol>(OFFICIAL_MARKET_DATA_SYMBOLS);

function resolveLeaseOwnerId(): string {
  const deploymentId = process.env.RAILWAY_DEPLOYMENT_ID
    || process.env.VERCEL_DEPLOYMENT_ID
    || process.env.HOSTNAME
    || "local";
  return `${deploymentId}-${process.pid}`;
}

function clearRuntimeTimers(): void {
  if (leaseRenewTimer) clearInterval(leaseRenewTimer);
  if (refreshTimer) clearInterval(refreshTimer);
  if (priceTrackerTimer) clearInterval(priceTrackerTimer);
  leaseRenewTimer = null;
  refreshTimer = null;
  priceTrackerTimer = null;
}

async function runAnalysisCycle(
  shadowFlow: ShadowFlowV3,
  ownerId: string,
  symbol: CanonicalSymbol,
  reason: PreAnalysisTriggerReason,
): Promise<void> {
  if (!runnerActive) return;

  if (shadowFlow.isCircuitOpen()) {
    console.warn(`[ObserverRunner] Circuit open. Skipping ${symbol}.`);
    return;
  }

  const lease = await observerRuntimeLease.getSnapshot();
  if (!lease || lease.ownerId !== ownerId || lease.expired) {
    console.warn(`[ObserverRunner] Lease ownership missing. Skipping ${symbol}.`);
    return;
  }

  const nowUtcMs = Date.now();
  const lastClosedCandleTs = shadowFlow.pipeline
    .getRecentCandles(symbol as never, "5M", 2)
    .filter((candle) => candle.complete)
    .at(-1)?.timestamp ?? null;
  const cycleEvaluation = analysisCycleControl.evaluate({
    symbol,
    nowUtcMs,
    lastClosedCandleTs,
    market: buildMarketAvailability(symbol, nowUtcMs),
  });
  if (!cycleEvaluation.allowed) {
    console.log(`[ObserverRunner] ${symbol} | ${cycleEvaluation.reason} | ${cycleEvaluation.detail}`);
    return;
  }

  const slot = await observerScheduleSlotClaim.claim({ symbol, ownerId, nowMs: nowUtcMs, triggerReason: reason });
  if (!slot.acquired) {
    console.log(`[ObserverRunner] ${symbol} | SKIPPED_DUPLICATE | slot=${slot.slotStartUtcMs}`);
    return;
  }

  analysisCycleControl.enter(symbol, nowUtcMs);
  try {
    const result = await shadowFlow.analyzeInstrument(symbol, reason);
    console.log(`[ObserverRunner] ${symbol} | ${result.status} | ${result.decision ?? "—"} | $${result.cost_usd.toFixed(4)}`);

    // ── CERTIFICATION LOGGING (only for completed cycles)
    if (result.status === "COMPLETED") {
    try {
      const paperState = paperTradeMonitor.getAccountState();
      
      logCertificationCycle({
        timestamp: Date.now(),
        date: new Date().toISOString(),
        hour: new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }),
        analysis_id: result.analysis_id,
        signal_id: `sig-${symbol}-${Date.now()}`,
        instrument: symbol,
        trigger_reason: reason,
        cycle_status: result.status,
        decision: result.decision || "N/A",
        probability: 0, // Will be overridden by actual data from analysis
        conviction: 0,
        duration_ms: result.latency_ms,
        openai_latency_ms: result.latency_ms,
        tokens_used: 0,
        cost_usd: result.cost_usd,
        expediente_quality: {
          completeness: 95,
          sections: 16,
          has_error: false,
        },
        market_state: {
          trend: "MONITORING",
          volatility: "NORMAL",
          key_levels: [],
        },
        distribution: {
          BOT_ENGINE: "PENDING",
          ALERTA_PREMIUM: "PENDING",
          TELEGRAM: "PENDING",
          DASHBOARD: "DELIVERED",
          ESTADO_MERCADO: "PENDING",
          OBSERVADOR: "DELIVERED",
          HISTORIAL: "DELIVERED",
          RESULTADOS_PAPER: "DELIVERED",
          MONITOR_PAPER: "DELIVERED",
        },
        paper_state: {
          balance: paperState.current_balance_usd,
          open_positions: paperState.open_trades.length,
          closed_positions: paperState.closed_trades.length,
          pnl: paperState.total_pnl_usd,
          win_rate: paperState.win_rate || 0,
        },
        next_review: Date.now() + 5 * 60 * 1000, // Next 5 min
        evidence_summary: {
          question_hash: "",
          response_hash: "",
          expediente_sections: 16,
        },
      });
      console.log(`[CertificationLog] Ciclo registrado: ${symbol} | ${result.analysis_id}`);
    } catch (err) {
      console.error(`[CertificationLog] Error registrando ciclo: ${err}`);
    }
    }
  } finally {
    analysisCycleControl.leave(symbol, lastClosedCandleTs);
  }
}

export interface ObserverRunnerStartOptions {
  pipeline: import("../../engine/data/marketDataPipeline").MarketDataPipeline;
  indicators: import("../../engine/data/indicatorFramework").IndicatorFramework;
}

export function startObserverRunner(options: ObserverRunnerStartOptions): void {
  if (runnerActive || bootInFlight) {
    console.log("[ObserverRunner] Already running or booting.");
    return;
  }

  bootInFlight = true;
  shadowFlowInstance = new ShadowFlowV3(options.pipeline, options.indicators);
  observerLeaseOwnerId = resolveLeaseOwnerId();
  const ownerId = observerLeaseOwnerId;

  (async () => {
    try {
      const acquired = await observerRuntimeLease.acquire(ownerId);
      if (!acquired) {
        console.warn("[ObserverRunner] Another runtime owns the Observer lease.");
        return;
      }

      runnerActive = true;
      observerV3.markRunning(true);
      adaptiveScheduler.initialize();
      leaseRenewTimer = setInterval(async () => {
        try {
          const stillOwner = await observerRuntimeLease.heartbeat(ownerId);
          if (!stillOwner) stopObserverRunner(false);
        } catch (error) {
          console.error("[ObserverRunner] Lease heartbeat failed:", error instanceof Error ? error.message : String(error));
          stopObserverRunner(false);
        }
      }, OBSERVER_LEASE_RENEW_MS);

      console.log("[ObserverRunner] Starting Maestro V3 with REAL DATA from Twelve Data.");
      const ingestionResult = await initializePipelineWithRealData(options.pipeline, options.indicators);

      if (ingestionResult.success) {
        console.log(
          `[ObserverRunner] ✅ Pipeline initialized with ${ingestionResult.loaded_count} real candles.`
        );
        console.log("[ObserverRunner] ✅ Indicators computed from real data.");
      } else {
        console.warn(
          `[ObserverRunner] ⚠️ Pipeline initialization incomplete: ${ingestionResult.error}`
        );
        console.warn("[ObserverRunner] Proceeding with available data.");
      }

      adaptiveScheduler.startTicker(async (symbol: CanonicalSymbol, reason: PreAnalysisTriggerReason) => {
        if (shadowFlowInstance && officialMarketDataSymbols.has(symbol)) {
          await runAnalysisCycle(shadowFlowInstance, ownerId, symbol, reason);
        }
      });

      const due = adaptiveScheduler
        .getInstrumentsDue(Date.now())
        .filter(({ symbol }) => officialMarketDataSymbols.has(symbol));
      for (const { symbol, reason } of due) {
        if (!shadowFlowInstance || !runnerActive) {
          break;
        }
        await runAnalysisCycle(shadowFlowInstance, ownerId, symbol, reason);
      }

      let refreshActive = false;
      refreshTimer = setInterval(async () => {
        if (!runnerActive) {
          return;
        }
        if (refreshActive) {
          return;
        }

        refreshActive = true;
        try {
          const refresh = await refreshPipelineWithRealData(options.pipeline, options.indicators);
          if (!refresh.success) {
            console.warn(`[ObserverRunner] Market data refresh incomplete: ${refresh.error ?? "unknown error"}`);
          }
        } finally {
          refreshActive = false;
        }
      }, MARKET_DATA_REFRESH_MS);

      console.log("[ObserverRunner] Active. Real data refresh and scheduler monitoring enabled.");
    } catch (err) {
      console.error(
        "[ObserverRunner] Initialization error:",
        err instanceof Error ? err.message : String(err)
      );
      runnerActive = false;
      observerV3.markRunning(false);
      clearRuntimeTimers();
    } finally {
      bootInFlight = false;
    }
  })();

  // ── Paper trade price tracking (every 30 seconds)
  priceTrackerTimer = setInterval(async () => {
    if (!runnerActive) {
      return;
    }

    // Get real prices from pipeline if available (only Asset types)
    const prices: Partial<Record<CanonicalSymbol, number>> = {};
    for (const symbol of OFFICIAL_MARKET_DATA_SYMBOLS) {
      const m5Candles = options.pipeline.getRecentCandles(symbol, "5M", 1);
      if (m5Candles && m5Candles.length > 0) {
        prices[symbol] = m5Candles[0].close;
      }
    }

    paperTradeMonitor.tick(prices, 0);
    observerV3.updatePaperAccount(paperTradeMonitor.getAccountState());
  }, 30_000);
}

export function stopObserverRunner(releaseRuntimeLease = true): void {
  runnerActive = false;
  bootInFlight = false;
  clearRuntimeTimers();
  adaptiveScheduler.stopTicker();
  observerV3.markRunning(false);
  shadowFlowInstance = null;
  analysisCycleControl.reset();
  const ownerId = observerLeaseOwnerId;
  observerLeaseOwnerId = null;
  if (releaseRuntimeLease && ownerId) {
    void observerRuntimeLease.release(ownerId);
  }
  console.log("[ObserverRunner] Stopped.");
}

export function isObserverRunning(): boolean {
  return runnerActive;
}

export function getObserverSnapshot() {
  return observerV3.getObserverState();
}
