/**
 * AGENT IMPLEMENTATIONS
 * 11 specialized analysis agents for trading decisions
 * Each agent: evaluates market data → returns score (0-100) + reasoning
 */

import { AgentScore, AgentType } from '../types/index';

/**
 * Market Regime Analyst
 * Evaluates overall market conditions: trending vs ranging
 */
export function analyzeMarketRegime(params: {
  symbol: string;
  atr: number;
  volatility: number;
  trend: 'strong_up' | 'strong_down' | 'neutral' | 'choppy';
}): AgentScore {
  let score = 50; // Neutral start
  const keyMetrics: Record<string, any> = {
    volatility: params.volatility,
    trend: params.trend,
  };

  // Trending markets are better for trading
  if (params.trend === 'strong_up' || params.trend === 'strong_down') {
    score += 25;
    keyMetrics.verdict = 'Strong trending - favorable conditions';
  } else if (params.trend === 'neutral') {
    score += 10;
    keyMetrics.verdict = 'Neutral trend - moderate conditions';
  } else {
    score -= 20;
    keyMetrics.verdict = 'Choppy regime - risky';
  }

  // Volatility evaluation
  if (params.volatility < 30) {
    score += 5;
  } else if (params.volatility > 50) {
    score -= 10;
  }

  return {
    agent: 'MarketRegimeAnalyst',
    score: Math.max(0, Math.min(100, score)),
    reasoning: `Market in ${params.trend} regime with ${params.volatility.toFixed(
      1
    )}% volatility. ${keyMetrics.verdict}`,
    confidence: params.trend !== 'choppy' ? 80 : 40,
    keyMetrics,
    timestamp: Date.now(),
  };
}

/**
 * Trend Analyst
 * Analyzes price trend direction and strength
 */
export function analyzeTrend(params: {
  symbol: string;
  ema20: number;
  ema50: number;
  ema200: number;
  price: number;
  direction: 'up' | 'down';
}): AgentScore {
  let score = 50;
  const keyMetrics: Record<string, any> = {
    price: params.price,
    ema20: params.ema20,
    ema50: params.ema50,
  };

  // Golden cross (20 > 50 > 200) or Death cross
  if (
    params.direction === 'up' &&
    params.ema20 > params.ema50 &&
    params.ema50 > params.ema200
  ) {
    score = 85;
    keyMetrics.verdict = 'Strong uptrend - golden cross aligned';
  } else if (
    params.direction === 'down' &&
    params.ema20 < params.ema50 &&
    params.ema50 < params.ema200
  ) {
    score = 85;
    keyMetrics.verdict = 'Strong downtrend - death cross aligned';
  } else if (params.direction === 'up') {
    score = 65;
    keyMetrics.verdict = 'Uptrend present';
  } else {
    score = 65;
    keyMetrics.verdict = 'Downtrend present';
  }

  // Price above/below key EMAs
  if (params.direction === 'up' && params.price > params.ema50) {
    score += 5;
  } else if (params.direction === 'down' && params.price < params.ema50) {
    score += 5;
  } else if (params.direction === 'up' && params.price < params.ema50) {
    score -= 10;
  } else if (params.direction === 'down' && params.price > params.ema50) {
    score -= 10;
  }

  return {
    agent: 'TrendAnalyst',
    score: Math.max(0, Math.min(100, score)),
    reasoning: `${params.direction} trend detected. ${keyMetrics.verdict}. Price ${
      params.price > params.ema50 ? 'above' : 'below'
    } 50 EMA.`,
    confidence: 85,
    keyMetrics,
    timestamp: Date.now(),
  };
}

/**
 * Structure Analyst
 * Analyzes support/resistance, highs/lows
 */
export function analyzeStructure(params: {
  symbol: string;
  price: number;
  resistance: number;
  support: number;
  breakout: boolean;
}): AgentScore {
  let score = 50;
  const keyMetrics: Record<string, any> = {
    price: params.price,
    resistance: params.resistance,
    support: params.support,
  };

  // Price near support/resistance
  const distToResistance = ((params.resistance - params.price) / params.price) * 100;
  const distToSupport = ((params.price - params.support) / params.price) * 100;

  if (params.breakout) {
    score = 80;
    keyMetrics.verdict = 'Breakout structure confirmed';
  } else if (distToResistance < 2) {
    score = 75;
    keyMetrics.verdict = 'Price near resistance - potential breakout';
  } else if (distToSupport < 2) {
    score = 75;
    keyMetrics.verdict = 'Price near support - potential bounce';
  } else {
    score = 55;
    keyMetrics.verdict = 'Normal range structure';
  }

  return {
    agent: 'StructureAnalyst',
    score: Math.max(0, Math.min(100, score)),
    reasoning: `Structure: S/${params.support} - P/${params.price} - R/${params.resistance}. ${keyMetrics.verdict}`,
    confidence: 75,
    keyMetrics,
    timestamp: Date.now(),
  };
}

