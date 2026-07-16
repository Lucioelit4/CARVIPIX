/**
 * Utilidad compartida para generar datos mock de salud de datos
 * Utilizada por AdminBot y AdminDataHealth
 */

import type { DataHealthResponse } from '../../engine/types/marketData';

/**
 * Genera datos de prueba para monitoreo de salud de datos
 * Reemplazar con datos reales del provider cuando esté lista la API
 */
export const generateMockDataHealth = (): DataHealthResponse => {
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
          '30M': {
            asset: 'XAUUSD',
            timeframe: '30M',
            status: 'connected',
            lastConnect: now - 1800000,
            uptime: 1800000,
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
          '30M': {
            asset: 'EURUSD',
            timeframe: '30M',
            status: 'connected',
            lastConnect: now - 1800000,
            uptime: 1800000,
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
          '30M': {
            asset: 'GBPUSD',
            timeframe: '30M',
            status: 'connected',
            lastConnect: now - 1800000,
            uptime: 1800000,
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
          '30M': {
            asset: 'BTCUSD',
            timeframe: '30M',
            status: 'connected',
            lastConnect: now - 1800000,
            uptime: 1800000,
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
      { timeframe: '30M', assets: ['XAUUSD', 'EURUSD', 'GBPUSD', 'BTCUSD'] },
      { timeframe: '45M', assets: ['XAUUSD', 'EURUSD', 'GBPUSD', 'BTCUSD'] },
      { timeframe: '5M', assets: ['XAUUSD', 'EURUSD', 'GBPUSD', 'BTCUSD'] },
    ],
    recentFailures: [],
    systemMessage:
      'Todos los datos están en modo demo. Sistema listo para conectar proveedor real de datos.',
  };
};
