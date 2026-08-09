import type { MasterSignalRecord } from "@/app/ai/cadpV2/masterSignalStore";

interface MasterSignalLifecyclePort {
  upsertFromMasterSignalRecord(record: MasterSignalRecord): Promise<unknown>;
}

interface MasterSignalDispatcherPort {
  receiveMasterSignal(
    signal: {
      signal_id: string;
      analysis_id: string;
      symbol: string;
      decision: "ENTER_BUY" | "ENTER_SELL";
      direction: "BUY" | "SELL" | "NONE";
      horizon: "SHORT" | "MEDIUM" | "EXTENDED" | null;
      validity_minutes: number | null;
      expires_at: string | null;
      source: "CADP_V2" | "CADP_V3_HISTORICAL_BRAIN";
      entry: number;
      stop_loss: number;
      take_profit: number;
      quality: "A+" | "A" | "B" | "C";
      confidence: number;
      risk_reward: number;
    },
    options?: { sendTelegram?: boolean },
  ): Promise<{ success: boolean; eventId?: string; error?: string }>;
}

export async function publishMasterSignal(
  record: MasterSignalRecord,
  dependencies: {
    lifecycle: MasterSignalLifecyclePort;
    dispatcher: MasterSignalDispatcherPort;
  },
): Promise<void> {
  await dependencies.lifecycle.upsertFromMasterSignalRecord(record);

  const { signal } = record;
  if (
    signal.direction === "NONE"
    || signal.entry === null
    || signal.stop_loss === null
    || signal.take_profit === null
  ) {
    return;
  }

  const result = await dependencies.dispatcher.receiveMasterSignal(
    {
      signal_id: signal.signal_id,
      analysis_id: signal.analysis_id,
      symbol: signal.symbol,
      decision: signal.decision as "ENTER_BUY" | "ENTER_SELL",
      direction: signal.direction,
      horizon: signal.horizon,
      validity_minutes: signal.validity_minutes,
      expires_at: signal.expires_at,
      source: signal.source,
      entry: signal.entry,
      stop_loss: signal.stop_loss,
      take_profit: signal.take_profit,
      quality: "B",
      confidence: 0,
      risk_reward: signal.calculated_net_rr ?? signal.calculated_gross_rr ?? 0,
    },
    { sendTelegram: false },
  );

  if (!result.success) {
    throw new Error(`MASTER_SIGNAL_DISPATCH_FAILED:${result.error ?? "UNKNOWN"}`);
  }
}