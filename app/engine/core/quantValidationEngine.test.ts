import assert from 'node:assert/strict';
import test from 'node:test';

import { QuantValidationEngine, type ValidationSample } from './quantValidationEngine';

function buildDataset(kind: 'baseline' | 'candidate-strong' | 'candidate-weak' | 'candidate-leak') {
  const samples: ValidationSample[] = [];
  const regimes: Array<ValidationSample['regime']> = ['trend', 'range', 'volatile', 'news'];

  for (let i = 0; i < 240; i += 1) {
    const regime = regimes[i % regimes.length];
    const trend = Math.sin(i / 18) * 0.004;
    const pulse = (i % 11 === 0 ? 1 : -1) * 0.0007;
    const jitter = (((i * 17) % 19) - 9) * 0.00011;
    const actualReturn = 0.002 + trend + pulse + jitter;
    const noise = Math.cos(i / 7) * 0.0004;

    let predictedReturn = actualReturn + noise;

    if (kind === 'baseline') {
      predictedReturn = actualReturn * 0.46 + noise * 3.2;
    }

    if (kind === 'candidate-strong') {
      predictedReturn = actualReturn * 1.09 + noise * 0.18;
    }

    if (kind === 'candidate-weak') {
      predictedReturn = (Math.sin(i / 3) - 0.5) * 0.007;
    }

    if (kind === 'candidate-leak') {
      const nextActual = 0.002 + Math.sin((i + 1) / 18) * 0.004 + (((i + 1) % 11 === 0 ? 1 : -1) * 0.0007);
      predictedReturn = nextActual;
    }

    samples.push({
      timestamp: 1_783_500_000_000 + i * 60_000,
      actualReturn,
      predictedReturn,
      regime,
    });
  }

  return samples;
}

test('quant validation approves real stable and significant improvements', () => {
  const engine = new QuantValidationEngine();
  const report = engine.validate({
    improvementId: 'improvement-alpha',
    baseline: buildDataset('baseline'),
    candidate: buildDataset('candidate-strong'),
    folds: 6,
    monteCarloRuns: 500,
    bootstrapRuns: 500,
  });

  assert.equal(report.answers.isImprovementReal, true);
  assert.equal(report.answers.isStable, true);
  assert.equal(report.answers.shouldApprove, true);
  assert.equal(report.answers.shouldReject, false);
  assert.ok(report.approvalScore >= 0.62);
  assert.equal(report.checks.length, 17);

  const names = new Set(report.checks.map((check) => check.name));
  assert.ok(names.has('Monte Carlo Engine'));
  assert.ok(names.has('Walk Forward Engine'));
  assert.ok(names.has('Cross Validation Engine'));
  assert.ok(names.has('Bootstrap Validation'));
  assert.ok(names.has('Out Of Sample Validation'));
  assert.ok(names.has('Historical Validation'));
  assert.ok(names.has('Robustness Validation'));
  assert.ok(names.has('Sensitivity Validation'));
  assert.ok(names.has('Noise Resistance'));
  assert.ok(names.has('Regime Validation'));
  assert.ok(names.has('Confidence Interval Engine'));
  assert.ok(names.has('Statistical Significance Engine'));
  assert.ok(names.has('Overfitting Detector'));
  assert.ok(names.has('Underfitting Detector'));
  assert.ok(names.has('Data Leakage Detector'));
  assert.ok(names.has('Model Drift Detector'));
  assert.ok(names.has('Performance Drift Detector'));
});

test('quant validation rejects weak improvements and flags instability', () => {
  const engine = new QuantValidationEngine();
  const report = engine.validate({
    improvementId: 'improvement-weak',
    baseline: buildDataset('baseline'),
    candidate: buildDataset('candidate-weak'),
    folds: 5,
    monteCarloRuns: 400,
    bootstrapRuns: 400,
  });

  assert.equal(report.answers.shouldReject, true);
  assert.equal(report.answers.shouldApprove, false);
  assert.ok(report.approvalScore < 0.62);
});

test('quant validation detects likely data leakage', () => {
  const engine = new QuantValidationEngine();
  const report = engine.validate({
    improvementId: 'improvement-leak',
    baseline: buildDataset('baseline'),
    candidate: buildDataset('candidate-leak'),
    folds: 5,
  });

  assert.equal(report.detectors.dataLeakage, true);
  assert.equal(report.answers.shouldReject, true);
});

test('validation history and dashboard aggregate outcomes', () => {
  const engine = new QuantValidationEngine();

  engine.validate({
    improvementId: 'dashboard-1',
    baseline: buildDataset('baseline'),
    candidate: buildDataset('candidate-strong'),
  });

  engine.validate({
    improvementId: 'dashboard-2',
    baseline: buildDataset('baseline'),
    candidate: buildDataset('candidate-weak'),
  });

  const history = engine.getValidationHistory();
  const dashboard = engine.getValidationDashboard();

  assert.equal(history.length, 2);
  assert.equal(dashboard.totalReports, 2);
  assert.ok(dashboard.approvals >= 1);
  assert.ok(dashboard.rejections >= 1);
  assert.ok(dashboard.latestReport);
  assert.ok(dashboard.averageApprovalScore >= 0);
  assert.ok(dashboard.averageApprovalScore <= 1);
});
