/**
 * Adaptive Scheduler — Expediente Maestro V3
 * Gestiona el timing de análisis por instrumento según la proximidad al escenario.
 * Regla: NO decide, NO interpreta. Solo gestiona cuándo revisar.
 */

import type { CanonicalSymbol, ProximityToEntry, AdaptiveStateV3, PreAnalysisTriggerReason } from "./typesMaestroV3";
import { ALL_CANONICAL_SYMBOLS } from "./instrumentRegistry";
import { idempotencyStore } from "./idempotencyStore";

export type RecheckSchedule = {
  canonical_symbol: CanonicalSymbol;
  next_review_at_ms: number;
  proximity: ProximityToEntry;
  recheck_minutes: number;
  wake_up_triggers: AdaptiveStateV3["wake_up_triggers"];
};

const PROXIMITY_TO_MINUTES: Record<ProximityToEntry, number> = {
  IMMEDIATE:  5,
  NEAR:      10,
  DEVELOPING: 15,
  FAR:       30,
  INVALID:   60,
};

interface WatchedLevel {
  canonical_symbol: CanonicalSymbol;
  level: number;
  direction: "ABOVE" | "BELOW";
  set_at_ms: number;
}

export class AdaptiveScheduler {
  private readonly schedules = new Map<CanonicalSymbol, RecheckSchedule>();
  private readonly watchedLevels: WatchedLevel[] = [];
  private analysisCallback: ((symbol: CanonicalSymbol, reason: PreAnalysisTriggerReason) => Promise<void>) | null = null;
  private tickInterval: ReturnType<typeof setInterval> | null = null;

  /** Register the analysis callback — called by ShadowFlowV3 */
  setAnalysisCallback(cb: (symbol: CanonicalSymbol, reason: PreAnalysisTriggerReason) => Promise<void>): void {
    this.analysisCallback = cb;
  }

  /** Initialize schedules for all instruments (IMMEDIATE on first startup to trigger first analysis) */
  initialize(nowMs = Date.now()): void {
    for (const symbol of ALL_CANONICAL_SYMBOLS) {
      this.schedules.set(symbol, {
        canonical_symbol: symbol,
        next_review_at_ms: nowMs, // ✅ FIXED: Schedule immediately for first analysis cycle
        proximity: "IMMEDIATE",
        recheck_minutes: 5,
        wake_up_triggers: [],
      });
    }
  }

  /** Update schedule after receiving adaptive_state from ChatGPT */
  updateFromAdaptiveState(symbol: CanonicalSymbol, state: AdaptiveStateV3, nowMs = Date.now()): void {
    const minutes = state.recheck_minutes;
    this.schedules.set(symbol, {
      canonical_symbol: symbol,
      next_review_at_ms: nowMs + minutes * 60000,
      proximity: state.proximity_to_entry,
      recheck_minutes: minutes,
      wake_up_triggers: state.wake_up_triggers,
    });

    // Register watched levels
    for (const trigger of state.wake_up_triggers) {
      if (trigger.trigger === "PRICE_REACHES_LEVEL" && trigger.level !== null) {
        this.registerWatchedLevel(symbol, trigger.level, nowMs);
      }
    }
  }

  /** Register a price level to watch — triggers analysis when reached */
  private registerWatchedLevel(symbol: CanonicalSymbol, level: number, nowMs: number): void {
    // Remove duplicates for same symbol and level
    const idx = this.watchedLevels.findIndex(w => w.canonical_symbol === symbol && Math.abs(w.level - level) < 0.001);
    if (idx >= 0) this.watchedLevels.splice(idx, 1);
    this.watchedLevels.push({ canonical_symbol: symbol, level, direction: "ABOVE", set_at_ms: nowMs });
  }

  /** Check if price has reached a watched level */
  checkPriceWakeup(symbol: CanonicalSymbol, currentPrice: number): boolean {
    const symbolLevels = this.watchedLevels.filter(w => w.canonical_symbol === symbol);
    for (const watched of symbolLevels) {
      const proximity = Math.abs(currentPrice - watched.level) / Math.max(watched.level, 0.001);
      if (proximity < 0.001) { // Within 0.1%
        return true;
      }
    }
    return false;
  }

  /** Called every 5 minutes by the runner to check which instruments need review */
  getInstrumentsDue(nowMs = Date.now()): Array<{ symbol: CanonicalSymbol; reason: PreAnalysisTriggerReason }> {
    const due: Array<{ symbol: CanonicalSymbol; reason: PreAnalysisTriggerReason }> = [];

    for (const [symbol, schedule] of this.schedules.entries()) {
      if (nowMs >= schedule.next_review_at_ms) {
        due.push({ symbol, reason: "SCHEDULED_RECHECK" });
      }
    }

    return due;
  }

  /** Wake up specific instrument due to an event */
  wakeUp(symbol: CanonicalSymbol, reason: PreAnalysisTriggerReason, nowMs = Date.now()): void {
    // Increment scenario version so idempotency key changes
    idempotencyStore.incrementScenarioVersion(symbol);

    // Schedule immediate review
    this.schedules.set(symbol, {
      canonical_symbol: symbol,
      next_review_at_ms: nowMs, // Immediately
      proximity: "IMMEDIATE",
      recheck_minutes: 5,
      wake_up_triggers: [],
    });
  }

  /** Wake up all instruments when H1 or M30 closes */
  wakeUpAll(reason: PreAnalysisTriggerReason): void {
    const nowMs = Date.now();
    for (const symbol of ALL_CANONICAL_SYMBOLS) {
      this.wakeUp(symbol, reason, nowMs);
    }
  }

  getSchedule(symbol: CanonicalSymbol): RecheckSchedule | null {
    return this.schedules.get(symbol) ?? null;
  }

  getAllSchedules(): RecheckSchedule[] {
    return Array.from(this.schedules.values());
  }

  /** Start the 5-minute tick loop */
  startTicker(onTick: (symbol: CanonicalSymbol, reason: PreAnalysisTriggerReason) => Promise<void>): void {
    if (this.tickInterval) clearInterval(this.tickInterval);

    this.tickInterval = setInterval(async () => {
      const nowMs = Date.now();
      const due = this.getInstrumentsDue(nowMs);

      for (const { symbol, reason } of due) {
        try {
          await onTick(symbol, reason);
        } catch {
          // Individual instrument errors don't stop the scheduler
        }
      }
    }, 60_000); // Check every minute, trigger only when due
  }

  stopTicker(): void {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
  }
}

export const adaptiveScheduler = new AdaptiveScheduler();
