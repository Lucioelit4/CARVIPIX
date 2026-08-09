import "server-only";

import { backendDatabase } from "@/app/backend/core/database";

type LeaseDatabase = Pick<typeof backendDatabase, "enabled" | "query">;

export interface ObserverRuntimeLeaseOptions {
  guardKey?: string;
  leaseMs?: number;
  now?: () => number;
}

export interface ObserverRuntimeLeaseSnapshot {
  guardKey: string;
  ownerId: string;
  leaseExpiresAt: string;
  updatedAt: string;
  expired: boolean;
}

const DEFAULT_GUARD_KEY = "MAESTRO_V3";
const DEFAULT_LEASE_MS = 120_000;
const LEASE_SCHEMA_ERROR = "OBSERVER_RUNTIME_LEASE_SCHEMA_MISSING";
const LEASE_DATABASE_ERROR = "OBSERVER_RUNTIME_LEASE_DATABASE_DISABLED";

export class ObserverRuntimeLease {
  private schemaValidated = false;

  constructor(
    private readonly database: LeaseDatabase = backendDatabase,
    private readonly options: ObserverRuntimeLeaseOptions = {},
  ) {}

  async acquire(ownerId: string): Promise<boolean> {
    return this.acquireOrHeartbeat(ownerId);
  }

  async heartbeat(ownerId: string): Promise<boolean> {
    return this.acquireOrHeartbeat(ownerId);
  }

  async release(ownerId: string): Promise<void> {
    await this.ensureSchemaReady();
    await this.database.query(
      `DELETE FROM observer_runtime_guard WHERE guard_key = $1 AND owner_id = $2`,
      [this.guardKey, ownerId],
    );
  }

  async getSnapshot(): Promise<ObserverRuntimeLeaseSnapshot | null> {
    await this.ensureSchemaReady();
    const result = await this.database.query<{
      guard_key: string;
      owner_id: string;
      lease_expires_at: Date | string;
      updated_at: Date | string;
    }>(
      `SELECT guard_key, owner_id, lease_expires_at, updated_at
       FROM observer_runtime_guard
       WHERE guard_key = $1
       LIMIT 1`,
      [this.guardKey],
    );

    const row = result.rows[0];
    if (!row) return null;

    const leaseExpiresAt = new Date(row.lease_expires_at).toISOString();
    const updatedAt = new Date(row.updated_at).toISOString();
    return {
      guardKey: row.guard_key,
      ownerId: row.owner_id,
      leaseExpiresAt,
      updatedAt,
      expired: Date.parse(leaseExpiresAt) <= this.now(),
    };
  }

  private get guardKey(): string {
    return this.options.guardKey ?? DEFAULT_GUARD_KEY;
  }

  private get leaseMs(): number {
    return this.options.leaseMs ?? DEFAULT_LEASE_MS;
  }

  private now(): number {
    return this.options.now?.() ?? Date.now();
  }

  private async ensureSchemaReady(): Promise<void> {
    if (!this.database.enabled) throw new Error(LEASE_DATABASE_ERROR);
    if (this.schemaValidated) return;

    const result = await this.database.query<{ regclass: string | null }>(
      `SELECT to_regclass('public.observer_runtime_guard') AS regclass`,
    );
    if (!result.rows[0]?.regclass) throw new Error(LEASE_SCHEMA_ERROR);
    this.schemaValidated = true;
  }

  private async acquireOrHeartbeat(ownerId: string): Promise<boolean> {
    await this.ensureSchemaReady();
    const leaseExpiresAt = new Date(this.now() + this.leaseMs).toISOString();
    const result = await this.database.query<{ owner_id: string }>(
      `INSERT INTO observer_runtime_guard (guard_key, owner_id, lease_expires_at, updated_at)
       VALUES ($1, $2, $3::timestamptz, NOW())
       ON CONFLICT (guard_key)
       DO UPDATE
       SET owner_id = EXCLUDED.owner_id,
           lease_expires_at = EXCLUDED.lease_expires_at,
           updated_at = NOW()
       WHERE observer_runtime_guard.lease_expires_at < NOW()
          OR observer_runtime_guard.owner_id = EXCLUDED.owner_id
       RETURNING owner_id`,
      [this.guardKey, ownerId, leaseExpiresAt],
    );
    return result.rows[0]?.owner_id === ownerId;
  }
}

export const observerRuntimeLease = new ObserverRuntimeLease();

export const observerRuntimeLeaseErrors = {
  LEASE_SCHEMA_ERROR,
  LEASE_DATABASE_ERROR,
} as const;