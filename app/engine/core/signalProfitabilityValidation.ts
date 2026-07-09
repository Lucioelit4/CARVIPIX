import {
  SignalGenerationEngine,
  type GeneratedSignal,
  type SignalGenerationInput,
  type SignalDecision,
  type StrategyGrade,
} from "./signalGenerationEngine";
import type { MarketType, NewsImpact, TradingSession } from "./tradingKnowledgeBase";

export type ValidationMode = "signal_engine" | "simple_engine" | "random" | "no_trade";

export type ValidationSymbol = "XAUUSD" | "BTCUSD" | "EURUSD" | "GBPUSD" | "USDJPY";

export type ForwardCandle = {
  timestamp: number;
  high: number;
  low: number;
  close: number;
};

export type SignalValidationSample = {
  id: string;
  symbol: ValidationSymbol;
  timestamp: number;
  input: SignalGenerationInput;
  forwardCandles: ForwardCandle[];
};

export type SignalExecutionResult = {
  sampleId: string;
  symbol: ValidationSymbol;
  timestamp: number;
  session: TradingSession;
  spreadPips: number;
  newsImpact: NewsImpact;
  marketType: MarketType;
  decision: SignalDecision;
  classification: StrategyGrade;
  entry: number | null;
  sl: number | null;
  tp: number | null;
  expectedDurationMinutes: number | null;
  realizedDurationMinutes: number;
  outcome: "TP" | "SL" | "TIMEOUT" | "NO_EXECUTION";
  realizedPnL: number;
  realizedRR: number;
  blockedBy: string[];
};

export type ProfitabilityMetrics = {
  signalsEvaluated: number;
  executedSignals: number;
  winRate: number;
  profitFactor: number;
  expectancy: number;
  drawdown: number;
  averageRR: number;
  maxConsecutiveLosses: number;
  grossProfit: number;
  grossLoss: number;
  netProfit: number;
};

export type ProfitabilitySummary = {
  mode: ValidationMode;
  metrics: ProfitabilityMetrics;
  byPair: Record<string, ProfitabilityMetrics>;
  bySession: Record<string, ProfitabilityMetrics>;
  bySignalType: Record<SignalDecision, ProfitabilityMetrics>;
  byClassification: Record<StrategyGrade, ProfitabilityMetrics>;
  reportByGrade: {
    APlus: ProfitabilityMetrics;
    A: ProfitabilityMetrics;
    B: ProfitabilityMetrics;
  };
  executions: SignalExecutionResult[];
};

export type SignalProfitabilityReport = {
  generatedAt: number;
  historicalWindow: {
    start: number;
    end: number;
    samples: number;
  };
  forwardWindow: {
    start: number;
    end: number;
    samples: number;
  };
  primary: ProfitabilitySummary;
  baselines: {
    noTrade: ProfitabilitySummary;
    random: ProfitabilitySummary;
    simpleEngine: ProfitabilitySummary;
  };
  profitable: boolean;
  approvedPairs: ValidationSymbol[];
  conditionsWhereItWorks: string[];
  conditionsWhereItFails: string[];
  signalsToBlock: string[];
  minimumChangeRecommendations: string[];
};

const EMPTY_METRICS: ProfitabilityMetrics = {
  signalsEvaluated: 0,
  executedSignals: 0,
  winRate: 0,
  profitFactor: 0,
  expectancy: 0,
  drawdown: 0,
  averageRR: 0,
  maxConsecutiveLosses: 0,
  grossProfit: 0,
  grossLoss: 0,
  netProfit: 0,
};

