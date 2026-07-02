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
} from 'lucide-react';
import { motion } from 'framer-motion';

// Importar tipos de datos
import type { Asset, Timeframe, DataHealthResponse } from '../../engine/types/marketData';

/**
 * Props del componente
 */
interface AdminDataHealthProps {
  isAdmin?: boolean;
}

/**
 * Datos de prueba para desarrollo
 * Reemplazar con datos reales del provider cuando esté lista la API
 */
const generateMockDataHealth = (): DataHealthResponse => {
  const now = Date.now();
  
  return {
    status: {
      timestamp: now,
      overallHealth: 88 + Math.random() * 10,
      connectedAssets: ['XAUUSD', 'EURUSD', 'GBPUSD', 'BTCUSD'],
      disconnectedAssets: [],
      totalErrors: Math.floor(Math.random() * 15),
      activeAssets: 4,
      dataProvider: 'demo',
      avgLatency: 45 + Math.random() * 30,
      uptime: 98.5 + Math.random() * 1.5,
      lastUpdate: now - Math.floor(Math.random() * 5000),
      connectionStates: {
        XAUUSD: {
          '1H': {
            asset: 'XAUUSD',
            timeframe: '1H',
            status: 'connected',
            lastConnect: now - 3600000,
            uptime: 3600000,
            failureCount: 0,
            consecutiveErrors: 0,
          },
          '45M': {
            asset: 'XAUUSD',
            timeframe: '45M',
            status: 'connected',
            lastConnect: now - 2700000,
            uptime: 2700000,
            failureCount: 0,
            consecutiveErrors: 0,
          },
          '5M': {
            asset: 'XAUUSD',
            timeframe: '5M',
            status: 'connected',
            lastConnect: now - 300000,
            uptime: 300000,
            failureCount: 0,
            consecutiveErrors: 0,
          },
        },
        EURUSD: {
          '1H': {
            asset: 'EURUSD',
            timeframe: '1H',
            status: 'connected',
            lastConnect: now - 3600000,
            uptime: 3600000,
            failureCount: 0,
            consecutiveErrors: 0,
          },
          '45M': {
            asset: 'EURUSD',
            timeframe: '45M',
            status: 'connected',
            lastConnect: now - 2700000,
            uptime: 2700000,
            failureCount: 0,
            consecutiveErrors: 0,
          },
          '5M': {
            asset: 'EURUSD',
            timeframe: '5M',
            status: 'connected',
            lastConnect: now - 300000,
            uptime: 300000,
            failureCount: 0,
            consecutiveErrors: 0,
          },
        },
        GBPUSD: {
          '1H': {
            asset: 'GBPUSD',
            timeframe: '1H',
            status: 'connected',
            lastConnect: now - 3600000,
            uptime: 3600000,
            failureCount: 0,
            consecutiveErrors: 0,
          },
          '45M': {
            asset: 'GBPUSD',
            timeframe: '45M',
            status: 'connected',
            lastConnect: now - 2700000,
            uptime: 2700000,
            failureCount: 0,
            consecutiveErrors: 0,
          },
          '5M': {
            asset: 'GBPUSD',
            timeframe: '5M',
            status: 'connected',
            lastConnect: now - 300000,
            uptime: 300000,
            failureCount: 0,
            consecutiveErrors: 0,
          },
        },
        BTCUSD: {
          '1H': {
            asset: 'BTCUSD',
            timeframe: '1H',
            status: 'connected',
            lastConnect: now - 3600000,
            uptime: 3600000,
            failureCount: 0,
            consecutiveErrors: 0,
          },
          '45M': {
            asset: 'BTCUSD',
            timeframe: '45M',
            status: 'connected',
            lastConnect: now - 2700000,
            uptime: 2700000,
            failureCount: 0,
            consecutiveErrors: 0,
          },
          '5M': {
            asset: 'BTCUSD',
            timeframe: '5M',
            status: 'connected',
            lastConnect: now - 300000,
            uptime: 300000,
            failureCount: 0,
            consecutiveErrors: 0,
          },
        },
      },
      recentErrors: [
        {
          timestamp: now - 120000,
          asset: 'EURUSD',
          timeframe: '1H',
          errorType: 'latency',
          message: 'Latencia detectada en EURUSD/1H',
          severity: 'warning',
        },
      ],
    },
    assets: [
      { asset: 'XAUUSD', health: 92, latency: 38, errors: 0, lastUpdate: now - 1000, completeness: 98 },
      { asset: 'EURUSD', health: 89, latency: 52, errors: 1, lastUpdate: now - 2000, completeness: 96 },
      { asset: 'GBPUSD', health: 91, latency: 41, errors: 0, lastUpdate: now - 1500, completeness: 97 },
      { asset: 'BTCUSD', health: 85, latency: 68, errors: 2, lastUpdate: now - 3000, completeness: 94 },
    ],
    timeframes: [
      { timeframe: '1H', assets: ['XAUUSD', 'EURUSD', 'GBPUSD', 'BTCUSD'] },
      { timeframe: '45M', assets: ['XAUUSD', 'EURUSD', 'GBPUSD', 'BTCUSD'] },
      { timeframe: '5M', assets: ['XAUUSD', 'EURUSD', 'GBPUSD', 'BTCUSD'] },
    ],
    recentFailures: [],
    systemMessage:
      'Todos los datos están en modo demo. Sistema listo para conectar proveedor real de datos.',
  };
};

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
    </div>
  );
}
