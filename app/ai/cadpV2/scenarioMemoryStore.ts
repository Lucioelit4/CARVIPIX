/**
 * Scenario Memory Store — Expediente Maestro V3
 * Persiste la memoria del escenario activo por instrumento.
 * Permite construir la Sección 4 (previous_context) y el historial de evolución.
 */

import type {
  CanonicalSymbol,
  CadpDecisionV3,
  ScenarioClassification,
  AdaptiveStateV3,
  OrderPlanV3,
  PreviousContextV3,
  ScenarioLifetime,
  DecisionEvolution,
} from "./typesMaestroV3";

export interface ScenarioMemoryEntry {
  analysis_id: string;
  signal_id: string;
  canonical_symbol: CanonicalSymbol;
  timestamp_iso: string;
  timestamp_ms: number;

  decision: CadpDecisionV3;
  scenario_classification: ScenarioClassification;
  probability_estimated: number | null;
  conviction: "LOW" | "MEDIUM" | "HIGH" | null;

  order_plan: OrderPlanV3 | null;

  adaptive_state: {
    proximity_to_entry: AdaptiveStateV3["proximity_to_entry"];
    recheck_minutes: AdaptiveStateV3["recheck_minutes"];
    watch_conditions: AdaptiveStateV3["watch_conditions"];
    wake_up_triggers: AdaptiveStateV3["wake_up_triggers"];
    missing_for_entry: string | null;
  };

  /** Tracking for scenario lifetime */
  scenario_type_key: string;  // Combination that identifies the same "scenario"
  scenario_first_seen_ms: number;

  strategy_version: string;
  prompt_version: string;
}

export interface ScenarioSnapshot {
  /** Latest entry per instrument */
  latest: ScenarioMemoryEntry | null;
  /** Chronological history, last N entries */
  history: ScenarioMemoryEntry[];
}

export class ScenarioMemoryStore {
  private readonly snapshots = new Map<CanonicalSymbol, ScenarioSnapshot>();
  /** Max history entries per instrument */
  private readonly maxHistory = 48;

  private getOrCreate(symbol: CanonicalSymbol): ScenarioSnapshot {
    if (!this.snapshots.has(symbol)) {
      this.snapshots.set(symbol, { latest: null, history: [] });
    }
    return this.snapshots.get(symbol)!;
  }

  save(entry: ScenarioMemoryEntry): void {
    const snap = this.getOrCreate(entry.canonical_symbol);
    snap.latest = entry;
    snap.history.push(entry);
    if (snap.history.length > this.maxHistory) {
      snap.history.shift();
    }
  }

  getLatest(symbol: CanonicalSymbol): ScenarioMemoryEntry | null {
    return this.snapshots.get(symbol)?.latest ?? null;
  }

  getHistory(symbol: CanonicalSymbol, limitEntries = 20): ScenarioMemoryEntry[] {
    const snap = this.snapshots.get(symbol);
    if (!snap) return [];
    return snap.history.slice(-limitEntries);
  }

  buildPreviousContext(symbol: CanonicalSymbol, nowMs: number): PreviousContextV3 {
    const latest = this.getLatest(symbol);

    if (!latest) {
      return {
        exists: false,
        previous_analysis_id: null,
        previous_timestamp_iso: null,
        minutes_since_previous: null,
        previous_decision: null,
        previous_scenario_state: null,
        previous_order_plan: null,
        previous_vigilance: null,
        condition_met_since_previous: { met: false, description: null },
        last_paper_trade: null,
        scenario_lifetime: {
          scenario_active_since_iso: null,
          lifetime_minutes: null,
          lifetime_label: "Nuevo escenario",
          is_extended: false,
        },
      };
    }

    const minutesSince = Math.round((nowMs - latest.timestamp_ms) / 60000);
    const lifetimeMinutes = Math.round((nowMs - latest.scenario_first_seen_ms) / 60000);

    const lifetimeLabel = this.buildLifetimeLabel(lifetimeMinutes, latest.scenario_classification);

    const plan = latest.order_plan;

    const vigilance = latest.adaptive_state.watch_conditions.length > 0
      ? {
          level_watch_break_above: latest.adaptive_state.wake_up_triggers
            .find(t => t.trigger === "PRICE_REACHES_LEVEL" && t.level !== null)?.level ?? null,
          level_watch_break_below: null,
          event_trigger: latest.adaptive_state.wake_up_triggers
            .find(t => t.trigger !== "PRICE_REACHES_LEVEL")?.trigger ?? null,
          expected_recheck_minutes: latest.adaptive_state.recheck_minutes,
          condition_described: latest.adaptive_state.missing_for_entry,
        }
      : null;

    return {
      exists: true,
      previous_analysis_id: latest.analysis_id,
      previous_timestamp_iso: latest.timestamp_iso,
      minutes_since_previous: minutesSince,
      previous_decision: latest.decision,
      previous_scenario_state: latest.scenario_classification,
      previous_order_plan: plan
        ? {
            entry: plan.entry_price,
            stop_loss: plan.stop_loss,
            take_profit: plan.take_profit,
            rr: plan.risk_reward_ratio,
          }
        : null,
      previous_vigilance: vigilance,
      condition_met_since_previous: { met: false, description: null }, // Updated by delta builder
      last_paper_trade: null, // Updated by paper monitor
      scenario_lifetime: {
        scenario_active_since_iso: new Date(latest.scenario_first_seen_ms).toISOString(),
        lifetime_minutes: lifetimeMinutes,
        lifetime_label: lifetimeLabel,
        is_extended: lifetimeMinutes > 180,
      },
    };
  }

