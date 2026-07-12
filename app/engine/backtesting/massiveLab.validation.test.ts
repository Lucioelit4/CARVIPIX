import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';

import { validateDatasetFile } from './massiveLab';

const prevLocalMode = process.env.CARVIPIX_ENABLE_LOCAL_DATASETS;

function withLocalDatasetsEnabled(): void {
  process.env.CARVIPIX_ENABLE_LOCAL_DATASETS = 'true';
}

function restoreLocalDatasetMode(): void {
  process.env.CARVIPIX_ENABLE_LOCAL_DATASETS = prevLocalMode;
}

function writeDataset(filePath: string, rows: Array<[number, number, number, number, number]>): void {
  const content = rows.map((r) => `${r[0]},${r[1]},${r[2]},${r[3]},${r[4]}`).join('\n');
  fs.writeFileSync(filePath, content, 'utf8');
}

test('classifies weekly-like and anomalous gaps, segments data, and reports coverage separately', async () => {
  withLocalDatasetsEnabled();
  try {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'carvipix-gap-test-'));
    const filePath = path.join(tmpDir, 'xauusd_m1_test.csv');

    const base = Date.UTC(2026, 0, 2, 21, 58, 0); // Friday 21:58 UTC
    const rows: Array<[number, number, number, number, number]> = [
      [base, 100, 101, 99, 100],
      [base + 60_000, 100.1, 101.1, 99.1, 100.1],
      // Weekly-like gap ~46h 1m
      [base + 2_767 * 60_000, 101, 102, 100, 101],
      [base + 2_768 * 60_000, 101.2, 102.2, 100.2, 101.2],
      // Anomalous long gap (~31 days)
      [base + (2_768 + 44_640) * 60_000, 103, 104, 102, 103],
      [base + (2_768 + 44_641) * 60_000, 103.2, 104.2, 102.2, 103.2],
    ];

    writeDataset(filePath, rows);

    const report = await validateDatasetFile(filePath);

    assert.equal(report.integrity.invalidRows, 0);
    assert.equal(report.largeGapsOver1h, 2);
    assert.ok(report.gapsOver1h.length >= 2);
    assert.equal(report.gapsOver1h[0].classification, 'cierre semanal normal');
    assert.equal(report.gapsOver1h[1].classification, 'periodo sin cobertura');
    assert.ok(report.coverage.coveragePct < 100);
    assert.ok(report.segments.length >= 2);
    assert.ok(report.excludedSegments.length >= 1);
    assert.equal(report.indicatorReadiness.statusDuringWarmup, 'DATA_NOT_READY');
    assert.equal(report.gapPolicy.byClassification['cierre semanal normal'].createArtificialCandles, false);
    assert.equal(report.gapPolicy.byClassification['pérdida de datos'].blockCrossGapCalculations, true);
    assert.ok(/^[a-f0-9]{64}$/.test(report.fileSha256));
  } finally {
    restoreLocalDatasetMode();
  }
});

test('keeps unknown gaps blocked and no artificial candles policy', async () => {
  withLocalDatasetsEnabled();
  try {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'carvipix-gap-test-'));
    const filePath = path.join(tmpDir, 'xauusd_m1_unknown.csv');

    const base = Date.UTC(2026, 0, 6, 10, 0, 0); // Tuesday
    const rows: Array<[number, number, number, number, number]> = [
      [base, 200, 201, 199, 200],
      [base + 60_000, 200.1, 201.1, 199.1, 200.1],
      // Midweek 2h gap should not be weekly close
      [base + 121 * 60_000, 200.4, 201.4, 199.4, 200.4],
      [base + 122 * 60_000, 200.5, 201.5, 199.5, 200.5],
    ];

    writeDataset(filePath, rows);

    const report = await validateDatasetFile(filePath);
    const unknownOrAnomalous = report.gapsOver1h.find((g) => g.classification !== 'cierre semanal normal');

    assert.ok(unknownOrAnomalous);
    assert.equal(report.gapPolicy.byClassification.desconocido.createArtificialCandles, false);
    assert.ok(report.indicatorReadiness.blockedSignalWindows.length >= 1);
  } finally {
    restoreLocalDatasetMode();
  }
});
