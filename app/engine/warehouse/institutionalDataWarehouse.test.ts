import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { InstitutionalDataWarehouse } from "./institutionalDataWarehouse";
import { WarehouseDataProvider } from "./warehouseDataProvider";

function createWarehouseRoot(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "carvipix-warehouse-"));
}

function buildProviderPayload() {
  return [
    {
      timestampUtc: Date.UTC(2024, 0, 1, 0, 0, 0, 0),
      open: 2300,
      high: 2305,
      low: 2298,
      close: 2304,
      bid: 2303.8,
      ask: 2304.1,
      volume: 1000,
      tickVolume: 3000,
    },
    {
      timestampUtc: Date.UTC(2024, 0, 1, 0, 5, 0, 0),
      open: 2304,
      high: 2308,
      low: 2302,
      close: 2307,
      bid: 2306.7,
      ask: 2307,
      volume: 1300,
      tickVolume: 3200,
    },
  ];
}

test("institutional warehouse ingests certifies and versions datasets", () => {
  const root = createWarehouseRoot();
  const warehouse = new InstitutionalDataWarehouse(root);

  const result = warehouse.ingestBatch({
    symbol: "XAUUSD",
    timeframe: "M5",
    provider: "twelve_data",
    version: "v2026.07.08",
    downloadedBy: "test-suite",
    origin: "download",
    rows: [
      {
        timestampUtc: Date.UTC(2026, 0, 1, 0, 0, 0, 0),
        open: 2300,
        high: 2305,
        low: 2298,
        close: 2304,
        bid: 2303.8,
        ask: 2304.1,
        volume: 1000,
        tickVolume: 3000,
        context: {
          session: "asian",
          market: "metal",
          volatility: 5,
          liquidity: 1000,
          spread: 0.3,
          marketState: "open",
          news: [],
          economicCalendar: [],
          holidays: [],
          tradingHour: 0,
          daylightSavingShift: false,
          classifications: ["bull_trend", "continuation"],
        },
      },
      {
        timestampUtc: Date.UTC(2026, 0, 1, 0, 5, 0, 0),
        open: 2304,
        high: 2308,
        low: 2302,
        close: 2307,
        bid: 2306.7,
        ask: 2307,
        volume: 1300,
        tickVolume: 3200,
        context: {
          session: "asian",
          market: "metal",
          volatility: 6,
          liquidity: 1300,
          spread: 0.3,
          marketState: "open",
          news: [],
          economicCalendar: [],
          holidays: [],
          tradingHour: 0,
          daylightSavingShift: false,
          classifications: ["bull_trend", "continuation"],
        },
      },
    ],
  });

  assert.equal(result.manifest.certification, "certified");
  assert.equal(result.manifest.rows, 2);
  assert.ok(result.manifest.qualityScore > 0);
  assert.equal(result.manifest.yearsCapacity.targetMin, 10);
  assert.equal(result.manifest.yearsCapacity.targetMax, 15);
  assert.equal(result.manifest.yearsCapacity.scalableTo, 20);

  const queried = warehouse.queryCandles({
    symbol: "XAUUSD",
    timeframe: "M5",
    certifiedOnly: true,
  });

  assert.equal(queried.length, 2);
  assert.ok(queried.every((row) => row.certified));
  assert.equal(queried[0].provider, "twelve_data");
});

test("institutional warehouse detects invalid rows duplicates and gaps", () => {
  const root = createWarehouseRoot();
  const warehouse = new InstitutionalDataWarehouse(root);

  const result = warehouse.ingestBatch({
    symbol: "BTCUSD",
    timeframe: "M1",
    provider: "binance",
    version: "v2026.07.08",
    downloadedBy: "test-suite",
    origin: "download",
    rows: [
      {
        timestampUtc: Date.UTC(2026, 0, 1, 0, 0, 0, 0),
        open: 100,
        high: 102,
        low: 99,
        close: 101,
        bid: 100.5,
        ask: 101,
        volume: 10,
        tickVolume: 20,
      },
      {
        timestampUtc: Date.UTC(2026, 0, 1, 0, 0, 0, 0),
        open: 101,
        high: 103,
        low: 100,
        close: 102,
        bid: 101.5,
        ask: 102,
        volume: 12,
        tickVolume: 24,
      },
      {
        timestampUtc: Date.UTC(2026, 0, 1, 0, 3, 0, 0),
        open: 102,
        high: 101,
        low: 103,
        close: 102,
        bid: 101,
        ask: 100.8,
        volume: -1,
        tickVolume: 10,
      },
    ],
  });

  assert.equal(result.manifest.rows, 1);
  assert.ok(result.assessment.duplicatesRemoved >= 1);
  assert.ok(result.assessment.issues.some((issue) => issue.code === "duplicate_timestamp"));
  assert.ok(result.assessment.issues.some((issue) => issue.code === "invalid_ohlc" || issue.code === "negative_spread"));
});

