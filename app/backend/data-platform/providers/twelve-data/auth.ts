import type { TwelveDataRuntimeConfig } from "./types";

export function withTwelveDataApikey(config: TwelveDataRuntimeConfig, path: string, query: Record<string, string | number | undefined> = {}): string {
  const url = new URL(`${config.restBaseUrl}${path.startsWith("/") ? path : `/${path}`}`);
  for (const [key, value] of Object.entries(query)) {
    if (typeof value === "undefined" || value === null || value === "") {
      continue;
    }
    url.searchParams.set(key, String(value));
  }
  url.searchParams.set("apikey", config.apiKey);
  return url.toString();
}

export function twelveDataWebSocketUrl(config: TwelveDataRuntimeConfig): string {
  const url = new URL(config.wsBaseUrl);
  url.searchParams.set("apikey", config.apiKey);
  return url.toString();
}
