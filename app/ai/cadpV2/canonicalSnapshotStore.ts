import { createHash } from "node:crypto";
import type { CadpAnalysisRequestV2 } from "./types";

export interface CanonicalSnapshotRecord {
  analysis_id: string;
  symbol: string;
  analysis_profile: string;
  snapshot_utc: string;
  context_hash: string;
  request: CadpAnalysisRequestV2;
  created_at: string;
}

export class CanonicalSnapshotStore {
  private readonly byAnalysisId = new Map<string, CanonicalSnapshotRecord>();

  save(request: CadpAnalysisRequestV2): CanonicalSnapshotRecord {
    const context_hash = createHash("sha256").update(JSON.stringify(request)).digest("hex");
    const record: CanonicalSnapshotRecord = {
      analysis_id: request.identity.analysis_id,
      symbol: request.identity.symbol,
      analysis_profile: request.identity.analysis_profile,
      snapshot_utc: request.identity.snapshot_utc,
      context_hash,
      request,
      created_at: new Date().toISOString(),
    };
    this.byAnalysisId.set(record.analysis_id, record);
    return record;
  }

  get(analysisId: string): CanonicalSnapshotRecord | null {
    return this.byAnalysisId.get(analysisId) ?? null;
  }
}
