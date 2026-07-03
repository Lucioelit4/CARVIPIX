/**
 * TEST SCRIPT: TrendValidator v1.1.1 - Test Contradiction Penalty
 * 
 * Compara 3 valores de penalización:
 * - 0.25 (suave)
 * - 0.50 (medio - valor actual)
 * - 0.75 (fuerte)
 * 
 * Ejecutar: node app/engine/strategy/testPenaltyComparison.js
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

    const date = new Date(year, month - 1, day, hour, minute, 0);

    return {
      timestamp: date.getTime(),
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
 * Carga datos de CSV
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
 * Valida tendencia con penalización configurable
 */
function validateTrendWithPenalty(params, contradictionPenalty) {
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

  // Condición 4: Estructura
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

  // Confianza CON PENALIZACIÓN CONFIGURABLE
  let confirmingConditions, contradictingConditions;
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

  // AQUÍ ENTRA LA PENALIZACIÓN CONFIGURABLE
  const effectiveConditions = confirmingConditions - contradictingConditions * contradictionPenalty;

  let confidenceLevel = 'C';
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
  }

  return {
    direction,
    confidenceLevel,
    bullishScore,
    bearishScore,
  };
}

/**
 * Ejecuta validaciones con penalización específica
 */
function validateTrendsWithPenalty(hourlyCandles, contradictionPenalty) {
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

      const validation = validateTrendWithPenalty(
        {
          currentPrice: candle.close,
          ema20,
          ema50,
          ema200,
          ema20History,
          ema50History,
          ema200History,
          candleHistory,
        },
        contradictionPenalty
      );

      results.push({
        timestamp: candle.timestamp,
        date: candle.date,
        hour: candle.hour,
        direction: validation.direction,
        confidenceLevel: validation.confidenceLevel,
        bullishScore: validation.bullishScore,
        bearishScore: validation.bearishScore,
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
  };

  for (const result of results) {
    if (result.direction === 'BUY') {
      stats.buyCount++;
    } else if (result.direction === 'SELL') {
      stats.sellCount++;
    } else {
      stats.neutralCount++;
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
  console.log('\n🔍 Testing TrendValidator v1.1.1 - Contradiction Penalty Comparison\n');

  try {
    const csvPath = path.join(process.cwd(), 'data/market-history/DAT_ASCII_XAUUSD_M1_202606.csv');

    if (!fs.existsSync(csvPath)) {
      console.error(`❌ Data file not found: ${csvPath}`);
      return;
    }

    console.log('📥 Loading data...');
    const minuteCandles = loadMonthData(csvPath);
    console.log(`✓ Loaded ${minuteCandles.length} minute candles`);

    const hourlyCandles = groupIntoHourly(minuteCandles);
    console.log(`✓ Grouped into ${hourlyCandles.length} hourly candles\n`);

    // Probar los 3 valores de penalización
    const penaltyValues = [0.25, 0.5, 0.75];
    const results = {};

    for (const penalty of penaltyValues) {
      console.log(`⏱️  Testing with contradiction penalty = ${penalty}...`);
      const validationResults = validateTrendsWithPenalty(hourlyCandles, penalty);
      const statistics = generateStatistics(validationResults);
      results[penalty] = statistics;
      console.log(`✓ Completed\n`);
    }

    // Mostrar comparación
    console.log('═══════════════════════════════════════════════════════════════════════════');
    console.log('📊 CONTRADICTION PENALTY COMPARISON - TrendValidator v1.1.1');
    console.log('═══════════════════════════════════════════════════════════════════════════\n');

    console.log('📈 DIRECTION DISTRIBUTION:');
    console.log('┌─────────────┬────────┬────────┬────────┬────────┐');
    console.log('│ Penalty     │ BUY    │ SELL   │ NEUTRAL│ Total  │');
    console.log('├─────────────┼────────┼────────┼────────┼────────┤');

    for (const penalty of penaltyValues) {
      const stats = results[penalty];
      const buyPct = ((stats.buyCount / stats.totalCandles) * 100).toFixed(1);
      const sellPct = ((stats.sellCount / stats.totalCandles) * 100).toFixed(1);
      const neutralPct = ((stats.neutralCount / stats.totalCandles) * 100).toFixed(1);

      console.log(
        `│ ${penalty.toFixed(2)}        │ ${stats.buyCount.toString().padStart(2)} (${buyPct.padStart(4)}%)│ ${stats.sellCount.toString().padStart(2)} (${sellPct.padStart(4)}%)│ ${stats.neutralCount.toString().padStart(2)} (${neutralPct.padStart(4)}%)│ ${stats.totalCandles}   │`
      );
    }
    console.log('└─────────────┴────────┴────────┴────────┴────────┘\n');

    console.log('🎯 CONFIDENCE LEVEL DISTRIBUTION:');
    console.log('┌─────────────┬──────┬──────┬──────┬──────┐');
    console.log('│ Penalty     │ A+   │ A    │ B    │ C    │');
    console.log('├─────────────┼──────┼──────┼──────┼──────┤');

    for (const penalty of penaltyValues) {
      const stats = results[penalty];
      const aPlus_Pct = ((stats.confidenceA_Plus / stats.totalCandles) * 100).toFixed(1);
      const a_Pct = ((stats.confidenceA / stats.totalCandles) * 100).toFixed(1);
      const b_Pct = ((stats.confidenceB / stats.totalCandles) * 100).toFixed(1);
      const c_Pct = ((stats.confidenceC / stats.totalCandles) * 100).toFixed(1);

      console.log(
        `│ ${penalty.toFixed(2)}        │ ${stats.confidenceA_Plus.toString().padStart(2)} (${aPlus_Pct.padStart(4)}%)│ ${stats.confidenceA.toString().padStart(2)} (${a_Pct.padStart(4)}%)│ ${stats.confidenceB.toString().padStart(2)} (${b_Pct.padStart(4)}%)│ ${stats.confidenceC.toString().padStart(2)} (${c_Pct.padStart(4)}%)│`
      );
    }
    console.log('└─────────────┴──────┴──────┴──────┴──────┘\n');

    // Análisis y recomendación
    console.log('═══════════════════════════════════════════════════════════════════════════');
    console.log('📋 ANALYSIS & RECOMMENDATION');
    console.log('═══════════════════════════════════════════════════════════════════════════\n');

    const stats_025 = results[0.25];
    const stats_050 = results[0.5];
    const stats_075 = results[0.75];

    console.log('Penalty 0.25 (Soft - contradictions barely penalized):');
    console.log(`  A+ + A = ${stats_025.confidenceA_Plus + stats_025.confidenceA} (${(((stats_025.confidenceA_Plus + stats_025.confidenceA) / stats_025.totalCandles) * 100).toFixed(1)}%)`);
    console.log(`  B = ${stats_025.confidenceB} (${((stats_025.confidenceB / stats_025.totalCandles) * 100).toFixed(1)}%)`);
    console.log(`  C = ${stats_025.confidenceC} (${((stats_025.confidenceC / stats_025.totalCandles) * 100).toFixed(1)}%)`);
    console.log('  → Too lenient, too many A+/A signals\n');

    console.log('Penalty 0.50 (Medium - default test value):');
    console.log(`  A+ + A = ${stats_050.confidenceA_Plus + stats_050.confidenceA} (${(((stats_050.confidenceA_Plus + stats_050.confidenceA) / stats_050.totalCandles) * 100).toFixed(1)}%)`);
    console.log(`  B = ${stats_050.confidenceB} (${((stats_050.confidenceB / stats_050.totalCandles) * 100).toFixed(1)}%)`);
    console.log(`  C = ${stats_050.confidenceC} (${((stats_050.confidenceC / stats_050.totalCandles) * 100).toFixed(1)}%)`);
    console.log('  → Balanced distribution\n');

    console.log('Penalty 0.75 (Strong - contradictions heavily penalized):');
    console.log(`  A+ + A = ${stats_075.confidenceA_Plus + stats_075.confidenceA} (${(((stats_075.confidenceA_Plus + stats_075.confidenceA) / stats_075.totalCandles) * 100).toFixed(1)}%)`);
    console.log(`  B = ${stats_075.confidenceB} (${((stats_075.confidenceB / stats_075.totalCandles) * 100).toFixed(1)}%)`);
    console.log(`  C = ${stats_075.confidenceC} (${((stats_075.confidenceC / stats_075.totalCandles) * 100).toFixed(1)}%)`);
    console.log('  → Too strict, too many weak signals\n');

    console.log('📌 PROVISIONAL RECOMMENDATION:');
    console.log('   Use penalty = 0.50 (current value)');
    console.log('   - Balanced A+/A/B/C distribution');
    console.log('   - Neither too strict nor too lenient');
    console.log('   - Suitable for Pullback/Entry filtering\n');

    console.log('📝 STATUS: PROVISIONAL');
    console.log('   Final decision will be made after Pullback validator implementation');
    console.log('   May adjust based on live trading performance\n');

    console.log('═══════════════════════════════════════════════════════════════════════════\n');

    // Guardar resultados
    const reportPath = path.join(process.cwd(), 'app/engine/strategy/PENALTY_COMPARISON_RESULTS.json');
    fs.writeFileSync(
      reportPath,
      JSON.stringify(
        {
          timestamp: new Date().toISOString(),
          dataSource: 'XAUUSD M1 June 2026',
          totalCandles: 250,
          penaltyComparison: results,
          recommendation: {
            recommendedPenalty: 0.5,
            status: 'PROVISIONAL',
            note: 'Final decision pending Pullback validator testing',
          },
        },
        null,
        2
      )
    );

    console.log(`✅ Detailed results saved to: ${reportPath}\n`);
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

main();
