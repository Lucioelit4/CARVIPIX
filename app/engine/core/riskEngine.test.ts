import assert from 'node:assert/strict';
import test from 'node:test';

import { evaluateRisk } from './riskEngine';

test('risk engine blocks NaN and Infinity values', () => {
  const result = evaluateRisk({
    entryPrice: Number.NaN,
    stopLossPrice: Number.POSITIVE_INFINITY,
    takeProfitPrice: 2100,
    accountBalance: 10000,
    riskPercent: 1,
    pipValuePerLot: 1,
  });

  assert.equal(result.valid, false);
  assert.equal(result.audit.status, 'BLOCKED');
  assert.ok(result.issues.some((x) => x.code === 'NAN'));
  assert.ok(result.issues.some((x) => x.code === 'INFINITY'));
});

test('risk engine computes auditable metrics on valid input', () => {
  const result = evaluateRisk({
    entryPrice: 2000,
    stopLossPrice: 1990,
    takeProfitPrice: 2020,
    accountBalance: 10000,
    riskPercent: 1,
    pipValuePerLot: 1,
  });

  assert.equal(result.valid, true);
  assert.equal(result.audit.status, 'OK');
  assert.equal(result.riskAmount, 100);
  assert.ok(result.positionSizeLots > 0);
});
