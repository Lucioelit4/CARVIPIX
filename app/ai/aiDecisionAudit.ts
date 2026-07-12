import fs from "node:fs";
import path from "node:path";
import type { AIAnalysisAuditRecord } from "./types";

const AUDIT_ROOT = path.join(process.cwd(), "data", "ai-audit");

function ensureDir(): void {
  if (!fs.existsSync(AUDIT_ROOT)) {
    fs.mkdirSync(AUDIT_ROOT, { recursive: true });
  }
}

function redactSecrets(raw: string): string {
  return raw
    .replace(/(sk-[A-Za-z0-9_-]{10,})/g, "[REDACTED_SECRET]")
    .replace(/("Authorization"\s*:\s*")[^"]+("\s*)/g, "$1[REDACTED]$2");
}

export class AIDecisionAudit {
  save(record: AIAnalysisAuditRecord): string {
    ensureDir();
    const filePath = path.join(AUDIT_ROOT, `${record.analysis_id}.json`);
    const serialized = JSON.stringify(record, null, 2);
    fs.writeFileSync(filePath, redactSecrets(serialized), "utf8");
    return filePath;
  }

  get(analysisId: string): AIAnalysisAuditRecord | null {
    const filePath = path.join(AUDIT_ROOT, `${analysisId}.json`);
    if (!fs.existsSync(filePath)) {
      return null;
    }
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as AIAnalysisAuditRecord;
  }
}
