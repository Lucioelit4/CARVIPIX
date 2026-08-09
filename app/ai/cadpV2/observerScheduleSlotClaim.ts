import "server-only";

import { backendDatabase } from "@/app/backend/core/database";
import type { CanonicalSymbol, PreAnalysisTriggerReason } from "./typesMaestroV3";
import { MIN_CYCLE_INTERVAL_MS } from "./analysisCycleControl";

type SlotDatabase = Pick<typeof backendDatabase, "enabled" | "query">;

const SLOT_CLAIM_SCHEMA_ERROR = "OBSERVER_SCHEDULE_SLOT_CLAIM_SCHEMA_MISSING";
const SLOT_CLAIM_DATABASE_ERROR = "OBSERVER_SCHEDULE_SLOT_CLAIM_DATABASE_DISABLED";

export interface SlotClaimResult {
  acquired: boolean;
  slotStartUtcMs: number;
}

export class ObserverScheduleSlotClaim {
  private schemaValidated = false;

  constructor(private readonly database: SlotDatabase = backendDatabase) {}

  async claim(input: {
    symbol: CanonicalSymbol;
    ownerId: string;
    nowMs?: number;
    triggerReason: PreAnalysisTriggerReason;
  }): Promise<SlotClaimResult> {
    await this.ensureSchemaReady();
    const nowMs = input.nowMs ?? Date.now();
    const slotStartUtcMs = Math.floor(nowMs / MIN_CYCLE_INTERVAL_MS) * MIN_CYCLE_INTERVAL_MS;
    const result = await this.database.query(
      `INSERT INTO observer_schedule_slot_claim (canonical_symbol, slot_start_utc_ms, owner_id, trigger_reason)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (canonical_symbol, slot_start_utc_ms) DO NOTHING`,
      [input.symbol, slotStartUtcMs, input.ownerId, input.triggerReason],
    );
    return { acquired: Number(result.rowCount ?? 0) > 0, slotStartUtcMs };
  }

  private async ensureSchemaReady(): Promise<void> {
    if (!this.database.enabled) throw new Error(SLOT_CLAIM_DATABASE_ERROR);
    if (this.schemaValidated) return;
    const result = await this.database.query<{ regclass: string | null }>(
      `SELECT to_regclass('public.observer_schedule_slot_claim') AS regclass`,
    );
    if (!result.rows[0]?.regclass) throw new Error(SLOT_CLAIM_SCHEMA_ERROR);
    this.schemaValidated = true;
  }
}

export const observerScheduleSlotClaim = new ObserverScheduleSlotClaim();

export const observerScheduleSlotClaimErrors = {
  SLOT_CLAIM_SCHEMA_ERROR,
  SLOT_CLAIM_DATABASE_ERROR,
} as const;