/**
 * Momentum Analyst
 * Analyzes RSI, MACD, momentum indicators
 */
export function analyzeMomentum(params: {
  symbol: string;
  rsi: number;
  macdHistogram: number;
  momentum: 'strong_bullish' | 'bullish' | 'neutral' | 'bearish' | 'strong_bearish';
}): AgentScore {
  let score = 50;
  const keyMetrics: Record<string, any> = {
    rsi: params.rsi,
    macdHistogram: params.macdHistogram,
    momentum: params.momentum,
  };

  // RSI levels
  if (params.rsi < 30) {
    score += 10; // Oversold
    keyMetrics.rsiStatus = 'Oversold';
  } else if (params.rsi > 70) {
    score -= 10; // Overbought
    keyMetrics.rsiStatus = 'Overbought';
  } else if (params.rsi < 50) {
    score += 5;
    keyMetrics.rsiStatus = 'Bearish zone';
  } else {
    score += 5;
    keyMetrics.rsiStatus = 'Bullish zone';
  }

  // Momentum
  switch (params.momentum) {
    case 'strong_bullish':
      score += 20;
      break;
    case 'bullish':
      score += 10;
      break;
    case 'strong_bearish':
      score -= 20;
      break;
    case 'bearish':
      score -= 10;
      break;
  }

  // MACD
  if (
    (params.momentum.includes('bullish') && params.macdHistogram > 0) ||
    (params.momentum.includes('bearish') && params.macdHistogram < 0)
  ) {
    score += 10;
    keyMetrics.macdAlign = 'MACD aligned with momentum';
  }

  return {
    agent: 'MomentumAnalyst',
    score: Math.max(0, Math.min(100, score)),
    reasoning: `${params.momentum} momentum. RSI: ${params.rsi.toFixed(
      1
    )}. ${keyMetrics.rsiStatus}. MACD Histogram: ${params.macdHistogram.toFixed(
      3
    )}.`,
    confidence: 80,
    keyMetrics,
    timestamp: Date.now(),
  };
}

/**
 * Pullback Analyst
 * Analyzes pullback opportunities
 */
export function analyzePullback(params: {
  symbol: string;
  isPullback: boolean;
  pullbackDepth: number; // percentage
  trend: 'up' | 'down';
}): AgentScore {
  let score = 50;
  const keyMetrics: Record<string, any> = {
    isPullback: params.isPullback,
    pullbackDepth: params.pullbackDepth,
  };

  if (params.isPullback) {
    score = 70;
    if (params.pullbackDepth < 10) {
      score += 15;
      keyMetrics.verdict = 'Shallow pullback - very favorable';
    } else if (params.pullbackDepth < 25) {
      score += 10;
      keyMetrics.verdict = 'Normal pullback - favorable';
    } else {
      score -= 5;
      keyMetrics.verdict = 'Deep pullback - use caution';
    }
  } else {
    score = 45;
    keyMetrics.verdict = 'No clear pullback detected';
  }

  return {
    agent: 'PullbackAnalyst',
    score: Math.max(0, Math.min(100, score)),
    reasoning: `${
      params.isPullback
        ? `Pullback of ${params.pullbackDepth.toFixed(1)}% in ${params.trend} trend. ${keyMetrics.verdict}`
        : 'No pullback opportunity detected'
    }`,
    confidence: params.isPullback ? 75 : 50,
    keyMetrics,
    timestamp: Date.now(),
  };
}

/**
 * Session Analyst
 * Analyzes trading session (Asian, European, US, Overlap)
 */
export function analyzeSession(params: {
  symbol: string;
  currentSession: 'asian' | 'european' | 'us' | 'overlap';
  sessionStart: number;
  sessionEnd: number;
}): AgentScore {
  let score = 50;
  const keyMetrics: Record<string, any> = {
    session: params.currentSession,
  };

  // Overlaps are best for volatility
  if (params.currentSession === 'overlap') {
    score = 80;
    keyMetrics.verdict = 'Session overlap - high volatility expected';
  } else if (
    params.currentSession === 'european' ||
    params.currentSession === 'us'
  ) {
    score = 70;
    keyMetrics.verdict = `${params.currentSession} session - good liquidity`;
  } else {
    score = 55;
    keyMetrics.verdict = 'Asian session - moderate activity';
  }

  return {
    agent: 'SessionAnalyst',
    score: Math.max(0, Math.min(100, score)),
    reasoning: `Currently in ${params.currentSession} session. ${keyMetrics.verdict}`,
    confidence: 70,
    keyMetrics,
    timestamp: Date.now(),
  };
}

