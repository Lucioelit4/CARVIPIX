import test from "node:test";
import assert from "node:assert/strict";

type DataOrigin = "REAL" | "SANDBOX" | "DEMO" | "MOCK";

function normalizeDataOrigin(raw: string | undefined): DataOrigin {
  const value = String(raw ?? "").trim().toUpperCase();
  if (value === "REAL" || value === "SANDBOX" || value === "DEMO" || value === "MOCK") {
    return value;
  }
  if (value === "PLACEHOLDER" || value === "EMPTY") {
    return "MOCK";
  }
  return "MOCK";
}

function formatDateTime(value: string | undefined): string {
  if (!value) {
    return "N/A";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "N/A";
  }
  return date.toLocaleString("es-ES");
}

test("dashboard data origin normalization is strict", () => {
  assert.equal(normalizeDataOrigin("REAL"), "REAL");
  assert.equal(normalizeDataOrigin("sandbox"), "SANDBOX");
  assert.equal(normalizeDataOrigin("demo"), "DEMO");
  assert.equal(normalizeDataOrigin("mock"), "MOCK");
  assert.equal(normalizeDataOrigin("placeholder"), "MOCK");
  assert.equal(normalizeDataOrigin("empty"), "MOCK");
  assert.equal(normalizeDataOrigin("unknown"), "MOCK");
  assert.equal(normalizeDataOrigin(undefined), "MOCK");
});

test("dashboard date formatting never throws and returns N/A for invalid input", () => {
  assert.equal(formatDateTime(undefined), "N/A");
  assert.equal(formatDateTime(""), "N/A");
  assert.equal(formatDateTime("not-a-date"), "N/A");
  assert.notEqual(formatDateTime("2026-07-12T10:00:00.000Z"), "N/A");
});
