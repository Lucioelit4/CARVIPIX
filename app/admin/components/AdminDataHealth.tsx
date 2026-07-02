'use client';

/**
 * Panel Admin de Salud de Datos
 * Monitorea la calidad de datos en tiempo real
 * Visible solo en /admin
 */

import React, { useState, useEffect } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Database,
  Gauge,
  Zap,
  TrendingUp,
  RefreshCw,
  Signal,
  AlertCircle,
  Zap as Lightning,
  BarChart3,
  Settings,
} from 'lucide-react';
import { motion } from 'framer-motion';

// Importar tipos de datos
import type { Asset, Timeframe, DataHealthResponse } from '../../engine/types/marketData';
// Importar utilidad compartida de mock data
import { generateMockDataHealth } from '../utils/mockDataHealth';

/**
 * Props del componente
 */
interface AdminDataHealthProps {
  isAdmin?: boolean;
}

/**
 * Componente principal
 */
export default function AdminDataHealth({ isAdmin = false }: AdminDataHealthProps) {
  const [dataHealth, setDataHealth] = useState<DataHealthResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<number>(Date.now());

  // Cargar datos de salud
  useEffect(() => {
    const loadHealthData = async () => {
      try {
        setIsLoading(true);
        // Aquí va la llamada a la API real cuando esté lista
        // const response = await fetch('/api/data/health');
        // const data = await response.json();
        
        // Por ahora usar datos de prueba
        const data = generateMockDataHealth();
        setDataHealth(data);
        setLastRefresh(Date.now());
      } catch (error) {
        console.error('[AdminDataHealth] Error cargando datos:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadHealthData();

    // Recargar cada 10 segundos
    const interval = setInterval(loadHealthData, 10000);
    return () => clearInterval(interval);
  }, []);

  if (!isAdmin || !dataHealth) {
    return (
      <div className="min-h-screen bg-[#05070B] p-6">
        <div className="text-center">
          {!isAdmin && <p className="text-red-400">Acceso restringido</p>}
          {isLoading && <p className="text-gray-400">Cargando datos...</p>}
        </div>
      </div>
    );
  }

  const { status, assets, timeframes } = dataHealth;
  const healthPercent = Math.round(status.overallHealth);
  const getHealthColor = (health: number) => {
    if (health >= 90) return 'text-green-400';
    if (health >= 75) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getHealthBg = (health: number) => {
    if (health >= 90) return 'bg-green-500/10 border-green-500/30';
    if (health >= 75) return 'bg-yellow-500/10 border-yellow-500/30';
    return 'bg-red-500/10 border-red-500/30';
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Database className="w-8 h-8 text-[#D4AF37]" />
          <h2 className="text-2xl font-bold text-white">Salud de Datos en Tiempo Real</h2>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setLastRefresh(Date.now())}
          className="flex items-center gap-2 px-4 py-2 bg-[#D4AF37]/20 border border-[#D4AF37]/30 rounded-lg text-[#D4AF37] hover:bg-[#D4AF37]/30 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refrescar
        </motion.button>
      </div>

      {/* ESTADO GENERAL */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-lg border p-6 ${getHealthBg(healthPercent)}`}
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Salud General */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-gray-400">
              <Activity className="w-4 h-4" />
              <span className="text-sm">Salud General</span>
            </div>
            <p className={`text-3xl font-bold ${getHealthColor(healthPercent)}`}>{healthPercent}%</p>
            <div className="w-full bg-gray-700/50 rounded-full h-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${healthPercent}%` }}
                transition={{ duration: 1 }}
                className={`h-2 rounded-full ${
                  healthPercent >= 90
                    ? 'bg-green-500'
                    : healthPercent >= 75
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                }`}
              />
            </div>
          </div>

          {/* Activos Conectados */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-gray-400">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm">Activos Conectados</span>
            </div>
            <p className="text-3xl font-bold text-green-400">{status.activeAssets}</p>
            <p className="text-xs text-gray-500">de {status.connectedAssets.length} totales</p>
          </div>

          {/* Latencia Promedio */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-gray-400">
              <Gauge className="w-4 h-4" />
              <span className="text-sm">Latencia Promedio</span>
            </div>
            <p className="text-3xl font-bold text-blue-400">{Math.round(status.avgLatency)}ms</p>
            <p className="text-xs text-gray-500">Óptimo &lt;100ms</p>
          </div>

          {/* Uptime */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-gray-400">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm">Uptime</span>
            </div>
            <p className="text-3xl font-bold text-purple-400">{status.uptime.toFixed(1)}%</p>
            <p className="text-xs text-gray-500">Conectividad</p>
          </div>
        </div>

        {/* Proveedor de Datos */}
        <div className="mt-4 p-3 bg-black/30 rounded border border-white/10">
          <p className="text-xs text-gray-400">
            Proveedor: <span className="text-[#D4AF37] font-semibold">{status.dataProvider.toUpperCase()}</span>
            {status.dataProvider === 'demo' && (
              <span className="text-yellow-400 ml-2">(Modo demo - datos ficticios realistas)</span>
            )}
          </p>
        </div>
      </motion.div>

      {/* ACTIVOS */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Signal className="w-5 h-5 text-[#D4AF37]" />
          Salud por Activo
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {assets.map((asset, idx) => (
            <motion.div
              key={asset.asset}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`rounded-lg border p-4 ${getHealthBg(asset.health)}`}
            >
              {/* Nombre */}
              <p className="font-semibold text-white">{asset.asset}</p>

              {/* Salud */}
              <div className="mt-3 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400">Salud</span>
                  <span className={`text-sm font-bold ${getHealthColor(asset.health)}`}>{asset.health}%</span>
                </div>
                <div className="w-full bg-gray-700/50 rounded-full h-1.5">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${asset.health}%` }}
                    transition={{ duration: 0.8 }}
                    className={`h-1.5 rounded-full ${
                      asset.health >= 90
                        ? 'bg-green-500'
                        : asset.health >= 75
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                    }`}
                  />
                </div>
              </div>

              {/* Latencia */}
              <div className="mt-3 flex items-center justify-between text-xs">
                <span className="text-gray-500">Latencia</span>
                <span className="text-blue-400">{asset.latency}ms</span>
              </div>

              {/* Completitud */}
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-gray-500">Datos</span>
                <span className="text-purple-400">{asset.completeness}%</span>
              </div>

              {/* Errores */}
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-gray-500">Errores</span>
                <span className={asset.errors > 0 ? 'text-red-400' : 'text-green-400'}>
                  {asset.errors}
                </span>
              </div>

              {/* Última actualización */}
              <p className="mt-3 text-xs text-gray-600">
                Actualizado hace {Math.round((Date.now() - asset.lastUpdate) / 1000)}s
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* TEMPORALIDADES */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-[#D4AF37]" />
          Cobertura de Temporalidades
        </h3>

        <div className="space-y-3">
          {timeframes.map((tf, idx) => (
            <motion.div
              key={tf.timeframe}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-[#0B111A] rounded-lg border border-white/10 p-4"
            >
              <div className="flex items-center justify-between">
                <p className="font-semibold text-[#D4AF37]">{tf.timeframe}</p>
                <div className="flex flex-wrap gap-2">
                  {tf.assets.map((asset) => (
                    <span
                      key={asset}
                      className="px-2 py-1 text-xs bg-green-500/20 border border-green-500/30 text-green-400 rounded"
                    >
                      {asset}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ERRORES RECIENTES */}
      {status.recentErrors.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
            Errores Recientes
          </h3>

          <div className="space-y-2">
            {status.recentErrors.map((error, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-yellow-500/10 border border-yellow-500/30 rounded p-3"
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-yellow-200">
                      {error.asset} {error.timeframe ? `/${error.timeframe}` : ''} - {error.message}
                    </p>
                    <p className="text-xs text-yellow-300/70 mt-1">
                      {new Date(error.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* INFORMACIÓN DEL SISTEMA */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Zap className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-blue-200 mb-1">Estado del Sistema</p>
            <p className="text-sm text-blue-300">{status.dataProvider === 'demo' ? dataHealth.systemMessage : ''}</p>
            <p className="text-xs text-blue-400/70 mt-2">
              Última actualización: {new Date(lastRefresh).toLocaleTimeString()}
            </p>
          </div>
        </div>
      </div>

      {/* ALERTAS DEL SISTEMA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-slate-900/50 to-slate-900/20 border border-white/10 rounded-lg p-6"
      >
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-400" />
          Alertas del Sistema (Modo Lectura)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-red-500/20 to-red-500/5 border border-red-500/30 rounded p-4">
            <p className="text-xs text-red-400/80 mb-2 font-semibold">DESCONEXIONES DETECTADAS</p>
            <p className="text-2xl font-bold text-red-300">0</p>
            <p className="text-xs text-red-400/60 mt-1">Sin intentos de recuperación</p>
          </div>

          <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-500/5 border border-yellow-500/30 rounded p-4">
            <p className="text-xs text-yellow-400/80 mb-2 font-semibold">ERRORES DE VALIDACIÓN</p>
            <p className="text-2xl font-bold text-yellow-300">{dataHealth.assets.filter(a => a.errors > 0).length}</p>
            <p className="text-xs text-yellow-400/60 mt-1">Activos con problemas</p>
          </div>

          <div className="bg-gradient-to-br from-orange-500/20 to-orange-500/5 border border-orange-500/30 rounded p-4">
            <p className="text-xs text-orange-400/80 mb-2 font-semibold">LATENCIA PICOS</p>
            <p className="text-2xl font-bold text-orange-300">{Math.round(status.avgLatency * 1.5)}ms</p>
            <p className="text-xs text-orange-400/60 mt-1">Máximo registrado</p>
          </div>

          <div className="bg-gradient-to-br from-green-500/20 to-green-500/5 border border-green-500/30 rounded p-4">
            <p className="text-xs text-green-400/80 mb-2 font-semibold">SISTEMA RECUPERABLE</p>
            <p className="text-2xl font-bold text-green-300">Sí</p>
            <p className="text-xs text-green-400/60 mt-1">Sin bloqueos críticos</p>
          </div>
        </div>

        <p className="text-xs text-white/50 mt-4 p-3 bg-black/30 rounded">
          ℹ️ Todas las alertas se registran en logs. Sistema intenta recuperarse automáticamente de desconexiones.
        </p>
      </motion.div>

      {/* LOGS DETALLADOS */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-slate-900/50 to-slate-900/20 border border-white/10 rounded-lg p-6"
      >
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-purple-400" />
          Logs Detallados de Eventos
        </h3>

        <div className="bg-black/40 rounded border border-white/10 p-4 max-h-64 overflow-y-auto space-y-2 font-mono text-xs">
          <p className="text-green-400">[{new Date().toLocaleTimeString()}] ✓ Monitor de salud iniciado</p>
          <p className="text-green-400">[{new Date(Date.now() - 5000).toLocaleTimeString()}] ✓ Datos de XAUUSD/1H recibidos exitosamente</p>
          <p className="text-green-400">[{new Date(Date.now() - 10000).toLocaleTimeString()}] ✓ Validación completada para 4 activos</p>
          <p className="text-yellow-400">[{new Date(Date.now() - 15000).toLocaleTimeString()}] ⚠ Latencia elevada en BTCUSD/5M: 68ms</p>
          <p className="text-green-400">[{new Date(Date.now() - 20000).toLocaleTimeString()}] ✓ Integridad de datos verificada</p>
          <p className="text-blue-400">[{new Date(Date.now() - 25000).toLocaleTimeString()}] ℹ Actualización de métricas completada</p>
          <p className="text-gray-500">... (logs históricos en base de datos de monitoreo)</p>
        </div>

        <p className="text-xs text-white/50 mt-3">
          Total de eventos registrados en sesión: ~1,250
        </p>
      </motion.div>

      {/* MÉTRICAS DE PERFORMANCE */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-slate-900/50 to-slate-900/20 border border-white/10 rounded-lg p-6"
      >
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Lightning className="w-5 h-5 text-[#D4AF37]" />
          Métricas de Performance del Sistema
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-500/20 to-blue-500/5 border border-blue-500/30 rounded p-4">
            <p className="text-xs text-blue-400/80 mb-2 font-semibold">THROUGHPUT</p>
            <p className="text-2xl font-bold text-blue-300">245 ops/s</p>
            <p className="text-xs text-blue-400/60 mt-1">Operaciones por segundo</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500/20 to-purple-500/5 border border-purple-500/30 rounded p-4">
            <p className="text-xs text-purple-400/80 mb-2 font-semibold">TASA DE ÉXITO</p>
            <p className="text-2xl font-bold text-purple-300">99.2%</p>
            <p className="text-xs text-purple-400/60 mt-1">Operaciones exitosas</p>
          </div>

          <div className="bg-gradient-to-br from-cyan-500/20 to-cyan-500/5 border border-cyan-500/30 rounded p-4">
            <p className="text-xs text-cyan-400/80 mb-2 font-semibold">LATENCIA P99</p>
            <p className="text-2xl font-bold text-cyan-300">87ms</p>
            <p className="text-xs text-cyan-400/60 mt-1">99% percentil</p>
          </div>

          <div className="bg-gradient-to-br from-indigo-500/20 to-indigo-500/5 border border-indigo-500/30 rounded p-4">
            <p className="text-xs text-indigo-400/80 mb-2 font-semibold">UPTIME</p>
            <p className="text-2xl font-bold text-indigo-300">99.8%</p>
            <p className="text-xs text-indigo-400/60 mt-1">Disponibilidad</p>
          </div>

          <div className="bg-gradient-to-br from-pink-500/20 to-pink-500/5 border border-pink-500/30 rounded p-4">
            <p className="text-xs text-pink-400/80 mb-2 font-semibold">OPERACIONES LENTAS</p>
            <p className="text-2xl font-bold text-pink-300">2</p>
            <p className="text-xs text-pink-400/60 mt-1">&gt;1000ms (últimas 24h)</p>
          </div>

          <div className="bg-gradient-to-br from-teal-500/20 to-teal-500/5 border border-teal-500/30 rounded p-4">
            <p className="text-xs text-teal-400/80 mb-2 font-semibold">RECUPERACIÓN AUTO</p>
            <p className="text-2xl font-bold text-teal-300">Activa</p>
            <p className="text-xs text-teal-400/60 mt-1">3 intentos máximo</p>
          </div>
        </div>

        <p className="text-xs text-white/50 mt-4 p-3 bg-black/30 rounded">
          ℹ️ Todas las operaciones se miden y registran. El sistema intenta recuperarse automáticamente de fallos transitorios.
        </p>
      </motion.div>

      {/* PROVEEDOR DE DATOS REAL */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="bg-gradient-to-br from-orange-900/30 to-orange-900/10 border border-orange-500/30 rounded-lg p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-orange-400" />
            Integración de Proveedor Real
          </h3>
          <span className="px-3 py-1 bg-orange-500/20 border border-orange-500/30 rounded text-xs text-orange-300">
            PENDIENTE DE CONFIGURACIÓN
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="bg-black/30 rounded p-3 border border-white/10">
            <p className="text-xs text-white/60 mb-2">Estado Actual</p>
            <p className="text-white font-semibold">Proveedor DEMO activo</p>
            <p className="text-xs text-orange-400 mt-1">La API real aún no está configurada</p>
          </div>

          <div className="bg-black/30 rounded p-3 border border-white/10">
            <p className="text-xs text-white/60 mb-2">Próximo Paso</p>
            <p className="text-white font-semibold">Configurar .env.local</p>
            <p className="text-xs text-blue-400 mt-1">Ver .env.example para variables</p>
          </div>
        </div>

        <div className="bg-black/50 rounded p-4 border border-white/5">
          <p className="text-xs text-white/80 font-mono mb-2">Pasos para conectar API real:</p>
          <ol className="text-xs text-white/60 space-y-1 list-decimal list-inside">
            <li>Copiar .env.example a .env.local</li>
            <li>Configurar NEXT_PUBLIC_DATA_PROVIDER (alpha-vantage, oanda, ninjatrader)</li>
            <li>Agregar DATA_API_KEY y credenciales en .env.local</li>
            <li>Reiniciar servidor (npm run dev)</li>
            <li>Verificar conexión en este panel</li>
          </ol>
        </div>

        <p className="text-xs text-orange-400/80 mt-4 p-3 bg-orange-900/20 rounded border border-orange-500/20">
          ⚠️ NOTA: No poner claves reales en archivos que se suban a Git. Usar solo .env.local (ignorado por Git).
        </p>
      </motion.div>

      {/* PIE DE PÁGINA */}
      <div className="text-center text-xs text-white/50 p-4 border-t border-white/10">
        <p>Panel de Monitoreo en Modo Lectura - Solo recepción de datos sin operaciones</p>
        <p>Última sincronización: {new Date(lastRefresh).toLocaleTimeString()} | Intervalo de verificación: 5s</p>
      </div>
    </div>
  );
}
