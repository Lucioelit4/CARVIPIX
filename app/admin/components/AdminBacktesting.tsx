'use client';

/**
 * Panel Privado de Backtesting - Admin
 * Laboratorio de validación cuantitativa para históricos reales
 */

import React, { useEffect, useMemo, useState } from 'react';
import { BacktestPanelExpanded } from '../../alertas/components/BacktestPanelExpanded';
import { CacheAndBatchPanel } from '../../alertas/components/CacheAndBatchPanel';
import { OptimizerPanel } from '../../alertas/components/OptimizerPanel';
import BacktestExecutor from './BacktestExecutor';
import { ChevronDown } from 'lucide-react';
import { CARVIPIXButton, CARVIPIXCard } from '@/app/design-system';

type BacktestTabType = 'backtest' | 'cache_batch' | 'optimizer';

export default function AdminBacktesting() {
  const [activeTab, setActiveTab] = useState<BacktestTabType>('backtest');
  const [isExpanded, setIsExpanded] = useState(false);
  const [runtime, setRuntime] = useState<{ validation?: { latest?: { overallStatus?: string } }; execution?: { brokerConnected?: boolean; orderQueue?: unknown[]; openPositions?: unknown[]; safeMode?: boolean } } | null>(null);

  useEffect(() => {
    const loadRuntime = async () => {
      try {
        const response = await fetch('/api/admin/system', { cache: 'no-store' });
        const json = (await response.json().catch(() => ({}))) as { data?: { validation?: { latest?: { overallStatus?: string } }; execution?: { brokerConnected?: boolean; orderQueue?: unknown[]; openPositions?: unknown[]; safeMode?: boolean } } };
        if (!response.ok) {
          setRuntime(null);
          return;
        }
        setRuntime(json.data ?? null);
      } catch {
        setRuntime(null);
      }
    };

    const timeoutId = window.setTimeout(() => {
      void loadRuntime();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  const runtimeStatus = useMemo(() => {
    const latest = runtime?.validation?.latest?.overallStatus ?? 'unknown';
    const queueCount = runtime?.execution?.orderQueue?.length ?? 0;
    const positionsCount = runtime?.execution?.openPositions?.length ?? 0;
    const broker = runtime?.execution?.brokerConnected ? 'Conectado' : 'Desconectado';
    const safeMode = runtime?.execution?.safeMode ? 'ON' : 'OFF';
    return { latest, queueCount, positionsCount, broker, safeMode };
  }, [runtime]);

  const tabs = [
    { id: 'backtest' as BacktestTabType, label: '📊 Backtesting Avanzado' },
    { id: 'cache_batch' as BacktestTabType, label: '💾 Cache & Batch' },
    { id: 'optimizer' as BacktestTabType, label: '🔍 Parameter Optimizer' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div>
          <h2 className="text-3xl font-bold text-white mb-1">🔒 Laboratorio de Backtesting Privado</h2>
          <p className="text-white/60">
            Backtesting profesional sobre históricos importados, análisis cuantitativo y herramientas de investigación interna.
          </p>
        </div>

        {/* Info Box */}
        <CARVIPIXCard variant="info" padding="16" hover={false}>
          <p className="text-sm text-blue-300">
            ℹ️ <strong>Panel Privado Admin:</strong> El laboratorio opera sobre datasets históricos cargados por admin.
            No se ejecutan órdenes reales ni se toca el bot operativo.
          </p>
        </CARVIPIXCard>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <CARVIPIXCard variant="statistics" padding="16" hover={false}>
          <p className="text-xs text-slate-400 mb-2">Validación sistema</p>
          <p className="text-2xl font-bold text-green-400">{String(runtimeStatus.latest).toUpperCase()}</p>
          <p className="text-xs text-slate-400 mt-1">Estado real reportado por /api/admin/system</p>
        </CARVIPIXCard>
        <CARVIPIXCard variant="statistics" padding="16" hover={false}>
          <p className="text-xs text-slate-400 mb-2">Broker</p>
          <p className="text-2xl font-bold text-blue-400">{runtimeStatus.broker}</p>
          <p className="text-xs text-slate-400 mt-1">Conector de ejecución</p>
        </CARVIPIXCard>
        <CARVIPIXCard variant="statistics" padding="16" hover={false}>
          <p className="text-xs text-slate-400 mb-2">Queue / Posiciones</p>
          <p className="text-2xl font-bold text-yellow-400">{runtimeStatus.queueCount}/{runtimeStatus.positionsCount}</p>
          <p className="text-xs text-slate-400 mt-1">Órdenes y posiciones del runtime</p>
        </CARVIPIXCard>
        <CARVIPIXCard variant="statistics" padding="16" hover={false}>
          <p className="text-xs text-slate-400 mb-2">SAFE_MODE</p>
          <p className="text-2xl font-bold text-purple-400">{runtimeStatus.safeMode}</p>
          <p className="text-xs text-slate-400 mt-1">Control operativo actual</p>
        </CARVIPIXCard>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-slate-700">
        <div className="flex gap-4 overflow-x-auto">
          {tabs.map((tab) => (
            <CARVIPIXButton
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              variant={activeTab === tab.id ? 'premium' : 'ghost'}
              size="sm"
            >
              {tab.label}
            </CARVIPIXButton>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-6">
        {activeTab === 'backtest' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Backtesting Avanzado</h3>
            </div>
            <BacktestExecutor />
          </div>
        )}

        {activeTab === 'cache_batch' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Cache Local & Batch Processing</h3>
            </div>
            <CacheAndBatchPanel isPrivate={true} />
          </div>
        )}

        {activeTab === 'optimizer' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Parameter Optimization</h3>
            </div>
            <OptimizerPanel isPrivate={true} />
          </div>
        )}
      </div>

      {/* Technical Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Architecture */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <h4 className="font-bold text-slate-200 mb-3">📐 Arquitectura</h4>
          <ul className="text-xs text-slate-400 space-y-2">
            <li>✓ Cache Manager - soporte de datasets locales</li>
            <li>✓ Batch Processor - 4 workers, job queue</li>
            <li>✓ Parameter Optimizer - Grid search engine</li>
            <li>✓ Scoring System - Multi-metric evaluation</li>
            <li>✓ Local-first - No API dependency</li>
            <li>✓ Monte Carlo y Walk Forward integrados</li>
          </ul>
        </div>

        {/* Features */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <h4 className="font-bold text-slate-200 mb-3">🚀 Capacidades</h4>
          <ul className="text-xs text-slate-400 space-y-2">
            <li>✓ Backtesting sobre históricos cargados</li>
            <li>✓ Limpieza y validación de datos</li>
            <li>✓ Monte Carlo + Walk-forward analysis</li>
            <li>✓ Performance tracking real-time</li>
            <li>✓ Private admin visualization</li>
            <li>✓ Zero real operations</li>
          </ul>
        </div>
      </div>

      {/* Status Footer */}
      <div className="bg-green-900/20 border border-green-600/50 rounded-lg p-4">
        <p className="text-xs text-green-300">
          ✅ <strong>Estado del módulo:</strong> laboratorio privado de backtesting enfocado en históricos reales,
          sin impacto en Home, backend público ni bot operativo.
        </p>
      </div>
    </div>
  );
}
