import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { InstitutionalDataPlatform } from "./core";

test("ingest incremental, version control and replay", async () => {
  const root = await mkdtemp(join(tmpdir(), "carvipix-dp-"));

  try {
    const platform = new InstitutionalDataPlatform({
      lakeRootDir: root,
      compressionCodec: "gzip",
      compressionThreshold: 3,
    });

    await platform.bootstrap();

    const baseTs = Date.now() - 10_000;

    const version = await platform.ingest("tick", [
      {
        kind: "tick",
        id: "a",
        provider: "p1",
        asset: "XAUUSD",
        ts: baseTs + 1,
        bid: 2500.1,
        ask: 2500.3,
      },
      {
        kind: "tick",
        id: "b",
        provider: "p1",
        asset: "XAUUSD",
        ts: baseTs + 2,
        bid: 2500.2,
        ask: 2500.4,
      },
      {
        kind: "tick",
        id: "a",
        provider: "p1",
        asset: "XAUUSD",
        ts: baseTs + 3,
        bid: 2500.5,
        ask: 2500.7,
      },
      {
        kind: "tick",
        id: "c",
        provider: "p1",
        asset: "XAUUSD",
        ts: baseTs,
        bid: 2499.9,
        ask: 2500.1,
      },
    ]);

    assert.equal(version.kind, "tick");
    assert.ok(version.id.startsWith("ver_"));

    const lineage = platform.getLineageByVersion(version.id);
    assert.ok(lineage);
    assert.equal(lineage?.kind, "tick");
    assert.ok((lineage?.providerIds.length ?? 0) >= 1);
    assert.ok((lineage?.assets.length ?? 0) >= 1);

    const query = await platform.query({
      kind: "tick",
      provider: "p1",
      asset: "XAUUSD",
      sort: "asc",
      limit: 100,
    });

    assert.equal(query.length, 3);
    assert.equal(query[0]?.id, "c");
    assert.equal(query[1]?.id, "b");
    assert.equal(query[2]?.id, "a");

    const integrity = await platform.verifyIntegrity("tick");
    assert.equal(integrity.length, 0);

    let replayed = 0;
    await platform.replay({ kind: "tick", provider: "p1", limit: 100 }, async () => {
      replayed += 1;
    });

    assert.equal(replayed, 3);

    const bench = await platform.runBenchmarks();
    assert.equal(bench.cases.length, 3);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("automatic repair detection and repair", async () => {
  const root = await mkdtemp(join(tmpdir(), "carvipix-dp-repair-"));

  try {
    const platform = new InstitutionalDataPlatform({
      lakeRootDir: root,
      compressionCodec: "none",
      compressionThreshold: 1000,
    });

    await platform.bootstrap();

    const ts = Date.now();
    await platform.ingest("spread", [
      {
        kind: "spread",
        id: "x",
        provider: "p2",
        asset: "EURUSD",
        ts: ts + 1,
        spread: 0.3,
      },
      {
        kind: "spread",
        id: "x",
        provider: "p2",
        asset: "EURUSD",
        ts,
        spread: 0.2,
      },
    ]);

    const actions = await platform.detectRepairActions("spread");
    assert.equal(actions.length, 0);

    const repaired = await platform.autoRepair("spread");
    assert.ok(repaired >= 1);

    const rows = await platform.query({ kind: "spread", provider: "p2", limit: 100 });
    assert.equal(rows.length, 1);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
