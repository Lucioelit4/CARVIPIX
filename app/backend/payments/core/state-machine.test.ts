import test from "node:test";
import assert from "node:assert/strict";

import { PaymentStateMachine } from "./state-machine-logic";

test("order transitions allow expected path", () => {
  assert.equal(PaymentStateMachine.canTransitionOrder("created", "pending_provider"), true);
  assert.equal(PaymentStateMachine.transitionOrder("pending_provider", "awaiting_confirmation"), "awaiting_confirmation");
  assert.equal(PaymentStateMachine.transitionOrder("awaiting_confirmation", "paid"), "paid");
});

test("order transitions reject invalid jump", () => {
  assert.equal(PaymentStateMachine.canTransitionOrder("created", "paid"), false);
  assert.throws(
    () => PaymentStateMachine.transitionOrder("created", "paid"),
    /Invalid order transition: created -> paid/
  );
});

test("transaction transitions allow refund flow", () => {
  assert.equal(PaymentStateMachine.transitionTransaction("captured", "partially_refunded"), "partially_refunded");
  assert.equal(PaymentStateMachine.transitionTransaction("partially_refunded", "refunded"), "refunded");
});

test("membership transitions reject resurrection after cancel", () => {
  assert.equal(PaymentStateMachine.canTransitionMembership("cancelled", "active"), false);
  assert.throws(
    () => PaymentStateMachine.transitionMembership("cancelled", "active"),
    /Invalid membership transition: cancelled -> active/
  );
});
