import type { Asset } from "../engine/types/marketData";
import type { AIHorizon, TimeframeRoleMap } from "./types";

export type StrategyStatus = "DRAFT" | "SHADOW" | "BETA" | "ACTIVE" | "RETIRED";

export interface AIStrategyDefinition {
  id: string;
  version: string;
  status: StrategyStatus;
  authorizedAssets: Asset[];
  authorizedHorizons: AIHorizon[];
  timeframes: TimeframeRoleMap;
  criticalRules: string[];
  secondaryRules: string[];
  inputFormatVersion: string;
  outputFormatVersion: string;
  activationDateUtc: string;
  promptVersion: string;
}

const STRATEGIES: AIStrategyDefinition[] = [
  {
    id: "CARVIPIX_TREND_PULLBACK_SHORT_V1",
    version: "1.0.0",
    status: "SHADOW",
    authorizedAssets: ["XAUUSD", "EURUSD", "GBPUSD", "BTCUSD"],
    authorizedHorizons: ["SHORT"],
    timeframes: { context: "1H", setup: "45M", confirmation: "5M" },
    criticalRules: ["CLOSED_CANDLES_ONLY", "NO_LEVEL_INVENTION", "SAFETY_AND_RISK_MUST_PASS"],
    secondaryRules: ["PREFER_LOW_SPREAD", "PREFER_HIGH_ADX"],
    inputFormatVersion: "ai_request_v1",
    outputFormatVersion: "ai_response_v1",
    activationDateUtc: "2026-07-11T00:00:00.000Z",
    promptVersion: "PENDING_MASTER_PROMPT",
  },
  {
    id: "CARVIPIX_TREND_PULLBACK_MEDIUM_V1",
    version: "1.0.0",
    status: "SHADOW",
    authorizedAssets: ["XAUUSD", "EURUSD", "GBPUSD", "BTCUSD"],
    authorizedHorizons: ["MEDIUM"],
    timeframes: { context: "1H", setup: "1H", confirmation: "45M" },
    criticalRules: ["CLOSED_CANDLES_ONLY", "NO_LEVEL_INVENTION", "SAFETY_AND_RISK_MUST_PASS"],
    secondaryRules: ["PREFER_SESSION_OVERLAP"],
    inputFormatVersion: "ai_request_v1",
    outputFormatVersion: "ai_response_v1",
    activationDateUtc: "2026-07-11T00:00:00.000Z",
    promptVersion: "PENDING_MASTER_PROMPT",
  },
  {
    id: "CARVIPIX_TREND_PULLBACK_LONG_V1",
    version: "1.0.0",
    status: "SHADOW",
    authorizedAssets: ["XAUUSD", "EURUSD", "GBPUSD", "BTCUSD"],
    authorizedHorizons: ["LONG"],
    timeframes: { context: "1H", setup: "1H", confirmation: "1H" },
    criticalRules: ["CLOSED_CANDLES_ONLY", "NO_LEVEL_INVENTION", "SAFETY_AND_RISK_MUST_PASS"],
    secondaryRules: ["PREFER_ADX_CONFIRMATION"],
    inputFormatVersion: "ai_request_v1",
    outputFormatVersion: "ai_response_v1",
    activationDateUtc: "2026-07-11T00:00:00.000Z",
    promptVersion: "PENDING_MASTER_PROMPT",
  },
  {
    id: "CARVIPIX_TREND_PULLBACK_VERY_LONG_V1",
    version: "1.0.0",
    status: "SHADOW",
    authorizedAssets: ["XAUUSD", "EURUSD", "GBPUSD", "BTCUSD"],
    authorizedHorizons: ["VERY_LONG"],
    timeframes: { context: "1H", setup: "1H", confirmation: "1H" },
    criticalRules: ["CLOSED_CANDLES_ONLY", "NO_LEVEL_INVENTION", "SAFETY_AND_RISK_MUST_PASS"],
    secondaryRules: ["PREFER_STRONG_TREND"],
    inputFormatVersion: "ai_request_v1",
    outputFormatVersion: "ai_response_v1",
    activationDateUtc: "2026-07-11T00:00:00.000Z",
    promptVersion: "PENDING_MASTER_PROMPT",
  },
  {
    id: "CARVIPIX_VOLATILITY_BREAKOUT_SHORT_V1",
    version: "1.0.0",
    status: "SHADOW",
    authorizedAssets: ["XAUUSD", "EURUSD", "GBPUSD", "BTCUSD"],
    authorizedHorizons: ["SHORT"],
    timeframes: { context: "1H", setup: "45M", confirmation: "5M" },
    criticalRules: ["CLOSED_CANDLES_ONLY", "NO_LEVEL_INVENTION", "SAFETY_AND_RISK_MUST_PASS"],
    secondaryRules: ["COMPRESSION_REQUIRED"],
    inputFormatVersion: "ai_request_v1",
    outputFormatVersion: "ai_response_v1",
    activationDateUtc: "2026-07-11T00:00:00.000Z",
    promptVersion: "PENDING_MASTER_PROMPT",
  },
  {
    id: "CARVIPIX_VOLATILITY_BREAKOUT_MEDIUM_V1",
    version: "1.0.0",
    status: "SHADOW",
    authorizedAssets: ["XAUUSD", "EURUSD", "GBPUSD", "BTCUSD"],
    authorizedHorizons: ["MEDIUM"],
    timeframes: { context: "1H", setup: "1H", confirmation: "45M" },
    criticalRules: ["CLOSED_CANDLES_ONLY", "NO_LEVEL_INVENTION", "SAFETY_AND_RISK_MUST_PASS"],
    secondaryRules: ["COMPRESSION_REQUIRED"],
    inputFormatVersion: "ai_request_v1",
    outputFormatVersion: "ai_response_v1",
    activationDateUtc: "2026-07-11T00:00:00.000Z",
    promptVersion: "PENDING_MASTER_PROMPT",
  },
  {
    id: "CARVIPIX_NO_TRADE_V1",
    version: "1.0.0",
    status: "ACTIVE",
    authorizedAssets: ["XAUUSD", "EURUSD", "GBPUSD", "BTCUSD"],
    authorizedHorizons: ["SHORT", "MEDIUM", "LONG", "VERY_LONG"],
    timeframes: { context: "1H", setup: "45M", confirmation: "5M" },
    criticalRules: ["NO_ENTRY_SIGNAL"],
    secondaryRules: ["WAIT_OR_REJECT"],
    inputFormatVersion: "ai_request_v1",
    outputFormatVersion: "ai_response_v1",
    activationDateUtc: "2026-07-11T00:00:00.000Z",
    promptVersion: "PENDING_MASTER_PROMPT",
  },
];

