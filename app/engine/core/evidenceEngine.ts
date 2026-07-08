import type {
  BenchmarkResult,
  ConsensusResult,
  EvidenceAssessment,
  EvidenceConflict,
  EvidenceItem,
  EvidenceValidationIssue,
  KnowledgeCard,
  KnowledgeEvolutionReport,
  TradeSignal,
} from '../types';
import { EvidenceBuilder } from './evidenceBuilder';
import { EvidenceCache } from './evidenceCache';
import { EvidenceRepository } from './evidenceRepository';
import { EvidenceValidator } from './evidenceValidator';
import { EngineRuntimeProfiler } from './engineRuntimeProfiler';
import { KnowledgeConsumer } from './knowledgeConsumer';

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function hashEvidence(items: EvidenceItem[]): string {
  return items
    .map((item) => `${item.id}:${item.key}:${item.value.toFixed(6)}:${item.weight.toFixed(6)}`)
    .sort()
    .join('|');
}

export class EvidenceEngine {
  private readonly builder = new EvidenceBuilder();
  private readonly validator = new EvidenceValidator();
  private readonly repository = new EvidenceRepository();
  private readonly cache = new EvidenceCache();
  private readonly knowledgeConsumer = new KnowledgeConsumer();
  private readonly profiler = new EngineRuntimeProfiler();

  evaluate(input: {
    signal: TradeSignal;
    consensus: ConsensusResult;
    contextSnapshot?: Record<string, unknown>;
    evidenceInput?: { items: EvidenceItem[] };
    cacheTtlMs?: number;
  }): EvidenceAssessment {
    const stop = this.profiler.start('evidence.evaluate');
    try {
      const evidence = this.builder.build({
        signal: input.signal,
        consensus: input.consensus,
        contextSnapshot: input.contextSnapshot,
        evidenceInput: input.evidenceInput,
      });

      const cacheKey = `${input.signal.id}:${hashEvidence(evidence)}`;
      const cached = this.cache.get(cacheKey);
      if (cached) {
        return cached;
      }

      this.repository.upsert(evidence);
      const sourceValidation = this.validator.validate(evidence);
      this.repository.pruneExpired();

      const active = this.repository.getActive();
      const validation = this.validator.validate(active);
      const mergedIssues = [...sourceValidation.issues, ...validation.issues];
      const validationResult = {
        valid: sourceValidation.valid && validation.valid,
        issues: mergedIssues,
      };
      const conflicts = this.detectConflicts(active);
      const ranked = this.rank(active, conflicts);
      const knowledge = this.knowledgeConsumer.consume(ranked);
      const probability = this.computeProbability(ranked, conflicts);
      const confidence = this.computeConfidence(ranked, validationResult.issues);
      const uncertainty = this.computeUncertainty(ranked, validationResult.issues, conflicts);
      const decisionQuality = this.computeDecisionQuality(probability, confidence, uncertainty, validationResult, conflicts);
      const explainability = this.buildExplainability(ranked, conflicts, validationResult.issues, knowledge.length);

      const assessment: EvidenceAssessment = {
        evidenceCount: ranked.length,
        probability,
        confidence,
        uncertainty,
        decisionQuality,
        ranking: ranked,
        conflicts,
        explainability,
        valid: validationResult.valid,
        issues: validationResult.issues,
      };

      this.cache.set(cacheKey, assessment, input.cacheTtlMs ?? 2_000);
      return assessment;
    } finally {
      stop();
    }
  }

  getRecentProfile(limit = 100) {
    return this.profiler.getRecent(limit);
  }

  registerKnowledgeCards(cards: KnowledgeCard[]): void {
    this.knowledgeConsumer.registerKnowledgeCards(cards);
  }

  evolveKnowledge(now = Date.now()): KnowledgeEvolutionReport {
    return this.knowledgeConsumer.evolveKnowledge(now);
  }

  getKnowledgeCards(limit = 500): KnowledgeCard[] {
    return this.knowledgeConsumer.getKnowledgeCards(limit);
  }

  getLastKnowledgeEvolutionReport(): KnowledgeEvolutionReport | null {
    return this.knowledgeConsumer.getLastEvolutionReport();
  }

  benchmark(input: {
    signal: TradeSignal;
    consensus: ConsensusResult;
    contextSnapshot?: Record<string, unknown>;
    evidenceInput?: { items: EvidenceItem[] };
    iterations?: number;
  }): BenchmarkResult {
    const iterations = Math.max(1, Math.floor(input.iterations ?? 100));
    const samples: number[] = [];

    for (let index = 0; index < iterations; index += 1) {
      const stop = this.profiler.start('evidence.benchmark.iteration');
      this.evaluate({
        signal: {
          ...input.signal,
          id: `${input.signal.id}-bench-${index}`,
        },
        consensus: input.consensus,
        contextSnapshot: input.contextSnapshot,
        evidenceInput: input.evidenceInput,
        cacheTtlMs: 0,
      });
      const snapshot = stop();
      samples.push(snapshot.elapsedMs);
    }

    return this.profiler.benchmark('evidence.evaluate', samples);
  }

