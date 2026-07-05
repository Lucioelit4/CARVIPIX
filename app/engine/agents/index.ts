/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * IMPLEMENTACIÓN DE AGENTES
 * 11 agentes especializados de análisis para decisiones de trading
 * Cada agente: evalúa datos del mercado → devuelve puntuación (0-100) + razonamiento
 */

import { AgentScore, AgentType } from '../types/index';

/**
 * Analista de Régimen de Mercado
 * Evalúa condiciones generales del mercado: tendencia vs rango
 */
export function analyzeMarketRegime(params: {
  symbol: string;
  atr: number;
  volatility: number;
  trend: 'strong_up' | 'strong_down' | 'neutral' | 'choppy';
}): AgentScore {
  let score = 50; // Inicio neutral
  const keyMetrics: Record<string, any> = {
    volatility: params.volatility,
    trend: params.trend,
  };

  // Los mercados en tendencia son mejores para trading
  if (params.trend === 'strong_up' || params.trend === 'strong_down') {
    score += 25;
    keyMetrics.verdict = 'Tendencia fuerte - condiciones favorables';
  } else if (params.trend === 'neutral') {
    score += 10;
    keyMetrics.verdict = 'Tendencia neutral - condiciones moderadas';
  } else {
    score -= 20;
    keyMetrics.verdict = 'Régimen choppy - riesgoso';
  }

  // Evaluación de volatilidad
  if (params.volatility < 30) {
    score += 5;
  } else if (params.volatility > 50) {
    score -= 10;
  }

  return {
    agent: 'MarketRegimeAnalyst',
    score: Math.max(0, Math.min(100, score)),
    reasoning: `Mercado en régimen ${params.trend} con volatilidad ${params.volatility.toFixed(
      1
    )}%. ${keyMetrics.verdict}`,
    confidence: params.trend !== 'choppy' ? 80 : 40,
    keyMetrics,
    timestamp: Date.now(),
  };
}

/**
 * Analista de Tendencia
 * Analiza la dirección y fuerza de la tendencia de precio
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

  // Golden cross (20 > 50 > 200) o Death cross
  if (
    params.direction === 'up' &&
    params.ema20 > params.ema50 &&
    params.ema50 > params.ema200
  ) {
    score = 85;
    keyMetrics.verdict = 'Tendencia alcista fuerte - golden cross alineado';
  } else if (
    params.direction === 'down' &&
    params.ema20 < params.ema50 &&
    params.ema50 < params.ema200
  ) {
    score = 85;
    keyMetrics.verdict = 'Tendencia bajista fuerte - death cross alineado';
  } else if (params.direction === 'up') {
    score = 65;
    keyMetrics.verdict = 'Tendencia alcista presente';
  } else {
    score = 65;
    keyMetrics.verdict = 'Tendencia bajista presente';
  }

  // Precio sobre/bajo EMAs clave
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
    reasoning: `Tendencia ${params.direction} detectada. ${keyMetrics.verdict}. Precio ${
      params.price > params.ema50 ? 'por encima' : 'por debajo'
    } de EMA 50.`,
    confidence: 85,
    keyMetrics,
    timestamp: Date.now(),
  };
}

/**
 * Analista de Estructura
 * Analiza soporte/resistencia, máximos/mínimos
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

  // Precio cerca de soporte/resistencia
  const distToResistance = ((params.resistance - params.price) / params.price) * 100;
  const distToSupport = ((params.price - params.support) / params.price) * 100;

  if (params.breakout) {
    score = 80;
    keyMetrics.verdict = 'Estructura de breakout confirmada';
  } else if (distToResistance < 2) {
    score = 75;
    keyMetrics.verdict = 'Precio cerca de resistencia - potencial breakout';
  } else if (distToSupport < 2) {
    score = 75;
    keyMetrics.verdict = 'Precio cerca de soporte - potencial rebote';
  } else {
    score = 55;
    keyMetrics.verdict = 'Estructura de rango normal';
  }

  return {
    agent: 'StructureAnalyst',
    score: Math.max(0, Math.min(100, score)),
    reasoning: `Estructura: S/${params.support} - P/${params.price} - R/${params.resistance}. ${keyMetrics.verdict}`,
    confidence: 75,
    keyMetrics,
    timestamp: Date.now(),
  };
}

/**
 * Analista de Momentum
 * Analiza RSI, MACD, indicadores de momentum
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

  // Niveles de RSI
  if (params.rsi < 30) {
    score += 10; // Sobrevendido
    keyMetrics.rsiStatus = 'Sobrevendido';
  } else if (params.rsi > 70) {
    score -= 10; // Sobrecomprado
    keyMetrics.rsiStatus = 'Sobrecomprado';
  } else if (params.rsi < 50) {
    score += 5;
    keyMetrics.rsiStatus = 'Zona bajista';
  } else {
    score += 5;
    keyMetrics.rsiStatus = 'Zona alcista';
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
    keyMetrics.macdAlign = 'MACD alineado con momentum';
  }

  return {
    agent: 'MomentumAnalyst',
    score: Math.max(0, Math.min(100, score)),
    reasoning: `Momentum ${params.momentum}. RSI: ${params.rsi.toFixed(
      1
    )}. ${keyMetrics.rsiStatus}. Histograma MACD: ${params.macdHistogram.toFixed(
      3
    )}.`,
    confidence: 80,
    keyMetrics,
    timestamp: Date.now(),
  };
}

/**
 * Analista de Pullback MEJORADO
 * 
 * CAMBIOS EN V2:
 * - Pullback depth normalizado por ATR (no % fijo)
 * - Valida que tendencia sea fuerte ANTES de buscar pullback
 * - Detecta false pullbacks (no vuelve a tendencia)
 * - Integra con trend para evitar redundancia
 */
