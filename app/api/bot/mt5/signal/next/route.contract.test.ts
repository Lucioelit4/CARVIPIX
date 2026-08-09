import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server";

import { handleSignalNext } from "./handler";

test("signal-next atomically routes canonical signal to the installation broker symbol", async () => {
  const calls: Array<{ sql: string; params: unknown[] }> = [];
  const request = new NextRequest(
    "http://localhost/api/bot/mt5/signal/next?license_id=LIC-1&installation_id=INST-1&signal_mode=EXTENDED",
  );

  const response = await handleSignalNext(
    { licenseId: "LIC-1", installationId: "INST-1", signalMode: "EXTENDED" },
    request,
    {
      authenticate: async () => ({ ok: true as const, licenseKey: "LIC-1", userId: "USER-1" }),
      query: (async (sql: string, params: unknown[] = []) => {
        calls.push({ sql, params });
        if (sql.includes("FROM bot_mt5_licenses")) {
          return { rows: [{ id: "LICENSE-ROW-1" }], rowCount: 1 };
        }
        return {
          rows: [{
            id: "mt5-sig-1",
            signal_id: "SIG-EXTENDED-1",
            event_id: "EVT-EXTENDED-1",
            symbol: "XAUUSD",
            canonical_symbol: "XAUUSD",
            broker_symbol: "XAUUSD.sml",
            installation_id: "INST-1",
            decision: "BUY",
            entry: "2400",
            stop_loss: "2390",
            take_profit: "2420",
            risk_reward: "2",
            signature: "SHA256:fixture",
            created_at: "2026-08-09T12:00:00.000Z",
            expires_at: "2026-08-10T08:00:00.000Z",
            signal_mode: "EXTENDED",
            validity_minutes: 1200,
            source: "CADP_V3_HISTORICAL_BRAIN",
          }],
          rowCount: 1,
        };
      }) as never,
      getCertificationMode: async () => null,
    },
  );

  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.equal(payload.has_signal, true);
  assert.equal(payload.signal_id, "SIG-EXTENDED-1");
  assert.equal(payload.event_id, "EVT-EXTENDED-1");
  assert.equal(payload.symbol, "XAUUSD.sml");
  assert.equal(payload.canonical_symbol, "XAUUSD");
  assert.equal(payload.broker_symbol, "XAUUSD.sml");
  assert.equal(payload.installation_id, "INST-1");
  assert.equal(payload.horizon, "EXTENDED");
  assert.equal(payload.validity_minutes, 1200);
  assert.equal(payload.expires_at, "2026-08-10T08:00:00.000Z");
  assert.equal(payload.source, "CADP_V3_HISTORICAL_BRAIN");
  assert.equal(payload.signature, "SHA256:fixture");

  const claim = calls[1];
  assert.deepEqual(claim.params, ["LIC-1", "INST-1", "EXTENDED"]);
  assert.match(claim.sql, /FOR UPDATE OF s SKIP LOCKED/);
  assert.match(claim.sql, /delivered_installation_id = candidate\.installation_id/);
  assert.match(claim.sql, /NULLIF\(i\.broker_symbol, ''\) IS NOT NULL/);
  assert.match(claim.sql, /UPPER\(i\.canonical_symbol\) = 'MULTI'/);
});

test("signal-next rejects polling without installation identity", async () => {
  const request = new NextRequest("http://localhost/api/bot/mt5/signal/next?license_id=LIC-1");
  const response = await handleSignalNext(
    { licenseId: "LIC-1", installationId: "", signalMode: null },
    request,
    {
      authenticate: async () => ({ ok: true as const, licenseKey: "LIC-1", userId: "USER-1" }),
      query: (async () => {
        throw new Error("database should not be queried");
      }) as never,
      getCertificationMode: async () => null,
    },
  );

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: "Parámetro requerido: installation_id" });
});