export class StrategyPromptRegistry {
  list(): AIStrategyDefinition[] {
    return [...STRATEGIES];
  }

  listAuthorizedForProfile(profile: string): AIStrategyDefinition[] {
    return STRATEGIES.filter((strategy) => strategy.promptVersion === "PENDING_MASTER_PROMPT" || profile.includes("XAUUSD"));
  }

  get(strategyId: string): AIStrategyDefinition | null {
    return STRATEGIES.find((s) => s.id === strategyId) ?? null;
  }

  ensureActive(strategyId: string): AIStrategyDefinition {
    const strategy = this.get(strategyId);
    if (!strategy) {
      throw new Error(`STRATEGY_NOT_FOUND: ${strategyId}`);
    }
    if (strategy.status === "RETIRED") {
      throw new Error(`STRATEGY_RETIRED: ${strategyId}`);
    }
    return strategy;
  }

  ensureAuthorized(strategyId: string, symbol: Asset, horizon: AIHorizon): AIStrategyDefinition {
    const strategy = this.ensureActive(strategyId);
    if (!strategy.authorizedAssets.includes(symbol)) {
      throw new Error(`STRATEGY_ASSET_NOT_AUTHORIZED: ${strategyId}:${symbol}`);
    }
    if (!strategy.authorizedHorizons.includes(horizon)) {
      throw new Error(`STRATEGY_HORIZON_NOT_AUTHORIZED: ${strategyId}:${horizon}`);
    }
    return strategy;
  }
}
