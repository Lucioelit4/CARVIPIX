import test from "node:test";
import assert from "node:assert/strict";

import { ACQUIRE_PENDING_EMAIL_OUTBOX_SQL } from "./email-outbox-worker-queries";

test("acquire pending outbox query uses SKIP LOCKED for concurrency safety", () => {
  assert.equal(ACQUIRE_PENDING_EMAIL_OUTBOX_SQL.includes("FOR UPDATE SKIP LOCKED"), true);
});

test("acquire pending outbox query increments attempts atomically", () => {
  assert.equal(ACQUIRE_PENDING_EMAIL_OUTBOX_SQL.includes("attempts = po.attempts + 1"), true);
});

test("acquire pending outbox query only picks due pending email events", () => {
  assert.equal(ACQUIRE_PENDING_EMAIL_OUTBOX_SQL.includes("status = 'pending'"), true);
  assert.equal(ACQUIRE_PENDING_EMAIL_OUTBOX_SQL.includes("event_name = 'email.transactional.requested'"), true);
  assert.equal(ACQUIRE_PENDING_EMAIL_OUTBOX_SQL.includes("available_at <= NOW()"), true);
});
