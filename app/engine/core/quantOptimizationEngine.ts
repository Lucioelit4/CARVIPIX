import type {
  FeatureConstraint,
  OptimizationConstraint,
  OptimizationDashboardSnapshot,
  OptimizationDirection,
  OptimizationObjective,
  QuantCandidateConfiguration,
  QuantOptimizationEvaluation,
  QuantOptimizationInput,
  QuantOptimizationResult,
} from '../types';

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function hashConfig(config: QuantCandidateConfiguration): string {
  const parts = [
    JSON.stringify(config.parameters),
    JSON.stringify(config.weights),
    JSON.stringify(config.thresholds),
    JSON.stringify(config.features.slice().sort()),
  ];

  return parts.join('|');
}

function lcg(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 0xffffffff;
  };
}

function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function sortedKeys<T>(input: Record<string, T>): string[] {
  return Object.keys(input).sort();
}

export class QuantOptimizationEngine {
  private readonly cache = new Map<string, QuantOptimizationEvaluation>();
  private readonly history: QuantOptimizationResult[] = [];

  optimize(input: QuantOptimizationInput): QuantOptimizationResult {
    const createdAt = Date.now();
    const runId = `opt-${createdAt}`;

    const gridCandidates = this.generateGridCandidates(input);
    const randomCandidates = this.generateRandomCandidates(input);
    const bayesianCandidates = this.generateBayesianCandidates(input, gridCandidates, randomCandidates);

    const allCandidates = [
      input.baseConfiguration,
      ...gridCandidates,
      ...randomCandidates,
      ...bayesianCandidates,
    ];

    let cacheHits = 0;
    const evaluations: QuantOptimizationEvaluation[] = [];

    for (const candidate of allCandidates) {
      const cacheKey = hashConfig(candidate);
      const cached = this.cache.get(cacheKey);
      if (cached) {
        cacheHits += 1;
        evaluations.push(cached);
        continue;
      }

      const evaluation = this.evaluateCandidate(candidate, input.objectives, input.constraints, input.featureConstraints);
      this.cache.set(cacheKey, evaluation);
      evaluations.push(evaluation);
    }

    const deduplicated = this.deduplicateEvaluations(evaluations);
    const discarded = deduplicated.filter((evaluation) => evaluation.discarded);
    const feasible = deduplicated.filter((evaluation) => evaluation.feasible && !evaluation.discarded);
    const ranking = feasible
      .slice()
      .sort((left, right) => right.multiObjectiveScore - left.multiObjectiveScore);

    const bestEvaluation = ranking[0] ?? deduplicated[0];
    if (!bestEvaluation) {
      throw new Error('No optimization candidates were evaluated.');
    }

    const baseEvaluation = this.evaluateCandidate(
      input.baseConfiguration,
      input.objectives,
      input.constraints,
      input.featureConstraints,
    );

    const weightOptimizer = this.computeDelta(input.baseConfiguration.weights, bestEvaluation.candidate.weights);
    const parameterOptimizer = this.computeDelta(input.baseConfiguration.parameters, bestEvaluation.candidate.parameters);
    const thresholdOptimizer = this.computeDelta(input.baseConfiguration.thresholds, bestEvaluation.candidate.thresholds);

    const featureSelected = bestEvaluation.candidate.features.filter(
      (feature) => !input.baseConfiguration.features.includes(feature),
    );
    const featureDropped = input.baseConfiguration.features.filter(
      (feature) => !bestEvaluation.candidate.features.includes(feature),
    );

    const optimizationRanking = ranking.map((evaluation, index) => ({
      position: index + 1,
      candidateId: evaluation.candidate.id,
      score: evaluation.multiObjectiveScore,
      feasible: evaluation.feasible,
    }));

    const diagnostics = {
      gridEvaluated: gridCandidates.length,
      randomEvaluated: randomCandidates.length,
      bayesianEvaluated: bayesianCandidates.length,
      cacheHits,
      totalEvaluated: deduplicated.length,
      discarded: discarded.length,
    };

    const report = [
      `Best configuration: ${bestEvaluation.candidate.id}`,
      `Best multi-objective score: ${bestEvaluation.multiObjectiveScore.toFixed(4)}`,
      `Evidence improved from ${baseEvaluation.evidenceScore.toFixed(4)} to ${bestEvaluation.evidenceScore.toFixed(4)}`,
      `Confidence improved from ${baseEvaluation.confidenceScore.toFixed(4)} to ${bestEvaluation.confidenceScore.toFixed(4)}`,
      `Probability improved from ${baseEvaluation.probabilityScore.toFixed(4)} to ${bestEvaluation.probabilityScore.toFixed(4)}`,
      `Knowledge improved from ${baseEvaluation.knowledgeScore.toFixed(4)} to ${bestEvaluation.knowledgeScore.toFixed(4)}`,
      `Discarded candidates: ${discarded.length}`,
    ];

    const provisionalResult: QuantOptimizationResult = {
      runId,
      createdAt,
      bestConfiguration: bestEvaluation.candidate,
      bestEvaluation,
      ranking,
      discarded,
      diagnostics,
      weightOptimizer,
      parameterOptimizer,
      thresholdOptimizer,
      featureOptimizer: {
        selected: featureSelected,
        dropped: featureDropped,
      },
      evidenceOptimizer: {
        before: baseEvaluation.evidenceScore,
        after: bestEvaluation.evidenceScore,
      },
      confidenceOptimizer: {
        before: baseEvaluation.confidenceScore,
        after: bestEvaluation.confidenceScore,
      },
      probabilityOptimizer: {
        before: baseEvaluation.probabilityScore,
        after: bestEvaluation.probabilityScore,
      },
      knowledgeOptimizer: {
        before: baseEvaluation.knowledgeScore,
        after: bestEvaluation.knowledgeScore,
      },
      optimizationRanking,
      report,
      dashboard: {
        totalRuns: 0,
        bestScore: 0,
        averageScore: 0,
        topCandidates: [],
      },
    };

    this.history.unshift(provisionalResult);
    if (this.history.length > 200) {
      this.history.splice(200);
    }

    const dashboard = this.getDashboard();
    const finalized: QuantOptimizationResult = {
      ...provisionalResult,
      dashboard,
    };

    this.history[0] = finalized;
    return finalized;
  }

