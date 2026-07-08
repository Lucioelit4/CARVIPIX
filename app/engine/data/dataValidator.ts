/**
 * Validador de calidad de datos
 * Valida que los datos de mercado cumplan con criterios mínimos
 */

import {
  Candle,
  Tick,
  TechnicalIndicators,
  MarketData,
  DataError,
  Asset,
  Timeframe,
} from '../types/marketData';

/**
 * Criterios mínimos de calidad
 */
interface QualityCriteria {
  maxLatencyMs: number; // Latencia máxima permitida
  minCompleteness: number; // % mínimo de datos completos
  maxFreshnessMs: number; // Máximo tiempo sin actualizar
  minCandleVolume: number; // Volumen mínimo en vela
  spreadThreshold: number; // Spread máximo permitido
  atrThreshold: number; // ATR mínimo para volatilidad
}

/**
 * Configuración de criterios por activo
 */
const QUALITY_CRITERIA: Record<Asset, QualityCriteria> = {
  XAUUSD: {
    maxLatencyMs: 200,
    minCompleteness: 90,
    maxFreshnessMs: 5000,
    minCandleVolume: 50000,
    spreadThreshold: 5, // pips
    atrThreshold: 0.1,
  },
  EURUSD: {
    maxLatencyMs: 150,
    minCompleteness: 92,
    maxFreshnessMs: 3000,
    minCandleVolume: 100000,
    spreadThreshold: 2,
    atrThreshold: 0.002,
  },
  GBPUSD: {
    maxLatencyMs: 150,
    minCompleteness: 92,
    maxFreshnessMs: 3000,
    minCandleVolume: 80000,
    spreadThreshold: 3,
    atrThreshold: 0.003,
  },
  BTCUSD: {
    maxLatencyMs: 300,
    minCompleteness: 85,
    maxFreshnessMs: 10000,
    minCandleVolume: 10,
    spreadThreshold: 100,
    atrThreshold: 50,
  },
};

/**
 * Validador de calidad de datos
 */
export class DataValidator {
  private errors: DataError[] = [];
  private maxErrors: number = 100;

  private isFinitePositive(value: number): boolean {
    return Number.isFinite(value) && value > 0;
  }

  /**
   * Validar vela OHLC
   */
  validateCandle(candle: Candle): { valid: boolean; errors: DataError[] } {
    const errors: DataError[] = [];

    if (
      !Number.isFinite(candle.timestamp) ||
      !this.isFinitePositive(candle.open) ||
      !this.isFinitePositive(candle.high) ||
      !this.isFinitePositive(candle.low) ||
      !this.isFinitePositive(candle.close) ||
      !Number.isFinite(candle.volume)
    ) {
      errors.push({
        timestamp: Date.now(),
        asset: candle.asset,
        timeframe: candle.timeframe,
        errorType: 'invalid',
        message: 'Candle contiene valores no finitos o inválidos',
        severity: 'error',
      });
    }

    // Validar que open, high, low, close sean válidos
    if (candle.open <= 0 || candle.high <= 0 || candle.low <= 0 || candle.close <= 0) {
      errors.push({
        timestamp: Date.now(),
        asset: candle.asset,
        timeframe: candle.timeframe,
        errorType: 'invalid',
        message: 'Precios negativos o cero detectados',
        severity: 'error',
      });
    }

    // Validar relación high > low
    if (candle.high < candle.low) {
      errors.push({
        timestamp: Date.now(),
        asset: candle.asset,
        timeframe: candle.timeframe,
        errorType: 'invalid',
        message: 'High es menor que Low',
        severity: 'error',
      });
    }

    // Validar que open y close están dentro de high/low
    if (candle.open > candle.high || candle.open < candle.low) {
      errors.push({
        timestamp: Date.now(),
        asset: candle.asset,
        timeframe: candle.timeframe,
        errorType: 'invalid',
        message: 'Open está fuera del rango High/Low',
        severity: 'warning',
      });
    }

    if (candle.close > candle.high || candle.close < candle.low) {
      errors.push({
        timestamp: Date.now(),
        asset: candle.asset,
        timeframe: candle.timeframe,
        errorType: 'invalid',
        message: 'Close está fuera del rango High/Low',
        severity: 'warning',
      });
    }

    // Validar volumen mínimo
    const criteria = QUALITY_CRITERIA[candle.asset];
    if (candle.volume < criteria.minCandleVolume) {
      errors.push({
        timestamp: Date.now(),
        asset: candle.asset,
        timeframe: candle.timeframe,
        errorType: 'incomplete',
        message: `Volumen bajo: ${candle.volume} < ${criteria.minCandleVolume}`,
        severity: 'warning',
      });
    }

    // Validar antigüedad
    const ageMs = Date.now() - candle.timestamp;
    if (ageMs > criteria.maxFreshnessMs) {
      errors.push({
        timestamp: Date.now(),
        asset: candle.asset,
        timeframe: candle.timeframe,
        errorType: 'delayed',
        message: `Datos retrasados: ${ageMs}ms > ${criteria.maxFreshnessMs}ms`,
        severity: 'warning',
      });
    }

    return {
      valid: errors.filter((e) => e.severity === 'error').length === 0,
      errors,
    };
  }

