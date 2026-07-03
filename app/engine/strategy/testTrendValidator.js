/**
 * TEST SCRIPT: TrendValidator v1.1 con 1 mes de datos XAUUSD
 * Ejecutar: node app/engine/strategy/testTrendValidator.js
 * 
 * Genera estadísticas y ejemplos de BUY/SELL/NEUTRAL
 */

const fs = require('fs');
const path = require('path');

/**
 * Parsea línea del CSV XAUUSD M1
 */
function parseMinuteCandle(line) {
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
 * Carga datos de 1 mes desde CSV
 */
function loadMonthData(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter((line) => line.trim());

  const candles = [];
  for (const line of lines) {
    const candle = parseMinuteCandle(line);
    if (candle) {
      candles.push(candle);
    }
  }

  return candles;
}

/**
 * Agrupa en velas de 1 hora
 */
function groupIntoHourly(minuteCandles) {
  const hourlyMap = new Map();

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

    const hourly = hourlyMap.get(hourTimestamp);
    hourly.high = Math.max(hourly.high, candle.high);
    hourly.low = Math.min(hourly.low, candle.low);
    hourly.close = candle.close;
    hourly.volume++;
    hourly.minuteCandles.push(candle);
  }

  return Array.from(hourlyMap.values()).sort((a, b) => a.timestamp - b.timestamp);
}

/**
 * Calcula EMA
 */
