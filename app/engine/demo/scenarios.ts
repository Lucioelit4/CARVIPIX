/**
 * DEMO DATA
 * Análisis realista de demostración con evaluación real de consenso
 */

import { AgentScore, TradeSignal, ConsensusResult } from '../types/index';
import {
  analyzeMarketRegime,
  analyzeTrend,
  analyzeStructure,
  analyzeMomentum,
  analyzePullback,
  analyzeSession,
  analyzeNews,
  analyzeRisk,
  scoreConfidence,
  validateTrade,
  learnFromHistory,
} from '../agents/index';
import { CARVIPIXEngine } from '../core/engine';

/**
 * ESCENARIO 1: EUR/USD Setup Bullish
 * Tendencia fuerte, pullback en soporte, buen risk/reward
 */
export function generateDemoScenario1(): {
  agents: AgentScore[];
  consensus: ConsensusResult;
  signal: TradeSignal;
  reasoning: string;
} {
  const agents: AgentScore[] = [
    analyzeMarketRegime({
      symbol: 'EURUSD',
      atr: 120,
      volatility: 22,
      trend: 'strong_up',
    }),
    analyzeTrend({
      symbol: 'EURUSD',
      ema20: 1.0950,
      ema50: 1.0920,
      ema200: 1.0850,
      price: 1.0960,
      direction: 'up',
    }),
    analyzeStructure({
      symbol: 'EURUSD',
      price: 1.0960,
      resistance: 1.1020,
      support: 1.0880,
      breakout: false,
    }),
    analyzeMomentum({
      symbol: 'EURUSD',
      rsi: 45,
      macdHistogram: 0.0045,
      momentum: 'bullish',
    }),
    analyzePullback({
      symbol: 'EURUSD',
      isPullback: true,
      pullbackDepth: 15,
      pullbackNormalized: 0.75, // normalized by ATR
      trend: 'up',
      trendStrength: 85, // strong uptrend
      recoveryFromPullback: 35, // 35% recovery
    }),
    analyzeSession({
      symbol: 'EURUSD',
      currentSession: 'european',
      sessionStart: 8,
      sessionEnd: 17,
    }),
    analyzeNews({
      symbol: 'EURUSD',
      hasMajorNews: false,
      newsImpact: 'neutral',
      volatilityExpected: false,
    }),
    analyzeRisk({
      symbol: 'EURUSD',
      entryPrice: 1.0960,
      stopLossPrice: 1.0880,
      takeProfitPrice: 1.1060,
      accountRisk: 1.5,
      spreadEstimated: 1.8, // typical spread
      volatility: 85, // ATR
      currentDrawdown: 2.5, // current DD
      maxAllowedDrawdown: 20, // max allowed
    }),
    scoreConfidence({
      allAgentScores: [], // Will be populated after all agents score
      dataQuality: 'high',
      marketConditions: 'normal',
      timeframe: '1H',
    }),
    validateTrade({
      symbol: 'EURUSD',
      hasAllRequiredData: true,
      noFundamentalEvents: true,
      priceActionClean: true,
      entrySureAdjustment: 0,
    }),
    learnFromHistory({
      winRate: 62,
      totalTrades: 45,
      profitFactor: 1.8,
      recentPerformance: 'improving',
    }),
  ];

  // Evaluar consenso real
  const engine = new CARVIPIXEngine();
  const consensus = engine.evaluateConsensus(agents);

  const signal: TradeSignal = {
    id: 'SIGNAL_EURUSD_1',
    timestamp: Date.now(),
    symbol: 'EURUSD',
    type: 'compra',
    timeframe: '1H',
    entryPrice: 1.0960,
    takeProfitPrice: 1.1060,
    stopLossPrice: 1.0880,
    consensusScore: consensus.averageScore,
    confidenceScore: consensus.overallConfidence,
    riskRewardRatio: 2.0,
    primaryReason: 'Tendencia alcista fuerte, pullback en soporte, golden cross alineado, sin noticias.',
    agentContributions: agents
      .filter((a) => a.score >= 60)
      .map((a) => a.agent),
    riskWarnings: [],
    status: consensus.outcome === 'approved' ? 'approved' : 'rejected',
    approvalTimestamp:
      consensus.outcome === 'approved' ? Date.now() : undefined,
  };

  return {
    agents,
    consensus,
    signal,
    reasoning: `EUR/USD setup alcista: ${consensus.reasonForDecision}`,
  };
}

