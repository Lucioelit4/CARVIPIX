import assert from "node:assert/strict";
import test from "node:test";

import { backendDatabase } from "@/app/backend/core/database";
import { BotMT5Service } from "./bot-mt5-service";

test("createSignal preserves EXTENDED expiry and is deterministic on retry", async () => {
  const originalQuery = backendDatabase.query.bind(backendDatabase);
  const enabledDescriptor = Object.getOwnPropertyDescriptor(backendDatabase, "enabled");
  const insertedRows = new Map<string, unknown[]>();
  const insertAttempts: unknown[][] = [];

  Object.defineProperty(backendDatabase, "enabled", { configurable: true, get: () => true });
  (backendDatabase.query as unknown) = async (sql: string, params: unknown[] = []) => {
    if (sql.includes("INSERT INTO bot_mt5_signals")) {
      insertAttempts.push(params);
      if (insertedRows.has(String(params[1]))) return { rows: [], rowCount: 0 };
      insertedRows.set(String(params[1]), params);
      return { rows: [{ license_id: params[4] }], rowCount: 1 };
    }
    if (sql.includes("SELECT license_id FROM bot_mt5_signals")) {
      const row = insertedRows.get(String(params[0]));
      return { rows: row ? [{ license_id: row[4] }] : [], rowCount: row ? 1 : 0 };
    }
    return { rows: [], rowCount: 0 };
  };

  try {
    const service = new BotMT5Service();
    const input = {
      signalId: "SIG-EXTENDED-1",
      analysisId: "ANA-EXTENDED-1",
      eventId: "EVT-EXTENDED-1",
      licenseId: "LIC-1",
      symbol: "xauusd",
      direction: "BUY" as const,
      horizon: "EXTENDED" as const,
      validityMinutes: 1200,
      expiresAt: "2026-08-10T08:00:00.000Z",
      source: "CADP_V3_HISTORICAL_BRAIN" as const,
      entry: 2400,
      stopLoss: 2390,
      takeProfit: 2420,
      riskReward: 2,
    };

    await service.createSignal(input);
    await service.createSignal(input);

    assert.equal(insertedRows.size, 1);
    assert.equal(insertAttempts.length, 2);
    assert.equal(insertAttempts[0][0], insertAttempts[1][0]);
    assert.equal(insertAttempts[0][11], insertAttempts[1][11]);
    assert.match(String(insertAttempts[0][0]), /^mt5-sig-[a-f0-9]{24}$/);
    assert.match(String(insertAttempts[0][11]), /^SHA256:[a-f0-9]{64}$/);
    assert.equal(insertAttempts[0][5], "XAUUSD");
    assert.equal(insertAttempts[0][13], "EXTENDED");
    assert.equal(insertAttempts[0][14], 1200);
    assert.equal(insertAttempts[0][15], "CADP_V3_HISTORICAL_BRAIN");
    assert.equal((insertAttempts[0][12] as Date).toISOString(), input.expiresAt);
  } finally {
    if (enabledDescriptor) Object.defineProperty(backendDatabase, "enabled", enabledDescriptor);
    (backendDatabase.query as unknown) = originalQuery;
  }
});

test("acknowledgeSignal persists rejected EA reason and installation", async () => {
  const originalQuery = backendDatabase.query.bind(backendDatabase);
  const enabledDescriptor = Object.getOwnPropertyDescriptor(backendDatabase, "enabled");
  const calls: Array<{ sql: string; params: unknown[] }> = [];

  Object.defineProperty(backendDatabase, "enabled", { configurable: true, get: () => true });
  (backendDatabase.query as unknown) = async (sql: string, params: unknown[] = []) => {
    calls.push({ sql, params });
    return { rows: [], rowCount: sql.includes("UPDATE bot_mt5_signals") ? 1 : 0 };
  };

  try {
    const service = new BotMT5Service();
    const status = await service.acknowledgeSignal({
      signalId: "SIG-ACK-1",
      licenseId: "LIC-1",
      installationId: "INST-1",
      status: "REJECTED_SIGNATURE",
    });

    assert.equal(status, "REJECTED");
    const update = calls.find(
      call => call.sql.includes("UPDATE bot_mt5_signals") && call.sql.includes("WHERE signal_id = $2"),
    );
    assert.ok(update);
    assert.deepEqual(update.params, ["REJECTED", "SIG-ACK-1", "LIC-1", "INST-1"]);
    assert.match(update.sql, /acknowledged_at = COALESCE\(acknowledged_at, NOW\(\)\)/);
  } finally {
    if (enabledDescriptor) Object.defineProperty(backendDatabase, "enabled", enabledDescriptor);
    (backendDatabase.query as unknown) = originalQuery;
  }
});

