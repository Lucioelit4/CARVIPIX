import test from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";

import { getClientIp, isSameOriginRequest } from "./security";

test("isSameOriginRequest allows same origin", () => {
  const request = new NextRequest("https://carvipix.local/api/admin/payments/orders", {
    headers: {
      origin: "https://carvipix.local",
    },
  });

  assert.equal(isSameOriginRequest(request), true);
});

test("isSameOriginRequest rejects cross origin", () => {
  const request = new NextRequest("https://carvipix.local/api/admin/payments/orders", {
    headers: {
      origin: "https://evil.local",
    },
  });

  assert.equal(isSameOriginRequest(request), false);
});

test("getClientIp resolves forwarded header first", () => {
  const request = new NextRequest("https://carvipix.local/api/admin/payments/orders", {
    headers: {
      "x-forwarded-for": "10.0.0.1, 10.0.0.2",
      "x-real-ip": "10.0.0.9",
    },
  });

  assert.equal(getClientIp(request), "10.0.0.1");
});
