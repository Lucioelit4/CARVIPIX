import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server";

import { POST as adminSessionPost } from "@/app/api/auth/admin/session/route";
import { consumeAdminRecoveryToken, createAdminRecoveryToken } from "./admin-recovery";

test("admin login rate limit counts invalid credentials", async () => {
  const previousCode = process.env.ADMIN_ACCESS_CODE;
  process.env.ADMIN_ACCESS_CODE = "correct-admin-code";

  try {
    const statuses: number[] = [];
    for (let attempt = 0; attempt < 6; attempt += 1) {
      const response = await adminSessionPost(
        new NextRequest("http://localhost:3000/api/auth/admin/session", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-forwarded-for": "198.51.100.44",
          },
          body: JSON.stringify({ code: "wrong-admin-code" }),
        })
      );
      statuses.push(response.status);
    }

    assert.deepEqual(statuses, [401, 401, 401, 401, 401, 429]);
  } finally {
    if (previousCode === undefined) {
      delete process.env.ADMIN_ACCESS_CODE;
    } else {
      process.env.ADMIN_ACCESS_CODE = previousCode;
    }
  }
});

test("admin recovery token can only be consumed once", async () => {
  const previousSecret = process.env.ADMIN_SECRET;
  process.env.ADMIN_SECRET = "admin-auth-security-test-secret";

  try {
    const token = createAdminRecoveryToken();
    assert.equal(await consumeAdminRecoveryToken(token), true);
    assert.equal(await consumeAdminRecoveryToken(token), false);
  } finally {
    if (previousSecret === undefined) {
      delete process.env.ADMIN_SECRET;
    } else {
      process.env.ADMIN_SECRET = previousSecret;
    }
  }
});