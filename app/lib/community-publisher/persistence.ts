/**
 * Community Publisher V1 — Persistencia Atómica
 *
 * Escritura segura con:
 * - archivo temporal + rename atómico
 * - lock en memoria (proceso único)
 * - respaldo automático antes de sobreescribir
 * - recuperación ante corrupción
 * - deduplicación post-reinicio
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import type { Publication, CPConfig, DEFAULT_CONFIG, DailyCounters } from './types';

export const DATA_DIR = path.join(process.cwd(), 'data', 'community-publisher');

export const PATHS = {
  queue:        path.join(DATA_DIR, 'queue.json'),
  publications: path.join(DATA_DIR, 'publications.json'),
  config:       path.join(DATA_DIR, 'config.json'),
  dailyCounters: path.join(DATA_DIR, 'daily-counters.json'),
  deliveredLog: path.join(DATA_DIR, 'delivered-history.json'),
  processorLog: path.join(DATA_DIR, 'processor-log.json'),
};

// ─── Lock en memoria ─────────────────────────────────────────────────────────
// Node.js es single-thread: un promise-chain serializa las escrituras
let writeLock: Promise<void> = Promise.resolve();

async function withLock<T>(fn: () => Promise<T>): Promise<T> {
  let resolve!: () => void;
  const next = new Promise<void>(r => { resolve = r; });
  const current = writeLock.then(fn).finally(resolve);
  writeLock = next;
  return current;
}

// ─── Asegurar directorio ─────────────────────────────────────────────────────

async function ensureDir(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

// ─── Lectura segura ──────────────────────────────────────────────────────────

export async function readJsonFile<T>(filePath: string, defaultValue: T): Promise<T> {
  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(raw) as T;
  } catch {
    return defaultValue;
  }
}

// ─── Escritura atómica ────────────────────────────────────────────────────────

export async function writeJsonFile<T>(filePath: string, data: T): Promise<void> {
  return withLock(async () => {
    await ensureDir();
    const tmpPath = `${filePath}.tmp`;

    // Escribir en archivo temporal
    await fs.writeFile(tmpPath, JSON.stringify(data, null, 2), 'utf-8');

    // Hacer backup del archivo existente (si existe)
    try {
      const backup = `${filePath}.bak`;
      await fs.copyFile(filePath, backup);
    } catch {
      // No existe todavía — OK
    }

    // Rename atómico
    await fs.rename(tmpPath, filePath);
  });
}

// ─── Queue ────────────────────────────────────────────────────────────────────

export async function readQueue(): Promise<Publication[]> {
  return readJsonFile<Publication[]>(PATHS.queue, []);
}

export async function writeQueue(queue: Publication[]): Promise<void> {
  return writeJsonFile(PATHS.queue, queue);
}

// ─── Publications (historial inmutable de entregadas) ─────────────────────────

export async function readPublications(): Promise<Publication[]> {
  return readJsonFile<Publication[]>(PATHS.publications, []);
}

export async function appendPublication(pub: Publication): Promise<void> {
  const existing = await readPublications();
  // Deduplicar por publication_id
  const filtered = existing.filter(p => p.publication_id !== pub.publication_id);
  await writeJsonFile(PATHS.publications, [...filtered, pub]);
}

// ─── Config ──────────────────────────────────────────────────────────────────

import { DEFAULT_CONFIG as _DEFAULT_CONFIG } from './types';

export async function readConfig(): Promise<import('./types').CPConfig> {
  return readJsonFile(PATHS.config, _DEFAULT_CONFIG);
}

export async function writeConfig(config: import('./types').CPConfig): Promise<void> {
  return writeJsonFile(PATHS.config, config);
}

// ─── Daily Counters ───────────────────────────────────────────────────────────

export async function readDailyCounters(): Promise<DailyCounters> {
  return readJsonFile<DailyCounters>(PATHS.dailyCounters, {});
}

export async function incrementDailyCounter(date: string, channelId: string): Promise<number> {
  const counters = await readDailyCounters();
  if (!counters[date]) counters[date] = {};
  counters[date][channelId] = (counters[date][channelId] ?? 0) + 1;
  await writeJsonFile(PATHS.dailyCounters, counters);
  return counters[date][channelId];
}

export async function getDailyCount(date: string, channelId: string): Promise<number> {
  const counters = await readDailyCounters();
  return counters[date]?.[channelId] ?? 0;
}

// ─── Processor Log ────────────────────────────────────────────────────────────

export interface ProcessorLogEntry {
  processing_id: string;
  event_type: string;
  signal_id?: string;
  analysis_id?: string;
  decision?: string;
  accepted: boolean;
  skip_reason?: string;
  skip_detail?: string;
  publication_id?: string;
  publication_type?: string;
  processed_at: string;
}

export async function appendProcessorLog(entry: ProcessorLogEntry): Promise<void> {
  const log = await readJsonFile<ProcessorLogEntry[]>(PATHS.processorLog, []);
  log.push(entry);
  // Mantener solo los últimos 500 registros para no crecer indefinidamente
  const trimmed = log.slice(-500);
  await writeJsonFile(PATHS.processorLog, trimmed);
}

export async function readProcessorLog(): Promise<ProcessorLogEntry[]> {
  return readJsonFile<ProcessorLogEntry[]>(PATHS.processorLog, []);
}

// ─── Utilidades de fecha ─────────────────────────────────────────────────────

export function getTodayInTimezone(tz: string = 'America/Mazatlan'): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}