export function runSignalProfitabilityValidation(
  samples: SignalValidationSample[] = createDefaultSignalValidationDataset(),
): SignalProfitabilityReport {
  if (samples.length === 0) {
    throw new Error("Signal profitability validation requires at least one sample.");
  }

  const ordered = [...samples].sort((a, b) => a.timestamp - b.timestamp);
  const splitIndex = Math.max(1, Math.floor(ordered.length * 0.7));
  const historicalSamples = ordered.slice(0, splitIndex);
  const forwardSamples = ordered.slice(splitIndex);

  const primary = runValidationMode(forwardSamples, "signal_engine");
  const noTrade = runValidationMode(forwardSamples, "no_trade");
  const random = runValidationMode(forwardSamples, "random");
  const simpleEngine = runValidationMode(forwardSamples, "simple_engine");

  const profitable =
    primary.metrics.netProfit > noTrade.metrics.netProfit &&
    primary.metrics.netProfit > random.metrics.netProfit &&
    primary.metrics.netProfit > simpleEngine.metrics.netProfit &&
    primary.metrics.profitFactor > 1 &&
    primary.metrics.expectancy > 0;

  const approvedPairs = extractApprovedPairs(primary.byPair);

  return {
    generatedAt: Date.now(),
    historicalWindow: {
      start: historicalSamples[0].timestamp,
      end: historicalSamples[historicalSamples.length - 1].timestamp,
      samples: historicalSamples.length,
    },
    forwardWindow: {
      start: forwardSamples[0].timestamp,
      end: forwardSamples[forwardSamples.length - 1].timestamp,
      samples: forwardSamples.length,
    },
    primary,
    baselines: {
      noTrade,
      random,
      simpleEngine,
    },
    profitable,
    approvedPairs,
    conditionsWhereItWorks: derivePositiveConditions(primary),
    conditionsWhereItFails: deriveFailingConditions(primary),
    signalsToBlock: deriveSignalsToBlock(primary),
    minimumChangeRecommendations: buildMinimumRecommendations(primary),
  };
}

function runValidationMode(samples: SignalValidationSample[], mode: ValidationMode): ProfitabilitySummary {
  const signalEngine = new SignalGenerationEngine();
  const random = createDeterministicRandom(42);

  const executions = samples.map((sample) => {
    const generated = generateForMode(sample, mode, signalEngine, random);
    return simulateExecution(sample, generated);
  });

  return {
    mode,
    metrics: aggregateMetrics(executions),
    byPair: aggregateBy(executions, (item) => item.symbol),
    bySession: aggregateBy(executions, (item) => item.session),
    bySignalType: {
      BUY: aggregateMetrics(executions.filter((item) => item.decision === "BUY")),
      SELL: aggregateMetrics(executions.filter((item) => item.decision === "SELL")),
      WAIT: aggregateMetrics(executions.filter((item) => item.decision === "WAIT")),
      NO_TRADE: aggregateMetrics(executions.filter((item) => item.decision === "NO_TRADE")),
    },
    byClassification: {
      "A+": aggregateMetrics(executions.filter((item) => item.classification === "A+")),
      A: aggregateMetrics(executions.filter((item) => item.classification === "A")),
      B: aggregateMetrics(executions.filter((item) => item.classification === "B")),
      C: aggregateMetrics(executions.filter((item) => item.classification === "C")),
    },
    reportByGrade: {
      APlus: aggregateMetrics(executions.filter((item) => item.classification === "A+")),
      A: aggregateMetrics(executions.filter((item) => item.classification === "A")),
      B: aggregateMetrics(executions.filter((item) => item.classification === "B")),
    },
    executions,
  };
}

