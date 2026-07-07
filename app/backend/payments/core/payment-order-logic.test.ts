import test from "node:test";
import assert from "node:assert/strict";

import {
  canCreateCheckoutSessionFromStatus,
  createExternalOrderCode,
  deriveCheckoutProgression,
} from "./payment-order-logic";

test("createExternalOrderCode uses expected format", () => {
  const code = createExternalOrderCode(new Date("2026-01-01T12:34:56.000Z"), "A1B2");
  assert.equal(code, "ORD-20260101123456-A1B2");
});

test("canCreateCheckoutSessionFromStatus only allows created and pending_provider", () => {
  assert.equal(canCreateCheckoutSessionFromStatus("created"), true);
  assert.equal(canCreateCheckoutSessionFromStatus("pending_provider"), true);
  assert.equal(canCreateCheckoutSessionFromStatus("awaiting_confirmation"), false);
  assert.equal(canCreateCheckoutSessionFromStatus("paid"), false);
});

test("deriveCheckoutProgression transitions to awaiting_confirmation", () => {
  const progression = deriveCheckoutProgression("created");
  assert.equal(progression.pendingProviderStatus, "pending_provider");
  assert.equal(progression.awaitingConfirmationStatus, "awaiting_confirmation");
});
