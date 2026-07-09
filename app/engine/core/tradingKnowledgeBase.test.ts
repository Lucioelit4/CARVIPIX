import assert from "node:assert/strict";
import test from "node:test";

import { createTradingKnowledgeBase } from "./tradingKnowledgeBase";

test("knowledge base includes strategy cards with required expert fields", () => {
  const kb = createTradingKnowledgeBase();

  assert.ok(kb.marketTypes.length >= 5);
  assert.ok(kb.sessions.includes("london"));
  assert.ok(kb.timeframes.includes("1H"));

  for (const card of kb.strategies) {
    assert.ok(card.definition.length > 0);
    assert.ok(card.conditions.length > 0);
    assert.ok(card.whenToTrade.length > 0);
    assert.ok(card.whenNotToTrade.length > 0);
    assert.ok(card.expectedDurationMinutes > 0);
    assert.ok(card.example.length > 0);
    assert.ok(card.validation.length > 0);
    assert.ok(card.commonFailure.length > 0);
    assert.ok(card.initialWeight > 0);
    assert.ok(card.invalidationRules.length > 0);
  }
});