function generateForMode(
  sample: SignalValidationSample,
  mode: ValidationMode,
  engine: SignalGenerationEngine,
  random: () => number,
): GeneratedSignal {
  if (mode === "signal_engine") {
    return engine.generate(sample.input);
  }

  if (mode === "no_trade") {
    return {
      decision: "NO_TRADE",
      symbol: sample.symbol,
      temporalidad: { contexto: "1H", estructura: "45M", entrada: "5M" },
      entry: null,
      sl: null,
      tp: null,
      operationType: null,
      expectedDurationMinutes: null,
      confidence: 0,
      risk: "high",
      reason: "Baseline no-trade.",
      invalidation: "No entry.",
      classification: "C",
      blockedBy: ["off_session"],
    };
  }

  if (mode === "random") {
    const pick = random();
    const decision: SignalDecision = pick < 0.25 ? "BUY" : pick < 0.5 ? "SELL" : pick < 0.75 ? "WAIT" : "NO_TRADE";
    if (decision === "BUY" || decision === "SELL") {
      const entry = sample.input.entry5M.price;
      const slDistance = Math.max(sample.input.atrPips, 8) * resolvePipSize(sample.symbol);
      const tpDistance = slDistance * (0.8 + random());
      const sl = decision === "BUY" ? entry - slDistance : entry + slDistance;
      const tp = decision === "BUY" ? entry + tpDistance : entry - tpDistance;
      return {
        decision,
        symbol: sample.symbol,
        temporalidad: { contexto: "1H", estructura: "45M", entrada: "5M" },
        entry,
        sl,
        tp,
        operationType: "trend_continuation",
        expectedDurationMinutes: 120,
        confidence: 50,
        risk: "high",
        reason: "Random baseline.",
        invalidation: "Random baseline invalidation.",
        classification: "B",
        blockedBy: [],
      };
    }

    return {
      decision,
      symbol: sample.symbol,
      temporalidad: { contexto: "1H", estructura: "45M", entrada: "5M" },
      entry: null,
      sl: null,
      tp: null,
      operationType: null,
      expectedDurationMinutes: null,
      confidence: 0,
      risk: "high",
      reason: "Random baseline no execution.",
      invalidation: "N/A",
      classification: "C",
      blockedBy: [],
    };
  }

  const trendBullish = sample.input.context1H.ema20 > sample.input.context1H.ema50;
  const trendBearish = sample.input.context1H.ema20 < sample.input.context1H.ema50;

  if (!trendBullish && !trendBearish) {
    return {
      decision: "WAIT",
      symbol: sample.symbol,
      temporalidad: { contexto: "1H", estructura: "45M", entrada: "5M" },
      entry: null,
      sl: null,
      tp: null,
      operationType: null,
      expectedDurationMinutes: null,
      confidence: 35,
      risk: "high",
      reason: "Simple engine neutral trend.",
      invalidation: "N/A",
      classification: "C",
      blockedBy: [],
    };
  }

  const decision: SignalDecision = trendBullish ? "BUY" : "SELL";
  const entry = sample.input.entry5M.price;
  const slDistance = Math.max(sample.input.atrPips * 1.4, 10) * resolvePipSize(sample.symbol);
  const tpDistance = slDistance * 1.2;

  return {
    decision,
    symbol: sample.symbol,
    temporalidad: { contexto: "1H", estructura: "45M", entrada: "5M" },
    entry,
    sl: decision === "BUY" ? entry - slDistance : entry + slDistance,
    tp: decision === "BUY" ? entry + tpDistance : entry - tpDistance,
    operationType: "trend_continuation",
    expectedDurationMinutes: 180,
    confidence: 60,
    risk: "medium",
    reason: "Simple engine EMA20/EMA50 trend.",
    invalidation: "1H EMA20/EMA50 inversion.",
    classification: "B",
    blockedBy: [],
  };
}

function simulateExecution(sample: SignalValidationSample, signal: GeneratedSignal): SignalExecutionResult {
  const isExecutable =
    (signal.decision === "BUY" || signal.decision === "SELL") &&
    signal.entry !== null &&
    signal.sl !== null &&
    signal.tp !== null;

  if (!isExecutable) {
    return {
      sampleId: sample.id,
      symbol: sample.symbol,
      timestamp: sample.timestamp,
      session: sample.input.session,
      spreadPips: sample.input.spreadPips,
      newsImpact: sample.input.newsImpact,
      marketType: sample.input.marketType,
      decision: signal.decision,
      classification: signal.classification,
      entry: null,
      sl: null,
      tp: null,
      expectedDurationMinutes: signal.expectedDurationMinutes,
      realizedDurationMinutes: 0,
      outcome: "NO_EXECUTION",
      realizedPnL: 0,
      realizedRR: 0,
      blockedBy: signal.blockedBy,
    };
  }

  const entry = signal.entry;
  const sl = signal.sl;
  const tp = signal.tp;
  if (entry === null || sl === null || tp === null) {
    throw new Error("Executable signal must include entry, sl and tp levels.");
  }
  const barsLimit = Math.max(1, Math.floor((signal.expectedDurationMinutes ?? 120) / 5));
  const selectedBars = sample.forwardCandles.slice(0, barsLimit);

  let closePrice = selectedBars[selectedBars.length - 1]?.close ?? entry;
  let outcome: "TP" | "SL" | "TIMEOUT" = "TIMEOUT";
  let realizedDurationMinutes = selectedBars.length * 5;

  for (let i = 0; i < selectedBars.length; i++) {
    const candle = selectedBars[i];
    const hitSL = signal.decision === "BUY" ? candle.low <= sl : candle.high >= sl;
    const hitTP = signal.decision === "BUY" ? candle.high >= tp : candle.low <= tp;

    if (hitSL && hitTP) {
      outcome = "SL";
      closePrice = sl;
      realizedDurationMinutes = (i + 1) * 5;
      break;
    }

    if (hitSL) {
      outcome = "SL";
      closePrice = sl;
      realizedDurationMinutes = (i + 1) * 5;
      break;
    }

    if (hitTP) {
      outcome = "TP";
      closePrice = tp;
      realizedDurationMinutes = (i + 1) * 5;
      break;
    }

    closePrice = candle.close;
  }

  const pnl = signal.decision === "BUY" ? closePrice - entry : entry - closePrice;
  const riskDistance = Math.abs(entry - sl);
  const rr = riskDistance > 0 ? pnl / riskDistance : 0;

  return {
    sampleId: sample.id,
    symbol: sample.symbol,
    timestamp: sample.timestamp,
    session: sample.input.session,
    spreadPips: sample.input.spreadPips,
    newsImpact: sample.input.newsImpact,
    marketType: sample.input.marketType,
    decision: signal.decision,
    classification: signal.classification,
    entry,
    sl,
    tp,
    expectedDurationMinutes: signal.expectedDurationMinutes,
    realizedDurationMinutes,
    outcome,
    realizedPnL: Number(pnl.toFixed(6)),
    realizedRR: Number(rr.toFixed(4)),
    blockedBy: signal.blockedBy,
  };
}

