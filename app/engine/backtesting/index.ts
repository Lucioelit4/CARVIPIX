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

// Monte Carlo
export { 
  runMonteCarloAnalysis,
  type MonteCarloConfig,
  type MonteCarloIteration,
  type MonteCarloAnalysis,
} from './monteCarlo';

// Walk-forward
export {
  runWalkForwardAnalysis,
  detectOverfitting,
  type WalkForwardConfig,
  type WalkForwardWindow,
  type WalkForwardAnalysis,
} from './walkForward';

// Performance
export {
  PerformanceTracker,
  comparePerformanceReports,
  type PerformanceStats,
  type AssetPerformanceStats,
  type PerformanceReport,
} from './performance';