  buildDecisionEvolution(symbol: CanonicalSymbol, periodHours = 8): DecisionEvolution {
    const history = this.getHistory(symbol);
    const cutoff = Date.now() - periodHours * 60 * 60 * 1000;
    const filtered = history.filter(e => e.timestamp_ms >= cutoff);

    const entries = filtered.map((e, i) => ({
      analysis_id: e.analysis_id,
      timestamp_iso: e.timestamp_iso,
      decision: e.decision,
      scenario_classification: e.scenario_classification,
      probability_estimated: e.probability_estimated,
      conviction: e.conviction,
      minutes_since_previous: i > 0
        ? Math.round((e.timestamp_ms - filtered[i - 1].timestamp_ms) / 60000)
        : null,
    }));

    const chain = filtered.map(e => e.decision).join(" → ");

    return {
      canonical_symbol: symbol,
      period_hours: periodHours,
      entries,
      decision_chain: chain || "(sin historial)",
    };
  }

  buildScenarioLifetime(symbol: CanonicalSymbol, nowMs: number): ScenarioLifetime {
    const latest = this.getLatest(symbol);
    if (!latest) {
      return {
        scenario_active_since_iso: null,
        lifetime_minutes: null,
        lifetime_label: "Nuevo escenario",
        is_extended: false,
      };
    }
    const lifetimeMinutes = Math.round((nowMs - latest.scenario_first_seen_ms) / 60000);
    return {
      scenario_active_since_iso: new Date(latest.scenario_first_seen_ms).toISOString(),
      lifetime_minutes: lifetimeMinutes,
      lifetime_label: this.buildLifetimeLabel(lifetimeMinutes, latest.scenario_classification),
      is_extended: lifetimeMinutes > 180,
    };
  }

  private buildLifetimeLabel(minutes: number, classification: ScenarioClassification): string {
    const stateLabel = this.classificationLabel(classification);
    if (minutes < 2) return `${stateLabel} — recién iniciado`;
    if (minutes < 60) return `${stateLabel} — ${minutes} minutos`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${stateLabel} — ${h}h ${m > 0 ? `${m}min` : ""}`.trim();
  }

  private classificationLabel(c: ScenarioClassification): string {
    const map: Record<ScenarioClassification, string> = {
      NEW: "Nuevo escenario",
      DEVELOPING: "Escenario desarrollándose",
      NEAR_ENTRY: "Próximo a entrada",
      READY: "Listo para entrada",
      ACTIVE: "Escenario activo",
      INVALIDATED: "Escenario invalidado",
      EXPIRED: "Escenario expirado",
      NO_SETUP: "Sin setup",
    };
    return map[c] ?? c;
  }

  /**
   * Determine the scenario_first_seen_ms for a new entry.
   * If the scenario classification is the same as the previous one and no invalidation occurred,
   * preserve the original first_seen timestamp (scenario continuity).
   */
  resolveScenarioFirstSeen(
    symbol: CanonicalSymbol,
    newClassification: ScenarioClassification,
    nowMs: number,
  ): number {
    const latest = this.getLatest(symbol);
    if (!latest) return nowMs;

    const isNewScenario =
      newClassification === "NEW" ||
      newClassification === "INVALIDATED" ||
      newClassification === "EXPIRED" ||
      newClassification === "NO_SETUP" ||
      latest.scenario_classification === "INVALIDATED" ||
      latest.scenario_classification === "EXPIRED";

    return isNewScenario ? nowMs : latest.scenario_first_seen_ms;
  }
}

export const scenarioMemoryStore = new ScenarioMemoryStore();
