/**
 * Shadow Production — Persistence Layer
 * Almacenamiento centralizado de eventos, métricas y anomalías
 */

import fs from 'fs/promises';
import path from 'path';
import type {
  SystemEvent,
  DailyMetrics,
  AnomalyReport,
  ShadowProductionConfig,
  ShadowProductionReport,
} from './types';

const DATA_DIR = path.join(process.cwd(), 'data', 'shadow-production');

const DEFAULT_CONFIG: ShadowProductionConfig = {
  mode: 'SHADOW_PRODUCTION',
  start_date: new Date().toISOString(),
  duration_days: 7,
  enabled_modules: [
    'TWELVE_DATA',
    'EXPEDIENTE_MAESTRO',
    'CHATGPT',
    'DISPARADOR',
    'COMMUNITY_PUBLISHER',
    'TELEGRAM',
    'TRUST_CONVERSION',
    'PAPER_ACCOUNT',
    'OBSERVER',
  ],
  test_only: true,
  auto_send_official: false,
  bot_mt4_mt5_enabled: false,
  live_trading_enabled: false,
  paper_trading_enabled: true,
  paper_trading_balance: 10000,
};

// ─── Utilities ───────────────────────────────────────────────────────────

let writeLock = false;

async function withLock<T>(fn: () => Promise<T>): Promise<T> {
  while (writeLock) await new Promise(r => setTimeout(r, 10));
  writeLock = true;
  try {
    return await fn();
  } finally {
    writeLock = false;
  }
}

async function ensureDir(): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code !== 'EEXIST') throw err;
  }
}

async function writeJsonFile(filename: string, data: unknown): Promise<void> {
  const filePath = path.join(DATA_DIR, filename);
  const tmpPath = `${filePath}.tmp`;

  // Crear backup
  try {
    const existing = await fs.readFile(filePath, 'utf-8');
    await fs.writeFile(`${filePath}.bak`, existing);
  } catch {
    // Archivo no existe aún
  }

  // Escribir a temp, luego mover atomicamente
  await fs.writeFile(tmpPath, JSON.stringify(data, null, 2), 'utf-8');
  await fs.rename(tmpPath, filePath);
}

async function readJsonFile<T>(filename: string, defaultValue: T): Promise<T> {
  try {
    const content = await fs.readFile(path.join(DATA_DIR, filename), 'utf-8');
    return JSON.parse(content) as T;
  } catch {
    return defaultValue;
  }
}

// ─── Config Management ──────────────────────────────────────────────────

export async function initializeShadowProduction(): Promise<ShadowProductionConfig> {
  await ensureDir();
  let config = await readJsonFile<ShadowProductionConfig>('config.json', DEFAULT_CONFIG);

  if (!config || Object.keys(config).length === 0) {
    config = DEFAULT_CONFIG;
    await withLock(() => writeJsonFile('config.json', config));
  }

  return config;
}

export async function getConfig(): Promise<ShadowProductionConfig> {
  await ensureDir();
  return readJsonFile<ShadowProductionConfig>('config.json', DEFAULT_CONFIG);
}

export async function updateConfig(updates: Partial<ShadowProductionConfig>): Promise<void> {
  await withLock(async () => {
    const config = await getConfig();
    const updated = { ...config, ...updates };
    await writeJsonFile('config.json', updated);
  });
}

// ─── Event Logging ─────────────────────────────────────────────────────