  getHistory(limit = 50): QuantOptimizationResult[] {
    return this.history.slice(0, Math.max(1, limit));
  }

  getDashboard(): OptimizationDashboardSnapshot {
    const totalRuns = this.history.length;
    if (totalRuns === 0) {
      return {
        totalRuns: 0,
        bestScore: 0,
        averageScore: 0,
        topCandidates: [],
      };
    }

    const bestRun = this.history.reduce((best, current) =>
      current.bestEvaluation.multiObjectiveScore > best.bestEvaluation.multiObjectiveScore ? current : best,
    this.history[0]);

    const averageScore = average(this.history.map((item) => item.bestEvaluation.multiObjectiveScore));
    const topCandidates = this.history
      .slice()
      .sort((left, right) => right.bestEvaluation.multiObjectiveScore - left.bestEvaluation.multiObjectiveScore)
      .slice(0, 10)
      .map((item) => ({
        runId: item.runId,
        candidateId: item.bestEvaluation.candidate.id,
        score: item.bestEvaluation.multiObjectiveScore,
        feasible: item.bestEvaluation.feasible,
      }));

    return {
      totalRuns,
      bestRunId: bestRun.runId,
      bestScore: bestRun.bestEvaluation.multiObjectiveScore,
      averageScore,
      latestRunId: this.history[0]?.runId,
      topCandidates,
    };
  }

  clearCache(): void {
    this.cache.clear();
  }

  clearHistory(): void {
    this.history.length = 0;
  }

