import test from "node:test";
import assert from "node:assert/strict";

import { resolveSidebarMembershipLabel } from "./sidebar-membership";

test("sidebar membership label reflects the real membership state", () => {
  assert.equal(resolveSidebarMembershipLabel(null), "Sin membresía");
  assert.equal(resolveSidebarMembershipLabel({ plan: "pro", estado: "inactivo", active: false }), "Sin membresía");
  assert.equal(resolveSidebarMembershipLabel({ plan: "basic", estado: "activo", active: true }), "Básico");
  assert.equal(resolveSidebarMembershipLabel({ plan: "advanced", estado: "activo", active: true }), "Pro");
  assert.equal(resolveSidebarMembershipLabel({ plan: "pro", estado: "vencido", active: false }), "Membresía vencida");
  assert.equal(resolveSidebarMembershipLabel({ plan: "founders_beta", estado: "activo", active: true }), "Fundador");
});