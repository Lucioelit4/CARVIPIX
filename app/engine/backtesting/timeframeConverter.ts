/**
 * Timeframe Converter - Convierte candles entre diferentes timeframes
 * Solo para análisis privado en admin panel
 * Reglas OHLC estándar para consolidación de timeframes
 */

import { Candle, Timeframe } from '../types/marketData';

/**
 * Mapeo de timeframes a minutos
 */
const TIMEFRAME_MINUTES: Record<Timeframe, number> = {
  '5M': 5,
  '45M': 45,
  '1H': 60,
};

/**
 * Información de calidad de conversión
 */
export interface TimeframeQuality {
  timeframe: Timeframe;
  totalCandles: number;
  completeCandles: number;
  incompleteCandles: number;
  gapsDetected: number;
  gapDetails: { index: number; expectedGap: number; actualGap: number }[];
  dataQuality: number; // 0-100
  issues: string[];
}

/**
 * Resultado de conversión multi-timeframe
 */
export interface MultiTimeframeResult {
  original: {
    timeframe: Timeframe;
    candleCount: number;
    startTime: number;
    endTime: number;
  };
  converted: Record<Timeframe, Candle[]>;
  quality: Record<Timeframe, TimeframeQuality>;
}

/**
 * Obtiene timeframes derivados disponibles basados en el timeframe de origen
 */
export function getAvailableTimeframes(sourceTimeframe: Timeframe): Timeframe[] {
  switch (sourceTimeframe) {
    case '5M':
      return ['45M', '1H'];
    case '45M':
      return ['1H'];
    case '1H':
      return []; // No hay conversión para H1
    default:
      return [];
  }
}

/**
 * Convierte candles de un timeframe a otro (mayor)
 * El timeframe destino debe ser mayor que el origen
 */
export function convertTimeframe(
  candles: Candle[],
  sourceTimeframe: Timeframe,
  targetTimeframe: Timeframe
): {
  candles: Candle[];
  quality: TimeframeQuality;
} {
  if (candles.length === 0) {
    throw new Error('No candles to convert');
  }

  const sourceMinutes = TIMEFRAME_MINUTES[sourceTimeframe];
  const targetMinutes = TIMEFRAME_MINUTES[targetTimeframe];

  if (targetMinutes <= sourceMinutes) {
    throw new Error(`Cannot convert from ${sourceTimeframe} to ${targetTimeframe}: target must be larger`);
  }

  if (targetMinutes % sourceMinutes !== 0) {
    throw new Error(
      `Cannot convert from ${sourceTimeframe} to ${targetTimeframe}: not a clean multiple (${targetMinutes} / ${sourceMinutes})`
    );
  }

  const candlesPerBar = targetMinutes / sourceMinutes;

  // Agrupar candles
  const converted: Candle[] = [];
  const gapDetails: { index: number; expectedGap: number; actualGap: number }[] = [];
  let lastTimestamp = candles[0].timestamp;

  for (let i = 0; i < candles.length; i += candlesPerBar) {
    const group = candles.slice(i, Math.min(i + candlesPerBar, candles.length));

    if (group.length === 0) continue;

    // Detectar gaps
    if (i > 0) {
      const expectedGap = sourceMinutes * 60 * 1000; // esperado (en ms)
      const actualGap = group[0].timestamp - lastTimestamp;

      if (actualGap > expectedGap * 1.5) {
        // Más de 50% de variación
        gapDetails.push({
          index: converted.length,
          expectedGap,
          actualGap,
        });
      }
    }

    // Reglas OHLC
    const consolidatedCandle: Candle = {
      timestamp: group[0].timestamp, // Open del primer candle
      open: group[0].open,
      high: Math.max(...group.map((c) => c.high)),
      low: Math.min(...group.map((c) => c.low)),
      close: group[group.length - 1].close, // Close del último
      volume: group.reduce((sum, c) => sum + c.volume, 0),
      asset: group[0].asset,
      timeframe: targetTimeframe,
      complete: group.length === candlesPerBar, // Solo completo si tiene todos
    };

    converted.push(consolidatedCandle);
    lastTimestamp = group[group.length - 1].timestamp;
  }

  // Calcular calidad
  const completeCandles = converted.filter((c) => c.complete).length;
  const incompleteCandles = converted.length - completeCandles;
  const dataQuality = Math.round((completeCandles / converted.length) * 100);

  const issues: string[] = [];
  if (gapDetails.length > 0) {
    issues.push(`${gapDetails.length} gaps detectados`);
  }
  if (incompleteCandles > 0) {
    issues.push(`${incompleteCandles} candles incompletos (faltan datos)`);
  }

  const quality: TimeframeQuality = {
    timeframe: targetTimeframe,
    totalCandles: converted.length,
    completeCandles,
    incompleteCandles,
    gapsDetected: gapDetails.length,
    gapDetails,
    dataQuality,
    issues,
  };

  return { candles: converted, quality };
}

/**
 * Convierte candles a múltiples timeframes derivados
 * Retorna un mapa de timeframe -> candles + info de calidad
 */
