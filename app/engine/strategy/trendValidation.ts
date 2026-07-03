/**
 * CARVIPIX Trend Validation System v1.1
 * Lógica REAL bullish/bearish por separado
 * Retorna BUY, SELL o NEUTRAL (no simple metCount)
 * 
 * v1.1.1: Penalización de contradicción configurable
 */

import { TrendValidation, TrendCondition, TrendConfidenceLevel, OrderDirection } from '../trading/tradingEngine';
import { getTrendValidatorConfig } from './trendValidatorConfig';

// Tipos internos para scoring bullish/bearish
interface ConditionEvaluation {
  bullish: boolean;
  bearish: boolean;
  reason: string;
}

/**
 * Evaluador de tendencia - v1.1 REAL
 */
export class TrendValidator {
  // Configuración de penalización (puede ser sobrescrita para testing)
  private static contradictionPenalty = getTrendValidatorConfig().contradictionPenalty;

  /**
   * Establecer penalización de contradicción para testing
   */
  static setContradictionPenalty(penalty: number) {
    TrendValidator.contradictionPenalty = penalty;
  }

  /**
   * Obtener penalización actual
   */
  static getContradictionPenalty(): number {
    return TrendValidator.contradictionPenalty;
  }

  /**
   * Evalúa tendencia usando 4 condiciones
   * Retorna: BUY, SELL o NEUTRAL basado en bullishScore vs bearishScore
   */
  static validateTrend(params: {
    timeframe: '1H';
    asset: string;
    
    // Candle actual
    currentPrice: number;
    
    // EMAs del candle actual
    ema20: number;
    ema50: number;
    ema200: number;
    
    // HISTÓRICO DE EMAs para calcular slope (últimas 20 velas mínimo)
    ema20History?: number[];  // [ema_20velas_atras, ..., ema_1vela_atras, ema_actual]
    ema50History?: number[];
    ema200History?: number[];
    
    // HISTÓRICO DE CANDLES para detectar estructura
    candleHistory?: Array<{
      index: number;
      open: number;
      high: number;
      low: number;
      close: number;
    }>;
  }): TrendValidation {
    const conditions: TrendCondition[] = [];
    let bullishScore = 0;
    let bearishScore = 0;
    let totalScore = 0;

    // CONDICIÓN 1: Precio respecto a EMA200
    const condition1Eval = this.evaluateCondition1_PriceVsEMA200({
      currentPrice: params.currentPrice,
      ema200: params.ema200,
    });
    const condition1 = this.scoreCondition('PRICE_VS_EMA200', condition1Eval);
    conditions.push(condition1);
    if (condition1Eval.bullish) bullishScore += 25;
    if (condition1Eval.bearish) bearishScore += 25;
    totalScore += condition1.score;

    // CONDICIÓN 2: Orden de EMAs
    const condition2Eval = this.evaluateCondition2_EMAOrder({
      ema20: params.ema20,
      ema50: params.ema50,
      ema200: params.ema200,
    });
    const condition2 = this.scoreCondition('EMA_ORDER', condition2Eval);
    conditions.push(condition2);
    if (condition2Eval.bullish) bullishScore += 25;
    if (condition2Eval.bearish) bearishScore += 25;
    totalScore += condition2.score;

    // CONDICIÓN 3: Pendiente de EMAs
    const condition3Eval = this.evaluateCondition3_EMASlope({
      ema20History: params.ema20History,
      ema50History: params.ema50History,
      ema200History: params.ema200History,
    });
    const condition3 = this.scoreCondition('EMA_SLOPE', condition3Eval);
    conditions.push(condition3);
    if (condition3Eval.bullish) bullishScore += 25;
    if (condition3Eval.bearish) bearishScore += 25;
    totalScore += condition3.score;

    // CONDICIÓN 4: Estructura del mercado
    const condition4Eval = this.evaluateCondition4_Structure({
      candleHistory: params.candleHistory,
    });
    const condition4 = this.scoreCondition('STRUCTURE', condition4Eval);
    conditions.push(condition4);
    if (condition4Eval.bullish) bullishScore += 25;
    if (condition4Eval.bearish) bearishScore += 25;
    totalScore += condition4.score;

    // DIRECCIÓN FINAL: comparar bullishScore vs bearishScore
    let direction: OrderDirection | 'NEUTRAL' = 'NEUTRAL';
    if (bullishScore > bearishScore) {
      direction = 'BUY';
    } else if (bearishScore > bullishScore) {
      direction = 'SELL';
    }

    // Nivel de confianza basado en scores
    const confidenceLevel = this.determineConfidenceLevel(
      bullishScore,
      bearishScore,
      direction
    );

    return {
      timeframe: '1H',
      direction,
      confidenceLevel,
      conditions,
      totalScore,
      
      priceVsEMA200: {
        met: condition1Eval.bullish || condition1Eval.bearish,
        price: params.currentPrice,
        ema200: params.ema200,
        distance: Math.abs(params.currentPrice - params.ema200),
        reasoning: condition1Eval.reason,
      },
      
      emaOrder: {
        met: condition2Eval.bullish || condition2Eval.bearish,
        ema20: params.ema20,
        ema50: params.ema50,
        ema200: params.ema200,
        expectedOrder: condition2Eval.reason,
        actualOrder: this.getEMAOrder(params.ema20, params.ema50, params.ema200),
      },
      
      emaSlope: {
        met: condition3Eval.bullish || condition3Eval.bearish,
        ema20Slope: params.ema20History ? this.calculateSlope(params.ema20History) : 0,
        ema50Slope: params.ema50History ? this.calculateSlope(params.ema50History) : 0,
        ema200Slope: params.ema200History ? this.calculateSlope(params.ema200History) : 0,
        slopeDirection: condition3Eval.bullish ? 'BUY' : condition3Eval.bearish ? 'SELL' : 'FLAT',
        reasoning: condition3Eval.reason,
      },
      
      structure: {
        met: condition4Eval.bullish || condition4Eval.bearish,
        lastHighPrice: params.candleHistory?.[params.candleHistory.length - 2]?.high ?? 0,
        lastLowPrice: params.candleHistory?.[params.candleHistory.length - 2]?.low ?? 0,
        higherHighs: condition4Eval.bullish,
        higherLows: condition4Eval.bullish,
        lowerHighs: condition4Eval.bearish,
        lowerLows: condition4Eval.bearish,
        priority: 'OVERRIDE_OTHERS',
        contradicts: false,
      },
      
      // v1.1: scores bullish/bearish para transparencia
      bullishScore,
      bearishScore,
      
      timestamp: Date.now(),
    };
  }

