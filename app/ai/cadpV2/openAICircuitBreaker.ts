export type OpenAICircuitState = "CLOSED" | "OPEN" | "HALF_OPEN";

export interface OpenAICircuitSnapshot {
  state: OpenAICircuitState;
  open: boolean;
  reset_at: string | null;
  consecutive_errors: number;
}

export class OpenAICircuitBreaker {
  private state: OpenAICircuitState = "CLOSED";
  private consecutiveErrors = 0;
  private resetAt: number | null = null;
  private halfOpenProbeInFlight = false;

  constructor(
    private readonly maxConsecutiveErrors = 5,
    private readonly cooldownMs = 5 * 60 * 1000,
    private readonly now: () => number = Date.now,
  ) {}

  allowRequest(): boolean {
    if (this.state === "CLOSED") {
      return true;
    }

    if (this.state === "OPEN") {
      if (this.resetAt === null || this.now() < this.resetAt) {
        return false;
      }

      this.state = "HALF_OPEN";
    }

    if (this.halfOpenProbeInFlight) {
      return false;
    }

    this.halfOpenProbeInFlight = true;
    return true;
  }

  recordSuccess(): void {
    this.state = "CLOSED";
    this.consecutiveErrors = 0;
    this.resetAt = null;
    this.halfOpenProbeInFlight = false;
  }

  recordFailure(retryAfterMs?: number): void {
    this.consecutiveErrors += 1;
    this.halfOpenProbeInFlight = false;

    if (this.state === "HALF_OPEN" || this.consecutiveErrors >= this.maxConsecutiveErrors) {
      this.state = "OPEN";
      this.resetAt = this.now() + Math.max(this.cooldownMs, retryAfterMs ?? 0);
    }
  }

  isBlockingRequests(): boolean {
    if (this.state === "CLOSED") {
      return false;
    }

    return this.state === "HALF_OPEN" || this.resetAt === null || this.now() < this.resetAt;
  }

  getSnapshot(): OpenAICircuitSnapshot {
    return {
      state: this.state,
      open: this.state !== "CLOSED",
      reset_at: this.resetAt === null ? null : new Date(this.resetAt).toISOString(),
      consecutive_errors: this.consecutiveErrors,
    };
  }
}