test("acknowledgeSignal fails closed when signal ownership does not match", async () => {
  const originalQuery = backendDatabase.query.bind(backendDatabase);
  const enabledDescriptor = Object.getOwnPropertyDescriptor(backendDatabase, "enabled");

  Object.defineProperty(backendDatabase, "enabled", { configurable: true, get: () => true });
  (backendDatabase.query as unknown) = async () => ({ rows: [], rowCount: 0 });

  try {
    const service = new BotMT5Service();
    await assert.rejects(
      service.acknowledgeSignal({ signalId: "UNKNOWN", licenseId: "LIC-1", status: "EXECUTED" }),
      /ACK_NOT_PERSISTED/,
    );
  } finally {
    if (enabledDescriptor) Object.defineProperty(backendDatabase, "enabled", enabledDescriptor);
    (backendDatabase.query as unknown) = originalQuery;
  }
});

test("acknowledgeSignal maps EA acceptance and OrderSend success", async () => {
  const originalQuery = backendDatabase.query.bind(backendDatabase);
  const enabledDescriptor = Object.getOwnPropertyDescriptor(backendDatabase, "enabled");
  const statuses: string[] = [];

  Object.defineProperty(backendDatabase, "enabled", { configurable: true, get: () => true });
  (backendDatabase.query as unknown) = async (sql: string, params: unknown[] = []) => {
    if (sql.includes("UPDATE bot_mt5_signals")) statuses.push(String(params[0]));
    return { rows: [], rowCount: sql.includes("UPDATE bot_mt5_signals") ? 1 : 0 };
  };

  try {
    const service = new BotMT5Service();
    const accepted = await service.acknowledgeSignal({
      signalId: "SIG-ACK-ACCEPTED",
      licenseId: "LIC-1",
      installationId: "INST-1",
      status: "RECEIVED",
    });
    const executed = await service.acknowledgeSignal({
      signalId: "SIG-ACK-EXECUTED",
      licenseId: "LIC-1",
      installationId: "INST-1",
      status: "EXECUTED",
    });

    assert.equal(accepted, "DELIVERED");
    assert.equal(executed, "EXECUTED");
    assert.deepEqual(statuses, ["DELIVERED", "EXECUTED"]);
  } finally {
    if (enabledDescriptor) Object.defineProperty(backendDatabase, "enabled", enabledDescriptor);
    (backendDatabase.query as unknown) = originalQuery;
  }
});