  /**
   * Validar tick en vivo
   */
  validateTick(tick: Tick): { valid: boolean; errors: DataError[] } {
    const errors: DataError[] = [];

    if (
      !Number.isFinite(tick.timestamp) ||
      !this.isFinitePositive(tick.bid) ||
      !this.isFinitePositive(tick.ask) ||
      !Number.isFinite(tick.lastUpdate)
    ) {
      errors.push({
        timestamp: Date.now(),
        asset: tick.asset,
        errorType: 'invalid',
        message: 'Tick contiene valores no finitos o inválidos',
        severity: 'error',
      });
    }

    // Validar bid/ask válidos
    if (tick.bid <= 0 || tick.ask <= 0) {
      errors.push({
        timestamp: Date.now(),
        asset: tick.asset,
        errorType: 'invalid',
        message: 'Bid o Ask negativos',
        severity: 'error',
      });
    }

    // Validar que ask >= bid
    if (tick.ask < tick.bid) {
      errors.push({
        timestamp: Date.now(),
        asset: tick.asset,
        errorType: 'invalid',
        message: 'Ask < Bid (inversión de precios)',
        severity: 'error',
      });
    }

    // Validar spread
    const spread = tick.ask - tick.bid;
    const criteria = QUALITY_CRITERIA[tick.asset];
    const spreadThreshold = criteria.spreadThreshold / 10000; // Convertir pips a valor

    if (spread > spreadThreshold * 2) {
      errors.push({
        timestamp: Date.now(),
        asset: tick.asset,
        errorType: 'invalid',
        message: `Spread anormalmente alto: ${spread}`,
        severity: 'warning',
      });
    }

    // Validar actualización reciente
    const ageMs = Date.now() - tick.lastUpdate;
    if (ageMs > criteria.maxFreshnessMs) {
      errors.push({
        timestamp: Date.now(),
        asset: tick.asset,
        errorType: 'delayed',
        message: `Tick retrasado: ${ageMs}ms`,
        severity: 'warning',
      });
    }

    return {
      valid: errors.filter((e) => e.severity === 'error').length === 0,
      errors,
    };
  }

