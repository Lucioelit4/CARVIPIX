"use client";

import { CertificationSummary } from "@/app/lib/types/certificationTypes";

interface CertificationCountersProps {
  summary: CertificationSummary;
  isLoading: boolean;
}

export function CertificationCounters({ summary, isLoading }: CertificationCountersProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 opacity-50">
        <div className="bg-slate-100 rounded-lg p-4 h-20 animate-pulse" />
        <div className="bg-slate-100 rounded-lg p-4 h-20 animate-pulse" />
        <div className="bg-slate-100 rounded-lg p-4 h-20 animate-pulse" />
        <div className="bg-slate-100 rounded-lg p-4 h-20 animate-pulse" />
      </div>
    );
  }

  const { progress } = summary;
  const progressPercent = (progress.current / progress.required) * 100;

  return (
    <div className="mb-8 space-y-4">
      {/* ACTA DE CERTIFICACIÓN HEADER */}
      <div className="border-2 border-blue-500 rounded-lg p-6 bg-gradient-to-r from-blue-50 to-cyan-50">
        <h2 className="text-2xl font-bold text-blue-900 mb-4">📋 ACTA DE CERTIFICACIÓN V3</h2>
        
        {/* Barra de progreso */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="font-semibold text-gray-700">Certificación mínima:</span>
            <span className="text-lg font-bold text-blue-600">
              {progress.current} / {progress.required} ciclos reales completos
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                progress.ready_for_review ? "bg-green-500" : "bg-yellow-500"
              }`}
              style={{ width: `${Math.min(progressPercent, 100)}%` }}
            />
          </div>
          {progress.ready_for_review && (
            <p className="text-sm text-green-600 font-semibold mt-2">
              ✅ LISTO PARA REVISIÓN FINAL
            </p>
          )}
        </div>
      </div>

      {/* Contadores principales */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-1">Ciclos Totales</div>
          <div className="text-2xl font-bold text-gray-900">{summary.total_cycles}</div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-1">Completados</div>
          <div className="text-2xl font-bold text-green-600">{summary.completed}</div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-1">Omitidos (pre-IA)</div>
          <div className="text-2xl font-bold text-yellow-600">{summary.skipped_before_ai}</div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-1">Reutilizados</div>
          <div className="text-2xl font-bold text-blue-600">{summary.reused_previous}</div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-1">Errores/Fallos</div>
          <div className="text-2xl font-bold text-red-600">{summary.ai_errors + summary.failed}</div>
        </div>
      </div>

      {/* Fila 2: Costo, Distribución, Paper */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-1">Costo Total</div>
          <div className="text-2xl font-bold text-purple-600">${summary.total_cost_usd.toFixed(2)}</div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-1">Distribución Éxito</div>
          <div className="text-2xl font-bold text-indigo-600">{summary.distribution_success_rate.toFixed(1)}%</div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-1">Instrumentos</div>
          <div className="text-sm font-mono text-gray-700">{summary.unique_instruments.join(", ")}</div>
        </div>
      </div>

      {/* Fila 3: Paper Account */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-1">Pos. Abiertas (Paper)</div>
          <div className="text-2xl font-bold text-orange-600">{summary.open_paper_positions}</div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-1">Pos. Cerradas (Paper)</div>
          <div className="text-2xl font-bold text-green-600">{summary.closed_paper_positions}</div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-1">Estado</div>
          <div className="text-sm font-semibold text-gray-700">
            ✅ Cero ejecución real
          </div>
        </div>
      </div>
    </div>
  );
}