export function analyzePullback(params: {
  symbol: string;
  isPullback: boolean;
  pullbackDepth: number; // porcentaje vs ATR
  pullbackNormalized: number; // pullbackDepth / ATR (mejor métrica)
  trend: 'up' | 'down' | 'none';
  trendStrength: number; // 0-100 (proporcionado por TrendAnalyst)
  recoveryFromPullback: number; // % recovery hacia tendencia anterior
}): AgentScore {
  let score = 50;
  const keyMetrics: Record<string, any> = {
    isPullback: params.isPullback,
    pullbackNormalized: params.pullbackNormalized.toFixed(2),
    trendStrength: params.trendStrength,
    recovery: params.recoveryFromPullback.toFixed(1) + '%',
  };

  // Solo evalúa pullback si hay tendencia fuerte
  if (params.trend === 'none' || params.trendStrength < 50) {
    score = 35;
    keyMetrics.verdict = 'Sin tendencia fuerte - pullback no tiene contexto';
    return {
      agent: 'PullbackAnalyst',
      score,
      reasoning: `Pullback requiere tendencia fuerte (actual: ${params.trendStrength}/100)`,
      confidence: 40,
      keyMetrics,
      timestamp: Date.now(),
    };
  }

  if (!params.isPullback) {
    score = 45;
    keyMetrics.verdict = 'Sin pullback detectado en tendencia';
    return {
      agent: 'PullbackAnalyst',
      score,
      reasoning: `Tendencia ${params.trend} pero sin oportunidad de pullback`,
      confidence: 50,
      keyMetrics,
      timestamp: Date.now(),
    };
  }

  // Pullback existe: evalúa profundidad normalizada
  // 50% de ATR = shallow + good
  // 100-120% de ATR = normal
  // 120%+ de ATR = too deep
  if (params.pullbackNormalized < 0.5) {
    score = 85; // Muy favorable
    keyMetrics.verdict = 'Pullback poco profundo - excelente setup';
  } else if (params.pullbackNormalized < 1.0) {
    score = 75; // Favorable
    keyMetrics.verdict = 'Pullback normal - favorable';
  } else if (params.pullbackNormalized < 1.25) {
    score = 60; // Marginal
    keyMetrics.verdict = 'Pullback profundo - usar precaución';
  } else {
    score = 30; // No es pullback, es reversión
    keyMetrics.verdict = 'Demasiado profundo - puede no ser pullback';
  }

  // Bonus si recovery está en progreso (confirma que es pullback, no reversa)
  if (params.recoveryFromPullback > 30) {
    score += 15;
    keyMetrics.recoveryNote = 'Recovery en progreso - pullback confirmado';
  } else if (params.recoveryFromPullback < 10) {
    score -= 20; // Stuck at pullback level = riesgo
    keyMetrics.recoveryNote = 'Sin recovery - posible false breakout anterior';
  }

  return {
    agent: 'PullbackAnalyst',
    score: Math.max(0, Math.min(100, score)),
    reasoning: `Pullback en tendencia ${params.trend} (strength ${params.trendStrength}/100). Depth: ${params.pullbackNormalized.toFixed(2)}x ATR. ${keyMetrics.verdict}`,
    confidence: params.recoveryFromPullback > 20 ? 75 : 55,
    keyMetrics,
    timestamp: Date.now(),
  };
}

