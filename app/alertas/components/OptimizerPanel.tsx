'use client';

/**
 * Panel privado de Parameter Optimizer para admin
 * Visualizar optimización de parámetros, progreso y resultados
 * NO exponer al cliente - PRIVADO PARA ADMIN SOLO
 */

import React, { useState } from 'react';

type TabType = 'progress' | 'results' | 'comparison' | 'recommendations';

export interface OptimizerPanelProps {
  isPrivate?: boolean;
  onClose?: () => void;
}

export function OptimizerPanel({ isPrivate = true, onClose }: OptimizerPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('progress');
  const [isRunning, setIsRunning] = useState(false);

  if (!isPrivate) {
    return (
      <div className="p-4 bg-red-900/20 border border-red-500 rounded">
        <p className="text-red-500 font-bold">⚠️ Acceso denegado: Panel privado para admin</p>
      </div>
    );
  }

  // Mock data
  const mockProgress = {
    optimizationId: 'opt_1719921600000_abc123',
    totalRuns: 288, // 6 consensus × 4 confidence × 4 rr × 4 risk × 3 assets
    completedRuns: 184,
    failedRuns: 3,
    percentComplete: 63.9,
    estimatedTimeRemaining: 180000,
    elapsedTime: 320000,
    avgRunDuration: 1800,
    bestScoreSoFar: 84.5,
    bestCandidate: {
      consensusThreshold: 9,
      minConfidenceScore: 70,
      minRiskReward: 2.0,
      riskPerTrade: 1.0,
    },
  };

  const mockBestCandidates = [
    {
      rank: 1,
      score: 84.5,
      consensus: 9,
      confidence: 70,
      rr: 2.0,
      risk: 1.0,
      profitFactor: 2.3,
      winRate: 58.2,
      drawdown: 15.3,
      trades: 145,
    },
    {
      rank: 2,
      score: 82.1,
      consensus: 9,
      confidence: 70,
      rr: 2.5,
      risk: 1.0,
      profitFactor: 2.1,
      winRate: 56.8,
      drawdown: 14.9,
      trades: 138,
    },
    {
      rank: 3,
      score: 79.8,
      consensus: 8,
      confidence: 70,
      rr: 2.0,
      risk: 1.5,
      profitFactor: 2.0,
      winRate: 55.4,
      drawdown: 16.2,
      trades: 152,
    },
  ];

  const mockPerAsset = {
    XAUUSD: { bestScore: 86.2, avgScore: 72.3, candidates: 8 },
    EURUSD: { bestScore: 83.1, avgScore: 70.1, candidates: 7 },
    GBPUSD: { bestScore: 81.5, avgScore: 68.9, candidates: 6 },
    BTCUSD: { bestScore: 82.8, avgScore: 71.2, candidates: 7 },
  };

  const mockRecommendations = {
    universalBest: {
      name: 'Consensus 9 / Confidence 70 / RR 2.0 / Risk 1.0%',
      score: 84.5,
      confidence: 'ALTA - Funciona bien en todos los activos',
    },
    assetSpecific: [
      { asset: 'XAUUSD', config: 'Consensus 9 / RR 2.0', score: 86.2 },
      { asset: 'EURUSD', config: 'Consensus 8 / RR 2.5', score: 83.1 },
      { asset: 'GBPUSD', config: 'Consensus 9 / RR 2.0', score: 81.5 },
      { asset: 'BTCUSD', config: 'Consensus 10 / RR 2.0', score: 82.8 },
    ],
    warnings: [
      'XAUUSD necesita mayor consenso (10) para mejor estabilidad',
      'BTCUSD: considerar aumentar RR a 2.5 para mejorar drawdown',
    ],
  };

  return (
    <div className="w-full bg-slate-900 border border-slate-700 rounded-lg p-6 text-slate-100">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-700">
        <div>
          <h2 className="text-xl font-bold text-white">🔒 Parameter Optimizer</h2>
          <p className="text-xs text-slate-400 mt-1">Admin Privado | Optimización de Parámetros</p>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl">
            ✕
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-slate-700 overflow-x-auto">
        {(['progress', 'results', 'comparison', 'recommendations'] as TabType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${
              activeTab === tab
                ? 'border-b-2 border-blue-500 text-blue-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab === 'progress' && '⏳ Progreso'}
            {tab === 'results' && '🏆 Mejores Resultados'}
            {tab === 'comparison' && '📊 Comparación'}
            {tab === 'recommendations' && '💡 Recomendaciones'}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'progress' && <ProgressTab progress={mockProgress} isRunning={isRunning} />}
      {activeTab === 'results' && <ResultsTab candidates={mockBestCandidates} perAsset={mockPerAsset} />}
      {activeTab === 'comparison' && <ComparisonTab />}
      {activeTab === 'recommendations' && <RecommendationsTab recommendations={mockRecommendations} />}
    </div>
  );
}

// ============ TAB COMPONENTS ============

function ProgressTab({ progress, isRunning }: { progress: any; isRunning: boolean }) {
  const percentComplete = Math.round(progress.percentComplete);
  const remainingMins = Math.round(progress.estimatedTimeRemaining / 60000);
  const elapsedMins = Math.round(progress.elapsedTime / 60000);

  return (
    <div className="space-y-4">
      <h3 className="font-bold text-slate-200">Progreso de Optimización</h3>

      {/* Progreso Principal */}
      <div className="bg-slate-800 rounded p-4 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm font-bold">Combinaciones Evaluadas</span>
          <span className="text-sm font-bold text-blue-400">{percentComplete}%</span>
        </div>

        <div className="w-full bg-slate-700 rounded-full h-4 overflow-hidden">
          <div
            className="bg-blue-500 h-full rounded-full transition-all duration-300"
            style={{ width: `${percentComplete}%` }}
          />
        </div>

        <div className="grid grid-cols-5 gap-2 text-center text-xs">
          <div>
            <p className="text-slate-400">Completadas</p>
            <p className="font-bold text-green-400">{progress.completedRuns}</p>
          </div>
          <div>
            <p className="text-slate-400">Fallidas</p>
            <p className="font-bold text-red-400">{progress.failedRuns}</p>
          </div>
          <div>
            <p className="text-slate-400">Pendientes</p>
            <p className="font-bold text-orange-400">{progress.totalRuns - progress.completedRuns - progress.failedRuns}</p>
          </div>
          <div>
            <p className="text-slate-400">Tiempo Promedio</p>
            <p className="font-bold text-blue-400">{(progress.avgRunDuration / 1000).toFixed(1)}s</p>
          </div>
          <div>
            <p className="text-slate-400">Total</p>
            <p className="font-bold text-slate-300">{progress.totalRuns}</p>
          </div>
        </div>
      </div>

      {/* Tiempos */}
      <div className="grid grid-cols-3 gap-3 bg-slate-800 rounded p-4">
        <div className="text-center">
          <p className="text-xs text-slate-400">Transcurrido</p>
          <p className="text-lg font-bold text-blue-400">{elapsedMins} min</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-slate-400">Restante (Est.)</p>
          <p className="text-lg font-bold text-orange-400">{remainingMins} min</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-slate-400">Mejor Score</p>
          <p className="text-lg font-bold text-green-400">{progress.bestScoreSoFar.toFixed(1)}</p>
        </div>
      </div>

      {/* Mejor Candidato Actual */}
      <div className="bg-green-900/20 border border-green-600 rounded p-3">
        <p className="text-sm font-bold text-green-300 mb-2">🏆 Mejor Candidato Actual</p>
        <div className="text-xs text-green-200 space-y-1">
          <p>Consensus: {progress.bestCandidate.consensusThreshold}/11</p>
          <p>Confidence: {progress.bestCandidate.minConfidenceScore}%</p>
          <p>RR Mínimo: {progress.bestCandidate.minRiskReward}</p>
          <p>Risk: {progress.bestCandidate.riskPerTrade}%</p>
        </div>
      </div>

      {/* Acciones */}
      <div className="flex gap-2">
        <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded">
          {isRunning ? '⏸️ Pausar' : '▶️ Iniciar'}
        </button>
        <button className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 rounded">
          🔄 Resetear
        </button>
        <button className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded">
          💾 Guardar
        </button>
      </div>
    </div>
  );
}

function ResultsTab({ candidates, perAsset }: { candidates: any[]; perAsset: any }) {
  return (
    <div className="space-y-4">
      <h3 className="font-bold text-slate-200">Top 10 Configuraciones</h3>

      {/* Tabla de Candidatos */}
      <div className="bg-slate-800 rounded overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="px-3 py-2 text-left text-blue-400">Rank</th>
              <th className="px-3 py-2 text-left text-blue-400">Score</th>
              <th className="px-3 py-2 text-left text-blue-400">Consensus</th>
              <th className="px-3 py-2 text-left text-blue-400">Confidence</th>
              <th className="px-3 py-2 text-left text-blue-400">RR</th>
              <th className="px-3 py-2 text-left text-blue-400">Risk</th>
              <th className="px-3 py-2 text-left text-blue-400">PF</th>
              <th className="px-3 py-2 text-left text-blue-400">WR %</th>
              <th className="px-3 py-2 text-left text-blue-400">Drawdown</th>
              <th className="px-3 py-2 text-left text-blue-400">Trades</th>
            </tr>
          </thead>
          <tbody>
            {candidates.map((cand) => (
              <tr key={cand.rank} className="border-b border-slate-700 hover:bg-slate-700/50">
                <td className="px-3 py-2 font-bold text-green-400">#{cand.rank}</td>
                <td className="px-3 py-2 font-bold text-blue-400">{cand.score.toFixed(1)}</td>
                <td className="px-3 py-2">{cand.consensus}/11</td>
                <td className="px-3 py-2">{cand.confidence}%</td>
                <td className="px-3 py-2">{cand.rr}</td>
                <td className="px-3 py-2">{cand.risk}%</td>
                <td className="px-3 py-2">{cand.profitFactor.toFixed(2)}</td>
                <td className="px-3 py-2">{cand.winRate.toFixed(1)}%</td>
                <td className="px-3 py-2 text-orange-400">{cand.drawdown.toFixed(1)}%</td>
                <td className="px-3 py-2">{cand.trades}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Estadísticas por Activo */}
      <div>
        <h4 className="font-bold text-slate-300 mb-2">Mejor Score por Activo</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(perAsset).map(([asset, stats]: [string, any]) => (
            <div key={asset} className="bg-slate-700 rounded p-3">
              <p className="font-bold text-blue-400">{asset}</p>
              <p className="text-xs text-slate-400 mt-1">Mejor: {stats.bestScore.toFixed(1)}</p>
              <p className="text-xs text-slate-400">Promedio: {stats.avgScore.toFixed(1)}</p>
              <p className="text-xs text-slate-400">{stats.candidates} candidatos</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ComparisonTab() {
  return (
    <div className="space-y-4">
      <h3 className="font-bold text-slate-200">Análisis de Sensibilidad de Parámetros</h3>

      <div className="bg-slate-800 rounded p-4 space-y-4">
        <div>
          <p className="font-bold text-slate-300 mb-2">📊 Impacto: Consensus Threshold</p>
          <div className="flex gap-2 h-8">
            {[7, 8, 9, 10].map((c) => (
              <div key={c} className="flex-1 flex flex-col items-center justify-end">
                <div
                  className="w-full bg-blue-500 rounded-t"
                  style={{ height: `${50 + c * 5}%` }}
                />
                <p className="text-xs mt-1">{c}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="font-bold text-slate-300 mb-2">📊 Impacto: Min Confidence Score</p>
          <div className="flex gap-2 h-8">
            {[50, 60, 70, 80].map((c) => (
              <div key={c} className="flex-1 flex flex-col items-center justify-end">
                <div
                  className="w-full bg-green-500 rounded-t"
                  style={{ height: `${30 + (c - 50) / 30 * 70}%` }}
                />
                <p className="text-xs mt-1">{c}%</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="font-bold text-slate-300 mb-2">📊 Impacto: Min RR</p>
          <div className="flex gap-2 h-8">
            {[1.5, 2.0, 2.5, 3.0].map((rr) => (
              <div key={rr} className="flex-1 flex flex-col items-center justify-end">
                <div
                  className="w-full bg-orange-500 rounded-t"
                  style={{ height: `${40 + (rr - 1.5) / 1.5 * 60}%` }}
                />
                <p className="text-xs mt-1">{rr}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <p className="text-xs text-slate-400">
        ✓ Mayor consensus = Mayor estabilidad pero menos trades. Mayor confidence = Más selectivo pero trading más conservador.
      </p>
    </div>
  );
}

function RecommendationsTab({ recommendations }: { recommendations: any }) {
  return (
    <div className="space-y-4">
      <h3 className="font-bold text-slate-200">Recomendaciones de Configuración</h3>

      {/* Universal Best */}
      <div className="bg-green-900/20 border border-green-600 rounded p-4">
        <p className="font-bold text-green-300 mb-2">🏆 Configuración Universal Recomendada</p>
        <div className="text-sm text-green-200 space-y-1 mb-3">
          <p>{recommendations.universalBest.name}</p>
          <p className="font-bold">Score: {recommendations.universalBest.score.toFixed(1)}/100</p>
        </div>
        <p className="text-xs text-green-300">{recommendations.universalBest.confidence}</p>
      </div>

      {/* Asset Specific */}
      <div>
        <h4 className="font-bold text-slate-300 mb-3">🎯 Configuraciones por Activo</h4>
        <div className="space-y-2">
          {recommendations.assetSpecific.map((rec: any) => (
            <div key={rec.asset} className="bg-slate-700 rounded p-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold text-blue-400">{rec.asset}</p>
                  <p className="text-xs text-slate-400">{rec.config}</p>
                </div>
                <p className="font-bold text-blue-400">{rec.score.toFixed(1)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Warnings */}
      <div className="bg-orange-900/20 border border-orange-600 rounded p-3">
        <p className="font-bold text-orange-300 mb-2">⚠️ Advertencias y Mejoras</p>
        <ul className="text-sm text-orange-200 space-y-1">
          {recommendations.warnings.map((warning: string, idx: number) => (
            <li key={idx}>• {warning}</li>
          ))}
        </ul>
      </div>

      {/* Action */}
      <div className="flex gap-2">
        <button className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded">
          ✓ Aplicar Recomendación
        </button>
        <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded">
          📊 Guardar Reporte
        </button>
      </div>
    </div>
  );
}
