type MarketRegime = 'trend' | 'range' | 'volatile' | 'news' | 'unknown';

export interface ValidationSample {
  timestamp: number;
  actualReturn: number;
  predictedReturn: number;
  regime?: MarketRegime;
}

export interface QuantValidationInput {
  improvementId: string;
  baseline: ValidationSample[];
  candidate: ValidationSample[];
  outOfSampleRatio?: number;
  folds?: number;
  monteCarloRuns?: number;
  bootstrapRuns?: number;
  noiseLevels?: number[];
}

export interface ValidationCheck {
  name: string;
  score: number;
  passed: boolean;
  details: Record<string, number | string | boolean>;
}

export interface ValidationAnswers {
  isImprovementReal: boolean;
  isStable: boolean;
  wasLuck: boolean;
  shouldApprove: boolean;
  shouldReject: boolean;
}

export interface ValidationReport {
  id: string;
  generatedAt: number;
  improvementId: string;
  checks: ValidationCheck[];
  confidenceInterval: {
    lower: number;
    upper: number;
  };
  significance: {
    pValue: number;
    isSignificant: boolean;
  };
  drifts: {
    modelDrift: number;
    performanceDrift: number;
  };
  detectors: {
    overfitting: boolean;
    underfitting: boolean;
    dataLeakage: boolean;
  };
  answers: ValidationAnswers;
  approvalScore: number;
}

export interface ValidationDashboard {
  totalReports: number;
  approvals: number;
  rejections: number;
  approvalRate: number;
  averageApprovalScore: number;
  averagePValue: number;
  averageModelDrift: number;
  averagePerformanceDrift: number;
  falseLuckRate: number;
  stableRate: number;
  latestReport: ValidationReport | null;
}

interface PerformanceSnapshot {
  meanReturn: number;
  volatility: number;
  hitRate: number;
  mse: number;
  composite: number;
}

const DEFAULT_OUT_OF_SAMPLE_RATIO = 0.3;
const DEFAULT_FOLDS = 5;
const DEFAULT_MONTE_CARLO_RUNS = 400;
const DEFAULT_BOOTSTRAP_RUNS = 400;
const DEFAULT_NOISE_LEVELS = [0.02, 0.05, 0.08, 0.1];

function clamp01(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(1, value));
}

function mean(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  let total = 0;
  for (const value of values) {
    total += value;
  }

  return total / values.length;
}

function variance(values: number[]): number {
  if (values.length <= 1) {
    return 0;
  }

  const avg = mean(values);
  let acc = 0;
  for (const value of values) {
    const delta = value - avg;
    acc += delta * delta;
  }

  return acc / (values.length - 1);
}

function std(values: number[]): number {
  return Math.sqrt(variance(values));
}

function normalCdf(x: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp((-x * x) / 2);
  const poly =
    d *
    t *
    (0.3193815 +
      t *
        (-0.3565638 +
          t *
            (1.781478 +
              t *
                (-1.821256 +
                  t * 1.330274))));

  const approx = x > 0 ? 1 - poly : poly;
  return clamp01(approx);
}

function seedFrom(value: string): number {
  let seed = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    seed ^= value.charCodeAt(i);
    seed = (seed * 16777619) >>> 0;
  }

  return seed >>> 0;
}

function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let result = Math.imul(t ^ (t >>> 15), 1 | t);
    result ^= result + Math.imul(result ^ (result >>> 7), 61 | result);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

