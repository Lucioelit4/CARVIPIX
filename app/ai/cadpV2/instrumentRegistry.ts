/**
 * Registro Oficial de Instrumentos — CARVIPIX Expediente Maestro V3
 * Congelado: 2026-07-14
 *
 * Regla: Solo los instrumentos y estrategias listados aquí están autorizados.
 * No agregar instrumentos ni estrategias sin aprobación explícita.
 */

import type { CanonicalSymbol, AuthorizedStrategyV3 } from "./typesMaestroV3";

export interface InstrumentDefinition {
  canonical_symbol: CanonicalSymbol;
  display_name: string;
  provider_symbol: string;       // Formato Twelve Data
  broker_symbol: null;           // null hasta implementación EA
  session_focus: string[];
  is_crypto: boolean;
  strategies: AuthorizedStrategyV3[];
  /**
   * "ACTIVE" = estrategias de análisis aprobadas
   * "NO_TRADE_ONLY" = solo NO_TRADE hasta que se aprueben estrategias específicas
   */
  strategy_status: "ACTIVE" | "NO_TRADE_ONLY";
  /** Motivo si strategy_status = "NO_TRADE_ONLY" */
  pending_reason: string | null;
  /** ATR pip value approximate — used for distance calculations */
  pip_value: number;
}

// ─── Estrategia NO_TRADE siempre disponible para todos ───────────────────────

function buildNoTradeStrategy(symbol: CanonicalSymbol): AuthorizedStrategyV3 {
  return {
    strategy_id: "CARVIPIX_NO_TRADE_V1",
    strategy_version: "1.0.0",
    status: "ACTIVE",
    short_description: "Explicit no trade — no valid setup, or risk/news block.",
    critical_requirements: ["NO_SETUP", "RISK_OR_NEWS_BLOCK"],
    canonical_symbol: symbol,
  };
}

// ─── Registro de instrumentos ─────────────────────────────────────────────────

export const INSTRUMENT_REGISTRY: Record<CanonicalSymbol, InstrumentDefinition> = {

  XAUUSD: {
    canonical_symbol: "XAUUSD",
    display_name: "Gold / USD",
    provider_symbol: "XAU/USD",
    broker_symbol: null,
    session_focus: ["LONDON", "NEW_YORK"],
    is_crypto: false,
    pip_value: 0.01,
    strategy_status: "ACTIVE",
    pending_reason: null,
    strategies: [
      {
        strategy_id: "CARVIPIX_MTF_TREND_PULLBACK_XAUUSD_V1",
        strategy_version: "1.0.0",
        status: "SHADOW",
        short_description: "Multi-TF trend pullback: H1 direction + M30 pullback or compression + M5 confirmation.",
        critical_requirements: ["H1_DIRECTION", "M30_PULLBACK_OR_COMPRESSION", "M5_CONFIRMATION"],
        canonical_symbol: "XAUUSD",
      },
      {
        strategy_id: "CARVIPIX_VOLATILITY_BREAKOUT_XAUUSD_V1",
        strategy_version: "1.0.0",
        status: "SHADOW",
        short_description: "Volatility breakout: H1 range or compression + M30 expansion + M5 trigger.",
        critical_requirements: ["H1_RANGE_OR_COMPRESSION", "M30_EXPANSION", "M5_TRIGGER"],
        canonical_symbol: "XAUUSD",
      },
      buildNoTradeStrategy("XAUUSD"),
    ],
  },

  BTCUSD: {
    canonical_symbol: "BTCUSD",
    display_name: "Bitcoin / USD",
    provider_symbol: "BTC/USD",
    broker_symbol: null,
    session_focus: ["CRYPTO_24H"],
    is_crypto: true,
    pip_value: 1,
    strategy_status: "NO_TRADE_ONLY",
    pending_reason: "PENDING: 6 parameters to define before activating strategies (ATR thresholds, 24H session policy, weekend gaps, news sources, spread policy).",
    strategies: [buildNoTradeStrategy("BTCUSD")],
  },

  EURUSD: {
    canonical_symbol: "EURUSD",
    display_name: "Euro / USD",
    provider_symbol: "EUR/USD",
    broker_symbol: null,
    session_focus: ["LONDON", "NEW_YORK"],
    is_crypto: false,
    pip_value: 0.0001,
    strategy_status: "NO_TRADE_ONLY",
    pending_reason: "PENDING: ATR thresholds in pips for pullback and breakout strategies need calibration.",
    strategies: [buildNoTradeStrategy("EURUSD")],
  },

  GBPUSD: {
    canonical_symbol: "GBPUSD",
    display_name: "GBP / USD",
    provider_symbol: "GBP/USD",
    broker_symbol: null,
    session_focus: ["LONDON"],
    is_crypto: false,
    pip_value: 0.0001,
    strategy_status: "NO_TRADE_ONLY",
    pending_reason: "PENDING: Wider ATR thresholds and gap policy for London open need definition.",
    strategies: [buildNoTradeStrategy("GBPUSD")],
  },

  USDJPY: {
    canonical_symbol: "USDJPY",
    display_name: "USD / Japanese Yen",
    provider_symbol: "USD/JPY",
    broker_symbol: null,
    session_focus: ["TOKYO", "NEW_YORK"],
    is_crypto: false,
    pip_value: 0.01,
    strategy_status: "NO_TRADE_ONLY",
    pending_reason: "PENDING: BOJ intervention policy and Tokyo session parameters need explicit definition.",
    strategies: [buildNoTradeStrategy("USDJPY")],
  },

  AUDUSD: {
    canonical_symbol: "AUDUSD",
    display_name: "AUD / USD",
    provider_symbol: "AUD/USD",
    broker_symbol: null,
    session_focus: ["SYDNEY", "LONDON"],
    is_crypto: false,
    pip_value: 0.0001,
    strategy_status: "NO_TRADE_ONLY",
    pending_reason: "PENDING: Commodity correlation context policy needs definition (iron, gold linkage).",
    strategies: [buildNoTradeStrategy("AUDUSD")],
  },

  USDCHF: {
    canonical_symbol: "USDCHF",
    display_name: "USD / Swiss Franc",
    provider_symbol: "USD/CHF",
    broker_symbol: null,
    session_focus: ["LONDON", "NEW_YORK"],
    is_crypto: false,
    pip_value: 0.0001,
    strategy_status: "NO_TRADE_ONLY",
    pending_reason: "PENDING: SNB intervention policy and EURUSD inverse correlation management need definition.",
    strategies: [buildNoTradeStrategy("USDCHF")],
  },
};

export function getInstrument(symbol: CanonicalSymbol): InstrumentDefinition {
  return INSTRUMENT_REGISTRY[symbol];
}

export const ALL_CANONICAL_SYMBOLS: CanonicalSymbol[] = [
  "XAUUSD", "BTCUSD", "EURUSD", "GBPUSD", "USDJPY", "AUDUSD", "USDCHF",
];

export function getAuthorizedStrategies(symbol: CanonicalSymbol): AuthorizedStrategyV3[] {
  return INSTRUMENT_REGISTRY[symbol].strategies;
}
