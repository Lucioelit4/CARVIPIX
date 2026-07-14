import type { Asset } from "@/app/engine/types/marketData";
import { withTwelveDataApikey } from "./auth";
import type { TwelveDataRuntimeConfig } from "./types";
import { TwelveDataRestClient } from "./restClient";

const SYMBOL_CANDIDATES: Record<Asset, string[]> = {
  XAUUSD: ["XAU/USD", "XAUUSD"],
  BTCUSD: ["BTC/USD", "BTCUSD"],
  EURUSD: ["EUR/USD", "EURUSD"],
  GBPUSD: ["GBP/USD", "GBPUSD"],
};

export interface TwelveDataQuote {
  symbol: string;
  price: number;
  ask?: number;
  bid?: number;
  timestamp?: number;
  datetime?: string;
  exchange?: string;
  mic_code?: string;
  currency?: string;
  latencyMs: number;
}

interface TwelveDataQuoteResponse {
  symbol?: string;
  price?: string;
  close?: string;
  open?: string;
  high?: string;
  low?: string;
  ask?: string;
  bid?: string;
  timestamp?: number;
  datetime?: string;
  exchange?: string;
  mic_code?: string;
  currency?: string;
}

function isValidQuote(payload: TwelveDataQuoteResponse): boolean {
  return Number.isFinite(Number(payload.price ?? payload.close));
}

export class TwelveDataQuoteService {
  constructor(
    private readonly config: TwelveDataRuntimeConfig,
    private readonly restClient = new TwelveDataRestClient(config)
  ) {}

  async quoteByProviderSymbol(providerSymbol: string): Promise<TwelveDataQuote> {
    const url = withTwelveDataApikey(this.config, "/quote", { symbol: providerSymbol });
    const result = await this.restClient.getJson<TwelveDataQuoteResponse>(url);
    const quote = result.data;
    const parsedPrice = Number(quote.price ?? quote.close ?? NaN);
    const parsedBid = Number(quote.bid ?? NaN);
    const parsedAsk = Number(quote.ask ?? NaN);

    return {
      symbol: quote.symbol ?? providerSymbol,
      price: parsedPrice,
      ask: Number.isFinite(parsedAsk) ? parsedAsk : undefined,
      bid: Number.isFinite(parsedBid) ? parsedBid : undefined,
      timestamp: quote.timestamp,
      datetime: quote.datetime,
      exchange: quote.exchange,
      mic_code: quote.mic_code,
      currency: quote.currency,
      latencyMs: result.meta.latencyMs,
    };
  }

  async quoteAsset(asset: Asset): Promise<{ asset: Asset; selectedSymbol: string | null; quote: TwelveDataQuote | null }> {
    for (const symbol of SYMBOL_CANDIDATES[asset]) {
      try {
        const quote = await this.quoteByProviderSymbol(symbol);
        if (isValidQuote({ price: String(quote.price) })) {
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
