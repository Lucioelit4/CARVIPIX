import type { EvidenceAssessment } from '../types';

interface EvidenceCacheEntry {
  key: string;
  value: EvidenceAssessment;
  expiresAt: number;
}

export class EvidenceCache {
  private readonly entries = new Map<string, EvidenceCacheEntry>();

  get(key: string, now = Date.now()): EvidenceAssessment | null {
    const entry = this.entries.get(key);
    if (!entry) {
      return null;
    }

    if (entry.expiresAt <= now) {
      this.entries.delete(key);
      return null;
    }

    return entry.value;
  }

  set(key: string, value: EvidenceAssessment, ttlMs: number): void {
    this.entries.set(key, {
      key,
      value,
      expiresAt: Date.now() + Math.max(1, ttlMs),
    });
  }

  prune(now = Date.now()): number {
    let removed = 0;
    for (const [key, entry] of this.entries.entries()) {
      if (entry.expiresAt <= now) {
        this.entries.delete(key);
        removed += 1;
      }
    }

    return removed;
  }

  clear(): void {
    this.entries.clear();
  }
}
