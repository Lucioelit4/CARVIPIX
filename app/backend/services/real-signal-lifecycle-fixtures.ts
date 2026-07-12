export type RealSignalDecisionFixture =
  | "ENTER_BUY"
  | "ENTER_SELL"
  | "CONDITIONAL_ENTRY"
  | "WAIT"
  | "NO_TRADE"
  | "DATA_INSUFFICIENT"
  | "ENTRY_MISSED"
  | "NEWS_VERIFICATION_REQUIRED";

export type RealSignalLifecycleStatusFixture =
  | "CREATED"
  | "CONDITIONAL"
  | "ACTIVE"
  | "CANCELLED"
  | "EXPIRED"
  | "TP_HIT"
  | "SL_HIT"
  | "CLOSED";

const AUDIT_ONLY_DECISIONS = new Set<RealSignalDecisionFixture>(["WAIT", "NO_TRADE", "DATA_INSUFFICIENT"]);

export function isEntryDecision(decision: RealSignalDecisionFixture): boolean {
  return !AUDIT_ONLY_DECISIONS.has(decision);
}

export function buildLifecycleFixture(seed: {
  signalId: string;
  analysisId: string;
  symbol: string;
  decision: RealSignalDecisionFixture;
  strategyId: string;
}): Array<{ status: RealSignalLifecycleStatusFixture; realizedPnl: number }> {
  if (!seed.signalId || !seed.analysisId || !seed.symbol || !seed.strategyId) {
    return [];
  }

  if (!isEntryDecision(seed.decision)) {
    return [{ status: "CLOSED", realizedPnl: 0 }];
  }

  if (seed.decision === "CONDITIONAL_ENTRY") {
    return [
      { status: "CREATED", realizedPnl: 0 },
      { status: "CONDITIONAL", realizedPnl: 0 },
      { status: "ACTIVE", realizedPnl: 0 },
      { status: "TP_HIT", realizedPnl: 125.5 },
    ];
  }

  return [
    { status: "CREATED", realizedPnl: 0 },
    { status: "ACTIVE", realizedPnl: 0 },
    { status: "TP_HIT", realizedPnl: 125.5 },
  ];
}
