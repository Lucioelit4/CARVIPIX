export interface StaleAnalysisCheckInput {
  snapshotPrice: number;
  currentPrice: number;
  snapshotUtc: string;
  nowUtc: string;
  atr: number;
  expiryUtc: string | null;
  openCandlePresent: boolean;
}

export interface StaleAnalysisCheckResult {
  stale: boolean;
  reason: string | null;
}

export class StaleAnalysisValidator {
  evaluate(input: StaleAnalysisCheckInput): StaleAnalysisCheckResult {
    const timeDiffMs = Date.parse(input.nowUtc) - Date.parse(input.snapshotUtc);
    const priceDiff = Math.abs(input.currentPrice - input.snapshotPrice);
    const staleByPrice = input.atr > 0 && priceDiff > input.atr * 0.75;
    const staleByTime = timeDiffMs > 15 * 60 * 1000;
    const staleByExpiry = input.expiryUtc ? Date.parse(input.nowUtc) > Date.parse(input.expiryUtc) : false;
    const stale = staleByPrice || staleByTime || staleByExpiry || !input.openCandlePresent;

    return {
      stale,
      reason: stale ? "STALE_ANALYSIS" : null,
    };
  }
}
