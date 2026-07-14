import type { Asset } from "@/app/engine/types/marketData";
import { withFinnhubToken } from "./auth";
import type { FinnhubRuntimeConfig } from "./types";
import { FinnhubRestClient } from "./restClient";

export interface FinnhubSymbolMatch {
  description: string;
  displaySymbol: string;
  symbol: string;
  type?: string;
}

const ASSET_QUERIES: Record<Asset, string> = {
  XAUUSD: "XAUUSD",
  BTCUSD: "BTCUSD",
  EURUSD: "EURUSD",
  GBPUSD: "GBPUSD",
};

export class FinnhubSymbolService {
  constructor(
    private readonly config: FinnhubRuntimeConfig,
    private readonly restClient = new FinnhubRestClient(config)
  ) {}

  async search(query: string): Promise<{ matches: FinnhubSymbolMatch[]; latencyMs: number }> {
    const url = withFinnhubToken(this.config, "/search", { q: query });
    const result = await this.restClient.getJson<{ result?: FinnhubSymbolMatch[] }>(url);
    return {
      matches: result.data.result ?? [],
      latencyMs: result.meta.latencyMs,
    };
  }

  async searchAsset(asset: Asset): Promise<{ asset: Asset; query: string; matches: FinnhubSymbolMatch[]; latencyMs: number }> {
    const query = ASSET_QUERIES[asset];
    const result = await this.search(query);
    return {
      asset,
      query,
      matches: result.matches,
      latencyMs: result.latencyMs,
    };
  }
}