test("warehouse imports provider payloads incrementally and stores checkpoints", () => {
  const root = createWarehouseRoot();
  const warehouse = new InstitutionalDataWarehouse(root);

  const full = warehouse.importFromProvider({
    symbol: "XAUUSD",
    timeframe: "M5",
    provider: "twelve_data",
    mode: "full",
    requestedBy: "test-suite",
    version: "twelve_full_v1",
    sourcePayload: buildProviderPayload(),
    sourceTimezone: "UTC",
  });

  const incremental = warehouse.importFromProvider({
    symbol: "XAUUSD",
    timeframe: "M5",
    provider: "twelve_data",
    mode: "incremental",
    requestedBy: "test-suite",
    version: "twelve_incremental_v2",
    sourcePayload: [
      {
        timestampUtc: Date.UTC(2024, 0, 1, 0, 10, 0, 0),
        open: 2307,
        high: 2310,
        low: 2306,
        close: 2309,
        bid: 2308.8,
        ask: 2309.1,
        volume: 1400,
        tickVolume: 3300,
      },
    ],
    sourceTimezone: "UTC",
    resumeToken: full.resumeToken ?? undefined,
  });

  assert.equal(full.manifest.certification, "certified");
  assert.equal(incremental.manifest.rows, 3);
  assert.ok(incremental.resumeToken);
  assert.equal(warehouse.queryCandles({ symbol: "XAUUSD", timeframe: "M5", certifiedOnly: true }).length, 3);
});

test("warehouse provider serves only certified local data to current engine contracts", async () => {
  const root = createWarehouseRoot();
  const warehouse = new InstitutionalDataWarehouse(root);
  warehouse.importFromProvider({
    symbol: "XAUUSD",
    timeframe: "H1",
    provider: "manual_certified",
    mode: "full",
    requestedBy: "test-suite",
    version: "manual_certified_v1",
    sourcePayload: [
      {
        timestampUtc: Date.UTC(2024, 0, 1, 0, 0, 0, 0),
        open: 2300,
        high: 2310,
        low: 2295,
        close: 2308,
        bid: 2307.8,
        ask: 2308.1,
        volume: 9000,
        tickVolume: 18000,
      },
    ],
    sourceTimezone: "UTC",
  });

  const provider = new WarehouseDataProvider(["XAUUSD", "BTCUSD"], ["1H", "5M"], warehouse);
  await provider.connect();

  const marketData = await provider.getMarketData("XAUUSD", "1H");
  assert.ok(marketData);
  assert.equal(marketData?.asset, "XAUUSD");
  assert.equal(marketData?.timeframe, "1H");
  assert.ok(marketData?.quality.completeness > 0);

  const status = await provider.getHealthStatus();
  assert.ok(status.connectedAssets.includes("XAUUSD"));
});

