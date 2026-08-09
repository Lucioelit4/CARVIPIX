export interface WaitDeduplicationCandidate {
  analysis_id: string;
  canonical_symbol: string;
  status: string;
  response_valid: boolean;
  decision: string | null;
  scenario_signature?: string;
  recorded_at_ms?: number;
  timestamp_utc_ms: number;
}

export function findReusableWait<T extends WaitDeduplicationCandidate>(input: {
  candidates: T[];
  symbol: string;
  scenarioSignature: string;
  ttlMs: number;
  nowMs?: number;
}): T | undefined {
  const nowMs = input.nowMs ?? Date.now();
  return input.candidates.find((candidate) =>
    candidate.status === "COMPLETED"
    && candidate.response_valid
    && candidate.decision === "WAIT"
    && candidate.canonical_symbol === input.symbol
    && candidate.scenario_signature === input.scenarioSignature
    && nowMs - (candidate.recorded_at_ms ?? candidate.timestamp_utc_ms) <= input.ttlMs
  );
}