export async function logSystemEvent(event: Omit<SystemEvent, 'event_id' | 'timestamp_utc_ms'>): Promise<SystemEvent> {
  const fullEvent: SystemEvent = {
    event_id: `EVT-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp_utc_ms: Date.now(),
    ...event,
  };

  await withLock(async () => {
    const events = await readJsonFile<SystemEvent[]>('events.json', []);
    events.push(fullEvent);

    // Mantener últimos 10000 eventos
    if (events.length > 10000) {
      events.splice(0, events.length - 10000);
    }

    await writeJsonFile('events.json', events);
  });

  return fullEvent;
}

export async function getSystemEvents(
  filter?: { module?: string; severity?: string; hours?: number },
): Promise<SystemEvent[]> {
  const events = await readJsonFile<SystemEvent[]>('events.json', []);

  if (!filter) return events;

  const now = Date.now();
  const cutoff = filter.hours ? now - filter.hours * 60 * 60 * 1000 : 0;

  return events.filter(e => {
    if (cutoff && e.timestamp_utc_ms < cutoff) return false;
    if (filter.module && e.module !== filter.module) return false;
    if (filter.severity && e.severity !== filter.severity) return false;
    return true;
  });
}

// ─── Anomaly Reporting ──────────────────────────────────────────────────

export async function reportAnomaly(
  anomaly: Omit<AnomalyReport, 'anomaly_id' | 'timestamp_utc_ms' | 'date'>,
): Promise<AnomalyReport> {
  const now = new Date();
  const fullAnomaly: AnomalyReport = {
    anomaly_id: `ANO-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp_utc_ms: Date.now(),
    date: now.toISOString().split('T')[0],
    ...anomaly,
  };

  await withLock(async () => {
    const anomalies = await readJsonFile<AnomalyReport[]>('anomalies.json', []);
    anomalies.push(fullAnomaly);
    await writeJsonFile('anomalies.json', anomalies);
  });

  // Log como evento crítico
  await logSystemEvent({
    module: anomaly.module,
    severity: anomaly.severity === 'CRITICAL' ? 'CRITICAL' : 'ERROR',
    event_type: 'ANOMALY_REPORTED',
    description: `Anomalía ${anomaly.severity}: ${anomaly.description}`,
    data: { anomaly_id: fullAnomaly.anomaly_id },
  });

  return fullAnomaly;
}

export async function getAnomalies(filter?: { severity?: string; days?: number }): Promise<AnomalyReport[]> {
  const anomalies = await readJsonFile<AnomalyReport[]>('anomalies.json', []);

  if (!filter) return anomalies;

  const now = new Date();
  const cutoff = filter.days ? new Date(now.getTime() - filter.days * 24 * 60 * 60 * 1000) : null;

  return anomalies.filter(a => {
    if (cutoff && new Date(a.timestamp_utc_ms) < cutoff) return false;
    if (filter.severity && a.severity !== filter.severity) return false;
    return true;
  });
}

// ─── Daily Metrics ──────────────────────────────────────────────────────

export async function saveDailyMetrics(metrics: DailyMetrics): Promise<void> {
  await withLock(async () => {
    const allMetrics = await readJsonFile<DailyMetrics[]>('daily-metrics.json', []);

    // Reemplazar si existe el mismo día
    const idx = allMetrics.findIndex(m => m.date === metrics.date);
    if (idx >= 0) {
      allMetrics[idx] = metrics;
    } else {
      allMetrics.push(metrics);
    }

    // Ordenar por fecha
    allMetrics.sort((a, b) => a.date.localeCompare(b.date));

    await writeJsonFile('daily-metrics.json', allMetrics);
  });

  console.log(`[SHADOW] ✓ Métricas guardadas para ${metrics.date}`);
}

export async function getDailyMetrics(date?: string): Promise<DailyMetrics | null> {
  const allMetrics = await readJsonFile<DailyMetrics[]>('daily-metrics.json', []);

  if (!date) {
    // Retornar últimas métricas
    return allMetrics.length > 0 ? allMetrics[allMetrics.length - 1] : null;
  }

  return allMetrics.find(m => m.date === date) || null;
}

export async function getAllDailyMetrics(): Promise<DailyMetrics[]> {
  return readJsonFile<DailyMetrics[]>('daily-metrics.json', []);
}

// ─── Final Report ──────────────────────────────────────────────────────

