'use client';

/**
 * Multi-Dataset Loader - Combina múltiples CSV HistData
 * Detecta, carga y fusiona datasets de múltiples meses
 * 
 * Arquitectura:
 * - Web Worker: Parsing pesado en background thread
 * - IndexedDB Cache: Evita reprocesamiento
 * - Streaming: Procesa en chunks sin saturar UI
 */

import React, { useState, useEffect } from 'react';
import { Database, Plus, X, AlertCircle, CheckCircle } from 'lucide-react';
import { Candle } from '../../engine/types/marketData';
import { useCSVParserWorker } from '../../hooks/useCSVParserWorker';
import { datasetCache } from '../../lib/localDatasetCache';

interface DatasetFile {
  name: string;
  path: string;
  month: string;
  year: string;
}

interface CombinedDataset {
  totalCandles: number;
  startDate: Date;
  endDate: Date;
  months: string[];
  candlesByMonth: Record<string, number>;
  duplicatesCleaned: number;
  qualityPercent: number;
}

interface MultiDatasetLoaderProps {
  onDataLoaded: (candles: Candle[], metadata: CombinedDataset) => void;
  onError: (error: string) => void;
}

export default function MultiDatasetLoader({
  onDataLoaded,
  onError,
}: MultiDatasetLoaderProps) {
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string>('');
  const [combinedData, setCombinedData] = useState<CombinedDataset | null>(null);
  const { parseCSVLines, isLoading: workerLoading, cleanup } = useCSVParserWorker();

  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  // Cargar todos los datasets disponibles y combinarlos
  const handleLoadAll = async () => {
    setIsLoading(true);
    setMessage('Detectando archivos disponibles...');

    try {
      const response = await fetch('/api/datasets?action=list');
      
      if (!response.ok) {
        throw new Error(`Failed to list datasets: ${response.status}`);
      }
      
      const data = await response.json();
      const files: DatasetFile[] = data.files || [];

      if (files.length === 0) {
        throw new Error('No hay archivos HistData disponibles');
      }

      setMessage(`Encontrados ${files.length} archivos. Cargando...`);

      // Cargar y parsear archivos usando Web Worker
      const allCandles: Candle[] = [];
      const candlesByMonth: Record<string, number> = {};
      const months: string[] = [];
      let totalDuplicates = 0;

      for (const file of files) {
        try {
          // Verificar cache
          const cached = await datasetCache.get(file.name);
          
          if (cached) {
            setMessage(`[Cache] ${file.name} - ${cached.candles.length} velas`);
            allCandles.push(...cached.candles);
            const monthKey = `${file.year}-${file.month}`;
            candlesByMonth[monthKey] = cached.candles.length;
            months.push(monthKey);
            continue;
          }

          setMessage(`Descargando ${file.name}...`);
          
          // Fetch del archivo desde public/datasets/
          const csvResponse = await fetch(`/datasets/${file.name}`);
          if (!csvResponse.ok) {
            console.warn(`Archivo no accesible: ${file.name}`);
            continue;
          }
          
          const csvText = await csvResponse.text();
          const lines = csvText.trim().split('\n');

          setMessage(`Parseando ${file.name} con Worker... (${lines.length} líneas)`);

          // Parsear en Web Worker (no bloquea UI)
          const candles = await parseCSVLines(
            lines,
            'XAUUSD',
            '5M',
            (progress) => {
              if (progress.type === 'progress') {
                const percent = Math.round(
                  ((progress.parsed || 0) / (progress.total || 1)) * 100
                );
                setMessage(
                  `Parseando ${file.name}... ${percent}% (${progress.parsed}/${progress.total})`
                );
              }
            }
          );

          // Guardar en cache para próximas sesiones
          const monthKey = `${file.year}-${file.month}`;
          await datasetCache.set({
            filename: file.name,
            candles,
            metadata: {
              totalLines: lines.length,
              validCandles: candles.length,
              duplicates: 0,
            },
          });

          allCandles.push(...candles);
          candlesByMonth[monthKey] = candles.length;
          months.push(monthKey);
        } catch (fileError) {
          console.error(`Error loading ${file.name}:`, fileError);
          // Continuar con otros archivos
        }
      }

      if (allCandles.length === 0) {
        throw new Error('No se pudieron cargar datos válidos');
      }

      // Combinar: deduplicar + ordenar
      setMessage('Deduplicando y ordenando...');

      const seen = new Set<number>();
      const uniqueCandles = allCandles.filter((candle) => {
        if (seen.has(candle.timestamp)) {
          totalDuplicates++;
          return false;
        }
        seen.add(candle.timestamp);
        return true;
      });

      uniqueCandles.sort((a, b) => a.timestamp - b.timestamp);

      // Calcular metadatos
      const startDate = new Date(uniqueCandles[0].timestamp);
      const endDate = new Date(uniqueCandles[uniqueCandles.length - 1].timestamp);

      const metadata: CombinedDataset = {
        totalCandles: uniqueCandles.length,
        startDate,
        endDate,
        months: [...new Set(months)].sort(),
        candlesByMonth,
        duplicatesCleaned: totalDuplicates,
        qualityPercent: Math.round(
          ((uniqueCandles.length / (allCandles.length || 1)) * 100)
        ),
      };

      setCombinedData(metadata);
      setMessage(
        `✓ Dataset combinado: ${uniqueCandles.length.toLocaleString()} velas`
      );
      onDataLoaded(uniqueCandles, metadata);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
      setMessage(`Error: ${errorMsg}`);
      onError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 space-y-4">
      <div className="flex items-center gap-3">
        <Database className="w-6 h-6 text-blue-400" />
        <h3 className="text-lg font-bold text-white">🗂️ Cargar Múltiples Datasets</h3>
      </div>

      <p className="text-slate-300 text-sm">
        Combina múltiples archivos HistData XAUUSD de diferentes meses. Se eliminarán duplicados y ordenarán cronológicamente.
      </p>

      {/* Botón de cargar todos */}
      <button
        onClick={handleLoadAll}
        disabled={isLoading}
        className={`w-full py-3 rounded font-bold text-white transition flex items-center justify-center gap-2 ${
          isLoading
            ? 'bg-slate-600 cursor-not-allowed opacity-50'
            : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'
        }`}
      >
        <Plus className="w-5 h-5" />
        {isLoading ? 'Cargando...' : 'Cargar Todos los Datasets'}
      </button>

      {/* Mensaje de estado */}
      {message && (
        <div className={`p-3 rounded text-sm ${isLoading ? 'bg-blue-900/30 text-blue-200' : 'bg-green-900/30 text-green-200'}`}>
          {message}
        </div>
      )}

      {/* Resumen combinado */}
      {combinedData && (
        <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-blue-400" />
            <h4 className="font-semibold text-blue-300">Dataset Combinado Listo</h4>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div>
              <p className="text-slate-400">Velas Totales</p>
              <p className="text-blue-200 font-semibold">{combinedData.totalCandles.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-slate-400">Meses</p>
              <p className="text-blue-200 font-semibold">{combinedData.months.length}</p>
            </div>
            <div>
              <p className="text-slate-400">Duplicados Limpiados</p>
              <p className="text-blue-200 font-semibold">{combinedData.duplicatesCleaned.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-slate-400">Calidad</p>
              <p className="text-blue-200 font-semibold">{combinedData.qualityPercent}%</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-slate-400">Inicio</p>
              <p className="text-blue-200 font-semibold">
                {combinedData.startDate.toLocaleDateString('es-ES')}
              </p>
            </div>
            <div>
              <p className="text-slate-400">Fin</p>
              <p className="text-blue-200 font-semibold">
                {combinedData.endDate.toLocaleDateString('es-ES')}
              </p>
            </div>
          </div>

          <div>
            <p className="text-slate-400 text-xs mb-2">Meses cargados:</p>
            <div className="flex flex-wrap gap-2">
              {combinedData.months.map((month) => (
                <span
                  key={month}
                  className="px-2 py-1 bg-blue-700/40 text-blue-300 rounded text-xs font-medium"
                >
                  {month}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
