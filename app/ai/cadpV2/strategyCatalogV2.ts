export const XAUUSD_MTF_STRATEGY_CATALOG = [
  {
    strategy_id: "CARVIPIX_MTF_TREND_PULLBACK_XAUUSD_V1",
    strategy_version: "1.0.0",
    status: "SHADOW",
    short_description: "MTF pullback for XAUUSD intraday.",
    critical_requirements: ["H1_DIRECTION", "M45_PULLBACK_OR_COMPRESSION", "M5_CONFIRMATION"],
    allowed_profile: "XAUUSD_INTRADAY_H1_M45_M5_V1",
  },
  {
    strategy_id: "CARVIPIX_VOLATILITY_BREAKOUT_XAUUSD_V1",
    strategy_version: "1.0.0",
    status: "SHADOW",
    short_description: "Volatility breakout for XAUUSD intraday.",
    critical_requirements: ["H1_RANGE_OR_COMPRESSION", "M45_EXPANSION", "M5_TRIGGER"],
    allowed_profile: "XAUUSD_INTRADAY_H1_M45_M5_V1",
  },
  {
    strategy_id: "CARVIPIX_NO_TRADE_V1",
    strategy_version: "1.0.0",
    status: "ACTIVE",
    short_description: "Explicit no trade option.",
    critical_requirements: ["NO_SETUP", "RISK_OR_NEWS_BLOCK"],
    allowed_profile: "XAUUSD_INTRADAY_H1_M45_M5_V1",
  },
] as const;
