/**
 * Data Loader Component - Carga datos CSV para backtesting
 * Soporta archivos locales y datos de ejemplo
 */

'use client';

import React, { useState, useRef } from 'react';
import { Upload, AlertCircle, CheckCircle, Loader, TrendingUp } from 'lucide-react';
import { Candle, Asset, Timeframe } from '../../engine/types/marketData';
import { parseCSVContent, validateCandleData } from '../../engine/backtesting/csvImporter';
import {
  convertToMultipleTimeframes,
  validateCandlesForConversion,
  MultiTimeframeResult,
} from '../../engine/backtesting/timeframeConverter';
import TimeframeAnalyzer from './TimeframeAnalyzer';

interface CSVDataLoaderProps {
  asset: Asset;
  timeframe: Timeframe;
  onDataLoaded: (candles: Candle[]) => void;
  onError: (error: string) => void;
  isLoading?: boolean;
}

export default function CSVDataLoader({ asset, timeframe, onDataLoaded, onError, isLoading = false }: CSVDataLoaderProps) {
  const [fileName, setFileName] = useState<string>('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');
  const [stats, setStats] = useState<{
    candleCount: number;
    startDate: string;
    endDate: string;
  } | null>(null);
  const [multiTimeframeResult, setMultiTimeframeResult] = useState<MultiTimeframeResult | null>(null);
  const [showAnalyzer, setShowAnalyzer] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Handle file selection
   */
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setStatus('loading');
    setMessage('Leyendo archivo CSV...');
    setStats(null);
    setMultiTimeframeResult(null);
    setShowAnalyzer(false);

    try {
      const content = await file.text();
      const candles = parseCSVContent(content, asset, timeframe);

      // Validar datos
      const validation = validateCandleData(candles);

      if (!validation.isValid) {
        const errorList = validation.errors.slice(0, 3).join('; ');
        const errorMsg = `Errores en los datos: ${errorList}${validation.errors.length > 3 ? '...' : ''}`;
        setStatus('error');
        setMessage(errorMsg);
        onError(errorMsg);
        return;
      }

      // Mostrar advertencias si las hay
      if (validation.warnings.length > 0) {
        console.warn('CSV Warnings:', validation.warnings);
      }

      // Validar para conversión multi-timeframe
      const conversionValidation = validateCandlesForConversion(candles, timeframe);
      if (conversionValidation.warnings.length > 0) {
        console.warn('Conversion warnings:', conversionValidation.warnings);
      }

      // Procesar estadísticas
      const startDate = new Date(candles[0].timestamp).toLocaleString();
      const endDate = new Date(candles[candles.length - 1].timestamp).toLocaleString();

      setStats({
        candleCount: candles.length,
        startDate,
        endDate,
      });

      // Convertir a múltiples timeframes
      try {
        const multiResult = convertToMultipleTimeframes(candles, timeframe);
        setMultiTimeframeResult(multiResult);
      } catch (convertError) {
        console.warn('Multi-timeframe conversion failed:', convertError);
      }

      setStatus('success');
      setMessage(`✓ Cargados ${candles.length} candles`);
      onDataLoaded(candles);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
      setStatus('error');
      setMessage(`Error: ${errorMsg}`);
      onError(errorMsg);
    }
  };

  /**
   * Load sample data
   */
  const handleLoadSample = async () => {
    setFileName('XAUUSD_M1_sample.csv');
    setStatus('loading');
    setMessage('Cargando datos de ejemplo...');
    setStats(null);
    setMultiTimeframeResult(null);
    setShowAnalyzer(false);

    try {
      const response = await fetch('/sample-data/XAUUSD_M1_sample.csv');
      if (!response.ok) throw new Error('No se pudo cargar el archivo de ejemplo');

      const content = await response.text();
      const candles = parseCSVContent(content, 'XAUUSD', '5M'); // Sample es M1, pero lo marcamos como base

      const validation = validateCandleData(candles);
      if (!validation.isValid) {
        throw new Error('Datos de ejemplo inválidos: ' + validation.errors[0]);
      }

      const startDate = new Date(candles[0].timestamp).toLocaleString();
      const endDate = new Date(candles[candles.length - 1].timestamp).toLocaleString();

      setStats({
        candleCount: candles.length,
        startDate,
        endDate,
      });

      // Convertir a múltiples timeframes
      try {
        const multiResult = convertToMultipleTimeframes(candles, '5M');
        setMultiTimeframeResult(multiResult);
      } catch (convertError) {
        console.warn('Multi-timeframe conversion failed:', convertError);
      }

      setStatus('success');
      setMessage(`✓ Ejemplo cargado: ${candles.length} candles`);
      onDataLoaded(candles);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
      setStatus('error');
      setMessage(`Error: ${errorMsg}`);
      onError(errorMsg);
    }
  };

  /**
   * Clear loaded data
   */
  const handleClear = () => {
    setFileName('');
    setStatus('idle');
    setMessage('');
    setStats(null);
    setMultiTimeframeResult(null);
    setShowAnalyzer(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 space-y-4">
      <h3 className="text-lg font-bold text-white">📂 Cargar Datos CSV</h3>

      <div className="space-y-3">
        {/* File Upload */}
        <div className="border-2 border-dashed border-slate-600 rounded-lg p-4 hover:border-slate-500 transition">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            disabled={isLoading || status === 'loading'}
            className="hidden"
            aria-label="Seleccionar archivo CSV"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading || status === 'loading'}
            className="w-full flex items-center justify-center gap-2 py-3 text-slate-300 hover:text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Upload className="w-5 h-5" />
            <span className="font-medium">
              {fileName ? `Cargado: ${fileName}` : 'Haz clic para seleccionar CSV'}
            </span>
          </button>
        </div>

        {/* Sample Data Button */}
        {!stats && (
          <button
            onClick={handleLoadSample}
            disabled={isLoading || status === 'loading'}
            className="w-full py-2 px-4 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            📋 Usar Datos de Ejemplo XAUUSD
          </button>
        )}

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

        {/* Statistics */}
        {stats && (
          <div className="bg-slate-700/30 border border-slate-600/50 rounded-lg p-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Candles:</span>
              <span className="text-slate-200 font-medium">{stats.candleCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Inicio:</span>
              <span className="text-slate-200 font-medium text-xs">{stats.startDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Fin:</span>
              <span className="text-slate-200 font-medium text-xs">{stats.endDate}</span>
            </div>
          </div>
        )}

        {/* Multi-Timeframe Analyzer Toggle */}
        {multiTimeframeResult && (
          <button
            onClick={() => setShowAnalyzer(!showAnalyzer)}
            className="w-full py-2 px-4 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded transition text-sm flex items-center justify-center gap-2"
          >
            <TrendingUp className="w-4 h-4" />
            {showAnalyzer ? '▼ Ocultar' : '▶ Mostrar'} Análisis Multi-Timeframe
          </button>
        )}

        {/* Clear Button */}
        {stats && (
          <button
            onClick={handleClear}
            disabled={isLoading}
            className="w-full py-2 px-4 bg-slate-600/50 hover:bg-slate-600 text-slate-300 rounded transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            🗑️ Limpiar Datos
          </button>
        )}
      </div>

      {/* Info */}
      <div className="bg-blue-900/20 border border-blue-600/50 rounded-lg p-3 text-xs text-blue-300 space-y-1">
        <p>
          <strong>Formato soportado:</strong> CSV con columnas DateTime,Open,High,Low,Close,Volume o
          Date,Time,Open,High,Low,Close,Volume
        </p>
        <p>
          <strong>Ejemplo:</strong> 2026.06.02 00:05:00,2543.85,2543.95,2543.65,2543.75,12
        </p>
      </div>

      {/* Multi-Timeframe Analyzer */}
      {showAnalyzer && <TimeframeAnalyzer result={multiTimeframeResult} isLoading={isLoading} />}
    </div>
  );
}
