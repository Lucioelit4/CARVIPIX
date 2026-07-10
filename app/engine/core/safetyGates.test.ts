import assert from 'node:assert/strict';
import test from 'node:test';

import { checkVolatilityGate, toAuditableSafetyGateResult } from './safetyGates';

test('safety auditable metadata includes required fields', () => {
  const gate = checkVolatilityGate({
    symbol: 'EURUSD',
    atr: 1.2,
    atrPercentile: 95,
    isNewsEventSoon: false,
  });

  const audit = toAuditableSafetyGateResult(gate, 'atrPercentile=95', '<=90');
  assert.equal(audit.name, 'VOLATILITY');
  assert.equal(typeof audit.reason, 'string');
  assert.equal(typeof audit.blocking, 'boolean');
  assert.equal(audit.observedValue, 'atrPercentile=95');
  assert.equal(audit.limit, '<=90');
});
