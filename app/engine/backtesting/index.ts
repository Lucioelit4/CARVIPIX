/**
 * Índice del módulo privado de backtesting
 * Exporta todas las utilidades para backtesting
 * USO EXCLUSIVO: Admin panel - NO exponer al cliente
 */

// Engine
export { BacktestEngine } from './backtestEngine';

// Cálculos
export { calculateBacktestMetrics, validateMetrics } from './calculations';

// Datos históricos
export { 
  generateHistoricalCandles, 
  generateBacktestData, 
  loadHistoricalData, 
  validateDateRange 
} from './historicalData';
