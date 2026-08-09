import assert from "node:assert/strict";
import test from "node:test";

import { ObserverRuntimeLease, observerRuntimeLeaseErrors } from "./observerRuntimeLease";

type LeaseRow = {
  guard_key: string;
  owner_id: string;
  lease_expires_at: string;
  updated_at: string;
};

class FakeLeaseDatabase {
  enabled = true;
  tableExists = true;
  row: LeaseRow | null = null;
  nowMs = Date.parse("2026-08-03T12:00:00.000Z");

  async query<T extends Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<{ rows: T[] }> {
    if (sql.includes("to_regclass('public.observer_runtime_guard')")) {
      return { rows: [{ regclass: this.tableExists ? "observer_runtime_guard" : null }] as unknown as T[] };
    }
    if (sql.includes("INSERT INTO observer_runtime_guard")) {
      const [guardKey, ownerId, leaseExpiresAt] = params as [string, string, string];
      const currentExpiresAt = this.row ? Date.parse(this.row.lease_expires_at) : 0;
      if (this.row && currentExpiresAt >= this.nowMs && this.row.owner_id !== ownerId) return { rows: [] as T[] };
      this.row = {
        guard_key: guardKey,
        owner_id: ownerId,
        lease_expires_at: leaseExpiresAt,
        updated_at: new Date(this.nowMs).toISOString(),
      };
      return { rows: [{ owner_id: ownerId }] as unknown as T[] };
    }
    if (sql.includes("SELECT guard_key, owner_id, lease_expires_at, updated_at")) {
      return { rows: this.row ? [this.row as unknown as T] : [] };
    }
    if (sql.includes("DELETE FROM observer_runtime_guard")) {
      const [guardKey, ownerId] = params as [string, string];
      if (this.row?.guard_key === guardKey && this.row.owner_id === ownerId) this.row = null;
      return { rows: [] as T[] };
    }
    throw new Error(`Unexpected SQL in test: ${sql}`);
  }
}

test("observer lease acquires ownership and heartbeats forward", async () => {
  const db = new FakeLeaseDatabase();
  const lease = new ObserverRuntimeLease(db as never, { now: () => db.nowMs, leaseMs: 120_000 });
  assert.equal(await lease.acquire("owner-a"), true);
  const first = await lease.getSnapshot();
  assert.ok(first);
  db.nowMs += 60_000;
  assert.equal(await lease.heartbeat("owner-a"), true);
  const renewed = await lease.getSnapshot();
  assert.ok(renewed);
  assert.ok(Date.parse(renewed.leaseExpiresAt) > Date.parse(first.leaseExpiresAt));
});

test("observer lease rejects a second owner while current lease is valid", async () => {
  const db = new FakeLeaseDatabase();
  const lease = new ObserverRuntimeLease(db as never, { now: () => db.nowMs, leaseMs: 120_000 });
  assert.equal(await lease.acquire("owner-a"), true);
  assert.equal(await lease.acquire("owner-b"), false);
  assert.equal((await lease.getSnapshot())?.ownerId, "owner-a");
});

test("observer lease allows takeover when lease expired", async () => {
  const db = new FakeLeaseDatabase();
  const lease = new ObserverRuntimeLease(db as never, { now: () => db.nowMs, leaseMs: 120_000 });
  assert.equal(await lease.acquire("owner-a"), true);
  db.nowMs += 180_000;
  assert.equal(await lease.acquire("owner-b"), true);
  assert.equal((await lease.getSnapshot())?.ownerId, "owner-b");
});

test("observer lease releases safely for current owner only", async () => {
  const db = new FakeLeaseDatabase();
  const lease = new ObserverRuntimeLease(db as never, { now: () => db.nowMs, leaseMs: 120_000 });
  assert.equal(await lease.acquire("owner-a"), true);
  await lease.release("owner-b");
  assert.ok(await lease.getSnapshot());
  await lease.release("owner-a");
  assert.equal(await lease.getSnapshot(), null);
});

test("observer lease reports explicit schema error when migration is missing", async () => {
  const db = new FakeLeaseDatabase();
  db.tableExists = false;
  const lease = new ObserverRuntimeLease(db as never, { now: () => db.nowMs, leaseMs: 120_000 });
  await assert.rejects(() => lease.acquire("owner-a"), new RegExp(observerRuntimeLeaseErrors.LEASE_SCHEMA_ERROR));
});