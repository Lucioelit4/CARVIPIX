import test from "node:test";
import assert from "node:assert/strict";

import { buildAdminPaymentsQuery, formatMoney } from "./payments-admin";

test("buildAdminPaymentsQuery includes expected filters", () => {
  const query = buildAdminPaymentsQuery({
    orderStatus: "paid",
    provider: "custom",
    from: "2026-01-01",
    to: "2026-01-31",
    q: "john@example.com",
  });

  assert.match(query, /orderStatus=paid/);
  assert.match(query, /provider=custom/);
  assert.match(query, /from=2026-01-01/);
  assert.match(query, /to=2026-01-31/);
  assert.match(query, /q=john%40example\.com/);
  assert.match(query, /limit=250/);
});

test("formatMoney renders localized amount", () => {
  assert.equal(formatMoney(99.5, "usd"), "USD 99,50");
  assert.equal(formatMoney(Number.NaN, "usd"), "USD 0,00");
});
