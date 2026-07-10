import assert from 'node:assert/strict';
import test from 'node:test';

import { PullbackValidator } from './pullbackValidator';

test('pullback validator returns DATA_NOT_READY on desync/incomplete data', () => {
  const result = PullbackValidator.validatePullback({
    trendDirection1H: 'BUY',
    trendConfidence1H: 'A',
    trendCandle1H: { timestamp: 1000, open: 1, high: 2, low: 0.9, close: 1.5, complete: false },
    trendEMA1H: { ema20: 1.4, ema50: 1.3, ema200: 1.1 },
    candles45M: [],
    ema45M: { ema20: 1.4, ema50: 1.3, ema200: 1.2 },
    candle5M: { timestamp: 1400, open: 1.45, high: 1.5, low: 1.43, close: 1.48, complete: true },
    expectedLast45MCloseTimestamp: 1300,
    timezone: 'UTC',
    atr45M: 0,
    movementStrength: 80,
    rejectionCandleDetected: false,
    continuationDetected: false,
    validBreakout: false,
    falseBreakout: true,
    exhaustionDetected: false,
  });

  assert.equal(result.status, 'DATA_NOT_READY');
  assert.equal(result.valid, false);
  assert.equal(result.invalidationReason, 'DATA_NOT_READY');
});

test('pullback validator returns structured valid result in aligned scenario', () => {
  const result = PullbackValidator.validatePullback({
    trendDirection1H: 'BUY',
    trendConfidence1H: 'A+',
    trendCandle1H: { timestamp: 1000, open: 1.3, high: 1.6, low: 1.2, close: 1.5, complete: true },
    trendEMA1H: { ema20: 1.45, ema50: 1.4, ema200: 1.3 },
    candles45M: [
      { timestamp: 1000, open: 1.35, high: 1.5, low: 1.32, close: 1.46, complete: true },
      { timestamp: 1100, open: 1.46, high: 1.48, low: 1.4, close: 1.43, complete: true },
      { timestamp: 1200, open: 1.43, high: 1.47, low: 1.41, close: 1.42, complete: true },
    ],
    ema45M: { ema20: 1.45, ema50: 1.4, ema200: 1.35 },
    candle5M: { timestamp: 1200, open: 1.42, high: 1.44, low: 1.41, close: 1.43, complete: true },
    expectedLast45MCloseTimestamp: 1200,
    timezone: 'UTC',
    atr45M: 0.05,
    movementStrength: 78,
    rejectionCandleDetected: true,
    continuationDetected: true,
    validBreakout: true,
    falseBreakout: false,
    exhaustionDetected: false,
  });

  assert.equal(result.status, 'OK');
  assert.equal(result.direction, 'BUY');
  assert.equal(typeof result.score, 'number');
  assert.equal(typeof result.confidence, 'number');
  assert.ok(result.conditionsPassed.length >= 4);
});