  private generateGridCandidates(input: QuantOptimizationInput): QuantCandidateConfiguration[] {
    const maxSamples = Math.max(1, Math.floor(input.search?.gridSamples ?? 16));
    const base = input.baseConfiguration;
    const candidates: QuantCandidateConfiguration[] = [];

    const parameterKeys = sortedKeys(input.parameterSpace);
    const weightKeys = sortedKeys(input.weightSpace);
    const thresholdKeys = sortedKeys(input.thresholdSpace);

    for (let index = 0; index < maxSamples; index += 1) {
      const ratio = maxSamples === 1 ? 0.5 : index / (maxSamples - 1);
      const parameters = { ...base.parameters };
      const weights = { ...base.weights };
      const thresholds = { ...base.thresholds };

      for (const key of parameterKeys) {
        const space = input.parameterSpace[key];
        parameters[key] = this.interpolate(space, ratio, index);
      }

      for (const key of weightKeys) {
        const space = input.weightSpace[key];
        weights[key] = this.interpolate(space, ratio, index + 3);
      }

      for (const key of thresholdKeys) {
        const space = input.thresholdSpace[key];
        thresholds[key] = this.interpolate(space, ratio, index + 7);
      }

      const features = this.pickFeatures(input.featureCandidates, ratio);
      candidates.push({
        id: `grid-${index + 1}`,
        parameters,
        weights,
        thresholds,
        features,
      });
    }

    return candidates;
  }

  private generateRandomCandidates(input: QuantOptimizationInput): QuantCandidateConfiguration[] {
    const count = Math.max(1, Math.floor(input.search?.randomSamples ?? 24));
    const random = lcg(input.search?.seed ?? 1337);
    const base = input.baseConfiguration;
    const candidates: QuantCandidateConfiguration[] = [];

    for (let index = 0; index < count; index += 1) {
      const parameters = { ...base.parameters };
      const weights = { ...base.weights };
      const thresholds = { ...base.thresholds };

      for (const key of sortedKeys(input.parameterSpace)) {
        parameters[key] = this.sample(input.parameterSpace[key], random());
      }

      for (const key of sortedKeys(input.weightSpace)) {
        weights[key] = this.sample(input.weightSpace[key], random());
      }

      for (const key of sortedKeys(input.thresholdSpace)) {
        thresholds[key] = this.sample(input.thresholdSpace[key], random());
      }

      const ratio = random();
      const features = this.pickFeatures(input.featureCandidates, ratio);

      candidates.push({
        id: `random-${index + 1}`,
        parameters,
        weights,
        thresholds,
        features,
      });
    }

    return candidates;
  }

  private generateBayesianCandidates(
    input: QuantOptimizationInput,
    gridCandidates: QuantCandidateConfiguration[],
    randomCandidates: QuantCandidateConfiguration[],
  ): QuantCandidateConfiguration[] {
    const iterations = Math.max(1, Math.floor(input.search?.bayesianIterations ?? 12));
    const random = lcg((input.search?.seed ?? 1337) + 17);

    const seedPool = [input.baseConfiguration, ...gridCandidates.slice(0, 5), ...randomCandidates.slice(0, 5)];
    const candidates: QuantCandidateConfiguration[] = [];

    for (let index = 0; index < iterations; index += 1) {
      const parent = seedPool[Math.floor(random() * seedPool.length)] ?? input.baseConfiguration;
      const parameters = { ...parent.parameters };
      const weights = { ...parent.weights };
      const thresholds = { ...parent.thresholds };

      for (const key of sortedKeys(input.parameterSpace)) {
        parameters[key] = this.perturb(input.parameterSpace[key], parameters[key], random());
      }

      for (const key of sortedKeys(input.weightSpace)) {
        weights[key] = this.perturb(input.weightSpace[key], weights[key], random());
      }

      for (const key of sortedKeys(input.thresholdSpace)) {
        thresholds[key] = this.perturb(input.thresholdSpace[key], thresholds[key], random());
      }

      const ratio = random();
      const features = this.pickFeatures(input.featureCandidates, ratio);

      candidates.push({
        id: `bayesian-${index + 1}`,
        parameters,
        weights,
        thresholds,
        features,
      });
    }

    return candidates;
  }