function aggregateMetrics(executions: SignalExecutionResult[]): ProfitabilityMetrics {
  if (executions.length === 0) {
    return { ...EMPTY_METRICS };
  }

  const executed = executions.filter((item) => item.outcome !== "NO_EXECUTION");
  if (executed.length === 0) {
    return {
      ...EMPTY_METRICS,
      signalsEvaluated: executions.length,
    };
  }

  let grossProfit = 0;
  let grossLoss = 0;
  let wins = 0;
  let consecutiveLosses = 0;
  let maxConsecutiveLosses = 0;
  let equity = 0;
  let peak = 0;
  let maxDrawdown = 0;

  for (const item of executed) {
    const pnl = item.realizedPnL;
    if (pnl > 0) {
      wins += 1;
      grossProfit += pnl;
      consecutiveLosses = 0;
    } else if (pnl < 0) {
      grossLoss += Math.abs(pnl);
      consecutiveLosses += 1;
      if (consecutiveLosses > maxConsecutiveLosses) {
        maxConsecutiveLosses = consecutiveLosses;
      }
    }

    equity += pnl;
    if (equity > peak) {
      peak = equity;
    }
    const drawdown = peak - equity;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
  }

  const netProfit = grossProfit - grossLoss;
  const averageRR = executed.reduce((acc, item) => acc + item.realizedRR, 0) / executed.length;

  return {
    signalsEvaluated: executions.length,
    executedSignals: executed.length,
    winRate: Number(((wins / executed.length) * 100).toFixed(2)),
    profitFactor: Number((grossLoss === 0 ? grossProfit : grossProfit / grossLoss).toFixed(4)),
    expectancy: Number((netProfit / executed.length).toFixed(6)),
    drawdown: Number(maxDrawdown.toFixed(6)),
    averageRR: Number(averageRR.toFixed(4)),
    maxConsecutiveLosses,
    grossProfit: Number(grossProfit.toFixed(6)),
    grossLoss: Number(grossLoss.toFixed(6)),
    netProfit: Number(netProfit.toFixed(6)),
  };
}

function aggregateBy(
  executions: SignalExecutionResult[],
  keyResolver: (execution: SignalExecutionResult) => string,
): Record<string, ProfitabilityMetrics> {
  const grouped = new Map<string, SignalExecutionResult[]>();
  for (const execution of executions) {
    const key = keyResolver(execution);
    const bucket = grouped.get(key) ?? [];
    bucket.push(execution);
    grouped.set(key, bucket);
  }

  const result: Record<string, ProfitabilityMetrics> = {};
  for (const [key, bucket] of grouped.entries()) {
    result[key] = aggregateMetrics(bucket);
  }

  return result;
}

function extractApprovedPairs(byPair: Record<string, ProfitabilityMetrics>): ValidationSymbol[] {
  const approved: ValidationSymbol[] = [];
  for (const pair of ["XAUUSD", "BTCUSD", "EURUSD", "GBPUSD", "USDJPY"] as const) {
    const pairMetrics = byPair[pair];
    if (!pairMetrics) {
      continue;
    }
    if (pairMetrics.profitFactor >= 1.1 && pairMetrics.expectancy > 0 && pairMetrics.winRate >= 50) {
      approved.push(pair);
    }
  }
  return approved;
}

