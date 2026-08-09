import { getInstrument } from "./instrumentRegistry";
import type { CanonicalSymbol } from "./typesMaestroV3";

export const MIN_CYCLE_INTERVAL_MS = 15 * 60 * 1000;

export type OperationalSkipReason =
  | "SKIPPED_MARKET_CLOSED"
  | "SKIPPED_MAINTENANCE"
  | "SKIPPED_PRE_CLOSE"
  | "SKIPPED_POST_OPEN"
  | "SKIPPED_NO_NEW_CANDLE"
  | "SKIPPED_DUPLICATE";

export interface MarketAvailabilitySnapshot {
  marketOpen: boolean;
  inMaintenance: boolean;
  minutesToClose: number | null;
  minutesSinceOpen: number | null;
  weeklyClosed: boolean;
  holidayClosed: boolean;
}

export interface EvaluateCycleInput {
  symbol: CanonicalSymbol;
  nowUtcMs: number;
  lastClosedCandleTs: number | null;
  market: MarketAvailabilitySnapshot;
}

function toUtcParts(nowUtcMs: number): { day: number; minuteOfDay: number } {
  const dt = new Date(nowUtcMs);
  return { day: dt.getUTCDay(), minuteOfDay: dt.getUTCHours() * 60 + dt.getUTCMinutes() };
}

function isHoliday(symbol: CanonicalSymbol, nowUtcMs: number): boolean {
  const dateKey = new Date(nowUtcMs).toISOString().slice(0, 10);
  const rules = (process.env.CADP_HOLIDAY_UTC_DATES ?? "").split(",").map((value) => value.trim());
  return rules.includes(dateKey) || rules.includes(`${symbol}:${dateKey}`);
}

export function buildMarketAvailability(symbol: CanonicalSymbol, nowUtcMs: number): MarketAvailabilitySnapshot {
  const holidayClosed = isHoliday(symbol, nowUtcMs);
  if (getInstrument(symbol).is_crypto) {
    return {
      marketOpen: !holidayClosed,
      inMaintenance: false,
      minutesToClose: null,
      minutesSinceOpen: null,
      weeklyClosed: false,
      holidayClosed,
    };
  }

  const { day, minuteOfDay } = toUtcParts(nowUtcMs);
  const maintenanceStart = 22 * 60;
  const maintenanceEnd = maintenanceStart + 5;
  const weeklyClosed = day === 6 || (day === 5 && minuteOfDay >= maintenanceStart) || (day === 0 && minuteOfDay < maintenanceStart);
  const inMaintenance = !weeklyClosed && minuteOfDay >= maintenanceStart && minuteOfDay < maintenanceEnd;
  const minutesToClose = weeklyClosed ? null : (maintenanceStart - minuteOfDay + 24 * 60) % (24 * 60);
  const minutesSinceOpen = minuteOfDay >= maintenanceEnd
    ? minuteOfDay - maintenanceEnd
    : minuteOfDay + (24 * 60 - maintenanceEnd);
  const marketOpen = !weeklyClosed && !inMaintenance && !holidayClosed;

  return { marketOpen, inMaintenance, minutesToClose, minutesSinceOpen: marketOpen ? minutesSinceOpen : null, weeklyClosed, holidayClosed };
}

export class AnalysisCycleControl {
  private readonly activeBySymbol = new Set<CanonicalSymbol>();

  evaluate(input: EvaluateCycleInput): { allowed: true } | { allowed: false; reason: OperationalSkipReason; detail: string } {
    if (this.activeBySymbol.has(input.symbol)) {
      return { allowed: false, reason: "SKIPPED_DUPLICATE", detail: "Active analysis lock in progress." };
    }
    if (!input.market.marketOpen || input.market.weeklyClosed || input.market.holidayClosed) {
      return { allowed: false, reason: "SKIPPED_MARKET_CLOSED", detail: "Market unavailable for current symbol." };
    }
    if (input.market.inMaintenance) {
      return { allowed: false, reason: "SKIPPED_MAINTENANCE", detail: "Daily maintenance window active." };
    }
    return { allowed: true };
  }

  enter(symbol: CanonicalSymbol, nowUtcMs: number): void {
    void nowUtcMs;
    this.activeBySymbol.add(symbol);
  }

  leave(symbol: CanonicalSymbol, lastClosedCandleTs: number | null): void {
    void lastClosedCandleTs;
    this.activeBySymbol.delete(symbol);
  }

  reset(): void {
    this.activeBySymbol.clear();
  }
}

export const analysisCycleControl = new AnalysisCycleControl();