  private evaluateCandidate(
    candidate: QuantCandidateConfiguration,
    objectives: OptimizationObjective[],
    constraints: OptimizationConstraint[] | undefined,
    featureConstraints: FeatureConstraint | undefined,
  ): QuantOptimizationEvaluation {
    const discardReasons: string[] = [];

    for (const constraint of constraints ?? []) {
      const bag =
        constraint.target === 'parameters'
          ? candidate.parameters
          : constraint.target === 'weights'
            ? candidate.weights
            : candidate.thresholds;
      const value = bag[constraint.key];

      if (!Number.isFinite(value)) {
        discardReasons.push(`missing ${constraint.target}.${constraint.key}`);
        continue;
      }

      if (typeof constraint.min === 'number' && value < constraint.min) {
        discardReasons.push(`${constraint.target}.${constraint.key} below min`);
      }
      if (typeof constraint.max === 'number' && value > constraint.max) {
        discardReasons.push(`${constraint.target}.${constraint.key} above max`);
      }
    }

    if (featureConstraints?.required) {
      for (const feature of featureConstraints.required) {
        if (!candidate.features.includes(feature)) {
          discardReasons.push(`required feature missing: ${feature}`);
        }
      }
    }

    if (featureConstraints?.forbidden) {
      for (const feature of featureConstraints.forbidden) {
        if (candidate.features.includes(feature)) {
          discardReasons.push(`forbidden feature present: ${feature}`);
        }
      }
    }

    const metrics = this.buildMetrics(candidate);
    const objectiveScore = this.computeObjectiveScore(metrics, objectives);

    const evidenceScore = clamp01((metrics.edge + metrics.stability + metrics.evidence) / 3);
    const confidenceScore = clamp01((metrics.robustness + metrics.reliability + metrics.consistency) / 3);
    const probabilityScore = clamp01((metrics.probability + metrics.edge) / 2);
    const knowledgeScore = clamp01((metrics.knowledge + metrics.reliability + metrics.featureCoverage) / 3);
    const featureScore = clamp01(metrics.featureCoverage);

    const multiObjectiveScore = clamp01(
      objectiveScore * 0.4 +
        evidenceScore * 0.15 +
        confidenceScore * 0.15 +
        probabilityScore * 0.15 +
        knowledgeScore * 0.1 +
        featureScore * 0.05,
    );

    return {
      candidate,
      metrics,
      feasible: discardReasons.length === 0,
      discarded: discardReasons.length > 0,
      discardReasons,
      objectiveScore,
      multiObjectiveScore,
      evidenceScore,
      confidenceScore,
      probabilityScore,
      knowledgeScore,
      featureScore,
    };
  }

  private deduplicateEvaluations(evaluations: QuantOptimizationEvaluation[]): QuantOptimizationEvaluation[] {
    const map = new Map<string, QuantOptimizationEvaluation>();

    for (const evaluation of evaluations) {
      const key = hashConfig(evaluation.candidate);
      const existing = map.get(key);
      if (!existing || evaluation.multiObjectiveScore > existing.multiObjectiveScore) {
        map.set(key, evaluation);
      }
    }

    return Array.from(map.values());
  }

