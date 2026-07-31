import test from "node:test";
import assert from "node:assert/strict";

import { backendDatabase } from "@/app/backend/core/database";
import { findActiveMt5License } from "./_auth";

function mockBackend(options: {
  enabled?: boolean;
  query: (sql: string, params?: unknown[]) => Promise<{ rows: Array<Record<string, unknown>> }>;
}) {
  const enabledDescriptor = Object.getOwnPropertyDescriptor(backendDatabase, "enabled");
  const originalQuery = backendDatabase.query.bind(backendDatabase);

  Object.defineProperty(backendDatabase, "enabled", {
    configurable: true,
    get: () => options.enabled ?? true,
  });

  (backendDatabase.query as unknown) = options.query;

  return () => {
    if (enabledDescriptor) {
      Object.defineProperty(backendDatabase, "enabled", enabledDescriptor);
    }
    (backendDatabase.query as unknown) = originalQuery;
  };
}

test("findActiveMt5License reconoce licencias owner derivadas de usuarios internos", async () => {
  const restore = mockBackend({
    enabled: true,
    query: async (sql) => {
      if (sql.includes("FROM bot_mt5_licenses")) {
        return { rows: [] };
      }
      if (sql.includes("FROM bot_licenses")) {
        return { rows: [] };
      }
      if (sql.includes("FROM users")) {
        return {
          rows: [
            {
              id: "usr-1783891273618-u0wmj0p3",
              email: "salcidoabraham525@gmail.com",
            },
          ],
        };
      }
      return { rows: [] };
    },
  });

  try {
    const license = await findActiveMt5License("CVPX-OWNER-USR-1783");
    assert.deepEqual(license, { userId: "usr-1783891273618-u0wmj0p3" });
  } finally {
    restore();
  }
});