  /**
   * Validar indicadores técnicos
   */
  validateIndicators(indicators: TechnicalIndicators, asset: Asset): { valid: boolean; errors: DataError[] } {
    const errors: DataError[] = [];

    const numericFields = [
      indicators.ema20,
      indicators.ema50,
      indicators.ema200,
      indicators.atr,
      indicators.rsi,
      indicators.spread,
      indicators.volatility,
      indicators.timestamp,
    ];

    if (numericFields.some((value) => !Number.isFinite(value))) {
      errors.push({
        timestamp: Date.now(),
        asset,
        errorType: 'invalid',
        message: 'Indicadores contienen valores no finitos',
        severity: 'error',
      });
    }

    // Validar que EMA 20 < 50 < 200 (tendencia típica)
    // Nota: puede haber excepciones en mercados extremos
    const emaOrder = [indicators.ema20, indicators.ema50, indicators.ema200].sort();
    const expectedOrder = [indicators.ema20, indicators.ema50, indicators.ema200];

    // Solo warning si no cumplen orden esperada (no es error crítico)
    if (Math.abs(indicators.ema20 - emaOrder[0]) > 0.1) {
      errors.push({
        timestamp: Date.now(),
        asset,
        errorType: 'invalid',
        message: 'Orden de EMAs no convencional',
        severity: 'warning',
      });
    }

    // Validar RSI 0-100
    if (indicators.rsi < 0 || indicators.rsi > 100) {
      errors.push({
        timestamp: Date.now(),
        asset,
        errorType: 'invalid',
        message: `RSI fuera de rango: ${indicators.rsi}`,
        severity: 'error',
      });
    }

    // Validar ATR positivo
    if (indicators.atr <= 0) {
      errors.push({
        timestamp: Date.now(),
        asset,
        errorType: 'invalid',
        message: 'ATR no positivo',
        severity: 'error',
      });
    }

    // Validar spread positivo
    if (indicators.spread <= 0) {
      errors.push({
        timestamp: Date.now(),
        asset,
        errorType: 'invalid',
        message: 'Spread no positivo',
        severity: 'error',
      });
    }

    // Validar volatilidad razonable (0-5%)
    if (indicators.volatility < 0 || indicators.volatility > 5) {
      errors.push({
        timestamp: Date.now(),
        asset,
        errorType: 'invalid',
        message: `Volatilidad fuera de rango: ${indicators.volatility}%`,
        severity: 'warning',
      });
    }

    return {
      valid: errors.filter((e) => e.severity === 'error').length === 0,
      errors,
    };
  }

  /**
   * Validar datos completos de mercado
   */
  validateMarketData(data: MarketData): { valid: boolean; errors: DataError[] } {
    const allErrors: DataError[] = [];

    // Validar cada componente
    const candleValidation = this.validateCandle(data.candle);
    const tickValidation = this.validateTick(data.tick);
    const indicatorsValidation = this.validateIndicators(data.indicators, data.asset);

    allErrors.push(...candleValidation.errors);
    allErrors.push(...tickValidation.errors);
    allErrors.push(...indicatorsValidation.errors);

    // Validar timestamp consistente
    if (Math.abs(data.candle.timestamp - data.tick.timestamp) > 5000) {
      allErrors.push({
        timestamp: Date.now(),
        asset: data.asset,
        timeframe: data.timeframe,
        errorType: 'invalid',
        message: 'Timestamps de candle y tick desincronizados',
        severity: 'warning',
      });
    }

    // Registrar errores
    allErrors.forEach((error) => this.addError(error));

    return {
      valid: allErrors.filter((e) => e.severity === 'error').length === 0,
      errors: allErrors,
    };
  }

  /**
   * Agregar error al registro
   */
  private addError(error: DataError) {
    this.errors.push(error);
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }
  }

  /**
   * Obtener errores recientes
   */
  getRecentErrors(limit: number = 10): DataError[] {
    return this.errors.slice(-limit);
  }

  /**
   * Obtener total de errores registrados
   */
  getTotalErrors(): number {
    return this.errors.length;
  }

  /**
   * Resetear registro de errores
   */
  reset() {
    this.errors = [];
  }

  /**
   * Obtener criterios de un activo
   */
  getCriteria(asset: Asset): QualityCriteria {
    return QUALITY_CRITERIA[asset];
  }

  /**
   * Actualizar criterios personalizados
   */
  setCriteria(asset: Asset, criteria: Partial<QualityCriteria>) {
    QUALITY_CRITERIA[asset] = {
      ...QUALITY_CRITERIA[asset],
      ...criteria,
    };
  }
}

/**
 * Instancia global del validador
 */
let validatorInstance: DataValidator | null = null;

export function getDataValidator(): DataValidator {
  if (!validatorInstance) {
    validatorInstance = new DataValidator();
  }
  return validatorInstance;
}

export default DataValidator;
