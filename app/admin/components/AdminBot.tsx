'use client';

import { motion } from 'framer-motion';
import {
  CheckCircle,
  AlertCircle,
  Clock,
  TrendingUp,
  Zap,
  BarChart3,
  GitBranch,
  Code,
  AlertTriangle,
  Settings,
  Shield,
  Activity,
  Send,
  ChevronDown,
  Battery,
  Gauge,
  Lock,
} from 'lucide-react';
import { useState } from 'react';

interface Modulo {
  id: string;
  nombre: string;
  estado: 'completado' | 'en-progreso' | 'pendiente' | 'en-revision';
  progreso: number;
}

interface ChecklistItem {
  id: string;
  titulo: string;
  completado: boolean;
  critico: boolean;
}

export default function AdminBot() {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const modulos: Modulo[] = [
    {
      id: 'engine',
      nombre: 'Trading Engine',
      estado: 'completado',
      progreso: 100,
    },
    {
      id: 'alerts',
      nombre: 'CARVIPIX Alerts',
      estado: 'en-progreso',
      progreso: 75,
    },
    {
      id: 'consenso',
      nombre: 'Sistema de Consenso',
      estado: 'completado',
      progreso: 100,
    },
    {
      id: 'validacion',
      nombre: 'Validación de Señales',
      estado: 'completado',
      progreso: 100,
    },
    {
      id: 'data-real',
      nombre: 'Integración Datos Reales',
      estado: 'pendiente',
      progreso: 0,
    },
    {
      id: 'autobot',
      nombre: 'AutoBot Automático',
      estado: 'pendiente',
      progreso: 0,
    },
    {
      id: 'mt4-bridge',
      nombre: 'Bridge MT4/MT5',
      estado: 'pendiente',
      progreso: 0,
    },
    {
      id: 'backtesting',
      nombre: 'Backtesting Engine',
      estado: 'pendiente',
      progreso: 0,
    },
  ];

  const checklistItems: ChecklistItem[] = [
    {
      id: 'no-sin-consenso',
      titulo: 'No operar sin consenso de 9/11 agentes',
      completado: true,
      critico: true,
    },
    {
      id: 'no-logica-interna',
      titulo: 'No mostrar lógica interna al cliente',
      completado: true,
      critico: true,
    },
    {
      id: 'no-mt4',
      titulo: 'No conectar MT4 todavía',
      completado: true,
      critico: true,
    },
    {
      id: 'no-ops-reales',
      titulo: 'No ejecutar operaciones reales',
      completado: true,
      critico: true,
    },
    {
      id: 'no-autobot',
      titulo: 'No activar AutoBot todavía',
      completado: true,
      critico: true,
    },
    {
      id: 'validar-datos',
      titulo: 'Validar datos antes de alertar',
      completado: true,
      critico: false,
    },
    {
      id: 'registrar-decisiones',
      titulo: 'Registrar todas las decisiones',
      completado: true,
      critico: false,
    },
    {
      id: 'revisar-fallos',
      titulo: 'Revisar fallos antes de avanzar',
      completado: true,
      critico: false,
    },
  ];

  const estadoBot = {
    operativo: true,
    ultimaAlerta: '2026-07-02 14:32:45',
    alertasHoy: 12,
    progreso: 75,
    fase: 'Fase 1: Análisis y Validación',
    proximaFase: 'Fase 2: Integración de Datos Reales',
  };

  const estadoMotor = {
    agentesActivos: 11,
    agentesEnAlerta: 8,
    confianzaPromedio: 89,
    ultimaDecision: '2026-07-02 14:32:45',
    decisiones: {
      aprobadas: 8,
      rechazadas: 5,
      pendientes: 2,
    },
  };

  const distribucionAlertas = [
    {
      tipo: 'Alertas Premium',
      destino: 'Miembros ELITE',
      cantidad: 8,
      icono: 'crown',
      color: '[#D4AF37]',
    },
    {
      tipo: 'Alertas Admin',
      destino: 'Administradores',
      cantidad: 15,
      icono: 'lock',
      color: 'red',
    },
    {
      tipo: 'Alertas de Riesgo',
      destino: 'Sistema de Monitoreo',
      cantidad: 3,
      icono: 'alert',
      color: 'yellow',
    },
    {
      tipo: 'Alertas de Sistema',
      destino: 'Panel de Control',
      cantidad: 5,
      icono: 'info',
      color: 'blue',
    },
    {
      tipo: 'Alertas de Fallo',
      destino: 'Equipo Técnico',
      cantidad: 2,
      icono: 'error',
      color: 'red',
    },
    {
      tipo: 'Señales Canceladas',
      destino: 'Historial',
      cantidad: 5,
      icono: 'x',
      color: 'slate',
    },
  ];

  const erroresActuales = [
    {
      id: 1,
      tipo: 'Advertencia',
      titulo: 'Datos demo utilizados',
      descripcion: 'El sistema está usando datos de demostración. Conectar datos reales en próxima fase.',
      timestamp: '2026-07-02 14:00:00',
      estado: 'activo',
    },
    {
      id: 2,
      tipo: 'Info',
      titulo: 'Build exitoso',
      descripcion: 'Última compilación completada sin errores TypeScript.',
      timestamp: '2026-07-02 13:45:00',
      estado: 'resuelto',
    },
  ];

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'completado':
        return 'from-green-500/20 to-green-500/5 border-green-500/30 text-green-400';
      case 'en-progreso':
        return 'from-[#D4AF37]/20 to-[#D4AF37]/5 border-[#D4AF37]/30 text-[#D4AF37]';
      case 'en-revision':
        return 'from-yellow-500/20 to-yellow-500/5 border-yellow-500/30 text-yellow-400';
      default:
        return 'from-slate-500/10 to-slate-500/5 border-slate-500/20 text-slate-400';
    }
  };

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'completado':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'en-progreso':
        return <Activity className="w-5 h-5 text-[#D4AF37]" />;
      case 'en-revision':
        return <AlertCircle className="w-5 h-5 text-yellow-400" />;
      default:
        return <Clock className="w-5 h-5 text-slate-400" />;
    }
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
            <h2 className="text-3xl font-bold text-white mb-1">Centro de Control - Bot CARVIPIX</h2>
            <p className="text-white/60">Gestión centralizada del motor de alertas y análisis automático</p>
          </div>
          <div className="text-right">
            <div className={`text-4xl font-bold ${estadoBot.operativo ? 'text-green-400' : 'text-red-400'}`}>
              {estadoBot.progreso}%
            </div>
            <p className="text-white/60 text-sm mt-1">{estadoBot.fase}</p>
          </div>
        </div>
      </motion.div>

      {/* Estado General */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
      >
        <div className="bg-gradient-to-br from-green-500/20 to-green-500/5 border border-green-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Battery className="w-5 h-5 text-green-400" />
            <span className="font-mono text-xs text-white/80">Estado</span>
          </div>
          <p className="text-white font-bold text-lg">Operativo</p>
          <p className="text-white/60 text-xs mt-1">Sistema activo</p>
        </div>

        <div className="bg-gradient-to-br from-[#D4AF37]/20 to-[#D4AF37]/5 border border-[#D4AF37]/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Send className="w-5 h-5 text-[#D4AF37]" />
            <span className="font-mono text-xs text-white/80">Alertas Hoy</span>
          </div>
          <p className="text-[#D4AF37] font-bold text-lg">{estadoBot.alertasHoy}</p>
          <p className="text-white/60 text-xs mt-1">Señales procesadas</p>
        </div>

        <div className="bg-gradient-to-br from-blue-500/20 to-blue-500/5 border border-blue-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <GitBranch className="w-5 h-5 text-blue-400" />
            <span className="font-mono text-xs text-white/80">Último Commit</span>
          </div>
          <p className="text-white font-bold text-lg">7d2aea4</p>
          <p className="text-white/60 text-xs mt-1">Protección de datos</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500/20 to-purple-500/5 border border-purple-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Gauge className="w-5 h-5 text-purple-400" />
            <span className="font-mono text-xs text-white/80">Build</span>
          </div>
          <p className="text-white font-bold text-lg">✓ Exitoso</p>
          <p className="text-white/60 text-xs mt-1">0 errores TypeScript</p>
        </div>
      </motion.div>

      {/* Progreso del Bot */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
        className="bg-gradient-to-br from-slate-900/50 to-slate-900/20 border border-white/10 rounded-lg p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white">Progreso General del Bot</h3>
          <span className="text-[#D4AF37] font-bold text-2xl">{estadoBot.progreso}%</span>
        </div>
        <div className="w-full h-3 bg-black/40 rounded-full overflow-hidden border border-white/10">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${estadoBot.progreso}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-[#D4AF37] to-yellow-500 rounded-full"
          />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <p className="text-white/60 text-xs mb-1">Fase Actual</p>
            <p className="text-white font-semibold">{estadoBot.fase}</p>
          </div>
          <div>
            <p className="text-white/60 text-xs mb-1">Próxima Fase</p>
            <p className="text-white font-semibold">{estadoBot.proximaFase}</p>
          </div>
        </div>
      </motion.div>

      {/* Estado del Motor de Trading */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.14 }}
        className="space-y-4"
      >
        <h3 className="text-2xl font-bold text-white flex items-center gap-2">
          <Zap className="w-6 h-6 text-[#D4AF37]" />
          Estado del Trading Engine
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-green-500/20 to-green-500/5 border border-green-500/30 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-green-400 mb-1">{estadoMotor.agentesActivos}</p>
            <p className="text-white/80 text-sm">Agentes Activos</p>
            <p className="text-white/60 text-xs mt-1">Especializados</p>
          </div>

          <div className="bg-gradient-to-br from-[#D4AF37]/20 to-[#D4AF37]/5 border border-[#D4AF37]/30 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-[#D4AF37] mb-1">{estadoMotor.confianzaPromedio}%</p>
            <p className="text-white/80 text-sm">Confianza Promedio</p>
            <p className="text-white/60 text-xs mt-1">Umbral mín: 70%</p>
          </div>

          <div className="bg-gradient-to-br from-blue-500/20 to-blue-500/5 border border-blue-500/30 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-blue-400 mb-1">{estadoMotor.decisiones.aprobadas}</p>
            <p className="text-white/80 text-sm">Señales Aprobadas</p>
            <p className="text-white/60 text-xs mt-1">Hoy</p>
          </div>

          <div className="bg-gradient-to-br from-red-500/20 to-red-500/5 border border-red-500/30 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-red-400 mb-1">{estadoMotor.decisiones.rechazadas}</p>
            <p className="text-white/80 text-sm">Señales Rechazadas</p>
            <p className="text-white/60 text-xs mt-1">Filtradas</p>
          </div>
        </div>
      </motion.div>

      {/* Módulos del Bot */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.16 }}
        className="space-y-4"
      >
        <h3 className="text-2xl font-bold text-white">Módulos del Bot (8 Total)</h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {modulos.map((modulo, i) => (
            <motion.div
              key={modulo.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.18 + i * 0.03 }}
              className={`bg-gradient-to-br ${getEstadoColor(modulo.estado)} border rounded-lg p-4 transition-all`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3 flex-1">
                  {getEstadoIcon(modulo.estado)}
                  <div>
                    <h4 className="font-bold text-white">{modulo.nombre}</h4>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-white/60 text-xs">Progreso</span>
                  <span className="text-[#D4AF37] font-bold text-sm">{modulo.progreso}%</span>
                </div>
                <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden border border-white/10">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${modulo.progreso}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className="h-full bg-gradient-to-r from-[#D4AF37] to-yellow-500 rounded-full"
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Distribución de Alertas */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-4"
      >
        <h3 className="text-2xl font-bold text-white flex items-center gap-2">
          <Send className="w-6 h-6 text-[#D4AF37]" />
          Distribución de Alertas
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {distribucionAlertas.map((alerta, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22 + i * 0.04 }}
              className="bg-gradient-to-br from-white/5 to-white/2 border border-white/10 rounded-lg p-4"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-bold text-white text-sm">{alerta.tipo}</p>
                  <p className="text-white/60 text-xs mt-1">{alerta.destino}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-[#D4AF37]">{alerta.cantidad}</p>
                </div>
              </div>
              <div className="h-1 bg-black/40 rounded-full overflow-hidden border border-white/10">
                <div className="h-full w-2/3 bg-[#D4AF37]" />
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Control de Calidad */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.24 }}
        className="space-y-4"
      >
        <h3 className="text-2xl font-bold text-white flex items-center gap-2">
          <Shield className="w-6 h-6 text-green-400" />
          Control de Calidad
        </h3>

        <div className="bg-gradient-to-br from-green-500/20 to-green-500/5 border border-green-500/30 rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {checklistItems.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.26 + i * 0.04 }}
                className="flex items-start gap-3"
              >
                <div className="flex-shrink-0 mt-1">
                  {item.completado ? (
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-yellow-400" />
                  )}
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-semibold ${item.completado ? 'text-green-200' : 'text-yellow-200'}`}>
                    {item.titulo}
                  </p>
                  {item.critico && (
                    <span className="inline-block mt-1 px-2 py-0.5 bg-red-500/20 border border-red-500/50 rounded text-[10px] text-red-300 font-mono">
                      CRÍTICO
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Estado de Errores */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.28 }}
        className="space-y-4"
      >
        <h3 className="text-2xl font-bold text-white flex items-center gap-2">
          <AlertTriangle className="w-6 h-6 text-yellow-400" />
          Alertas y Advertencias
        </h3>

        <div className="space-y-2">
          {erroresActuales.map((error, i) => (
            <motion.div
              key={error.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.05 }}
              className={`border rounded-lg p-4 ${
                error.tipo === 'Advertencia'
                  ? 'border-yellow-500/30 bg-yellow-500/10'
                  : 'border-green-500/30 bg-green-500/10'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-mono px-2 py-0.5 rounded border ${
                      error.tipo === 'Advertencia'
                        ? 'border-yellow-500/50 text-yellow-300'
                        : 'border-green-500/50 text-green-300'
                    }`}>
                      {error.tipo}
                    </span>
                  </div>
                  <h4 className="font-bold text-white">{error.titulo}</h4>
                  <p className="text-white/70 text-sm mt-1">{error.descripcion}</p>
                  <p className="text-white/50 text-xs mt-2">{error.timestamp}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Próximas Acciones */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.32 }}
        className="bg-gradient-to-br from-[#D4AF37]/20 to-[#D4AF37]/5 border border-[#D4AF37]/30 rounded-lg p-6"
      >
        <h3 className="text-xl font-bold text-white mb-4">Próximas Acciones Prioritarias</h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-white">Integración de datos en tiempo real</p>
              <p className="text-white/60 text-sm">Conectar feeds de mercado para pasar de datos demo a datos reales</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-[#D4AF37] flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-white">Desarrollo de AutoBot</p>
              <p className="text-white/60 text-sm">Motor automático para ejecución de operaciones (con validaciones críticas)</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Lock className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-white">Validación de seguridad</p>
              <p className="text-white/60 text-sm">Auditoría completa antes de conectar con sistemas de trading reales</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Nota Final */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.34 }}
        className="bg-gradient-to-br from-red-500/20 to-red-500/5 border border-red-500/30 rounded-lg p-4"
      >
        <p className="text-sm text-red-200 font-semibold">🔒 Centro Privado de Administración</p>
        <p className="mt-2 text-sm text-red-300/80">
          Esta página solo es visible para administradores. Contiene información sensible sobre el funcionamiento interno del Bot CARVIPIX. No se expone al público.
        </p>
      </motion.div>
    </div>
  );
}
