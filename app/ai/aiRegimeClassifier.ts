import type { AIHorizon, AIRegime } from "./types";

export function selectStrategyIdForRegime(regime: AIRegime, horizon: AIHorizon): string {
  if (regime === "DATA_NOT_READY") {
    return "CARVIPIX_NO_TRADE_V1";
  }

  if (regime === "SHOCK") {
    return horizon === "SHORT" ? "CARVIPIX_VOLATILITY_BREAKOUT_SHORT_V1" : "CARVIPIX_VOLATILITY_BREAKOUT_MEDIUM_V1";
  }

  if (regime === "COMPRESSION") {
    return horizon === "SHORT" ? "CARVIPIX_VOLATILITY_BREAKOUT_SHORT_V1" : "CARVIPIX_VOLATILITY_BREAKOUT_MEDIUM_V1";
  }

  if (regime === "RANGE") {
    return "CARVIPIX_TREND_PULLBACK_SHORT_V1";
  }

  if (horizon === "SHORT") {
    return "CARVIPIX_TREND_PULLBACK_SHORT_V1";
  }

  if (horizon === "MEDIUM") {
    return "CARVIPIX_TREND_PULLBACK_MEDIUM_V1";
  }

  if (horizon === "LONG") {
    return "CARVIPIX_TREND_PULLBACK_LONG_V1";
  }

  return "CARVIPIX_TREND_PULLBACK_VERY_LONG_V1";
}