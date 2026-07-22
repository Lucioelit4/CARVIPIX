import assert from "node:assert/strict";
import test from "node:test";

import {
  generateFounderCode,
  hashFounderCode,
  normalizeFounderCode,
  verifyFounderCode,
} from "./security";
import { FOUNDER_ENTITLEMENTS, isFounderAccessEnabled } from "./types";

test("Founder codes use the secure public format and remain unique", () => {
  const codes = new Set(Array.from({ length: 100 }, generateFounderCode));
  assert.equal(codes.size, 100);
  for (const code of codes) {
    assert.match(code, /^CVX-FND-[A-HJ-NP-Z2-9]{4}(?:-[A-HJ-NP-Z2-9]{4}){2}$/);
  }
});

test("Founder code hashes never contain the raw code and verify timing-safely", () => {
  const rawCode = generateFounderCode();
  const hash = hashFounderCode(rawCode);
  assert.equal(hash.includes(rawCode), false);
  assert.equal(verifyFounderCode(rawCode, hash), true);
  assert.equal(verifyFounderCode(normalizeFounderCode(rawCode.toLowerCase()), hash), true);
  assert.equal(verifyFounderCode(generateFounderCode(), hash), false);
  assert.equal(verifyFounderCode(rawCode, "invalid"), false);
});

test("Founder activation is opt-in while existing entitlements remain independent", () => {
  assert.equal(isFounderAccessEnabled({ FOUNDER_ACCESS_ENABLED: "true" }), true);
  assert.equal(isFounderAccessEnabled({ FOUNDER_ACCESS_ENABLED: "false" }), false);
  assert.equal(isFounderAccessEnabled({}), false);
  assert.equal(FOUNDER_ENTITLEMENTS.includes("ALL_CURRENT_SERVICES"), true);
  assert.equal(FOUNDER_ENTITLEMENTS.length, 10);
});