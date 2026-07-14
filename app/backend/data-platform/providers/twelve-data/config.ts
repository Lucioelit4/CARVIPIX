import type { TwelveDataRuntimeConfig } from "./types";

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

export function getTwelveDataRuntimeConfig(): TwelveDataRuntimeConfig {
  const apiKey = readString("TWELVE_DATA_API_KEY");
  if (!apiKey) {
    throw new Error("BLOCKED_BY_EXTERNAL_DEPENDENCY: TWELVE_DATA_API_KEY");
  }

  return {
    apiKey,
    restBaseUrl: readString("TWELVE_DATA_REST_BASE_URL", "https://api.twelvedata.com").replace(/\/+$/, ""),
    wsBaseUrl: readString("TWELVE_DATA_WS_BASE_URL", "wss://ws.twelvedata.com/v1/quotes/price").replace(/\/+$/, ""),
    timeoutMs: readInt("TWELVE_DATA_TIMEOUT_MS", 15000, 1000),
    maxRetries: readInt("TWELVE_DATA_MAX_RETRIES", 1, 0),
    retryBaseMs: readInt("TWELVE_DATA_RETRY_BASE_MS", 600, 100),
    evaluationMode: readBool("TWELVE_DATA_EVALUATION_MODE", true),
  };
}

export function isTwelveDataOfficialEnabled(): boolean {
  const apiKey = readString("TWELVE_DATA_API_KEY");
  if (!apiKey) {
    return false;
  }

  const disabled = readString("DATA_PLATFORM_DISABLE_TWELVE_DATA", "false");
  return !["1", "true", "yes", "on"].includes(disabled.toLowerCase());
}

// Backward compatibility alias for older evaluation-mode wiring.
export const isTwelveDataEvaluationEnabled = isTwelveDataOfficialEnabled;
