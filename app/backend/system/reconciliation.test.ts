import assert from 'node:assert/strict';
import fs from 'fs/promises';
import path from 'path';
import test from 'node:test';

import {
  configureSandboxConnector,
  enqueueExecutionOrder,
  processExecutionQueue,
  reconcileExecutionState,
  snapshotExecutionDashboard,
} from './execution-runtime';

const EXECUTION_PATH = path.join(process.cwd(), 'data', 'execution-runtime-state.json');

test('reconciliation reports OK in consistent lifecycle', async () => {
  await fs.rm(EXECUTION_PATH, { force: true });

  await configureSandboxConnector({
    provider: 'SIMULATED_BROKER',
    server: 'sim.local',
    login: 'reco',
    password: 'secret',
  });

  await enqueueExecutionOrder({
    userId: 'u-reco',
    symbol: 'EURUSD',
    type: 'BUY',
    lots: 0.1,
    idempotencyKey: 'reco-1',
  });

  await processExecutionQueue();
  const state = await reconcileExecutionState();

  assert.equal(state.reconciliation.status, 'OK');

  const dashboard = await snapshotExecutionDashboard();
  assert.equal(dashboard.reconciliation.status, 'OK');
});
