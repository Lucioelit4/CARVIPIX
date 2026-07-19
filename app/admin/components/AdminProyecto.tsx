'use client';

import { motion } from 'framer-motion';
import {
  CheckCircle,
  Circle,
  AlertCircle,
  GitBranch,
  Zap,
  AlertTriangle,
  Flag,
  Gauge,
  TrendingUp,
} from 'lucide-react';
import { CARVIPIXBadge, CARVIPIXCard } from '@/app/design-system';

interface Modulo {
  id: string;
  nombre: string;
  descripcion: string;
  progreso: number;
  estado: 'completado' | 'revision' | 'progreso' | 'pendiente';
  prioridad: 'alta' | 'media' | 'baja';
  subtareas?: { titulo: string; completado: boolean }[];
}

interface Fase {
  nombre: string;
  modulos: Modulo[];
}

export default function AdminProyecto() {
  const modulos: Modulo[] = [
    {
      id: 'plataforma_principal',
      nombre: 'Plataforma Principal',
      descripcion: 'Sitio web principal, landing, servicios',
      progreso: 85,
      estado: 'progreso',
      prioridad: 'alta',
      subtareas: [
        { titulo: 'Landing page', completado: true },
        { titulo: 'Rutas de servicios', completado: true },
        { titulo: 'Seccion de academia', completado: true },
        { titulo: 'Optimizacion de UX', completado: false },
      ],
    },
    {
      id: 'panel_admin',
      nombre: 'Panel Administrativo',
      descripcion: 'Dashboard, gestion de usuarios, pagos, alertas',
      progreso: 80,
      estado: 'progreso',
      prioridad: 'alta',
      subtareas: [
        { titulo: 'Dashboard resumen', completado: true },
        { titulo: 'Gestion de usuarios', completado: true },
        { titulo: 'Gestion de pagos', completado: true },
        { titulo: 'Sistema de alertas', completado: true },
        { titulo: 'Reportes avanzados', completado: false },
      ],
    },
    {
      id: 'trading_engine',
      nombre: 'Trading Engine',
      descripcion: '11 agentes de consenso, decisiones automaticas',
      progreso: 95,
      estado: 'revision',
      prioridad: 'alta',
      subtareas: [
        { titulo: '11 agentes implementados', completado: true },
        { titulo: 'Consenso de 9/11 agentes', completado: true },
        { titulo: 'Agentes criticos validados', completado: true },
        { titulo: 'Demo scenarios funcionales', completado: true },
        { titulo: 'Pruebas de integracion', completado: false },
      ],
    },
    {
      id: 'alertas',
      nombre: 'CARVIPIX Alerts',
      descripcion: 'Sistema de alertas de trading en tiempo real',
      progreso: 75,
      estado: 'progreso',
      prioridad: 'alta',
      subtareas: [
        { titulo: 'Base de alertas', completado: true },
        { titulo: '7 estados de alerta', completado: true },
        { titulo: 'Notificaciones', completado: false },
        { titulo: 'Historial de alertas', completado: false },
      ],
    },
    {
      id: 'pagos_membresias',
      nombre: 'Pagos & Membresias',
      descripcion: 'Sistema de suscripcion y gestion de planes',
      progreso: 70,
      estado: 'progreso',
      prioridad: 'alta',
      subtareas: [
        { titulo: 'Planes de membresia', completado: true },
        { titulo: 'Integracion de pagos', completado: true },
        { titulo: 'Gestion de facturacion', completado: false },
        { titulo: 'Renovacion automatica', completado: false },
      ],
    },
    {
      id: 'usuarios_perfiles',
      nombre: 'Usuarios & Perfiles',
      descripcion: 'Gestion de cuentas, autenticacion, perfiles',
      progreso: 80,
      estado: 'progreso',
      prioridad: 'alta',
      subtareas: [
        { titulo: 'Sistema de autenticacion', completado: true },
        { titulo: 'Perfiles de usuario', completado: true },
        { titulo: 'Verificacion 2FA', completado: false },
        { titulo: 'Historial de actividad', completado: false },
      ],
    },
    {
      id: 'legal_riesgo',
      nombre: 'Legal & Riesgo',
      descripcion: 'Terminos, privacidad, disclaimers, cumplimiento',
      progreso: 60,
      estado: 'revision',
      prioridad: 'alta',
      subtareas: [
        { titulo: 'Terminos de servicio', completado: true },
        { titulo: 'Politica de privacidad', completado: true },
        { titulo: 'Risk disclosure', completado: true },
        { titulo: 'Cumplimiento regulatorio', completado: false },
        { titulo: 'Auditoria legal', completado: false },
      ],
    },
    {
      id: 'datos_reales',
      nombre: 'Datos en Tiempo Real',
      descripcion: 'Integracion con fuentes de datos de mercado',
      progreso: 10,
      estado: 'pendiente',
      prioridad: 'alta',
      subtareas: [
        { titulo: 'API de datos', completado: false },
        { titulo: 'WebSocket stream', completado: false },
        { titulo: 'Cache de datos', completado: false },
        { titulo: 'Monitoreo de latencia', completado: false },
      ],
    },
    {
      id: 'backtesting',
      nombre: 'Backtesting',
      descripcion: 'Motor de pruebas historicas con analisis de performance',
      progreso: 5,
      estado: 'pendiente',
      prioridad: 'media',
      subtareas: [
        { titulo: 'Motor de backtesting', completado: false },
        { titulo: 'Analisis de resultados', completado: false },
        { titulo: 'Reportes de performance', completado: false },
      ],
    },
    {
      id: 'autobot',
      nombre: 'AutoBot',
      descripcion: 'Bot automatico de ejecucion de operaciones',
      progreso: 0,
      estado: 'pendiente',
      prioridad: 'media',
      subtareas: [
        { titulo: 'Logica de ejecucion', completado: false },
        { titulo: 'Gestion de posiciones', completado: false },
        { titulo: 'Seguridad y controles', completado: false },
      ],
    },
    {
      id: 'mt4_mt5_bridge',
      nombre: 'MT4/MT5 Bridge',
      descripcion: 'Integracion con MetaTrader 4 y 5',
      progreso: 0,
      estado: 'pendiente',
      prioridad: 'media',
      subtareas: [
        { titulo: 'Conexion a MT4', completado: false },
        { titulo: 'Conexion a MT5', completado: false },
        { titulo: 'Sincronizacion de ordenes', completado: false },
      ],
    },
    {
      id: 'gestion_capital',
      nombre: 'Socios Estrategicos CARVIPIX',
      descripcion: 'Programa institucional de evaluacion y gestion de solicitudes',
      progreso: 20,
      estado: 'pendiente',
      prioridad: 'media',
      subtareas: [
        { titulo: 'Formulario de evaluacion', completado: true },
        { titulo: 'Flujo de revision administrativa', completado: false },
        { titulo: 'Estados y trazabilidad', completado: false },
      ],
    },
  ];

  const riesgos = [
    {
      titulo: 'Cumplimiento Regulatorio',
      severidad: 'alta',
      descripcion: 'Requiere validacion legal antes de operaciones reales',
      estado: 'pendiente',
    },
    {
      titulo: 'Seguridad de Datos',
      severidad: 'alta',
      descripcion: 'Implementar encriptacion y auditoria de seguridad',
      estado: 'en-proceso',
    },
    {
      titulo: 'Pruebas de MT4/MT5',
      severidad: 'media',
      descripcion: 'Compatibilidad y sincronizacion con brokers',
      estado: 'no-iniciado',
    },
    {
      titulo: 'Rendimiento del Engine',
      severidad: 'media',
      descripcion: 'Validar latencia bajo carga alta',
      estado: 'en-proceso',
    },
    {
      titulo: 'Socios Estrategicos',
      severidad: 'media',
      descripcion: 'Validar cobertura operativa completa del flujo de evaluacion',
      estado: 'pendiente',
    },
  ];

  const getStatusIcon = (estado: string) => {
    switch (estado) {
      case 'completado':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'revision':
        return <AlertCircle className="w-5 h-5 text-yellow-400" />;
      case 'progreso':
        return <Zap className="w-5 h-5 text-[#D4AF37]" />;
      default:
        return <Circle className="w-5 h-5 text-slate-500" />;
    }
  };

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'completado':
        return 'from-green-500/20 to-green-500/5 border-green-500/30';
      case 'revision':
        return 'from-yellow-500/20 to-yellow-500/5 border-yellow-500/30';
      case 'progreso':
        return 'from-[#D4AF37]/20 to-[#D4AF37]/5 border-[#D4AF37]/30';
      default:
        return 'from-slate-500/10 to-slate-500/5 border-slate-500/20';
    }
  };

  const getPriorityColor = (prioridad: string) => {
    switch (prioridad) {
      case 'alta':
        return 'bg-red-500/20 border-red-500/30 text-red-400';
      case 'media':
        return 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400';
      default:
        return 'bg-blue-500/20 border-blue-500/30 text-blue-400';
    }
  };

  const completedModulos = modulos.filter(m => m.estado === 'completado').length;
  const revisionModulos = modulos.filter(m => m.estado === 'revision').length;
  const progresoModulos = modulos.filter(m => m.estado === 'progreso').length;
  const pendienteModulos = modulos.filter(m => m.estado === 'pendiente').length;

  const totalProgress = Math.round(
    modulos.reduce((sum, m) => sum + m.progreso, 0) / modulos.length
  );

  return (
    <div className="space-y-8">
      {/* Header Overview */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-white mb-1">Progreso General del Proyecto</h2>
            <p className="text-white/60">Estado integral de todas las fases y modulos de CARVIPIX</p>
          </div>
          <div className="text-right">
            <div className="text-5xl font-bold text-[#D4AF37]">{totalProgress}%</div>
            <p className="text-white/60 text-sm mt-1">Avance total</p>
          </div>
        </div>

        {/* Overall Progress Bar */}
        <div className="bg-gradient-to-br from-slate-900/50 to-slate-900/20 border border-white/10 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-white/80 font-mono text-sm">Progreso General</span>
            <span className="text-[#D4AF37] font-bold">{totalProgress}%</span>
          </div>
          <div className="w-full h-4 bg-black/40 rounded-full overflow-hidden border border-white/10">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${totalProgress}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-[#D4AF37] to-yellow-500 rounded-full"
            />
          </div>
        </div>
      </motion.div>

      {/* Build & System Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <div className="bg-gradient-to-br from-green-500/20 to-green-500/5 border border-green-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <span className="font-mono text-xs text-white/80">Build Status</span>
          </div>
          <p className="text-white font-bold text-lg">Exitoso</p>
          <p className="text-white/60 text-xs mt-1">37/37 rutas precompiladas</p>
        </div>

        <div className="bg-gradient-to-br from-[#D4AF37]/20 to-[#D4AF37]/5 border border-[#D4AF37]/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <GitBranch className="w-5 h-5 text-[#D4AF37]" />
            <span className="font-mono text-xs text-white/80">Last Commit</span>
          </div>
          <p className="text-white font-bold text-lg">a08983d</p>
          <p className="text-white/60 text-xs mt-1">Correcciones Trading Engine</p>
        </div>

        <div className="bg-gradient-to-br from-blue-500/20 to-blue-500/5 border border-blue-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-5 h-5 text-blue-400" />
            <span className="font-mono text-xs text-white/80">TypeScript</span>
          </div>
          <p className="text-white font-bold text-lg">0 Errores</p>
          <p className="text-white/60 text-xs mt-1">Compilacion limpia</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500/20 to-purple-500/5 border border-purple-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-5 h-5 text-purple-400" />
            <span className="font-mono text-xs text-white/80">Version</span>
          </div>
          <p className="text-white font-bold text-lg">0.1.0</p>
          <p className="text-white/60 text-xs mt-1">Fase 1 en desarrollo</p>
        </div>
      </motion.div>

      {/* Module Status Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
      >
        <CARVIPIXCard variant="statistics" padding="16" hover={false}>
          <p className="text-4xl font-bold text-green-400 mb-2">{completedModulos}</p>
          <p className="text-white/80 text-sm">Modulos Completados</p>
          <p className="text-white/60 text-xs mt-1">Listos para produccion</p>
        </CARVIPIXCard>

        <CARVIPIXCard variant="statistics" padding="16" hover={false}>
          <p className="text-4xl font-bold text-yellow-400 mb-2">{revisionModulos}</p>
          <p className="text-white/80 text-sm">En Revision</p>
          <p className="text-white/60 text-xs mt-1">Optimizacion tecnica</p>
        </CARVIPIXCard>

        <CARVIPIXCard variant="statistics" padding="16" hover={false}>
          <p className="text-4xl font-bold text-[#D4AF37] mb-2">{progresoModulos}</p>
          <p className="text-white/80 text-sm">En Progreso</p>
          <p className="text-white/60 text-xs mt-1">Desarrollo activo</p>
        </CARVIPIXCard>

        <CARVIPIXCard variant="statistics" padding="16" hover={false}>
          <p className="text-4xl font-bold text-slate-400 mb-2">{pendienteModulos}</p>
          <p className="text-white/80 text-sm">Pendientes</p>
          <p className="text-white/60 text-xs mt-1">Proximas fases</p>
        </CARVIPIXCard>
      </motion.div>

      {/* Modules Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-4"
      >
        <h3 className="text-2xl font-bold text-white">Modulos del Proyecto (12 Total)</h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {modulos.map((modulo, index) => (
            <motion.div
              key={modulo.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.25 + index * 0.03 }}
              className={`bg-gradient-to-br ${getStatusColor(modulo.estado)} border rounded-lg p-5 transition-all hover:border-opacity-100`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3 flex-1">
                  {getStatusIcon(modulo.estado)}
                  <div>
                    <h4 className="font-bold text-white">{modulo.nombre}</h4>
                    <p className="text-white/60 text-sm">{modulo.descripcion}</p>
                  </div>
                </div>
                <CARVIPIXBadge variant={modulo.prioridad === 'alta' ? 'danger' : modulo.prioridad === 'media' ? 'warning' : 'info'}>{modulo.prioridad.toUpperCase()}</CARVIPIXBadge>
              </div>

              {/* Progress Bar */}
              <div className="mb-3">
                <div className="flex justify-between items-center mb-1">
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

              {/* Subtasks */}
              {modulo.subtareas && modulo.subtareas.length > 0 && (
                <div className="space-y-2 pt-3 border-t border-white/10">
                  {modulo.subtareas.map((tarea, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      {tarea.completado ? (
                        <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                      ) : (
                        <Circle className="w-4 h-4 text-slate-600 flex-shrink-0" />
                      )}
                      <span className={tarea.completado ? 'text-white/60 line-through' : 'text-white/70'}>
                        {tarea.titulo}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Risk Checklist */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-4"
      >
        <h3 className="text-2xl font-bold text-white flex items-center gap-2">
          <AlertTriangle className="w-6 h-6 text-red-400" />
          Checklist de Riesgos Importantes
        </h3>

        <div className="space-y-3">
          {riesgos.map((riesgo, i) => {
            const severidadColor =
              riesgo.severidad === 'alta'
                ? 'bg-red-500/20 border-red-500/30'
                : 'bg-yellow-500/20 border-yellow-500/30';
            const severidadText =
              riesgo.severidad === 'alta' ? 'text-red-400' : 'text-yellow-400';

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35 + i * 0.05 }}
                className={`border rounded-lg p-4 ${severidadColor}`}
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle className={`w-5 h-5 flex-shrink-0 ${severidadText} mt-0.5`} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold text-white">{riesgo.titulo}</h4>
                      <CARVIPIXBadge variant={riesgo.severidad === 'alta' ? 'danger' : 'warning'}>
                        {riesgo.severidad.toUpperCase()}
                      </CARVIPIXBadge>
                      <span className="ml-auto">
                      <CARVIPIXBadge variant={riesgo.estado === 'en-proceso' ? 'premium' : riesgo.estado === 'pendiente' ? 'danger' : 'default'}>
                        {riesgo.estado === 'en-proceso' ? 'EN PROCESO' : 
                         riesgo.estado === 'pendiente' ? 'PENDIENTE' : 'NO INICIADO'}
                      </CARVIPIXBadge>
                      </span>
                    </div>
                    <p className="text-white/70 text-sm">{riesgo.descripcion}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Next Steps */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-gradient-to-br from-[#D4AF37]/20 to-[#D4AF37]/5 border border-[#D4AF37]/30 rounded-lg p-6"
      >
        <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
          <Flag className="w-6 h-6 text-[#D4AF37]" />
          Proximas Prioridades
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white/5 rounded p-4 border border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <Gauge className="w-5 h-5 text-[#D4AF37]" />
              <p className="font-bold text-white text-sm">Fase Inmediata (1-2 semanas)</p>
            </div>
            <ul className="text-white/70 text-sm space-y-1">
              <li>- Pruebas de Trading Engine</li>
              <li>- Validacion de Legal</li>
              <li>- Optimizacion de Panel Admin</li>
            </ul>
          </div>

          <div className="bg-white/5 rounded p-4 border border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <Gauge className="w-5 h-5 text-yellow-400" />
              <p className="font-bold text-white text-sm">Fase Corto Plazo (3-4 semanas)</p>
            </div>
            <ul className="text-white/70 text-sm space-y-1">
              <li>- Integrar datos en tiempo real</li>
              <li>- Desarrollar motor backtesting</li>
              <li>- Expandir alertas</li>
            </ul>
          </div>

          <div className="bg-white/5 rounded p-4 border border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <Gauge className="w-5 h-5 text-slate-400" />
              <p className="font-bold text-white text-sm">Fase Mediano Plazo (5-8 semanas)</p>
            </div>
            <ul className="text-white/70 text-sm space-y-1">
              <li>- AutoBot automatico</li>
              <li>- Bridge MT4/MT5</li>
              <li>- Socios estrategicos avanzados</li>
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
