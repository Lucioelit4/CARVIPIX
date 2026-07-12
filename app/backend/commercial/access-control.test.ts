import test from "node:test";
import assert from "node:assert/strict";

import {
  AlertAccessGuard,
  AlertLimitGuard,
  BotAccessGuard,
  BotLimitGuard,
  CommercialAccessError,
  DEFAULT_PLAN_ENTITLEMENTS,
  FeatureAccessGuard,
  LicenseGuard,
  MembershipGuard,
  PairAccessGuard,
  PlanAccessGuard,
  normalizeSubscriptionPlan,
  resolveDefaultPlanEntitlements,
} from "./access-control";

test("normalizeSubscriptionPlan maps legacy and official plans", () => {
  assert.equal(normalizeSubscriptionPlan("demo"), "free");
  assert.equal(normalizeSubscriptionPlan("free"), "free");
  assert.equal(normalizeSubscriptionPlan("basic"), "basic");
  assert.equal(normalizeSubscriptionPlan("pro"), "advanced");
  assert.equal(normalizeSubscriptionPlan("advanced"), "advanced");
  assert.equal(normalizeSubscriptionPlan("premium"), "advanced");
  assert.equal(normalizeSubscriptionPlan("enterprise"), "advanced");
});

test("resolveDefaultPlanEntitlements returns independent copies", () => {
  const entitlements = resolveDefaultPlanEntitlements("basic");
  entitlements.allowedPairs?.push("AUDUSD");

  assert.deepEqual(DEFAULT_PLAN_ENTITLEMENTS.basic.allowedPairs, ["XAUUSD", "BTCUSD"]);
});

test("FeatureAccessGuard differentiates free vs paid access", () => {
  const guard = new FeatureAccessGuard();
  const freeContext = { membershipActive: true, entitlements: resolveDefaultPlanEntitlements("free") };
  const basicContext = { membershipActive: true, entitlements: resolveDefaultPlanEntitlements("basic") };

  assert.throws(() => guard.assertAccess(freeContext, "alertas"), (error: unknown) => {
    assert.ok(error instanceof CommercialAccessError);
    assert.equal(error.code, "FEATURE_NOT_AVAILABLE");
    return true;
  });
  assert.doesNotThrow(() => guard.assertAccess(basicContext, "alertas"));
  assert.doesNotThrow(() => guard.assertAccess(basicContext, "bot"));
});

test("AlertLimitGuard blocks when daily alerts are exhausted", () => {
  const guard = new AlertLimitGuard();
  const context = { membershipActive: true, entitlements: resolveDefaultPlanEntitlements("advanced") };
  const withinWindow = new Date(Date.UTC(2026, 0, 1, 10, 0, 0));

  assert.doesNotThrow(() => guard.assertCanCreateAlert(context, 13, withinWindow));
  assert.throws(() => guard.assertCanCreateAlert(context, 14, withinWindow), (error: unknown) => {
    assert.ok(error instanceof CommercialAccessError);
    assert.equal(error.code, "ALERT_LIMIT_EXCEEDED");
    return true;
  });
});

test("AlertAccessGuard blocks basic plan outside allowed schedule", () => {
  const guard = new AlertAccessGuard();
  const context = { membershipActive: true, entitlements: resolveDefaultPlanEntitlements("basic") };

  assert.throws(() => guard.assertWithinTradingWindow(context, new Date(Date.UTC(2026, 0, 1, 3, 0, 0))), (error: unknown) => {
    assert.ok(error instanceof CommercialAccessError);
    assert.equal(error.code, "OUTSIDE_ALLOWED_HOURS");
    return true;
  });
});

test("BotLimitGuard blocks when plan does not include bots or limit is exceeded", () => {
  const guard = new BotLimitGuard();
  const freeContext = { membershipActive: true, entitlements: resolveDefaultPlanEntitlements("free") };
  const basicContext = { membershipActive: true, entitlements: resolveDefaultPlanEntitlements("basic") };

  assert.throws(() => guard.assertCanCreateBot(freeContext, 0), (error: unknown) => {
    assert.ok(error instanceof CommercialAccessError);
    assert.equal(error.code, "FEATURE_NOT_AVAILABLE");
    return true;
  });
  assert.doesNotThrow(() => guard.assertCanCreateBot(basicContext, 0));
  assert.throws(() => guard.assertCanCreateBot(basicContext, 1), (error: unknown) => {
    assert.ok(error instanceof CommercialAccessError);
    assert.equal(error.code, "BOT_LIMIT_EXCEEDED");
    return true;
  });
});

test("PairAccessGuard blocks forbidden pairs and pair-count overflow", () => {
  const guard = new PairAccessGuard();
  const basicContext = { membershipActive: true, entitlements: resolveDefaultPlanEntitlements("basic") };
  const advancedContext = { membershipActive: true, entitlements: resolveDefaultPlanEntitlements("advanced") };

  assert.doesNotThrow(() =>
    guard.assertPairAccess(basicContext, {
      feature: "alertas",
      pair: "XAUUSD",
      existingPairs: ["BTCUSD"],
    })
  );

  assert.throws(
    () =>
      guard.assertPairAccess(basicContext, {
        feature: "alertas",
        pair: "EURUSD",
        existingPairs: ["XAUUSD"],
      }),
    (error: unknown) => {
      assert.ok(error instanceof CommercialAccessError);
      assert.equal(error.code, "PAIR_NOT_ALLOWED");
      return true;
    }
  );

  assert.throws(
    () =>
      guard.assertPairAccess(advancedContext, {
        feature: "bot",
        pair: "AUDUSD",
        existingPairs: Array.from({ length: 50 }, (_, index) => `PAIR${index}`),
      }),
    (error: unknown) => {
      assert.ok(error instanceof CommercialAccessError);
      assert.equal(error.code, "PAIR_LIMIT_EXCEEDED");
      return true;
    }
  );
});

test("PlanAccessGuard and MembershipGuard enforce commercial hierarchy", () => {
  const planGuard = new PlanAccessGuard();
  const membershipGuard = new MembershipGuard();
  const basicContext = { membershipActive: true, entitlements: resolveDefaultPlanEntitlements("basic") };
  const inactiveContext = { membershipActive: false, entitlements: resolveDefaultPlanEntitlements("advanced") };

  assert.doesNotThrow(() => planGuard.assertAtLeast(basicContext, "basic"));
  assert.throws(() => planGuard.assertAtLeast(basicContext, "advanced"), /no cubre/i);
  assert.throws(() => membershipGuard.assertActive(inactiveContext), /membresia activa/i);
});

test("BotAccessGuard and LicenseGuard validate readiness", () => {
  const botAccessGuard = new BotAccessGuard();
  const licenseGuard = new LicenseGuard();
  const context = { membershipActive: true, entitlements: resolveDefaultPlanEntitlements("advanced") };

  assert.doesNotThrow(() => botAccessGuard.assertCanProvisionBot(context, 2));
  assert.throws(() => licenseGuard.assertActive({ active: false }), (error: unknown) => {
    assert.ok(error instanceof CommercialAccessError);
    assert.equal(error.code, "LICENSE_REQUIRED");
    return true;
  });
});