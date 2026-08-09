/**
 * Adaptive Scheduler — Expediente Maestro V3
 * Gestiona el timing de análisis por instrumento según la proximidad al escenario.
 * Regla: NO decide, NO interpreta. Solo gestiona cuándo revisar.
 */

import type { CanonicalSymbol, ProximityToEntry, AdaptiveStateV3, PreAnalysisTriggerReason } from "./typesMaestroV3";
import { ALL_CANONICAL_SYMBOLS } from "./instrumentRegistry";
import { idempotencyStore } from "./idempotencyStore";

export const FIXED_SLOT_INTERVAL_MINUTES = 15;
export const FIXED_SLOT_INTERVAL_MS = FIXED_SLOT_INTERVAL_MINUTES * 60_000;

const DEFAULT_ACTIVE_SYMBOLS: CanonicalSymbol[] = ["XAUUSD", "BTCUSD", "EURUSD", "GBPUSD"];
const FIXED_SYMBOL_OFFSETS_MINUTES: Readonly<Record<CanonicalSymbol, number>> = {
  XAUUSD: 0,
  BTCUSD: 3,
  EURUSD: 6,
  GBPUSD: 9,
  USDJPY: 0,
  AUDUSD: 0,
  USDCHF: 0,
};

export type RecheckSchedule = {
  canonical_symbol: CanonicalSymbol;
  next_review_at_ms: number;
  proximity: ProximityToEntry;
  recheck_minutes: number;
  wake_up_triggers: AdaptiveStateV3["wake_up_triggers"];
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
  private readonly activeSymbols = new Set<CanonicalSymbol>();
  private analysisCallback: ((symbol: CanonicalSymbol, reason: PreAnalysisTriggerReason) => Promise<void>) | null = null;
  private tickInterval: ReturnType<typeof setInterval> | null = null;

  static getSymbolOffsetMinutes(symbol: CanonicalSymbol): number {
    return FIXED_SYMBOL_OFFSETS_MINUTES[symbol];
  }

  static computeSlotStartUtcMs(symbol: CanonicalSymbol, nowMs: number): number {
    const shifted = nowMs - AdaptiveScheduler.getSymbolOffsetMinutes(symbol) * 60_000;
    return Math.floor(shifted / FIXED_SLOT_INTERVAL_MS) * FIXED_SLOT_INTERVAL_MS
      + AdaptiveScheduler.getSymbolOffsetMinutes(symbol) * 60_000;
  }

  static computeNextSlotUtcMs(symbol: CanonicalSymbol, nowMs: number): number {
    return AdaptiveScheduler.computeSlotStartUtcMs(symbol, nowMs) + FIXED_SLOT_INTERVAL_MS;
  }

  static computeCurrentOrNextSlotUtcMs(symbol: CanonicalSymbol, nowMs: number, graceMs = 60_000): number {
    const slotStart = AdaptiveScheduler.computeSlotStartUtcMs(symbol, nowMs);
    return nowMs - slotStart <= graceMs ? slotStart : slotStart + FIXED_SLOT_INTERVAL_MS;
  }

  /** Register the analysis callback — called by ShadowFlowV3 */
  setAnalysisCallback(cb: (symbol: CanonicalSymbol, reason: PreAnalysisTriggerReason) => Promise<void>): void {
    this.analysisCallback = cb;
  }

  /** Initialize schedules for all instruments (IMMEDIATE on first startup to trigger first analysis) */
  initialize(nowMs = Date.now(), symbols: CanonicalSymbol[] = DEFAULT_ACTIVE_SYMBOLS): void {
    this.schedules.clear();
    this.activeSymbols.clear();
    const configuredSymbols = symbols.length > 0 ? symbols : ALL_CANONICAL_SYMBOLS;
    for (const symbol of configuredSymbols) {
      this.activeSymbols.add(symbol);
      this.schedules.set(symbol, {
        canonical_symbol: symbol,
        next_review_at_ms: AdaptiveScheduler.computeCurrentOrNextSlotUtcMs(symbol, nowMs),
        proximity: "IMMEDIATE",
        recheck_minutes: FIXED_SLOT_INTERVAL_MINUTES,
        wake_up_triggers: [],
      });
    }
  }

  /** Update schedule after receiving adaptive_state from ChatGPT */
  updateFromAdaptiveState(symbol: CanonicalSymbol, state: AdaptiveStateV3, nowMs = Date.now()): void {
    this.schedules.set(symbol, {
      canonical_symbol: symbol,
      next_review_at_ms: AdaptiveScheduler.computeNextSlotUtcMs(symbol, nowMs),
      proximity: state.proximity_to_entry,
      recheck_minutes: FIXED_SLOT_INTERVAL_MINUTES,
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
        this.schedules.set(symbol, {
          ...schedule,
          next_review_at_ms: AdaptiveScheduler.computeNextSlotUtcMs(symbol, nowMs),
          recheck_minutes: FIXED_SLOT_INTERVAL_MINUTES,
        });
      }
    }

    return due;
  }

  /** Wake up specific instrument due to an event */
  wakeUp(symbol: CanonicalSymbol, reason: PreAnalysisTriggerReason, nowMs = Date.now()): void {
    if (!this.activeSymbols.has(symbol)) return;

    // Increment scenario version so idempotency key changes
    idempotencyStore.incrementScenarioVersion(symbol);

    // Event context is retained, but execution remains aligned to the symbol's fixed slot.
    this.schedules.set(symbol, {
      canonical_symbol: symbol,
      next_review_at_ms: AdaptiveScheduler.computeCurrentOrNextSlotUtcMs(symbol, nowMs),
      proximity: "IMMEDIATE",
      recheck_minutes: FIXED_SLOT_INTERVAL_MINUTES,
      wake_up_triggers: [],
    });
  }

  /** Wake up all instruments when H1 or M30 closes */
  wakeUpAll(reason: PreAnalysisTriggerReason): void {
    const nowMs = Date.now();
    for (const symbol of this.activeSymbols) {
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
