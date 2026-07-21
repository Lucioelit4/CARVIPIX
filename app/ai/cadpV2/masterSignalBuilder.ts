import type { Asset } from "../../engine/types/marketData";
import { CADP_V1_PROFILE, type CadpAnalysisResponseV2, type CadpShadowSignal } from "./types";
import type { RespuestaMaestraV3 } from "./typesMaestroV3";

export class CadpMasterSignalBuilder {
  build(input: {
    signalId: string;
    analysisId: string;
    symbol: Asset;
    profile: string;
    response: CadpAnalysisResponseV2;
  }): CadpShadowSignal {
    const decision = input.response.analyst_decision;
    const direction = decision === "ENTER_BUY" ? "BUY" : decision === "ENTER_SELL" ? "SELL" : "NONE";

    return {
      signal_id: input.signalId,
      analysis_id: input.analysisId,
      symbol: input.symbol,
      analysis_profile: input.profile as CadpShadowSignal["analysis_profile"],
      selected_strategy_id: input.response.strategy.selected_strategy_id ?? "CARVIPIX_NO_TRADE_V1",
      direction,
      entry: input.response.order_plan.entry_price,
      stop_loss: input.response.order_plan.stop_loss,
      take_profit: input.response.order_plan.take_profit,
      calculated_gross_rr: input.response.order_plan.proposed_gross_rr,
      calculated_net_rr: input.response.order_plan.proposed_net_rr,
      expires_at: input.response.order_plan.expires_at,
      status: "SHADOW",
      human_review_required: true,
      auto_execution_eligible: false,
    };
  }

  buildV3(input: {
    signalId: string;
    analysisId: string;
    symbol: Asset;
    response: RespuestaMaestraV3;
  }): CadpShadowSignal {
    const decision = input.response.master_decision.decision;
    const direction = decision === "ENTER_BUY" ? "BUY" : decision === "ENTER_SELL" ? "SELL" : "NONE";
    const orderPlan = input.response.order_plan;
    const entry = orderPlan?.entry_price
      ?? (orderPlan?.entry_zone_min !== null && orderPlan?.entry_zone_min !== undefined
        && orderPlan.entry_zone_max !== null && orderPlan.entry_zone_max !== undefined
        ? Number(((orderPlan.entry_zone_min + orderPlan.entry_zone_max) / 2).toFixed(10))
        : null);
    const validityMinutes = orderPlan?.validity_minutes;
    const snapshotMs = Date.parse(input.response._meta.snapshot_utc);
    const expiresAt = validityMinutes && Number.isFinite(snapshotMs)
      ? new Date(snapshotMs + validityMinutes * 60_000).toISOString()
      : null;

    return {
      signal_id: input.signalId,
      analysis_id: input.analysisId,
      symbol: input.symbol,
      analysis_profile: CADP_V1_PROFILE,
      selected_strategy_id: input.response.master_decision.strategy_selected ?? "CARVIPIX_NO_TRADE_V1",
      direction,
      entry,
      stop_loss: orderPlan?.stop_loss ?? null,
      take_profit: orderPlan?.take_profit ?? null,
      calculated_gross_rr: orderPlan?.risk_reward_ratio ?? null,
      calculated_net_rr: orderPlan?.risk_reward_ratio ?? null,
      expires_at: expiresAt,
      status: "SHADOW",
      human_review_required: true,
      auto_execution_eligible: false,
    };
  }
}
