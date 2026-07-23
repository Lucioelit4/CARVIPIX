import { withTwelveDataApikey } from "./auth";
import type { TwelveDataRuntimeConfig } from "./types";
import { TwelveDataRestClient } from "./restClient";
import { parseTwelveDataTimestampUtc } from "./timestamp";

export type TwelveInterval = "1min" | "5min" | "15min" | "30min" | "1h";

export interface TwelveDataTimeSeriesRow {
  datetimeRaw: string;
  datetime: string;
  timestampUtcMs: number | null;
  timestampParseReason: string | null;
  timestampAssumedUtc: boolean;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface TwelveDataTimeSeriesRawRow {
  datetime?: string;
  open?: string;
  high?: string;
  low?: string;
  close?: string;
  volume?: string;
}

interface TwelveDataTimeSeriesResponse {
  meta?: {
    symbol?: string;
    interval?: string;
    currency?: string;
    exchange_timezone?: string;
    exchange?: string;
    type?: string;
  };
  values?: TwelveDataTimeSeriesRawRow[];
}

export class TwelveDataTimeSeriesService {
  constructor(
    private readonly config: TwelveDataRuntimeConfig,
    private readonly restClient = new TwelveDataRestClient(config)
  ) {}

  async getSeries(input: {
    symbol: string;
    interval: TwelveInterval;
    outputsize?: number;
    timezone?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{
    rows: TwelveDataTimeSeriesRow[];
    latencyMs: number;
    timezone: string | null;
    exchange: string | null;
    marketType: string | null;
  }> {
    const url = withTwelveDataApikey(this.config, "/time_series", {
      symbol: input.symbol,
      interval: input.interval,
      outputsize: input.outputsize ?? 200,
      timezone: input.timezone ?? "UTC",
      start_date: input.startDate,
      end_date: input.endDate,
      order: "desc",
      format: "JSON",
    });

    const result = await this.restClient.getJson<TwelveDataTimeSeriesResponse>(url);
    const values = result.data.values ?? [];

    return {
      rows: values.map((row) => {
        const datetimeRaw = String(row.datetime ?? "");
        const parsed = parseTwelveDataTimestampUtc(datetimeRaw);
        return {
          datetimeRaw,
          datetime: datetimeRaw,
          timestampUtcMs: parsed.utcMs,
          timestampParseReason: parsed.reason,
          timestampAssumedUtc: parsed.assumedUtc,
          open: Number(row.open ?? NaN),
          high: Number(row.high ?? NaN),
          low: Number(row.low ?? NaN),
          close: Number(row.close ?? NaN),
          volume: Number(row.volume ?? 0),
        };
      }),
      latencyMs: result.meta.latencyMs,
      timezone: result.data.meta?.exchange_timezone ?? null,
      exchange: result.data.meta?.exchange ?? null,
      marketType: result.data.meta?.type ?? null,
    };
  }
}