  reset(): void {
    this.cache.clear();
    this.knowledgeConsumer.reset();
    this.profiler.reset();
    this.repository.clear();
  }

  private detectConflicts(items: EvidenceItem[]): EvidenceConflict[] {
    const conflicts: EvidenceConflict[] = [];

    for (let i = 0; i < items.length; i += 1) {
      for (let j = i + 1; j < items.length; j += 1) {
        const left = items[i];
        const right = items[j];

        if (left.key !== right.key) {
          continue;
        }

        const delta = Math.abs(left.value - right.value);
        if (delta < 0.55) {
          continue;
        }

        conflicts.push({
          leftId: left.id,
          rightId: right.id,
          reason: `High divergence on ${left.key} (${left.value.toFixed(2)} vs ${right.value.toFixed(2)})`,
          severity: delta > 0.8 ? 'critical' : 'high',
        });
      }
    }

    return conflicts;
  }

  private rank(items: EvidenceItem[], conflicts: EvidenceConflict[]): EvidenceItem[] {
    const conflictSet = new Set<string>();
    for (const conflict of conflicts) {
      conflictSet.add(conflict.leftId);
      conflictSet.add(conflict.rightId);
    }

    return items
      .slice()
      .sort((left, right) => this.evidenceScore(right, conflictSet) - this.evidenceScore(left, conflictSet));
  }

  private evidenceScore(item: EvidenceItem, conflictSet: Set<string>): number {
    const base = item.value * item.weight * item.confidence;
    const conflictPenalty = conflictSet.has(item.id) ? 0.2 : 0;
    const uncertaintyPenalty = item.uncertainty * 0.3;
    return base - conflictPenalty - uncertaintyPenalty;
  }

  private computeProbability(items: EvidenceItem[], conflicts: EvidenceConflict[]): number {
    if (items.length === 0) {
      return 0;
    }

    const weighted = items.reduce((sum, item) => sum + item.value * item.weight, 0);
    const weights = items.reduce((sum, item) => sum + item.weight, 0);
    const raw = weights > 0 ? weighted / weights : 0;
    const conflictPenalty = Math.min(0.35, conflicts.length * 0.08);

    return clamp01(raw - conflictPenalty);
  }

  private computeConfidence(items: EvidenceItem[], issues: EvidenceValidationIssue[]): number {
    if (items.length === 0) {
      return 0;
    }

    const weighted = items.reduce((sum, item) => sum + item.confidence * item.weight, 0);
    const weights = items.reduce((sum, item) => sum + item.weight, 0);
    const raw = weights > 0 ? weighted / weights : 0;
    const criticalIssues = issues.filter((issue) => issue.severity === 'critical').length;

    return clamp01(raw - criticalIssues * 0.1);
  }

  private computeUncertainty(
    items: EvidenceItem[],
    issues: EvidenceValidationIssue[],
    conflicts: EvidenceConflict[],
  ): number {
    if (items.length === 0) {
      return 1;
    }

    const weighted = items.reduce((sum, item) => sum + item.uncertainty * item.weight, 0);
    const weights = items.reduce((sum, item) => sum + item.weight, 0);
    const raw = weights > 0 ? weighted / weights : 1;
    const warningIssues = issues.filter((issue) => issue.severity === 'warning').length;

    return clamp01(raw + warningIssues * 0.03 + conflicts.length * 0.04);
  }

  private computeDecisionQuality(
    probability: number,
    confidence: number,
    uncertainty: number,
    validation: { valid: boolean; issues: EvidenceValidationIssue[] },
    conflicts: EvidenceConflict[],
  ): number {
    const base = probability * 0.45 + confidence * 0.4 + (1 - uncertainty) * 0.15;
    const issuePenalty = Math.min(0.35, validation.issues.length * 0.04);
    const conflictPenalty = Math.min(0.4, conflicts.length * 0.1);
    const validityPenalty = validation.valid ? 0 : 0.2;

    return clamp01(base - issuePenalty - conflictPenalty - validityPenalty);
  }

  private buildExplainability(
    ranked: EvidenceItem[],
    conflicts: EvidenceConflict[],
    issues: EvidenceValidationIssue[],
    knowledgeCount: number,
  ): string[] {
    const lines: string[] = [];

    const top = ranked.slice(0, 3);
    if (top.length > 0) {
      lines.push(`Top evidence: ${top.map((item) => `${item.source}:${item.key}`).join(', ')}`);
    }

    if (conflicts.length > 0) {
      lines.push(`Evidence conflicts: ${conflicts.length}`);
    }

    if (issues.length > 0) {
      lines.push(`Evidence validation issues: ${issues.length}`);
    }

    lines.push(`Knowledge records consulted: ${knowledgeCount}`);
    return lines;
  }
}
