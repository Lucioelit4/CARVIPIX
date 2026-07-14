import { withFinnhubToken } from "./auth";
import type { FinnhubRuntimeConfig } from "./types";
import { FinnhubRestClient } from "./restClient";

export interface FinnhubCandlePoint {
  ts: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface FinnhubCandleResponse {
  c?: number[];
  h?: number[];
  l?: number[];
  o?: number[];
  t?: number[];
  v?: number[];
  s?: string;
}

export class FinnhubCandleService {
  constructor(
    private readonly config: FinnhubRuntimeConfig,
    private readonly restClient = new FinnhubRestClient(config)
  ) {}

  async getCandles(input: {
    symbol: string;
    resolution: "1" | "5" | "15" | "30" | "60" | "D";
    fromTs: number;
    toTs: number;
  }): Promise<{ status: string; candles: FinnhubCandlePoint[]; latencyMs: number }> {
    const url = withFinnhubToken(this.config, "/stock/candle", {
      symbol: input.symbol,
      resolution: input.resolution,
      from: Math.trunc(input.fromTs),
      to: Math.trunc(input.toTs),
    });

    const result = await this.restClient.getJson<FinnhubCandleResponse>(url);
    const payload = result.data;

    const t = payload.t ?? [];
    const o = payload.o ?? [];
    const h = payload.h ?? [];
    const l = payload.l ?? [];
    const c = payload.c ?? [];
    const v = payload.v ?? [];

    const candles: FinnhubCandlePoint[] = [];
    for (let i = 0; i < t.length; i += 1) {
      candles.push({
        ts: Number(t[i] ?? 0),
        open: Number(o[i] ?? NaN),
        high: Number(h[i] ?? NaN),
        low: Number(l[i] ?? NaN),
        close: Number(c[i] ?? NaN),
        volume: Number(v[i] ?? 0),
      });
    }

    return {
      status: payload.s ?? "unknown",
      candles,
      latencyMs: result.meta.latencyMs,
    };
  }
}
