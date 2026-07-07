'use client';

import React from 'react';
import { AlertCircle, CheckCircle, Clock, Lock, HelpCircle } from 'lucide-react';
import { getStrategyEngineStatus, getBlockingDependencies } from '../lib/strategyStatus';

interface ComponentStatusDisplayProps {
  icon: string;
  name: string;
  status: 'FUNCIONAL' | 'ESTRUCTURA' | 'BLOQUEADO' | 'PENDIENTE' | 'COMPLETO';
  details: string;
  blockedBy?: string;
  lastUpdated: string;
}

const ComponentStatusCard: React.FC<ComponentStatusDisplayProps> = ({
  icon,
  name,
  status,
  details,
  blockedBy,
  lastUpdated,
}) => {
  const getStatusColor = () => {
    switch (status) {
      case 'FUNCIONAL':
        return 'bg-yellow-50 border-yellow-200';
      case 'ESTRUCTURA':
        return 'bg-blue-50 border-blue-200';
      case 'BLOQUEADO':
        return 'bg-red-50 border-red-200';
      case 'PENDIENTE':
        return 'bg-gray-50 border-gray-200';
      case 'COMPLETO':
        return 'bg-green-50 border-green-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getStatusTextColor = () => {
    switch (status) {
      case 'FUNCIONAL':
        return 'text-yellow-800';
      case 'ESTRUCTURA':
        return 'text-blue-800';
      case 'BLOQUEADO':
        return 'text-red-800';
      case 'PENDIENTE':
        return 'text-gray-800';
      case 'COMPLETO':
        return 'text-green-800';
      default:
        return 'text-gray-800';
    }
  };

  const statusIcon = () => {
    switch (status) {
      case 'FUNCIONAL':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'ESTRUCTURA':
        return <HelpCircle className="w-5 h-5 text-blue-600" />;
      case 'BLOQUEADO':
        return <Lock className="w-5 h-5 text-red-600" />;
      case 'PENDIENTE':
        return <AlertCircle className="w-5 h-5 text-gray-600" />;
      case 'COMPLETO':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      default:
        return <HelpCircle className="w-5 h-5 text-gray-600" />;
    }
  };

  return (
    <div className={`border rounded-lg p-4 mb-4 ${getStatusColor()}`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{icon}</span>
          <div>
            <h3 className="font-semibold text-gray-900">{name}</h3>
            <div className="flex items-center gap-2 mt-1">
              {statusIcon()}
              <span className={`text-sm font-medium ${getStatusTextColor()}`}>{status}</span>
            </div>
          </div>
        </div>
      </div>

      <p className="text-sm text-gray-700 mb-2">{details}</p>

      {blockedBy && (
        <div className="mt-3 pt-3 border-t border-current border-opacity-20">
          <div className="flex items-start gap-2">
            <Lock className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-semibold text-gray-700 mb-1">Bloqueado por:</p>
              <p className="text-xs text-gray-600">{blockedBy}</p>
            </div>
          </div>
        </div>
      )}

      <p className="text-xs text-gray-500 mt-3">Última actualización: {lastUpdated}</p>
    </div>
  );
};

export default function StrategyStatusPanel() {
  const status = getStrategyEngineStatus();
  const dependencies = getBlockingDependencies();

  return (
    <div className="w-full max-w-6xl mx-auto p-6 bg-white">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">CARVIPIX Strategy Engine Status</h1>
        <p className="text-gray-600">
          Estado real sin porcentajes engañosos. Cada componente tiene estados y bloqueadores claros.
        </p>
      </div>

      {/* Build Status */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Build Status</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200 rounded p-4">
            <p className="text-xs text-gray-600 mb-1">TypeScript Compilation</p>
            <p className="text-lg font-bold text-green-600">{status.buildStatus.compilation}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded p-4">
            <p className="text-xs text-gray-600 mb-1">Compilation Time</p>
            <p className="text-lg font-bold text-gray-900">{status.buildStatus.compilationTime}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded p-4">
            <p className="text-xs text-gray-600 mb-1">Type Errors</p>
            <p className="text-lg font-bold text-green-600">{status.buildStatus.typeErrors}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded p-4">
            <p className="text-xs text-gray-600 mb-1">Warnings</p>
            <p className="text-lg font-bold text-green-600">{status.buildStatus.warnings}</p>
          </div>
        </div>
      </div>

      {/* Components Status */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Components</h2>

        {/* Strategy Engine */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">⚙️ Strategy Engine</h3>
          <div className="ml-4">
            {status.components.slice(0, 4).map((component, idx) => (
              <ComponentStatusCard key={idx} {...component} />
            ))}
          </div>
        </div>

        {/* Data & Validation */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">📊 Data & Validation</h3>
          <div className="ml-4">
            {status.components.slice(4).map((component, idx) => (
              <ComponentStatusCard key={idx + 4} {...component} />
            ))}
          </div>
        </div>
      </div>

      {/* Status Legend */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Estado Legend</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="border-l-4 border-yellow-400 pl-3">
            <p className="font-semibold text-yellow-800">🟡 FUNCIONAL</p>
            <p className="text-xs text-gray-600">Implementado, provisorio, pendiente validación local</p>
          </div>
          <div className="border-l-4 border-blue-400 pl-3">
            <p className="font-semibold text-blue-800">🏗️ ESTRUCTURA</p>
            <p className="text-xs text-gray-600">Scaffolding listo, parámetros pendientes</p>
          </div>
          <div className="border-l-4 border-red-400 pl-3">
            <p className="font-semibold text-red-800">🚫 BLOQUEADO</p>
            <p className="text-xs text-gray-600">Aguardando dependencia anterior</p>
          </div>
          <div className="border-l-4 border-gray-400 pl-3">
            <p className="font-semibold text-gray-800">🚫 PENDIENTE</p>
            <p className="text-xs text-gray-600">Requerimientos no definidos</p>
          </div>
          <div className="border-l-4 border-green-400 pl-3">
            <p className="font-semibold text-green-800">✅ COMPLETO</p>
            <p className="text-xs text-gray-600">Listo para usar</p>
          </div>
        </div>
      </div>

      {/* Dependencies Tree */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-lg font-bold text-blue-900 mb-4">Dependency Chain</h2>
        <div className="space-y-4">
          {Object.entries(dependencies).map(([component, info]) => (
            <div key={component} className="flex gap-4">
              <div className="min-w-fit">
                <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-semibold">
                  {info.status}
                </span>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">{component}</p>
                <div className="mt-1 mb-2">
                  <p className="text-xs text-gray-600 font-semibold">Bloqueado por:</p>
                  <ul className="text-xs text-gray-700 mt-1">
                    {info.blockedBy.map((blocker, idx) => (
                      <li key={idx} className="ml-3 flex gap-1">
                        <span>•</span> {blocker}
                      </li>
                    ))}
                  </ul>
                </div>
                <p className="text-xs text-blue-700 font-semibold">→ Siguiente: {info.nextPhase}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Critical Information */}
      <div className="mt-8 bg-amber-50 border-l-4 border-amber-500 p-4">
        <p className="text-sm text-amber-800">
          <strong>⚠️ Nota Importante:</strong> Este panel muestra estados reales sin porcentajes engañosos. 
          Cada componente tiene bloqueadores explícitos. Los porcentajes de progreso no son utilizados 
          porque pueden ser engañosos. Use los estados específicos de cada componente para determinar qué 
          sigue.
        </p>
      </div>
    </div>
  );
}
