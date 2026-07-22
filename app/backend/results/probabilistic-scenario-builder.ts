import { createHash } from "node:crypto";

import type { ProbabilisticScenario } from "./probabilistic-simulation-engine";

export interface HistoricalMarketCandle {
  symbol: string;
  occurredAt: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface RecordedAnalysisInput {
  analysisId: string;
  occurredAt: string;
  symbol: string;
  direction: "BUY" | "SELL";
  probability: number;
  decisionQuality: number;
  riskReward: number;
  riskPips: number;
}

const SYMBOL_COSTS: Record<string, { pipValue: number; spread: number; commission: number; slippage: number }> = {
  XAUUSD: { pipValue: 0.1, spread: 2.5, commission: 0.7, slippage: 1.2 },
  EURUSD: { pipValue: 0.0001, spread: 1.4, commission: 0.7, slippage: 0.5 },
  GBPUSD: { pipValue: 0.0001, spread: 1.8, commission: 0.7, slippage: 0.7 },
  BTCUSD: { pipValue: 1, spread: 28, commission: 8, slippage: 12 },
};

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function average(values: number[]): number {
  return values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function ema(values: number[], period: number): number {
  if (values.length === 0) return 0;
  const factor = 2 / (period + 1);
  return values.slice(1).reduce((result, value) => value * factor + result * (1 - factor), values[0]);
}

function atr(candles: HistoricalMarketCandle[], period = 14): number {
  const sample = candles.slice(-period);
  return average(sample.map((candle, index) => {
    const previousClose = sample[index - 1]?.close ?? candle.open;
    return Math.max(
      candle.high - candle.low,
      Math.abs(candle.high - previousClose),
      Math.abs(candle.low - previousClose),
    );
  }));
}

export function hashHistoricalMarketData(candles: HistoricalMarketCandle[]): string {
  const canonical = [...candles]
    .sort((left, right) => `${left.symbol}:${left.occurredAt}`.localeCompare(`${right.symbol}:${right.occurredAt}`))
    .map(candle => [candle.symbol, candle.occurredAt, candle.open, candle.high, candle.low, candle.close, candle.volume]);
  return `sha256:${createHash("sha256").update(JSON.stringify(canonical)).digest("hex")}`;
}

export function buildProbabilisticScenarios(input: {
  candles: HistoricalMarketCandle[];
  recordedAnalyses?: RecordedAnalysisInput[];
}): { scenarios: ProbabilisticScenario[]; limitations: string[]; dataHash: string } {
  const scenarios: ProbabilisticScenario[] = [];
  const bySymbol = new Map<string, HistoricalMarketCandle[]>();
  for (const candle of input.candles) {
    const collection = bySymbol.get(candle.symbol) ?? [];
    collection.push(candle);
    bySymbol.set(candle.symbol, collection);
  }

  for (const [symbol, unsorted] of bySymbol) {
    const costs = SYMBOL_COSTS[symbol];
    if (!costs) continue;
    const candles = [...unsorted].sort((left, right) => Date.parse(left.occurredAt) - Date.parse(right.occurredAt));
    for (let index = 200; index < candles.length; index += 24) {
      const history = candles.slice(0, index + 1);
      const closes = history.slice(-200).map(candle => candle.close);
      const current = history.at(-1)!;
      const currentAtr = atr(history);
      if (!(currentAtr > 0)) continue;
      const ema20 = ema(closes.slice(-80), 20);
      const ema50 = ema(closes.slice(-120), 50);
      const ema200 = ema(closes, 200);
      const direction: "BUY" | "SELL" = ema20 >= ema50 ? "BUY" : "SELL";
      const alignment = direction === "BUY"
        ? Number(ema20 > ema50) + Number(ema50 > ema200) + Number(current.close > ema20)
        : Number(ema20 < ema50) + Number(ema50 < ema200) + Number(current.close < ema20);
      const trendFactor = clamp(0.35 + alignment * 0.17, 0, 1);
      const volatilityFactor = clamp(currentAtr / Math.max(current.close * 0.012, currentAtr), 0.2, 1);
      const candleDirectionMatches = direction === "BUY" ? current.close >= current.open : current.close <= current.open;
      const contextFactor = candleDirectionMatches ? 0.62 : 0.43;
      const decisionQuality = clamp(0.45 + alignment * 0.09 + (candleDirectionMatches ? 0.05 : -0.03), 0.35, 0.82);
      const modeledProbability = clamp(0.5 + (trendFactor - 0.5) * 0.08 + (decisionQuality - 0.5) * 0.05, 0.45, 0.62);
      const riskPips = Math.max(1, currentAtr / costs.pipValue);
      const riskReward = decisionQuality >= 0.7 ? 1.6 : decisionQuality >= 0.58 ? 1.4 : 1.2;
      scenarios.push({
        scenarioId: `model-${symbol}-${current.occurredAt}`,
        occurredAt: current.occurredAt,
        symbol,
        direction,
        originalProbability: modeledProbability,
        decisionQuality,
        riskReward,
        activationProbability: clamp(0.52 + decisionQuality * 0.28 - volatilityFactor * 0.08, 0.45, 0.82),
        volatilityFactor,
        trendFactor,
        contextFactor,
        riskPips,
        spreadPips: costs.spread,
        commissionPips: costs.commission,
        slippagePips: costs.slippage,
        sourceType: "DOCUMENTED_MODEL",
      });
    }
  }

  for (const analysis of input.recordedAnalyses ?? []) {
    const costs = SYMBOL_COSTS[analysis.symbol];
    if (!costs) continue;
    scenarios.push({
      scenarioId: `analysis-${analysis.analysisId}`,
      occurredAt: analysis.occurredAt,
      symbol: analysis.symbol,
      direction: analysis.direction,
      originalProbability: clamp(analysis.probability, 0, 1),
      decisionQuality: clamp(analysis.decisionQuality, 0, 1),
      riskReward: analysis.riskReward,
      activationProbability: 0.72,
      volatilityFactor: 0.5,
      trendFactor: 0.5,
      contextFactor: 0.5,
      riskPips: analysis.riskPips,
      spreadPips: costs.spread,
      commissionPips: costs.commission,
      slippagePips: costs.slippage,
      sourceType: "RECORDED_ANALYSIS",
    });
  }

  scenarios.sort((left, right) => Date.parse(left.occurredAt) - Date.parse(right.occurredAt));
  return {
    scenarios,
    dataHash: hashHistoricalMarketData(input.candles),
    limitations: [
      "No existen probabilidades Maestro V3 archivadas para los cuatro meses completos.",
      "Los escenarios DOCUMENTED_MODEL usan un prior documentado derivado de tendencia, volatilidad y calidad; no son alertas historicas.",
      "Spread, comision y deslizamiento son supuestos conservadores versionados, no ejecuciones broker observadas.",
      "Los resultados son simulados y no corresponden a operaciones ejecutadas.",
    ],
  };
}