function derivePositiveConditions(summary: ProfitabilitySummary): string[] {
  const conditions: string[] = [];
  if (summary.bySession.overlap?.profitFactor > 1) {
    conditions.push("Sesion overlap con profit factor > 1.");
  }
  if (summary.byClassification["A+"]?.expectancy > 0) {
    conditions.push("Clasificacion A+ con expectancy positiva.");
  }
  if (summary.byClassification.A?.expectancy > 0) {
    conditions.push("Clasificacion A con expectancy positiva.");
  }
  if (summary.bySignalType.BUY?.profitFactor > 1) {
    conditions.push("Señales BUY con ventaja estadistica.");
  }
  if (summary.bySignalType.SELL?.profitFactor > 1) {
    conditions.push("Señales SELL con ventaja estadistica.");
  }
  return conditions;
}

function deriveFailingConditions(summary: ProfitabilitySummary): string[] {
  const fails: string[] = [];
  if (summary.bySession.off_session?.netProfit < 0) {
    fails.push("Off session presenta neto negativo.");
  }
  if (summary.byClassification.B?.profitFactor < 1) {
    fails.push("Clasificacion B no supera profit factor 1.");
  }
  if (summary.byClassification.C?.expectancy < 0) {
    fails.push("Clasificacion C destruye expectancy.");
  }
  const highSpreadLoss = summary.executions
    .filter((item) => item.spreadPips > 3 && item.realizedPnL < 0)
    .length;
  if (highSpreadLoss > 0) {
    fails.push("Spread alto asociado a resultados negativos.");
  }
  const highNewsLoss = summary.executions
    .filter((item) => item.newsImpact === "high" && item.realizedPnL < 0)
    .length;
  if (highNewsLoss > 0) {
    fails.push("Noticias de alto impacto aumentan pérdidas.");
  }
  return fails;
}

function deriveSignalsToBlock(summary: ProfitabilitySummary): string[] {
  const toBlock = new Set<string>();
  const executions = summary.executions;

  const bClass = summary.byClassification.B;
  if (bClass && bClass.expectancy < 0) {
    toBlock.add("Bloquear clasificacion B en off_session o spread > 2.5.");
  }

  for (const execution of executions) {
    if (execution.newsImpact === "high") {
      toBlock.add("Bloquear cualquier señal con newsImpact=high.");
    }
    if (execution.spreadPips > 3) {
      toBlock.add("Bloquear señales con spreadPips > 3.");
    }
    if (execution.session === "off_session" && execution.outcome === "SL") {
      toBlock.add("Bloquear señales en off_session.");
    }
  }

  return Array.from(toBlock);
}

function buildMinimumRecommendations(summary: ProfitabilitySummary): string[] {
  const recommendations: string[] = [];
  if (summary.metrics.maxConsecutiveLosses >= 4) {
    recommendations.push("Agregar cooldown de 2 señales tras 3 pérdidas consecutivas.");
  }
  if ((summary.byClassification.B?.profitFactor ?? 0) < 1) {
    recommendations.push("Elevar umbral mínimo para ejecutar de B a A en sesiones fuera de overlap.");
  }
  if ((summary.bySession.new_york?.drawdown ?? 0) > (summary.bySession.overlap?.drawdown ?? 0)) {
    recommendations.push("Reducir exposición en New York cuando volatilidadIndex > 70.");
  }
  if (recommendations.length === 0) {
    recommendations.push("Sin cambios estructurales: mantener estrategia y monitorear semanalmente.");
  }
  return recommendations;
}

function createDeterministicRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function resolvePipSize(symbol: ValidationSymbol): number {
  if (symbol === "XAUUSD") {
    return 0.1;
  }
  if (symbol === "BTCUSD") {
    return 1;
  }
  if (symbol === "USDJPY") {
    return 0.01;
  }
  return 0.0001;
}

