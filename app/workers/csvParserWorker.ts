/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Web Worker para parsear CSV HistData en background
 * Streaming real para archivos grandes (350k+) sin stack overflow
 */

interface ParseMessage {
  type: 'parse' | 'init';
  lines?: string[];
  asset?: string;
  timeframe?: string;
}

interface ParseResult {
  type: 'progress' | 'batch' | 'complete' | 'error';
  parsed?: number;
  total?: number;
  candles?: any[];
  batchSize?: number;
  error?: string;
  warning?: string;
}

// Parsing eficiente
const parseHistDataRealLine = (line: string, asset: string, timeframe: string): any => {
  const parts = line.split(';');
  if (parts.length < 6) throw new Error('Expected 6 columns');

  const dateTimeParts = parts[0].trim().split(' ');
  if (dateTimeParts.length !== 2) throw new Error('Invalid DateTime');

  const dateStr = dateTimeParts[0];
  const timeStr = dateTimeParts[1];

  if (dateStr.length !== 8 || timeStr.length !== 6) throw new Error('Invalid date/time');

  const year = parseInt(dateStr.substring(0, 4), 10);
  const month = parseInt(dateStr.substring(4, 6), 10);
  const day = parseInt(dateStr.substring(6, 8), 10);
  const hour = parseInt(timeStr.substring(0, 2), 10);
  const minute = parseInt(timeStr.substring(2, 4), 10);
  const second = parseInt(timeStr.substring(4, 6), 10);

  const date = new Date(Date.UTC(year, month - 1, day, hour, minute, second));

  return {
    timestamp: date.getTime(),
    open: parseFloat(parts[1].trim()),
    high: parseFloat(parts[2].trim()),
    low: parseFloat(parts[3].trim()),
    close: parseFloat(parts[4].trim()),
    volume: parseInt(parts[5].trim(), 10),
    asset,
    timeframe,
    complete: true,
  };
};

const validateSingleCandle = (candle: any): boolean => {
  if (!candle.timestamp || !candle.open || !candle.high || !candle.low || !candle.close) {
    return false;
  }
  if (candle.high < candle.low || candle.high < candle.open || candle.high < candle.close) {
    return false;
  }
  if (candle.low > candle.open || candle.low > candle.close) {
    return false;
  }
  if (candle.volume < 0) {
    return false;
  }
  return true;
};

self.onmessage = async (event: MessageEvent<ParseMessage>) => {
  const { type, lines = [], asset = 'XAUUSD', timeframe = '5M' } = event.data;

  if (type === 'parse') {
    try {
      const total = lines.length;
      const seenTimestamps = new Map<number, boolean>(); // Deduplicación incremental
      let processedCount = 0;
      let validCount = 0;
      let duplicateCount = 0;

      // Constantes de streaming
      const LINES_PER_BATCH = 1000; // Procesar 1k líneas por iteración
      const BATCH_SEND_SIZE = 5000; // Enviar candles en lotes de 5k

      let currentBatch: any[] = [];

      // Procesar en streaming real
      for (let i = 0; i < total; i += LINES_PER_BATCH) {
        const batchEnd = Math.min(i + LINES_PER_BATCH, total);

        // Procesar líneas del batch
        for (let j = i; j < batchEnd; j++) {
          const line = lines[j].trim();
          if (!line) continue;

          try {
            const candle = parseHistDataRealLine(line, asset, timeframe);
            if (validateSingleCandle(candle)) {
              // Deduplicación incremental
              if (!seenTimestamps.has(candle.timestamp)) {
                seenTimestamps.set(candle.timestamp, true);
                currentBatch.push(candle);
                validCount++;

                // Enviar batch cuando alcance tamaño
                if (currentBatch.length >= BATCH_SEND_SIZE) {
                  const result: ParseResult = {
                    type: 'batch',
                    candles: currentBatch,
                    batchSize: currentBatch.length,
                    parsed: j,
                    total: total,
                  };
                  self.postMessage(result);
                  currentBatch = [];
                }
              } else {
                duplicateCount++;
              }
            }
          } catch (e) {
            // Ignorar líneas malformadas
          }

          processedCount++;
        }

        // Enviar progreso después de cada batch de líneas
        const result: ParseResult = {
          type: 'progress',
          parsed: batchEnd,
          total: total,
        };
        self.postMessage(result);

        // Yield al event loop para no bloquear
        await new Promise((resolve) => setTimeout(resolve, 0));
      }

      // Enviar candles restantes
      if (currentBatch.length > 0) {
        const result: ParseResult = {
          type: 'batch',
          candles: currentBatch,
          batchSize: currentBatch.length,
          parsed: total,
          total: total,
        };
        self.postMessage(result);
      }

      // Resultado final con metadatos
      const finalResult: ParseResult = {
        type: 'complete',
        parsed: total,
        total: total,
        candles: [],
        warning:
          total > 100000
            ? `Archivo grande procesado: ${total} líneas (${duplicateCount} duplicados limpiados). Puede ser lento en algunos navegadores.`
            : undefined,
      };
      self.postMessage(finalResult);
    } catch (error) {
      const result: ParseResult = {
        type: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      self.postMessage(result);
    }
  }
};

export {};

