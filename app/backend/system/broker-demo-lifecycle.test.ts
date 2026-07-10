import assert from 'node:assert/strict';
import fs from 'fs/promises';
import path from 'path';
import test from 'node:test';

import {
  configureSandboxConnector,
  enqueueExecutionOrder,
  processExecutionQueue,
  snapshotExecutionDashboard,
} from './execution-runtime';

const EXECUTION_PATH = path.join(process.cwd(), 'data', 'execution-runtime-state.json');

test('broker demo marks external dependency block when connector is absent', async () => {
  await fs.rm(EXECUTION_PATH, { force: true });

  await enqueueExecutionOrder({
    userId: 'u-block',
    symbol: 'EURUSD',
    type: 'BUY',
    lots: 0.1,
  });

  await processExecutionQueue();
  const dashboard = await snapshotExecutionDashboard();
  const order = dashboard.orderHistory[0];

  assert.equal(order.status, 'blocked_external');
  assert.equal(order.notes, 'BLOCKED_BY_EXTERNAL_DEPENDENCY');
});

test('broker demo order lifecycle includes validation and execution traces', async () => {
  await fs.rm(EXECUTION_PATH, { force: true });

  await configureSandboxConnector({
    provider: 'SIMULATED_BROKER',
    server: 'sim.local',
    login: 'demo',
    password: 'password=should-hide',
  });

  await enqueueExecutionOrder({
    userId: 'u-life',
    symbol: 'GBPUSD',
    type: 'SELL',
    lots: 0.1,
    idempotencyKey: 'k-1',
  });

  await processExecutionQueue();
  const dashboard = await snapshotExecutionDashboard();

  assert.ok(dashboard.audit.some((e) => e.action === 'validated'));
  assert.ok(dashboard.audit.some((e) => e.action === 'executed'));
  assert.ok(dashboard.audit.every((e) => !String(e.details ?? '').includes('should-hide')));
});

test('broker demo applies idempotency key on order submission', async () => {
  await fs.rm(EXECUTION_PATH, { force: true });

  await configureSandboxConnector({
    provider: 'SIMULATED_BROKER',
    server: 'sim.local',
    login: 'idem',
    password: 'secret',
  });

  const first = await enqueueExecutionOrder({
    userId: 'u-idem',
    symbol: 'EURUSD',
    type: 'BUY',
    lots: 0.1,
    idempotencyKey: 'idem-1',
  });

  const second = await enqueueExecutionOrder({
    userId: 'u-idem',
    symbol: 'EURUSD',
    type: 'BUY',
    lots: 0.1,
    idempotencyKey: 'idem-1',
  });

  assert.equal(second.id, first.id);
});
