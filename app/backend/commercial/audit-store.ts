import fs from "fs/promises";
import path from "path";

import { backendDatabase } from "../core/database";

export type CommercialAuditEvent = {
  id: string;
  userId?: string | null;
  actorType: "client" | "admin" | "system";
  action: string;
  resource: string;
  result: "success" | "denied" | "error";
  metadata?: Record<string, unknown>;
  createdAt: string;
};

const STORE_PATH = path.join(process.cwd(), "data", "commercial-audit.json");

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function readLocalEvents(): Promise<CommercialAuditEvent[]> {
  try {
    const raw = await fs.readFile(STORE_PATH, "utf8");
    return (JSON.parse(raw) as CommercialAuditEvent[]) ?? [];
  } catch {
    return [];
  }
}

async function writeLocalEvents(events: CommercialAuditEvent[]): Promise<void> {
  await fs.mkdir(path.dirname(STORE_PATH), { recursive: true });
  await fs.writeFile(STORE_PATH, JSON.stringify(events, null, 2), "utf8");
}

export async function recordCommercialAuditEvent(input: Omit<CommercialAuditEvent, "id" | "createdAt">): Promise<void> {
  const event: CommercialAuditEvent = {
    id: createId("audit"),
    createdAt: new Date().toISOString(),
    ...input,
  };

  if (!backendDatabase.enabled) {
    const events = await readLocalEvents();
    events.unshift(event);
    await writeLocalEvents(events.slice(0, 500));
    return;
  }

  await backendDatabase.query(
    `
    INSERT INTO commercial_audit_events (id, user_id, actor_type, action, resource, result, metadata, created_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8)
    `,
    [event.id, event.userId ?? null, event.actorType, event.action, event.resource, event.result, JSON.stringify(event.metadata ?? {}), event.createdAt]
  );
}

export async function listCommercialAuditEvents(limit = 50): Promise<CommercialAuditEvent[]> {
  const safeLimit = Math.max(1, Math.min(limit, 200));

  if (!backendDatabase.enabled) {
    return (await readLocalEvents()).slice(0, safeLimit);
  }

  const { rows } = await backendDatabase.query<{
    id: string;
    user_id: string | null;
    actor_type: "client" | "admin" | "system";
    action: string;
    resource: string;
    result: "success" | "denied" | "error";
    metadata: unknown;
    created_at: Date;
  }>(
    `
    SELECT id, user_id, actor_type, action, resource, result, metadata, created_at
    FROM commercial_audit_events
    ORDER BY created_at DESC
    LIMIT $1
    `,
    [safeLimit]
  );

  return rows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    actorType: row.actor_type,
    action: row.action,
    resource: row.resource,
    result: row.result,
    metadata: typeof row.metadata === "object" && row.metadata ? (row.metadata as Record<string, unknown>) : {},
    createdAt: new Date(row.created_at).toISOString(),
  }));
}