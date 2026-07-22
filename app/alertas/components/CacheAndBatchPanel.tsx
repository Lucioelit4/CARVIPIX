'use client';

/**
 * Panel privado de Cache & Batch para admin.
 * Conecta con el laboratorio masivo real de backtesting.
 */

import React, { useEffect, useState } from 'react';
import type { Asset, Timeframe } from '../../engine/types/marketData';

type TabType = 'cache' | 'batch' | 'stats';

interface InventoryFile {
  name: string;
  path: string;
  asset: Asset;
  sourceTimeframe: string;
  year: string;
  month: string;
  size: number;
}

interface MassiveInventory {
  files: InventoryFile[];
  availableYears: string[];
  availableAssets: Asset[];
  cpuCores: number;
  suggestedWorkers: number;
}

interface MassiveSummary {
  totalJobs: number;
  completedJobs: number;
  failedJobs: number;
  yearsCovered: string[];
  assetsCovered: Asset[];
  timeframesCovered: Timeframe[];
  totalTrades: number;
  averageWinRate: number;
  averageProfitFactor: number;
  averageSharpeRatio: number;
  averageMaxDrawdown: number;
  totalNetProfit: number;
  medianNetProfit: number;
}

interface MassiveRunResult {
  runId: string;
  durationMs: number;
  workersUsed: number;
  summary: MassiveSummary;
}

export interface CacheAndBatchPanelProps {
  isPrivate?: boolean;
  onClose?: () => void;
}

export function CacheAndBatchPanel({ isPrivate = true, onClose }: CacheAndBatchPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('cache');
  const [inventory, setInventory] = useState<MassiveInventory | null>(null);
  const [result, setResult] = useState<MassiveRunResult | null>(null);
  const [loadingInventory, setLoadingInventory] = useState(false);
  const [runningBatch, setRunningBatch] = useState(false);
  const [error, setError] = useState('');

  const [workers, setWorkers] = useState(4);
  const [includeMonteCarlo, setIncludeMonteCarlo] = useState(true);
  const [includeWalkForward, setIncludeWalkForward] = useState(true);

  useEffect(() => {
    void loadInventory();
  }, []);

  async function loadInventory(): Promise<void> {
    setLoadingInventory(true);
    setError('');

    try {
      const response = await fetch('/api/backtesting/massive?action=plan');
      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || 'No se pudo cargar inventario');
      }

      setInventory(data.inventory as MassiveInventory);
      if (typeof data.inventory?.suggestedWorkers === 'number') {
        setWorkers(Math.max(1, data.inventory.suggestedWorkers));
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Error de inventario');
      setInventory(null);
    } finally {
      setLoadingInventory(false);
    }
  }

  async function runMassiveBatch(): Promise<void> {
    setRunningBatch(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/backtesting/massive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          initialBalance: 10000,
          riskPerTrade: 1,
          consensusThreshold: 7,
          maxDrawdown: 50,
          minWinRate: 40,
          maxWorkers: workers,
          includeMonteCarlo,
          includeWalkForward,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.ok) {
        throw new Error(data.error || 'Fallo la ejecucion del batch masivo');
      }

      setResult(data.result as MassiveRunResult);
      setActiveTab('stats');
      await loadInventory();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Error ejecutando batch');
    } finally {
      setRunningBatch(false);
    }
  }

  if (!isPrivate) {
    return (
      <div className="p-4 bg-red-900/20 border border-red-500 rounded">
        <p className="text-red-500 font-bold">Acceso denegado: panel privado para admin</p>
      </div>
    );
  }

  return (
    <div className="w-full bg-slate-900 border border-slate-700 rounded-lg p-6 text-slate-100">
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-700">
        <div>
          <h2 className="text-xl font-bold text-white">Laboratorio Masivo: Cache & Batch</h2>
          <p className="text-xs text-slate-400 mt-1">Admin privado | datasets historicos por anio | paralelismo local</p>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl" aria-label="Cerrar panel">
            X
          </button>
        )}
      </div>

      <div className="mb-6 flex flex-wrap gap-2 border-b border-slate-700 pb-2">
        {(['cache', 'batch', 'stats'] as TabType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === tab
                ? 'border-b-2 border-blue-500 text-blue-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab === 'cache' && 'Cache Local'}
            {tab === 'batch' && 'Batch Masivo'}
            {tab === 'stats' && 'Estadisticas'}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 bg-red-900/30 border border-red-700 rounded p-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {activeTab === 'cache' && (
        <CacheTab inventory={inventory} loading={loadingInventory} onRefresh={loadInventory} />
      )}
      {activeTab === 'batch' && (
        <BatchTab
          inventory={inventory}
          running={runningBatch}
          workers={workers}
          includeMonteCarlo={includeMonteCarlo}
          includeWalkForward={includeWalkForward}
          onWorkersChange={setWorkers}
          onMonteCarloChange={setIncludeMonteCarlo}
          onWalkForwardChange={setIncludeWalkForward}
          onRun={runMassiveBatch}
        />
      )}
      {activeTab === 'stats' && <StatsTab result={result} />}

      <div className="mt-6 bg-green-900/20 border border-green-700 rounded p-3 text-xs text-green-300">
        Estado: laboratorio conectado al engine masivo con deteccion de anios, ejecucion paralela y resumen cuantitativo completo.
      </div>

      <div className="mt-2 text-[11px] text-slate-500">
        Nota: esta fase prepara infraestructura de evaluacion. La optimizacion de estrategias queda desactivada por alcance.
      </div>
    </div>
  );
}