/**
 * ESCENARIO 2: GBP/USD Rechazo en Resistencia
 * Los agentes acuerdan que es demasiado riesgoso
 */
export function generateDemoScenario2(): {
  agents: AgentScore[];
  consensus: ConsensusResult;
  signal: TradeSignal;
  reasoning: string;
} {
  const agents: AgentScore[] = [
    analyzeMarketRegime({
      symbol: 'GBPUSD',
      atr: 180,
      volatility: 35,
      trend: 'neutral',
    }),
    analyzeTrend({
      symbol: 'GBPUSD',
      ema20: 1.2780,
      ema50: 1.2750,
      ema200: 1.2720,
      price: 1.2795,
      direction: 'up',
    }),
    analyzeStructure({
      symbol: 'GBPUSD',
      price: 1.2795,
      resistance: 1.2800,
      support: 1.2600,
      breakout: false,
    }),
    analyzeMomentum({
      symbol: 'GBPUSD',
      rsi: 72,
      macdHistogram: 0.0015,
      momentum: 'strong_bullish',
    }),
    analyzePullback({
      symbol: 'GBPUSD',
      isPullback: false,
      pullbackDepth: 0,
      pullbackNormalized: 0.25, // shallow
      trend: 'up',
      trendStrength: 72, // moderate trend
      recoveryFromPullback: 8, // weak recovery
    }),
    analyzeSession({
      symbol: 'GBPUSD',
      currentSession: 'us',
      sessionStart: 13,
      sessionEnd: 22,
    }),
    analyzeNews({
      symbol: 'GBPUSD',
      hasMajorNews: true,
      newsImpact: 'negative',
      volatilityExpected: true,
    }),
    analyzeRisk({
      symbol: 'GBPUSD',
      entryPrice: 1.2795,
      stopLossPrice: 1.2750,
      takeProfitPrice: 1.2850,
      accountRisk: 2.8,
      spreadEstimated: 2.2, // higher spread
      volatility: 95, // higher volatility
      currentDrawdown: 5.0, // deeper DD
      maxAllowedDrawdown: 20,
    }),
    scoreConfidence({
      allAgentScores: [],
      dataQuality: 'medium',
      marketConditions: 'unusual',
      timeframe: '45M',
    }),
    validateTrade({
      symbol: 'GBPUSD',
      hasAllRequiredData: true,
      noFundamentalEvents: false,
      priceActionClean: false,
      entrySureAdjustment: 0,
    }),
    learnFromHistory({
      winRate: 52,
      totalTrades: 28,
      profitFactor: 0.95,
      recentPerformance: 'declining',
    }),
  ];

  // Evaluar consenso real
  const engine = new CARVIPIXEngine();
  const consensus = engine.evaluateConsensus(agents);

  const signal: TradeSignal = {
    id: 'SIGNAL_GBPUSD_2',
    timestamp: Date.now(),
    symbol: 'GBPUSD',
    type: 'compra',
    timeframe: '45M',
    entryPrice: 1.2795,
    takeProfitPrice: 1.2850,
    stopLossPrice: 1.2750,
    consensusScore: consensus.averageScore,
    confidenceScore: consensus.overallConfidence,
    riskRewardRatio: 1.0,
    primaryReason: 'Precio en resistencia, señales mixtas',
    agentContributions: agents
      .filter((a) => a.score >= 60)
      .map((a) => a.agent),
    riskWarnings: [
      'RSI sobrecomprado en 72',
      'Sin pullback observado',
      'Noticias negativas esperadas',
      'Pobre R:R 1:1',
      'Condiciones de mercado inusuales',
      'Desempeño reciente declinando',
    ],
    status: consensus.outcome === 'approved' ? 'approved' : 'rejected',
  };

  return {
    agents,
    consensus,
    signal,
    reasoning: `GBP/USD rechazado: ${consensus.reasonForDecision}`,
  };
}