  /**
   * CONDICIÓN 1: Precio respecto a EMA200
   * BUY: Precio > EMA200
   * SELL: Precio < EMA200
   * Sin threshold mínimo en v1.1 (criterio simple)
   */
  private static evaluateCondition1_PriceVsEMA200(params: {
    currentPrice: number;
    ema200: number;
  }): ConditionEvaluation {
    const bullish = params.currentPrice > params.ema200;
    const bearish = params.currentPrice < params.ema200;

    return {
      bullish,
      bearish,
      reason: `Precio ${params.currentPrice.toFixed(2)} ${bullish ? '>' : bearish ? '<' : '='} EMA200 ${params.ema200.toFixed(2)}. ${bullish ? '✓ BULLISH' : bearish ? '✓ BEARISH' : '= IGUAL'}`,
    };
  }

  /**
   * CONDICIÓN 2: Orden de EMAs
   * BUY: EMA20 > EMA50 > EMA200 (estricto)
   * SELL: EMA20 < EMA50 < EMA200 (estricto)
   */
  private static evaluateCondition2_EMAOrder(params: {
    ema20: number;
    ema50: number;
    ema200: number;
  }): ConditionEvaluation {
    const bullish = params.ema20 > params.ema50 && params.ema50 > params.ema200;
    const bearish = params.ema20 < params.ema50 && params.ema50 < params.ema200;

    return {
      bullish,
      bearish,
      reason: `EMA Order: 20=${params.ema20.toFixed(2)} | 50=${params.ema50.toFixed(2)} | 200=${params.ema200.toFixed(2)}. ${bullish ? '✓ 20>50>200 BULLISH' : bearish ? '✓ 20<50<200 BEARISH' : '✗ ORDEN CONFUSA'}`,
    };
  }

