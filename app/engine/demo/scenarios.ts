/**
 * DEMO DATA
 * Realistic sample analysis for demonstration
 */

import { AgentScore, TradeSignal, TradeAlert } from '../types/index';
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

/**
 * DEMO SCENARIO 1: EUR/USD Bullish Setup
 * Strong uptrend, pullback at support, good risk/reward
 */
export function generateDemoScenario1(): {
  agents: AgentScore[];
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
      trend: 'up',
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
    }),
    scoreConfidence({
      agentAgreement: 85,
      dataQuality: 'high',
      marketConditions: 'normal',
      timeframe: '4H',
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

  const signal: TradeSignal = {
    id: 'SIGNAL_EURUSD_1',
    timestamp: Date.now(),
    symbol: 'EURUSD',
    type: 'compra',
    timeframe: '4H',
    entryPrice: 1.0960,
    takeProfitPrice: 1.1060,
    stopLossPrice: 1.0880,
    consensusScore: 82,
    confidenceScore: 85,
    riskRewardRatio: 2.0,
    primaryReason: 'Strong uptrend with pullback at support. Golden cross aligned. Good risk/reward.',
    agentContributions: [
      'MarketRegimeAnalyst',
      'TrendAnalyst',
      'StructureAnalyst',
      'MomentumAnalyst',
      'PullbackAnalyst',
      'SessionAnalyst',
      'RiskManager',
      'TradeValidator',
    ],
    riskWarnings: [],
    status: 'approved',
    approvalTimestamp: Date.now(),
  };

  return {
    agents,
    signal,
    reasoning: `EURUSD bullish setup: Strong uptrend (EMA20 > 50 > 200), pullback 15% at support (1.0880), 
    momentum bullish with RSI 45, no major news, excellent R:R 2.0:1. 8/11 agents approve strongly. 
    Ready for entry.`,
  };
}

/**
 * DEMO SCENARIO 2: GBP/USD Rejection at Resistance
 * Agents agree this is too risky
 */
export function generateDemoScenario2(): {
  agents: AgentScore[];
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
      trend: 'up',
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
    }),
    scoreConfidence({
      agentAgreement: 45,
      dataQuality: 'medium',
      marketConditions: 'unusual',
      timeframe: '1H',
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

  const signal: TradeSignal = {
    id: 'SIGNAL_GBPUSD_2',
    timestamp: Date.now(),
    symbol: 'GBPUSD',
    type: 'compra',
    timeframe: '1H',
    entryPrice: 1.2795,
    takeProfitPrice: 1.2850,
    stopLossPrice: 1.2750,
    consensusScore: 48,
    confidenceScore: 38,
    riskRewardRatio: 1.0,
    primaryReason: 'Price at resistance, mixed signals',
    agentContributions: [],
    riskWarnings: [
      'RSI overbought at 72',
      'No pullback observed',
      'Major news volatility expected',
      'Poor risk/reward 1:1',
      'Market conditions unusual',
      'Recent performance declining',
    ],
    status: 'rejected',
  };

  return {
    agents,
    signal,
    reasoning: `GBPUSD rejected: Overbought RSI 72, at resistance (1.2800) with no pullback, 
    negative news causing volatility, poor R:R 1:1, recent declining performance. Only 2/11 agents approve. 
    Insufficient consensus. Skip this trade.`,
  };
}

/**
 * DEMO SCENARIO 3: Gold Downtrend with Clean Break
 */
export function generateDemoScenario3(): {
  agents: AgentScore[];
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
      trend: 'down',
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
    }),
    scoreConfidence({
      agentAgreement: 80,
      dataQuality: 'high',
      marketConditions: 'normal',
      timeframe: 'D',
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

  const signal: TradeSignal = {
    id: 'SIGNAL_XAUUSD_3',
    timestamp: Date.now(),
    symbol: 'XAUUSD',
    type: 'venta',
    timeframe: 'D',
    entryPrice: 1968,
    takeProfitPrice: 1920,
    stopLossPrice: 1985,
    consensusScore: 80,
    confidenceScore: 82,
    riskRewardRatio: 2.27,
    primaryReason: 'Clean breakout below structure. Death cross aligned. Bearish momentum.',
    agentContributions: [
      'MarketRegimeAnalyst',
      'TrendAnalyst',
      'StructureAnalyst',
      'MomentumAnalyst',
      'SessionAnalyst',
      'RiskManager',
      'TradeValidator',
      'LearningEngine',
    ],
    riskWarnings: [],
    status: 'approved',
    approvalTimestamp: Date.now(),
  };

  return {
    agents,
    signal,
    reasoning: `XAUUSD short setup: Strong downtrend confirmed (EMA20 < 50 < 200), clean breakout below 1985, 
    death cross aligned, bearish momentum RSI 35, session overlap (high liquidity), excellent R:R 2.27:1. 
    9/11 agents approve. Ready for entry.`,
  };
}

/**
 * DEMO ALERT: Active alert from approved signal
 */
export function generateDemoAlert(signal: TradeSignal): TradeAlert {
  return {
    id: `ALERT_${signal.symbol}_${Date.now()}`,
    symbol: signal.symbol,
    type: signal.type,
    state: 'activa',
    entryPrice: signal.entryPrice,
    takeProfitPrice: signal.takeProfitPrice,
    stopLossPrice: signal.stopLossPrice,
    timeframe: signal.timeframe,
    riskRewardRatio: signal.riskRewardRatio,
    consensusResult: {
      outcome: 'approved',
      agentScores: [],
      approvalCount: 9,
      rejectionCount: 0,
      consensusThreshold: 9,
      averageScore: 81,
      overallConfidence: 83,
      reasonForDecision: signal.primaryReason,
      timestamp: Date.now(),
    },
    createdAt: Date.now(),
    reasoning: signal.primaryReason,
    tags: ['demo', 'engine-generated', ...signal.agentContributions],
    source: 'engine',
  };
}

/**
 * Get all demo scenarios
 */
export function getDemoScenarios() {
  return {
    scenario1: generateDemoScenario1(),
    scenario2: generateDemoScenario2(),
    scenario3: generateDemoScenario3(),
  };
}
