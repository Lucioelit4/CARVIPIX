/**
 * Disparador de Módulos — Expediente Maestro V3
 * Distribuye la Respuesta Maestra a cada módulo mediante plantillas determinísticas.
 *
 * FILOSOFÍA: No analiza. No interpreta. No modifica. No recalcula. No decide.
 * Únicamente copia y formatea los bloques de la respuesta hacia cada consumidor.
 *
 * RESILENCIA: Un destino fallido no bloquea los demás. Cada destino tiene estado independiente.
 */

import type {
  RespuestaMaestraV3,
  ExpedienteMaestroV3,
  DispatcherOutput,
  PayloadBotEngine,
  PayloadAlertaPremium,
  PayloadTelegram,
  PayloadDashboard,
  PayloadObservador,
  PaperAccountState,
  CadpDecisionV3,
  DecisionEvolution,
} from "./typesMaestroV3";
import { scenarioMemoryStore } from "./scenarioMemoryStore";

export type DestinationStatus = "DELIVERED" | "SKIPPED" | "FAILED";

export interface DestinationResult {
  module: string;
  status: DestinationStatus;
  payload_size_bytes: number;
  error?: string;
}

export interface DispatchResult {
  analysis_id: string;
  signal_id: string;
  timestamp_iso: string;
  destinations: DestinationResult[];
  output: DispatcherOutput;
}

function deciscionToAction(decision: CadpDecisionV3): "BUY" | "SELL" | "WAIT" | "NO_TRADE" {
  if (decision === "ENTER_BUY") return "BUY";
  if (decision === "ENTER_SELL") return "SELL";
  if (decision === "WAIT" || decision === "CONDITIONAL_ENTRY" || decision === "ENTRY_MISSED") return "WAIT";
  return "NO_TRADE";
}

function buildNextReviewIso(recheckMinutes: number): string {
  return new Date(Date.now() + recheckMinutes * 60000).toISOString();
}

function sizeOf(obj: unknown): number {
  try {
    return Buffer.byteLength(JSON.stringify(obj), "utf8");
  } catch {
    return 0;
  }
}