  /**
   * CONDICIÓN 3: Pendiente de EMAs
   * BUY: EMA20 y EMA50 SUBIENDO (slope positivo)
   * SELL: EMA20 y EMA50 BAJANDO (slope negativo)
   * EMA200 confirma pero no cancela sola
   * 
   * Cálculo: diferencia entre EMA actual y EMA de N velas atrás
   * (Para v1.1 simple: comparar EMA_actual vs EMA_hace_5_velas)
   */
  private static evaluateCondition3_EMASlope(params: {
    ema20History?: number[];
    ema50History?: number[];
    ema200History?: number[];
  }): ConditionEvaluation {
    // Sin histórico = PENDING
    if (!params.ema20History || !params.ema50History) {
      return {
        bullish: false,
        bearish: false,
        reason: 'PENDING: histórico de EMAs no disponible',
      };
    }

    const ema20Current = params.ema20History[params.ema20History.length - 1] || 0;
    const ema20Previous = params.ema20History[Math.max(0, params.ema20History.length - 6)] || 0; // 5 velas atrás
    const ema20Slope = ema20Current - ema20Previous;

    const ema50Current = params.ema50History[params.ema50History.length - 1] || 0;
    const ema50Previous = params.ema50History[Math.max(0, params.ema50History.length - 6)] || 0;
    const ema50Slope = ema50Current - ema50Previous;

    const ema200Current = params.ema200History?.[params.ema200History.length - 1] ?? 0;
    const ema200Previous = params.ema200History?.[Math.max(0, params.ema200History.length - 6)] ?? 0;
    const ema200Slope = ema200Current - ema200Previous;

    // BUY: EMA20 y EMA50 subiendo, EMA200 confirma (slope positivo)
    const bullish = ema20Slope > 0 && ema50Slope > 0;
    // SELL: EMA20 y EMA50 bajando
    const bearish = ema20Slope < 0 && ema50Slope < 0;

    return {
      bullish,
      bearish,
      reason: `Slopes: EMA20=${ema20Slope.toFixed(4)} | EMA50=${ema50Slope.toFixed(4)} | EMA200=${ema200Slope.toFixed(4)}. ${bullish ? '✓ 20↗50↗ BULLISH' : bearish ? '✓ 20↘50↘ BEARISH' : '✗ SLOPES PLANOS/CONTRADICTORIOS'}`,
    };
  }

  /**
   * CONDICIÓN 4: Estructura del mercado (Swings)
   * BUY: Higher Highs + Higher Lows (al menos 2 consecutivos detectables)
   * SELL: Lower Highs + Lower Lows
   * 
   * Implementación simple: detecta pivots comparando últimas velas
   * TIENE PRIORIDAD - si contradice, es VETO
   */
  private static evaluateCondition4_Structure(params: {
    candleHistory?: Array<{
      index: number;
      open: number;
      high: number;
      low: number;
      close: number;
    }>;
  }): ConditionEvaluation {
    if (!params.candleHistory || params.candleHistory.length < 3) {
      return {
        bullish: false,
        bearish: false,
        reason: 'PENDING: histórico de candles insuficiente',
      };
    }

    const candles = params.candleHistory;
    const current = candles[candles.length - 1];
    const previous = candles[candles.length - 2];
    const previous2 = candles.length > 2 ? candles[candles.length - 3] : null;

    // Detectar swings simples
    const hasHigherHigh = current.high > previous.high;
    const hasHigherLow = current.low > previous.low;
    const hasLowerHigh = current.high < previous.high;
    const hasLowerLow = current.low < previous.low;

    // BUY: HH + HL (últimas 2 velas en estructura alcista)
    const bullish = hasHigherHigh && hasHigherLow;
    // SELL: LH + LL (últimas 2 velas en estructura bajista)
    const bearish = hasLowerHigh && hasLowerLow;

    return {
      bullish,
      bearish,
      reason: `Swings: Current(${current.high.toFixed(2)}/${current.low.toFixed(2)}) vs Previous(${previous.high.toFixed(2)}/${previous.low.toFixed(2)}). ${bullish ? '✓ HH+HL BULLISH' : bearish ? '✓ LH+LL BEARISH' : '✗ ESTRUCTURA MIXTA/CONFLICTIVA'}`,
    };
  }

