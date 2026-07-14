import type { FinnhubRuntimeConfig } from "./types";

function readString(name: string, fallback = ""): string {
  return (process.env[name] ?? fallback).trim();
}

function readInt(name: string, fallback: number, min: number): number {
  const raw = Number(process.env[name]);
  if (!Number.isFinite(raw)) {
    return fallback;
  }
  return Math.max(min, Math.trunc(raw));
}

function readBool(name: string, fallback = false): boolean {
  const raw = readString(name);
  if (!raw) return fallback;
  return ["1", "true", "yes", "on"].includes(raw.toLowerCase());
}

export function getFinnhubRuntimeConfig(): FinnhubRuntimeConfig {
  const apiKey = readString("FINNHUB_API_KEY");
  if (!apiKey) {
    throw new Error("BLOCKED_BY_EXTERNAL_DEPENDENCY: FINNHUB_API_KEY");
  }

  return {
    apiKey,
    restBaseUrl: readString("FINNHUB_REST_BASE_URL", "https://finnhub.io/api/v1").replace(/\/+$/, ""),
    wsBaseUrl: readString("FINNHUB_WS_BASE_URL", "wss://ws.finnhub.io").replace(/\/+$/, ""),
    timeoutMs: readInt("FINNHUB_TIMEOUT_MS", 15000, 1000),
    maxRetries: readInt("FINNHUB_MAX_RETRIES", 1, 0),
    retryBaseMs: readInt("FINNHUB_RETRY_BASE_MS", 600, 100),
    evaluationMode: readBool("FINNHUB_EVALUATION_MODE", true),
  };
}

export function isFinnhubOfficialEnabled(): boolean {
  const apiKey = readString("FINNHUB_API_KEY");
  if (!apiKey) {
    return false;
  }

  const disabled = readString("DATA_PLATFORM_DISABLE_FINNHUB", "false");
  return !["1", "true", "yes", "on"].includes(disabled.toLowerCase());
}

// Backward compatibility alias for older evaluation-mode wiring.
export const isFinnhubEvaluationEnabled = isFinnhubOfficialEnabled;
