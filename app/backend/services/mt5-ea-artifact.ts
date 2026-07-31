import fs from "fs/promises";
import path from "path";
import { createHash } from "crypto";

const UNIVERSAL_EA_FILE_NAME = "CARVIPIX_EA_MT5_V1.ex5";

function resolveConfiguredPath(): string {
  const configured = String(process.env.COMMERCIAL_EA_FILE_PATH || "").trim();
  if (!configured) {
    return path.join(process.cwd(), "artifacts", "commercial", "private", UNIVERSAL_EA_FILE_NAME);
  }

  return path.isAbsolute(configured) ? configured : path.join(process.cwd(), configured);
}

export function getUniversalEaFileName(): string {
  return UNIVERSAL_EA_FILE_NAME;
}

export function resolveCommercialEaArtifactPath(): string {
  return resolveConfiguredPath();
}

export async function readCommercialEaArtifact(): Promise<Buffer> {
  return fs.readFile(resolveConfiguredPath());
}

export async function getCommercialEaArtifactMetadata(): Promise<{
  fileName: string;
  absolutePath: string;
  sizeBytes: number;
  modifiedAtIso: string;
  sha256: string;
}> {
  const absolutePath = resolveConfiguredPath();
  const fileBuffer = await fs.readFile(absolutePath);
  const stat = await fs.stat(absolutePath);

  return {
    fileName: UNIVERSAL_EA_FILE_NAME,
    absolutePath,
    sizeBytes: stat.size,
    modifiedAtIso: stat.mtime.toISOString(),
    sha256: createHash("sha256").update(fileBuffer).digest("hex").toUpperCase(),
  };
}