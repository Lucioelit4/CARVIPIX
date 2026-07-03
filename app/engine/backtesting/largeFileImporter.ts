/**
 * Importador para archivos CSV grandes
 * Lee datos en chunks para evitar bloquear el navegador
 * Soporta validación y detección de errores durante la importación
 */

import { Candle, Asset, Timeframe } from '../types/marketData';
import { parseCSVLine, validateSingleCandle } from './csvImporter';

export interface ImportProgress {
  bytesProcessed: number;
  totalBytes: number;
  linesProcessed: number;
  validCandles: number;
  invalidLines: number;
  duplicates: number;
  gaps: number;
  percentComplete: number;
  elapsedMs: number;
  estimatedRemainingMs: number;
  isComplete: boolean;
}

export interface ImportStatistics {
  totalLines: number;
  validCandles: number;
  invalidLines: string[]; // Primeras líneas inválidas (máximo 10)
  duplicateCount: number;
  gapCount: number;
  outOfOrderCount: number;
  invalidPricesCount: number;
  timeRange: { start: number; end: number } | null;
  dataQuality: number; // Porcentaje de datos válidos
  candles: Candle[];
}

/**
 * Configuración para importación de archivos grandes
 */
export const IMPORT_CONFIG = {
  chunkSize: 256 * 1024, // 256 KB por chunk
  maxFileSizeMB: 100, // Límite recomendado: 100 MB
  linesPerBatch: 10000, // Procesar 10k líneas por batch
};

/**
 * Validar que el archivo no sea demasiado grande
 */
export function validateFileSize(fileSizeBytes: number): {
  isValid: boolean;
  warning?: string;
} {
  const fileSizeMB = fileSizeBytes / (1024 * 1024);
  
  if (fileSizeMB > IMPORT_CONFIG.maxFileSizeMB) {
    return {
      isValid: false,
      warning: `Archivo demasiado grande (${fileSizeMB.toFixed(1)} MB). Máximo recomendado: ${IMPORT_CONFIG.maxFileSizeMB} MB. Considera dividir en archivos más pequeños.`,
    };
  }

  if (fileSizeMB > IMPORT_CONFIG.maxFileSizeMB * 0.7) {
    return {
      isValid: true,
      warning: `Archivo grande (${fileSizeMB.toFixed(1)} MB). Puede tardar varios segundos en importar.`,
    };
  }

  return { isValid: true };
}

/**
 * Importar archivo CSV en chunks con progreso
 */
