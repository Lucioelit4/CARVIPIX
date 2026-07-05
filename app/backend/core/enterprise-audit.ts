export type AuditResult = "success" | "failure" | "denied";

export interface AuditActor {
  id: string;
  type: "user" | "system" | "service";
  roles?: string[];
}

export interface AuditOrigin {
  ip?: string;
  userAgent?: string;
  requestId?: string;
  module?: string;
}

export interface EnterpriseAuditRecord {
  id: string;
  actor: AuditActor;
  action: string;
  resource: string;
  result: AuditResult;
  timestamp: string;
  origin?: AuditOrigin;
  metadata?: Record<string, unknown>;
}

export interface EnterpriseAuditTrail {
  record(input: Omit<EnterpriseAuditRecord, "id" | "timestamp">): EnterpriseAuditRecord;
  list(limit?: number): EnterpriseAuditRecord[];
}

function createAuditId(): string {
  const random = Math.random().toString(36).slice(2, 10);
  return `audit_${Date.now()}_${random}`;
}

export class InMemoryEnterpriseAuditTrail implements EnterpriseAuditTrail {
  private readonly records: EnterpriseAuditRecord[] = [];

  constructor(private readonly maxRecords: number) {}

  record(input: Omit<EnterpriseAuditRecord, "id" | "timestamp">): EnterpriseAuditRecord {
    const record: EnterpriseAuditRecord = {
      id: createAuditId(),
      timestamp: new Date().toISOString(),
      ...input,
    };

    this.records.unshift(record);
    if (this.records.length > this.maxRecords) {
      this.records.length = this.maxRecords;
    }

    return record;
  }

  list(limit = 100): EnterpriseAuditRecord[] {
    return this.records.slice(0, Math.max(0, limit));
  }
}
