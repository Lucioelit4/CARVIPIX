import { InstitutionalDataPlatform } from "./core";
import {
  OFFICIAL_ECOSYSTEM_ASSETS,
  OfficialDataPlatformSource,
  type ConsumerAccessScope,
} from "./official-source";
import { FinnhubOfficialNewsAdapter, isFinnhubOfficialEnabled } from "./providers/finnhub";
import { TwelveDataOfficialMarketAdapter, isTwelveDataOfficialEnabled } from "./providers/twelve-data";
import type { DatasetKind } from "./types";

const DEFAULT_KINDS: DatasetKind[] = ["tick", "ohlc", "news", "economic-calendar", "metadata"];

function toBoolean(value: string | undefined): boolean {
  if (!value) {
    return false;
  }

  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}

function parseScope(value: string): ConsumerAccessScope | null {
  const candidate = value.trim() as ConsumerAccessScope;
  if (["query", "ultra-query", "catalog", "dashboard", "stream", "lineage"].includes(candidate)) {
    return candidate;
  }

  return null;
}

function registerDefaultConsumers(source: OfficialDataPlatformSource): void {
  const raw = process.env.DATA_PLATFORM_DEFAULT_MODULES;
  if (!raw || !raw.trim()) {
    return;
  }

  const moduleEntries = raw.split(",").map((segment) => segment.trim()).filter(Boolean);
  for (const moduleEntry of moduleEntries) {
    const [moduleIdRaw, scopesRaw] = moduleEntry.split(":");
    const moduleId = moduleIdRaw?.trim();
    if (!moduleId || !scopesRaw) {
      continue;
    }

    const scopes = scopesRaw
      .split("|")
      .map((scopeEntry) => parseScope(scopeEntry))
      .filter((scope): scope is ConsumerAccessScope => Boolean(scope));

    if (scopes.length === 0) {
      continue;
    }

    source.registerConsumerModule(moduleId, scopes);
  }
}

function configureScheduler(source: OfficialDataPlatformSource): void {
  if (!toBoolean(process.env.DATA_PLATFORM_ENABLE_SCHEDULER)) {
    return;
  }

  const intervalMs = Number(process.env.DATA_PLATFORM_SYNC_INTERVAL_MS ?? 15 * 60 * 1000);
  const dailyHourUtc = Number(process.env.DATA_PLATFORM_DAILY_HOUR_UTC ?? 2);
  const weeklyDayUtc = Number(process.env.DATA_PLATFORM_WEEKLY_DAY_UTC ?? 0);
  const weeklyHourUtc = Number(process.env.DATA_PLATFORM_WEEKLY_HOUR_UTC ?? 3);

  source.startScheduler({
    syncKinds: DEFAULT_KINDS,
    syncIntervalMs: Number.isFinite(intervalMs) ? Math.max(1000, Math.trunc(intervalMs)) : 15 * 60 * 1000,
    dailyHourUtc: Number.isFinite(dailyHourUtc) ? Math.max(0, Math.min(23, Math.trunc(dailyHourUtc))) : 2,
    weeklyDayUtc: Number.isFinite(weeklyDayUtc) ? Math.max(0, Math.min(6, Math.trunc(weeklyDayUtc))) : 0,
    weeklyHourUtc: Number.isFinite(weeklyHourUtc) ? Math.max(0, Math.min(23, Math.trunc(weeklyHourUtc))) : 3,
  });
}

let sourcePromise: Promise<OfficialDataPlatformSource> | null = null;

export async function getOfficialDataPlatformSource(): Promise<OfficialDataPlatformSource> {
  if (!sourcePromise) {
    sourcePromise = (async () => {
      const platform = new InstitutionalDataPlatform();
      const source = new OfficialDataPlatformSource(platform);
      await source.bootstrap();

      if (isTwelveDataOfficialEnabled()) {
        source.registerProvider(new TwelveDataOfficialMarketAdapter());
      }

      if (isFinnhubOfficialEnabled()) {
        source.registerProvider(new FinnhubOfficialNewsAdapter());
      }

      registerDefaultConsumers(source);
      configureScheduler(source);

      if (toBoolean(process.env.DATA_PLATFORM_BOOTSTRAP_HISTORY)) {
        await source.downloadHistoricalBootstrap({
          assets: [...OFFICIAL_ECOSYSTEM_ASSETS],
          kinds: ["tick", "ohlc", "spread"],
        });
      }

      return source;
    })();
  }

  return sourcePromise;
}
