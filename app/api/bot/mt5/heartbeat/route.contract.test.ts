import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server";

import { backendDatabase } from "@/app/backend/core/database";
import { POST } from "./route";

test("heartbeat route forwards the EA broker mapping without changing installation identity", async () => {
  const originalQuery = backendDatabase.query.bind(backendDatabase);
  const enabledDescriptor = Object.getOwnPropertyDescriptor(backendDatabase, "enabled");
  const calls: Array<{ sql: string; params: unknown[] }> = [];

  Object.defineProperty(backendDatabase, "enabled", { configurable: true, get: () => true });
  (backendDatabase.query as unknown) = async (sql: string, params: unknown[] = []) => {
    calls.push({ sql, params });
    if (sql.includes("FROM bot_mt5_licenses") && sql.includes("UNION ALL")) {
      return { rows: [{ user_id: "USER-1" }], rowCount: 1 };
    }
    return { rows: [], rowCount: 1 };
  };

  try {
    const request = new NextRequest("http://localhost/api/bot/mt5/heartbeat", {
      method: "POST",
      headers: {
        authorization: "Bearer LIC-1",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        license_id: "LIC-1",
        installation_id: "INST-1",
        ea_version: "1.0.0",
        status: "READY",
        open_positions: 0,
        equity: 10000,
        balance: 10000,
        account_hash: "ACCOUNT-HASH",
        broker_server: "Broker-Demo",
        broker_symbol: "XAUUSD.sd",
        canonical_symbol: "MULTI",
      }),
    });

    const response = await POST(request);

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { success: true, received: true });
    const update = calls.find(call => call.sql.includes("UPDATE bot_mt5_installations"));
    assert.ok(update);
    assert.deepEqual(update.params, ["LIC-1", "INST-1", "XAUUSD.sd", "MULTI"]);
    assert.equal(calls.some(call => call.sql.includes("INSERT INTO bot_mt5_installations")), false);
  } finally {
    if (enabledDescriptor) Object.defineProperty(backendDatabase, "enabled", enabledDescriptor);
    (backendDatabase.query as unknown) = originalQuery;
  }
});