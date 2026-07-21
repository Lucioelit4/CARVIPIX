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

test("isSameOriginRequest rejects forged same origin in production", () => {
  const previousNodeEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";

  try {
    const request = new NextRequest("https://carvipix.com/api/internal/observer-v3/analyses", {
      headers: { origin: "https://carvipix.com" },
    });

    assert.equal(isSameOriginRequest(request), false);
  } finally {
    if (previousNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousNodeEnv;
  }
});

test("isSameOriginRequest accepts configured internal token in production", () => {
  const previousNodeEnv = process.env.NODE_ENV;
  const previousToken = process.env.INTERNAL_OBSERVER_TOKEN;
  process.env.NODE_ENV = "production";
  process.env.INTERNAL_OBSERVER_TOKEN = "test-internal-token";

  try {
    const request = new NextRequest("https://carvipix.com/api/internal/observer-v3/analyses", {
      headers: { "x-internal-token": "test-internal-token" },
    });

    assert.equal(isSameOriginRequest(request), true);
  } finally {
    if (previousNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousNodeEnv;
    if (previousToken === undefined) delete process.env.INTERNAL_OBSERVER_TOKEN;
    else process.env.INTERNAL_OBSERVER_TOKEN = previousToken;
  }
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