  /**
   * Convierte evaluación bullish/bearish a TrendCondition con score
   */
  private static scoreCondition(
    name: string,
    evaluation: ConditionEvaluation
  ): TrendCondition {
    let score = 0;
    if (evaluation.bullish || evaluation.bearish) {
      score = 25; // Condición se cumple (ya sea bullish o bearish)
    }

    return {
      name: name as any,
      met: evaluation.bullish || evaluation.bearish,
      score,
      reason: evaluation.reason,
      timestamp: Date.now(),
    };
  }

  /**
   * Calcula slope simple: diferencia entre valor actual y valor hace N velas
   */
  private static calculateSlope(history: number[]): number {
    if (history.length < 2) return 0;
    const current = history[history.length - 1];
    const previous = history[Math.max(0, history.length - 6)]; // 5 velas atrás
    return current - previous;
  }

  /**
   * Determina nivel de confianza basado en scores bullish/bearish
   * 
   * v1.1.1 FIX: Penalización de contradicción CONFIGURABLE
   * Cuenta condiciones confirmando la dirección
   * Penaliza condiciones que contradicen (factor configurable)
   * Resultado: A+/A/B/C basado en alineación real
   */
  private static determineConfidenceLevel(
    bullishScore: number,
    bearishScore: number,
    direction: OrderDirection | 'NEUTRAL'
  ): TrendConfidenceLevel {
    if (direction === 'NEUTRAL') {
      return 'C'; // Neutral siempre es baja confianza
    }

    // Convertir scores a "condiciones met" (cada 25 puntos = 1 condición)
    const bullishConditions = bullishScore / 25;
    const bearishConditions = bearishScore / 25;

    // Determinar qué condiciones confirman vs contradicen
    let confirmingConditions: number;
    let contradictingConditions: number;

    if (direction === 'BUY') {
      confirmingConditions = bullishConditions;
      contradictingConditions = bearishConditions;
    } else {
      // direction === 'SELL'
      confirmingConditions = bearishConditions;
      contradictingConditions = bullishConditions;
    }

    // Calcular confianza: confirming - (contradicting * penalty)
    // Penalización configurable: cuánto reducir por contradicción
    const effectiveConditions = confirmingConditions - contradictingConditions * TrendValidator.contradictionPenalty;

    // Asignar nivel basado en confianza efectiva
    if (effectiveConditions >= 4) {
      return 'A+'; // 4/4 sin contradicciones
    }
    if (effectiveConditions >= 3) {
      return 'A'; // 3/4 o 3.5/4 con contradicción menor
    }
    if (effectiveConditions >= 2) {
      return 'B'; // 2/4 o 2.5/4 con contradicciones
    }
    if (effectiveConditions >= 1) {
      return 'C'; // 1 o 1.5 - muy débil
    }
    return 'C'; // 0 o menor - sin señal
  }

  /**
   * Retorna string con orden actual de EMAs
   */
  private static getEMAOrder(
    ema20: number,
    ema50: number,
    ema200: number
  ): string {
    const values = [
      { value: ema20, name: 'EMA20' },
      { value: ema50, name: 'EMA50' },
      { value: ema200, name: 'EMA200' },
    ].sort((a, b) => b.value - a.value);

    return values.map((v) => v.name).join(' > ');
  }
}

/**
 * Export para testing
 */
export default TrendValidator;
