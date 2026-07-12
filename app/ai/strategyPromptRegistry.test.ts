import test from "node:test";
import assert from "node:assert/strict";

import { StrategyPromptRegistry } from "./strategyPromptRegistry";

test("strategy registry exposes a stable catalog copy", () => {
  const registry = new StrategyPromptRegistry();

  const first = registry.list();
  const second = registry.list();

  assert.ok(first.length > 0);
  assert.notStrictEqual(first, second);
  assert.equal(first[0]?.id, second[0]?.id);
});

test("strategy registry authorizes by asset and horizon only", () => {
  const registry = new StrategyPromptRegistry();
  const strategy = registry.ensureAuthorized("CARVIPIX_TREND_PULLBACK_SHORT_V1", "XAUUSD", "SHORT");

  assert.equal(strategy.id, "CARVIPIX_TREND_PULLBACK_SHORT_V1");
  assert.throws(() => registry.ensureAuthorized("CARVIPIX_TREND_PULLBACK_SHORT_V1", "XAUUSD", "MEDIUM"));
});
