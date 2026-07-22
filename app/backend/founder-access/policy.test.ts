import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { resolveFounderCodeClaim, type FounderCodeCandidate } from "./policy";
import { generateFounderCode, hashFounderCode } from "./security";
import { FOUNDER_CODE_LIMIT, FOUNDER_ENTITLEMENTS, isFounderAccessEnabled, isFounderAccessSnapshotActive, normalizeFounderEmail } from "./types";
import { resolveSidebarMembershipLabel } from "@/app/components/sidebar-membership";

function fixtures() {
  const rawCodes = Array.from({ length: FOUNDER_CODE_LIMIT }, generateFounderCode);
  const candidates: FounderCodeCandidate[] = rawCodes.map((code, index) => ({
    id: `slot-${index + 1}`,
    codeHash: hashFounderCode(code),
    status: "AVAILABLE",
    assignedEmail: `owner${index + 1}@example.com`,
    redeemedByUserId: null,
  }));
  return { rawCodes, candidates };
}

test("exactly three slots claim once and cannot move to another account", () => {
  const { rawCodes, candidates } = fixtures();
  assert.equal(candidates.length, 3);
  const first = resolveFounderCodeClaim({
    candidates, rawCode: rawCodes[0], userId: "user-1", userEmail: "owner1@example.com", existingAccessActive: false,
  });
  assert.deepEqual(first, { kind: "CLAIM", codeId: "slot-1" });

  candidates[0] = { ...candidates[0], status: "REDEEMED", redeemedByUserId: "user-1" };
  assert.equal(resolveFounderCodeClaim({
    candidates, rawCode: rawCodes[0], userId: "user-1", userEmail: "owner1@example.com", existingAccessActive: true,
  }).kind, "IDEMPOTENT");
  assert.equal(resolveFounderCodeClaim({
    candidates, rawCode: rawCodes[0], userId: "user-2", userEmail: "owner1@example.com", existingAccessActive: false,
  }).kind, "INVALID");
});

test("wrong email, wrong code, and revoked code share one invalid result", () => {
  const { rawCodes, candidates } = fixtures();
  assert.equal(resolveFounderCodeClaim({
    candidates, rawCode: rawCodes[0], userId: "user-x", userEmail: "other@example.com", existingAccessActive: false,
  }).kind, "INVALID");
  assert.equal(resolveFounderCodeClaim({
    candidates, rawCode: generateFounderCode(), userId: "user-x", userEmail: "owner1@example.com", existingAccessActive: false,
  }).kind, "INVALID");
  candidates[0] = { ...candidates[0], status: "REVOKED" };
  assert.equal(resolveFounderCodeClaim({
    candidates, rawCode: rawCodes[0], userId: "user-1", userEmail: "owner1@example.com", existingAccessActive: false,
  }).kind, "INVALID");
});

test("migration is additive and Founder entitlements are complete and permanent", async () => {
  const migration = await readFile("infra/migrations/20260722_founder_all_access.sql", "utf8");
  assert.doesNotMatch(migration, /\bDROP\b/i);
  assert.doesNotMatch(migration, /\b(?:INSERT|UPDATE|DELETE)\s+(?:INTO\s+)?(?:memberships|orders|payments|payment_subscriptions)\b/i);
  assert.match(migration, /founder_code_limit_guard/);
  assert.match(migration, /CHECK \(expires_at IS NULL\)/);
  assert.deepEqual(FOUNDER_ENTITLEMENTS, [
    "BASIC_ACCESS", "PRO_ACCESS", "BOT_ACCESS", "ALERTS_PREMIUM", "ANALYSIS_ACCESS",
    "COMMUNITY_ACCESS", "TOOLS_ACCESS", "RESULTS_ACCESS", "ACADEMY_ACCESS", "ALL_CURRENT_SERVICES",
  ]);
});

test("active Founder access grants the Bot and revocation removes all access", () => {
  const active = {
    userId: "owner-1",
    codeId: "slot-1",
    status: "ACTIVE" as const,
    activatedAt: new Date(),
    entitlements: [...FOUNDER_ENTITLEMENTS],
    licenseId: "CVX-BOT-FND-test",
    licenseStatus: "ACTIVE" as const,
  };
  assert.equal(isFounderAccessSnapshotActive(active), true);
  assert.equal(isFounderAccessSnapshotActive({ ...active, status: "REVOKED" }), false);
  assert.equal(isFounderAccessSnapshotActive({ ...active, licenseStatus: "REVOKED" }), false);
  assert.equal(isFounderAccessSnapshotActive({ ...active, entitlements: [] }), false);
});

test("Sidebar labels active Founder access without changing normal labels", () => {
  assert.equal(resolveSidebarMembershipLabel({ plan: "founder", estado: "activo", active: true }), "Fundador");
  assert.equal(resolveSidebarMembershipLabel({ plan: "basic", estado: "activo", active: true }), "Básico");
  assert.equal(resolveSidebarMembershipLabel({ plan: "pro", estado: "activo", active: true }), "Pro");
  assert.equal(resolveSidebarMembershipLabel({ plan: "free", estado: "inactivo", active: false }), "Sin membresía");
});

test("feature flag blocks only new activation and does not alter active access", () => {
  assert.equal(isFounderAccessEnabled({ FOUNDER_ACCESS_ENABLED: "false" }), false);
  const active = {
    userId: "owner-1", codeId: "slot-1", status: "ACTIVE" as const, activatedAt: new Date(),
    entitlements: [...FOUNDER_ENTITLEMENTS], licenseId: "license", licenseStatus: "ACTIVE" as const,
  };
  assert.equal(isFounderAccessSnapshotActive(active), true);
});

test("activation and admin routes require session, CSRF protection, and admin authorization", async () => {
  const activationRoute = await readFile("app/api/founder-access/activate/route.ts", "utf8");
  const adminRoute = await readFile("app/api/admin/founder-access/route.ts", "utf8");
  assert.match(activationRoute, /requireClientSession/);
  assert.match(activationRoute, /isSameOriginRequest/);
  assert.match(activationRoute, /InMemoryRateLimiter/);
  assert.match(activationRoute, /hashFounderActorKey\(auth\.user\.id\)/);
  assert.match(adminRoute, /isValidAdminSession/);
  assert.match(adminRoute, /isStrictSameOriginRequest/);
  assert.match(adminRoute, /request\.headers\.get\("origin"\)/);
});

test("Founder implementation does not import or mutate protected systems", async () => {
  const service = await readFile("app/backend/founder-access/service.ts", "utf8");
  assert.doesNotMatch(service, /paypal|payment_transactions|payment_subscriptions|orders|memberships|telegram|observer|dispatcher|masterSignal/i);
  assert.doesNotMatch(service, /INSERT INTO (?:payments|orders|memberships|payment_subscriptions)/i);
});

test("Founder slots require real normalized email addresses", () => {
  assert.equal(normalizeFounderEmail(" Owner@One.Example "), "owner@one.example");
  assert.equal(normalizeFounderEmail("[CORREO 1]"), null);
  assert.equal(normalizeFounderEmail("owner-without-domain"), null);
});