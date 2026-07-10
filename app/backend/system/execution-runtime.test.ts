import assert from "node:assert/strict";
import fs from "fs/promises";
import path from "path";
import test from "node:test";

import {
  cancelExecutionOrder,
  closeExecutionPosition,
  configureSandboxConnector,
  enqueueExecutionOrder,
  processExecutionQueue,
  snapshotExecutionDashboard,
} from "./execution-runtime";

const STORE_PATH = path.join(process.cwd(), "data", "execution-runtime-state.json");

test("execution runtime queues and processes orders in safe mode", async () => {
  await fs.rm(STORE_PATH, { force: true });

  await configureSandboxConnector({
    provider: "SIMULATED_BROKER",
    server: "simulator.carvipix.local",
    login: "test_runtime",
    password: "test_secret",
  });

  const queued = await enqueueExecutionOrder({
    userId: "u-test",
    symbol: "EURUSD",
    type: "BUY",
    lots: 0.2,
  });

  assert.equal(queued.status, "queued");

  await processExecutionQueue();
  const dashboard = await snapshotExecutionDashboard();

  assert.equal(dashboard.safeMode, true);
  assert.ok(dashboard.orderHistory.length >= 1);
  assert.equal(dashboard.orderHistory[0]?.status, "executed");
  assert.ok(dashboard.openPositions.length >= 1);

  const positionId = dashboard.openPositions[0]?.id;
  assert.ok(positionId);

  const closed = await closeExecutionPosition(positionId!, 1);
  assert.equal(closed, true);

  const afterClose = await snapshotExecutionDashboard();
  assert.ok(afterClose.closedPositions.length >= 1);
});

test("execution runtime supports queued cancellation", async () => {
  await fs.rm(STORE_PATH, { force: true });

  const queued = await enqueueExecutionOrder({
    userId: "u-test-2",
    symbol: "GBPUSD",
    type: "SELL",
    lots: 0.1,
  });

  const cancelled = await cancelExecutionOrder(queued.id);
  assert.equal(cancelled, true);

  const dashboard = await snapshotExecutionDashboard();
  assert.equal(dashboard.orderQueue.length, 0);
  assert.ok(dashboard.orderHistory.some((order) => order.id === queued.id && order.status === "cancelled"));
});

test("execution runtime blocks orders rejected by integrated risk engine", async () => {
  await fs.rm(STORE_PATH, { force: true });

  await configureSandboxConnector({
    provider: "SIMULATED_BROKER",
    server: "simulator.carvipix.local",
    login: "risk_test_runtime",
    password: "test_secret",
  });

  const queued = await enqueueExecutionOrder({
    userId: "u-risk",
    symbol: "EURUSD",
    type: "BUY",
    lots: 0.2,
    requestedPrice: 1.1,
    stopLoss: 1.1,
    takeProfit: 1.1,
  });

  await processExecutionQueue();
  const dashboard = await snapshotExecutionDashboard();
  const rejected = dashboard.orderHistory.find((order) => order.id === queued.id);

  assert.ok(rejected);
  assert.equal(rejected?.status, "rejected");
  assert.ok((rejected?.notes ?? "").includes("Risk engine rejected order"));
});
