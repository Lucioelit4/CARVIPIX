export interface BackendCacheEntry<TValue = unknown> {
  key: string;
  value: TValue;
  expiresAtMs: number;
  createdAtMs: number;
}

export interface BackendCache {
  get<TValue = unknown>(key: string): TValue | null;
  set<TValue = unknown>(key: string, value: TValue, ttlMs?: number): void;
  delete(key: string): void;
  clear(): void;
  remember<TValue = unknown>(key: string, producer: () => Promise<TValue>, ttlMs?: number): Promise<TValue>;
}

export class InMemoryBackendCache implements BackendCache {
  private readonly entries = new Map<string, BackendCacheEntry>();

  constructor(
    private readonly defaultTtlMs: number,
    private readonly maxEntries: number
  ) {}

  get<TValue = unknown>(key: string): TValue | null {
    const current = this.entries.get(key);
    if (!current) {
      return null;
    }

    if (current.expiresAtMs <= Date.now()) {
      this.entries.delete(key);
      return null;
    }

    return current.value as TValue;
  }

  set<TValue = unknown>(key: string, value: TValue, ttlMs = this.defaultTtlMs): void {
    this.compactIfNeeded();

    const nowMs = Date.now();
    const entry: BackendCacheEntry<TValue> = {
      key,
      value,
      createdAtMs: nowMs,
      expiresAtMs: nowMs + ttlMs,
    };

    this.entries.set(key, entry);
  }

  delete(key: string): void {
    this.entries.delete(key);
  }

  clear(): void {
    this.entries.clear();
  }

  async remember<TValue = unknown>(
    key: string,
    producer: () => Promise<TValue>,
    ttlMs = this.defaultTtlMs
  ): Promise<TValue> {
    const cached = this.get<TValue>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await producer();
    this.set(key, value, ttlMs);
    return value;
  }

  private compactIfNeeded(): void {
    if (this.entries.size < this.maxEntries) {
      return;
    }

    const nowMs = Date.now();
    for (const [key, entry] of this.entries.entries()) {
      if (entry.expiresAtMs <= nowMs) {
        this.entries.delete(key);
      }
    }

    if (this.entries.size < this.maxEntries) {
      return;
    }

    const oldest = Array.from(this.entries.values()).sort((a, b) => a.createdAtMs - b.createdAtMs).slice(0, 50);
    oldest.forEach((entry) => {
      this.entries.delete(entry.key);
    });
  }
}
