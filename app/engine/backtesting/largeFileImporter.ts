/**
 * Importador para archivos CSV grandes
 * Lee datos en chunks para evitar bloquear el navegador
 * Soporta validación y detección de errores durante la importación
 */

import { Candle, Asset, Timeframe } from '../types/marketData';
import { 
  parseCSVLine, 
  validateSingleCandle,
  parseHistDataLine,
  parseStandardCSVLine 
} from './csvImporter';

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
 * Detectar si un archivo es ZIP por su firma mágica
 */
function isZipFile(buffer: ArrayBuffer): boolean {
  const view = new Uint8Array(buffer);
  // Firma ZIP: 504B0304 (PK\x03\x04)
  return view.length >= 4 && view[0] === 0x50 && view[1] === 0x4b && view[2] === 0x03 && view[3] === 0x04;
}

/**
 * Detectar el formato de CSV por su contenido
 * Retorna 'histdata', 'standard', o 'unknown'
 */
function detectCSVFormat(firstLine: string): 'histdata' | 'standard' | 'unknown' {
  const line = firstLine.toLowerCase().trim();
  
  // Header detection
  if (line.includes('datetime')) return 'histdata';
  if (line.includes('date') && line.includes('time')) return 'standard';
  
  // Pattern detection for data (si no hay header)
  const parts = line.split(',');
  
  // HistData: YYYY.MM.DD HH:MM:SS,Open,High,Low,Close,Volume (6 columnas)
  // Patrón: primero tiene puntos (fecha YYYY.MM.DD)
  if (parts.length === 6 && parts[0].includes('.') && parts[0].includes(' ')) {
    return 'histdata';
  }
  
  // Standard: Date,Time,Open,High,Low,Close,Volume (7 columnas)
  if (parts.length === 7 && parts[1].match(/^\d{2}:\d{2}:\d{2}/)) {
    return 'standard';
  }
  
  return 'unknown';
}

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
 * Soporta: CSV directo o ZIP con CSV adentro
 */
export async function importLargeCSVFile(
  file: File,
  asset: Asset,
  timeframe: Timeframe,
  onProgress?: (progress: ImportProgress) => void
): Promise<ImportStatistics> {
  // Detectar si es ZIP por extensión y primeros bytes
  const isZip = file.name.toLowerCase().endsWith('.zip') || await checkIfZipFile(file);
  
  if (isZip) {
    throw new Error(
      `El archivo es un ZIP. Descarga la librería o descomprime manualmente: \n` +
      `1. Abre el ZIP (${file.name})\n` +
      `2. Extrae el archivo .CSV\n` +
      `3. Carga el CSV directamente en CARVIPIX\n` +
      `Archivos CSV soportados: HistData (XAUUSD_M1_*.csv) o Standard (Date,Time,O,H,L,C,V)`
    );
  }

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
  let detectedFormat: 'histdata' | 'standard' | 'unknown' = 'unknown';
  let headerSkipped = false;
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
          
          // Primera línea: detectar formato y header
          if (lineNumber === 1) {
            detectedFormat = detectCSVFormat(line);
            
            // Saltar header si es evidente
            if (line.toLowerCase().includes('datetime') || 
                line.toLowerCase().includes('date') ||
                line.toLowerCase().includes('open')) {
              headerSkipped = true;
              continue;
            }
          }
          
          try {
            // Intentar parsear según formato detectado
            let candle: Candle;
            
            if (detectedFormat === 'histdata') {
              candle = parseHistDataLine(line, asset, timeframe);
            } else if (detectedFormat === 'standard') {
              candle = parseStandardCSVLine(line, asset, timeframe);
            } else {
              // Fallback: detectar por patrón
              candle = parseCSVLineWithDetection(line, asset, timeframe, 'auto', lineNumber);
            }
            
            // Validar candle
            const validation = validateSingleCandle(candle);
            if (!validation.valid) {
              stats.invalidLines.push(
                `L${lineNumber}: ${validation.errors.slice(0, 2).join(', ')}`
              );
              stats.invalidLines = stats.invalidLines.slice(0, 10);
              continue;
            }

            // Detectar duplicados
            if (seenTimestamps.has(candle.timestamp)) {
              stats.duplicateCount++;
              continue;
            }
            seenTimestamps.add(candle.timestamp);

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
            const estimatedTotalMs = bytesProcessed > 0 ? elapsedMs / (bytesProcessed / totalBytes) : 0;
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
    if (buffer.trim() && lineNumber > 0) {
      lineNumber++;
      try {
        let candle: Candle;
        if (detectedFormat === 'histdata') {
          candle = parseHistDataLine(buffer.trim(), asset, timeframe);
        } else if (detectedFormat === 'standard') {
          candle = parseStandardCSVLine(buffer.trim(), asset, timeframe);
        } else {
          candle = parseCSVLineWithDetection(buffer.trim(), asset, timeframe, 'auto', lineNumber);
        }

        const validation = validateSingleCandle(candle);
        if (validation.valid && !seenTimestamps.has(candle.timestamp)) {
          stats.candles.push(candle);
          stats.validCandles++;
        }
      } catch (error) {
        // Ignorar error en última línea
      }
    }

    stats.totalLines = lineNumber - (headerSkipped ? 1 : 0);
    stats.dataQuality = stats.totalLines > 0 ? (stats.validCandles / stats.totalLines) * 100 : 0;

    // Validar que se importaron datos
    if (stats.validCandles === 0) {
      throw new Error(
        `No se pudieron importar candles válidos.\n` +
        `Detectado formato: ${detectedFormat}\n` +
        `Líneas procesadas: ${lineNumber}\n` +
        `Errores: ${stats.invalidLines.join('; ')}`
      );
    }

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
 * Verificar si un archivo es ZIP leyendo primeros bytes
 */
async function checkIfZipFile(file: File): Promise<boolean> {
  if (file.size < 4) return false;
  
  const buffer = await file.slice(0, 4).arrayBuffer();
  return isZipFile(buffer);
}

/**
 * Parsear línea CSV con detección automática de formato
 */
function parseCSVLineWithDetection(
  line: string,
  asset: Asset,
  timeframe: Timeframe,
  format: 'histdata' | 'standard' | 'auto',
  lineNumber?: number
): Candle {
  const parts = line.split(',');
  
  if (format === 'auto') {
    // Detectar automáticamente
    if (parts.length === 6 && parts[0].includes('.') && parts[0].includes(' ')) {
      format = 'histdata';
    } else if (parts.length === 7 && parts[1].match(/^\d{2}:\d{2}:\d{2}/)) {
      format = 'standard';
    } else {
      throw new Error(`No se pudo detectar formato. Columnas: ${parts.length}${lineNumber ? ` (línea ${lineNumber})` : ''}`);
    }
  }

  if (format === 'histdata') {
    if (parts.length !== 6) {
      throw new Error(`HistData requiere 6 columnas, encontradas: ${parts.length}`);
    }
    return parseHistDataLine(line, asset, timeframe);
  } else {
    if (parts.length !== 7) {
      throw new Error(`Formato Standard requiere 7 columnas, encontradas: ${parts.length}`);
    }
    return parseStandardCSVLine(line, asset, timeframe);
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