export async function generateFinalReport(): Promise<ShadowProductionReport> {
  const config = await getConfig();
  const metrics = await getAllDailyMetrics();
  const anomalies = await getAnomalies();
  const events = await getSystemEvents();

  const startDate = new Date(config.start_date);
  const endDate = new Date();

  // Agregar métricas
  let totalAnalyses = 0;
  let totalAlerts = 0;
  let paperPnl = 0;
  let paperWins = 0;
  let paperLosses = 0;
  let totalPubs = 0;
  let totalSuggestions = 0;
  let totalClics = 0;

  for (const m of metrics) {
    totalAnalyses += m.market.total_analyses;
    totalAlerts += m.market.free_alerts + m.market.opportunities;
    paperPnl = m.market.paper_pnl_usd;
    paperWins += m.market.paper_wins;
    paperLosses += m.market.paper_losses;
    totalPubs += m.telegram.publications_sent;
    totalSuggestions += m.conversion.suggestions_generated;
    totalClics += m.conversion.clics_total;
  }

  const errors = events.filter(e => e.severity === 'ERROR' || e.severity === 'CRITICAL');
  const criticalAnomalies = anomalies.filter(a => a.severity === 'CRITICAL');
  const majorAnomalies = anomalies.filter(a => a.severity === 'MAJOR');

  return {
    start_date: config.start_date,
    end_date: endDate.toISOString(),
    duration_days: Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)),

    total_analyses: totalAnalyses,
    total_alerts: totalAlerts,
    total_errors: errors.length,
    total_cost_usd: metrics.reduce((sum, m) => sum + m.system.openai_cost_usd, 0),
    uptime_pct: metrics.length > 0 ? metrics.reduce((sum, m) => sum + m.system.uptime_pct, 0) / metrics.length : 0,

    paper_account_final_pnl: paperPnl,
    paper_account_win_rate: paperWins + paperLosses > 0 ? (paperWins / (paperWins + paperLosses)) * 100 : 0,
    paper_account_max_drawdown: metrics.length > 0 ? Math.max(...metrics.map(m => m.market.drawdown_max)) : 0,

    total_publications: totalPubs,
    avg_publications_per_day: metrics.length > 0 ? totalPubs / metrics.length : 0,

    total_suggestions_generated: totalSuggestions,
    total_clics: totalClics,
    total_registrations: metrics.reduce((sum, m) => sum + m.conversion.registrations_total, 0),
    total_payments: metrics.reduce((sum, m) => sum + m.conversion.payments_attributed, 0),

    total_anomalies: anomalies.length,
    critical_issues: criticalAnomalies.length,
    major_issues: majorAnomalies.length,
    minor_issues: anomalies.filter(a => a.severity === 'MINOR').length,

    modules_status: Object.fromEntries(
      config.enabled_modules.map(module => [
        module,
        {
          active: true,
          errors: events.filter(e => e.module === module && (e.severity === 'ERROR' || e.severity === 'CRITICAL')).length,
          status:
            errors.filter(e => e.module === module).length > 10
              ? 'FAILED'
              : errors.filter(e => e.module === module).length > 0
                ? 'DEGRADED'
                : 'READY',
        },
      ]),
    ),

    recommendations: generateRecommendations(criticalAnomalies, majorAnomalies, totalAnalyses, paperPnl),
    ready_for_production: criticalAnomalies.length === 0 && majorAnomalies.length <= 2,
  };
}

function generateRecommendations(
  criticalAnomalies: AnomalyReport[],
  majorAnomalies: AnomalyReport[],
  totalAnalyses: number,
  paperPnl: number,
): string[] {
  const recommendations: string[] = [];

  if (criticalAnomalies.length > 0) {
    recommendations.push('🔴 CRÍTICO: Resolver todos los problemas críticos antes de producción');
    criticalAnomalies.forEach(a => recommendations.push(`  - ${a.module}: ${a.description}`));
  }

  if (majorAnomalies.length > 0) {
    recommendations.push(`🟡 MAYOR: ${majorAnomalies.length} problemas mayores detectados — revisar antes de producción`);
  }

  if (totalAnalyses < 100) {
    recommendations.push('📊 Volumen bajo: Ejecutar período de prueba adicional con más datos');
  }

  if (paperPnl < 0) {
    recommendations.push('📉 Pérdida neta en paper account: Revisar lógica de entrada/salida');
  } else if (paperPnl > 500) {
    recommendations.push('📈 Resultados positivos: Puede proceder a producción controlada');
  }

  recommendations.push('✅ Realizar full deployment checklist antes de oficial');
  recommendations.push('✅ Monitoreo activo durante primeras 48h en producción');

  return recommendations;
}

// ─── Initialize ────────────────────────────────────────────────────────

export async function initializeShadowProductionStorage(): Promise<void> {
  await ensureDir();
  await initializeShadowProduction();
  console.log('[SHADOW] ✓ Storage inicializado');
}
