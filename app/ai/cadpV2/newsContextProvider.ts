import type { Asset } from "../../engine/types/marketData";
import type { NewsSource } from "../../engine/integrations/types";
import type { EconomicEventProvider } from "./economicEventProvider";
import type { CadpNewsBundle } from "./types";
import { NewsEvidenceBundleBuilder } from "./newsEvidenceBundleBuilder";

const ASSET_TO_CURRENCIES: Record<Asset, string[]> = {
  XAUUSD: ["USD"],
  EURUSD: ["EUR", "USD"],
  GBPUSD: ["GBP", "USD"],
  BTCUSD: ["USD"],
};

export class NewsContextProvider {
  constructor(
    private readonly economicProvider: EconomicEventProvider,
    private readonly newsSources: NewsSource[] = [],
    private readonly builder = new NewsEvidenceBundleBuilder()
  ) {}

  async build(input: { symbol: Asset; snapshotUtc: string }): Promise<CadpNewsBundle> {
    const fromUtc = new Date(Date.parse(input.snapshotUtc) - 60 * 60 * 1000).toISOString();
    const toUtc = new Date(Date.parse(input.snapshotUtc) + 24 * 60 * 60 * 1000).toISOString();
    const events = await this.economicProvider.getEvents({ symbol: input.symbol, fromUtc, toUtc });

    const headlines = [] as Array<{ source: string }>;
    for (const source of this.newsSources) {
      try {
        const items = await source.getHeadlines({
          from: Date.parse(fromUtc),
          to: Date.parse(toUtc),
          symbols: [input.symbol],
          limit: 30,
        });
        headlines.push(...items.map((item) => ({ source: item.source })));
      } catch {
        // Keep shadow flow resilient when an optional news source fails.
      }
    }

    const symbolCurrencies = ASSET_TO_CURRENCIES[input.symbol];
    const filteredEvents = events.filter((event) => event.currencies.some((c) => symbolCurrencies.includes(c)));
    const hasUnconfirmed = filteredEvents.some((event) => !event.confirmed);

    return this.builder.build({
      events: filteredEvents,
      sourceIds: [...new Set([this.economicProvider.getSourceId(), ...headlines.map((h) => h.source)])],
      researchUsed: true,
      verificationRequested: hasUnconfirmed,
      status: hasUnconfirmed ? "NEWS_UNCONFIRMED" : "CURRENT",
    });
  }
}