/**
 * Analista de Sesión
 * Analiza sesión de trading (Asian, European, US, Overlap)
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

  // Solapamientos son mejores para volatilidad
  if (params.currentSession === 'overlap') {
    score = 80;
    keyMetrics.verdict = 'Solapamiento de sesión - alta volatilidad esperada';
  } else if (
    params.currentSession === 'european' ||
    params.currentSession === 'us'
  ) {
    score = 70;
    keyMetrics.verdict = `Sesión ${params.currentSession} - buena liquidez`;
  } else {
    score = 55;
    keyMetrics.verdict = 'Sesión asiática - actividad moderada';
  }

  return {
    agent: 'SessionAnalyst',
    score: Math.max(0, Math.min(100, score)),
    reasoning: `Actualmente en sesión ${params.currentSession}. ${keyMetrics.verdict}`,
    confidence: 70,
    keyMetrics,
    timestamp: Date.now(),
  };
}

/**
 * Analista de Noticias
 * Evalúa noticias económicas, eventos, sentimiento
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
    keyMetrics.verdict = 'Sin noticias importantes - entorno de trading estable';
  } else {
    if (params.newsImpact === 'positive') {
      score = 65;
      keyMetrics.verdict = 'Noticias positivas - potencial al alza';
    } else if (params.newsImpact === 'negative') {
      score = 35;
      keyMetrics.verdict = 'Noticias negativas - precaución recomendada';
    } else {
      score = 50;
      keyMetrics.verdict = 'Noticias neutrales - señales mixtas';
    }

    if (params.volatilityExpected) {
      score -= 10; // Riesgo extra
      keyMetrics.volatilityWarning = 'Alta volatilidad esperada';
    }
  }

  return {
    agent: 'NewsAnalyst',
    score: Math.max(0, Math.min(100, score)),
    reasoning: `${
      params.hasMajorNews
        ? `Noticia importante detectada: ${params.newsImpact}. ${keyMetrics.verdict}`
        : keyMetrics.verdict
    }${params.volatilityExpected ? ' Volatilidad extra esperada.' : ''}`,
    confidence: params.hasMajorNews ? 60 : 85,
    keyMetrics,
    timestamp: Date.now(),
  };
}

/**
 * Gestor de Riesgo MEJORADO
 * 
 * CAMBIOS EN V2:
 * - Ajusta RR por slippage y spread
 * - Penaliza si account risk es muy alto
 * - Incorpora volatilidad en el cálculo
 * - Valida contra máximo drawdown de cuenta
 */
