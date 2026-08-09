import assert from "node:assert/strict";
import test from "node:test";

import { ObserverScheduleSlotClaim } from "./observerScheduleSlotClaim";

class FakeSlotDatabase {
  enabled = true;
  readonly claims = new Set<string>();

  async query<T extends Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<{ rows: T[]; rowCount?: number }> {
    if (sql.includes("to_regclass('public.observer_schedule_slot_claim')")) {
      return { rows: [{ regclass: "observer_schedule_slot_claim" }] as unknown as T[] };
    }
    if (sql.includes("INSERT INTO observer_schedule_slot_claim")) {
      const [symbol, slot] = params;
      const key = `${symbol}:${slot}`;
      if (this.claims.has(key)) return { rows: [], rowCount: 0 };
      this.claims.add(key);
      return { rows: [], rowCount: 1 };
    }
    throw new Error(`Unexpected SQL: ${sql}`);
  }
}

test("same symbol and slot can be claimed only once", async () => {
  const claim = new ObserverScheduleSlotClaim(new FakeSlotDatabase() as never);
  const nowMs = Date.parse("2026-08-09T12:07:00.000Z");
  const first = await claim.claim({ symbol: "XAUUSD", ownerId: "owner-a", nowMs, triggerReason: "SCHEDULED_RECHECK" });
  const second = await claim.claim({ symbol: "XAUUSD", ownerId: "owner-b", nowMs, triggerReason: "SCHEDULED_RECHECK" });
  assert.equal(first.acquired, true);
  assert.equal(second.acquired, false);
  assert.equal(first.slotStartUtcMs, second.slotStartUtcMs);
});

test("different symbols claim the same slot independently", async () => {
  const claim = new ObserverScheduleSlotClaim(new FakeSlotDatabase() as never);
  const nowMs = Date.parse("2026-08-09T12:07:00.000Z");
  const xau = await claim.claim({ symbol: "XAUUSD", ownerId: "owner-a", nowMs, triggerReason: "SCHEDULED_RECHECK" });
  const eur = await claim.claim({ symbol: "EURUSD", ownerId: "owner-a", nowMs, triggerReason: "SCHEDULED_RECHECK" });
  assert.equal(xau.acquired, true);
  assert.equal(eur.acquired, true);
});