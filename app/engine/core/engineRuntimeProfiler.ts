import type { BenchmarkResult, RuntimeProfileSnapshot } from '../types';

export class EngineRuntimeProfiler {
  private readonly snapshots: RuntimeProfileSnapshot[] = [];

  start(section: string): () => RuntimeProfileSnapshot {
    const startedAt = performance.now();
    const timestamp = Date.now();

    return () => {
      const elapsedMs = performance.now() - startedAt;
      const snapshot: RuntimeProfileSnapshot = {
        section,
        elapsedMs,
        timestamp,
      };
      this.snapshots.push(snapshot);
      if (this.snapshots.length > 2000) {
        this.snapshots.splice(0, this.snapshots.length - 2000);
      }
      return snapshot;
    };
  }

  getRecent(limit = 100): RuntimeProfileSnapshot[] {
    return this.snapshots.slice(-Math.max(1, limit));
  }

  benchmark(section: string, elapsedSamples: number[]): BenchmarkResult {
    const safeSamples = elapsedSamples.filter((value) => Number.isFinite(value) && value >= 0);
    const sorted = safeSamples.slice().sort((left, right) => left - right);

    const iterations = sorted.length;
    const totalMs = sorted.reduce((sum, value) => sum + value, 0);
    const averageMs = iterations > 0 ? totalMs / iterations : 0;
    const minMs = iterations > 0 ? sorted[0] : 0;
    const maxMs = iterations > 0 ? sorted[iterations - 1] : 0;
    const p95Index = iterations > 0 ? Math.floor((iterations - 1) * 0.95) : 0;
    const p95Ms = iterations > 0 ? sorted[p95Index] : 0;

    return {
      runId: `bench-${section}-${Date.now()}`,
      iterations,
      averageMs,
      minMs,
      maxMs,
      p95Ms,
      totalMs,
    };
  }

  reset(): void {
    this.snapshots.length = 0;
  }
}
