import type { Asset } from "../../engine/types/marketData";
import type { CadpAnalysisResponseV2, CadpShadowSignal } from "./types";

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
}
