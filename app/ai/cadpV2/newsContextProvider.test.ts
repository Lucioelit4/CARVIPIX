import test from "node:test";
import assert from "node:assert/strict";

import type { NewsSource } from "../../engine/integrations/types";
import { InMemoryNewsSource } from "../../engine/integrations/newsSource";
import type { EconomicEventProvider } from "./economicEventProvider";
import { NewsContextProvider } from "./newsContextProvider";

class MockEconomicProvider implements EconomicEventProvider {
  getSourceId(): string {
    return "mock-economic";
  }

  async getEvents(): Promise<Array<{ event_id: string; event_name: string; scheduled_utc: string; impact: "LOW" | "MEDIUM" | "HIGH"; currencies: string[]; source: string; confirmed: boolean }>> {
    return [
      {
        event_id: "ev1",
        event_name: "CPI",
        scheduled_utc: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        impact: "HIGH",
        currencies: ["USD"],
        source: "mock-economic",
        confirmed: true,
      },
    ];
  }
}

test("news context provider returns relevant bundle for symbol", async () => {
  const source: NewsSource = new InMemoryNewsSource([
    {
      id: "n1",
      title: "Gold reacts to CPI",
      publishedAt: Date.now(),
      source: "news-feed",
      symbols: ["XAUUSD"],
    },
  ]);
  await source.connect();

  const provider = new NewsContextProvider(new MockEconomicProvider(), [source]);
  const bundle = await provider.build({
    symbol: "XAUUSD",
    snapshotUtc: new Date().toISOString(),
  });

  assert.equal(bundle.events.length, 1);
  assert.ok(bundle.source_ids.includes("mock-economic"));
  assert.ok(bundle.source_ids.includes("news-feed"));
});
