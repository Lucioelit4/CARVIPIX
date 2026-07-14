import type { FinnhubRuntimeConfig } from "./types";

export function withFinnhubToken(config: FinnhubRuntimeConfig, path: string, query: Record<string, string | number | undefined> = {}): string {
  const url = new URL(`${config.restBaseUrl}${path.startsWith("/") ? path : `/${path}`}`);
  for (const [key, value] of Object.entries(query)) {
    if (typeof value === "undefined" || value === null || value === "") {
      continue;
    }
    url.searchParams.set(key, String(value));
  }
  url.searchParams.set("token", config.apiKey);
  return url.toString();
}

export function finnhubWebSocketUrl(config: FinnhubRuntimeConfig): string {
  const url = new URL(config.wsBaseUrl);
  url.searchParams.set("token", config.apiKey);
  return url.toString();
}
