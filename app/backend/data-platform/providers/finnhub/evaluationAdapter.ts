import { createHash } from "node:crypto";

import type { DataProviderAdapter, DataRecord, ProviderPullRequest, ProviderPullResponse } from "../../types";
import { getFinnhubRuntimeConfig } from "./config";
import { FinnhubNewsService } from "./news";

function toId(parts: string[]): string {
  return createHash("sha256").update(parts.join("|")).digest("hex").slice(0, 24);
}

export class FinnhubEvaluationAdapter implements DataProviderAdapter {
  id = "finnhub-news";
  priority = 100;
  supports = ["news", "metadata"] as const;

  private readonly config = getFinnhubRuntimeConfig();
  private readonly news = new FinnhubNewsService(this.config);

  async pullIncremental(request: ProviderPullRequest): Promise<ProviderPullResponse> {
    if (request.kind === "news") {
      return await this.pullNews();
    }

    if (request.kind === "metadata") {
      return {
        records: [
          {
            kind: "metadata",
            id: toId(["metadata", "finnhub-news", String(Date.now())]),
            provider: this.id,
            ts: Date.now(),
            key: "role",
            value: "official-news-context",
          },
        ],
      };
    }

    return { records: [] };
  }

  private async pullNews(): Promise<ProviderPullResponse> {
    const general = await this.news.getGeneral("general");
    const forex = await this.news.getGeneral("forex");
    const crypto = await this.news.getGeneral("crypto");

    const all = [...general.items, ...forex.items, ...crypto.items];

    const records: DataRecord[] = all.slice(0, 100).map((item, index) => ({
      kind: "news",
      id: toId(["news", String(item.id ?? index), String(item.datetime ?? 0)]),
      provider: this.id,
      ts: Number(item.datetime ?? Math.trunc(Date.now() / 1000)) * 1000,
      headline: item.headline ?? "UNTITLED",
      body: item.summary,
      language: "en",
      metadata: {
        source: item.source,
        related: item.related,
        url: item.url,
      },
    }));

    return { records };
  }
}
