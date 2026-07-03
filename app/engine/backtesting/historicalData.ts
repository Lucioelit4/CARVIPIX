/**
 * Generador de datos históricos para backtesting
 * Simula velas históricas cuando no hay API real
 * Fallback a demo si no hay API key
 */

import { Candle, Asset, Timeframe } from '../types/marketData';

/**
 * Generar velas históricas simuladas
 */
export function generateHistoricalCandles(
  asset: Asset,
  timeframe: Timeframe,
  daysBack: number = 30
): Candle[] {
  const candles: Candle[] = [];
  const basePrice = getPriceForAsset(asset);

  // Determinar intervalo en ms según timeframe
  const intervalMs = getIntervalMs(timeframe);
  const now = Date.now();
  const daysInMs = daysBack * 24 * 60 * 60 * 1000;

  let currentPrice = basePrice;
  let trend = Math.random() > 0.5 ? 1 : -1; // Tendencia aleatoria

  for (let i = Math.floor(daysInMs / intervalMs); i >= 0; i--) {
    const timestamp = now - i * intervalMs;

    // Simular movimiento de precio con random walk
    const priceChange = (Math.random() - 0.5) * 0.02 * currentPrice;
    const volatility = 0.005 * currentPrice; // 0.5%

    const open = currentPrice;
    const close = currentPrice + priceChange;
    const high = Math.max(open, close) + Math.random() * volatility;
    const low = Math.min(open, close) - Math.random() * volatility;
    const volume = 1000 + Math.random() * 5000;

    // Cambiar tendencia ocasionalmente
    if (Math.random() < 0.1) {
      trend *= -1;
    }

    // Aplicar tendencia
    currentPrice = close + trend * volatility * 0.5;
    currentPrice = Math.max(currentPrice, low * 0.95); // Evitar negativos

    candles.push({
      timestamp,
      open,
      high,
      low,
      close,
      volume,
      asset,
      timeframe,
      complete: i < 5 ? false : true, // Las últimas 5 velas incompletas
    });
  }

  return candles.reverse();
}

/**
 * Obtener precio base para cada activo
 */
function getPriceForAsset(asset: Asset): number {
  const prices: Record<Asset, number> = {
    XAUUSD: 2050, // Oro
    EURUSD: 1.08, // Euro
    GBPUSD: 1.27, // Libra
    BTCUSD: 42000, // Bitcoin
  };

  return prices[asset];
}

/**
 * Obtener intervalo en ms para cada timeframe
 */
function getIntervalMs(timeframe: Timeframe): number {
  const intervals: Record<Timeframe, number> = {
    '1H': 60 * 60 * 1000,
    '45M': 45 * 60 * 1000,
    '5M': 5 * 60 * 1000,
  };

  return intervals[timeframe];
}

/**
 * Simular datos de backtesting históricos
 * Retorna datos realistas para demostración
 */
export function generateBacktestData(
  asset: Asset,
  timeframe: Timeframe,
  startDate: number,
  endDate: number
): Candle[] {
  const candles: Candle[] = [];
  const basePrice = getPriceForAsset(asset);
  const intervalMs = getIntervalMs(timeframe);

  let currentPrice = basePrice;
  let trend = 1;
  let trendCounter = 0;

  for (let timestamp = startDate; timestamp <= endDate; timestamp += intervalMs) {
    // Generar patrón realista
    const normalizedPrice = currentPrice / basePrice;

    // Ruido aleatorio
    const noise = (Math.random() - 0.5) * 0.02;

    // Cambiar tendencia cada 50-100 velas
    trendCounter++;
    if (trendCounter > 50 + Math.random() * 50) {
      trend *= -1;
      trendCounter = 0;
    }

    // Tendencia consistente
    const trendComponent = trend * 0.005;

    // Precio de cierre
    const close = currentPrice * (1 + noise + trendComponent);

    // OHLC
    const open = currentPrice;
    const high = Math.max(open, close) * (1 + Math.random() * 0.005);
    const low = Math.min(open, close) * (1 - Math.random() * 0.005);
    const volume = 1000 + Math.random() * 10000;

    candles.push({
      timestamp,
      open,
      high,
      low,
      close,
      volume,
      asset,
      timeframe,
      complete: timestamp < endDate - intervalMs * 5, // Últimas velas incompletas
    });

    currentPrice = close;
  }

  return candles;
}

/**
 * Cargar datos históricos (demo o real)
 * Si no hay API key, usa generador de demo
 */
export async function loadHistoricalData(
  asset: Asset,
  timeframe: Timeframe,
  startDate: number,
  endDate: number,
  useDemo: boolean = false
): Promise<Candle[]> {
  try {
    if (useDemo) {
      // Usar datos simulados
      return generateBacktestData(asset, timeframe, startDate, endDate);
    }

    // En producción, conectar a API real (Twelve Data, etc)
    // Por ahora, usar datos de demostración
    return generateBacktestData(asset, timeframe, startDate, endDate);
  } catch (error) {
    console.warn('Error cargando datos históricos, usando demo:', error);
    // Fallback a demo
    return generateBacktestData(asset, timeframe, startDate, endDate);
  }
}

/**
 * Validar rango de fechas
 */
export function validateDateRange(
  startDate: number,
  endDate: number,
  minDays: number = 7
): { valid: boolean; error?: string } {
  const diffMs = endDate - startDate;
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (startDate >= endDate) {
    return { valid: false, error: 'Start date must be before end date' };
  }

  if (diffDays < minDays) {
    return { valid: false, error: `Minimum ${minDays} days required` };
  }

  if (startDate < Date.now() - 365 * 24 * 60 * 60 * 1000) {
    // Advertencia: más de 1 año atrás
    console.warn('Backtesting with data older than 1 year');
  }

  return { valid: true };
}
