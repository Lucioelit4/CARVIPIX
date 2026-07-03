/**
 * Hook para parsear CSV usando Web Worker con streaming
 * Soporta archivos grandes (300k+ líneas) sin bloquear UI
 */

import { useCallback, useRef, useState } from 'react';

interface ParseProgress {
  type: 'progress' | 'batch' | 'complete' | 'error';
  parsed?: number;
  total?: number;
  candles?: any[];
  batchSize?: number;
  error?: string;
  warning?: string;
}

export function useCSVParserWorker() {
  const workerRef = useRef<Worker | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const initWorker = useCallback(() => {
    if (typeof window === 'undefined') return;

    if (!workerRef.current) {
      // Crear worker desde el archivo compilado
      workerRef.current = new Worker(
        new URL('../workers/csvParserWorker.ts', import.meta.url),
        { type: 'module' }
      );
    }
    return workerRef.current;
  }, []);

  const parseCSVLines = useCallback(
    (
      lines: string[],
      asset: string = 'XAUUSD',
      timeframe: string = '5M',
      onProgress?: (progress: ParseProgress) => void
    ): Promise<any[]> => {
      return new Promise((resolve, reject) => {
        try {
          const worker = initWorker();
          if (!worker) {
            throw new Error('Web Worker no disponible');
          }

          setIsLoading(true);
          const allCandles: any[] = [];

          const messageHandler = (event: MessageEvent<ParseProgress>) => {
            const { type, parsed, total, candles, error, warning, batchSize } = event.data;

            if (type === 'progress') {
              // Reporte de progreso simple
              onProgress?.({ type, parsed, total });
            } else if (type === 'batch') {
              // Acumular candles de cada batch sin stack overflow
              if (candles && candles.length > 0) {
                // Procesar en sub-chunks para evitar stack overflow
                const CHUNK_SIZE = 1000;
                for (let idx = 0; idx < candles.length; idx += CHUNK_SIZE) {
                  const chunk = candles.slice(idx, Math.min(idx + CHUNK_SIZE, candles.length));
                  Array.prototype.push.apply(allCandles, chunk);
                }
              }
              onProgress?.({
                type,
                parsed,
                total,
                batchSize,
                warning: warning,
              });
            } else if (type === 'complete') {
              setIsLoading(false);
              worker.removeEventListener('message', messageHandler);
              worker.removeEventListener('error', errorHandler);
              resolve(allCandles);
            } else if (type === 'error') {
              setIsLoading(false);
              worker.removeEventListener('message', messageHandler);
              worker.removeEventListener('error', errorHandler);
              reject(new Error(error || 'Worker error'));
            }
          };

          const errorHandler = (error: ErrorEvent) => {
            setIsLoading(false);
            worker.removeEventListener('message', messageHandler);
            worker.removeEventListener('error', errorHandler);
            reject(error);
          };

          worker.addEventListener('message', messageHandler);
          worker.addEventListener('error', errorHandler);

          // Enviar datos al worker
          worker.postMessage({
            type: 'parse',
            lines,
            asset,
            timeframe,
          });
        } catch (error) {
          setIsLoading(false);
          reject(error);
        }
      });
    },
    [initWorker]
  );

  const cleanup = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
    setIsLoading(false);
  }, []);

  return {
    parseCSVLines,
    isLoading,
    cleanup,
  };
}
