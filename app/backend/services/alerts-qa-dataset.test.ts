import test from "node:test";
import assert from "node:assert/strict";

import {
  getAlertsQaPayload,
  isAlertsQaModeEnabled,
  listAlertsQaScenarios,
  setAlertsQaScenario,
} from "./alerts-qa-dataset";

function withEnv(values: Record<string, string | undefined>, run: () => void) {
  const previous = new Map<string, string | undefined>();
  Object.keys(values).forEach((key) => {
    previous.set(key, process.env[key]);
    const value = values[key];
    if (typeof value === "string") {
      process.env[key] = value;
    } else {
      delete process.env[key];
    }
  });

  try {
    run();
  } finally {
    previous.forEach((value, key) => {
      if (typeof value === "string") {
        process.env[key] = value;
      } else {
        delete process.env[key];
      }
    });
  }
}

test("alerts QA mode is blocked in production", () => {
  withEnv(
    {
      NODE_ENV: "production",
      CARVIPIX_RUNTIME_ENV: "qa",
      CARVIPIX_ALERTS_QA_MODE: "true",
    },
    () => {
      assert.equal(isAlertsQaModeEnabled(), false);
    }
  );
});

test("alerts QA mode requires explicit QA env and flag", () => {
  withEnv(
    {
      NODE_ENV: "development",
      CARVIPIX_RUNTIME_ENV: "qa",
      CARVIPIX_ALERTS_QA_MODE: "true",
    },
    () => {
      assert.equal(isAlertsQaModeEnabled(), true);
    }
  );

  withEnv(
    {
      NODE_ENV: "development",
      CARVIPIX_RUNTIME_ENV: "staging",
      CARVIPIX_ALERTS_QA_MODE: "true",
    },
    () => {
      assert.equal(isAlertsQaModeEnabled(), false);
    }
  );
});

test("multi scenario includes controlled QA states", () => {
  const scenarios = listAlertsQaScenarios();
  assert.deepEqual(scenarios, ["empty", "single-new", "multi-mixed"]);

  const userId = "qa-test-user";
  const payload = setAlertsQaScenario(userId, "multi-mixed");
  assert.equal(payload.scenario, "multi-mixed");
  assert.equal(payload.alerts.length >= 8, true);

  const ids = new Set(payload.alerts.map((alert) => alert.id));
  ["qa-new-vigente", "qa-active", "qa-soon-expire", "qa-expired", "qa-winner", "qa-loser", "qa-cancelled", "qa-viewed"].forEach((id) => {
    assert.equal(ids.has(id), true);
  });

  const resolved = getAlertsQaPayload(userId);
  assert.equal(resolved.history.some((item) => item.alertId === "qa-viewed" && item.action === "viewed"), true);
});
