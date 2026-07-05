'use client';

/**
 * Panel Privado de Backtesting - Admin
 * Laboratorio de validación cuantitativa para históricos reales
 */

import React, { useState } from 'react';
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
          <p className="text-xs text-slate-400 mb-2">Cache Status</p>
          <p className="text-2xl font-bold text-green-400">✓ Ready</p>
          <p className="text-xs text-slate-400 mt-1">Importación histórica habilitada</p>
        </CARVIPIXCard>
        <CARVIPIXCard variant="statistics" padding="16" hover={false}>
          <p className="text-xs text-slate-400 mb-2">Batch Processing</p>
          <p className="text-2xl font-bold text-blue-400">⚙️ Ready</p>
          <p className="text-xs text-slate-400 mt-1">Procesamiento por lotes disponible</p>
        </CARVIPIXCard>
        <CARVIPIXCard variant="statistics" padding="16" hover={false}>
          <p className="text-xs text-slate-400 mb-2">Optimization</p>
          <p className="text-2xl font-bold text-yellow-400">⚡ Ready</p>
          <p className="text-xs text-slate-400 mt-1">Monte Carlo + Walk Forward</p>
        </CARVIPIXCard>
        <CARVIPIXCard variant="statistics" padding="16" hover={false}>
          <p className="text-xs text-slate-400 mb-2">Last Build</p>
          <p className="text-2xl font-bold text-purple-400">✓ Build</p>
          <p className="text-xs text-slate-400 mt-1">Validación en curso</p>
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