export function analyzeRisk(params: {
  symbol: string;
  entryPrice: number;
  stopLossPrice: number;
  takeProfitPrice: number;
  accountRisk: number; // porcentaje por operación
  spreadEstimated: number; // pips (slippage)
  volatility: number; // ATR o similar
  currentDrawdown: number; // % actual
  maxAllowedDrawdown: number; // % máximo
}): AgentScore {
  let score = 50;
  const riskPoints = Math.abs(params.entryPrice - params.stopLossPrice);
  const rewardPoints = Math.abs(params.takeProfitPrice - params.entryPrice);
  
  // RR AJUSTADO POR SPREAD/SLIPPAGE
  // Restar spread del reward (worst case: entra 1 spread afuera)
  const spreadCost = params.spreadEstimated * 0.0001; // Convertir pips a precio
  const rewardPointsAdjusted = Math.max(0, rewardPoints - spreadCost);
  const riskRewardRatioAdjusted = rewardPointsAdjusted / riskPoints;
  
  const keyMetrics: Record<string, any> = {
    riskPoints: riskPoints.toFixed(5),
    rewardPoints: rewardPoints.toFixed(5),
    riskRewardRatioTheoretical: (rewardPoints / riskPoints).toFixed(2),
    riskRewardRatioAdjusted: riskRewardRatioAdjusted.toFixed(2),
    spreadCost: params.spreadEstimated.toFixed(1) + ' pips',
    accountRisk: params.accountRisk.toFixed(2) + '%',
  };

  // Scoring basado en RR AJUSTADO
  if (riskRewardRatioAdjusted >= 2.0) {
    score = 85;
    keyMetrics.verdict = 'Excelente R:R (ajustado)';
  } else if (riskRewardRatioAdjusted >= 1.5) {
    score = 75;
    keyMetrics.verdict = 'Bueno R:R (ajustado)';
  } else if (riskRewardRatioAdjusted >= 1.0) {
    score = 55;
    keyMetrics.verdict = 'Aceptable R:R (ajustado)';
  } else {
    score = 20;
    keyMetrics.verdict = 'Pobre R:R - RECHAZAR';
  }

  // PENALIZACIÓN POR RIESGO DE CUENTA ALTO
  if (params.accountRisk > 3) {
    score -= 30; // Penalización severa
    keyMetrics.riskWarning = 'Posición DEMASIADO grande (>3% de cuenta)';
  } else if (params.accountRisk > 2) {
    score -= 15;
    keyMetrics.riskWarning = 'Posición grande (2-3%)';
  } else if (params.accountRisk <= 0.5) {
    score += 5;
    keyMetrics.riskNote = 'Dimensionamiento conservador - excelente';
  }

  // PENALIZACIÓN POR VOLATILIDAD ALTA
  // Si spread es grande relativo a volatilidad = risk aumenta
  const spreadToVolatilityRatio = params.spreadEstimated / (params.volatility * 100);
  if (spreadToVolatilityRatio > 0.5) {
    score -= 20; // Spread es 50%+ de volatilidad
    keyMetrics.volatilityWarning = 'Spread muy grande relativo a volatilidad';
  }

  // PENALIZACIÓN POR DRAWDOWN PROFUNDO
  const drawdownUsagePercent = (params.currentDrawdown / params.maxAllowedDrawdown) * 100;
  if (drawdownUsagePercent > 90) {
    score -= 40; // Casi en límite
    keyMetrics.ddWarning = `Drawdown muy profundo: ${params.currentDrawdown.toFixed(1)}% / ${params.maxAllowedDrawdown}%`;
  } else if (drawdownUsagePercent > 70) {
    score -= 20; // Acercándose al límite
    keyMetrics.ddWarning = `Drawdown elevado: ${params.currentDrawdown.toFixed(1)}% / ${params.maxAllowedDrawdown}%`;
  }

  // Si todo falla en risk: score 20 es REJECT
  if (score < 25) {
    keyMetrics.verdict = 'TRADE RECHAZADO - Riesgo inaceptable';
  }

  return {
    agent: 'RiskManager',
    score: Math.max(0, Math.min(100, score)),
    reasoning: `R:R ajustado: 1:${riskRewardRatioAdjusted.toFixed(2)} (spread -${params.spreadEstimated.toFixed(1)}pips). Account risk: ${params.accountRisk.toFixed(2)}%. ${keyMetrics.verdict}`,
    confidence: 95, // Risk manager tiene alta confianza en su cálculo
    keyMetrics,
    timestamp: Date.now(),
  };
}

/**
 * Puntuación de Confianza MEJORADO
 * 
 * CAMBIOS EN V2:
 * - Calcula agreement real desde agentScores (no es input)
 * - Detecta divergencia entre agentes críticos
 * - Penaliza si solo agentes secundarios aprueban
 * - Ajusta por uniformidad de scores
 */
export function scoreConfidence(params: {
  allAgentScores: AgentScore[]; // TODOS los agentes para calcular agreement
  dataQuality: 'high' | 'medium' | 'low';
  marketConditions: 'normal' | 'unusual' | 'chaotic';
  timeframe: string;
}): AgentScore {
  let score = 50;
  const keyMetrics: Record<string, any> = {
    dataQuality: params.dataQuality,
    marketConditions: params.marketConditions,
  };

  // Calcular agreement real desde scores
  const approvals = params.allAgentScores.filter(s => s.score >= 60).length;
  const rejections = params.allAgentScores.filter(s => s.score < 40).length;
  const totalAgents = params.allAgentScores.length;

  // Percentaje de acuerdo
  const agentAgreement = (approvals / totalAgents) * 100;
  keyMetrics.agentAgreement = agentAgreement.toFixed(0) + '%';
  keyMetrics.approvals = approvals;
  keyMetrics.rejections = rejections;

  // Base score: mapear agreement a 0-100
  score = Math.min(100, Math.max(20, agentAgreement));

  // Analizar uniformidad de scores (std deviation)
  const avgScore = params.allAgentScores.reduce((s, a) => s + a.score, 0) / totalAgents;
  const variance = params.allAgentScores.reduce((s, a) => s + Math.pow(a.score - avgScore, 2), 0) / totalAgents;
  const stdDev = Math.sqrt(variance);

  // Si high divergence (std dev > 25) = agentes muy divididos
  if (stdDev > 25) {
    score *= 0.80; // Penalizar 20%
    keyMetrics.divergence = 'ALTA - agentes muy divididos';
  } else if (stdDev < 10) {
    score *= 1.10; // Bonus 10% si todos en acuerdo
    keyMetrics.divergence = 'BAJA - agentes unánimes';
  } else {
    keyMetrics.divergence = 'NORMAL';
  }

  // Calidad de datos
  if (params.dataQuality === 'high') {
    score += 15;
  } else if (params.dataQuality === 'low') {
    score -= 20;
  }

  // Condiciones de mercado
  if (params.marketConditions === 'chaotic') {
    score -= 25;
    keyMetrics.verdict = 'Condiciones caóticas - confianza baja';
  } else if (params.marketConditions === 'unusual') {
    score -= 10;
    keyMetrics.verdict = 'Condiciones inusuales - confianza moderada';
  } else {
    keyMetrics.verdict = 'Condiciones normales - buena confianza';
  }

  // Timeframe bonus (datos diarios son más confiables)
  if (params.timeframe === 'D') {
    score += 5;
    keyMetrics.timeframeNote = 'Timeframe diario - más confiable';
  }

  return {
    agent: 'ConfidenceScoring',
    score: Math.max(0, Math.min(100, score)),
    reasoning: `Agreement: ${agentAgreement.toFixed(0)}% (${approvals}/${totalAgents} agentes). Divergencia: ${keyMetrics.divergence}. Datos: ${params.dataQuality}. Mercado: ${params.marketConditions}. ${keyMetrics.verdict}`,
    confidence: Math.min(100, Math.max(30, score - 15)),
    keyMetrics,
    timestamp: Date.now(),
  };
}

