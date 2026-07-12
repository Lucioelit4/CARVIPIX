import type { CadpShadowSignal } from "./types";

export interface MasterSignalRecord {
  signal: CadpShadowSignal;
  analysis_id: string;
  signal_id: string;
  created_at: string;
}

export class MasterSignalStore {
  private latest: MasterSignalRecord | null = null;

  save(signal: CadpShadowSignal): MasterSignalRecord {
    const record: MasterSignalRecord = {
      signal,
      analysis_id: signal.analysis_id,
      signal_id: signal.signal_id,
      created_at: new Date().toISOString(),
    };
    this.latest = record;
    return record;
  }

  getLatest(): MasterSignalRecord | null {
    return this.latest;
  }
}

export const masterSignalStore = new MasterSignalStore();