/**
 * Trust & Conversion Engine — Persistence Layer
 * Almacenamiento atómico de momentos, sugerencias y métricas
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import type {
  CommercialMoment,
  CommercialSuggestion,
  ConversionEvent,
  ConversionMetrics,
  TrustConversionConfig,
} from './types';
import { DEFAULT_CONFIG } from './types';

const DATA_DIR = path.join(process.cwd(), 'data', 'trust-conversion');

// ─── Rutas de archivos ───────────────────────────────────────────────────────

const MOMENTS_FILE = path.join(DATA_DIR, 'moments.json');
const SUGGESTIONS_FILE = path.join(DATA_DIR, 'suggestions.json');
const EVENTS_FILE = path.join(DATA_DIR, 'events.json');
const METRICS_FILE = path.join(DATA_DIR, 'metrics.json');
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');

// ─── Lock para operaciones atómicas ───────────────────────────────────────────

let writeLock = Promise.resolve();

async function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const unlock = () => {};
  return new Promise((resolve, reject) => {
    writeLock = writeLock.then(async () => {
      try {
        resolve(await fn());
      } catch (e) {
        reject(e);
      }
    });
  });
}

// ─── Escribir con seguridad atómica ──────────────────────────────────────────

async function writeJsonFile(filePath: string, data: unknown): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const tmpPath = filePath + '.tmp';
  const bakPath = filePath + '.bak';

  // Escribir a temporal
  await fs.writeFile(tmpPath, JSON.stringify(data, null, 2), 'utf-8');

  // Backup del original si existe
  try {
    if (await fileExists(filePath)) {
      await fs.copyFile(filePath, bakPath);
    }
  } catch {}

  // Renombrar atómicamente
  await fs.rename(tmpPath, filePath);
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readJsonFile<T>(filePath: string, defaultValue: T): Promise<T> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content) as T;
  } catch {
    return defaultValue;
  }
}

// ─── Momentos comerciales ────────────────────────────────────────────────────

export async function loadMoments(): Promise<CommercialMoment[]> {
  return readJsonFile(MOMENTS_FILE, []);
}

export async function saveMoments(moments: CommercialMoment[]): Promise<void> {
  return withLock(async () => {
    await writeJsonFile(MOMENTS_FILE, moments);
  });
}

export async function addMoment(moment: CommercialMoment): Promise<void> {
  return withLock(async () => {
    const moments = await loadMoments();
    const exists = moments.find(m => m.moment_id === moment.moment_id);
    if (!exists) {
      moments.push(moment);
      await writeJsonFile(MOMENTS_FILE, moments);
    }
  });
}

export async function updateMoment(
  momentId: string,
  updates: Partial<CommercialMoment>,
): Promise<CommercialMoment | null> {
  return withLock(async () => {
    const moments = await loadMoments();
    const idx = moments.findIndex(m => m.moment_id === momentId);
    if (idx === -1) return null;

    moments[idx] = { ...moments[idx], ...updates };
    await writeJsonFile(MOMENTS_FILE, moments);
    return moments[idx];
  });
}

// ─── Sugerencias ─────────────────────────────────────────────────────────────

export async function loadSuggestions(): Promise<CommercialSuggestion[]> {
  return readJsonFile(SUGGESTIONS_FILE, []);
}

export async function saveSuggestions(suggestions: CommercialSuggestion[]): Promise<void> {
  return withLock(async () => {
    await writeJsonFile(SUGGESTIONS_FILE, suggestions);
  });
}

export async function addSuggestion(suggestion: CommercialSuggestion): Promise<void> {
  return withLock(async () => {
    const suggestions = await loadSuggestions();
    const exists = suggestions.find(s => s.suggestion_id === suggestion.suggestion_id);
    if (!exists) {
      suggestions.push(suggestion);
      await writeJsonFile(SUGGESTIONS_FILE, suggestions);
    }
  });
}

export async function updateSuggestion(
  suggestionId: string,
  updates: Partial<CommercialSuggestion>,
): Promise<CommercialSuggestion | null> {
  return withLock(async () => {
    const suggestions = await loadSuggestions();
    const idx = suggestions.findIndex(s => s.suggestion_id === suggestionId);
    if (idx === -1) return null;

    suggestions[idx] = { ...suggestions[idx], ...updates };
    await writeJsonFile(SUGGESTIONS_FILE, suggestions);
    return suggestions[idx];
  });
}

// ─── Eventos de conversión ───────────────────────────────────────────────────

export async function loadEvents(): Promise<ConversionEvent[]> {
  const all = await readJsonFile<ConversionEvent[]>(EVENTS_FILE, []);
  // Mantener últimos 1000 eventos
  return all.slice(-1000);
}

export async function appendEvent(event: ConversionEvent): Promise<void> {
  return withLock(async () => {
    const events = await readJsonFile<ConversionEvent[]>(EVENTS_FILE, []);
    events.push(event);
    // Limitar a últimos 1000
    if (events.length > 1000) {
      events.splice(0, events.length - 1000);
    }
    await writeJsonFile(EVENTS_FILE, events);
  });
}

// ─── Métricas ────────────────────────────────────────────────────────────────

const EMPTY_METRICS: ConversionMetrics = {
  total_moments_detected: 0,
  moments_approved: 0,
  moments_published: 0,
  total_clicks: 0,
  total_registrations: 0,
  total_conversions: 0,
  total_revenue: 0,
  ctr: 0,
  registration_rate: 0,
  conversion_rate: 0,
  revenue_per_publication: 0,
  by_product: {
    BOT: { clicks: 0, registrations: 0, conversions: 0 },
    PREMIUM_ALERTS: { clicks: 0, registrations: 0, conversions: 0 },
    COMMUNITY: { clicks: 0, registrations: 0, conversions: 0 },
    TUTORIALS: { clicks: 0, registrations: 0, conversions: 0 },
    REGISTRATION: { clicks: 0, registrations: 0, conversions: 0 },
  },
  by_moment_type: {
    WINNING_STREAK: { suggestions: 0, conversions: 0 },
    NOTABLE_RESULT: { suggestions: 0, conversions: 0 },
    HIGH_MARKET_ACTIVITY: { suggestions: 0, conversions: 0 },
    NO_OPPORTUNITIES: { suggestions: 0, conversions: 0 },
    PRODUCT_LAUNCH: { suggestions: 0, conversions: 0 },
    ENGAGEMENT_PEAK: { suggestions: 0, conversions: 0 },
    CONSISTENCY_MILESTONE: { suggestions: 0, conversions: 0 },
  },
  by_day_of_week: {
    0: { suggestions: 0, conversions: 0 },
    1: { suggestions: 0, conversions: 0 },
    2: { suggestions: 0, conversions: 0 },
    3: { suggestions: 0, conversions: 0 },
    4: { suggestions: 0, conversions: 0 },
    5: { suggestions: 0, conversions: 0 },
    6: { suggestions: 0, conversions: 0 },
  },
  by_market_condition: {},
};

export async function loadMetrics(): Promise<ConversionMetrics> {
  return readJsonFile(METRICS_FILE, EMPTY_METRICS);
}

export async function saveMetrics(metrics: ConversionMetrics): Promise<void> {
  return withLock(async () => {
    await writeJsonFile(METRICS_FILE, metrics);
  });
}

// ─── Configuración ──────────────────────────────────────────────────────────

export async function loadConfig(): Promise<TrustConversionConfig> {
  return readJsonFile(CONFIG_FILE, DEFAULT_CONFIG);
}

export async function saveConfig(config: TrustConversionConfig): Promise<void> {
  return withLock(async () => {
    await writeJsonFile(CONFIG_FILE, config);
  });
}

export async function updateConfig(
  updates: Partial<TrustConversionConfig>,
): Promise<TrustConversionConfig> {
  return withLock(async () => {
    const config = await loadConfig();
    const updated = { ...config, ...updates };
    await writeJsonFile(CONFIG_FILE, updated);
    return updated;
  });
}

// ─── Inicialización ─────────────────────────────────────────────────────────

export async function initializeDataDir(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });

  // Crear archivos vacíos si no existen
  if (!(await fileExists(MOMENTS_FILE))) await writeJsonFile(MOMENTS_FILE, []);
  if (!(await fileExists(SUGGESTIONS_FILE))) await writeJsonFile(SUGGESTIONS_FILE, []);
  if (!(await fileExists(EVENTS_FILE))) await writeJsonFile(EVENTS_FILE, []);
  if (!(await fileExists(METRICS_FILE))) await writeJsonFile(METRICS_FILE, EMPTY_METRICS);
  if (!(await fileExists(CONFIG_FILE))) await writeJsonFile(CONFIG_FILE, DEFAULT_CONFIG);
}
