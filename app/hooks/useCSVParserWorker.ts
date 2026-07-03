/**
 * Hook para parsear CSV usando Web Worker
 * Mantiene el UI responsivo incluso con archivos muy grandes
 */

import { useCallback, useRef, useState } from 'react';

interface ParseProgress {
  type: 'progress' | 'complete' | 'error';
  parsed?: number;
  total?: number;
  candles?: any[];
  error?: string;
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

          const messageHandler = (event: MessageEvent<ParseProgress>) => {
            const { type, parsed, total, candles, error } = event.data;

            if (type === 'progress') {
              onProgress?.({ type, parsed, total });
            } else if (type === 'complete') {
              setIsLoading(false);
              worker.removeEventListener('message', messageHandler);
              worker.removeEventListener('error', errorHandler);
              resolve(candles || []);
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
            chunkSize: 5000,
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
