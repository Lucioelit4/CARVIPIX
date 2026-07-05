'use client';

import { motion } from 'framer-motion';
import {
  CheckCircle,
  AlertCircle,
  Clock,
  TrendingUp,
  Users,
  Zap,
  BarChart3,
  Filter,
  ChevronDown,
} from 'lucide-react';
import { useState } from 'react';
import { CARVIPIXBadge, CARVIPIXCard } from '@/app/design-system';

interface Agent {
  nombre: string;
  puntuacion: number;
  razonamiento: string;
  confianza: number;
  critico: boolean;
}

interface DecisionLog {
  id: string;
  timestamp: string;
  tipo: string;
  aprobaciones: number;
  rechazos: number;
  resultado: 'aprobado' | 'rechazado';
  confianza: number;
}

export default function AdminMotor() {
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);
  const [expandedDecision, setExpandedDecision] = useState<string | null>(null);

  const agentes: Agent[] = [
    {
      nombre: 'Analizador de Régimen de Mercado',
      puntuacion: 92,
      razonamiento: 'Mercado en tendencia alcista con estructura clara.',
      confianza: 95,
      critico: true,
    },
    {
      nombre: 'Analista de Tendencia',
      puntuacion: 88,
      razonamiento: 'EMAs alineadas alcista en múltiples timeframes.',
      confianza: 90,
      critico: false,
    },
    {
      nombre: 'Analista de Estructura',
      puntuacion: 85,
      razonamiento: 'Soporte confirmado y resistencia próxima.',
      confianza: 87,
      critico: false,
    },
    {
      nombre: 'Analista de Momentum',
      puntuacion: 90,
      razonamiento: 'RSI en zona de fortaleza, MACD positivo.',
      confianza: 92,
      critico: false,
    },
    {
      nombre: 'Analista de Pullbacks',
      puntuacion: 78,
      razonamiento: 'Pullback poco profundo, apetito de compra confirmado.',
      confianza: 82,
      critico: true,
    },
    {
      nombre: 'Analista de Sesión',
      puntuacion: 80,
      razonamiento: 'Sesión de Londres con liquidez óptima.',
      confianza: 85,
      critico: false,
    },
    {
      nombre: 'Analista de Noticias',
      puntuacion: 72,
      razonamiento: 'Sin eventos macroeconómicos significativos.',
      confianza: 75,
      critico: false,
    },
    {
      nombre: 'Gestor de Riesgo',
      puntuacion: 95,
      razonamiento: 'Relación RR de 2.31, riesgo controlado.',
      confianza: 98,
      critico: true,
    },
    {
      nombre: 'Scoring de Confianza',
      puntuacion: 87,
      razonamiento: 'Acuerdo alto entre agentes especializados.',
      confianza: 89,
      critico: false,
    },
    {
      nombre: 'Validador de Operación',
      puntuacion: 91,
      razonamiento: 'Todos los criterios de validación cumplidos.',
      confianza: 96,
      critico: true,
    },
    {
      nombre: 'Motor de Aprendizaje',
      puntuacion: 84,
      razonamiento: 'Histórico muestra 78% de efectividad en patrones similares.',
      confianza: 80,
      critico: false,
    },
  ];

  const decisionesRecientes: DecisionLog[] = [
    {
      id: '1',
      timestamp: '2026-07-02 14:32:45',
      tipo: 'EURUSD Compra 1H',
      aprobaciones: 10,
      rechazos: 1,
      resultado: 'aprobado',
      confianza: 89,
    },
    {
      id: '2',
      timestamp: '2026-07-02 14:28:12',
      tipo: 'BTCUSD Compra 45M',
      aprobaciones: 11,
      rechazos: 0,
      resultado: 'aprobado',
      confianza: 95,
    },
    {
      id: '3',
      timestamp: '2026-07-02 14:15:30',
      tipo: 'XAUUSD Venta 5M',
      aprobaciones: 8,
      rechazos: 3,
      resultado: 'rechazado',
      confianza: 61,
    },
    {
      id: '4',
      timestamp: '2026-07-02 14:10:22',
      tipo: 'GBPUSD Compra 1H',
      aprobaciones: 9,
      rechazos: 2,
      resultado: 'aprobado',
      confianza: 78,
    },
    {
      id: '5',
      timestamp: '2026-07-02 13:55:15',
      tipo: 'EURUSD Venta 45M',
      aprobaciones: 7,
      rechazos: 4,
      resultado: 'rechazado',
      confianza: 58,
    },
  ];

  const alertas = {
    aprobadas: 8,
    rechazadas: 5,
    pendientes: 2,
  };

  const consensoMetrics = {
    ultimoConsensus: {
      aprobaciones: 10,
      rechazos: 1,
      confianza: 89,
      umbrales: {
        minimo: 9,
        criticos: 3,
        confianzaMinima: 70,
      },
    },
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-white mb-1">Motor de Trading - Panel Privado</h2>
            <p className="text-white/60">Información interna de agentes, decisiones y operaciones</p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold text-[#D4AF37]">95%</div>
            <p className="text-white/60 text-sm mt-1">Eficiencia General</p>
          </div>
        </div>
      </motion.div>

      {/* Resumen de Alertas */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <CARVIPIXCard variant="statistics" padding="16" hover={false}>
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <span className="font-mono text-xs text-white/80">Alertas Aprobadas</span>
          </div>
          <p className="text-3xl font-bold text-green-400">{alertas.aprobadas}</p>
        </CARVIPIXCard>

        <CARVIPIXCard variant="statistics" padding="16" hover={false}>
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <span className="font-mono text-xs text-white/80">Alertas Rechazadas</span>
          </div>
          <p className="text-3xl font-bold text-red-400">{alertas.rechazadas}</p>
        </CARVIPIXCard>

        <CARVIPIXCard variant="statistics" padding="16" hover={false}>
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-yellow-400" />
            <span className="font-mono text-xs text-white/80">Alertas Pendientes</span>
          </div>
          <p className="text-3xl font-bold text-yellow-400">{alertas.pendientes}</p>
        </CARVIPIXCard>
      </motion.div>

      {/* Últimas Decisiones */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="space-y-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-bold text-white">Bitácora de Decisiones (Últimas 10)</h3>
          <Filter className="w-5 h-5 text-white/60" />
        </div>

        <div className="space-y-2">
          {decisionesRecientes.map((decision, i) => (
            <motion.div
              key={decision.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.18 + i * 0.04 }}
              className="border border-white/10 rounded-lg bg-white/5 overflow-hidden"
            >
              <button
                onClick={() => setExpandedDecision(expandedDecision === decision.id ? null : decision.id)}
                className="w-full p-4 flex items-center justify-between hover:bg-white/10 transition"
              >
                <div className="flex items-center gap-4 flex-1 text-left">
                  <div className={`p-2 rounded-lg ${decision.resultado === 'aprobado' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                    {decision.resultado === 'aprobado' ? (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-mono text-sm text-white">{decision.tipo}</p>
                    <p className="text-xs text-white/60">{decision.timestamp}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">
                      <span className="text-green-400">{decision.aprobaciones}/11</span>
                      {' • '}
                      <span className="text-red-400">{decision.rechazos}</span>
                    </p>
                    <p className="text-xs text-[#D4AF37]">{decision.confianza}% confianza</p>
                  </div>
                </div>
                <ChevronDown
                  className={`w-5 h-5 text-white/60 transition ${expandedDecision === decision.id ? 'rotate-180' : ''}`}
                />
              </button>

              {expandedDecision === decision.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-t border-white/10 p-4 bg-white/5"
                >
                  <div className="space-y-3 text-sm">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-white/60 text-xs">Aprobaciones</p>
                        <p className="text-green-400 font-bold">{decision.aprobaciones} agentes</p>
                      </div>
                      <div>
                        <p className="text-white/60 text-xs">Rechazos</p>
                        <p className="text-red-400 font-bold">{decision.rechazos} agentes</p>
                      </div>
                      <div>
                        <p className="text-white/60 text-xs">Confianza General</p>
                        <p className="text-[#D4AF37] font-bold">{decision.confianza}%</p>
                      </div>
                      <div>
                        <p className="text-white/60 text-xs">Resultado</p>
                        <p className={decision.resultado === 'aprobado' ? 'text-green-400' : 'text-red-400'}>
                          {decision.resultado === 'aprobado' ? 'Aprobada' : 'Rechazada'}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Análisis de Agentes */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-[#D4AF37]" />
            11 Agentes Especializados
          </h3>
          <span className="text-xs font-mono text-white/60">Información Interna</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {agentes.map((agente, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.22 + i * 0.03 }}
              className={`border rounded-lg p-4 cursor-pointer transition ${
                agente.critico
                  ? 'border-[#D4AF37]/50 bg-[#D4AF37]/5 hover:bg-[#D4AF37]/10'
                  : 'border-white/10 bg-white/5 hover:bg-white/10'
              }`}
              onClick={() => setExpandedAgent(expandedAgent === agente.nombre ? null : agente.nombre)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="font-bold text-white text-sm">{agente.nombre}</h4>
                  {agente.critico && (
                    <span className="inline-block mt-1">
                    <CARVIPIXBadge variant="premium">
                      CRÍTICO
                    </CARVIPIXBadge>
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-[#D4AF37]">{agente.puntuacion}</p>
                  <p className="text-xs text-white/60">/100</p>
                </div>
              </div>

              <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden border border-white/10 mb-3">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${agente.puntuacion}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  className={`h-full ${
                    agente.puntuacion >= 80
                      ? 'bg-gradient-to-r from-green-500 to-green-400'
                      : agente.puntuacion >= 60
                      ? 'bg-gradient-to-r from-yellow-500 to-yellow-400'
                      : 'bg-gradient-to-r from-red-500 to-red-400'
                  }`}
                />
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-white/60">Confianza</span>
                <span className="text-[#D4AF37] font-bold">{agente.confianza}%</span>
              </div>

              {expandedAgent === agente.nombre && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 pt-3 border-t border-white/10"
                >
                  <p className="text-xs text-white/70">{agente.razonamiento}</p>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Configuración de Consenso */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="bg-gradient-to-br from-[#D4AF37]/20 to-[#D4AF37]/5 border border-[#D4AF37]/30 rounded-lg p-6"
      >
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-[#D4AF37]" />
          Configuración de Consenso
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white/5 rounded-lg p-3 border border-white/10">
            <p className="text-xs text-white/60 mb-1">Umbral Mínimo</p>
            <p className="text-2xl font-bold text-[#D4AF37]">{consensoMetrics.ultimoConsensus.umbrales.minimo}/11</p>
            <p className="text-xs text-white/60 mt-1">Aprobaciones requeridas</p>
          </div>

          <div className="bg-white/5 rounded-lg p-3 border border-white/10">
            <p className="text-xs text-white/60 mb-1">Agentes Críticos</p>
            <p className="text-2xl font-bold text-[#D4AF37]">≥{consensoMetrics.ultimoConsensus.umbrales.criticos}/4</p>
            <p className="text-xs text-white/60 mt-1">Aprobaciones mínimas</p>
          </div>

          <div className="bg-white/5 rounded-lg p-3 border border-white/10">
            <p className="text-xs text-white/60 mb-1">Confianza Mínima</p>
            <p className="text-2xl font-bold text-[#D4AF37]">{consensoMetrics.ultimoConsensus.umbrales.confianzaMinima}%</p>
            <p className="text-xs text-white/60 mt-1">Umbral de confianza</p>
          </div>

          <div className="bg-white/5 rounded-lg p-3 border border-white/10">
            <p className="text-xs text-white/60 mb-1">Estado Actual</p>
            <p className="text-2xl font-bold text-green-400">Operativo</p>
            <p className="text-xs text-white/60 mt-1">Sistema activo</p>
          </div>
        </div>
      </motion.div>

      {/* Nota de Seguridad */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className=""
      >
        <CARVIPIXCard variant="alert" padding="16" hover={false}>
          <p className="text-sm text-red-200 font-semibold">⚠️ Información Privada</p>
          <p className="mt-2 text-sm text-red-300/80">
            Esta información solo es visible para administradores. Contiene detalles internos del Motor de Trading de CARVIPIX que son propiedad intelectual protegida.
          </p>
        </CARVIPIXCard>
      </motion.div>
    </div>
  );
}
