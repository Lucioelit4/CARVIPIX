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
 * Analista de Pullback
 * Analiza oportunidades de pullback
 */
export function analyzePullback(params: {
  symbol: string;
  isPullback: boolean;
  pullbackDepth: number; // porcentaje
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
      keyMetrics.verdict = 'Pullback poco profundo - muy favorable';
    } else if (params.pullbackDepth < 25) {
      score += 10;
      keyMetrics.verdict = 'Pullback normal - favorable';
    } else {
      score -= 5;
      keyMetrics.verdict = 'Pullback profundo - usar precaución';
    }
  } else {
    score = 45;
    keyMetrics.verdict = 'Sin pullback claro detectado';
  }

  return {
    agent: 'PullbackAnalyst',
    score: Math.max(0, Math.min(100, score)),
    reasoning: `${
      params.isPullback
        ? `Pullback de ${params.pullbackDepth.toFixed(1)}% en tendencia ${params.trend}. ${keyMetrics.verdict}`
        : 'Sin oportunidad de pullback detectada'
    }`,
    confidence: params.isPullback ? 75 : 50,
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
 * Gestor de Riesgo
 * Evalúa relaciones riesgo/recompensa, dimensionamiento de posiciones
 */
export function analyzeRisk(params: {
  symbol: string;
  entryPrice: number;
  stopLossPrice: number;
  takeProfitPrice: number;
  accountRisk: number; // porcentaje por operación
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

  // Buen R:R es 2:1 o mejor
  if (riskRewardRatio >= 2.0) {
    score = 85;
    keyMetrics.verdict = 'Excelente relación riesgo/recompensa';
  } else if (riskRewardRatio >= 1.5) {
    score = 75;
    keyMetrics.verdict = 'Buena relación riesgo/recompensa';
  } else if (riskRewardRatio >= 1.0) {
    score = 55;
    keyMetrics.verdict = 'Relación riesgo/recompensa aceptable';
  } else {
    score = 20;
    keyMetrics.verdict = 'Relación riesgo/recompensa pobre - evitar';
  }

  // Verificación de riesgo de cuenta
  if (params.accountRisk > 3) {
    score -= 20;
    keyMetrics.accountRiskWarning = 'Tamaño de posición demasiado grande';
  } else if (params.accountRisk <= 1) {
    score += 5;
    keyMetrics.accountRiskNote = 'Dimensionamiento conservador';
  }

  return {
    agent: 'RiskManager',
    score: Math.max(0, Math.min(100, score)),
    reasoning: `R:R: 1:${riskRewardRatio.toFixed(2)}. Riesgo de cuenta: ${params.accountRisk.toFixed(
      2
    )}%. ${keyMetrics.verdict}`,
    confidence: 90,
    keyMetrics,
    timestamp: Date.now(),
  };
}

/**
 * Puntuación de Confianza
 * Meta-análisis: ¿Qué tan confiados estamos en los otros agentes?
 */
export function scoreConfidence(params: {
  agentAgreement: number; // 0-100, cuánto acuerdan los agentes
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

  // Peso de acuerdo entre agentes
  score = Math.min(100, Math.max(20, params.agentAgreement));

  // Ajuste de calidad de datos
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

  // Consideración de timeframe
  if (params.timeframe === 'D') {
    score += 5;
    keyMetrics.timeframeNote = 'Timeframe diario más confiable';
  }

  return {
    agent: 'ConfidenceScoring',
    score: Math.max(0, Math.min(100, score)),
    reasoning: `Evaluación general de confianza: Acuerdo de agentes ${params.agentAgreement.toFixed(
      0
    )}%. Datos ${params.dataQuality}. Mercado ${params.marketConditions}. ${keyMetrics.verdict}`,
    confidence: Math.min(100, Math.max(30, score - 10)),
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
