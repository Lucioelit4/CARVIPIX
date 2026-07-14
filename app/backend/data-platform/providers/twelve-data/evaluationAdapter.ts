import { createHash } from "node:crypto";

import type { DataProviderAdapter, DataRecord, ProviderPullRequest, ProviderPullResponse } from "../../types";
import { getTwelveDataRuntimeConfig } from "./config";
import { TwelveDataQuoteService } from "./quotes";
import { TwelveDataTimeSeriesService } from "./timeSeries";

const EVAL_ASSETS = ["XAUUSD", "BTCUSD", "EURUSD", "GBPUSD"] as const;

function toId(parts: string[]): string {
  return createHash("sha256").update(parts.join("|")).digest("hex").slice(0, 24);
}

export class TwelveDataEvaluationAdapter implements DataProviderAdapter {
  id = "twelve-data-market";
  priority = 95;
  supports = ["tick", "ohlc", "metadata"] as const;

  private readonly config = getTwelveDataRuntimeConfig();
  private readonly quotes = new TwelveDataQuoteService(this.config);
  private readonly series = new TwelveDataTimeSeriesService(this.config);

  async pullIncremental(request: ProviderPullRequest): Promise<ProviderPullResponse> {
    if (request.kind === "tick") {
      return await this.pullTicks();
    }

    if (request.kind === "ohlc") {
      return await this.pullOhlc();
    }

    if (request.kind === "metadata") {
      return {
        records: [
          {
            kind: "metadata",
            id: toId(["metadata", this.id, String(Date.now())]),
            provider: this.id,
            ts: Date.now(),
            key: "role",
            value: "official-market",
          },
        ],
      };
    }

    return { records: [] };
  }

  private async pullTicks(): Promise<ProviderPullResponse> {
    const records: DataRecord[] = [];

    for (const asset of EVAL_ASSETS) {
      const result = await this.quotes.quoteAsset(asset);
      if (!result.quote) {
        continue;
      }
      const ts = result.quote.timestamp ? result.quote.timestamp * 1000 : Date.now();
      const bid = Number.isFinite(result.quote.bid ?? NaN) ? Number(result.quote.bid) : result.quote.price;
      const ask = Number.isFinite(result.quote.ask ?? NaN) ? Number(result.quote.ask) : result.quote.price;

      records.push({
        kind: "tick",
        id: toId(["tick", asset, String(ts)]),
        provider: this.id,
        asset,
        ts,
        bid,
        ask,
        metadata: {
          providerSymbol: result.selectedSymbol,
          exchange: result.quote.exchange,
          latencyMs: result.quote.latencyMs,
        },
      });
    }

    return { records };
  }

  private async pullOhlc(): Promise<ProviderPullResponse> {
    const records: DataRecord[] = [];

    for (const asset of EVAL_ASSETS) {
      const result = await this.quotes.quoteAsset(asset);
      if (!result.selectedSymbol) {
        continue;
      }

      const series = await this.series.getSeries({
        symbol: result.selectedSymbol,
        interval: "5min",
        outputsize: 60,
      });

      for (const row of series.rows) {
        const ts = Date.parse(row.datetime);
        if (!Number.isFinite(ts)) {
          continue;
        }

        records.push({
          kind: "ohlc",
          id: toId(["ohlc", asset, String(ts)]),
          provider: this.id,
          asset,
          ts,
          timeframe: "5M",
          open: row.open,
          high: row.high,
          low: row.low,
          close: row.close,
          volume: row.volume,
          metadata: {
            providerSymbol: result.selectedSymbol,
            timezone: series.timezone,
            exchange: series.exchange,
            marketType: series.marketType,
            latencyMs: series.latencyMs,
          },
        });
      }
    }

    return { records };
  }
}
