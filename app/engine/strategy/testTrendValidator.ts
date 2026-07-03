/**
 * TEST: TrendValidator v1.1 con datos reales de 1 mes XAUUSD
 * 
 * Objetivo:
 * 1. Cargar datos de junio 2026 (1 mes)
 * 2. Agrupar en velas de 1H
 * 3. Calcular EMAs (20, 50, 200)
 * 4. Ejecutar TrendValidator en cada vela
 * 5. Generar estadísticas y ejemplos
 * 
 * NO PARA PRODUCCIÓN - Solo testing
 */

import * as fs from 'fs';
import * as path from 'path';
import TrendValidator from './trendValidation';

interface MinuteCandle {
  timestamp: number;
  date: string;
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface HourlyCandle {
  timestamp: number;
  date: string;
  hour: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  minuteCandles: MinuteCandle[];
}

interface ValidationResult {
  timestamp: number;
  date: string;
  hour: number;
  direction: 'BUY' | 'SELL' | 'NEUTRAL';
  confidenceLevel: 'A+' | 'A' | 'B' | 'C';
  bullishScore: number;
  bearishScore: number;
  price: number;
  ema20: number;
  ema50: number;
  ema200: number;
  reason: string;
}

interface Statistics {
  totalCandles: number;
  buyCount: number;
  sellCount: number;
  neutralCount: number;
  confidenceA_Plus: number;
  confidenceA: number;
  confidenceB: number;
  confidenceC: number;
  buyExamples: ValidationResult[];
  sellExamples: ValidationResult[];
  neutralExamples: ValidationResult[];
}

/**
 * Parsea una línea del CSV XAUUSD M1
 */
function parseMinuteCandle(line: string): MinuteCandle | null {
  try {
    const parts = line.split(';');
    if (parts.length < 5) return null;

    const dateTime = parts[0].trim();
    const [datePart, timePart] = dateTime.split(' ');

    const year = parseInt(datePart.substring(0, 4));
    const month = parseInt(datePart.substring(4, 6));
    const day = parseInt(datePart.substring(6, 8));
    const hour = parseInt(timePart.substring(0, 2));
    const minute = parseInt(timePart.substring(2, 4));
    const second = parseInt(timePart.substring(4, 6));

    const date = new Date(year, month - 1, day, hour, minute, second);
    const timestamp = date.getTime();

    return {
      timestamp,
      date: datePart,
      time: timePart,
      open: parseFloat(parts[1]),
      high: parseFloat(parts[2]),
      low: parseFloat(parts[3]),
      close: parseFloat(parts[4]),
    };
  } catch (e) {
    return null;
  }
}

/**
 * Lee datos de 1 mes desde el CSV
 */
function loadMonthData(filePath: string): MinuteCandle[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter((line) => line.trim());

  const candles: MinuteCandle[] = [];
  for (const line of lines) {
    const candle = parseMinuteCandle(line);
    if (candle) {
      candles.push(candle);
    }
  }

  return candles;
}

/**
 * Agrupa candles de 1 minuto en velas de 1 hora
 */
function groupIntoHourly(minuteCandles: MinuteCandle[]): HourlyCandle[] {
  const hourlyMap = new Map<number, HourlyCandle>();

  for (const candle of minuteCandles) {
    const date = new Date(candle.timestamp);
    date.setMinutes(0, 0, 0);
    const hourTimestamp = date.getTime();
    const hour = date.getHours();
    const dateStr = candle.date;

    if (!hourlyMap.has(hourTimestamp)) {
      hourlyMap.set(hourTimestamp, {
        timestamp: hourTimestamp,
        date: dateStr,
        hour,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
        volume: 0,
        minuteCandles: [],
      });
    }

    const hourly = hourlyMap.get(hourTimestamp)!;
    hourly.high = Math.max(hourly.high, candle.high);
    hourly.low = Math.min(hourly.low, candle.low);
    hourly.close = candle.close;
    hourly.volume++;
    hourly.minuteCandles.push(candle);
  }

  return Array.from(hourlyMap.values()).sort((a, b) => a.timestamp - b.timestamp);
}

/**
 * Calcula EMA simple
 * EMA = (Close - EMA_prev) * multiplier + EMA_prev
 * multiplier = 2 / (N + 1)
 */
function calculateEMA(closes: number[], period: number): number {
  if (closes.length < period) {
    // SMA inicial
    return closes.reduce((a, b) => a + b, 0) / closes.length;
  }

  let ema = closes.slice(0, period).reduce((a, b) => a + b, 0) / period;
  const multiplier = 2 / (period + 1);

  for (let i = period; i < closes.length; i++) {
    ema = (closes[i] - ema) * multiplier + ema;
  }

  return ema;
}

/**
 * Ejecuta validación de tendencia para cada vela horaria
 */
function validateTrends(hourlyCandles: HourlyCandle[]): ValidationResult[] {
  const results: ValidationResult[] = [];
  const closePrices: number[] = [];
  const ema20Values: number[] = [];
  const ema50Values: number[] = [];
  const ema200Values: number[] = [];

  for (let i = 0; i < hourlyCandles.length; i++) {
    const candle = hourlyCandles[i];
    closePrices.push(candle.close);

    // Calcular EMAs
    const ema20 = calculateEMA(closePrices, 20);
    const ema50 = calculateEMA(closePrices, 50);
    const ema200 = calculateEMA(closePrices, 200);

    ema20Values.push(ema20);
    ema50Values.push(ema50);
    ema200Values.push(ema200);

    // Validar tendencia solo si tenemos suficientes datos
    if (i >= 200) {
      // Preparar histórico para slopes
      const ema20History = ema20Values.slice(Math.max(0, i - 19), i + 1);
      const ema50History = ema50Values.slice(Math.max(0, i - 19), i + 1);
      const ema200History = ema200Values.slice(Math.max(0, i - 19), i + 1);

      // Preparar histórico de candles
      const candleHistory = hourlyCandles.slice(Math.max(0, i - 5), i + 1).map((c, idx) => ({
        index: idx,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }));

      const validation = TrendValidator.validateTrend({
        timeframe: '1H',
        asset: 'XAUUSD',
        currentPrice: candle.close,
        ema20,
        ema50,
        ema200,
        ema20History,
        ema50History,
        ema200History,
        candleHistory,
      });

      results.push({
        timestamp: candle.timestamp,
        date: candle.date,
        hour: candle.hour,
        direction: validation.direction as 'BUY' | 'SELL' | 'NEUTRAL',
        confidenceLevel: validation.confidenceLevel,
        bullishScore: validation.bullishScore ?? 0,
        bearishScore: validation.bearishScore ?? 0,
        price: candle.close,
        ema20,
        ema50,
        ema200,
        reason: `BUY/SELL análisis completado`,
      });
    }
  }

  return results;
}

/**
 * Genera estadísticas
 */
function generateStatistics(results: ValidationResult[]): Statistics {
  const stats: Statistics = {
    totalCandles: results.length,
    buyCount: 0,
    sellCount: 0,
    neutralCount: 0,
    confidenceA_Plus: 0,
    confidenceA: 0,
    confidenceB: 0,
    confidenceC: 0,
    buyExamples: [],
    sellExamples: [],
    neutralExamples: [],
  };

  for (const result of results) {
    if (result.direction === 'BUY') {
      stats.buyCount++;
      if (stats.buyExamples.length < 3) {
        stats.buyExamples.push(result);
      }
    } else if (result.direction === 'SELL') {
      stats.sellCount++;
      if (stats.sellExamples.length < 3) {
        stats.sellExamples.push(result);
      }
    } else {
      stats.neutralCount++;
      if (stats.neutralExamples.length < 3) {
        stats.neutralExamples.push(result);
      }
    }

    if (result.confidenceLevel === 'A+') stats.confidenceA_Plus++;
    else if (result.confidenceLevel === 'A') stats.confidenceA++;
    else if (result.confidenceLevel === 'B') stats.confidenceB++;
    else if (result.confidenceLevel === 'C') stats.confidenceC++;
  }

  return stats;
}

/**
 * Main test
 */
export async function runTest(): Promise<void> {
  try {
    console.log('🔍 Loading XAUUSD data (June 2026)...');
    const csvPath = path.join(process.cwd(), 'data/market-history/DAT_ASCII_XAUUSD_M1_202606.csv');

    if (!fs.existsSync(csvPath)) {
      console.error(`❌ Data file not found: ${csvPath}`);
      return;
    }

    const minuteCandles = loadMonthData(csvPath);
    console.log(`✓ Loaded ${minuteCandles.length} minute candles`);

    const hourlyCandles = groupIntoHourly(minuteCandles);
    console.log(`✓ Grouped into ${hourlyCandles.length} hourly candles`);

    console.log('🔄 Running TrendValidator on each hourly candle...');
    const validationResults = validateTrends(hourlyCandles);
    console.log(`✓ Validated ${validationResults.length} candles`);

    const statistics = generateStatistics(validationResults);

    console.log('\n📊 STATISTICS:');
    console.log(`Total Analyzed: ${statistics.totalCandles}`);
    console.log(`BUY: ${statistics.buyCount} (${((statistics.buyCount / statistics.totalCandles) * 100).toFixed(1)}%)`);
    console.log(`SELL: ${statistics.sellCount} (${((statistics.sellCount / statistics.totalCandles) * 100).toFixed(1)}%)`);
    console.log(`NEUTRAL: ${statistics.neutralCount} (${((statistics.neutralCount / statistics.totalCandles) * 100).toFixed(1)}%)`);

    console.log('\n📈 Confidence Levels:');
    console.log(`A+: ${statistics.confidenceA_Plus}`);
    console.log(`A: ${statistics.confidenceA}`);
    console.log(`B: ${statistics.confidenceB}`);
    console.log(`C: ${statistics.confidenceC}`);

    console.log('\n💡 BUY EXAMPLES:');
    statistics.buyExamples.forEach((ex, i) => {
      console.log(`  ${i + 1}. ${ex.date} ${String(ex.hour).padStart(2, '0')}:00`);
      console.log(`     Price: ${ex.price.toFixed(2)} | EMA20: ${ex.ema20.toFixed(2)} | Confidence: ${ex.confidenceLevel}`);
      console.log(`     Bullish: ${ex.bullishScore} | Bearish: ${ex.bearishScore}`);
    });

    console.log('\n💡 SELL EXAMPLES:');
    statistics.sellExamples.forEach((ex, i) => {
      console.log(`  ${i + 1}. ${ex.date} ${String(ex.hour).padStart(2, '0')}:00`);
      console.log(`     Price: ${ex.price.toFixed(2)} | EMA20: ${ex.ema20.toFixed(2)} | Confidence: ${ex.confidenceLevel}`);
      console.log(`     Bullish: ${ex.bullishScore} | Bearish: ${ex.bearishScore}`);
    });

    console.log('\n💡 NEUTRAL EXAMPLES:');
    statistics.neutralExamples.forEach((ex, i) => {
      console.log(`  ${i + 1}. ${ex.date} ${String(ex.hour).padStart(2, '0')}:00`);
      console.log(`     Price: ${ex.price.toFixed(2)} | EMA20: ${ex.ema20.toFixed(2)} | Confidence: ${ex.confidenceLevel}`);
      console.log(`     Bullish: ${ex.bullishScore} | Bearish: ${ex.bearishScore}`);
    });

    // Guardar resultados en JSON
    const reportPath = path.join(process.cwd(), 'app/engine/strategy/TREND_V1_1_TEST_RESULTS.json');
    fs.writeFileSync(
      reportPath,
      JSON.stringify(
        {
          timestamp: new Date().toISOString(),
          statistics,
          examples: {
            buy: statistics.buyExamples.slice(0, 5),
            sell: statistics.sellExamples.slice(0, 5),
            neutral: statistics.neutralExamples.slice(0, 5),
          },
        },
        null,
        2
      )
    );

    console.log(`\n✅ Report saved to: ${reportPath}`);
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  runTest();
}

export default { runTest };