function createDefaultSignalValidationDataset(): SignalValidationSample[] {
  const sessions: TradingSession[] = ["overlap", "london", "new_york", "asian", "off_session"];
  const symbols: ValidationSymbol[] = ["XAUUSD", "BTCUSD", "EURUSD", "GBPUSD", "USDJPY"];
  const baseTimestamp = Date.UTC(2025, 0, 1, 0, 0, 0, 0);
  const samples: SignalValidationSample[] = [];

  let index = 0;
  const prices: Record<ValidationSymbol, number> = {
    XAUUSD: 2050,
    BTCUSD: 42000,
    EURUSD: 1.09,
    GBPUSD: 1.27,
    USDJPY: 156,
  };

  for (let i = 0; i < 120; i++) {
    for (const symbol of symbols) {
      const session = sessions[i % sessions.length];
      const isBullish = i % 2 === 0;
      const scenario = i % 12;

      const marketType: MarketType =
        scenario === 3
          ? "range"
          : scenario === 6
            ? "volatile_breakout"
            : scenario === 9
              ? "low_liquidity"
              : isBullish
                ? "trend_bullish"
                : "trend_bearish";

      const spreadPips = scenario === 7 ? 4.2 : scenario === 10 ? 2.8 : 1.2;
      const newsImpact: NewsImpact = scenario === 8 ? "high" : scenario === 5 ? "medium" : "none";
      const lowLiquidity = session === "off_session" || scenario === 9;
      const volatilityIndex = scenario === 6 ? 74 : scenario === 11 ? 88 : 56;
      const falseBreakoutRisk = scenario === 4 ? 0.75 : 0.2;
      const atrPips =
        symbol === "XAUUSD"
          ? 22
          : symbol === "BTCUSD"
            ? 110
            : symbol === "USDJPY"
              ? 18
              : 12;
      const pip = resolvePipSize(symbol);

      const drift = (isBullish ? 1 : -1) * atrPips * pip * 0.45;
      const entryPrice = prices[symbol] + drift;
      prices[symbol] = entryPrice;

      const context1H = {
        price: entryPrice,
        ema20: isBullish ? entryPrice - atrPips * pip * 0.2 : entryPrice + atrPips * pip * 0.2,
        ema50: isBullish ? entryPrice - atrPips * pip * 0.45 : entryPrice + atrPips * pip * 0.45,
        ema200: isBullish ? entryPrice - atrPips * pip * 0.8 : entryPrice + atrPips * pip * 0.8,
      };

      const bias: "bullish" | "bearish" | "neutral" = scenario === 3 ? "neutral" : isBullish ? "bullish" : "bearish";

      const structure45M = {
        ema20: isBullish ? entryPrice - atrPips * pip * 0.15 : entryPrice + atrPips * pip * 0.15,
        ema50: isBullish ? entryPrice - atrPips * pip * 0.35 : entryPrice + atrPips * pip * 0.35,
        ema200: isBullish ? entryPrice - atrPips * pip * 0.7 : entryPrice + atrPips * pip * 0.7,
        bias,
        falseBreakoutDetected: scenario === 4,
      };

      const entry5M = {
        price: entryPrice,
        ema20: isBullish ? entryPrice - atrPips * pip * 0.08 : entryPrice + atrPips * pip * 0.08,
        ema50: isBullish ? entryPrice - atrPips * pip * 0.2 : entryPrice + atrPips * pip * 0.2,
        ema200: isBullish ? entryPrice - atrPips * pip * 0.6 : entryPrice + atrPips * pip * 0.6,
        pullbackValid: scenario !== 2 && scenario !== 3,
        breakoutValid: scenario !== 1,
      };

      const input: SignalGenerationInput = {
        symbol,
        marketType,
        session,
        newsImpact,
        spreadPips,
        lowLiquidity,
        volatilityIndex,
        falseBreakoutRisk,
        atrPips,
        context1H,
        structure45M,
        entry5M,
      };

      const forwardCandles = buildForwardPath(entryPrice, atrPips, pip, isBullish, scenario, i, baseTimestamp + index * 300000);

      samples.push({
        id: `${symbol}-${index}`,
        symbol,
        timestamp: baseTimestamp + index * 300000,
        input,
        forwardCandles,
      });

      index += 1;
    }
  }

  return samples;
}

function buildForwardPath(
  entry: number,
  atrPips: number,
  pip: number,
  bullishContext: boolean,
  scenario: number,
  iteration: number,
  startTimestamp: number,
): ForwardCandle[] {
  const candles: ForwardCandle[] = [];
  const trendDirection = bullishContext ? 1 : -1;
  const tpBiased = scenario === 0 || scenario === 5 || scenario === 10;
  const slBiased = scenario === 2 || scenario === 11;

  let lastClose = entry;
  for (let i = 0; i < 40; i++) {
    const wave = Math.sin((iteration + i) * 0.35) * atrPips * pip * 0.08;
    const drift = tpBiased
      ? trendDirection * atrPips * pip * 0.1
      : slBiased
        ? -trendDirection * atrPips * pip * 0.1
        : trendDirection * atrPips * pip * 0.02;

    const close = lastClose + drift + wave;
    const high = Math.max(lastClose, close) + atrPips * pip * 0.12;
    const low = Math.min(lastClose, close) - atrPips * pip * 0.12;

    candles.push({
      timestamp: startTimestamp + (i + 1) * 300000,
      high,
      low,
      close,
    });

    lastClose = close;
  }

  return candles;
}
