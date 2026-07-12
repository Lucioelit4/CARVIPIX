export interface PromptCacheRecord {
  prompt_cache_key: string;
  core_hash: string;
  prompt_hash: string;
  prompt_text: string;
  cache_eligible: boolean;
  created_at: string;
}

export class PromptCacheStore {
  private readonly map = new Map<string, PromptCacheRecord>();

  get(promptCacheKey: string): PromptCacheRecord | null {
    return this.map.get(promptCacheKey) ?? null;
  }

  save(record: PromptCacheRecord): PromptCacheRecord {
    this.map.set(record.prompt_cache_key, record);
    return record;
  }
}
