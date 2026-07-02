'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Circle, AlertCircle, GitBranch, Zap, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface Phase {
  id: number;
  name: string;
  description: string;
  progress: number;
  status: 'completed' | 'in-progress' | 'pending';
}

interface Agent {
  name: string;
  status: 'completed' | 'testing' | 'pending';
  score: number;
}

export function ProgressDashboard() {
  const [expandedPhase, setExpandedPhase] = useState<number | null>(null);

  const phases: Phase[] = [
    {
      id: 1,
      name: 'Motor de Trading',
      description: 'Core engine con 11 agentes y lógica de consenso',
      progress: 95,
      status: 'in-progress',
    },
    {
      id: 2,
      name: 'Alertas CARVIPIX',
      description: 'Sistema de alertas con 7 estados y gestión de ciclo de vida',
      progress: 85,
      status: 'in-progress',
    },
    {
      id: 3,
      name: 'Datos en Tiempo Real',
      description: 'Integración con proveedores de datos (AlphaVantage, etc)',
      progress: 10,
      status: 'pending',
    },
    {
      id: 4,
      name: 'Backtesting',
      description: 'Motor de backtesting con análisis de desempeño',
      progress: 5,
      status: 'pending',
    },
    {
      id: 5,
      name: 'AutoBot',
      description: 'Bot automático de ejecución de trading',
      progress: 0,
      status: 'pending',
    },
    {
      id: 6,
      name: 'Bridge MT4/MT5',
      description: 'Integración con MetaTrader 4 y 5',
      progress: 0,
      status: 'pending',
    },
    {
      id: 7,
      name: 'Gestión de Capital',
      description: 'Sistema de gestión de riesgo y portafolio',
      progress: 20,
      status: 'pending',
    },
  ];

  const agents: Agent[] = [
    { name: 'Analista de Régimen de Mercado', status: 'completed', score: 95 },
    { name: 'Analista de Tendencia', status: 'completed', score: 98 },
    { name: 'Analista de Estructura', status: 'completed', score: 95 },
    { name: 'Analista de Momentum', status: 'completed', score: 96 },
    { name: 'Analista de Pullback', status: 'completed', score: 92 },
    { name: 'Analista de Sesión', status: 'completed', score: 90 },
    { name: 'Analista de Noticias', status: 'completed', score: 88 },
    { name: 'Gestor de Riesgo', status: 'completed', score: 97 },
    { name: 'Puntuación de Confianza', status: 'completed', score: 94 },
    { name: 'Validador de Operación', status: 'completed', score: 96 },
    { name: 'Motor de Aprendizaje', status: 'completed', score: 91 },
  ];

  const completedCount = agents.filter(a => a.status === 'completed').length;
  const overallProgress = Math.round((completedCount / agents.length + 
    phases.filter(p => p.status === 'completed').length / phases.length) / 2 * 100);

  const getStatusIcon = (status: 'completed' | 'in-progress' | 'pending' | 'testing') => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'in-progress':
        return <Zap className="w-5 h-5 text-[#D4AF37]" />;
      case 'testing':
        return <AlertCircle className="w-5 h-5 text-yellow-400" />;
      default:
        return <Circle className="w-5 h-5 text-slate-500" />;
    }
  };

  const getStatusColor = (status: 'completed' | 'in-progress' | 'pending') => {
    switch (status) {
      case 'completed':
        return 'from-green-500/20 to-green-500/5 border-green-500/30';
      case 'in-progress':
        return 'from-[#D4AF37]/20 to-[#D4AF37]/5 border-[#D4AF37]/30';
      default:
        return 'from-slate-500/10 to-slate-500/5 border-slate-500/20';
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'from-green-500 to-green-600';
    if (progress >= 50) return 'from-[#D4AF37] to-yellow-600';
    return 'from-red-500 to-red-600';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#05070B] via-[#0B111A] to-[#05070B] p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold text-white mb-2">CARVIPIX Trading Engine</h1>
        <p className="text-white/60">Página de Progreso - Fase 1 en Desarrollo</p>
      </motion.div>

      {/* Overall Progress */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-br from-slate-900/50 to-slate-900/20 border border-white/10 rounded-lg p-6 mb-8"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-white mb-1">Progreso General del Proyecto</h2>
            <p className="text-white/60 text-sm">Desarrollo integrado de todas las fases</p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold text-[#D4AF37]">{overallProgress}%</div>
            <p className="text-white/60 text-sm">Completado</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-3 bg-black/40 rounded-full overflow-hidden border border-white/10">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${overallProgress}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-[#D4AF37] to-yellow-500 rounded-full"
          />
        </div>
      </motion.div>

      {/* Build Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
      >
        <div className="bg-gradient-to-br from-green-500/20 to-green-500/5 border border-green-500/30 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <span className="font-mono text-sm text-white/80">Build Status</span>
          </div>
          <p className="text-white font-bold">✓ Exitoso</p>
          <p className="text-white/60 text-xs">36/36 rutas precompiladas</p>
        </div>

        <div className="bg-gradient-to-br from-[#D4AF37]/20 to-[#D4AF37]/5 border border-[#D4AF37]/30 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <GitBranch className="w-5 h-5 text-[#D4AF37]" />
            <span className="font-mono text-sm text-white/80">Last Commit</span>
          </div>
          <p className="text-white font-bold text-sm truncate">a9143c5</p>
          <p className="text-white/60 text-xs">Motor de consenso con 11 agentes</p>
        </div>

        <div className="bg-gradient-to-br from-blue-500/20 to-blue-500/5 border border-blue-500/30 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <Zap className="w-5 h-5 text-blue-400" />
            <span className="font-mono text-sm text-white/80">TypeScript</span>
          </div>
          <p className="text-white font-bold">0 Errores</p>
          <p className="text-white/60 text-xs">Compilación limpia</p>
        </div>
      </motion.div>

      {/* Phases Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-8"
      >
        <h3 className="text-2xl font-bold text-white mb-4">7 Fases del Proyecto</h3>

        <div className="space-y-3">
          {phases.map((phase, index) => (
            <motion.div
              key={phase.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 + index * 0.05 }}
              onClick={() => setExpandedPhase(expandedPhase === phase.id ? null : phase.id)}
              className={`bg-gradient-to-br ${getStatusColor(phase.status)} border rounded-lg p-4 cursor-pointer transition-all hover:border-opacity-100`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3 flex-1">
                  {getStatusIcon(phase.status)}
                  <div>
                    <h4 className="font-bold text-white">
                      Fase {phase.id}. {phase.name}
                    </h4>
                    <p className="text-white/60 text-sm">{phase.description}</p>
                  </div>
                </div>
                <div className="text-right ml-4">
                  <p className="font-bold text-[#D4AF37]">{phase.progress}%</p>
                  <p className="text-white/60 text-xs">
                    {phase.status === 'completed' ? 'Completada' : 
                     phase.status === 'in-progress' ? 'En progreso' : 'Pendiente'}
                  </p>
                </div>
              </div>

              {/* Phase Progress Bar */}
              <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden border border-white/10">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${phase.progress}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  className={`h-full bg-gradient-to-r ${getProgressColor(phase.progress)} rounded-full`}
                />
              </div>

              {/* Expanded Content */}
              {expandedPhase === phase.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 pt-4 border-t border-white/10"
                >
                  <p className="text-white/70 text-sm mb-3">
                    {phase.status === 'completed' && '✓ Fase completada y validada'}
                    {phase.status === 'in-progress' && '⚡ Actualmente en desarrollo y optimización'}
                    {phase.status === 'pending' && '⏳ Fase pendiente de inicio'}
                  </p>
                  <div className="grid grid-cols-2 gap-3 text-xs text-white/60">
                    <div>
                      <p className="text-white/80 font-mono">Status</p>
                      <p>{phase.status}</p>
                    </div>
                    <div>
                      <p className="text-white/80 font-mono">Próximo</p>
                      <p>{phase.id < 7 ? `Fase ${phase.id + 1}` : 'Mantenimiento'}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Agents Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mb-8"
      >
        <h3 className="text-2xl font-bold text-white mb-4">
          11 Agentes Especializados
          <span className="text-[#D4AF37] ml-2">({completedCount}/11 Completados)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {agents.map((agent, index) => (
            <motion.div
              key={agent.name}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.35 + index * 0.03 }}
              className="bg-gradient-to-br from-green-500/20 to-green-500/5 border border-green-500/30 rounded-lg p-3"
            >
              <div className="flex items-start gap-2 mb-2">
                {getStatusIcon(agent.status)}
                <div className="flex-1">
                  <p className="font-mono text-xs text-white/80">{agent.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1.5 bg-black/40 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-green-400 to-green-500"
                        style={{ width: `${agent.score}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-green-400">{agent.score}%</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Completion Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
      >
        <div className="bg-gradient-to-br from-green-500/20 to-green-500/5 border border-green-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <span className="font-mono text-sm text-white/80">Completado</span>
          </div>
          <p className="text-2xl font-bold text-green-400">11/11 Agentes</p>
          <p className="text-white/60 text-sm">Motor de consenso operacional</p>
        </div>

        <div className="bg-gradient-to-br from-[#D4AF37]/20 to-[#D4AF37]/5 border border-[#D4AF37]/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-5 h-5 text-[#D4AF37]" />
            <span className="font-mono text-sm text-white/80">En Revisión</span>
          </div>
          <p className="text-2xl font-bold text-[#D4AF37]">2/7 Fases</p>
          <p className="text-white/60 text-sm">Motor y alertas optimizándose</p>
        </div>

        <div className="bg-gradient-to-br from-slate-500/20 to-slate-500/5 border border-slate-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Circle className="w-5 h-5 text-slate-400" />
            <span className="font-mono text-sm text-white/80">Por Hacer</span>
          </div>
          <p className="text-2xl font-bold text-slate-400">5/7 Fases</p>
          <p className="text-white/60 text-sm">Datos, backtesting, integración</p>
        </div>
      </motion.div>

      {/* Call to Action */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="flex flex-col md:flex-row gap-4 justify-center"
      >
        <Link href="/engine">
          <button className="w-full md:w-auto px-6 py-3 bg-gradient-to-r from-[#D4AF37] to-yellow-600 hover:from-yellow-400 hover:to-yellow-700 text-black font-bold rounded-lg transition-all flex items-center justify-center gap-2 group">
            <span>Ver Dashboard del Motor</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </Link>

        <button className="w-full md:w-auto px-6 py-3 border border-[#D4AF37]/50 text-[#D4AF37] hover:bg-[#D4AF37]/10 font-bold rounded-lg transition-all">
          Descargar Reporte
        </button>
      </motion.div>

      {/* Footer Info */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-12 pt-6 border-t border-white/10 text-center"
      >
        <p className="text-white/60 text-sm mb-1">CARVIPIX Trading Engine • Fase 1</p>
        <p className="text-white/40 text-xs">
          Última actualización: {new Date().toLocaleDateString('es-ES', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </p>
      </motion.div>
    </div>
  );
}
