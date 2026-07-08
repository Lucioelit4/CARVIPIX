import type {
  EvidenceItem,
  KnowledgeCard,
  KnowledgeEvolutionReport,
  KnowledgePriority,
  KnowledgeRecord,
} from '../types';
import { KnowledgeEvolutionEngine } from './knowledgeEvolutionEngine';

export class KnowledgeConsumer {
  private readonly records = new Map<string, KnowledgeRecord>();
  private readonly cards = new Map<string, KnowledgeCard>();
  private readonly evolutionEngine = new KnowledgeEvolutionEngine();
  private lastEvolutionReport: KnowledgeEvolutionReport | null = null;

  consume(evidence: EvidenceItem[]): KnowledgeRecord[] {
    const now = Date.now();

    for (const item of evidence) {
      const key = `${item.source}:${item.key}`;
      const existing = this.records.get(key);

      if (!existing) {
        this.records.set(key, {
          id: `knowledge-${key}`,
          key,
          score: item.value * item.confidence,
          context: item.context,
          createdAt: now,
          updatedAt: now,
          uses: 1,
        });
        continue;
      }

      const blendedScore = existing.score * 0.7 + item.value * item.confidence * 0.3;
      this.records.set(key, {
        ...existing,
        score: blendedScore,
        updatedAt: now,
        uses: existing.uses + 1,
        context: item.context ?? existing.context,
      });
    }

    this.syncCardsFromRecords(now);
    this.lastEvolutionReport = this.evolutionEngine.evolve(this.getKnowledgeCards(), now);
    this.applyEvolutionReport(this.lastEvolutionReport, now);

    return this.getTopKnowledge(20);
  }

  getTopKnowledge(limit = 20): KnowledgeRecord[] {
    return Array.from(this.records.values())
      .sort((left, right) => right.score - left.score)
      .slice(0, Math.max(1, limit));
  }

  registerKnowledgeCards(cards: KnowledgeCard[]): void {
    const now = Date.now();
    for (const card of cards) {
      this.cards.set(card.cardId, {
        ...card,
        tags: Array.from(new Set(card.tags.map((tag) => tag.trim()).filter(Boolean))),
        updatedAt: now,
      });
    }

    this.lastEvolutionReport = this.evolutionEngine.evolve(this.getKnowledgeCards(), now);
    this.applyEvolutionReport(this.lastEvolutionReport, now);
  }

  evolveKnowledge(now = Date.now()): KnowledgeEvolutionReport {
    this.lastEvolutionReport = this.evolutionEngine.evolve(this.getKnowledgeCards(), now);
    this.applyEvolutionReport(this.lastEvolutionReport, now);
    return this.lastEvolutionReport;
  }

  getKnowledgeCards(limit = 500): KnowledgeCard[] {
    return Array.from(this.cards.values())
      .sort((left, right) => right.updatedAt - left.updatedAt)
      .slice(0, Math.max(1, limit));
  }

  getLastEvolutionReport(): KnowledgeEvolutionReport | null {
    return this.lastEvolutionReport;
  }

  reset(): void {
    this.records.clear();
    this.cards.clear();
    this.lastEvolutionReport = null;
  }

  private syncCardsFromRecords(now: number): void {
    for (const record of this.records.values()) {
      const source = record.key.split(':')[0] || 'other';
      const category = this.mapSourceToCategory(source);
      const existing = this.cards.get(record.id);

      const validationScore = Math.max(0, Math.min(1, record.score));
      const reliability = Math.max(0, Math.min(1, 0.45 + Math.log10(record.uses + 1) * 0.2));
      const performanceScore = Math.max(0, Math.min(1, validationScore * 0.8 + reliability * 0.2));

      if (!existing) {
        this.cards.set(record.id, {
          cardId: record.id,
          title: `Knowledge ${record.key}`,
          category,
          tags: [source, ...record.key.split(':').slice(1)],
          dependencies: [],
          relationships: [],
          summary: `Generated from evidence stream ${record.key}`,
          validationScore,
          performanceScore,
          reliability,
          usageCount: record.uses,
          reinforcementSignals: 1,
          decayRate: 0.0025,
          lastValidatedAt: record.updatedAt,
          lastObservedAt: record.updatedAt,
          createdAt: record.createdAt,
          updatedAt: now,
          lifecycle: 'candidate',
          priority: this.mapScoreToPriority(performanceScore),
          metadata: record.context,
        });
        continue;
      }

      this.cards.set(record.id, {
        ...existing,
        category,
        validationScore,
        performanceScore,
        reliability,
        usageCount: record.uses,
        reinforcementSignals: existing.reinforcementSignals + 1,
        lastObservedAt: record.updatedAt,
        updatedAt: now,
        priority: this.mapScoreToPriority(performanceScore),
        metadata: record.context ?? existing.metadata,
      });
    }
  }

  private applyEvolutionReport(report: KnowledgeEvolutionReport, now: number): void {
    const priorityById = new Map(report.ranking.map((entry) => [entry.cardId, entry.priority]));
    const decisionById = new Map(report.decisions.map((decision) => [decision.cardId, decision]));

    for (const card of this.cards.values()) {
      const decision = decisionById.get(card.cardId);
      if (!decision) {
        continue;
      }

      const priority = priorityById.get(card.cardId) ?? card.priority;
      this.cards.set(card.cardId, {
        ...card,
        lifecycle: decision.lifecycle,
        priority,
        validationScore: decision.evolvedScore,
        performanceScore: decision.evolvedScore,
        lastValidatedAt: decision.shouldReinvestigate ? card.lastValidatedAt : now,
        updatedAt: now,
      });
    }
  }

  private mapSourceToCategory(source: string): KnowledgeCard['category'] {
    switch (source) {
      case 'market':
      case 'structure':
        return 'market_structure';
      case 'risk':
        return 'risk_management';
      case 'news':
        return 'macro_news';
      case 'session':
        return 'session_behavior';
      case 'research':
        return 'research_insight';
      case 'memory':
        return 'meta_learning';
      default:
        return 'other';
    }
  }

  private mapScoreToPriority(score: number): KnowledgePriority {
    if (score >= 0.85) {
      return 'critical';
    }
    if (score >= 0.65) {
      return 'high';
    }
    if (score >= 0.45) {
      return 'medium';
    }
    return 'low';
  }
}
