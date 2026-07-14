import type { Asset } from "@/app/engine/types/marketData";
import { withFinnhubToken } from "./auth";
import type { FinnhubRuntimeConfig } from "./types";
import { FinnhubRestClient } from "./restClient";

const SYMBOL_CANDIDATES: Record<Asset, string[]> = {
  XAUUSD: ["OANDA:XAU_USD", "FOREXCOM:XAUUSD", "XAUUSD"],
  BTCUSD: ["BINANCE:BTCUSDT", "COINBASE:BTC-USD", "BTCUSD"],
  EURUSD: ["OANDA:EUR_USD", "FOREXCOM:EURUSD", "EURUSD"],
  GBPUSD: ["OANDA:GBP_USD", "FOREXCOM:GBPUSD", "GBPUSD"],
};

export interface FinnhubQuote {
  symbolRequested: string;
  bid: number;
  ask: number;
  close: number;
  high: number;
  low: number;
  open: number;
  timestamp: number;
  latencyMs: number;
}

interface FinnhubQuoteResponse {
  c?: number;
  h?: number;
  l?: number;
  o?: number;
  pc?: number;
  t?: number;
}

function quoteSeemsValid(payload: FinnhubQuoteResponse): boolean {
  return Number.isFinite(payload.c) && Number.isFinite(payload.t) && Number(payload.t) > 0;
}

export class FinnhubPriceService {
  constructor(
    private readonly config: FinnhubRuntimeConfig,
    private readonly restClient = new FinnhubRestClient(config)
  ) {}

  async quoteByProviderSymbol(providerSymbol: string): Promise<FinnhubQuote> {
    const url = withFinnhubToken(this.config, "/quote", { symbol: providerSymbol });
    const result = await this.restClient.getJson<FinnhubQuoteResponse>(url);
    const quote = result.data;

    return {
      symbolRequested: providerSymbol,
      bid: Number(quote.c ?? NaN),
      ask: Number(quote.c ?? NaN),
      close: Number(quote.c ?? NaN),
      high: Number(quote.h ?? NaN),
      low: Number(quote.l ?? NaN),
      open: Number(quote.o ?? NaN),
      timestamp: Number(quote.t ?? 0),
      latencyMs: result.meta.latencyMs,
    };
  }

  async quoteAsset(asset: Asset): Promise<{ asset: Asset; selectedSymbol: string | null; quote: FinnhubQuote | null }> {
    for (const symbol of SYMBOL_CANDIDATES[asset]) {
      try {
        const quote = await this.quoteByProviderSymbol(symbol);
        if (quoteSeemsValid({ c: quote.close, t: quote.timestamp })) {
          return {
            asset,
            selectedSymbol: symbol,
            quote,
          };
        }
      } catch {
        // Continue with next symbol candidate.
      }
    }

    return {
      asset,
      selectedSymbol: null,
      quote: null,
    };
  }
}
