/**
 * CARVIPIX Trend Validation System
 * Clasificación por niveles: A+, A, B, C
 * No reglas binarias - evaluación por puntos
 */

import { TrendValidation, TrendCondition, TrendConfidenceLevel, OrderDirection } from '../trading/tradingEngine';

/**
 * Evaluador de tendencia por niveles
 */
export class TrendValidator {
  /**
   * Evalúa tendencia usando 4 condiciones
   * Retorna A+ (4/4), A (3/4), B (3/4 con baja confianza), C (2/4 o menos)
   */
  static validateTrend(params: {
    timeframe: '1H';
    asset: string;
    
    // Precios y EMAs necesarios
    currentPrice: number;
    ema20: number;
    ema50: number;
    ema200: number;
    
    // Histórico (PENDING: exacto qué necesitamos)
    last3CandlesDirections?: ('UP' | 'DOWN')[];
    lastHighPrice?: number;
    lastLowPrice?: number;
    
    // Slope de EMAs (PENDING: método de cálculo)
    ema20Slope?: number;
    ema50Slope?: number;
    ema200Slope?: number;
  }): TrendValidation {
    const conditions: TrendCondition[] = [];
    let totalScore = 0;

    // CONDICIÓN 1: Precio respecto a EMA200
    const condition1 = this.evaluateCondition1_PriceVsEMA200({
      currentPrice: params.currentPrice,
      ema200: params.ema200,
      asset: params.asset,
    });
    conditions.push(condition1);
    totalScore += condition1.score;

    // CONDICIÓN 2: Orden de EMAs
    const condition2 = this.evaluateCondition2_EMAOrder({
      ema20: params.ema20,
      ema50: params.ema50,
      ema200: params.ema200,
    });
    conditions.push(condition2);
    totalScore += condition2.score;

    // CONDICIÓN 3: Pendiente de EMAs
    const condition3 = this.evaluateCondition3_EMASlope({
      ema20Slope: params.ema20Slope,
      ema50Slope: params.ema50Slope,
      ema200Slope: params.ema200Slope,
    });
    conditions.push(condition3);
    totalScore += condition3.score;

    // CONDICIÓN 4: Estructura del mercado
    const condition4 = this.evaluateCondition4_Structure({
      lastHighPrice: params.lastHighPrice,
      lastLowPrice: params.lastLowPrice,
      last3CandlesDirections: params.last3CandlesDirections,
    });
    conditions.push(condition4);
    totalScore += condition4.score;

    // Determinar nivel de confianza
    const metCount = conditions.filter((c) => c.met).length;
    const confidenceLevel = this.determineConfidenceLevel(
      metCount,
      conditions,
      totalScore
    );

    // Determinar dirección
    const direction = this.determineDirection(conditions);

    return {
      timeframe: '1H',
      direction,
      confidenceLevel,
      conditions,
      totalScore,
      
      priceVsEMA200: {
        met: condition1.met,
        price: params.currentPrice,
        ema200: params.ema200,
        distance: Math.abs(params.currentPrice - params.ema200),
        reasoning: 'PENDING: criterio exacto v1.1 - ¿cuántos pips arriba/abajo de EMA200?',
      },
      
      emaOrder: {
        met: condition2.met,
        ema20: params.ema20,
        ema50: params.ema50,
        ema200: params.ema200,
        expectedOrder: 'PENDING: qué orden es válida para UP/DOWN',
        actualOrder: this.getEMAOrder(params.ema20, params.ema50, params.ema200),
      },
      
      emaSlope: {
        met: condition3.met,
        ema20Slope: params.ema20Slope ?? 0,
        ema50Slope: params.ema50Slope ?? 0,
        ema200Slope: params.ema200Slope ?? 0,
        slopeDirection: 'FLAT', // PENDING: calcular FLAT threshold
        reasoning: 'PENDING: qué pendiente es suficiente',
      },
      
      structure: {
        met: condition4.met,
        lastHighPrice: params.lastHighPrice ?? 0,
        lastLowPrice: params.lastLowPrice ?? 0,
        higherHighs: false, // PENDING: calcular
        higherLows: false, // PENDING: calcular
        lowerHighs: false, // PENDING: calcular
        lowerLows: false, // PENDING: calcular
        priority: 'OVERRIDE_OTHERS',
        contradicts: false, // PENDING: detectar contradicción
      },
      
      timestamp: Date.now(),
    };
  }

  /**
   * CONDICIÓN 1: Precio respecto a EMA200
   * Métrica: ¿Precio está en el lado correcto de EMA200?
   */
  private static evaluateCondition1_PriceVsEMA200(params: {
    currentPrice: number;
    ema200: number;
    asset: string;
  }): TrendCondition {
    // PENDING: Criterio exacto en v1.1
    // Ejemplo: "Precio > EMA200 + 10 pips para UP"
    // O: "Precio > EMA200 para UP con cualquier distancia"

    const priceAboveEMA = params.currentPrice > params.ema200;

    return {
      name: 'PRICE_VS_EMA200',
      met: priceAboveEMA, // PENDING: refinar
      score: priceAboveEMA ? 25 : 0,
      reason: `Precio ${priceAboveEMA ? 'ARRIBA' : 'ABAJO'} de EMA200 (${params.currentPrice.toFixed(2)} vs ${params.ema200.toFixed(2)})`,
      timestamp: Date.now(),
    };
  }