/**
 * Validador de Operación
 * Verificaciones finales antes de ejecutar la operación
 */
export function validateTrade(params: {
  symbol: string;
  hasAllRequiredData: boolean;
  noFundamentalEvents: boolean;
  priceActionClean: boolean;
  entrySureAdjustment: number; // pips para ajustar
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
    keyMetrics.verdict = 'Datos críticos faltantes';
  }

  if (params.noFundamentalEvents) {
    score += 15;
  } else {
    score -= 15;
    keyMetrics.verdict = 'Riesgo de evento fundamental';
  }

  if (params.priceActionClean) {
    score += 20;
  } else {
    score -= 20;
    keyMetrics.verdict = 'Acción de precio poco clara';
  }

  return {
    agent: 'TradeValidator',
    score: Math.max(0, Math.min(100, score)),
    reasoning: `Validación de operación: Datos ${
      params.hasAllRequiredData ? '✓' : '✗'
    }, Fundamentales ${params.noFundamentalEvents ? '✓' : '✗'}, Acción de Precio ${
      params.priceActionClean ? '✓' : '✗'
    }.`,
    confidence: 85,
    keyMetrics,
    timestamp: Date.now(),
  };
}

/**
 * Motor de Aprendizaje
 * Se adapta según el desempeño histórico
 */
export function learnFromHistory(params: {
  winRate: number; // 0-100
  totalTrades: number;
  profitFactor: number; // ganancia promedio / pérdida promedio
  recentPerformance: 'improving' | 'stable' | 'declining';
}): AgentScore {
  let score = 50;
  const keyMetrics: Record<string, any> = {
    winRate: params.winRate,
    totalTrades: params.totalTrades,
    profitFactor: params.profitFactor.toFixed(2),
  };

  // Evaluación de tasa de ganancia
  if (params.winRate > 60) {
    score = 80;
    keyMetrics.winRateVerdict = 'Historial excelente';
  } else if (params.winRate > 55) {
    score = 70;
    keyMetrics.winRateVerdict = 'Historial bueno';
  } else if (params.winRate > 50) {
    score = 55;
    keyMetrics.winRateVerdict = 'Historial aceptable';
  } else if (params.totalTrades < 10) {
    score = 50;
    keyMetrics.winRateVerdict = 'Datos insuficientes';
  } else {
    score = 35;
    keyMetrics.winRateVerdict = 'Historial negativo';
  }

  // Factor de ganancia
  if (params.profitFactor > 1.5) {
    score += 15;
  } else if (params.profitFactor < 0.8) {
    score -= 15;
  }

  // Tendencia de desempeño reciente
  if (params.recentPerformance === 'improving') {
    score += 10;
    keyMetrics.trend = 'Mejorando';
  } else if (params.recentPerformance === 'declining') {
    score -= 15;
    keyMetrics.trend = 'Declinando';
  } else {
    keyMetrics.trend = 'Estable';
  }

  return {
    agent: 'LearningEngine',
    score: Math.max(0, Math.min(100, score)),
    reasoning: `Histórico: ${params.winRate.toFixed(1)}% tasa ganadora, ${params.totalTrades} operaciones. Factor de ganancia: ${params.profitFactor.toFixed(
      2
    )}. Tendencia: ${keyMetrics.trend}. ${keyMetrics.winRateVerdict}`,
    confidence: params.totalTrades > 30 ? 85 : 50,
    keyMetrics,
    timestamp: Date.now(),
  };
}

