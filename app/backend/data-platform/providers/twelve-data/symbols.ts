import { withTwelveDataApikey } from "./auth";
import type { TwelveDataRuntimeConfig } from "./types";
import { TwelveDataRestClient } from "./restClient";

export interface TwelveDataSymbolMatch {
  symbol: string;
  instrument_name?: string;
  currency?: string;
  exchange?: string;
  type?: string;
  country?: string;
  mic_code?: string;
  provider?: string;
}

export class TwelveDataSymbolService {
  constructor(
    private readonly config: TwelveDataRuntimeConfig,
    private readonly restClient = new TwelveDataRestClient(config)
  ) {}

  async search(query: string): Promise<{ data: TwelveDataSymbolMatch[]; latencyMs: number }> {
    const url = withTwelveDataApikey(this.config, "/symbol_search", { symbol: query, outputsize: 30 });
    const result = await this.restClient.getJson<{ data?: TwelveDataSymbolMatch[] }>(url);
    return {
      data: result.data.data ?? [],
      latencyMs: result.meta.latencyMs,
    };
  }
}
