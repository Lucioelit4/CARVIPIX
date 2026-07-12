import type { Asset } from "../engine/types/marketData";
import { selectStrategyIdForRegime } from "./aiRegimeClassifier";
import { StrategyPromptRegistry, type AIStrategyDefinition } from "./strategyPromptRegistry";
import type { AIHorizon, AIRegime } from "./types";

export interface BrainAnalysisPlan {
  strategy: AIStrategyDefinition;
  strategy_id: string;
  strategy_version: string;
  prompt_version: string;
}

export class BrainManager {
  constructor(private readonly registry: StrategyPromptRegistry) {}

  selectPlan(input: { symbol: Asset; horizon: AIHorizon; regime: AIRegime }): BrainAnalysisPlan {
    const strategyId = selectStrategyIdForRegime(input.regime, input.horizon);
    const strategy = this.registry.ensureAuthorized(strategyId, input.symbol, input.horizon);
    return {
      strategy,
      strategy_id: strategy.id,
      strategy_version: strategy.version,
      prompt_version: strategy.promptVersion,
    };
  }

  buildAnalysisIdentity(): { analysisId: string; signalId: string } {
    const analysisId = `analysis_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    return {
      analysisId,
      signalId: `sig_${analysisId}`,
    };
  }
}