  private buildMetrics(candidate: QuantCandidateConfiguration): Record<string, number> {
    const parameterValues = Object.values(candidate.parameters);
    const weightValues = Object.values(candidate.weights);
    const thresholdValues = Object.values(candidate.thresholds);

    const parameterMean = average(parameterValues);
    const weightMean = average(weightValues);
    const thresholdMean = average(thresholdValues);

    const parameterDispersion = average(parameterValues.map((value) => Math.abs(value - parameterMean)));
    const weightDispersion = average(weightValues.map((value) => Math.abs(value - weightMean)));
    const thresholdDispersion = average(thresholdValues.map((value) => Math.abs(value - thresholdMean)));

    const featureCoverage = clamp01(candidate.features.length / Math.max(1, candidate.features.length + 2));

    const stability = clamp01(1 - parameterDispersion * 0.6 - thresholdDispersion * 0.3);
    const robustness = clamp01(1 - weightDispersion * 0.7 - thresholdDispersion * 0.2);
    const edge = clamp01(parameterMean * 0.45 + weightMean * 0.4 + thresholdMean * 0.15);
    const consistency = clamp01(1 - Math.abs(parameterMean - weightMean) * 0.8);
    const probability = clamp01(edge * 0.6 + consistency * 0.4);
    const reliability = clamp01(stability * 0.6 + robustness * 0.4);
    const knowledge = clamp01((consistency + featureCoverage + reliability) / 3);
    const evidence = clamp01((edge + stability + featureCoverage) / 3);

    return {
      stability,
      robustness,
      edge,
      consistency,
      probability,
      reliability,
      knowledge,
      evidence,
      featureCoverage,
    };
  }

  private computeObjectiveScore(metrics: Record<string, number>, objectives: OptimizationObjective[]): number {
    if (objectives.length === 0) {
      return 0;
    }

    let weightedSum = 0;
    let totalWeight = 0;

    for (const objective of objectives) {
      const value = clamp01(metrics[objective.metric] ?? 0);
      const normalized = this.normalizeByDirection(value, objective.direction);
      const weight = Math.max(0.0001, objective.weight);
      weightedSum += normalized * weight;
      totalWeight += weight;
    }

    return totalWeight > 0 ? clamp01(weightedSum / totalWeight) : 0;
  }

  private normalizeByDirection(value: number, direction: OptimizationDirection): number {
    if (direction === 'maximize') {
      return value;
    }

    return 1 - value;
  }

  private computeDelta(before: Record<string, number>, after: Record<string, number>) {
    const improved: string[] = [];
    const worsened: string[] = [];

    const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
    for (const key of keys) {
      const beforeValue = before[key] ?? 0;
      const afterValue = after[key] ?? 0;

      if (afterValue > beforeValue + 0.0001) {
        improved.push(key);
      } else if (afterValue < beforeValue - 0.0001) {
        worsened.push(key);
      }
    }

    return {
      improved: improved.sort(),
      worsened: worsened.sort(),
    };
  }

  private interpolate(space: { min: number; max: number; step?: number }, ratio: number, salt: number): number {
    const raw = space.min + (space.max - space.min) * ratio;
    if (!space.step || space.step <= 0) {
      return raw;
    }

    const step = space.step;
    const snapped = Math.round(raw / step) * step;
    const offset = ((salt % 3) - 1) * step * 0.2;
    return Math.min(space.max, Math.max(space.min, snapped + offset));
  }

  private sample(space: { min: number; max: number; step?: number }, random: number): number {
    const raw = space.min + (space.max - space.min) * random;
    if (!space.step || space.step <= 0) {
      return raw;
    }

    const snapped = Math.round(raw / space.step) * space.step;
    return Math.min(space.max, Math.max(space.min, snapped));
  }

  private perturb(space: { min: number; max: number; step?: number }, center: number, random: number): number {
    const radius = (space.max - space.min) * 0.2;
    const candidate = center + (random - 0.5) * 2 * radius;

    if (!space.step || space.step <= 0) {
      return Math.min(space.max, Math.max(space.min, candidate));
    }

    const snapped = Math.round(candidate / space.step) * space.step;
    return Math.min(space.max, Math.max(space.min, snapped));
  }

  private pickFeatures(featureCandidates: string[], ratio: number): string[] {
    if (featureCandidates.length === 0) {
      return [];
    }

    const pickCount = Math.max(1, Math.round(ratio * featureCandidates.length));
    return featureCandidates.slice(0, pickCount);
  }
}
