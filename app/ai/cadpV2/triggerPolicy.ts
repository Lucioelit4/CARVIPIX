import type { Asset } from "../../engine/types/marketData";
import type { CadpAnalysisTriggerReason } from "./types";

export interface AnalysisTriggerInput {
  symbol: Asset;
  analysis_profile: string;
  snapshot_close_timestamp: number;
  context_version: string;
  reason: CadpAnalysisTriggerReason;
  watching: boolean;
  minutes_to_expire: number;
  proximity_to_structure: number;
  volatility_change: number;
  news_nearby: boolean;
  previous_decision: "WAIT" | "NO_TRADE" | "ENTER_BUY" | "ENTER_SELL" | "ENTRY_MISSED" | null;
}

export interface AnalysisTriggerDecision {
  shouldTrigger: boolean;
  priority: number;
  cooldownSeconds: number;
  dedupeKey: string;
  stateOfWatch: "WATCHING" | "IDLE";
  reason: CadpAnalysisTriggerReason;
}

export class AnalysisTriggerPolicy {
  constructor(private readonly cooldownSeconds = 300, private readonly proximityThreshold = 0.2) {}

  evaluate(input: AnalysisTriggerInput): AnalysisTriggerDecision {
    const meaningful =
      input.reason === "NEW_H1_CLOSE" ||
      input.reason === "NEW_M30_CLOSE" ||
      (input.reason === "NEW_M5_CLOSE_WHEN_WATCHING" && input.watching) ||
      input.reason === "PRICE_NEAR_STRUCTURE" ||
      input.reason === "VOLATILITY_CHANGE" ||
      input.reason === "COMPRESSION_TO_EXPANSION" ||
      input.reason === "PREVIOUS_SIGNAL_WAIT" ||
      input.reason === "NEWS_NEARBY" ||
      input.reason === "NEWS_STATE_CHANGE" ||
      input.reason === "ABNORMAL_MOVE" ||
      input.reason === "ENTRY_PENDING_EXPIRING";

    const highPriority = input.news_nearby || input.minutes_to_expire <= 10 || input.volatility_change >= this.proximityThreshold;

    return {
      shouldTrigger: meaningful,
      priority: highPriority ? 90 : input.watching ? 60 : 40,
      cooldownSeconds: this.cooldownSeconds,
      dedupeKey: `${input.symbol}:${input.analysis_profile}:${input.snapshot_close_timestamp}:${input.context_version}`,
      stateOfWatch: input.watching ? "WATCHING" : "IDLE",
      reason: input.reason,
    };
  }
}
