import test from "node:test";
import assert from "node:assert/strict";

import { NextRequest } from "next/server";

import { GET, POST } from "./route";

test("GET rejects cross-origin requests without configured API key", async () => {
  const request = new NextRequest("http://localhost:3000/api/datasets?action=health", {
    method: "GET",
    headers: {
      origin: "https://malicious.example",
    },
  });

  const response = await GET(request);
  assert.equal(response.status, 401);
});

test("GET requires moduleId for module-scoped actions", async () => {
  const request = new NextRequest("http://localhost:3000/api/datasets?action=dashboard", {
    method: "GET",
    headers: {
      origin: "http://localhost:3000",
    },
  });

  const response = await GET(request);
  assert.equal(response.status, 400);
});

test("POST registers consumer with API key and allows query", async () => {
  const previousKey = process.env.DATA_PLATFORM_API_KEY;
  process.env.DATA_PLATFORM_API_KEY = "integration-test-key";

  try {
    const registerRequest = new NextRequest("http://localhost:3000/api/datasets", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-data-platform-key": "integration-test-key",
      },
      body: JSON.stringify({
        action: "register-consumer",
        moduleId: "api-test-module",
        scopes: ["query", "catalog", "dashboard"],
      }),
    });

    const registerResponse = await POST(registerRequest);
    assert.equal(registerResponse.status, 200);

    const queryRequest = new NextRequest("http://localhost:3000/api/datasets?action=query&kind=tick&moduleId=api-test-module&limit=10", {
      method: "GET",
      headers: {
        "x-data-platform-key": "integration-test-key",
      },
    });

    const queryResponse = await GET(queryRequest);
    assert.equal(queryResponse.status, 200);

    const payload = (await queryResponse.json()) as { rows?: unknown[] };
    assert.ok(Array.isArray(payload.rows));
  } finally {
    if (typeof previousKey === "undefined") {
      delete process.env.DATA_PLATFORM_API_KEY;
    } else {
      process.env.DATA_PLATFORM_API_KEY = previousKey;
    }
  }
});
