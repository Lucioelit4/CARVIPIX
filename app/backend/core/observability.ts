export type ObservationKind = "response.time" | "service.usage" | "engine.usage" | "module.call";

export interface CounterObservation {
  kind: ObservationKind;
  metric: string;
  value: number;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface TimingObservation {
  kind: ObservationKind;
  metric: string;
  durationMs: number;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface BackendObservability {
  increment(metric: string, kind: ObservationKind, value?: number, metadata?: Record<string, unknown>): void;
  recordTiming(metric: string, kind: ObservationKind, durationMs: number, metadata?: Record<string, unknown>): void;
  startTimer(metric: string, kind: ObservationKind, metadata?: Record<string, unknown>): (extra?: Record<string, unknown>) => void;
  trackAsync<T>(
    metric: string,
    kind: ObservationKind,
    action: () => Promise<T>,
    metadata?: Record<string, unknown>
  ): Promise<T>;
}

export class InMemoryObservability implements BackendObservability {
  readonly counters: CounterObservation[] = [];
  readonly timings: TimingObservation[] = [];

  constructor(private readonly enabled = true) {}

  increment(
    metric: string,
    kind: ObservationKind,
    value = 1,
    metadata?: Record<string, unknown>
  ): void {
    if (!this.enabled) {
      return;
    }

    this.counters.push({
      kind,
      metric,
      value,
      timestamp: new Date().toISOString(),
      metadata,
    });
  }

  recordTiming(
    metric: string,
    kind: ObservationKind,
    durationMs: number,
    metadata?: Record<string, unknown>
  ): void {
    if (!this.enabled) {
      return;
    }

    this.timings.push({
      kind,
      metric,
      durationMs,
      timestamp: new Date().toISOString(),
      metadata,
    });
  }

  startTimer(metric: string, kind: ObservationKind, metadata?: Record<string, unknown>): (extra?: Record<string, unknown>) => void {
    const start = performance.now();

    return (extra?: Record<string, unknown>) => {
      const durationMs = performance.now() - start;
      this.recordTiming(metric, kind, durationMs, {
        ...metadata,
        ...extra,
      });
    };
  }

  async trackAsync<T>(
    metric: string,
    kind: ObservationKind,
    action: () => Promise<T>,
    metadata?: Record<string, unknown>
  ): Promise<T> {
    this.increment(`${metric}.calls`, kind, 1, metadata);
    const stopTimer = this.startTimer(metric, kind, metadata);

    try {
      const result = await action();
      stopTimer({ status: "ok" });
      return result;
    } catch (error) {
      this.increment(`${metric}.errors`, kind, 1, metadata);
      stopTimer({ status: "error" });
      throw error;
    }
  }
}
