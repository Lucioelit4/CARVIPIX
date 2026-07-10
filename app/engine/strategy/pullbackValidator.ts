import { getPullbackValidatorConfig } from './pullbackValidatorConfig';

export type PullbackDirection = 'BUY' | 'SELL' | 'NEUTRAL';
export type PullbackClassification = 'A+' | 'A' | 'B' | 'C' | 'Rechazada';
export type PullbackStatus = 'OK' | 'DATA_NOT_READY';

export type PullbackValidationCondition = {
  name: string;
  critical: boolean;
  passed: boolean;
  observedValue: number | string | boolean;
  requiredValue: string;
  reason: string;
};

export type PullbackCandle = {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  complete: boolean;
};

export interface PullbackValidationInput {
  trendDirection1H: PullbackDirection;
  trendConfidence1H: 'A+' | 'A' | 'B' | 'C';
  trendCandle1H: PullbackCandle;
  trendEMA1H: { ema20: number; ema50: number; ema200: number };

  candles45M: PullbackCandle[];
  ema45M: { ema20: number; ema50: number; ema200: number };

  candle5M: PullbackCandle;
  expectedLast45MCloseTimestamp: number;
  timezone: 'UTC';

  atr45M: number;
  movementStrength: number;
  rejectionCandleDetected: boolean;
  continuationDetected: boolean;
  validBreakout: boolean;
  falseBreakout: boolean;
  exhaustionDetected: boolean;
}

export interface PullbackValidationResult {
  status: PullbackStatus;
  valid: boolean;
  direction: PullbackDirection;
  classification: PullbackClassification;
  score: number;
  confidence: number;
  conditionsPassed: PullbackValidationCondition[];
  conditionsFailed: PullbackValidationCondition[];
  invalidationReason: string | null;
  entryReady: boolean;
  waitingForConfirmation: boolean;
  timestamp: number;
  engineVersion: string;
}

const ENGINE_VERSION = 'CARVIPIX_ENGINE_v1.0';

