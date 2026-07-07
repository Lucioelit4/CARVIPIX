import test from "node:test";
import assert from "node:assert/strict";

import { buildOrdersWhereClause, filterLocalPayments, parseOrdersFilters } from "./query-helpers";

test("parseOrdersFilters reads status/provider/date and search", () => {
  const params = new URLSearchParams();
  params.set("orderStatus", "paid");
  params.set("transactionStatus", "captured");
  params.set("provider", "custom");
  params.set("q", "john@example.com");
  params.set("from", "2026-01-01");
  params.set("to", "2026-01-31");
  params.set("limit", "700");

  const parsed = parseOrdersFilters(params);

  assert.equal(parsed.orderStatus, "paid");
  assert.equal(parsed.transactionStatus, "captured");
  assert.equal(parsed.provider, "custom");
  assert.equal(parsed.userQuery, "john@example.com");
  assert.equal(parsed.from, "2026-01-01");
  assert.equal(parsed.to, "2026-01-31");
  assert.equal(parsed.limit, 500);
});

test("buildOrdersWhereClause creates SQL filters and params", () => {
  const compiled = buildOrdersWhereClause({
    orderStatus: "paid",
    transactionStatus: "captured",
    provider: "custom",
    userQuery: "demo",
    from: "2026-01-01",
    to: "2026-01-31",
    limit: 100,
  });

  assert.match(compiled.whereClause, /po\.order_status/);
  assert.match(compiled.whereClause, /pt\.status/);
  assert.match(compiled.whereClause, /pt\.provider/);
  assert.match(compiled.whereClause, /LOWER\(CONCAT_WS/);
  assert.match(compiled.whereClause, /po\.created_at >=/);
  assert.match(compiled.whereClause, /po\.created_at <=/);
  assert.equal(compiled.params.length, 6);
});

test("filterLocalPayments applies user/provider/date filters", () => {
  const rows = filterLocalPayments(
    [
      {
        id: "ord-1",
        userId: "u-1",
        amount: 99,
        currency: "USD",
        status: "paid",
        fecha: "2026-01-10T10:00:00.000Z",
      },
      {
        id: "ord-2",
        userId: "u-2",
        amount: 199,
        currency: "USD",
        status: "failed",
        fecha: "2026-02-10T10:00:00.000Z",
      },
    ],
    [
      { id: "u-1", email: "john@example.com", nombre: "John", apellido: "One" },
      { id: "u-2", email: "jane@example.com", nombre: "Jane", apellido: "Two" },
    ],
    {
      orderStatus: "paid",
      transactionStatus: undefined,
      provider: "custom",
      userQuery: "john@",
      from: "2026-01-01",
      to: "2026-01-31",
      limit: 50,
    }
  );

  assert.equal(rows.length, 1);
  assert.equal(rows[0]?.orderId, "ord-1");
});
