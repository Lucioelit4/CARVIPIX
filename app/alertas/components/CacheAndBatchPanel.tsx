'use client';

/**
 * Panel privado de Cache & Batch para admin
 * Visualizar estado del cache, datasets, y progreso de backtests
 * NO exponer al cliente - PRIVADO PARA ADMIN SOLO
 */

import React, { useState, useEffect } from 'react';

type TabType = 'cache' | 'batch' | 'stats';

export interface CacheAndBatchPanelProps {
  isPrivate?: boolean;
  onClose?: () => void;
}

export function CacheAndBatchPanel({ isPrivate = true, onClose }: CacheAndBatchPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('cache');
  const [cacheStats, setCacheStats] = useState<any>(null);
  const [batchProgress, setBatchProgress] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  if (!isPrivate) {
    return (
      <div className="p-4 bg-red-900/20 border border-red-500 rounded">
        <p className="text-red-500 font-bold">⚠️ Acceso denegado: Panel privado para admin</p>
      </div>
    );
  }

  const mockCacheStats = {
    totalAssets: 4,
    totalTimeframes: 3,
    totalCandleCount: 45000,
    totalFileSize: 1800000,
    cacheHitRate: 87.5,
    datasets: [
      {
        asset: 'XAUUSD',
        timeframe: '1H',
        candleCount: 5000,
        startDate: '2024-01-01',
        endDate: '2024-12-01',
        lastUpdated: new Date(Date.now() - 3600000).toLocaleString(),
        isValid: true,
        source: 'api',
      },
      {
        asset: 'EURUSD',
        timeframe: '1H',
        candleCount: 5000,
        startDate: '2024-01-01',
        endDate: '2024-12-01',
        lastUpdated: new Date(Date.now() - 7200000).toLocaleString(),
        isValid: true,
        source: 'api',
      },
      {
        asset: 'GBPUSD',
        timeframe: '1H',
        candleCount: 5000,
        startDate: '2024-01-01',
        endDate: '2024-12-01',
        lastUpdated: new Date(Date.now() - 86400000).toLocaleString(),
        isValid: true,
        source: 'api',
      },
      {
        asset: 'BTCUSD',
        timeframe: '1H',
        candleCount: 5000,
        startDate: '2024-01-01',
        endDate: '2024-12-01',
        lastUpdated: new Date(Date.now() - 86400000).toLocaleString(),
        isValid: true,
        source: 'api',
      },
    ],
  };

  const mockBatchProgress = {
    batchId: 'batch_1719921600000_abc123def',
    totalJobs: 12,
    completedJobs: 7,
    failedJobs: 1,
    runningJobs: 2,
    pendingJobs: 2,
    percentComplete: 58.3,
    elapsedTime: 245000,
    estimatedTimeRemaining: 180000,
    throughput: 0.0286,
  };

  return (
    <div className="w-full bg-slate-900 border border-slate-700 rounded-lg p-6 text-slate-100">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-700">
        <div>
          <h2 className="text-xl font-bold text-white">🔒 Cache & Batch Manager</h2>
          <p className="text-xs text-slate-400 mt-1">Admin Privado | Gestión de Cache Local | Batch Processing</p>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl">
            ✕
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-slate-700 overflow-x-auto">
        {(['cache', 'batch', 'stats'] as TabType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${
              activeTab === tab
                ? 'border-b-2 border-blue-500 text-blue-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab === 'cache' && '💾 Cache Local'}
            {tab === 'batch' && '⚙️ Batch Processing'}
            {tab === 'stats' && '📊 Estadísticas'}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'cache' && <CacheTab stats={mockCacheStats} />}
      {activeTab === 'batch' && <BatchTab progress={mockBatchProgress} />}
      {activeTab === 'stats' && <StatsTab />}
    </div>
  );
}

// ============ TAB COMPONENTS ============

function CacheTab({ stats }: { stats: any }) {
  return (
    <div className="space-y-4">
      <h3 className="font-bold text-slate-200">Estado del Cache Local</h3>

      {/* Resumen */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-800 rounded p-4">
        <div className="text-center">
          <p className="text-xs text-slate-400">Total Velas</p>
          <p className="text-lg font-bold text-blue-400">{stats.totalCandleCount.toLocaleString()}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-slate-400">Tamaño Cache</p>
          <p className="text-lg font-bold text-blue-400">
            {(stats.totalFileSize / 1024 / 1024).toFixed(1)} MB
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-slate-400">Hit Rate</p>
          <p className="text-lg font-bold text-green-400">{stats.cacheHitRate.toFixed(1)}%</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-slate-400">Activos/TF</p>
          <p className="text-lg font-bold text-blue-400">
            {stats.totalAssets}x{stats.totalTimeframes}
          </p>
        </div>
      </div>

      {/* Datasets */}
      <div className="bg-slate-800 rounded p-4">
        <h4 className="font-bold text-slate-300 mb-3">Datasets Disponibles</h4>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {stats.datasets.map((ds: any, idx: number) => (
            <div key={idx} className="bg-slate-700 rounded p-3 text-sm">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-bold text-slate-200">
                    {ds.asset} {ds.timeframe}
                  </p>
                  <p className="text-xs text-slate-400">
                    {ds.startDate} → {ds.endDate}
                  </p>
                </div>
                <span className={ds.isValid ? 'text-green-400' : 'text-red-400'}>
                  {ds.isValid ? '✓' : '✕'}
                </span>
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>{ds.candleCount.toLocaleString()} velas</span>
                <span>Actualizado: {ds.lastUpdated}</span>
                <span className="text-blue-400">{ds.source}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Acciones */}
      <div className="flex gap-2">
        <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded">
          🔄 Actualizar Cache
        </button>
        <button className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 rounded">
          🧹 Limpiar Cache
        </button>
        <button className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded">
          💾 Exportar
        </button>
      </div>
    </div>
  );
}

function BatchTab({ progress }: { progress: any }) {
  const percentComplete = Math.round(progress.percentComplete);
  const elapsedMins = Math.round(progress.elapsedTime / 60000);
  const remainingMins = Math.round(progress.estimatedTimeRemaining / 60000);

  return (
    <div className="space-y-4">
      <h3 className="font-bold text-slate-200">Batch Processing Status</h3>

      {/* Progreso */}
      <div className="bg-slate-800 rounded p-4 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm font-bold">{progress.batchId}</span>
          <span className="text-sm font-bold text-blue-400">{percentComplete}%</span>
        </div>

        <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
          <div
            className="bg-blue-500 h-full rounded-full transition-all duration-300"
            style={{ width: `${percentComplete}%` }}
          />
        </div>

        <div className="grid grid-cols-5 gap-2 text-center text-xs">
          <div>
            <p className="text-slate-400">Completados</p>
            <p className="font-bold text-green-400">{progress.completedJobs}</p>
          </div>
          <div>
            <p className="text-slate-400">Corriendo</p>
            <p className="font-bold text-blue-400">{progress.runningJobs}</p>
          </div>
          <div>
            <p className="text-slate-400">Pendientes</p>
            <p className="font-bold text-orange-400">{progress.pendingJobs}</p>
          </div>
          <div>
            <p className="text-slate-400">Fallidos</p>
            <p className="font-bold text-red-400">{progress.failedJobs}</p>
          </div>
          <div>
            <p className="text-slate-400">Total</p>
            <p className="font-bold text-slate-300">{progress.totalJobs}</p>
          </div>
        </div>
      </div>

      {/* Tiempos */}
      <div className="grid grid-cols-3 gap-3 bg-slate-800 rounded p-4">
        <div className="text-center">
          <p className="text-xs text-slate-400">Tiempo Transcurrido</p>
          <p className="text-lg font-bold text-blue-400">{elapsedMins} min</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-slate-400">Tiempo Restante</p>
          <p className="text-lg font-bold text-orange-400">{remainingMins} min</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-slate-400">Throughput</p>
          <p className="text-lg font-bold text-green-400">
            {progress.throughput.toFixed(3)} jobs/s
          </p>
        </div>
      </div>

      {/* Detalles de Jobs */}
      <div className="bg-slate-800 rounded p-4">
        <h4 className="font-bold text-slate-300 mb-3">Jobs Recientes</h4>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {[
            { id: 1, asset: 'XAUUSD', tf: '1H', status: '✓', time: '45s' },
            { id: 2, asset: 'EURUSD', tf: '1H', status: '✓', time: '42s' },
            { id: 3, asset: 'GBPUSD', tf: '1H', status: '✓', time: '48s' },
            { id: 4, asset: 'BTCUSD', tf: '1H', status: '⏳', time: '38s' },
            { id: 5, asset: 'XAUUSD', tf: '45M', status: '⏳', time: '22s' },
          ].map((job) => (
            <div key={job.id} className="bg-slate-700 rounded p-2 text-sm flex justify-between">
              <span className="text-slate-300">
                {job.asset} {job.tf}
              </span>
              <span className={job.status === '✓' ? 'text-green-400' : 'text-blue-400'}>
                {job.status} {job.time}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Acciones */}
      <div className="flex gap-2">
        <button className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded">
          ▶️ Nuevo Batch
        </button>
        <button className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 rounded">
          ⏸️ Pausar
        </button>
        <button className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded">
          ⏹️ Cancelar
        </button>
      </div>
    </div>
  );
}

function StatsTab() {
  return (
    <div className="space-y-4">
      <h3 className="font-bold text-slate-200">Estadísticas Generales</h3>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 bg-slate-800 rounded p-4">
        <div className="text-center">
          <p className="text-xs text-slate-400">Batches Completados</p>
          <p className="text-lg font-bold text-green-400">8</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-slate-400">Total Jobs Ejecutados</p>
          <p className="text-lg font-bold text-blue-400">96</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-slate-400">Tasa de Éxito</p>
          <p className="text-lg font-bold text-green-400">95.8%</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-slate-400">Tiempo Total</p>
          <p className="text-lg font-bold text-blue-400">4.2h</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-slate-400">Job Promedio</p>
          <p className="text-lg font-bold text-blue-400">2.6 min</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-slate-400">Cache Hit Rate</p>
          <p className="text-lg font-bold text-green-400">87.5%</p>
        </div>
      </div>

      <div className="bg-green-900/20 border border-green-600 rounded p-3">
        <p className="text-sm text-green-300">
          ✓ Sistema Operativo | Todos los módulos funcionando correctamente
        </p>
      </div>

      <div className="bg-blue-900/20 border border-blue-600 rounded p-3">
        <p className="text-sm text-blue-300">
          ℹ️ Capacidad | 4 workers activos | ~3.2 jobs/min | Sin bottlenecks detectados
        </p>
      </div>
    </div>
  );
}
