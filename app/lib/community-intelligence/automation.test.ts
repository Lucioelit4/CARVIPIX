import test from "node:test";
import assert from "node:assert/strict";

import {
  COMMUNITY_AUTOMATION_DISABLED_REASON,
  assertCommunityAutomationEnabled,
  isCommunityAutomationEnabled,
} from "./automation";
import {
  DedicatedCommunityTelegramPublisher,
  OpenAICommunityContentGenerator,
  OpenAICommunityImageGenerator,
} from "./adapters";
import { processEvent } from "../community-publisher/eventProcessor";
import { deliverPublicationToTelegram } from "../community-publisher/telegramDelivery";

test("Community automation is opt-in and reversible", () => {
  assert.equal(isCommunityAutomationEnabled({ COMMUNITY_AUTOMATION_ENABLED: undefined }), false);
  assert.equal(isCommunityAutomationEnabled({ COMMUNITY_AUTOMATION_ENABLED: "false" }), false);
  assert.equal(isCommunityAutomationEnabled({ COMMUNITY_AUTOMATION_ENABLED: "true" }), true);
});

test("Community automation guard blocks disabled provider work", () => {
  const previous = process.env.COMMUNITY_AUTOMATION_ENABLED;
  process.env.COMMUNITY_AUTOMATION_ENABLED = "false";
  try {
    assert.throws(() => assertCommunityAutomationEnabled(), new RegExp(COMMUNITY_AUTOMATION_DISABLED_REASON));
  } finally {
    if (previous === undefined) {
      delete process.env.COMMUNITY_AUTOMATION_ENABLED;
    } else {
      process.env.COMMUNITY_AUTOMATION_ENABLED = previous;
    }
  }
});

test("disabled Community automation performs no provider or delivery calls", async () => {
  const previous = process.env.COMMUNITY_AUTOMATION_ENABLED;
  const originalFetch = globalThis.fetch;
  let fetchCalls = 0;
  process.env.COMMUNITY_AUTOMATION_ENABLED = "false";
  globalThis.fetch = (async () => {
    fetchCalls += 1;
    throw new Error("UNEXPECTED_FETCH");
  }) as typeof fetch;

  try {
    await assert.rejects(new OpenAICommunityContentGenerator().generate({} as never), /COMMUNITY_AUTOMATION_DISABLED/);
    await assert.rejects(new OpenAICommunityImageGenerator().generate({} as never, {} as never), /COMMUNITY_AUTOMATION_DISABLED/);
    await assert.rejects(new DedicatedCommunityTelegramPublisher().publish({} as never), /COMMUNITY_AUTOMATION_DISABLED/);

    const eventResult = await processEvent({});
    assert.equal(eventResult.accepted, false);
    assert.equal(eventResult.skip_reason, "SKIPPED_AUTOMATION_DISABLED");

    const deliveryResult = await deliverPublicationToTelegram({} as never, "ignored", "test-channel");
    assert.equal(deliveryResult.ok, false);
    assert.equal(deliveryResult.error, COMMUNITY_AUTOMATION_DISABLED_REASON);
    assert.equal(fetchCalls, 0);
  } finally {
    globalThis.fetch = originalFetch;
    if (previous === undefined) {
      delete process.env.COMMUNITY_AUTOMATION_ENABLED;
    } else {
      process.env.COMMUNITY_AUTOMATION_ENABLED = previous;
    }
  }
});