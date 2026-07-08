import test from 'node:test';
import assert from 'node:assert/strict';

import { DataValidator } from './dataValidator';
import type { MarketData } from '../types';

function buildMarketData(): MarketData {
  const now = Date.now();
  return {
    asset: 'EURUSD',
    timeframe: '1H',
    candle: {
      timestamp: now,
      open: 1.1,
      high: 1.12,
      low: 1.09,
      close: 1.11,
      volume: 120000,
      asset: 'EURUSD',
      timeframe: '1H',
      complete: true,
    },
    tick: {
      timestamp: now,
      bid: 1.1099,
      ask: 1.1101,
      asset: 'EURUSD',
      spread: 0.0002,
      volume: 1000,
      lastUpdate: now,
    },
    indicators: {
      ema20: 1.105,
      ema50: 1.102,
      ema200: 1.097,
      atr: 0.003,
      rsi: 56,
      spread: 0.0002,
      volatility: 1.2,
      timestamp: now,
    },
    lastUpdate: now,
    quality: {
      isHealthy: true,
      latency: 20,
      completeness: 99,
      freshness: 100,
      errors: [],
      lastHealthCheck: now,
    },
  };
}

test('rejects corrupted market data with non-finite values', () => {
  const validator = new DataValidator();
  const corrupted = buildMarketData();
  corrupted.candle.open = Number.NaN;
  corrupted.tick.ask = Number.POSITIVE_INFINITY;
  corrupted.indicators.rsi = Number.NaN;

  const result = validator.validateMarketData(corrupted);

  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => error.message.includes('no finitos')));
});