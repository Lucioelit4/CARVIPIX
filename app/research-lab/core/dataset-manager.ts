import {
  DatasetIssue,
  DatasetProfile,
  ResearchDataPoint,
  ResearchDatasetInput,
} from './types';

export interface DatasetManagerConfig {
  maxSpreadAbs: number;
}

const defaultConfig: DatasetManagerConfig = {
  maxSpreadAbs: 10,
};

export class DatasetManager {
  private readonly config: DatasetManagerConfig;

  constructor(config: Partial<DatasetManagerConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  ingest(input: ResearchDatasetInput): DatasetProfile {
    const issues: DatasetIssue[] = [];
    const normalizedRecords: ResearchDataPoint[] = [];
    const rawRecords = input.records;
    const simulated = input.certification === 'SIMULATED' || /demo|simulat/i.test(input.source);

    if (rawRecords.length === 0) {
      issues.push({
        code: 'EMPTY_DATASET',
        severity: 'critical',
        message: 'Dataset has no records.',
      });
    }

    let lastRawTimestamp = Number.NEGATIVE_INFINITY;

    rawRecords.forEach((record, index) => {
      if (typeof record.timestamp === 'number' && record.timestamp < lastRawTimestamp) {
        issues.push({
          code: 'OUT_OF_ORDER',
          severity: 'critical',
          message: 'Dataset arrived out of order.',
          index,
          timestamp: record.timestamp,
        });
      }

      if (typeof record.timestamp === 'number') {
        lastRawTimestamp = record.timestamp;
      }

      const normalized = this.normalizeRecord(record, index, issues);
      if (normalized) {
        normalizedRecords.push(normalized);
      }
    });

    normalizedRecords.sort((left, right) => left.timestamp - right.timestamp);

    const inferredIntervalMs = this.inferInterval(normalizedRecords);
    let previousTimestamp: number | undefined;

    normalizedRecords.forEach((record) => {
      if (previousTimestamp === record.timestamp) {
        issues.push({
          code: 'DUPLICATE_TIMESTAMP',
          severity: 'critical',
          message: 'Duplicate timestamp detected in dataset.',
          timestamp: record.timestamp,
        });
      }

      if (
        previousTimestamp !== undefined &&
        inferredIntervalMs !== undefined &&
        record.timestamp - previousTimestamp > inferredIntervalMs
      ) {
        const missing = Math.max(Math.floor((record.timestamp - previousTimestamp) / inferredIntervalMs) - 1, 0);
        if (missing > 0) {
          issues.push({
            code: 'MISSING_INTERVAL',
            severity: 'warning',
            message: 'Dataset has missing intervals.',
            timestamp: record.timestamp,
            meta: { missing },
          });
        }
      }

      previousTimestamp = record.timestamp;
    });

    const invalidRecordCount = issues.filter((issue) => issue.severity === 'critical').length;
    const recordCount = rawRecords.length;
    const validRecordCount = normalizedRecords.length;
    const coverage = recordCount === 0 ? 0 : validRecordCount / recordCount;
    const valid = issues.every((issue) => issue.severity !== 'critical');

    return {
      datasetId: input.datasetId,
      asset: input.asset,
      timeframe: input.timeframe,
      source: input.source,
      certification: input.certification,
      partialApprovalAuthorized: input.partialApprovalAuthorized ?? false,
      checksum: input.checksum,
      schemaVersion: input.schemaVersion,
      receivedAt: input.receivedAt,
      simulated,
      valid,
      usable: valid && validRecordCount > 0,
      recordCount: input.rowCount ?? recordCount,
      validRecordCount,
      invalidRecordCount,
      coverage,
      inferredIntervalMs,
      normalizedRecords,
      issues,
    };
  }

  private normalizeRecord(
    record: Partial<ResearchDataPoint>,
    index: number,
    issues: DatasetIssue[],
  ): ResearchDataPoint | undefined {
    const required = ['timestamp', 'open', 'high', 'low', 'close'] as const;
    const missingField = required.find((field) => typeof record[field] !== 'number' || !Number.isFinite(record[field] as number));
    const completeness = typeof record.completeness === 'number' ? record.completeness : 1;

    if (missingField || completeness < 1) {
      issues.push({
        code: 'INCOMPLETE_RECORD',
        severity: 'critical',
        message: 'Dataset record is incomplete.',
        index,
        timestamp: record.timestamp,
        meta: { missingField, completeness },
      });
      return undefined;
    }

    if (!Number.isInteger(record.timestamp) || (record.timestamp as number) <= 0) {
      issues.push({
        code: 'INVALID_TIMESTAMP',
        severity: 'critical',
        message: 'Dataset record has invalid timestamp.',
        index,
        timestamp: record.timestamp,
      });
      return undefined;
    }

    const normalized: ResearchDataPoint = {
      timestamp: record.timestamp as number,
      open: record.open as number,
      high: record.high as number,
      low: record.low as number,
      close: record.close as number,
      volume: record.volume,
      spread: record.spread,
      latencyMs: record.latencyMs,
      completeness,
      source: record.source,
      metadata: record.metadata,
    };

    if (
      normalized.open <= 0 ||
      normalized.high <= 0 ||
      normalized.low <= 0 ||
      normalized.close <= 0 ||
      normalized.high < normalized.low ||
      normalized.open > normalized.high ||
      normalized.open < normalized.low ||
      normalized.close > normalized.high ||
      normalized.close < normalized.low
    ) {
      issues.push({
        code: 'CORRUPT_PRICE',
        severity: 'critical',
        message: 'Dataset record contains corrupt prices.',
        index,
        timestamp: normalized.timestamp,
      });
      return undefined;
    }

    if (
      normalized.spread !== undefined &&
      (!Number.isFinite(normalized.spread) || normalized.spread < 0 || normalized.spread > this.config.maxSpreadAbs)
    ) {
      issues.push({
        code: 'INVALID_SPREAD',
        severity: 'critical',
        message: 'Dataset record contains invalid spread.',
        index,
        timestamp: normalized.timestamp,
        meta: { spread: normalized.spread },
      });
      return undefined;
    }

    return normalized;
  }

  private inferInterval(records: ResearchDataPoint[]): number | undefined {
    const deltas: number[] = [];

    for (let index = 1; index < records.length; index += 1) {
      const delta = records[index].timestamp - records[index - 1].timestamp;
      if (delta > 0) {
        deltas.push(delta);
      }
    }

    if (deltas.length === 0) {
      return undefined;
    }

    return Math.min(...deltas);
  }
}