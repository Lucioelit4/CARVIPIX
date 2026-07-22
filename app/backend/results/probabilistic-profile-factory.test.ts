import assert from "node:assert/strict";
import test from "node:test";

import { createProbabilisticProfiles } from "./probabilistic-profile-factory";

test("creates exactly 60 isolated profiles and the required 24 Bot selection", () => {
  const profiles = createProbabilisticProfiles("prob-run-1");
  assert.equal(profiles.length, 60);
  assert.equal(profiles.filter(profile => profile.riskType === "CONSERVATIVE").length, 20);
  assert.equal(profiles.filter(profile => profile.riskType === "MODERATE").length, 25);
  assert.equal(profiles.filter(profile => profile.riskType === "DYNAMIC").length, 15);
  assert.equal(profiles.filter(profile => profile.isBotProfile && profile.riskType === "CONSERVATIVE").length, 8);
  assert.equal(profiles.filter(profile => profile.isBotProfile && profile.riskType === "MODERATE").length, 10);
  assert.equal(profiles.filter(profile => profile.isBotProfile && profile.riskType === "DYNAMIC").length, 6);
  assert.ok(profiles.every(profile => !profile.isRealUser));
  assert.ok(profiles.every(profile => profile.profileType === "PROBABILISTIC_SIMULATION"));
  assert.ok(profiles.every(profile => profile.excludeFromMembers && profile.excludeFromRevenue));
  assert.ok(profiles.every(profile => profile.excludeFromLiveResults && profile.excludeFromTestimonials));
});