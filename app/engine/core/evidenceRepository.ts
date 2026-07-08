import type { EvidenceItem } from '../types';

export class EvidenceRepository {
  private readonly store = new Map<string, EvidenceItem>();

  upsert(items: EvidenceItem[]): void {
    for (const item of items) {
      this.store.set(item.id, item);
    }
  }

  getActive(now = Date.now()): EvidenceItem[] {
    const active: EvidenceItem[] = [];
    for (const item of this.store.values()) {
      if (item.expiresAt > now) {
        active.push(item);
      }
    }

    active.sort((left, right) => {
      const leftScore = left.weight * left.confidence;
      const rightScore = right.weight * right.confidence;
      return rightScore - leftScore;
    });

    return active;
  }

  pruneExpired(now = Date.now()): number {
    let removed = 0;
    for (const [id, item] of this.store.entries()) {
      if (item.expiresAt <= now) {
        this.store.delete(id);
        removed += 1;
      }
    }

    return removed;
  }

  size(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }
}
