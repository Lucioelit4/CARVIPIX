import test from 'node:test';
import assert from 'node:assert/strict';

import { CARVIPIXEngine } from './engine';
import { QuantOptimizationEngine } from './quantOptimizationEngine';
import type { QuantOptimizationInput } from '../types';

function buildInput(): QuantOptimizationInput {
  return {
    baseConfiguration: {
      id: 'base',
      parameters: {
        alpha: 0.5,
        beta: 0.5,
      },
      weights: {
        evidence: 0.5,
        confidence: 0.5,
      },
      thresholds: {
        quality: 0.55,
        risk: 0.45,
      },
      features: ['trend', 'context'],
    },
    parameterSpace: {
      alpha: { min: 0.2, max: 0.9, step: 0.1 },
      beta: { min: 0.2, max: 0.9, step: 0.1 },
    },
    weightSpace: {
      evidence: { min: 0.1, max: 1, step: 0.1 },
      confidence: { min: 0.1, max: 1, step: 0.1 },
    },
    thresholdSpace: {
      quality: { min: 0.3, max: 0.9, step: 0.05 },
      risk: { min: 0.2, max: 0.8, step: 0.05 },
    },
    featureCandidates: ['trend', 'context', 'volatility', 'structure', 'session'],
    objectives: [
      { metric: 'edge', direction: 'maximize', weight: 0.3 },
      { metric: 'stability', direction: 'maximize', weight: 0.25 },
      { metric: 'robustness', direction: 'maximize', weight: 0.2 },
      { metric: 'consistency', direction: 'maximize', weight: 0.25 },
    ],
    constraints: [
      { target: 'weights', key: 'evidence', min: 0.2, max: 0.95 },
      { target: 'weights', key: 'confidence', min: 0.2, max: 0.95 },
      { target: 'thresholds', key: 'risk', min: 0.25, max: 0.75 },
    ],
    featureConstraints: {
      required: ['trend'],
      forbidden: ['legacy-broken-feature'],
    },
    search: {
      gridSamples: 10,
      randomSamples: 14,
      bayesianIterations: 8,
      seed: 42,
    },
  };
}

test('runs full quant optimization and answers best config improvements worsened and discard decisions', () => {
  const engine = new QuantOptimizationEngine();
  const result = engine.optimize(buildInput());

  assert.ok(result.bestConfiguration.id.length > 0);
  assert.ok(result.bestEvaluation.multiObjectiveScore > 0);
  assert.ok(result.ranking.length > 0);
  assert.ok(result.optimizationRanking.length > 0);
  assert.ok(Array.isArray(result.weightOptimizer.improved));
  assert.ok(Array.isArray(result.weightOptimizer.worsened));
  assert.ok(result.report.some((line) => /Best configuration/i.test(line)));
  assert.ok(result.diagnostics.totalEvaluated >= 1);
});

test('uses optimization cache and persists optimization history and dashboard', () => {
  const engine = new QuantOptimizationEngine();
  const input = buildInput();

  const first = engine.optimize(input);
  const second = engine.optimize(input);

  assert.ok(first.diagnostics.totalEvaluated >= 1);
  assert.ok(second.diagnostics.cacheHits >= 1);

  const history = engine.getHistory();
  const dashboard = engine.getDashboard();

  assert.ok(history.length >= 2);
  assert.ok(dashboard.totalRuns >= 2);
  assert.ok(dashboard.topCandidates.length >= 1);
});

test('applies constraints and discards invalid configurations', () => {
  const engine = new QuantOptimizationEngine();
  const input = buildInput();
  input.constraints = [
    { target: 'weights', key: 'evidence', min: 0.95, max: 1 },
    { target: 'weights', key: 'confidence', min: 0.95, max: 1 },
    { target: 'parameters', key: 'alpha', min: 0.9, max: 1 },
  ];

  const result = engine.optimize(input);

  assert.ok(result.discarded.length > 0);
  assert.ok(result.diagnostics.discarded > 0);
});

test('integrates quant optimization through CARVIPIXEngine APIs', () => {
  const engine = new CARVIPIXEngine();
  const result = engine.runQuantOptimization(buildInput());

  assert.ok(result.bestConfiguration.id.length > 0);
  assert.ok(engine.getQuantOptimizationHistory().length >= 1);
  assert.ok(engine.getQuantOptimizationDashboard().totalRuns >= 1);
});