/**
 * News Analyst
 * Evaluates economic news, events, sentiment
 */
export function analyzeNews(params: {
  symbol: string;
  hasMajorNews: boolean;
  newsImpact: 'positive' | 'negative' | 'neutral';
  volatilityExpected: boolean;
}): AgentScore {
  let score = 50;
  const keyMetrics: Record<string, any> = {
    hasMajorNews: params.hasMajorNews,
    newsImpact: params.newsImpact,
  };

  if (!params.hasMajorNews) {
    score = 70;
    keyMetrics.verdict = 'No major news - stable trading environment';
  } else {
    if (params.newsImpact === 'positive') {
      score = 65;
      keyMetrics.verdict = 'Positive news - potential upside';
    } else if (params.newsImpact === 'negative') {
      score = 35;
      keyMetrics.verdict = 'Negative news - caution advised';
    } else {
      score = 50;
      keyMetrics.verdict = 'Neutral news - mixed signals';
    }

    if (params.volatilityExpected) {
      score -= 10; // Extra risk
      keyMetrics.volatilityWarning = 'High volatility expected';
    }
  }

  return {
    agent: 'NewsAnalyst',
    score: Math.max(0, Math.min(100, score)),
    reasoning: `${
      params.hasMajorNews
        ? `Major news detected: ${params.newsImpact}. ${keyMetrics.verdict}`
        : keyMetrics.verdict
    }${params.volatilityExpected ? ' Extra volatility expected.' : ''}`,
    confidence: params.hasMajorNews ? 60 : 85,
    keyMetrics,
    timestamp: Date.now(),
  };
}

/**
 * Risk Manager
 * Evaluates risk/reward ratio, position sizing
 */
export function analyzeRisk(params: {
  symbol: string;
  entryPrice: number;
  stopLossPrice: number;
  takeProfitPrice: number;
  accountRisk: number; // percentage per trade
}): AgentScore {
  let score = 50;
  const riskPoints = Math.abs(params.entryPrice - params.stopLossPrice);
  const rewardPoints = Math.abs(params.takeProfitPrice - params.entryPrice);
  const riskRewardRatio = rewardPoints / riskPoints;

  const keyMetrics: Record<string, any> = {
    riskPoints,
    rewardPoints,
    riskRewardRatio: riskRewardRatio.toFixed(2),
    accountRisk: params.accountRisk,
  };

  // Good risk/reward is 2:1 or better
  if (riskRewardRatio >= 2.0) {
    score = 85;
    keyMetrics.verdict = 'Excellent risk/reward ratio';
  } else if (riskRewardRatio >= 1.5) {
    score = 75;
    keyMetrics.verdict = 'Good risk/reward ratio';
  } else if (riskRewardRatio >= 1.0) {
    score = 55;
    keyMetrics.verdict = 'Acceptable risk/reward ratio';
  } else {
    score = 20;
    keyMetrics.verdict = 'Poor risk/reward ratio - avoid';
  }

  // Account risk check
  if (params.accountRisk > 3) {
    score -= 20;
    keyMetrics.accountRiskWarning = 'Position size too large';
  } else if (params.accountRisk <= 1) {
    score += 5;
    keyMetrics.accountRiskNote = 'Conservative position sizing';
  }

  return {
    agent: 'RiskManager',
    score: Math.max(0, Math.min(100, score)),
    reasoning: `Risk/Reward: 1:${riskRewardRatio.toFixed(2)}. Account risk: ${params.accountRisk.toFixed(
      2
    )}%. ${keyMetrics.verdict}`,
    confidence: 90,
    keyMetrics,
    timestamp: Date.now(),
  };
}

/**
 * Confidence Scoring
 * Meta-analysis: how confident are we in other agents?
 */
