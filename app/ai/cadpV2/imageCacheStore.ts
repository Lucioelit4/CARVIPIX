export interface CachedImageRecord {
  snapshot_key: string;
  timeframe: string;
  image_hash: string;
  filename: string;
  created_at: string;
}

export class ImageCacheStore {
  private readonly map = new Map<string, CachedImageRecord>();

  private key(snapshotKey: string, timeframe: string): string {
    return `${snapshotKey}:${timeframe}`;
  }

  get(snapshotKey: string, timeframe: string): CachedImageRecord | null {
    return this.map.get(this.key(snapshotKey, timeframe)) ?? null;
  }

  save(record: CachedImageRecord): CachedImageRecord {
    this.map.set(this.key(record.snapshot_key, record.timeframe), record);
    return record;
  }
}
