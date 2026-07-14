import { withFinnhubToken } from "./auth";
import type { FinnhubRuntimeConfig } from "./types";
import { FinnhubRestClient } from "./restClient";

export interface FinnhubNewsItem {
  category?: string;
  datetime?: number;
  headline?: string;
  id?: number;
  image?: string;
  related?: string;
  source?: string;
  summary?: string;
  url?: string;
}

export class FinnhubNewsService {
  constructor(
    private readonly config: FinnhubRuntimeConfig,
    private readonly restClient = new FinnhubRestClient(config)
  ) {}

  async getGeneral(category: "general" | "forex" | "crypto" = "general"): Promise<{ items: FinnhubNewsItem[]; latencyMs: number }> {
    const url = withFinnhubToken(this.config, "/news", { category });
    const result = await this.restClient.getJson<FinnhubNewsItem[]>(url);
    return {
      items: Array.isArray(result.data) ? result.data : [],
      latencyMs: result.meta.latencyMs,
    };
  }

  async getCompanyNews(symbol: string, fromYmd: string, toYmd: string): Promise<{ items: FinnhubNewsItem[]; latencyMs: number }> {
    const url = withFinnhubToken(this.config, "/company-news", {
      symbol,
      from: fromYmd,
      to: toYmd,
    });
    const result = await this.restClient.getJson<FinnhubNewsItem[]>(url);
    return {
      items: Array.isArray(result.data) ? result.data : [],
      latencyMs: result.meta.latencyMs,
    };
  }

  static filterRelevant(items: FinnhubNewsItem[], keywords: string[]): FinnhubNewsItem[] {
    const normalized = keywords.map((k) => k.toLowerCase());
    return items.filter((item) => {
      const text = `${item.headline ?? ""} ${item.summary ?? ""} ${item.related ?? ""}`.toLowerCase();
      return normalized.some((keyword) => text.includes(keyword));
    });
  }
}