test("warehouse dashboard reports coverage quality missing downloads and certified datasets", () => {
  const root = createWarehouseRoot();
  const warehouse = new InstitutionalDataWarehouse(root);
  warehouse.importFromProvider({
    symbol: "BTCUSD",
    timeframe: "D1",
    provider: "binance",
    mode: "full",
    requestedBy: "test-suite",
    version: "binance_d1_v1",
    sourcePayload: [
      {
        timestampUtc: Date.UTC(2023, 0, 1, 0, 0, 0, 0),
        open: 43000,
        high: 44000,
        low: 42000,
        close: 43500,
        bid: 43490,
        ask: 43510,
        volume: 50,
        tickVolume: 100,
      },
      {
        timestampUtc: Date.UTC(2024, 0, 1, 0, 0, 0, 0),
        open: 43500,
        high: 45000,
        low: 43000,
        close: 44500,
        bid: 44490,
        ask: 44510,
        volume: 55,
        tickVolume: 110,
      },
    ],
    sourceTimezone: "UTC",
  });

  const dashboard = warehouse.getDashboardSnapshot();
  const btc = dashboard.assets.find((asset) => asset.symbol === "BTCUSD");

  assert.ok(btc);
  assert.ok((btc?.coverage ?? 0) > 0);
  assert.ok((btc?.quality ?? 0) > 0);
  assert.ok((btc?.certifiedDatasets.length ?? 0) > 0);
  assert.ok((btc?.missingTimeframes.length ?? 0) > 0);
  assert.ok(dashboard.providers.length >= 8);
});

test("warehouse stress report covers imported institutional datasets without fake seeding", () => {
  const root = createWarehouseRoot();
  const warehouse = new InstitutionalDataWarehouse(root);
  warehouse.importFromProvider({
    symbol: "EURUSD",
    timeframe: "M1",
    provider: "csv_import",
    mode: "full",
    requestedBy: "test-suite",
    version: "csv_full_v1",
    sourcePayload: [
      "timestampUtc,open,high,low,close,bid,ask,spread,volume,tickVolume",
      "1704067200000,1.1,1.11,1.09,1.105,1.1049,1.1051,0.0002,1000,2000",
      "1704067260000,1.105,1.112,1.101,1.109,1.1089,1.1091,0.0002,1200,2200",
    ].join("\n"),
    sourceTimezone: "UTC",
  });

  const report = warehouse.runStressTest();
  assert.ok(report.datasetCount >= 1);
  assert.ok(report.totalRowsProcessed > 0);
  assert.ok(report.rowsPerSecond > 0);
});

test("warehouse rejects non-UTC source timezone and purges legacy seed manifests", () => {
  const root = createWarehouseRoot();
  const datasetsDir = path.join(root, "datasets");
  const manifestsDir = path.join(root, "manifests");
  fs.mkdirSync(datasetsDir, { recursive: true });
  fs.mkdirSync(manifestsDir, { recursive: true });
  fs.writeFileSync(path.join(datasetsDir, "XAUUSD_M5.json"), "[]\n", "utf8");
  fs.writeFileSync(
    path.join(manifestsDir, "XAUUSD_M5.manifest.json"),
    JSON.stringify({
      datasetId: "legacy",
      symbol: "XAUUSD",
      tier: "A",
      timeframe: "M5",
      version: "seed-v1",
      provider: "twelve_data",
      checksum: "legacy",
      coverage: 100,
      rows: 1,
      missingData: 0,
      qualityScore: 100,
      validationDate: Date.now(),
      certification: "certified",
      correctedRows: 0,
      startTimestampUtc: 1,
      endTimestampUtc: 2,
      yearsCapacity: { targetMin: 10, targetMax: 15, scalableTo: 20 },
      traceability: {
        downloadedBy: "system-seed",
        downloadedAt: Date.now(),
        provider: "twelve_data",
        version: "seed-v1",
        qualityScore: 100,
        checksum: "legacy",
        corrected: false,
        certified: true,
      },
    }, null, 2),
    "utf8",
  );

  const warehouse = new InstitutionalDataWarehouse(root);
  assert.equal(fs.existsSync(path.join(datasetsDir, "XAUUSD_M5.json")), false);

  const rejected = warehouse.importFromProvider({
    symbol: "GBPUSD",
    timeframe: "M15",
    provider: "polygon",
    mode: "full",
    requestedBy: "test-suite",
    version: "polygon_full_v1",
    sourcePayload: [
      {
        timestampUtc: Date.UTC(2024, 0, 1, 0, 0, 0, 0),
        open: 1.27,
        high: 1.275,
        low: 1.268,
        close: 1.274,
        bid: 1.2739,
        ask: 1.2741,
        volume: 500,
        tickVolume: 1000,
      },
    ],
    sourceTimezone: "America/New_York",
  });

  assert.equal(rejected.manifest.certification, "rejected");
});
