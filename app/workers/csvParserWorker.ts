/**
 * Web Worker para parsear CSV HistData en background
 * Procesa líneas de forma asincrónica sin bloquear el UI
 */

interface ParseMessage {
  type: 'parse' | 'init';
  lines?: string[];
  asset?: string;
  timeframe?: string;
  chunkSize?: number;
}

interface ParseResult {
  type: 'progress' | 'complete' | 'error';
  parsed?: number;
  total?: number;
  candles?: any[];
  error?: string;
}

// Importar funciones de parseo
const parseHistDataRealLine = (line: string, asset: string, timeframe: string): any => {
  const parts = line.split(';');
  if (parts.length < 6) {
    throw new Error(`Expected 6 columns, got ${parts.length}`);
  }

  const dateTimeParts = parts[0].trim().split(' ');
  if (dateTimeParts.length !== 2) {
    throw new Error(`Invalid DateTime format: ${parts[0]}`);
  }

  const dateStr = dateTimeParts[0];
  const timeStr = dateTimeParts[1];

  if (dateStr.length !== 8 || timeStr.length !== 6) {
    throw new Error(`Invalid date/time format`);
  }

  const year = parseInt(dateStr.substring(0, 4), 10);
  const month = parseInt(dateStr.substring(4, 6), 10);
  const day = parseInt(dateStr.substring(6, 8), 10);
  const hour = parseInt(timeStr.substring(0, 2), 10);
  const minute = parseInt(timeStr.substring(2, 4), 10);
  const second = parseInt(timeStr.substring(4, 6), 10);

  const date = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  const timestamp = date.getTime();

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
};

const validateSingleCandle = (candle: any): { valid: boolean } => {
  if (!candle.timestamp || !candle.open || !candle.high || !candle.low || !candle.close) {
    return { valid: false };
  }
  if (candle.high < candle.low || candle.high < candle.open || candle.high < candle.close) {
    return { valid: false };
  }
  if (candle.low > candle.open || candle.low > candle.close) {
    return { valid: false };
  }
  if (candle.volume < 0) {
    return { valid: false };
  }
  return { valid: true };
};

self.onmessage = async (event: MessageEvent<ParseMessage>) => {
  const { type, lines = [], asset = 'XAUUSD', timeframe = '5M', chunkSize = 5000 } = event.data;

  if (type === 'parse') {
    try {
      const candles: any[] = [];
      const total = lines.length;

      // Procesar en chunks sin bloquear
      for (let i = 0; i < total; i++) {
        if (i % chunkSize === 0) {
          // Enviar progreso cada chunk
          const result: ParseResult = {
            type: 'progress',
            parsed: i,
            total: total,
          };
          self.postMessage(result);

          // Yield al event loop
          await new Promise((resolve) => setTimeout(resolve, 0));
        }

        const line = lines[i].trim();
        if (!line) continue;

        try {
          const candle = parseHistDataRealLine(line, asset, timeframe);
          if (validateSingleCandle(candle).valid) {
            candles.push(candle);
          }
        } catch (e) {
          // Ignorar líneas malformadas
        }
      }

      // Enviar resultado final
      const result: ParseResult = {
        type: 'complete',
        parsed: total,
        total: total,
        candles,
      };
      self.postMessage(result);
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
