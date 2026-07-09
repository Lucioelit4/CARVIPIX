import assert from "node:assert/strict";
import fs from "fs/promises";
import path from "path";
import test from "node:test";

import {
  getLatestSystemValidationReport,
  listSystemValidationReports,
  runSystemValidationRuntime,
} from "./system-validation";

const STORE_PATH = path.join(process.cwd(), "data", "system-validation-reports.json");

test("system validation runtime generates and persists report", async () => {
  await fs.rm(STORE_PATH, { force: true });

  const report = await runSystemValidationRuntime();
  assert.ok(report.id.length > 0);
  assert.ok(report.summary.total >= 8);
  assert.ok(["pass", "warn", "fail"].includes(report.overallStatus));

  const latest = await getLatestSystemValidationReport();
  assert.ok(latest);
  assert.equal(latest?.id, report.id);

  const list = await listSystemValidationReports(5);
  assert.ok(list.length >= 1);
});
