import type { AssetWarehouseStatus, InstitutionalAsset, WarehouseCoverageSummary, WarehouseDashboardSnapshot } from "./types";
import { OFFICIAL_ASSET_TIERS, OFFICIAL_TIMEFRAMES } from "./types";
import { listWarehouseConnectorDescriptors } from "./connectors";

export function buildWarehouseDashboard(
  summaries: WarehouseCoverageSummary[],
  certifiedDatasets: string[],
): WarehouseDashboardSnapshot {
  const assets = (Object.keys(OFFICIAL_ASSET_TIERS) as InstitutionalAsset[]).map((symbol) =>
    buildAssetStatus(symbol, summaries.filter((item) => item.symbol === symbol)),
  );

  return {
    generatedAt: Date.now(),
    assets,
    certifiedDatasets,
    pendingDownloads: assets
      .filter((asset) => asset.missingTimeframes.length > 0)
      .map((asset) => ({
        symbol: asset.symbol,
        missingTimeframes: asset.missingTimeframes,
        currentCoverage: asset.coverage,
      })),
    providers: listWarehouseConnectorDescriptors(),
  };
}

function buildAssetStatus(symbol: InstitutionalAsset, summaries: WarehouseCoverageSummary[]): AssetWarehouseStatus {
  const totalCoverage = summaries.length === 0 ? 0 : summaries.reduce((acc, item) => acc + item.coverage, 0) / summaries.length;
  const totalQuality = summaries.length === 0 ? 0 : summaries.reduce((acc, item) => acc + item.qualityScore, 0) / summaries.length;
  const certifiedDatasets = summaries
    .filter((item) => item.certifiedRows > 0 && item.latestVersion)
    .map((item) => `${symbol}_${item.timeframe}_${item.latestVersion}`);
  const providerUsage = Array.from(new Set(summaries.map((item) => item.provider).filter((item): item is NonNullable<typeof item> => item !== null)));
  const missingTimeframes = OFFICIAL_TIMEFRAMES.filter((timeframe) => !summaries.some((item) => item.timeframe === timeframe && item.rows > 0));
  const yearsAvailable = calculateYearsAvailable(summaries);

  return {
    symbol,
    tier: OFFICIAL_ASSET_TIERS[symbol],
    coverage: Number(totalCoverage.toFixed(2)),
    quality: Number(totalQuality.toFixed(2)),
    certifiedDatasets,
    yearsAvailable,
    providerUsage,
    missingTimeframes,
    missingYearsTo10: Math.max(0, 10 - yearsAvailable),
  };
}

function calculateYearsAvailable(summaries: WarehouseCoverageSummary[]): number {
  const withBounds = summaries.filter((item) => item.startTimestampUtc !== null && item.endTimestampUtc !== null);
  if (withBounds.length === 0) {
    return 0;
  }
  const earliest = Math.min(...withBounds.map((item) => item.startTimestampUtc as number));
  const latest = Math.max(...withBounds.map((item) => item.endTimestampUtc as number));
  const years = (latest - earliest) / (365.25 * 24 * 60 * 60 * 1000);
  return Number(Math.max(0, years).toFixed(2));
}
