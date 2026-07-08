import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { LearningMemoryRepository } from "./repository";

test("stores and searches knowledge, evidence, and decisions", async () => {
  const root = await mkdtemp(join(tmpdir(), "learning-memory-"));

  try {
    const repo = new LearningMemoryRepository(root);
    await repo.bootstrap();

    await repo.rememberKnowledgeCard({
      sourceId: "k-1",
      payload: { title: "Trend continuation" },
      tags: ["trend", "xauusd"],
      searchableText: "trend continuation confidence",
    });

    await repo.rememberEvidence({
      sourceId: "e-1",
      payload: { score: 0.82, signal: "aligned" },
      tags: ["evidence", "quality"],
      searchableText: "aligned evidence quality high",
    });

    await repo.rememberDecision({
      sourceId: "d-1",
      payload: { action: "NO_TRADE" },
      tags: ["safe-mode"],
      searchableText: "safe mode blocked decision",
    });

    const knowledge = repo.search("trend");
    assert.equal(knowledge.total, 1);

    const evidence = repo.search("evidence quality");
    assert.equal(evidence.total, 1);

    const decisions = repo.search("safe mode", { category: "decision" });
    assert.equal(decisions.total, 1);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("never deletes records physically and supports logical delete state", async () => {
  const root = await mkdtemp(join(tmpdir(), "learning-memory-"));

  try {
    const repo = new LearningMemoryRepository(root);
    await repo.bootstrap();

    const record = await repo.rememberExperiment({
      sourceId: "exp-101",
      payload: { result: "baseline" },
      searchableText: "experiment baseline",
    });

    await repo.markLogicallyDeleted(record.id, "retired");
    const loaded = repo.getById(record.id);

    assert.ok(loaded);
    assert.equal(loaded?.status, "logically-deleted");

    const activeOnly = repo.search("experiment", { status: "active" });
    assert.equal(activeOnly.total, 0);

    const deletedOnly = repo.search("experiment", { status: "logically-deleted" });
    assert.equal(deletedOnly.total, 1);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("compares source versions and returns changed fields", async () => {
  const root = await mkdtemp(join(tmpdir(), "learning-memory-"));

  try {
    const repo = new LearningMemoryRepository(root);
    await repo.bootstrap();

    await repo.rememberVersion({
      sourceId: "model-alpha",
      version: 1,
      payload: { weight: 0.41, confidence: 0.62 },
      searchableText: "model alpha version one",
    });

    await repo.rememberVersion({
      sourceId: "model-alpha",
      version: 2,
      payload: { weight: 0.55, confidence: 0.74 },
      searchableText: "model alpha version two",
    });

    const diff = repo.compareVersions("model-alpha", 1, 2);
    assert.deepEqual(diff.changedFields, ["confidence", "weight"]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("creates and restores snapshots", async () => {
  const root = await mkdtemp(join(tmpdir(), "learning-memory-"));

  try {
    const repo = new LearningMemoryRepository(root);
    await repo.bootstrap();

    const first = await repo.rememberHypothesis({
      sourceId: "hyp-1",
      version: 1,
      payload: { statement: "first" },
      searchableText: "hypothesis first",
    });

    const snapshot = await repo.createSnapshot("checkpoint-a");
    assert.ok(snapshot.snapshotId.startsWith("snapshot_"));

    await repo.rememberHypothesis({
      id: first.id,
      sourceId: "hyp-1",
      version: 2,
      payload: { statement: "second" },
      searchableText: "hypothesis second",
    });

    assert.equal(repo.getById(first.id)?.version, 2);
    await repo.restoreSnapshot(snapshot.snapshotId);
    assert.equal(repo.getById(first.id)?.version, 1);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("creates backup and archive compression and verifies integrity", async () => {
  const root = await mkdtemp(join(tmpdir(), "learning-memory-"));

  try {
    const repo = new LearningMemoryRepository(root);
    await repo.bootstrap();

    const weight = await repo.rememberWeight({
      sourceId: "weights-main",
      payload: { vector: [0.2, 0.3, 0.5] },
      searchableText: "weight vector",
    });

    await repo.markStatus(weight.id, "archived", "migrated");

    const backupPath = await repo.createBackup("pre-compression");
    assert.ok(backupPath.endsWith(".json.gz"));

    const archivePath = await repo.runCompressionArchive();
    assert.ok(archivePath && archivePath.endsWith(".json.gz"));

    const integrity = repo.verifyIntegrity();
    assert.equal(integrity.ok, true);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("exposes timeline and category histories", async () => {
  const root = await mkdtemp(join(tmpdir(), "learning-memory-"));

  try {
    const repo = new LearningMemoryRepository(root);
    await repo.bootstrap();

    await repo.rememberCalibration({
      sourceId: "cal-1",
      payload: { slope: 1.2, intercept: 0.4 },
      searchableText: "calibration updated",
    });

    await repo.rememberConfidence({
      sourceId: "conf-1",
      payload: { confidence: 0.89 },
      searchableText: "confidence improved",
    });

    const timeline = repo.getTimeline(100);
    assert.ok(timeline.length >= 2);

    const calibrationHistory = repo.getCalibrationHistory("cal-1");
    assert.equal(calibrationHistory.length, 1);

    const confidenceHistory = repo.getConfidenceHistory("conf-1");
    assert.equal(confidenceHistory.length, 1);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