  /**
   * CONDICIÓN 2: Orden de EMAs
   * Métrica: ¿EMAs están en orden correcto?
   */
  private static evaluateCondition2_EMAOrder(params: {
    ema20: number;
    ema50: number;
    ema200: number;
  }): TrendCondition {
    // PENDING: Definir qué orden es válida
    // UP: 20 > 50 > 200 (typical)
    // O: 20 > 50, sin importar 200
    // O: algo más complejo

    const validOrderUP = params.ema20 > params.ema50 && params.ema50 > params.ema200;
    // const validOrderDOWN = params.ema20 < params.ema50 && params.ema50 < params.ema200;

    return {
      name: 'EMA_ORDER',
      met: validOrderUP, // PENDING: refinar
      score: validOrderUP ? 25 : 0,
      reason: `EMA order: 20=${params.ema20.toFixed(2)}, 50=${params.ema50.toFixed(2)}, 200=${params.ema200.toFixed(2)}. ${validOrderUP ? 'VÁLIDO' : 'INVÁLIDO'}`,
      timestamp: Date.now(),
    };
  }

  /**
   * CONDICIÓN 3: Pendiente de EMAs
   * Métrica: ¿EMAs tienen pendiente en la dirección?
   */
  private static evaluateCondition3_EMASlope(params: {
    ema20Slope?: number;
    ema50Slope?: number;
    ema200Slope?: number;
  }): TrendCondition {
    // PENDING: Definir threshold para slope
    // Ejemplo: "Slope > 0.5" para validar UP
    // O: "Slope > X pero < Y" para evitar sobrecalentamiento

    const hasSlope =
      (params.ema20Slope ?? 0) > 0 &&
      (params.ema50Slope ?? 0) > 0 &&
      (params.ema200Slope ?? 0) > 0;

    return {
      name: 'EMA_SLOPE',
      met: hasSlope, // PENDING: refinar
      score: hasSlope ? 25 : 0,
      reason: `EMA slopes: 20=${(params.ema20Slope ?? 0).toFixed(4)}, 50=${(params.ema50Slope ?? 0).toFixed(4)}, 200=${(params.ema200Slope ?? 0).toFixed(4)}. ${hasSlope ? 'CRECIENTES' : 'PLANAS/DECRECIENTES'}`,
      timestamp: Date.now(),
    };
  }

  /**
   * CONDICIÓN 4: Estructura del mercado
   * Métrica: ¿Hay máximos crecientes (UP) o decrecientes (DOWN)?
   * TIENE PRIORIDAD - si contradice, bajar confianza o cancelar
   */
  private static evaluateCondition4_Structure(params: {
    lastHighPrice?: number;
    lastLowPrice?: number;
    last3CandlesDirections?: ('UP' | 'DOWN')[];
  }): TrendCondition {
    // PENDING: Definir criteria exacta
    // Típicamente: 2+ higher highs + 2+ higher lows para UP
    // O: últimas 3 velas en dirección correcta
    // O: combinación de ambos

    const hasStructure = params.last3CandlesDirections
      ? params.last3CandlesDirections.filter((d) => d === 'UP').length >= 2
      : false;

    return {
      name: 'STRUCTURE',
      met: hasStructure, // PENDING: refinar
      score: hasStructure ? 25 : 0,
      reason: `Estructura: ${params.last3CandlesDirections?.join(', ') || 'NO DISPONIBLE'}. ${hasStructure ? 'VÁLIDA' : 'DÉBIL'}. PRIORIDAD: si contradice, cancelar señal.`,
      timestamp: Date.now(),
    };
  }

  /**
   * Determina nivel de confianza (A+, A, B, C)
   */
  private static determineConfidenceLevel(
    metCount: number,
    conditions: TrendCondition[],
    totalScore: number
  ): TrendConfidenceLevel {
    if (metCount === 4) {
      return 'A+';
    }
    if (metCount === 3) {
      // Verificar si hay baja confianza (scores bajos en esas 3)
      const avgScore = totalScore / 3;
      return avgScore > 20 ? 'A' : 'B';
    }
    if (metCount >= 2) {
      return 'C';
    }
    return 'C';
  }

  /**
   * Determina dirección (UP, DOWN o NEUTRAL)
   */
  private static determineDirection(conditions: TrendCondition[]): OrderDirection | 'NEUTRAL' {
    // PENDING: Lógica exacta
    // Por ahora: si mayoría de condiciones met = UP
    const metCount = conditions.filter((c) => c.met).length;
    
    if (metCount >= 3) {
      return 'BUY';
    }
    if (metCount <= 1) {
      return 'SELL';
    }
    return 'NEUTRAL';
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
