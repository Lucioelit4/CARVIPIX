import test from "node:test";
import assert from "node:assert/strict";

import {
  buildMembershipSourceTag,
  calculateMembershipExpiry,
  resolveMembershipPlanForProduct,
  shouldSkipActivation,
} from "./membership-activation-logic";

test("resolveMembershipPlanForProduct maps known plan products", () => {
  assert.equal(resolveMembershipPlanForProduct({ productId: "plan-pro" }), "pro");
  assert.equal(resolveMembershipPlanForProduct({ productId: "x", productType: "plan_premium" }), "premium");
  assert.equal(resolveMembershipPlanForProduct({ productId: "x", productType: "plan_enterprise" }), "enterprise");
  assert.equal(resolveMembershipPlanForProduct({ productId: "bot-carvipix-license", productType: "bot" }), null);
});

test("calculateMembershipExpiry extends from current future expiry", () => {
  const now = new Date("2026-01-01T00:00:00.000Z");
  const currentExpiry = new Date("2026-01-15T00:00:00.000Z");

  const expiry = calculateMembershipExpiry({ now, plan: "pro", currentExpiry });
  assert.equal(expiry.toISOString(), "2026-02-14T00:00:00.000Z");
});

test("shouldSkipActivation prevents duplicate activation for same source", () => {
  const sourceTag = buildMembershipSourceTag("pord-1");

  assert.equal(
    shouldSkipActivation({
      membershipStatus: "activo",
      membershipSource: "payment_order:pord-1",
      sourceTag,
    }),
    true
  );

  assert.equal(
    shouldSkipActivation({
      membershipStatus: "activo",
      membershipSource: "payment_order:pord-2",
      sourceTag,
    }),
    false
  );
});
