/**
 * Shadow Production — Module Health Checker
 * Verifica salud y disponibilidad de cada módulo
 */

import type { ModuleHealthCheck } from './types';
import { getSystemEvents, logSystemEvent } from './persistence';

// ─── Health Checks por Módulo ──────────────────────────────────────

async function checkTwelveDataHealth(): Promise<ModuleHealthCheck> {
  try {
    // Verificar que se han recibido datos recientemente
    const res = await fetch('http://localhost:3001/api/internal/observer-v3/status', {
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) throw new Error('No response from Observer');

    const data = (await res.json()) as { success: boolean; instruments: Record<string, unknown> };

    return {
      module_name: 'TWELVE_DATA',
      timestamp_utc_ms: Date.now(),
      is_ready: data.success,
      status: data.success ? 'READY' : 'DEGRADED',
      last_activity: new Date().toISOString(),
      error_count_24h: 0,
      info: { instruments_count: Object.keys(data.instruments || {}).length },
    };
  } catch (err) {
    return {
      module_name: 'TWELVE_DATA',
      timestamp_utc_ms: Date.now(),
      is_ready: false,
      status: 'FAILED',
      last_activity: new Date().toISOString(),
      error_count_24h: 1,
      info: { error: (err as Error).message },
    };
  }
}

async function checkCommunityPublisherHealth(): Promise<ModuleHealthCheck> {
  try {
    const res = await fetch('http://localhost:3001/api/internal/community-publisher/queue', {
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) throw new Error('Queue API failed');

    const data = (await res.json()) as { queue: unknown[]; ok: boolean };

    return {
      module_name: 'COMMUNITY_PUBLISHER',
      timestamp_utc_ms: Date.now(),
      is_ready: data.ok,
      status: data.ok ? 'READY' : 'DEGRADED',
      last_activity: new Date().toISOString(),
      error_count_24h: 0,
      info: { queue_length: (data.queue || []).length },
    };
  } catch (err) {
    return {
      module_name: 'COMMUNITY_PUBLISHER',
      timestamp_utc_ms: Date.now(),
      is_ready: false,
      status: 'FAILED',
      last_activity: new Date().toISOString(),
      error_count_24h: 1,
      info: { error: (err as Error).message },
    };
  }
}

async function checkTrustConversionHealth(): Promise<ModuleHealthCheck> {
  try {
    const res = await fetch('http://localhost:3001/api/internal/trust-conversion/init', {
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) throw new Error('Init API failed');

    const data = (await res.json()) as { engine_status: { is_initialized: boolean; status: string } };

    return {
      module_name: 'TRUST_CONVERSION',
      timestamp_utc_ms: Date.now(),
      is_ready: data.engine_status.is_initialized,
      status: data.engine_status.status === 'READY' ? 'READY' : 'DEGRADED',
      last_activity: new Date().toISOString(),
      error_count_24h: 0,
      info: { status: data.engine_status.status },
    };
  } catch (err) {
    return {
      module_name: 'TRUST_CONVERSION',
      timestamp_utc_ms: Date.now(),
      is_ready: false,
      status: 'FAILED',
      last_activity: new Date().toISOString(),
      error_count_24h: 1,
      info: { error: (err as Error).message },
    };
  }
}

async function checkObserverHealth(): Promise<ModuleHealthCheck> {
  try {
    const res = await fetch('http://localhost:3001/api/internal/observer-v3/status');

    if (!res.ok) throw new Error('Observer API failed');

    const data = (await res.json()) as { success: boolean; total_analyses: number };

    return {
      module_name: 'OBSERVER',
      timestamp_utc_ms: Date.now(),
      is_ready: data.success,
      status: data.success ? 'READY' : 'DEGRADED',
      last_activity: new Date().toISOString(),
      error_count_24h: 0,
      info: { total_analyses: data.total_analyses },
    };
  } catch (err) {
    return {
      module_name: 'OBSERVER',
      timestamp_utc_ms: Date.now(),
      is_ready: false,
      status: 'FAILED',
      last_activity: new Date().toISOString(),
      error_count_24h: 1,
      info: { error: (err as Error).message },
    };
  }
}

// ─── Public API ────────────────────────────────────────────────────────

export async function checkAllModules(): Promise<ModuleHealthCheck[]> {
  const checks = await Promise.all([
    checkTwelveDataHealth(),
    checkCommunityPublisherHealth(),
    checkTrustConversionHealth(),
    checkObserverHealth(),
  ]);

  // Log summary
  const readyCount = checks.filter(c => c.is_ready).length;
  await logSystemEvent({
    module: 'HEALTH_CHECKER',
    severity: readyCount === checks.length ? 'INFO' : 'WARNING',
    event_type: 'HEALTH_CHECK',
    description: `Health check: ${readyCount}/${checks.length} módulos listos`,
    data: { checks: checks.map(c => ({ module: c.module_name, status: c.status })) },
  });

  return checks;
}

export async function checkModuleHealth(moduleName: string): Promise<ModuleHealthCheck | null> {
  const allChecks = await checkAllModules();
  return allChecks.find(c => c.module_name === moduleName) || null;
}

export async function getModulesStatus(): Promise<{
  ready_count: number;
  total_count: number;
  status: 'ALL_READY' | 'DEGRADED' | 'FAILED';
  checks: ModuleHealthCheck[];
}> {
  const checks = await checkAllModules();
  const readyCount = checks.filter(c => c.is_ready).length;
  const failedCount = checks.filter(c => c.status === 'FAILED').length;

  return {
    ready_count: readyCount,
    total_count: checks.length,
    status: failedCount > 0 ? 'FAILED' : readyCount === checks.length ? 'ALL_READY' : 'DEGRADED',
    checks,
  };
}
