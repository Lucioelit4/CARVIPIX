import test from "node:test";
import assert from "node:assert/strict";

import { StaleAnalysisValidator } from "./staleAnalysisValidator";

test("stale analysis validator flags stale snapshots", () => {
  const validator = new StaleAnalysisValidator();
  const result = validator.evaluate({
    snapshotPrice: 100,
    currentPrice: 101,
    snapshotUtc: "2026-07-11T00:00:00.000Z",
    nowUtc: "2026-07-11T00:20:00.000Z",
    atr: 1,
    expiryUtc: null,
    openCandlePresent: true,
  });

  assert.equal(result.stale, true);
  assert.equal(result.reason, "STALE_ANALYSIS");
});