function tryBuild<T>(
  moduleName: string,
  fn: () => T,
  destinations: DestinationResult[],
): T | null {
  try {
    const result = fn();
    destinations.push({
      module: moduleName,
      status: "DELIVERED",
      payload_size_bytes: sizeOf(result),
    });
    return result;
  } catch (err) {
    destinations.push({
      module: moduleName,
      status: "FAILED",
      payload_size_bytes: 0,
      error: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}

export class DisparadorModulos {
  dispatch(
    response: RespuestaMaestraV3,
    expediente: ExpedienteMaestroV3,
    paperAccount: PaperAccountState,
  ): DispatchResult {
    const { master_decision, analysis_private, analysis_public, order_plan, adaptive_state, analyst_observations } = response;
    const meta = response._meta;
    const identity = expediente.identity;
    const destinations: DestinationResult[] = [];

    // ── Módulo 1: BOT ENGINE (bloques 1+4 — sin analysis_private)
    const bot_engine = tryBuild<PayloadBotEngine>("bot_engine", () => ({
      signal_id: identity.signal_id,
      analysis_id: identity.analysis_id,
      canonical_symbol: identity.canonical_symbol,
      direction: master_decision.direction === "BUY" ? "BUY"
        : master_decision.direction === "SELL" ? "SELL"
        : "NONE",
      entry: order_plan?.entry_price ?? null,
      stop_loss: order_plan?.stop_loss ?? null,
      take_profit: order_plan?.take_profit ?? null,
      rr: order_plan?.risk_reward_ratio ?? null,
      validity_minutes: order_plan?.validity_minutes ?? null,
      strategy: master_decision.strategy_selected,
      status: "NON_EXECUTABLE",
      auto_executable: false,
      requires_human_review: true,
    }), destinations);

    // ── Módulo 2: ALERTA PREMIUM (bloques 1+3+4 — sin analysis_private)
    const alerta_premium = tryBuild<PayloadAlertaPremium>("alerta_premium", () => ({
      canonical_symbol: identity.canonical_symbol,
      action: deciscionToAction(master_decision.decision),
      entry: order_plan?.entry_price ?? null,
      stop_loss: order_plan?.stop_loss ?? null,
      take_profit: order_plan?.take_profit ?? null,
      rr: order_plan?.risk_reward_ratio ?? null,
      probability: master_decision.probability_estimated,
      market_condition: analysis_public.public_summary,
      primary_warning: analysis_public.public_warning,
      // ❌ analysis_private: NOT INCLUDED — confirmed by design
    }), destinations);

    // ── Módulo 3: TELEGRAM (bloque 3 solo — sin analysis_private, sin levels privados)
    const telegram = tryBuild<PayloadTelegram>("telegram", () => ({
      public_summary: analysis_public.public_summary,
      market_status: analysis_public.market_visual_state,
      action_taken: analysis_public.action_taken,
      public_warning: analysis_public.public_warning,
      recheck_minutes: adaptive_state.recheck_minutes,
      scenario_classification: adaptive_state.scenario_classification,
      proximity_to_entry: adaptive_state.proximity_to_entry,
      // ❌ analysis_private: NOT INCLUDED — confirmed by design
      // ❌ order_plan levels: NOT INCLUDED for channels without permission
    }), destinations);

    // ── Módulo 4: DASHBOARD (bloques 1+3+5)
    const dashboard = tryBuild<PayloadDashboard>("dashboard", () => ({
      canonical_symbol: identity.canonical_symbol,
      market_visual_state: analysis_public.market_visual_state,
      decision: master_decision.decision,
      probability: master_decision.probability_estimated,
      conviction: master_decision.conviction,
      scenario_classification: adaptive_state.scenario_classification,
      proximity: adaptive_state.proximity_to_entry,
      recheck_minutes: adaptive_state.recheck_minutes,
      next_review_iso: buildNextReviewIso(adaptive_state.recheck_minutes),
      scenario_lifetime_label: expediente.previous_context.scenario_lifetime.lifetime_label,
    }), destinations);

    // ── Módulo 5: ESTADO DEL MERCADO (bloque 3)
    tryBuild("market_state", () => ({
      canonical_symbol: identity.canonical_symbol,
      market_visual_state: analysis_public.market_visual_state,
      supporting_facts: analysis_public.supporting_facts,
      action_taken: analysis_public.action_taken,
      public_warning: analysis_public.public_warning,
    }), destinations);

    // ── Módulo 6: OBSERVADOR (bloques 1-6 completos + meta)
    // ✅ analysis_private: INCLUDED — admin only
    const decisionEvolution: DecisionEvolution = scenarioMemoryStore.buildDecisionEvolution(
      identity.canonical_symbol, 8,
    );
    const observador = tryBuild<PayloadObservador>("observador", () => ({
      analysis_id: identity.analysis_id,
      canonical_symbol: identity.canonical_symbol,
      timestamp_iso: identity.timestamp_iso,
      master_decision,
      analysis_private,    // ✅ Full analysis_private — admin panel only
      analysis_public,
      order_plan: order_plan ?? null,
      adaptive_state,
      analyst_observations,
      decision_evolution: decisionEvolution,
      scenario_lifetime: expediente.previous_context.scenario_lifetime,
      meta,
    }), destinations);

    // ── Módulo 7: HISTORIAL Y AUDITORÍA
    tryBuild("historial", () => ({
      analysis_id: identity.analysis_id,
      signal_id: identity.signal_id,
      canonical_symbol: identity.canonical_symbol,
      timestamp_iso: identity.timestamp_iso,
      expediente_hash: identity.snapshot_hash,
      decision: master_decision.decision,
      probability: master_decision.probability_estimated,
      order_plan,
      adaptive_state_summary: {
        proximity: adaptive_state.proximity_to_entry,
        recheck_minutes: adaptive_state.recheck_minutes,
        scenario: adaptive_state.scenario_classification,
      },
      meta,
      // analyst_observations included for full audit trail
      analyst_observations,
    }), destinations);

    // ── Módulo 8: DASHBOARD AGGREGATE
    tryBuild("paper_monitor", () => ({
      canonical_symbol: identity.canonical_symbol,
      decision: master_decision.decision,
      entry: order_plan?.entry_price ?? null,
      stop_loss: order_plan?.stop_loss ?? null,
      take_profit: order_plan?.take_profit ?? null,
      paper_account_snapshot: {
        balance: paperAccount.current_balance_usd,
        equity: paperAccount.equity_usd,
        open_trades: paperAccount.open_trades.length,
        daily_pnl: paperAccount.daily_pnl_usd,
      },
    }), destinations);

    // ── Módulo 9: RESULTADOS
    tryBuild("resultados", () => ({
      analysis_id: identity.analysis_id,
      canonical_symbol: identity.canonical_symbol,
      decision: master_decision.decision,
      has_entry: master_decision.decision === "ENTER_BUY" || master_decision.decision === "ENTER_SELL",
      entry_price: order_plan?.entry_price ?? null,
      stop_loss: order_plan?.stop_loss ?? null,
      take_profit: order_plan?.take_profit ?? null,
      rr: order_plan?.risk_reward_ratio ?? null,
      result_pending: true,
    }), destinations);

    return {
      analysis_id: identity.analysis_id,
      signal_id: identity.signal_id,
      timestamp_iso: identity.timestamp_iso,
      destinations,
      output: {
        bot_engine: bot_engine!,
        alerta_premium: alerta_premium!,
        telegram: telegram!,
        dashboard: dashboard!,
        observador: observador!,
        paper_account: paperAccount,
      },
    };
  }
}

export const disparadorModulos = new DisparadorModulos();
