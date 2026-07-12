import test from "node:test";
import assert from "node:assert/strict";

import { mapExternalAlerts, paginateAlerts } from "./alertas-view-model";

test("maps lifecycle fields with exact IDs and statuses", () => {
  const mapped = mapExternalAlerts([
    {
      id: "sig-1",
      symbol: "XAUUSD",
      status: "active",
      timestamp: "2026-07-12T10:00:00.000Z",
      description: "Setup confirmado",
      priority: "high",
      data: {
        signalId: "sig-1",
        analysisId: "ana-1",
        strategyId: "CARVIPIX_MTF_TREND_PULLBACK_XAUUSD_V1",
        direction: "Compra",
        entryPrice: 3350.5,
        stopLossPrice: 3342.1,
        takeProfitPrice: 3365.9,
        riskRewardRatio: 1.84,
        timeframe: "M5",
        signalStatus: "ACTIVE",
        source: "CARVIPIX_EXECUTION_ENGINE",
        dataOrigin: "REAL",
        expiresAt: "2099-07-12T12:00:00.000Z",
      },
    },
  ]);

  assert.equal(mapped.length, 1);
  assert.equal(mapped[0].signalId, "sig-1");
  assert.equal(mapped[0].analysisId, "ana-1");
  assert.equal(mapped[0].lifecycleState, "ACTIVE");
  assert.equal(mapped[0].lifecycleLabel, "ACTIVA");
  assert.equal(mapped[0].canEnter, true);
  assert.equal(mapped[0].strategyId, "CARVIPIX_MTF_TREND_PULLBACK_XAUUSD_V1");
});

test("keeps informational or terminal states out of entry mode", () => {
  const mapped = mapExternalAlerts([
    {
      id: "sig-2",
      symbol: "XAUUSD",
      status: "resolved",
      timestamp: "2026-07-12T10:00:00.000Z",
      data: {
        signalId: "sig-2",
        analysisId: "ana-2",
        signalStatus: "CLOSED",
        direction: "Venta",
      },
    },
    {
      id: "sig-3",
      symbol: "XAUUSD",
      status: "active",
      timestamp: "2026-07-12T10:00:00.000Z",
      data: {
        signalId: "sig-3",
        analysisId: "ana-3",
        signalStatus: "CONDITIONAL",
        direction: "Compra",
      },
    },
  ]);

  assert.equal(mapped[0].actionability === "closed" || mapped[0].actionability === "watch", true);
  assert.equal(mapped[1].canEnter, false);
});

test("paginates alerts deterministically", () => {
  const alerts = Array.from({ length: 17 }, (_, index) => ({
    ...mapExternalAlerts([{ id: `sig-${index}`, symbol: "XAUUSD", timestamp: `2026-07-12T10:${String(index).padStart(2, "0")}:00.000Z`, data: { signalId: `sig-${index}`, analysisId: `ana-${index}`, signalStatus: "ACTIVE", direction: "Compra" } }])[0],
  }));

  const page2 = paginateAlerts(alerts, 2, 8);
  assert.equal(page2.page, 2);
  assert.equal(page2.totalPages, 3);
  assert.equal(page2.items.length, 8);
});
