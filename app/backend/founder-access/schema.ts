import { readFile } from "fs/promises";
import path from "path";

import { backendDatabase } from "@/app/backend/core/database";

let schemaPromise: Promise<void> | null = null;

export function ensureFounderAccessSchema(): Promise<void> {
  if (!backendDatabase.enabled) {
    return Promise.resolve();
  }

  if (!schemaPromise) {
    schemaPromise = readFile(
      path.join(process.cwd(), "infra", "migrations", "20260722_founder_all_access.sql"),
      "utf8",
    ).then(async (sql) => {
      await backendDatabase.query(sql);
    }).catch((error) => {
      schemaPromise = null;
      throw error;
    });
  }

  return schemaPromise;
}