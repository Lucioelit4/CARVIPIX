import type { EvidenceItem, KnowledgeRecord } from '../types';

export class KnowledgeConsumer {
  private readonly records = new Map<string, KnowledgeRecord>();

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

    return this.getTopKnowledge(20);
  }

  getTopKnowledge(limit = 20): KnowledgeRecord[] {
    return Array.from(this.records.values())
      .sort((left, right) => right.score - left.score)
      .slice(0, Math.max(1, limit));
  }

  reset(): void {
    this.records.clear();
  }
}
