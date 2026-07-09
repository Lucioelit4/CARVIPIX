import { createHash } from "node:crypto";

import type {
  DownloadBatchRequest,
  InstitutionalCandleRecord,
  QualityAssessmentResult,
  QualityIssue,
  WarehouseTimeframe,
} from "./types";

const TIMEFRAME_MS: Record<Exclude<WarehouseTimeframe, "Tick">, number> = {
  S1: 1000,
  M1: 60_000,
  M5: 300_000,
  M15: 900_000,
  M30: 1_800_000,
  H1: 3_600_000,
  H4: 14_400_000,
  D1: 86_400_000,
  W1: 604_800_000,
  MN1: 2_592_000_000,
};

export class WarehouseQualityEngine {
  assess(batch: DownloadBatchRequest): QualityAssessmentResult {
    const issues: QualityIssue[] = [];
    if (batch.sourceTimezone && batch.sourceTimezone.toUpperCase() !== "UTC") {
      issues.push({
        code: "invalid_timezone",
        severity: "error",
        message: `Only UTC source timezone is accepted. Received ${batch.sourceTimezone}.`,
      });
    }
    const rows = [...batch.rows].sort((left, right) => (left.timestampUtc ?? 0) - (right.timestampUtc ?? 0));
    const normalizedRows: InstitutionalCandleRecord[] = [];
    const seenTimestamps = new Set<number>();

    let duplicatesRemoved = 0;
    let correctedRows = 0;
    let missingData = 0;
    let errorCount = 0;

    for (let index = 0; index < rows.length; index += 1) {
      const current = rows[index];
      const previous = normalizedRows[normalizedRows.length - 1];
      const normalized = this.normalizeRow(batch, current);

      if (seenTimestamps.has(normalized.timestampUtc)) {
        duplicatesRemoved += 1;
        issues.push({
          code: "duplicate_timestamp",
          severity: "error",
          message: `Duplicate timestamp removed: ${normalized.timestampUtc}`,
          timestampUtc: normalized.timestampUtc,
        });
        errorCount += 1;
        continue;
      }

      if (normalized.high < normalized.low || normalized.open <= 0 || normalized.close <= 0) {
        issues.push({
          code: "invalid_ohlc",
          severity: "critical",
          message: "Invalid OHLC values detected.",
          timestampUtc: normalized.timestampUtc,
        });
        errorCount += 1;
        continue;
      }

      if (normalized.open > normalized.high || normalized.open < normalized.low || normalized.close > normalized.high || normalized.close < normalized.low) {
        issues.push({
          code: "invalid_ohlc",
          severity: "error",
          message: "Open/Close outside High/Low range.",
          timestampUtc: normalized.timestampUtc,
        });
        errorCount += 1;
        continue;
      }

      if (normalized.spread !== null && normalized.spread < 0) {
        issues.push({
          code: "negative_spread",
          severity: "critical",
          message: "Negative spread rejected.",
          timestampUtc: normalized.timestampUtc,
        });
        errorCount += 1;
        continue;
      }

      if ((normalized.bid !== null && normalized.ask === null) || (normalized.bid === null && normalized.ask !== null)) {
        issues.push({
          code: "invalid_bid_ask",
          severity: "error",
          message: "Bid/Ask must be provided together or omitted together.",
          timestampUtc: normalized.timestampUtc,
        });
        errorCount += 1;
        continue;
      }

      if (normalized.bid !== null && normalized.ask !== null && normalized.ask < normalized.bid) {
        issues.push({
          code: "invalid_bid_ask",
          severity: "critical",
          message: "Ask cannot be lower than bid.",
          timestampUtc: normalized.timestampUtc,
        });
        errorCount += 1;
        continue;
      }

      if (normalized.volume !== null && normalized.volume < 0) {
        issues.push({
          code: "invalid_volume",
          severity: "error",
          message: "Negative volume rejected.",
          timestampUtc: normalized.timestampUtc,
        });
        errorCount += 1;
        continue;
      }

      if (normalized.tickVolume !== null && normalized.tickVolume < 0) {
        issues.push({
          code: "invalid_volume",
          severity: "error",
          message: "Negative tick volume rejected.",
          timestampUtc: normalized.timestampUtc,
        });
        errorCount += 1;
        continue;
      }

      if (previous && previous.timestampUtc >= normalized.timestampUtc) {
        issues.push({
          code: "timestamp_order",
          severity: "critical",
          message: "Timestamp order violation detected.",
          timestampUtc: normalized.timestampUtc,
        });
        errorCount += 1;
        continue;
      }

      const incompleteness = this.isIncomplete(normalized);
      if (incompleteness) {
        missingData += 1;
        issues.push({
          code: "incomplete_row",
          severity: "warning",
          message: "Incomplete market row persisted with degraded coverage.",
          timestampUtc: normalized.timestampUtc,
        });
      }

      if (normalized.bid === null || normalized.ask === null) {
        issues.push({
          code: "missing_bid_ask",
          severity: "warning",
          message: "Bid/Ask missing; spread preserved if possible.",
          timestampUtc: normalized.timestampUtc,
        });
      }

      if (previous) {
        const expectedStep = this.resolveTimeframeMs(normalized.timeframe);
        if (expectedStep !== null && normalized.timestampUtc - previous.timestampUtc > expectedStep * 1.5) {
          missingData += 1;
          issues.push({
            code: "temporal_gap",
            severity: "warning",
            message: `Temporal gap detected between ${previous.timestampUtc} and ${normalized.timestampUtc}.`,
            timestampUtc: normalized.timestampUtc,
          });
        }
      }

      if (normalized.corrected) {
        correctedRows += 1;
      }

      seenTimestamps.add(normalized.timestampUtc);
      normalizedRows.push(normalized);
    }

    const qualityScore = this.calculateQualityScore(rows.length, normalizedRows.length, duplicatesRemoved, missingData, errorCount);
    const coverage = rows.length === 0 ? 0 : Number(((normalizedRows.length / rows.length) * 100).toFixed(2));

    return {
      normalizedRows,
      issues,
      missingData,
      duplicatesRemoved,
      correctedRows,
      qualityScore,
      coverage,
      certified: errorCount === 0 && normalizedRows.length > 0 && !issues.some((issue) => issue.code === "invalid_timezone"),
    };
  }

