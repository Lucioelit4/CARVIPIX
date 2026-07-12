import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import type { Candle, Timeframe } from "../../engine/types/marketData";
import type { CadpVisualManifestImage } from "./types";

const CHART_DIR = path.join(process.cwd(), "data", "ai-charts");

function ensureDir(): void {
  if (!fs.existsSync(CHART_DIR)) {
    fs.mkdirSync(CHART_DIR, { recursive: true });
  }
}

function toPoints(candles: Candle[], width: number, height: number): string {
  if (candles.length === 0) return "";
  const lows = candles.map((c) => c.low);
  const highs = candles.map((c) => c.high);
  const min = Math.min(...lows);
  const max = Math.max(...highs);
  const span = Math.max(1e-9, max - min);
  return candles
    .map((candle, i) => {
      const x = (i / Math.max(1, candles.length - 1)) * (width - 40) + 20;
      const y = height - ((candle.close - min) / span) * (height - 40) - 20;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

export class VisualChartRenderer {
  render(input: {
    analysisId: string;
    snapshotUtc: string;
    timeframe: Timeframe;
    candles: Candle[];
    ema20: number;
    ema50: number;
    ema200: number;
    structuralHighs: number[];
    structuralLows: number[];
    supportZones: number[];
    resistanceZones: number[];
    currentPrice: number;
  }): CadpVisualManifestImage {
    ensureDir();

    const width = 1280;
    const height = 720;
    const points = toPoints(input.candles.slice(-64), width, height);
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="100%" height="100%" fill="#0f172a" />
  <text x="24" y="36" fill="#e2e8f0" font-size="18">${input.timeframe} | ${input.analysisId}</text>
  <text x="24" y="60" fill="#94a3b8" font-size="14">${input.snapshotUtc}</text>
  <polyline fill="none" stroke="#38bdf8" stroke-width="2" points="${points}" />
  <line x1="20" y1="680" x2="1260" y2="680" stroke="#334155" stroke-width="1" />
  <line x1="20" y1="20" x2="20" y2="680" stroke="#334155" stroke-width="1" />
  <text x="1040" y="36" fill="#f59e0b" font-size="14">EMA20: ${input.ema20.toFixed(4)}</text>
  <text x="1040" y="58" fill="#a3e635" font-size="14">EMA50: ${input.ema50.toFixed(4)}</text>
  <text x="1040" y="80" fill="#f472b6" font-size="14">EMA200: ${input.ema200.toFixed(4)}</text>
  <text x="24" y="700" fill="#cbd5e1" font-size="13">Current: ${input.currentPrice.toFixed(5)}</text>
</svg>`;

    const sha256 = createHash("sha256").update(svg).digest("hex");
    const filename = `${input.analysisId}_${input.timeframe}_${sha256.slice(0, 12)}.svg`;
    const filePath = path.join(CHART_DIR, filename);
    fs.writeFileSync(filePath, svg, "utf8");

    return {
      timeframe: input.timeframe,
      filename,
      width,
      height,
      first_candle_timestamp: input.candles[0]?.timestamp ?? null,
      last_closed_candle_timestamp: [...input.candles].reverse().find((c) => c.complete)?.timestamp ?? null,
      open_candle_included: input.candles.some((c) => !c.complete),
      sha256,
      source_snapshot_id: input.analysisId,
    };
  }
}