export async function importLargeCSVFile(
  file: File,
  asset: Asset,
  timeframe: Timeframe,
  onProgress?: (progress: ImportProgress) => void
): Promise<ImportStatistics> {
  const startTime = Date.now();
  const totalBytes = file.size;
  
  // Validar tamaño
  const sizeValidation = validateFileSize(totalBytes);
  if (!sizeValidation.isValid) {
    throw new Error(sizeValidation.warning);
  }

  const stats: ImportStatistics = {
    totalLines: 0,
    validCandles: 0,
    invalidLines: [],
    duplicateCount: 0,
    gapCount: 0,
    outOfOrderCount: 0,
    invalidPricesCount: 0,
    timeRange: null,
    dataQuality: 0,
    candles: [],
  };

  let bytesProcessed = 0;
  let buffer = '';
  let lineNumber = 0;
  let lastTimestamp: number | null = null;
  const seenTimestamps = new Set<number>();

  const reader = file.stream().getReader();
  const decoder = new TextDecoder();

  try {
    while (true) {
      const { done, value } = await reader.read();
      
      if (value) {
        bytesProcessed += value.byteLength;
        buffer += decoder.decode(value, { stream: !done });
      }

      if (done || buffer.includes('\n')) {
        // Procesar líneas completas
        const lines = buffer.split('\n');
        
        // Guardar la última línea incompleta
        buffer = lines.pop() || '';

        for (const line of lines) {
          lineNumber++;
          
          if (!line.trim()) continue; // Saltar líneas vacías
          if (lineNumber === 1 && line.toLowerCase().includes('datetime')) continue; // Saltar header
          
          try {
            const candle = parseCSVLine(line, asset, timeframe, lineNumber);
            
            // Validar candle
            const validation = validateSingleCandle(candle);
            if (!validation.valid) {
              stats.invalidLines.push(`L${lineNumber}: ${validation.errors.join(', ')}`);
              stats.invalidLines = stats.invalidLines.slice(0, 10); // Guardar máximo 10
              continue;
            }

            // Detectar duplicados
            if (seenTimestamps.has(candle.timestamp)) {
              stats.duplicateCount++;
              continue;
            }
            seenTimestamps.add(candle.timestamp);

            // Detectar precio inválido (OHLC lógica)
            if (candle.high < candle.low || 
                candle.close < candle.low || 
                candle.close > candle.high ||
                candle.open < candle.low ||
                candle.open > candle.high) {
              stats.invalidPricesCount++;
              continue;
            }

            // Detectar gaps (brecha > 2 horas para la mayoría de assets)
            if (lastTimestamp !== null) {
              const timeDiffHours = (candle.timestamp - lastTimestamp) / (1000 * 60 * 60);
              if (timeframe === '5M' && timeDiffHours > 2) {
                stats.gapCount++;
              } else if (timeframe === '1H' && timeDiffHours > 24) {
                stats.gapCount++;
              }
            }

            // Detectar fechas fuera de orden
            if (lastTimestamp !== null && candle.timestamp < lastTimestamp) {
              stats.outOfOrderCount++;
              continue;
            }

            // Agregar a resultados
            stats.candles.push(candle);
            stats.validCandles++;
            lastTimestamp = candle.timestamp;

            // Registrar rango de tiempo
            if (!stats.timeRange) {
              stats.timeRange = { start: candle.timestamp, end: candle.timestamp };
            } else {
              stats.timeRange.end = candle.timestamp;
            }
          } catch (error) {
            if (stats.invalidLines.length < 10) {
              stats.invalidLines.push(
                `L${lineNumber}: ${error instanceof Error ? error.message : 'Error desconocido'}`
              );
            }
          }

          // Reportar progreso cada 10k líneas
          if (lineNumber % IMPORT_CONFIG.linesPerBatch === 0 && onProgress) {
            const elapsedMs = Date.now() - startTime;
            const percentComplete = Math.round((bytesProcessed / totalBytes) * 100);
            const estimatedTotalMs = elapsedMs / (bytesProcessed / totalBytes);
            const estimatedRemainingMs = estimatedTotalMs - elapsedMs;

            onProgress({
              bytesProcessed,
              totalBytes,
              linesProcessed: lineNumber,
              validCandles: stats.validCandles,
              invalidLines: stats.invalidLines.length,
              duplicates: stats.duplicateCount,
              gaps: stats.gapCount,
              percentComplete,
              elapsedMs,
              estimatedRemainingMs: Math.max(0, estimatedRemainingMs),
              isComplete: false,
            });

            // Permitir que el navegador se actualice
            await new Promise(resolve => setTimeout(resolve, 0));
          }
        }
      }

      if (done) break;
    }

    // Procesar línea final si existe
    if (buffer.trim()) {
      lineNumber++;
      try {
        const candle = parseCSVLine(buffer.trim(), asset, timeframe, lineNumber);
        const validation = validateSingleCandle(candle);
        if (validation.valid) {
          stats.candles.push(candle);
          stats.validCandles++;
        }
      } catch (error) {
        if (stats.invalidLines.length < 10) {
          stats.invalidLines.push(
            `L${lineNumber}: ${error instanceof Error ? error.message : 'Error desconocido'}`
          );
        }
      }
    }

    stats.totalLines = lineNumber;
    stats.dataQuality = stats.totalLines > 0 ? (stats.validCandles / stats.totalLines) * 100 : 0;

    // Reporte final
    if (onProgress) {
      const elapsedMs = Date.now() - startTime;
      onProgress({
        bytesProcessed: totalBytes,
        totalBytes,
        linesProcessed: lineNumber,
        validCandles: stats.validCandles,
        invalidLines: stats.invalidLines.length,
        duplicates: stats.duplicateCount,
        gaps: stats.gapCount,
        percentComplete: 100,
        elapsedMs,
        estimatedRemainingMs: 0,
        isComplete: true,
      });
    }

    return stats;
  } finally {
    reader.releaseLock();
  }
}

/**
 * Extraer información de un dataset importado
 */
export function getDatasetInfo(stats: ImportStatistics, fileName: string, asset: Asset, timeframe: Timeframe) {
  return {
    fileName,
    asset,
    timeframe,
    symbol: `${asset}_${timeframe}`,
    totalCandles: stats.validCandles,
    timeRange: stats.timeRange,
    dateRange: stats.timeRange ? {
      start: new Date(stats.timeRange.start).toLocaleString(),
      end: new Date(stats.timeRange.end).toLocaleString(),
    } : null,
    dataQuality: stats.dataQuality.toFixed(1),
    issues: {
      invalid: stats.invalidLines.length,
      duplicates: stats.duplicateCount,
      gaps: stats.gapCount,
      outOfOrder: stats.outOfOrderCount,
      invalidPrices: stats.invalidPricesCount,
    },
    importedAt: new Date().toISOString(),
    readyForBacktesting: stats.validCandles >= 100 && stats.dataQuality >= 80,
  };
}