test("recordHeartbeat persists broker mapping and preserves canonical MULTI", async () => {
  const originalQuery = backendDatabase.query.bind(backendDatabase);
  const enabledDescriptor = Object.getOwnPropertyDescriptor(backendDatabase, "enabled");
  const calls: Array<{ sql: string; params: unknown[] }> = [];

  Object.defineProperty(backendDatabase, "enabled", { configurable: true, get: () => true });
  (backendDatabase.query as unknown) = async (sql: string, params: unknown[] = []) => {
    calls.push({ sql, params });
    return { rows: [], rowCount: 1 };
  };

  try {
    const service = new BotMT5Service();
    await service.recordHeartbeat(
      "LIC-1",
      "INST-1",
      "1.0.0",
      "READY",
      0,
      10000,
      10000,
      "ACCOUNT-HASH",
      "Broker-Demo",
      "XAUUSD.sml",
      "multi",
    );

    const update = calls.find(call => call.sql.includes("UPDATE bot_mt5_installations"));
    assert.ok(update);
    assert.deepEqual(update.params, ["LIC-1", "INST-1", "XAUUSD.sml", "multi"]);
    assert.match(update.sql, /broker_symbol = COALESCE\(NULLIF\(BTRIM\(\$3\), ''\), broker_symbol\)/);
    assert.match(update.sql, /canonical_symbol = COALESCE\(NULLIF\(UPPER\(BTRIM\(\$4\)\), ''\), canonical_symbol\)/);
    const setClause = update.sql.split("WHERE")[0];
    assert.doesNotMatch(setClause, /account_hash\s*=/);
    assert.doesNotMatch(setClause, /license_id\s*=/);
  } finally {
    if (enabledDescriptor) Object.defineProperty(backendDatabase, "enabled", enabledDescriptor);
    (backendDatabase.query as unknown) = originalQuery;
  }
});

test("recordHeartbeat without symbols preserves existing mapping", async () => {
  const originalQuery = backendDatabase.query.bind(backendDatabase);
  const enabledDescriptor = Object.getOwnPropertyDescriptor(backendDatabase, "enabled");
  const calls: Array<{ sql: string; params: unknown[] }> = [];

  Object.defineProperty(backendDatabase, "enabled", { configurable: true, get: () => true });
  (backendDatabase.query as unknown) = async (sql: string, params: unknown[] = []) => {
    calls.push({ sql, params });
    return { rows: [], rowCount: 1 };
  };

  try {
    const service = new BotMT5Service();
    await service.recordHeartbeat(
      "LIC-1",
      "INST-1",
      "1.0.0",
      "READY",
      0,
      10000,
      10000,
      "ACCOUNT-HASH",
      "Broker-Demo",
    );

    const update = calls.find(call => call.sql.includes("UPDATE bot_mt5_installations"));
    assert.ok(update);
    assert.deepEqual(update.params, ["LIC-1", "INST-1", "", ""]);
    assert.match(update.sql, /COALESCE\(NULLIF\(BTRIM\(\$3\), ''\), broker_symbol\)/);
    assert.match(update.sql, /COALESCE\(NULLIF\(UPPER\(BTRIM\(\$4\)\), ''\), canonical_symbol\)/);
  } finally {
    if (enabledDescriptor) Object.defineProperty(backendDatabase, "enabled", enabledDescriptor);
    (backendDatabase.query as unknown) = originalQuery;
  }
});

test("recordHeartbeat retries update one installation without degrading identity", async () => {
  const originalQuery = backendDatabase.query.bind(backendDatabase);
  const enabledDescriptor = Object.getOwnPropertyDescriptor(backendDatabase, "enabled");
  const calls: Array<{ sql: string; params: unknown[] }> = [];

  Object.defineProperty(backendDatabase, "enabled", { configurable: true, get: () => true });
  (backendDatabase.query as unknown) = async (sql: string, params: unknown[] = []) => {
    calls.push({ sql, params });
    return { rows: [], rowCount: 1 };
  };

  try {
    const service = new BotMT5Service();
    const heartbeat = () => service.recordHeartbeat(
      "LIC-1",
      "INST-1",
      "1.0.0",
      "READY",
      0,
      10000,
      10000,
      "ACCOUNT-HASH",
      "Broker-Demo",
      "XAUUSD.sd",
      "MULTI",
    );

    await heartbeat();
    await heartbeat();

    const installationUpdates = calls.filter(call => call.sql.includes("UPDATE bot_mt5_installations"));
    const installationInserts = calls.filter(call => call.sql.includes("INSERT INTO bot_mt5_installations"));
    assert.equal(installationUpdates.length, 2);
    assert.equal(installationInserts.length, 0);
    assert.deepEqual(installationUpdates[0].params, installationUpdates[1].params);
  } finally {
    if (enabledDescriptor) Object.defineProperty(backendDatabase, "enabled", enabledDescriptor);
    (backendDatabase.query as unknown) = originalQuery;
  }
});