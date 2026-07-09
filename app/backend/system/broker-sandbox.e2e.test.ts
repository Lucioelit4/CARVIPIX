import assert from "node:assert/strict";
import fs from "fs/promises";
import path from "path";
import test from "node:test";

import {
  closeExecutionPosition,
  configureSandboxConnector,
  enqueueExecutionOrder,
  heartbeatExecution,
  processExecutionQueue,
  reconnectExecution,
  simulateMarketTick,
  snapshotExecutionDashboard,
  syncExecutionFromSandbox,
} from "./execution-runtime";

const EXECUTION_PATH = path.join(process.cwd(), "data", "execution-runtime-state.json");
const DRIVER_STATE_PATH = path.join(process.cwd(), "data", "sandbox-driver-state.json");
const VAULT_PATH = path.join(process.cwd(), "data", "sandbox-credential-vault.json");

test("sandbox connector e2e flow runs with SAFE_MODE and no real money", async () => {
  await fs.rm(EXECUTION_PATH, { force: true });
  await fs.rm(DRIVER_STATE_PATH, { force: true });
  await fs.rm(VAULT_PATH, { force: true });

  await configureSandboxConnector({
    provider: "MT5_SANDBOX",
    server: "demo.mt5.carvipix.local",
    login: "e2e_user",
    password: "e2e_secret",
  });

  await heartbeatExecution();

  const queued = await enqueueExecutionOrder({
    userId: "e2e-user",
    symbol: "EURUSD",
    type: "BUY",
    lots: 0.2,
  });

  assert.equal(queued.status, "queued");

  await processExecutionQueue();
  await syncExecutionFromSandbox();
  await simulateMarketTick();

  const dashboard = await snapshotExecutionDashboard();
  assert.equal(dashboard.safeMode, true);
  assert.equal(dashboard.brokerConnected, true);
  assert.ok(dashboard.brokerAccountId?.includes("MT5_SANDBOX"));
  assert.ok(dashboard.orderHistory.some((order) => order.id === queued.id && order.status === "executed"));
  assert.ok(dashboard.openPositions.length >= 1);
  assert.ok(dashboard.credentialVault.length >= 1);

  const targetPosition = dashboard.openPositions[0];
  const partialClosed = await closeExecutionPosition(targetPosition.id, 0.5);
  assert.equal(partialClosed, true);

  const reconnected = await reconnectExecution();
  assert.equal(reconnected.brokerConnected, true);

  const after = await snapshotExecutionDashboard();
  assert.ok(after.audit.some((event) => event.action === "sandbox-connected"));
  assert.ok(after.audit.some((event) => event.action === "order-simulated"));
  assert.ok(after.audit.some((event) => event.action === "market-tick"));
});
