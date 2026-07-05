import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import type { EngineVersionInfo } from './types';

const ENGINE_FINGERPRINT_FILES = [
  path.join(process.cwd(), 'app', 'engine', 'core', 'engine.ts'),
  path.join(process.cwd(), 'app', 'engine', 'backtesting', 'backtestEngine.ts'),
  path.join(process.cwd(), 'package.json'),
];

function sha256Hex(payload: string): string {
  return crypto.createHash('sha256').update(payload).digest('hex');
}

function loadFileHash(filePath: string): string {
  if (!fs.existsSync(filePath)) {
    return 'missing';
  }

  const content = fs.readFileSync(filePath, 'utf8');
  return sha256Hex(content);
}

export function detectEngineVersionInfo(versionLabelFromConfig?: string): EngineVersionInfo {
  const sourceFingerprint: Record<string, string> = {};

  for (const filePath of ENGINE_FINGERPRINT_FILES) {
    const relative = path.relative(process.cwd(), filePath).replace(/\\/g, '/');
    sourceFingerprint[relative] = loadFileHash(filePath);
  }

  const serialized = Object.entries(sourceFingerprint)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([filePath, hash]) => `${filePath}:${hash}`)
    .join('|');

  const versionHash = sha256Hex(serialized);
  const shortHash = versionHash.slice(0, 12);
  const versionLabel = versionLabelFromConfig?.trim() || `engine-${shortHash}`;

  return {
    versionLabel,
    versionHash,
    versionId: `${versionLabel}@${shortHash}`,
    sourceFingerprint,
  };
}
