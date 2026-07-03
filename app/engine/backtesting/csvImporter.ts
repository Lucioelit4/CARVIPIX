/**
 * CSV Importer for Historical Market Data
 * Supports HistData.com format and standard OHLCV CSV files
 */

import { Candle, Asset, Timeframe } from '../types/marketData';

/**
 * HistData format: DateTime,Open,High,Low,Close,Volume
 * Example: 2026.06.02 00:05:00,2543.85,2543.95,2543.65,2543.75,12
 */
export interface HistDataRow {
  dateTime: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/**
 * Standard CSV format: Date,Time,Open,High,Low,Close,Volume
 * Example: 2026-06-02,00:05:00,2543.85,2543.95,2543.65,2543.75,12
 */
export interface StandardCSVRow {
  date: string;
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/**
 * Parse CSV content and convert to Candle format
 * Automatically detects HistData or Standard format
 */
export function parseCSVContent(csvContent: string, asset: Asset, timeframe: Timeframe): Candle[] {
  const lines = csvContent.trim().split('\n');
  if (lines.length < 2) {
    throw new Error('CSV file must contain at least 2 lines (header + data)');
  }

  const candles: Candle[] = [];
  const headerLine = lines[0].toLowerCase();
  
  // Detect format based on header
  const isHistDataFormat = headerLine.includes('datetime');
  const isStandardFormat = headerLine.includes('date') && headerLine.includes('time');

  if (!isHistDataFormat && !isStandardFormat) {
    throw new Error('Unrecognized CSV format. Expected "DateTime" or "Date,Time" columns.');
  }

  // Process data lines (skip header)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue; // Skip empty lines

    try {
      let candle: Candle;

      if (isHistDataFormat) {
        candle = parseHistDataLine(line, asset, timeframe);
      } else {
        candle = parseStandardCSVLine(line, asset, timeframe);
      }

      candles.push(candle);
    } catch (error) {
      console.warn(`Skipping line ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      continue;
    }
  }

  if (candles.length === 0) {
    throw new Error('No valid candles parsed from CSV file');
  }

  return candles;
}

/**
 * Parse HistData format line: 2026.06.02 00:05:00,2543.85,2543.95,2543.65,2543.75,12
 */
function parseHistDataLine(line: string, asset: Asset, timeframe: Timeframe): Candle {
  const parts = line.split(',');
  if (parts.length < 6) {
    throw new Error(`Expected 6 columns, got ${parts.length}`);
  }

  const dateTimeParts = parts[0].trim().split(' ');
  if (dateTimeParts.length !== 2) {
    throw new Error(`Invalid DateTime format: ${parts[0]}`);
  }

  const dateParts = dateTimeParts[0].split('.');
  if (dateParts.length !== 3) {
    throw new Error(`Invalid date format: ${dateTimeParts[0]}`);
  }

  const year = parseInt(dateParts[0], 10);
  const month = parseInt(dateParts[1], 10);
  const day = parseInt(dateParts[2], 10);
  const time = dateTimeParts[1];

  const timestamp = parseDateTime(year, month, day, time);

  return {
    timestamp,
    open: parseFloat(parts[1].trim()),
    high: parseFloat(parts[2].trim()),
    low: parseFloat(parts[3].trim()),
    close: parseFloat(parts[4].trim()),
    volume: parseInt(parts[5].trim(), 10),
    asset,
    timeframe,
    complete: true,
  };
}

/**
 * Parse Standard CSV format line: 2026-06-02,00:05:00,2543.85,2543.95,2543.65,2543.75,12
 */
function parseStandardCSVLine(line: string, asset: Asset, timeframe: Timeframe): Candle {
  const parts = line.split(',');
  if (parts.length < 7) {
    throw new Error(`Expected 7 columns, got ${parts.length}`);
  }

  const date = parts[0].trim();
  const time = parts[1].trim();

  const dateParts = date.split('-');
  if (dateParts.length !== 3) {
    throw new Error(`Invalid date format: ${date}`);
  }

  const year = parseInt(dateParts[0], 10);
  const month = parseInt(dateParts[1], 10);
  const day = parseInt(dateParts[2], 10);

  const timestamp = parseDateTime(year, month, day, time);

  return {
    timestamp,
    open: parseFloat(parts[2].trim()),
    high: parseFloat(parts[3].trim()),
    low: parseFloat(parts[4].trim()),
    close: parseFloat(parts[5].trim()),
    volume: parseInt(parts[6].trim(), 10),
    asset,
    timeframe,
    complete: true,
  };
}

/**
 * Parse date and time components into milliseconds timestamp
 * Time format: HH:MM:SS
 */
function parseDateTime(year: number, month: number, day: number, time: string): number {
  const timeParts = time.split(':');
  if (timeParts.length !== 3) {
    throw new Error(`Invalid time format: ${time}`);
  }

  const hour = parseInt(timeParts[0], 10);
  const minute = parseInt(timeParts[1], 10);
  const second = parseInt(timeParts[2], 10);

  // Create date in UTC
  const date = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  return date.getTime();
}

/**
 * Validate CSV data for common issues
 */
export function validateCandleData(candles: Candle[]): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (candles.length === 0) {
    errors.push('No candles to validate');
    return { isValid: false, errors, warnings };
  }

  // Check for duplicate timestamps
  const timestamps = new Set<number>();
  candles.forEach((candle, index) => {
    if (timestamps.has(candle.timestamp)) {
      warnings.push(`Duplicate timestamp at candle ${index}: ${new Date(candle.timestamp)}`);
    }
    timestamps.add(candle.timestamp);

    // Check for invalid prices
    if (candle.high < candle.low) {
      errors.push(`Candle ${index}: High (${candle.high}) < Low (${candle.low})`);
    }
    if (candle.high < candle.open || candle.high < candle.close) {
      errors.push(`Candle ${index}: High is lower than Open/Close`);
    }
    if (candle.low > candle.open || candle.low > candle.close) {
      errors.push(`Candle ${index}: Low is higher than Open/Close`);
    }
    if (candle.volume < 0) {
      errors.push(`Candle ${index}: Negative volume (${candle.volume})`);
    }

    // Check for prices <= 0
    if (candle.open <= 0 || candle.high <= 0 || candle.low <= 0 || candle.close <= 0) {
      errors.push(`Candle ${index}: Price must be > 0`);
    }
  });

  // Check for gaps in time series (should be 1-minute candles)
  for (let i = 1; i < candles.length; i++) {
    const timeDiff = candles[i].timestamp - candles[i - 1].timestamp;
    const expectedDiff = 60 * 1000; // 1 minute in milliseconds

    if (timeDiff < expectedDiff) {
      errors.push(
        `Candle ${i}: Time gap too small (${timeDiff}ms, expected ~${expectedDiff}ms)`
      );
    } else if (timeDiff > expectedDiff * 2) {
      warnings.push(
        `Candle ${i}: Possible data gap (${timeDiff / 1000 / 60} minutes)`
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Sort candles by timestamp (oldest first)
 */
export function sortCandlesByTime(candles: Candle[]): Candle[] {
  return [...candles].sort((a, b) => a.timestamp - b.timestamp);
}

/**
 * Get candles for a specific date range
 */
export function filterCandlesByDateRange(
  candles: Candle[],
  startDate: Date,
  endDate: Date
): Candle[] {
  const startMs = startDate.getTime();
  const endMs = endDate.getTime();

  return candles.filter((candle) => candle.timestamp >= startMs && candle.timestamp <= endMs);
}

/**
 * Get last N candles
 */
export function getLastNCandles(candles: Candle[], n: number): Candle[] {
  return candles.slice(Math.max(0, candles.length - n));
}

/**
 * Parsear una línea CSV detectando automáticamente el formato
 * Usado para importación por chunks
 */
export function parseCSVLine(line: string, asset: Asset, timeframe: Timeframe, lineNumber?: number): Candle {
  const parts = line.split(',');
  
  // Detectar formato por número de columnas
  if (parts.length === 6) {
    // HistData format: DateTime,Open,High,Low,Close,Volume
    return parseHistDataLine(line, asset, timeframe);
  } else if (parts.length === 7) {
    // Standard format: Date,Time,Open,High,Low,Close,Volume
    return parseStandardCSVLine(line, asset, timeframe);
  } else {
    throw new Error(`Expected 6 or 7 columns, got ${parts.length}${lineNumber ? ` at line ${lineNumber}` : ''}`);
  }
}

/**
 * Validar un candle individual
 */
export function validateSingleCandle(candle: Candle): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Validar precios
  if (candle.open <= 0 || candle.high <= 0 || candle.low <= 0 || candle.close <= 0) {
    errors.push('Precio debe ser > 0');
  }

  if (candle.high < candle.low) {
    errors.push(`High (${candle.high}) < Low (${candle.low})`);
  }

  if (candle.open > candle.high) {
    errors.push(`Open (${candle.open}) > High (${candle.high})`);
  }

  if (candle.open < candle.low) {
    errors.push(`Open (${candle.open}) < Low (${candle.low})`);
  }

  if (candle.close > candle.high) {
    errors.push(`Close (${candle.close}) > High (${candle.high})`);
  }

  if (candle.close < candle.low) {
    errors.push(`Close (${candle.close}) < Low (${candle.low})`);
  }

  // Validar volumen
  if (candle.volume < 0) {
    errors.push('Volumen no puede ser negativo');
  }

  // Validar timestamp
  if (!Number.isFinite(candle.timestamp) || candle.timestamp <= 0) {
    errors.push('Timestamp inválido');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
