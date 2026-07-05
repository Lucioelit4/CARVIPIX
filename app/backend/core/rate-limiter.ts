export type RateLimitScope = "api" | "auth" | "query" | "service" | string;

export interface RateLimitPolicy {
  scope: RateLimitScope;
  key: string;
  limit: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  policy: RateLimitPolicy;
}

export interface RateLimiter {
  check(policy: RateLimitPolicy): RateLimitResult;
  reset(scope: RateLimitScope, key: string): void;
}

interface RateLimitBucket {
  count: number;
  resetAtMs: number;
}

function createBucketKey(scope: RateLimitScope, key: string): string {
  return `${scope}:${key}`;
}

export class InMemoryRateLimiter implements RateLimiter {
  private readonly buckets = new Map<string, RateLimitBucket>();

  check(policy: RateLimitPolicy): RateLimitResult {
    const nowMs = Date.now();
    const bucketKey = createBucketKey(policy.scope, policy.key);
    const current = this.buckets.get(bucketKey);

    if (!current || current.resetAtMs <= nowMs) {
      const resetAtMs = nowMs + policy.windowMs;
      this.buckets.set(bucketKey, {
        count: 1,
        resetAtMs,
      });

      return {
        allowed: true,
        remaining: Math.max(0, policy.limit - 1),
        resetAt: new Date(resetAtMs),
        policy,
      };
    }

    const nextCount = current.count + 1;
    current.count = nextCount;
    this.buckets.set(bucketKey, current);

    const allowed = nextCount <= policy.limit;
    const remaining = allowed ? Math.max(0, policy.limit - nextCount) : 0;

    return {
      allowed,
      remaining,
      resetAt: new Date(current.resetAtMs),
      policy,
    };
  }

  reset(scope: RateLimitScope, key: string): void {
    this.buckets.delete(createBucketKey(scope, key));
  }
}
