import type { CadpAnalysisResponseV2 } from "./types";

export interface ResponseCacheRecord {
  dedupe_key: string;
  analysis_id: string;
  response: CadpAnalysisResponseV2;
  created_at: string;
}

export class ResponseCacheStore {
  private readonly map = new Map<string, ResponseCacheRecord>();

  get(dedupeKey: string): ResponseCacheRecord | null {
    return this.map.get(dedupeKey) ?? null;
  }

  save(record: ResponseCacheRecord): ResponseCacheRecord {
    this.map.set(record.dedupe_key, record);
    return record;
  }
}