function CacheTab({
  inventory,
  loading,
  onRefresh,
}: {
  inventory: MassiveInventory | null;
  loading: boolean;
  onRefresh: () => Promise<void>;
}) {
  const totalSize = inventory?.files.reduce((acc, file) => acc + file.size, 0) || 0;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-slate-200">Inventario de datasets historicos</h3>
        <button
          onClick={() => void onRefresh()}
          disabled={loading}
          className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded"
        >
          {loading ? 'Actualizando...' : 'Actualizar'}
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-800 rounded p-4">
        <MetricCard label="Archivos" value={inventory?.files.length ?? 0} />
        <MetricCard label="Anios" value={inventory?.availableYears.length ?? 0} />
        <MetricCard label="Activos" value={inventory?.availableAssets.length ?? 0} />
        <MetricCard label="Tamano" value={`${(totalSize / 1024 / 1024).toFixed(1)} MB`} />
      </div>

      <div className="bg-slate-800 rounded p-4">
        <h4 className="font-bold text-slate-300 mb-2">Cobertura anual detectada</h4>
        <div className="text-sm text-slate-300 break-all">
          {inventory?.availableYears.length ? inventory.availableYears.join(', ') : 'Pendiente de carga de datasets'}
        </div>
      </div>

      <div className="bg-slate-800 rounded p-4 max-h-64 overflow-y-auto">
        <h4 className="font-bold text-slate-300 mb-3">Archivos</h4>
        {inventory?.files.length ? (
          <div className="space-y-2 text-xs">
            {inventory.files.map((file) => (
              <div key={file.name} className="bg-slate-700 rounded p-2 flex justify-between gap-2">
                <span className="text-slate-200 truncate">{file.name}</span>
                <span className="text-slate-400">
                  {file.asset} {file.year}-{file.month}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400">No hay archivos detectados.</p>
        )}
      </div>
    </div>
  );
}

function BatchTab({
  inventory,
  running,
  workers,
  includeMonteCarlo,
  includeWalkForward,
  onWorkersChange,
  onMonteCarloChange,
  onWalkForwardChange,
  onRun,
}: {
  inventory: MassiveInventory | null;
  running: boolean;
  workers: number;
  includeMonteCarlo: boolean;
  includeWalkForward: boolean;
  onWorkersChange: (value: number) => void;
  onMonteCarloChange: (value: boolean) => void;
  onWalkForwardChange: (value: boolean) => void;
  onRun: () => Promise<void>;
}) {
  const recommendedWorkers = inventory?.suggestedWorkers ?? 1;

  return (
    <div className="space-y-4">
      <h3 className="font-bold text-slate-200">Ejecucion masiva de backtesting</h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-800 rounded p-4">
        <div>
          <p className="text-xs text-slate-400 mb-1">CPU detectada</p>
          <p className="text-lg font-bold text-slate-100">{inventory?.cpuCores ?? '--'} cores</p>
        </div>
        <div>
          <p className="text-xs text-slate-400 mb-1">Workers recomendados</p>
          <p className="text-lg font-bold text-blue-400">{recommendedWorkers}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400 mb-1">Cobertura</p>
          <p className="text-lg font-bold text-green-400">
            {(inventory?.availableYears.length ?? 0)} anios
          </p>
        </div>
      </div>

      <div className="bg-slate-800 rounded p-4 space-y-3">
        <label className="block text-sm text-slate-300">
          Workers paralelos
          <input
            type="number"
            min={1}
            max={inventory?.cpuCores ?? 16}
            value={workers}
            onChange={(event) => onWorkersChange(Number(event.target.value) || 1)}
            className="mt-1 w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
          />
        </label>

        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={includeMonteCarlo}
            onChange={(event) => onMonteCarloChange(event.target.checked)}
          />
          Incluir Monte Carlo en todos los jobs
        </label>

        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={includeWalkForward}
            onChange={(event) => onWalkForwardChange(event.target.checked)}
          />
          Incluir Walk Forward en todos los jobs
        </label>
      </div>

      <button
        onClick={() => void onRun()}
        disabled={running || !inventory || inventory.files.length === 0}
        className="w-full py-3 rounded font-bold bg-green-600 hover:bg-green-500 disabled:opacity-50"
      >
        {running ? 'Ejecutando laboratorio masivo...' : 'Ejecutar backtesting masivo (todos los anios)'}
      </button>
    </div>
  );
}

function StatsTab({ result }: { result: MassiveRunResult | null }) {
  if (!result) {
    return (
      <div className="bg-slate-800 rounded p-4 text-sm text-slate-400">
        Aun no hay ejecuciones. Lanza un batch masivo para generar estadisticas completas.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="font-bold text-slate-200">Resultado del ultimo batch</h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-800 rounded p-4">
        <MetricCard label="Jobs" value={`${result.summary.completedJobs}/${result.summary.totalJobs}`} />
        <MetricCard label="Workers" value={result.workersUsed} />
        <MetricCard label="Trades" value={result.summary.totalTrades.toLocaleString()} />
        <MetricCard label="Duracion" value={`${Math.round(result.durationMs / 1000)}s`} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 bg-slate-800 rounded p-4 text-sm">
        <MetricCard label="Win Rate prom." value={`${result.summary.averageWinRate.toFixed(2)}%`} />
        <MetricCard label="Profit Factor prom." value={result.summary.averageProfitFactor.toFixed(3)} />
        <MetricCard label="Sharpe prom." value={result.summary.averageSharpeRatio.toFixed(3)} />
        <MetricCard label="Drawdown prom." value={`${result.summary.averageMaxDrawdown.toFixed(2)}%`} />
        <MetricCard label="Net Profit total" value={`$${result.summary.totalNetProfit.toFixed(2)}`} />
        <MetricCard label="Net Profit mediana" value={`$${result.summary.medianNetProfit.toFixed(2)}`} />
      </div>

      <div className="bg-slate-800 rounded p-4 text-sm text-slate-300">
        <p>Anios cubiertos: {result.summary.yearsCovered.join(', ')}</p>
        <p>Activos cubiertos: {result.summary.assetsCovered.join(', ') || 'N/A'}</p>
        <p>Timeframes cubiertos: {result.summary.timeframesCovered.join(', ') || 'N/A'}</p>
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="text-center">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-lg font-bold text-blue-400">{value}</p>
    </div>
  );
}
