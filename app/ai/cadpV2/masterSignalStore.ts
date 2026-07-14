import type { CadpShadowSignal } from "./types";

export interface MasterSignalRecord {
  signal: CadpShadowSignal;
  analysis_id: string;
  signal_id: string;
  created_at: string;
}

type MasterSignalPublishHandler = (record: MasterSignalRecord) => void | Promise<void>;

export class MasterSignalStore {
  private latest: MasterSignalRecord | null = null;
  private publishHandler: MasterSignalPublishHandler | null = null;
  private fallbackPublishInFlight = false;

  setPublishHandler(handler: MasterSignalPublishHandler | null): void {
    this.publishHandler = handler;
  }

  save(signal: CadpShadowSignal): MasterSignalRecord {
    const record: MasterSignalRecord = {
      signal,
      analysis_id: signal.analysis_id,
      signal_id: signal.signal_id,
      created_at: new Date().toISOString(),
    };
    this.latest = record;

    // Fire-and-forget persistence so CADP flow is not blocked by storage latency.
    if (this.publishHandler) {
      Promise.resolve(this.publishHandler(record)).catch(() => {
        // Avoid throwing from store save path; observability is handled by publisher implementation.
      });
    } else if (!this.fallbackPublishInFlight && typeof window === "undefined") {
      this.fallbackPublishInFlight = true;
      Promise.resolve()
        .then(async () => {
          const module = await import("@/app/backend/services/real-signal-lifecycle-service");
          await module.realSignalLifecycleService.upsertFromMasterSignalRecord(record);
        })
        .catch(() => {
          // Keep master signal availability even if persistence bridge is temporarily unavailable.
        })
        .finally(() => {
          this.fallbackPublishInFlight = false;
        });
    }

    return record;
  }

  getLatest(): MasterSignalRecord | null {
    return this.latest;
  }
}

export const masterSignalStore = new MasterSignalStore();