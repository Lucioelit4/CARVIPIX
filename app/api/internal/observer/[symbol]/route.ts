import "server-only";
import { NextResponse } from "next/server";
import { observerV3 } from "@/app/ai/cadpV2/observerV3";
import type { CanonicalSymbol } from "@/app/ai/cadpV2/typesMaestroV3";

const VALID_SYMBOLS = new Set<string>(["XAUUSD", "BTCUSD", "EURUSD", "GBPUSD", "USDJPY", "AUDUSD", "USDCHF"]);

/**
 * GET /api/internal/observer/[symbol]
 * Returns the full Observador payload for a specific instrument.
 * Includes analysis_private (for admin panel only).
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ symbol: string }> }
): Promise<NextResponse> {
  const authHeader = request.headers.get("x-internal-token");
  const expectedToken = process.env["INTERNAL_OBSERVER_TOKEN"];

  if (!expectedToken || authHeader !== expectedToken) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const { symbol } = await params;
  const upperSymbol = symbol.toUpperCase();

  if (!VALID_SYMBOLS.has(upperSymbol)) {
    return NextResponse.json({ error: "INVALID_SYMBOL" }, { status: 400 });
  }

  const payload = observerV3.getObservadorPayload(upperSymbol as CanonicalSymbol);
  const latest = observerV3.getLatestForSymbol(upperSymbol as CanonicalSymbol);

  if (!payload || !latest) {
    return NextResponse.json({ error: "NO_DATA_YET", symbol: upperSymbol }, { status: 404 });
  }

  return NextResponse.json({
    symbol: upperSymbol,
    analysis_id: payload.analysis_id,
    timestamp: payload.timestamp_iso,

    // Bloque 1 — master_decision
    decision: payload.master_decision.decision,
    direction: payload.master_decision.direction,
    strategy: payload.master_decision.strategy_selected,
    conviction: payload.master_decision.conviction,
    probability_estimated: payload.master_decision.probability_estimated,
    probability_basis: payload.master_decision.probability_basis,

    // Bloque 2 — analysis_private (ADMIN ONLY — stored complete)
    analysis_private: {
      analysis_summary: payload.analysis_private.analysis_summary,
      decisive_evidence: payload.analysis_private.decisive_evidence,
      opposing_evidence: payload.analysis_private.opposing_evidence,
      primary_risk: payload.analysis_private.primary_risk,
      missing_condition: payload.analysis_private.missing_condition,
      market_context_observed: payload.analysis_private.market_context_observed,
      what_must_change: payload.analysis_private.what_must_change,
      probability_detail: payload.analysis_private.probability_detail,
    },

    // Bloque 3 — analysis_public
    market_visual_state: payload.analysis_public.market_visual_state,
    supporting_facts: payload.analysis_public.supporting_facts,
    public_summary: payload.analysis_public.public_summary,
    action_taken: payload.analysis_public.action_taken,
    public_warning: payload.analysis_public.public_warning,

    // Bloque 4 — order_plan
    order_plan: payload.order_plan,

    // Bloque 5 — adaptive_state
    adaptive_state: {
      proximity_to_entry: payload.adaptive_state.proximity_to_entry,
      recheck_minutes: payload.adaptive_state.recheck_minutes,
      watch_conditions: payload.adaptive_state.watch_conditions,
      wake_up_triggers: payload.adaptive_state.wake_up_triggers,
      missing_for_entry: payload.adaptive_state.missing_for_entry,
      scenario_classification: payload.adaptive_state.scenario_classification,
    },

    // Bloque 6 — analyst_observations
    analyst_observations: {
      summary: payload.analyst_observations.summary,
      scenario_narrative: payload.analyst_observations.scenario_narrative,
      key_observation: payload.analyst_observations.key_observation,
    },

    // Evolution
    decision_evolution: payload.decision_evolution,
    scenario_lifetime: payload.scenario_lifetime,

    // Meta
    meta: {
      model: payload.meta.model_used,
      tokens_in: payload.meta.tokens_in,
      tokens_out: payload.meta.tokens_out,
      cost_usd: payload.meta.cost_usd_estimated,
      latency_ms: payload.meta.latency_ms,
      cadp_version: payload.meta.cadp_version,
      prompt_version: payload.meta.prompt_version,
    },
  });
}