function isFinitePositive(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

function chronological(candles: PullbackCandle[]): boolean {
  for (let i = 1; i < candles.length; i++) {
    if (candles[i].timestamp <= candles[i - 1].timestamp) {
      return false;
    }
  }
  return true;
}

function classify(score: number): PullbackClassification {
  if (score >= 90) return 'A+';
  if (score >= 80) return 'A';
  if (score >= 70) return 'B';
  if (score >= 60) return 'C';
  return 'Rechazada';
}

function condition(
  name: string,
  critical: boolean,
  passed: boolean,
  observedValue: number | string | boolean,
  requiredValue: string,
  reason: string
): PullbackValidationCondition {
  return { name, critical, passed, observedValue, requiredValue, reason };
}

export class PullbackValidator {
  static validatePullback(input: PullbackValidationInput): PullbackValidationResult {
    const cfg = getPullbackValidatorConfig();
    const ts = Date.now();

    const failed: PullbackValidationCondition[] = [];
    const passed: PullbackValidationCondition[] = [];

    const push = (c: PullbackValidationCondition) => (c.passed ? passed.push(c) : failed.push(c));

    const hasData =
      input.candles45M.length >= 3 &&
      isFinitePositive(input.atr45M) &&
      input.trendCandle1H.complete &&
      input.candle5M.complete;

    push(
      condition(
        'DATA_SUFFICIENCY',
        true,
        hasData,
        input.candles45M.length,
        '>=3 candles45M + atr45M>0 + candles completos',
        hasData ? 'Bloque de datos suficiente' : 'Bloque de datos insuficiente'
      )
    );

    const alignedClose45M =
      input.candles45M[input.candles45M.length - 1]?.timestamp === input.expectedLast45MCloseTimestamp;

    const strictChronology = chronological(input.candles45M);
    const noFutureLeak = input.candle5M.timestamp <= input.expectedLast45MCloseTimestamp;

    push(
      condition(
        'TIMEFRAME_SYNC',
        true,
        alignedClose45M && strictChronology && noFutureLeak,
        `aligned=${alignedClose45M},chronology=${strictChronology},noFutureLeak=${noFutureLeak}`,
        '45M cerrado exacto, secuencia cronologica, sin vela 5M futura',
        alignedClose45M && strictChronology && noFutureLeak
          ? 'Temporalidades sincronizadas'
          : 'Temporalidades desincronizadas'
      )
    );

    const criticalDataReady = failed.filter((c) => c.critical).length === 0;
    if (!criticalDataReady) {
      return {
        status: 'DATA_NOT_READY',
        valid: false,
        direction: 'NEUTRAL',
        classification: 'Rechazada',
        score: 0,
        confidence: 0,
        conditionsPassed: passed,
        conditionsFailed: failed,
        invalidationReason: 'DATA_NOT_READY',
        entryReady: false,
        waitingForConfirmation: false,
        timestamp: ts,
        engineVersion: ENGINE_VERSION,
      };
    }

    const direction = input.trendDirection1H;
    const directionValid = direction === 'BUY' || direction === 'SELL';
    push(
      condition(
        'TREND_DIRECTION_1H',
        true,
        directionValid,
        direction,
        'BUY o SELL',
        directionValid ? 'Direccion principal valida' : 'Direccion neutral sin contexto operativo'
      )
    );

    const emaAligned45M =
      direction === 'BUY'
        ? input.ema45M.ema20 > input.ema45M.ema50 && input.ema45M.ema50 > input.ema45M.ema200
        : input.ema45M.ema20 < input.ema45M.ema50 && input.ema45M.ema50 < input.ema45M.ema200;

    push(
      condition(
        'EMA_ALIGNMENT_45M',
        true,
        emaAligned45M,
        `${input.ema45M.ema20.toFixed(5)}/${input.ema45M.ema50.toFixed(5)}/${input.ema45M.ema200.toFixed(5)}`,
        direction === 'BUY' ? 'EMA20>EMA50>EMA200' : 'EMA20<EMA50<EMA200',
        emaAligned45M ? 'Alineacion EMA consistente con tendencia' : 'Alineacion EMA inconsistente'
      )
    );

    const latest = input.candles45M[input.candles45M.length - 1];
    const prev = input.candles45M[input.candles45M.length - 2];

    const structurePreserved =
      direction === 'BUY'
        ? latest.low >= prev.low * 0.999
        : latest.high <= prev.high * 1.001;

    push(
      condition(
        'STRUCTURE_PRESERVED_45M',
        true,
        structurePreserved,
        direction === 'BUY' ? latest.low.toFixed(5) : latest.high.toFixed(5),
        direction === 'BUY' ? `>=${(prev.low * 0.999).toFixed(5)}` : `<=${(prev.high * 1.001).toFixed(5)}`,
        structurePreserved ? 'Estructura conservada' : 'Perdida de estructura'
      )
    );

    const pullbackDistance =
      direction === 'BUY'
        ? Math.max(0, input.ema45M.ema20 - latest.close)
        : Math.max(0, latest.close - input.ema45M.ema20);
    const pullbackNormalized = input.atr45M > 0 ? pullbackDistance / input.atr45M : Number.POSITIVE_INFINITY;

    const depthMin = cfg.pullbackDepth?.minAtrMultiple ?? 0.2;
    const depthMax = cfg.pullbackDepth?.maxAtrMultiple ?? 1.25;
    const depthValid = pullbackNormalized >= depthMin && pullbackNormalized <= depthMax;
    push(
      condition(
        'PULLBACK_DEPTH',
        true,
        depthValid,
        Number(pullbackNormalized.toFixed(4)),
        `${depthMin}..${depthMax} ATR`,
        depthValid ? 'Profundidad de retroceso valida' : 'Profundidad fuera de rango'
      )
    );

    const criticalFailed = failed.filter((c) => c.critical);
    if (criticalFailed.length > 0) {
      return {
        status: 'OK',
        valid: false,
        direction,
        classification: 'Rechazada',
        score: 0,
        confidence: 0,
        conditionsPassed: passed,
        conditionsFailed: failed,
        invalidationReason: criticalFailed[0].name,
        entryReady: false,
        waitingForConfirmation: false,
        timestamp: ts,
        engineVersion: ENGINE_VERSION,
      };
    }

    const closeToEMAs =
      direction === 'BUY'
        ? latest.close >= input.ema45M.ema50
        : latest.close <= input.ema45M.ema50;
    push(
      condition(
        'DISTANCE_TO_EMA50',
        false,
        closeToEMAs,
        latest.close.toFixed(5),
        direction === 'BUY' ? `>=${input.ema45M.ema50.toFixed(5)}` : `<=${input.ema45M.ema50.toFixed(5)}`,
        closeToEMAs ? 'Precio mantiene zona de medias' : 'Precio lejos de media de control'
      )
    );

    push(
      condition(
        'REJECTION_CANDLE',
        false,
        input.rejectionCandleDetected,
        input.rejectionCandleDetected,
        'true',
        input.rejectionCandleDetected ? 'Vela de rechazo detectada' : 'Sin vela de rechazo'
      )
    );

    push(
      condition(
        'CONTINUATION_SIGNAL',
        false,
        input.continuationDetected,
        input.continuationDetected,
        'true',
        input.continuationDetected ? 'Continuacion detectada' : 'Sin continuacion aun'
      )
    );

    push(
      condition(
        'BREAKOUT_VALIDITY',
        false,
        input.validBreakout && !input.falseBreakout,
        `valid=${input.validBreakout},false=${input.falseBreakout}`,
        'valid=true,false=false',
        input.validBreakout && !input.falseBreakout ? 'Ruptura valida' : 'Ruptura invalida o falsa'
      )
    );

    const volatilityOk = input.atr45M <= cfg.volatility.maxAtr;
    push(
      condition(
        'VOLATILITY_CHECK',
        false,
        volatilityOk,
        Number(input.atr45M.toFixed(5)),
        `<=${cfg.volatility.maxAtr}`,
        volatilityOk ? 'Volatilidad dentro de limite' : 'Volatilidad excesiva'
      )
    );

    const strengthOk = input.movementStrength >= cfg.movement.minStrength;
    push(
      condition(
        'MOVEMENT_STRENGTH',
        false,
        strengthOk,
        Number(input.movementStrength.toFixed(2)),
        `>=${cfg.movement.minStrength}`,
        strengthOk ? 'Fuerza de movimiento suficiente' : 'Fuerza de movimiento insuficiente'
      )
    );

    const noExhaustion = !input.exhaustionDetected;
    push(
      condition(
        'NO_EXHAUSTION',
        false,
        noExhaustion,
        input.exhaustionDetected,
        'false',
        noExhaustion ? 'Sin agotamiento' : 'Agotamiento detectado'
      )
    );

    const secondaryPassCount = passed.filter((c) => !c.critical).length;
    const secondaryTotal = passed.filter((c) => !c.critical).length + failed.filter((c) => !c.critical).length;

    const score = Math.round((secondaryPassCount / Math.max(1, secondaryTotal)) * 100);
    const confidenceBase = input.trendConfidence1H === 'A+' ? 95 : input.trendConfidence1H === 'A' ? 88 : input.trendConfidence1H === 'B' ? 78 : 65;
    const confidence = Math.max(0, Math.min(100, Math.round((confidenceBase * 0.6) + (score * 0.4))));

    const classification = classify(score);
    const valid = classification !== 'Rechazada' && classification !== 'C';
    const entryReady = valid && input.rejectionCandleDetected && input.continuationDetected;
    const waitingForConfirmation = valid && !entryReady;

    return {
      status: 'OK',
      valid,
      direction,
      classification,
      score,
      confidence,
      conditionsPassed: passed,
      conditionsFailed: failed,
      invalidationReason: valid ? null : failed[0]?.name ?? 'INSUFFICIENT_QUALITY',
      entryReady,
      waitingForConfirmation,
      timestamp: ts,
      engineVersion: ENGINE_VERSION,
    };
  }
}

export function integratePullbackValidation(input: PullbackValidationInput): PullbackValidationResult {
  return PullbackValidator.validatePullback(input);
}

export default PullbackValidator;