  checksumForRows(rows: InstitutionalCandleRecord[]): string {
    const hash = createHash("sha256");
    hash.update(JSON.stringify(rows));
    return hash.digest("hex");
  }

  private normalizeRow(batch: DownloadBatchRequest, row: Partial<InstitutionalCandleRecord>): InstitutionalCandleRecord {
    const bid = row.bid ?? null;
    const ask = row.ask ?? null;
    const spread = row.spread ?? (bid !== null && ask !== null ? Number((ask - bid).toFixed(8)) : null);
    const corrected = row.corrected ?? (row.spread === undefined && spread !== null);

    return {
      symbol: batch.symbol,
      timeframe: batch.timeframe,
      timestampUtc: row.timestampUtc ?? 0,
      open: row.open ?? 0,
      high: row.high ?? 0,
      low: row.low ?? 0,
      close: row.close ?? 0,
      bid,
      ask,
      spread,
      volume: row.volume ?? null,
      tickVolume: row.tickVolume ?? null,
      provider: batch.provider,
      origin: row.origin ?? batch.origin,
      checksum: row.checksum ?? "pending",
      version: row.version ?? batch.version,
      qualityScore: row.qualityScore ?? 0,
      coverage: row.coverage ?? 0,
      dataStatus: row.dataStatus ?? "normalized",
      context: row.context ?? {
        session: "off_session",
        market: "fx",
        volatility: 0,
        liquidity: 0,
        spread: spread ?? 0,
        marketState: "open",
        news: [],
        economicCalendar: [],
        holidays: [],
        tradingHour: 0,
        daylightSavingShift: false,
        classifications: [],
      },
      corrected,
      certified: false,
    };
  }

  private calculateQualityScore(total: number, accepted: number, duplicates: number, missingData: number, errors: number): number {
    if (total === 0) {
      return 0;
    }

    const acceptance = accepted / total;
    const duplicatePenalty = duplicates / total;
    const missingPenalty = missingData / total;
    const errorPenalty = errors / total;

    const score = 100 * acceptance - duplicatePenalty * 20 - missingPenalty * 15 - errorPenalty * 40;
    return Number(Math.max(0, Math.min(100, score)).toFixed(2));
  }

  private resolveTimeframeMs(timeframe: WarehouseTimeframe): number | null {
    if (timeframe === "Tick") {
      return null;
    }
    return TIMEFRAME_MS[timeframe];
  }

  private isIncomplete(row: InstitutionalCandleRecord): boolean {
    return row.volume === null || row.coverage < 100 || row.bid === null || row.ask === null;
  }
}