export function convertToMultipleTimeframes(
  candles: Candle[],
  sourceTimeframe: Timeframe
): MultiTimeframeResult {
  if (candles.length === 0) {
    throw new Error('No candles to convert');
  }

  const availableTimeframes = getAvailableTimeframes(sourceTimeframe);
  const converted: Record<Timeframe, Candle[]> = {} as Record<Timeframe, Candle[]>;
  const quality: Record<Timeframe, TimeframeQuality> = {} as Record<Timeframe, TimeframeQuality>;

  for (const targetTimeframe of availableTimeframes) {
    try {
      const result = convertTimeframe(candles, sourceTimeframe, targetTimeframe);
      converted[targetTimeframe] = result.candles;
      quality[targetTimeframe] = result.quality;
    } catch (error) {
      console.warn(`Failed to convert to ${targetTimeframe}:`, error);
      converted[targetTimeframe] = [];
      quality[targetTimeframe] = {
        timeframe: targetTimeframe,
        totalCandles: 0,
        completeCandles: 0,
        incompleteCandles: 0,
        gapsDetected: 0,
        gapDetails: [],
        dataQuality: 0,
        issues: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  return {
    original: {
      timeframe: sourceTimeframe,
      candleCount: candles.length,
      startTime: candles[0].timestamp,
      endTime: candles[candles.length - 1].timestamp,
    },
    converted,
    quality,
  };
}

/**
 * Valida integridad de candles para conversión
 */
export function validateCandlesForConversion(
  candles: Candle[],
  sourceTimeframe: Timeframe
): {
  isValid: boolean;
  warnings: string[];
  errors: string[];
} {
  const warnings: string[] = [];
  const errors: string[] = [];

  if (candles.length === 0) {
    errors.push('No candles to validate');
    return { isValid: false, warnings, errors };
  }

  // Verificar que todos los candles tienen el mismo timeframe
  const timeframes = new Set(candles.map((c) => c.timeframe));
  if (timeframes.size !== 1 || [...timeframes][0] !== sourceTimeframe) {
    errors.push(`Mixed or incorrect timeframes: expected ${sourceTimeframe}, got ${[...timeframes].join(', ')}`);
  }

  // Detectar gaps en el timeframe original
  const sourceMinutes = TIMEFRAME_MINUTES[sourceTimeframe];
  const expectedGapMs = sourceMinutes * 60 * 1000;
  let gapCount = 0;

  for (let i = 1; i < candles.length; i++) {
    const actualGap = candles[i].timestamp - candles[i - 1].timestamp;

    // Permitir margen de 5% para variaciones
    if (Math.abs(actualGap - expectedGapMs) > expectedGapMs * 0.05) {
      gapCount++;
      if (gapCount <= 3) {
        // Solo reportar los primeros 3
        warnings.push(
          `Gap en candle ${i}: ${(actualGap / 1000 / 60).toFixed(1)} min (esperado ${sourceMinutes} min)`
        );
      }
    }
  }

  if (gapCount > 3) {
    warnings.push(`... y ${gapCount - 3} gaps más detectados`);
  }

  // Detectar candles incompletos
  const incompleteCandles = candles.filter((c) => !c.complete).length;
  if (incompleteCandles > 0) {
    warnings.push(`${incompleteCandles} candles marcados como incompletos`);
  }

  return {
    isValid: errors.length === 0,
    warnings,
    errors,
  };
}

/**
 * Genera reporte de calidad de múltiple timeframes
 */
export function generateQualityReport(result: MultiTimeframeResult): string {
  const lines: string[] = [];

  lines.push('=== Multi-Timeframe Conversion Report ===');
  lines.push(`Original: ${result.original.timeframe} (${result.original.candleCount} candles)`);
  lines.push(`Range: ${new Date(result.original.startTime).toLocaleString()} to ${new Date(result.original.endTime).toLocaleString()}`);
  lines.push('');

  for (const [timeframe, candles] of Object.entries(result.converted)) {
    const qual = result.quality[timeframe as Timeframe];
    lines.push(`${timeframe}:`);
    lines.push(`  Total candles: ${qual.totalCandles}`);
    lines.push(`  Complete: ${qual.completeCandles} (${qual.dataQuality}%)`);
    lines.push(`  Gaps: ${qual.gapsDetected}`);

    if (qual.issues.length > 0) {
      lines.push(`  Issues: ${qual.issues.join(', ')}`);
    }
  }

  return lines.join('\n');
}

/**
 * Obtiene estadísticas comparativas de timeframes
 */
export function getTimeframeComparison(result: MultiTimeframeResult): {
  timeframe: Timeframe;
  candles: number;
  quality: number;
  compressionRatio: number;
  issues: number;
}[] {
  const comparison = [];

  // Original
  comparison.push({
    timeframe: result.original.timeframe,
    candles: result.original.candleCount,
    quality: 100, // Original siempre es 100% por definición
    compressionRatio: 1,
    issues: 0,
  });

  // Convertidos
  for (const [timeframe, qual] of Object.entries(result.quality)) {
    const sourceMinutes = TIMEFRAME_MINUTES[result.original.timeframe];
    const targetMinutes = TIMEFRAME_MINUTES[timeframe as Timeframe];
    const compressionRatio = targetMinutes / sourceMinutes;

    comparison.push({
      timeframe: timeframe as Timeframe,
      candles: qual.totalCandles,
      quality: qual.dataQuality,
      compressionRatio,
      issues: qual.issues.length,
    });
  }

  return comparison;
}
