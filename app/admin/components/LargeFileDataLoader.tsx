/**
 * Large File Data Loader - Importa archivos CSV grandes
 * Muestra progreso y estadísticas detalladas
 */

'use client';

import React, { useState, useRef } from 'react';
import { Upload, AlertCircle, CheckCircle, Loader, TrendingUp, HardDrive } from 'lucide-react';
import { Asset, Timeframe, Candle } from '../../engine/types/marketData';
import {
  importLargeCSVFile,
  validateFileSize,
  IMPORT_CONFIG,
  ImportProgress,
  ImportStatistics,
  getDatasetInfo,
} from '../../engine/backtesting/largeFileImporter';

interface LargeFileDataLoaderProps {
  asset: Asset;
  timeframe: Timeframe;
  onDataLoaded: (candles: Candle[]) => void;
  onError: (error: string) => void;
}

export default function LargeFileDataLoader({
  asset,
  timeframe,
  onDataLoaded,
  onError,
}: LargeFileDataLoaderProps) {
  const [fileName, setFileName] = useState<string>('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');
  const [progress, setProgress] = useState<ImportProgress | null>(null);
  const [stats, setStats] = useState<ImportStatistics | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setStatus('loading');
    setMessage('Importando archivo...');
    setProgress(null);
    setStats(null);

    try {
      // Validar tamaño
      const sizeValidation = validateFileSize(file.size);
      if (!sizeValidation.isValid) {
        throw new Error(sizeValidation.warning);
      }

      if (sizeValidation.warning) {
        console.warn(sizeValidation.warning);
      }

      // Importar con progreso
      const importStats = await importLargeCSVFile(file, asset, timeframe, (prog) => {
        setProgress(prog);
        if (!prog.isComplete) {
          const elapsedSec = prog.elapsedMs / 1000;
          const estimatedTotalSec = prog.estimatedRemainingMs / 1000 + elapsedSec;
          setMessage(
            `Importando: ${prog.percentComplete}% | ${prog.validCandles} candles válidas | ${elapsedSec.toFixed(1)}s / ${estimatedTotalSec.toFixed(1)}s`
          );
        }
      });

      setStats(importStats);
      setStatus('success');
      setMessage(`✓ Importación completada: ${importStats.validCandles} candles válidas`);
      onDataLoaded(importStats.candles);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
      setStatus('error');
      setMessage(`Error: ${errorMsg}`);
      onError(errorMsg);
    }
  };

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 space-y-4">
      <h3 className="text-lg font-bold text-white">📂 Importar Datos Históricos Grandes</h3>

      <div className="space-y-3">
        {/* File Upload */}
        <div className="border-2 border-dashed border-slate-600 rounded-lg p-4 hover:border-slate-500 transition">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            disabled={status === 'loading'}
            className="hidden"
            aria-label="Seleccionar archivo CSV"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={status === 'loading'}
            className="w-full flex items-center justify-center gap-2 py-3 text-slate-300 hover:text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Upload className="w-5 h-5" />
            <span className="font-medium">
              {fileName ? `Cargado: ${fileName}` : 'Importar CSV grande'}
            </span>
          </button>
        </div>

        {/* Status Messages */}
        {message && (
          <div
            className={`flex items-start gap-3 p-3 rounded-lg text-sm ${
              status === 'loading'
                ? 'bg-blue-900/30 text-blue-200 border border-blue-600/50'
                : status === 'success'
                  ? 'bg-green-900/30 text-green-200 border border-green-600/50'
                  : 'bg-red-900/30 text-red-200 border border-red-600/50'
            }`}
          >
            {status === 'loading' ? (
              <Loader className="w-4 h-4 animate-spin flex-shrink-0 mt-0.5" />
            ) : status === 'success' ? (
              <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            )}
            <span>{message}</span>
          </div>
        )}

        {/* Progress Bar */}
        {progress && !progress.isComplete && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Progreso</span>
              <span>{progress.percentComplete}%</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-[#D4AF37] to-yellow-500 h-2 rounded-full transition-all"
                style={{ width: `${progress.percentComplete}%` }}
              />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              <div className="bg-slate-700/30 p-2 rounded">
                <div className="text-slate-400">Líneas</div>
                <div className="text-white font-mono">{progress.linesProcessed.toLocaleString()}</div>
              </div>
              <div className="bg-slate-700/30 p-2 rounded">
                <div className="text-slate-400">Válidas</div>
                <div className="text-green-400 font-mono">{progress.validCandles.toLocaleString()}</div>
              </div>
              <div className="bg-slate-700/30 p-2 rounded">
                <div className="text-slate-400">Inválidas</div>
                <div className="text-red-400 font-mono">{progress.invalidLines}</div>
              </div>
              <div className="bg-slate-700/30 p-2 rounded">
                <div className="text-slate-400">Tiempo</div>
                <div className="text-yellow-400 font-mono">
                  {(progress.elapsedMs / 1000).toFixed(1)}s
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Import Statistics */}
        {stats && (
          <div className="bg-slate-700/30 border border-slate-600/50 rounded-lg p-4 space-y-3 text-sm">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              <div>
                <div className="text-slate-400">Total Líneas</div>
                <div className="text-white font-bold">{stats.totalLines.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-slate-400">Candles Válidas</div>
                <div className="text-green-400 font-bold">{stats.validCandles.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-slate-400">Calidad</div>
                <div className="text-blue-400 font-bold">{stats.dataQuality.toFixed(1)}%</div>
              </div>
              {stats.timeRange && (
                <>
                  <div className="col-span-2 md:col-span-1">
                    <div className="text-slate-400">Inicio</div>
                    <div className="text-white text-xs font-mono">
                      {new Date(stats.timeRange.start).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <div className="text-slate-400">Fin</div>
                    <div className="text-white text-xs font-mono">
                      {new Date(stats.timeRange.end).toLocaleDateString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400">Rango (días)</div>
                    <div className="text-white font-bold">
                      {Math.ceil((stats.timeRange.end - stats.timeRange.start) / (1000 * 60 * 60 * 24))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Issues */}
            {(stats.duplicateCount > 0 ||
              stats.gapCount > 0 ||
              stats.outOfOrderCount > 0 ||
              stats.invalidPricesCount > 0) && (
              <div className="bg-yellow-900/20 border border-yellow-600/50 rounded p-2">
                <div className="text-yellow-300 text-xs font-semibold mb-1">Problemas Detectados:</div>
                <div className="grid grid-cols-2 gap-1 text-xs text-yellow-200">
                  {stats.duplicateCount > 0 && <span>• {stats.duplicateCount} duplicados</span>}
                  {stats.gapCount > 0 && <span>• {stats.gapCount} gaps</span>}
                  {stats.outOfOrderCount > 0 && <span>• {stats.outOfOrderCount} fuera de orden</span>}
                  {stats.invalidPricesCount > 0 && <span>• {stats.invalidPricesCount} precios inválidos</span>}
                </div>
              </div>
            )}

            {/* Invalid Lines Preview */}
            {stats.invalidLines.length > 0 && (
              <details className="text-xs">
                <summary className="text-slate-400 cursor-pointer hover:text-slate-300">
                  Ver primeras líneas inválidas ({stats.invalidLines.length})
                </summary>
                <div className="bg-slate-700/50 p-2 rounded mt-2 max-h-40 overflow-y-auto space-y-1 font-mono text-red-300">
                  {stats.invalidLines.map((line, i) => (
                    <div key={i}>{line}</div>
                  ))}
                </div>
              </details>
            )}

            {/* Ready for Backtesting */}
            <div
              className={`flex items-center gap-2 p-2 rounded ${
                stats.dataQuality >= 80
                  ? 'bg-green-900/20 text-green-300'
                  : 'bg-yellow-900/20 text-yellow-300'
              }`}
            >
              {stats.dataQuality >= 80 ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
              <span className="text-xs font-semibold">
                {stats.dataQuality >= 80
                  ? '✓ Listo para backtesting'
                  : '⚠ Calidad baja, recomendamos revisar datos'}
              </span>
            </div>
          </div>
        )}

        {/* Recommendations */}
        <div className="bg-blue-900/20 border border-blue-600/50 rounded-lg p-3 text-xs text-blue-300 space-y-1">
          <p className="font-semibold">📋 Recomendaciones:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Máximo recomendado: {IMPORT_CONFIG.maxFileSizeMB} MB ({(IMPORT_CONFIG.maxFileSizeMB / 25).toFixed(0)} años aprox.)</li>
            <li>Formato: DateTime,Open,High,Low,Close,Volume o Date,Time,Open,High,Low,Close,Volume</li>
            <li>Los datos se procesan en el navegador, no se envían a servidor</li>
            <li>Los datasets no se guardan en GitHub</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
