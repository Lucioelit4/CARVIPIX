import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { NextRequest } from "next/server";

import { isMaintenanceModeEnabled } from "./private-access";
import { proxy } from "../../../proxy";

const originalMaintenanceMode = process.env.MAINTENANCE_MODE;

afterEach(() => {
  if (originalMaintenanceMode === undefined) {
    delete process.env.MAINTENANCE_MODE;
  } else {
    process.env.MAINTENANCE_MODE = originalMaintenanceMode;
  }
});

test("opens public access when maintenance mode is absent or false", () => {
  delete process.env.MAINTENANCE_MODE;
  assert.equal(isMaintenanceModeEnabled(), false);

  process.env.MAINTENANCE_MODE = "false";
  assert.equal(isMaintenanceModeEnabled(), false);
});

test("enables the private-access gate only for an explicit true value", () => {
  process.env.MAINTENANCE_MODE = " TRUE ";
  assert.equal(isMaintenanceModeEnabled(), true);

  process.env.MAINTENANCE_MODE = "1";
  assert.equal(isMaintenanceModeEnabled(), false);
});

test("public mode continues through the normal route rules", async () => {
  process.env.MAINTENANCE_MODE = "false";

  const response = await proxy(new NextRequest("https://carvipix.com/"));

  assert.equal(response.headers.get("x-middleware-next"), "1");
  assert.equal(response.headers.get("location"), null);
});

test("maintenance mode redirects visitors without the private-access cookie", async () => {
  process.env.MAINTENANCE_MODE = "true";

  const response = await proxy(new NextRequest("https://carvipix.com/"));

  assert.equal(response.status, 307);
  assert.equal(response.headers.get("location"), "https://carvipix.com/acceso-privado");
});