function calculateEMA(closes, period) {
  if (closes.length < period) {
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
 * Simula TrendValidator directamente en JavaScript (sin importar)
 */
function validateTrend(params) {
  const {
    currentPrice,
    ema20,
    ema50,
    ema200,
    ema20History = [],
    ema50History = [],
    ema200History = [],
    candleHistory = [],
  } = params;

  let bullishScore = 0;
  let bearishScore = 0;

  // Condición 1: Precio vs EMA200
  if (currentPrice > ema200) {
    bullishScore += 25;
  } else if (currentPrice < ema200) {
    bearishScore += 25;
  }

  // Condición 2: EMA Order
  if (ema20 > ema50 && ema50 > ema200) {
    bullishScore += 25;
  } else if (ema20 < ema50 && ema50 < ema200) {
    bearishScore += 25;
  }

  // Condición 3: Slope
  let ema20Slope = 0,
    ema50Slope = 0;
  if (ema20History.length >= 2) {
    ema20Slope = ema20History[ema20History.length - 1] - ema20History[Math.max(0, ema20History.length - 6)];
  }
  if (ema50History.length >= 2) {
    ema50Slope = ema50History[ema50History.length - 1] - ema50History[Math.max(0, ema50History.length - 6)];
  }

  if (ema20Slope > 0 && ema50Slope > 0) {
    bullishScore += 25;
  } else if (ema20Slope < 0 && ema50Slope < 0) {
    bearishScore += 25;
  }

  // Condición 4: Estructura (simple swings)
  if (candleHistory.length >= 2) {
    const current = candleHistory[candleHistory.length - 1];
    const previous = candleHistory[candleHistory.length - 2];

    if (current.high > previous.high && current.low > previous.low) {
      bullishScore += 25;
    } else if (current.high < previous.high && current.low < previous.low) {
      bearishScore += 25;
    }
  }

  // Dirección
  let direction = 'NEUTRAL';
  if (bullishScore > bearishScore) {
    direction = 'BUY';
  } else if (bearishScore > bullishScore) {
    direction = 'SELL';
  }

  // Confianza: cuenta condiciones confirmando vs contradiciendo
  let confirmingConditions;
  let contradictingConditions;

  if (direction === 'BUY') {
    confirmingConditions = bullishScore / 25;
    contradictingConditions = bearishScore / 25;
  } else if (direction === 'SELL') {
    confirmingConditions = bearishScore / 25;
    contradictingConditions = bullishScore / 25;
  } else {
    confirmingConditions = 0;
    contradictingConditions = 0;
  }

  // Calcular confianza efectiva: confirming - (contradicting * 0.5)
  const effectiveConditions = confirmingConditions - contradictingConditions * 0.5;

  // Asignar nivel basado en confianza efectiva
  if (direction === 'NEUTRAL') {
    confidenceLevel = 'C';
  } else if (effectiveConditions >= 4) {
    confidenceLevel = 'A+';
  } else if (effectiveConditions >= 3) {
    confidenceLevel = 'A';
  } else if (effectiveConditions >= 2) {
    confidenceLevel = 'B';
  } else if (effectiveConditions >= 1) {
    confidenceLevel = 'C';
  } else {
    confidenceLevel = 'C';
  }

  return {
    direction,
    confidenceLevel,
    bullishScore,
    bearishScore,
  };
}

/**
 * Ejecuta validaciones
 */
function validateTrends(hourlyCandles) {
  const results = [];
  const closePrices = [];
  const ema20Values = [];
  const ema50Values = [];
  const ema200Values = [];

  for (let i = 0; i < hourlyCandles.length; i++) {
    const candle = hourlyCandles[i];
    closePrices.push(candle.close);

    const ema20 = calculateEMA(closePrices, 20);
    const ema50 = calculateEMA(closePrices, 50);
    const ema200 = calculateEMA(closePrices, 200);

    ema20Values.push(ema20);
    ema50Values.push(ema50);
    ema200Values.push(ema200);

    // Validar solo con datos suficientes
    if (i >= 200) {
      const ema20History = ema20Values.slice(Math.max(0, i - 19), i + 1);
      const ema50History = ema50Values.slice(Math.max(0, i - 19), i + 1);
      const ema200History = ema200Values.slice(Math.max(0, i - 19), i + 1);

      const candleHistory = hourlyCandles.slice(Math.max(0, i - 5), i + 1).map((c, idx) => ({
        index: idx,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }));

      const validation = validateTrend({
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
        direction: validation.direction,
        confidenceLevel: validation.confidenceLevel,
        bullishScore: validation.bullishScore,
        bearishScore: validation.bearishScore,
        price: candle.close,
        ema20,
        ema50,
        ema200,
      });
    }
  }

  return results;
}

/**
 * Genera estadísticas
 */
function generateStatistics(results) {
  const stats = {
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
 * Main
 */
function main() {
  console.log('\n🔍 Testing TrendValidator v1.1 with 1 month XAUUSD data...\n');

  try {
    const csvPath = path.join(process.cwd(), 'data/market-history/DAT_ASCII_XAUUSD_M1_202606.csv');

    if (!fs.existsSync(csvPath)) {
      console.error(`❌ Data file not found: ${csvPath}`);
      return;
    }

    console.log('📥 Loading minute candles...');
    const minuteCandles = loadMonthData(csvPath);
    console.log(`✓ Loaded ${minuteCandles.length} minute candles\n`);

    console.log('⏱️  Grouping into hourly candles...');
    const hourlyCandles = groupIntoHourly(minuteCandles);
    console.log(`✓ Created ${hourlyCandles.length} hourly candles\n`);

    console.log('🔄 Running TrendValidator on each hourly candle...');
    const validationResults = validateTrends(hourlyCandles);
    console.log(`✓ Validated ${validationResults.length} candles\n`);

    const statistics = generateStatistics(validationResults);

    // Mostrar resultados
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📊 TRENDVALIDATOR v1.1 TEST RESULTS');
    console.log('═══════════════════════════════════════════════════════════\n');

    console.log('📈 DIRECTION SUMMARY:');
    console.log(`  Total Analyzed: ${statistics.totalCandles} hourly candles`);
    console.log(`  🟢 BUY:     ${statistics.buyCount.toString().padStart(4)} (${((statistics.buyCount / statistics.totalCandles) * 100).toFixed(1)}%)`);
    console.log(`  🔴 SELL:    ${statistics.sellCount.toString().padStart(4)} (${((statistics.sellCount / statistics.totalCandles) * 100).toFixed(1)}%)`);
    console.log(`  ⚪ NEUTRAL: ${statistics.neutralCount.toString().padStart(4)} (${((statistics.neutralCount / statistics.totalCandles) * 100).toFixed(1)}%)\n`);

    console.log('🎯 CONFIDENCE LEVELS:');
    console.log(`  A+ (4/4): ${statistics.confidenceA_Plus}`);
    console.log(`  A  (3/4): ${statistics.confidenceA}`);
    console.log(`  B  (2/4): ${statistics.confidenceB}`);
    console.log(`  C  (1-2): ${statistics.confidenceC}\n`);

    console.log('═══════════════════════════════════════════════════════════');
    console.log('💡 BUY EXAMPLES (3 Most Recent)');
    console.log('═══════════════════════════════════════════════════════════\n');
    statistics.buyExamples.forEach((ex, i) => {
      console.log(`${i + 1}. ${ex.date} ${String(ex.hour).padStart(2, '0')}:00`);
      console.log(`   Price: ${ex.price.toFixed(2)}`);
      console.log(`   EMA20: ${ex.ema20.toFixed(2)} | EMA50: ${ex.ema50.toFixed(2)} | EMA200: ${ex.ema200.toFixed(2)}`);
      console.log(`   Confidence: ${ex.confidenceLevel} | Bullish Score: ${ex.bullishScore} | Bearish Score: ${ex.bearishScore}`);
      console.log('');
    });

    console.log('═══════════════════════════════════════════════════════════');
    console.log('💡 SELL EXAMPLES (3 Most Recent)');
    console.log('═══════════════════════════════════════════════════════════\n');
    statistics.sellExamples.forEach((ex, i) => {
      console.log(`${i + 1}. ${ex.date} ${String(ex.hour).padStart(2, '0')}:00`);
      console.log(`   Price: ${ex.price.toFixed(2)}`);
      console.log(`   EMA20: ${ex.ema20.toFixed(2)} | EMA50: ${ex.ema50.toFixed(2)} | EMA200: ${ex.ema200.toFixed(2)}`);
      console.log(`   Confidence: ${ex.confidenceLevel} | Bullish Score: ${ex.bullishScore} | Bearish Score: ${ex.bearishScore}`);
      console.log('');
    });

    console.log('═══════════════════════════════════════════════════════════');
    console.log('💡 NEUTRAL EXAMPLES (3 Most Recent)');
    console.log('═══════════════════════════════════════════════════════════\n');
    statistics.neutralExamples.forEach((ex, i) => {
      console.log(`${i + 1}. ${ex.date} ${String(ex.hour).padStart(2, '0')}:00`);
      console.log(`   Price: ${ex.price.toFixed(2)}`);
      console.log(`   EMA20: ${ex.ema20.toFixed(2)} | EMA50: ${ex.ema50.toFixed(2)} | EMA200: ${ex.ema200.toFixed(2)}`);
      console.log(`   Confidence: ${ex.confidenceLevel} | Bullish Score: ${ex.bullishScore} | Bearish Score: ${ex.bearishScore}`);
      console.log('');
    });

    console.log('═══════════════════════════════════════════════════════════\n');

    // Guardar resultados JSON
    const reportDir = path.join(process.cwd(), 'app/engine/strategy');
    const reportPath = path.join(reportDir, 'TREND_V1_1_TEST_RESULTS.json');

    fs.writeFileSync(
      reportPath,
      JSON.stringify(
        {
          timestamp: new Date().toISOString(),
          dataSource: 'XAUUSD M1 June 2026',
          period: '1 month',
          statistics,
          note: 'Structure v1.1 uses simple swing comparison: HH+HL (BUY), LH+LL (SELL). NOT institutional BOS/CHoCH yet.',
        },
        null,
        2
      )
    );

    console.log(`✅ Detailed results saved to:`);
    console.log(`   ${reportPath}\n`);
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Ejecutar
main();
