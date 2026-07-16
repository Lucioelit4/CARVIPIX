/**
 * Admin Panel - Brain Controller Interface
 * 
 * Componente: app/admin/components/AdminBrain.tsx
 */

'use client';

import { useState, useEffect } from 'react';
import { Power, Pause, Play, Wrench, Activity, AlertCircle } from 'lucide-react';
import { CARVIPIXButton } from '@/app/design-system';

interface BrainStatus {
  state: 'STOPPED' | 'STARTING' | 'ACTIVE' | 'PAUSED' | 'ERROR' | 'MAINTENANCE';
  activatedAt?: string;
  activatedBy?: string;
  lastSignalTime?: string;
  lastSignalId?: string;
  errorMessage?: string;
  connectedModules: number;
  telegramConnected: boolean;
  mt5Connected: boolean;
  cyclesCompleted: number;
  failedCycles: number;
}

const STATE_COLORS: Record<string, string> = {
  STOPPED: 'bg-gray-600',
  STARTING: 'bg-yellow-500',
  ACTIVE: 'bg-green-500',
  PAUSED: 'bg-blue-500',
  ERROR: 'bg-red-500',
  MAINTENANCE: 'bg-purple-500'
};

const STATE_LABELS: Record<string, string> = {
  STOPPED: 'Detenido',
  STARTING: 'Iniciando...',
  ACTIVE: 'Activo',
  PAUSED: 'Pausado',
  ERROR: 'Error',
  MAINTENANCE: 'Mantenimiento'
};

export default function AdminBrain() {
  const [status, setStatus] = useState<BrainStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar estado inicial
  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000); // Actualizar cada 5 seg
    return () => clearInterval(interval);
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/admin/brain');
      const data = await res.json();
      if (data.status) {
        setStatus(data.status);
      }
    } catch (err) {
      console.error('Error fetching brain status:', err);
    }
  };

  const handleAction = async (action: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/brain/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'admin' })
      });
      const data = await res.json();
      if (data.success) {
        setStatus(data.status);
      } else {
        setError(data.error || 'Error en la operación');
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (!status) {
    return <div className="text-white">Cargando estado del cerebro...</div>;
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="border-b border-white/10 pb-6">
        <h2 className="text-3xl font-bold text-[#D4AF37] mb-2">🧠 Control del Cerebro CARVIPIX</h2>
        <p className="text-white/60">Sistema maestro de orquestación E2E</p>
      </div>

      {/* ESTADO ACTUAL */}
      <div className={`${STATE_COLORS[status.state]} bg-opacity-10 border border-opacity-20 rounded-lg p-6 mb-6`}>
        <div className="flex items-center justify-between">
          <div>
            <div className={`inline-block w-4 h-4 rounded-full ${STATE_COLORS[status.state]} mr-3`}></div>
            <span className="text-2xl font-bold text-white">
              {STATE_LABELS[status.state]}
            </span>
          </div>
          <div className="text-right text-white/60 text-sm">
            {status.activatedAt && (
              <>
                <div>Activado: {new Date(status.activatedAt).toLocaleTimeString()}</div>
                <div>Por: {status.activatedBy}</div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* CONTROLES PRINCIPALES */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <CARVIPIXButton
          onClick={() => handleAction('activate')}
          disabled={loading || status.state === 'ACTIVE'}
          variant={status.state === 'ACTIVE' ? 'secondary' : 'primary'}
          leftIcon={<Power className="w-5 h-5" />}
        >
          Encender
        </CARVIPIXButton>

        <CARVIPIXButton
          onClick={() => handleAction('deactivate')}
          disabled={loading || status.state === 'STOPPED'}
          variant={status.state === 'STOPPED' ? 'secondary' : 'danger'}
          leftIcon={<Power className="w-5 h-5" />}
        >
          Apagar
        </CARVIPIXButton>

        <CARVIPIXButton
          onClick={() => handleAction('pause')}
          disabled={loading || status.state !== 'ACTIVE'}
          variant="secondary"
          leftIcon={<Pause className="w-5 h-5" />}
        >
          Pausar
        </CARVIPIXButton>

        <CARVIPIXButton
          onClick={() => handleAction('resume')}
          disabled={loading || status.state !== 'PAUSED'}
          variant="secondary"
          leftIcon={<Play className="w-5 h-5" />}
        >
          Reanudar
        </CARVIPIXButton>
      </div>

      {/* MODO MANTENIMIENTO */}
      <div className="border border-white/10 rounded-lg p-4">
        <CARVIPIXButton
          onClick={() => handleAction('maintenance')}
          disabled={loading}
          variant="secondary"
          size="sm"
          leftIcon={<Wrench className="w-4 h-4" />}
          className="w-full"
        >
          Modo Mantenimiento
        </CARVIPIXButton>
      </div>

      {/* ESTADO DE CONEXIONES */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Activity className={`w-5 h-5 ${status.connectedModules >= 7 ? 'text-green-500' : 'text-yellow-500'}`} />
            <span className="text-white/60">Módulos Conectados</span>
          </div>
          <div className="text-2xl font-bold text-white">{status.connectedModules}/9</div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Activity className={`w-5 h-5 ${status.telegramConnected ? 'text-green-500' : 'text-red-500'}`} />
            <span className="text-white/60">Telegram</span>
          </div>
          <div className="text-2xl font-bold text-white">
            {status.telegramConnected ? '✅' : '❌'}
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Activity className={`w-5 h-5 ${status.mt5Connected ? 'text-green-500' : 'text-red-500'}`} />
            <span className="text-white/60">MT5</span>
          </div>
          <div className="text-2xl font-bold text-white">
            {status.mt5Connected ? '✅' : '❌'}
          </div>
        </div>
      </div>

      {/* ESTADÍSTICAS */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
          <div className="text-white/60 text-sm mb-1">Ciclos Completados</div>
          <div className="text-3xl font-bold text-green-400">{status.cyclesCompleted}</div>
        </div>

        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <div className="text-white/60 text-sm mb-1">Ciclos Fallidos</div>
          <div className="text-3xl font-bold text-red-400">{status.failedCycles}</div>
        </div>
      </div>

      {/* ÚLTIMA SEÑAL */}
      {status.lastSignalId && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
          <div className="text-white/60 text-sm mb-2">Última Señal</div>
          <div className="text-white font-mono text-sm">{status.lastSignalId}</div>
          {status.lastSignalTime && (
            <div className="text-white/50 text-xs mt-1">
              {new Date(status.lastSignalTime).toLocaleTimeString()}
            </div>
          )}
        </div>
      )}

      {/* ERROR */}
      {status.state === 'ERROR' && status.errorMessage && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-red-400 font-semibold">Error del Sistema</div>
            <div className="text-white/60 text-sm mt-1">{status.errorMessage}</div>
          </div>
        </div>
      )}

      {/* ERROR LOCAL */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-red-400 font-semibold">Error</div>
            <div className="text-white/60 text-sm mt-1">{error}</div>
          </div>
        </div>
      )}

      {/* INFORMACIÓN */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-4">
        <div className="text-white/60 text-sm space-y-2">
          <p>🧠 <strong>Estado:</strong> El cerebro orquesta automáticamente todo el ciclo E2E</p>
          <p>🚀 <strong>Encender:</strong> Inicia el sistema para recibir y procesar señales</p>
          <p>⏸️ <strong>Pausar:</strong> Detiene nuevas operaciones (existe ciclos activos continúan)</p>
          <p>🔧 <strong>Mantenimiento:</strong> Modo especial para tareas administrativas</p>
        </div>
      </div>
    </div>
  );
}