export function scoreConfidence(params: {
  agentAgreement: number; // 0-100, how much agents agree
  dataQuality: 'high' | 'medium' | 'low';
  marketConditions: 'normal' | 'unusual' | 'chaotic';
  timeframe: string;
}): AgentScore {
  let score = 50;
  const keyMetrics: Record<string, any> = {
    agentAgreement: params.agentAgreement,
    dataQuality: params.dataQuality,
    marketConditions: params.marketConditions,
  };

  // Agent agreement weight
  score = Math.min(100, Math.max(20, params.agentAgreement));

  // Data quality adjustment
  if (params.dataQuality === 'high') {
    score += 15;
  } else if (params.dataQuality === 'low') {
    score -= 20;
  }

  // Market conditions
  if (params.marketConditions === 'chaotic') {
    score -= 25;
    keyMetrics.verdict = 'Chaotic conditions - low confidence';
  } else if (params.marketConditions === 'unusual') {
    score -= 10;
    keyMetrics.verdict = 'Unusual conditions - moderate confidence';
  } else {
    keyMetrics.verdict = 'Normal conditions - good confidence';
  }

  // Timeframe consideration
  if (params.timeframe === 'D') {
    score += 5;
    keyMetrics.timeframeNote = 'Daily timeframe more reliable';
  }

  return {
    agent: 'ConfidenceScoring',
    score: Math.max(0, Math.min(100, score)),
    reasoning: `Overall confidence assessment: Agent agreement ${params.agentAgreement.toFixed(
      0
    )}%. Data ${params.dataQuality}. Market ${params.marketConditions}. ${keyMetrics.verdict}`,
    confidence: Math.min(100, Math.max(30, score - 10)),
    keyMetrics,
    timestamp: Date.now(),
  };
}

/**
 * Trade Validator
 * Final checks before trade is taken
 */
export function validateTrade(params: {
  symbol: string;
  hasAllRequiredData: boolean;
  noFundamentalEvents: boolean;
  priceActionClean: boolean;
  entrySureAdjustment: number; // pips to adjust
}): AgentScore {
  let score = 50;
  const keyMetrics: Record<string, any> = {
    requiredData: params.hasAllRequiredData,
    fundamentals: params.noFundamentalEvents,
    priceAction: params.priceActionClean,
  };

  if (params.hasAllRequiredData) {
    score += 20;
  } else {
    score -= 30;
    keyMetrics.verdict = 'Missing critical data';
  }

  if (params.noFundamentalEvents) {
    score += 15;
  } else {
    score -= 15;
    keyMetrics.verdict = 'Fundamental event risk';
  }

  if (params.priceActionClean) {
    score += 20;
  } else {
    score -= 20;
    keyMetrics.verdict = 'Price action unclear';
  }

  return {
    agent: 'TradeValidator',
    score: Math.max(0, Math.min(100, score)),
    reasoning: `Trade validation: Data ${
      params.hasAllRequiredData ? '✓' : '✗'
    }, Fundamentals ${params.noFundamentalEvents ? '✓' : '✗'}, Price Action ${
      params.priceActionClean ? '✓' : '✗'
    }.`,
    confidence: 85,
    keyMetrics,
    timestamp: Date.now(),
  };
}

/**
 * Learning Engine
 * Adapts based on historical performance
 */
export function learnFromHistory(params: {
  winRate: number; // 0-100
  totalTrades: number;
  profitFactor: number; // avg win / avg loss
  recentPerformance: 'improving' | 'stable' | 'declining';
}): AgentScore {
  let score = 50;
  const keyMetrics: Record<string, any> = {
    winRate: params.winRate,
    totalTrades: params.totalTrades,
    profitFactor: params.profitFactor.toFixed(2),
  };

  // Win rate evaluation
  if (params.winRate > 60) {
    score = 80;
    keyMetrics.winRateVerdict = 'Excellent track record';
  } else if (params.winRate > 55) {
    score = 70;
    keyMetrics.winRateVerdict = 'Good track record';
  } else if (params.winRate > 50) {
    score = 55;
    keyMetrics.winRateVerdict = 'Acceptable track record';
  } else if (params.totalTrades < 10) {
    score = 50;
    keyMetrics.winRateVerdict = 'Insufficient data';
  } else {
    score = 35;
    keyMetrics.winRateVerdict = 'Negative track record';
  }

  // Profit factor
  if (params.profitFactor > 1.5) {
    score += 15;
  } else if (params.profitFactor < 0.8) {
    score -= 15;
  }

  // Recent performance trend
  if (params.recentPerformance === 'improving') {
    score += 10;
    keyMetrics.trend = 'Improving';
  } else if (params.recentPerformance === 'declining') {
    score -= 15;
    keyMetrics.trend = 'Declining';
  } else {
    keyMetrics.trend = 'Stable';
  }

  return {
    agent: 'LearningEngine',
    score: Math.max(0, Math.min(100, score)),
    reasoning: `Historical: ${params.winRate.toFixed(1)}% win rate, ${params.totalTrades} trades. Profit factor: ${params.profitFactor.toFixed(
      2
    )}. Trend: ${keyMetrics.trend}. ${keyMetrics.winRateVerdict}`,
    confidence: params.totalTrades > 30 ? 85 : 50,
    keyMetrics,
    timestamp: Date.now(),
  };
}
