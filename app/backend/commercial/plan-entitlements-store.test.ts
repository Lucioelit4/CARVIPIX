import test from "node:test";
import assert from "node:assert/strict";
import fs from "fs/promises";
import os from "os";
import path from "path";

test("plan entitlements store persists overrides without database", async () => {
  delete process.env.DATABASE_URL;
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "carvipix-commercial-"));
  process.env.PLAN_ENTITLEMENTS_STORE_PATH = path.join(tempDir, "plan-entitlements.json");

  const store = await import("./plan-entitlements-store");

  const before = await store.getPlanEntitlements("advanced");
  assert.equal(before.botEnabled, true);

  await store.updatePlanEntitlements("advanced", {
    botEnabled: true,
    maxAlertsPerDay: 12,
    maxPairs: 9,
    historyLimit: 90,
    allowedPairs: ["EURUSD", "AUDUSD"],
  });

  const after = await store.getPlanEntitlements("advanced");
  assert.equal(after.botEnabled, true);
  assert.equal(after.maxAlertsPerDay, 12);
  assert.equal(after.maxPairs, 9);
  assert.equal(after.historyLimit, 90);
  assert.deepEqual(after.allowedPairs, ["EURUSD", "AUDUSD"]);

  const listed = await store.listPlanEntitlements();
  assert.equal(listed.find((item) => item.plan === "advanced")?.maxAlertsPerDay, 12);

  await fs.rm(tempDir, { recursive: true, force: true });
  delete process.env.PLAN_ENTITLEMENTS_STORE_PATH;
});