function gaussian(random: () => number): number {
  const u1 = Math.max(1e-9, random());
  const u2 = Math.max(1e-9, random());
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

function percentile(values: number[], p: number): number {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const rank = clamp01(p) * (sorted.length - 1);
  const low = Math.floor(rank);
  const high = Math.ceil(rank);

  if (low === high) {
    return sorted[low];
  }

  const weight = rank - low;
  return sorted[low] * (1 - weight) + sorted[high] * weight;
}

function alignSamples(left: ValidationSample[], right: ValidationSample[]): [ValidationSample[], ValidationSample[]] {
  const n = Math.min(left.length, right.length);
  return [left.slice(0, n), right.slice(0, n)];
}

function evaluatePerformance(samples: ValidationSample[]): PerformanceSnapshot {
  if (samples.length === 0) {
    return { meanReturn: 0, volatility: 0, hitRate: 0, mse: 1, composite: 0 };
  }

  const returns = samples.map((sample) => sample.actualReturn);
  const errors = samples.map((sample) => {
    const diff = sample.predictedReturn - sample.actualReturn;
    return diff * diff;
  });

  let hits = 0;
  for (const sample of samples) {
    const actualSign = Math.sign(sample.actualReturn);
    const predictedSign = Math.sign(sample.predictedReturn);
    if (actualSign === predictedSign) {
      hits += 1;
    }
  }

  const meanReturn = mean(returns);
  const volatility = std(returns);
  const hitRate = hits / samples.length;
  const mse = mean(errors);
  const normalizedMse = mse / (mse + 0.01);
  const returnScore = clamp01(0.5 + meanReturn * 5);
  const stabilityScore = clamp01(1 - Math.min(volatility, 0.25) / 0.25);
  const errorScore = clamp01(1 - normalizedMse);
  const composite = clamp01(returnScore * 0.4 + hitRate * 0.3 + stabilityScore * 0.15 + errorScore * 0.15);

  return {
    meanReturn,
    volatility,
    hitRate,
    mse,
    composite,
  };
}

export class QuantValidationEngine {
  private readonly history: ValidationReport[] = [];

  validate(input: QuantValidationInput): ValidationReport {
    const [baseline, candidate] = alignSamples(input.baseline, input.candidate);
    if (baseline.length < 30 || candidate.length < 30) {
      throw new Error('QuantValidationEngine requires at least 30 aligned samples');
    }

    const monteCarloRuns = input.monteCarloRuns ?? DEFAULT_MONTE_CARLO_RUNS;
    const bootstrapRuns = input.bootstrapRuns ?? DEFAULT_BOOTSTRAP_RUNS;
    const folds = input.folds ?? DEFAULT_FOLDS;
    const outOfSampleRatio = input.outOfSampleRatio ?? DEFAULT_OUT_OF_SAMPLE_RATIO;
    const noiseLevels = input.noiseLevels ?? DEFAULT_NOISE_LEVELS;

    const historical = this.runHistoricalValidation(baseline, candidate);
    const outOfSample = this.runOutOfSampleValidation(baseline, candidate, outOfSampleRatio);
    const crossValidation = this.runCrossValidationEngine(baseline, candidate, folds);
    const walkForward = this.runWalkForwardEngine(baseline, candidate, folds);
    const bootstrap = this.runBootstrapValidation(baseline, candidate, bootstrapRuns, input.improvementId);
    const monteCarlo = this.runMonteCarloEngine(baseline, candidate, monteCarloRuns, input.improvementId);
    const robustness = this.runRobustnessValidation([
      historical.score,
      outOfSample.score,
      crossValidation.score,
      walkForward.score,
      bootstrap.score,
      monteCarlo.score,
    ]);
    const sensitivity = this.runSensitivityValidation(candidate);
    const noiseResistance = this.runNoiseResistanceValidation(candidate, noiseLevels, input.improvementId);
    const regime = this.runRegimeValidation(baseline, candidate);

    const confidenceInterval = this.runConfidenceIntervalEngine(bootstrap.distribution);
    const significance = this.runStatisticalSignificanceEngine(bootstrap.distribution);
    const overfitting = this.runOverfittingDetector(walkForward.trainScores, walkForward.validationScores);
    const underfitting = this.runUnderfittingDetector(historical.score, outOfSample.score);
    const dataLeakage = this.runDataLeakageDetector(candidate);
    const modelDrift = this.runModelDriftDetector(candidate);
    const performanceDrift = this.runPerformanceDriftDetector(candidate);

    const checks: ValidationCheck[] = [
      { name: 'Monte Carlo Engine', score: monteCarlo.score, passed: monteCarlo.score >= 0.55, details: { winRate: monteCarlo.winRate } },
      { name: 'Walk Forward Engine', score: walkForward.score, passed: walkForward.score >= 0.55, details: { folds: walkForward.folds } },
      { name: 'Cross Validation Engine', score: crossValidation.score, passed: crossValidation.score >= 0.55, details: { folds } },
      { name: 'Bootstrap Validation', score: bootstrap.score, passed: bootstrap.score >= 0.55, details: { runs: bootstrapRuns } },
      { name: 'Out Of Sample Validation', score: outOfSample.score, passed: outOfSample.score >= 0.55, details: { ratio: outOfSampleRatio } },
      { name: 'Historical Validation', score: historical.score, passed: historical.score >= 0.55, details: { samples: baseline.length } },
      { name: 'Robustness Validation', score: robustness.score, passed: robustness.score >= 0.55, details: { spread: robustness.spread } },
      { name: 'Sensitivity Validation', score: sensitivity.score, passed: sensitivity.score >= 0.55, details: { thresholds: sensitivity.thresholds } },
      { name: 'Noise Resistance', score: noiseResistance.score, passed: noiseResistance.score >= 0.55, details: { averageRetention: noiseResistance.averageRetention } },
      { name: 'Regime Validation', score: regime.score, passed: regime.score >= 0.55, details: { regimes: regime.regimes } },
      { name: 'Confidence Interval Engine', score: confidenceInterval.score, passed: confidenceInterval.lower > 0, details: { lower: confidenceInterval.lower, upper: confidenceInterval.upper } },
      { name: 'Statistical Significance Engine', score: significance.score, passed: significance.isSignificant, details: { pValue: significance.pValue } },
      { name: 'Overfitting Detector', score: overfitting.score, passed: !overfitting.detected, details: { gap: overfitting.gap } },
      { name: 'Underfitting Detector', score: underfitting.score, passed: !underfitting.detected, details: { historical: historical.score, outOfSample: outOfSample.score } },
      { name: 'Data Leakage Detector', score: dataLeakage.score, passed: !dataLeakage.detected, details: { leadCorrelation: dataLeakage.leadCorrelation } },
      { name: 'Model Drift Detector', score: modelDrift.score, passed: modelDrift.drift < 0.2, details: { drift: modelDrift.drift } },
      {
        name: 'Performance Drift Detector',
        score: performanceDrift.score,
        passed: performanceDrift.drift < 0.2,
        details: { drift: performanceDrift.drift },
      },
    ];

    const approvalScore = clamp01(mean(checks.map((check) => check.score)));
    const criticalFailure =
      overfitting.detected ||
      underfitting.detected ||
      dataLeakage.detected ||
      !significance.isSignificant ||
      confidenceInterval.lower <= 0;

    const answers: ValidationAnswers = {
      isImprovementReal: significance.isSignificant && confidenceInterval.lower > 0,
      isStable: robustness.score >= 0.55 && noiseResistance.score >= 0.55 && regime.score >= 0.55,
      wasLuck: monteCarlo.winRate < 0.55 || bootstrap.positiveRate < 0.55,
      shouldApprove: approvalScore >= 0.62 && !criticalFailure,
      shouldReject: approvalScore < 0.5 || criticalFailure,
    };

    const report: ValidationReport = {
      id: `qv_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
      generatedAt: Date.now(),
      improvementId: input.improvementId,
      checks,
      confidenceInterval: {
        lower: confidenceInterval.lower,
        upper: confidenceInterval.upper,
      },
      significance: {
        pValue: significance.pValue,
        isSignificant: significance.isSignificant,
      },
      drifts: {
        modelDrift: modelDrift.drift,
        performanceDrift: performanceDrift.drift,
      },
      detectors: {
        overfitting: overfitting.detected,
        underfitting: underfitting.detected,
        dataLeakage: dataLeakage.detected,
      },
      answers,
      approvalScore,
    };

    this.history.push(report);
    return report;
  }

  getValidationHistory(limit = 50): ValidationReport[] {
    const size = Math.max(1, Math.min(1000, Math.trunc(limit)));
    return this.history.slice(-size).reverse();
  }

  getValidationDashboard(): ValidationDashboard {
    if (this.history.length === 0) {
      return {
        totalReports: 0,
        approvals: 0,
        rejections: 0,
        approvalRate: 0,
        averageApprovalScore: 0,
        averagePValue: 1,
        averageModelDrift: 0,
        averagePerformanceDrift: 0,
        falseLuckRate: 0,
        stableRate: 0,
        latestReport: null,
      };
    }

    const approvals = this.history.filter((report) => report.answers.shouldApprove).length;
    const rejections = this.history.filter((report) => report.answers.shouldReject).length;
    const falseLuck = this.history.filter((report) => report.answers.wasLuck).length;
    const stable = this.history.filter((report) => report.answers.isStable).length;

    return {
      totalReports: this.history.length,
      approvals,
      rejections,
      approvalRate: approvals / this.history.length,
      averageApprovalScore: mean(this.history.map((report) => report.approvalScore)),
      averagePValue: mean(this.history.map((report) => report.significance.pValue)),
      averageModelDrift: mean(this.history.map((report) => report.drifts.modelDrift)),
      averagePerformanceDrift: mean(this.history.map((report) => report.drifts.performanceDrift)),
      falseLuckRate: falseLuck / this.history.length,
      stableRate: stable / this.history.length,
      latestReport: this.history[this.history.length - 1],
    };
  }

  private runHistoricalValidation(baseline: ValidationSample[], candidate: ValidationSample[]) {
    const baselinePerf = evaluatePerformance(baseline);
    const candidatePerf = evaluatePerformance(candidate);
    const delta = candidatePerf.composite - baselinePerf.composite;
    const score = clamp01(0.5 + delta * 2.5);
    return { score, delta };
  }

  private runOutOfSampleValidation(baseline: ValidationSample[], candidate: ValidationSample[], ratio: number) {
    const effectiveRatio = Math.max(0.1, Math.min(0.5, ratio));
    const split = Math.max(1, Math.floor(baseline.length * (1 - effectiveRatio)));
    const baselineOos = baseline.slice(split);
    const candidateOos = candidate.slice(split);

    const baselinePerf = evaluatePerformance(baselineOos);
    const candidatePerf = evaluatePerformance(candidateOos);
    const delta = candidatePerf.composite - baselinePerf.composite;
    return { score: clamp01(0.5 + delta * 2.5), delta };
  }

  private runCrossValidationEngine(baseline: ValidationSample[], candidate: ValidationSample[], folds: number) {
    const effectiveFolds = Math.max(3, Math.min(12, Math.trunc(folds)));
    const foldSize = Math.max(1, Math.floor(baseline.length / effectiveFolds));
    const deltas: number[] = [];

    for (let fold = 0; fold < effectiveFolds; fold += 1) {
      const start = fold * foldSize;
      const end = fold === effectiveFolds - 1 ? baseline.length : start + foldSize;
      const baselineFold = baseline.slice(start, end);
      const candidateFold = candidate.slice(start, end);
      if (baselineFold.length === 0 || candidateFold.length === 0) {
        continue;
      }

      const base = evaluatePerformance(baselineFold);
      const improved = evaluatePerformance(candidateFold);
      deltas.push(improved.composite - base.composite);
    }

    return {
      score: clamp01(0.5 + mean(deltas) * 2.2),
      deltas,
    };
  }

  private runWalkForwardEngine(baseline: ValidationSample[], candidate: ValidationSample[], windows: number) {
    const effectiveWindows = Math.max(3, Math.min(12, Math.trunc(windows)));
    const segment = Math.max(10, Math.floor(baseline.length / (effectiveWindows + 1)));
    const validationScores: number[] = [];
    const trainScores: number[] = [];

    for (let i = 1; i <= effectiveWindows; i += 1) {
      const trainEnd = Math.min(i * segment, baseline.length - segment);
      const validateEnd = Math.min(trainEnd + segment, baseline.length);

      if (trainEnd <= 0 || validateEnd <= trainEnd) {
        continue;
      }

      const baseTrain = evaluatePerformance(baseline.slice(0, trainEnd));
      const candTrain = evaluatePerformance(candidate.slice(0, trainEnd));
      const baseValidation = evaluatePerformance(baseline.slice(trainEnd, validateEnd));
      const candValidation = evaluatePerformance(candidate.slice(trainEnd, validateEnd));

      trainScores.push(clamp01(0.5 + (candTrain.composite - baseTrain.composite) * 2));
      validationScores.push(clamp01(0.5 + (candValidation.composite - baseValidation.composite) * 2));
    }

    return {
      score: mean(validationScores),
      folds: validationScores.length,
      trainScores,
      validationScores,
    };
  }

  private runBootstrapValidation(
    baseline: ValidationSample[],
    candidate: ValidationSample[],
    runs: number,
    seedKey: string,
  ) {
    const random = mulberry32(seedFrom(`bootstrap_${seedKey}_${baseline.length}`));
    const n = baseline.length;
    const effectiveRuns = Math.max(100, Math.min(5000, Math.trunc(runs)));
    const distribution: number[] = [];

    for (let i = 0; i < effectiveRuns; i += 1) {
      const baseSample: ValidationSample[] = [];
      const candidateSample: ValidationSample[] = [];
      for (let j = 0; j < n; j += 1) {
        const index = Math.floor(random() * n);
        baseSample.push(baseline[index]);
        candidateSample.push(candidate[index]);
      }

      distribution.push(evaluatePerformance(candidateSample).composite - evaluatePerformance(baseSample).composite);
    }

    const avg = mean(distribution);
    const positiveRate = distribution.filter((value) => value > 0).length / distribution.length;
    return {
      score: clamp01(0.5 + avg * 2 + (positiveRate - 0.5) * 0.8),
      averageDelta: avg,
      positiveRate,
      distribution,
    };
  }

  private runMonteCarloEngine(
    baseline: ValidationSample[],
    candidate: ValidationSample[],
    runs: number,
    seedKey: string,
  ) {
    const random = mulberry32(seedFrom(`monte_carlo_${seedKey}_${runs}`));
    const effectiveRuns = Math.max(100, Math.min(5000, Math.trunc(runs)));
    let wins = 0;
    const deltas: number[] = [];

    for (let run = 0; run < effectiveRuns; run += 1) {
      const perturbedBase: ValidationSample[] = [];
      const perturbedCandidate: ValidationSample[] = [];

      for (let i = 0; i < baseline.length; i += 1) {
        const baseNoise = gaussian(random) * 0.02;
        const candidateNoise = gaussian(random) * 0.02;

        perturbedBase.push({
          ...baseline[i],
          actualReturn: baseline[i].actualReturn + baseNoise,
          predictedReturn: baseline[i].predictedReturn + baseNoise,
        });

        perturbedCandidate.push({
          ...candidate[i],
          actualReturn: candidate[i].actualReturn + candidateNoise,
          predictedReturn: candidate[i].predictedReturn + candidateNoise,
        });
      }

      const delta = evaluatePerformance(perturbedCandidate).composite - evaluatePerformance(perturbedBase).composite;
      deltas.push(delta);
      if (delta > 0) {
        wins += 1;
      }
    }

    const winRate = wins / effectiveRuns;
    return {
      score: clamp01(0.5 + (winRate - 0.5) * 1.8 + mean(deltas) * 1.2),
      winRate,
    };
  }

  private runRobustnessValidation(scores: number[]) {
    const spread = std(scores);
    return {
      score: clamp01(mean(scores) * (1 - spread)),
      spread,
    };
  }

  private runSensitivityValidation(candidate: ValidationSample[]) {
    const thresholds = [0.2, 0.4, 0.5, 0.6, 0.8];
    const hitRates: number[] = [];
    for (const threshold of thresholds) {
      const filtered = candidate.filter((sample) => Math.abs(sample.predictedReturn) >= threshold * 0.01);
      hitRates.push(evaluatePerformance(filtered).hitRate);
    }

    const stability = 1 - std(hitRates);
    return {
      score: clamp01(stability),
      thresholds: thresholds.length,
    };
  }

  private runNoiseResistanceValidation(candidate: ValidationSample[], noiseLevels: number[], seedKey: string) {
    const random = mulberry32(seedFrom(`noise_${seedKey}_${candidate.length}`));
    const base = evaluatePerformance(candidate).composite;
    const retentions: number[] = [];

    for (const level of noiseLevels) {
      const noisy = candidate.map((sample) => {
        const noise = gaussian(random) * level;
        return {
          ...sample,
          predictedReturn: sample.predictedReturn + noise,
        };
      });

      const noisyScore = evaluatePerformance(noisy).composite;
      const retention = base <= 0 ? 0 : clamp01(noisyScore / base);
      retentions.push(retention);
    }

    return {
      score: clamp01(mean(retentions)),
      averageRetention: mean(retentions),
    };
  }

  private runRegimeValidation(baseline: ValidationSample[], candidate: ValidationSample[]) {
    const regimes = new Map<MarketRegime, { base: ValidationSample[]; candidate: ValidationSample[] }>();

    for (let i = 0; i < baseline.length; i += 1) {
      const regime = baseline[i].regime ?? candidate[i]?.regime ?? 'unknown';
      if (!regimes.has(regime)) {
        regimes.set(regime, { base: [], candidate: [] });
      }

      const bucket = regimes.get(regime);
      if (!bucket) {
        continue;
      }

      bucket.base.push(baseline[i]);
      bucket.candidate.push(candidate[i]);
    }

    const regimeScores: number[] = [];
    for (const [, bucket] of regimes) {
      const base = evaluatePerformance(bucket.base).composite;
      const cand = evaluatePerformance(bucket.candidate).composite;
      regimeScores.push(clamp01(0.5 + (cand - base) * 2));
    }

    return {
      score: clamp01(mean(regimeScores)),
      regimes: regimeScores.length,
    };
  }

  private runConfidenceIntervalEngine(distribution: number[]) {
    const lower = percentile(distribution, 0.025);
    const upper = percentile(distribution, 0.975);
    const width = upper - lower;
    return {
      lower,
      upper,
      score: clamp01((lower > 0 ? 0.7 : 0.3) + (1 - Math.min(width, 0.5) / 0.5) * 0.3),
    };
  }

  private runStatisticalSignificanceEngine(distribution: number[]) {
    const avg = mean(distribution);
    const deviation = std(distribution);
    const denominator = deviation / Math.sqrt(Math.max(1, distribution.length));
    const z = denominator === 0 ? 0 : avg / denominator;
    const pValue = clamp01(2 * (1 - normalCdf(Math.abs(z))));
    return {
      pValue,
      isSignificant: pValue < 0.1,
      score: clamp01(1 - pValue),
    };
  }

  private runOverfittingDetector(trainScores: number[], validationScores: number[]) {
    const train = mean(trainScores);
    const validation = mean(validationScores);
    const gap = Math.max(0, train - validation);
    return {
      detected: gap > 0.12,
      gap,
      score: clamp01(1 - gap),
    };
  }

  private runUnderfittingDetector(historicalScore: number, outOfSampleScore: number) {
    const level = mean([historicalScore, outOfSampleScore]);
    return {
      detected: level < 0.45,
      score: clamp01(level),
    };
  }

  private runDataLeakageDetector(candidate: ValidationSample[]) {
    if (candidate.length < 5) {
      return {
        detected: true,
        leadCorrelation: 1,
        score: 0,
      };
    }

    const currentX: number[] = [];
    const currentY: number[] = [];
    const leadX: number[] = [];
    const leadY: number[] = [];

    for (let i = 0; i < candidate.length - 1; i += 1) {
      currentX.push(candidate[i].predictedReturn);
      currentY.push(candidate[i].actualReturn);
      leadX.push(candidate[i].predictedReturn);
      leadY.push(candidate[i + 1].actualReturn);
    }

    const currentCorr = this.correlation(currentX, currentY);
    const leadCorrelation = this.correlation(leadX, leadY);
    const leakageSignal = Math.max(0, leadCorrelation - currentCorr);
    const currentErrors: number[] = [];
    const leadErrors: number[] = [];

    for (let i = 0; i < candidate.length - 1; i += 1) {
      const currentDiff = candidate[i].predictedReturn - candidate[i].actualReturn;
      const leadDiff = candidate[i].predictedReturn - candidate[i + 1].actualReturn;
      currentErrors.push(currentDiff * currentDiff);
      leadErrors.push(leadDiff * leadDiff);
    }

    const currentMse = mean(currentErrors);
    const leadMse = mean(leadErrors);
    const lookaheadAdvantage = currentMse > 0 ? clamp01((currentMse - leadMse) / currentMse) : 0;
    const suspiciousPerfectLead = leadCorrelation > 0.97 && leadCorrelation > currentCorr + 0.02;

    return {
      detected: leakageSignal > 0.12 || lookaheadAdvantage > 0.2 || suspiciousPerfectLead,
      leadCorrelation,
      score: clamp01(1 - Math.max(leakageSignal, lookaheadAdvantage)),
    };
  }

  private runModelDriftDetector(candidate: ValidationSample[]) {
    const chunk = Math.max(10, Math.floor(candidate.length / 4));
    const early = evaluatePerformance(candidate.slice(0, chunk)).composite;
    const late = evaluatePerformance(candidate.slice(candidate.length - chunk)).composite;
    const drift = Math.max(0, early - late);
    return {
      drift,
      score: clamp01(1 - drift),
    };
  }

  private runPerformanceDriftDetector(candidate: ValidationSample[]) {
    const window = Math.max(8, Math.floor(candidate.length / 8));
    const scores: number[] = [];

    for (let i = 0; i + window <= candidate.length; i += window) {
      scores.push(evaluatePerformance(candidate.slice(i, i + window)).composite);
    }

    if (scores.length <= 1) {
      return { drift: 0, score: 1 };
    }

    const indices = scores.map((_, idx) => idx);
    const slope = this.linearSlope(indices, scores);
    const drift = slope < 0 ? Math.abs(slope) : 0;
    return {
      drift,
      score: clamp01(1 - drift * 2.5),
    };
  }

  private correlation(left: number[], right: number[]): number {
    if (left.length === 0 || right.length === 0 || left.length !== right.length) {
      return 0;
    }

    const meanLeft = mean(left);
    const meanRight = mean(right);
    let numerator = 0;
    let leftDen = 0;
    let rightDen = 0;

    for (let i = 0; i < left.length; i += 1) {
      const l = left[i] - meanLeft;
      const r = right[i] - meanRight;
      numerator += l * r;
      leftDen += l * l;
      rightDen += r * r;
    }

    const denominator = Math.sqrt(leftDen * rightDen);
    if (denominator === 0) {
      return 0;
    }

    return numerator / denominator;
  }

  private linearSlope(x: number[], y: number[]): number {
    if (x.length !== y.length || x.length <= 1) {
      return 0;
    }

    const meanX = mean(x);
    const meanY = mean(y);
    let numerator = 0;
    let denominator = 0;

    for (let i = 0; i < x.length; i += 1) {
      const dx = x[i] - meanX;
      numerator += dx * (y[i] - meanY);
      denominator += dx * dx;
    }

    if (denominator === 0) {
      return 0;
    }

    return numerator / denominator;
  }
}