/**
 * ESCENARIO 3: Oro (XAUUSD) Downtrend con Breakout Limpio
 */
export function generateDemoScenario3(): {
  agents: AgentScore[];
  consensus: ConsensusResult;
  signal: TradeSignal;
  reasoning: string;
} {
  const agents: AgentScore[] = [
    analyzeMarketRegime({
      symbol: 'XAUUSD',
      atr: 25,
      volatility: 18,
      trend: 'strong_down',
    }),
    analyzeTrend({
      symbol: 'XAUUSD',
      ema20: 1975,
      ema50: 1990,
      ema200: 2010,
      price: 1968,
      direction: 'down',
    }),
    analyzeStructure({
      symbol: 'XAUUSD',
      price: 1968,
      resistance: 1985,
      support: 1950,
      breakout: true,
    }),
    analyzeMomentum({
      symbol: 'XAUUSD',
      rsi: 35,
      macdHistogram: -0.0042,
      momentum: 'bearish',
    }),
    analyzePullback({
      symbol: 'XAUUSD',
      isPullback: false,
      pullbackDepth: 0,
      pullbackNormalized: 0.0,
      trend: 'down',
      trendStrength: 68, // moderate downtrend
      recoveryFromPullback: 0,
    }),
    analyzeSession({
      symbol: 'XAUUSD',
      currentSession: 'overlap',
      sessionStart: 8,
      sessionEnd: 17,
    }),
    analyzeNews({
      symbol: 'XAUUSD',
      hasMajorNews: false,
      newsImpact: 'neutral',
      volatilityExpected: false,
    }),
    analyzeRisk({
      symbol: 'XAUUSD',
      entryPrice: 1968,
      stopLossPrice: 1985,
      takeProfitPrice: 1920,
      accountRisk: 1.2,
      spreadEstimated: 3.5, // wider spread on GOLD
      volatility: 120, // high ATR
      currentDrawdown: 8.0, // significant DD
      maxAllowedDrawdown: 20,
    }),
    scoreConfidence({
      allAgentScores: [],
      dataQuality: 'high',
      marketConditions: 'normal',
      timeframe: '5M',
    }),
    validateTrade({
      symbol: 'XAUUSD',
      hasAllRequiredData: true,
      noFundamentalEvents: true,
      priceActionClean: true,
      entrySureAdjustment: 0,
    }),
    learnFromHistory({
      winRate: 58,
      totalTrades: 52,
      profitFactor: 1.65,
      recentPerformance: 'improving',
    }),
  ];

  // Evaluar consenso real
  const engine = new CARVIPIXEngine();
  const consensus = engine.evaluateConsensus(agents);

  const signal: TradeSignal = {
    id: 'SIGNAL_XAUUSD_3',
    timestamp: Date.now(),
    symbol: 'XAUUSD',
    type: 'venta',
    timeframe: '5M',
    entryPrice: 1968,
    takeProfitPrice: 1920,
    stopLossPrice: 1985,
    consensusScore: consensus.averageScore,
    confidenceScore: consensus.overallConfidence,
    riskRewardRatio: 2.27,
    primaryReason: 'Breakout limpio bajo estructura, death cross alineado, momentum bajista.',
    agentContributions: agents
      .filter((a) => a.score >= 60)
      .map((a) => a.agent),
    riskWarnings: [],
    status: consensus.outcome === 'approved' ? 'approved' : 'rejected',
    approvalTimestamp:
      consensus.outcome === 'approved' ? Date.now() : undefined,
  };

  return {
    agents,
    consensus,
    signal,
    reasoning: `Oro setup bajista: ${consensus.reasonForDecision}`,
  };
}

/**
 * Obtener todos los escenarios de demostración
 */
export function getDemoScenarios() {
  return {
    scenario1: generateDemoScenario1(),
    scenario2: generateDemoScenario2(),
    scenario3: generateDemoScenario3(),
  };
}
