import { ExternalHealthStatus, NewsItem, NewsQuery, NewsSource } from './types';

export class InMemoryNewsSource implements NewsSource {
  readonly descriptor = {
    id: 'news-in-memory',
    domain: 'news' as const,
    name: 'In-Memory News Source',
    version: '1.0',
  };

  private connected = false;
  private readonly items: NewsItem[];

  constructor(seedItems: NewsItem[] = []) {
    this.items = [...seedItems];
  }

  async connect(): Promise<void> {
    this.connected = true;
  }

  async disconnect(): Promise<void> {
    this.connected = false;
  }

  async getHeadlines(query: NewsQuery): Promise<NewsItem[]> {
    this.ensureConnected();

    let results = this.items.filter((item) => {
      if (item.publishedAt < query.from || item.publishedAt > query.to) {
        return false;
      }

      if (query.symbols && query.symbols.length > 0) {
        if (!item.symbols || item.symbols.length === 0) {
          return false;
        }

        return item.symbols.some((symbol) => query.symbols?.includes(symbol));
      }

      return true;
    });

    results = results.sort((a, b) => b.publishedAt - a.publishedAt);

    if (query.limit && query.limit > 0) {
      results = results.slice(0, query.limit);
    }

    return results;
  }

  async checkHealth(): Promise<ExternalHealthStatus> {
    return {
      sourceId: this.descriptor.id,
      domain: this.descriptor.domain,
      healthy: this.connected,
      lastCheckedAt: Date.now(),
      message: this.connected
        ? `News source ready with ${this.items.length} headlines`
        : 'News source disconnected',
    };
  }

  private ensureConnected(): void {
    if (!this.connected) {
      throw new Error('News source is not connected.');
    }
  }
}
