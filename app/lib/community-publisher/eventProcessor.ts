/**
 * Community Publisher V1 — Event Processor
 *
 * Orquesta el flujo completo:
 * Evento → validación de contrato → filtros → publication → cola
 *
 * AUTO_SEND = false: nunca envía automáticamente.
 */

import type { CPEvent, AnalysisCompletedEvent, TradeClosedEvent, ProcessorResult, PublicationType, SkipReason } from './types';
import { securityFilter } from './filters/securityFilter';
import { eligibilityFilter, determinePublicationType } from './filters/eligibilityFilter';
import { dailyLimitsFilter, incrementDailyFreeAlert } from './filters/dailyLimitsFilter';
import { duplicateFilter } from './filters/duplicateFilter';
import { createPublication, createIdempotencyKey } from './publicationFactory';
import { addToQueue, listQueue } from './queueService';
import { appendProcessorLog } from './persistence';

// ─── Validación de contrato ───────────────────────────────────────────────────

function validateContract(event: unknown): { ok: boolean; reason?: string } {
  if (!event || typeof event !== 'object') {
    return { ok: false, reason: 'Payload no es un objeto' };
  }

  const e = event as Record<string, unknown>;

  if (!e.event_type || typeof e.event_type !== 'string') {
    return { ok: false, reason: 'Falta event_type' };
  }

  if (e.event_type === 'ANALYSIS_COMPLETED') {
    if (!e.analysis_id) return { ok: false, reason: 'Falta analysis_id' };
    if (!e.signal_id)   return { ok: false, reason: 'Falta signal_id' };
    if (!e.instrument)  return { ok: false, reason: 'Falta instrument' };
    if (!e.timestamp_utc_ms) return { ok: false, reason: 'Falta timestamp_utc_ms' };
    if (!e.decision)    return { ok: false, reason: 'Falta decision' };
    if (!e.origin)      return { ok: false, reason: 'Falta origin' };
    if (!e.analysis_public || typeof e.analysis_public !== 'object') {
      return { ok: false, reason: 'Falta bloque analysis_public' };
    }
    // Verificar vigencia
    const ts = e.timestamp_utc_ms as number;
    if (ts < Date.now() - 24 * 60 * 60_000) {
      return { ok: false, reason: 'timestamp_utc_ms demasiado antiguo (> 24h)' };
    }
    return { ok: true };
  }

  if (e.event_type === 'TRADE_CLOSED') {
    if (!e.paper_trade_id) return { ok: false, reason: 'Falta paper_trade_id' };
    if (!e.signal_id)      return { ok: false, reason: 'Falta signal_id' };
    if (!e.analysis_id)    return { ok: false, reason: 'Falta analysis_id' };
    if (!e.instrument)     return { ok: false, reason: 'Falta instrument' };
    if (!e.timestamp_utc_ms) return { ok: false, reason: 'Falta timestamp_utc_ms' };
    if (!e.origin)         return { ok: false, reason: 'Falta origin' };
    if (!e.trade_result_public || typeof e.trade_result_public !== 'object') {
      return { ok: false, reason: 'Falta bloque trade_result_public' };
    }
    return { ok: true };
  }

  return { ok: false, reason: `event_type desconocido: ${e.event_type}` };
}

// ─── Verificar alerta previa para TRADE_RESULT ────────────────────────────────

async function hasPriorPublishedAlert(signalId: string, channelId: string): Promise<boolean> {
  const queue = await listQueue();
  return queue.some(
    p =>
      p.signal_id === signalId &&
      p.channel_id === channelId &&
      p.publication_type === 'FREE_ALERT' &&
      (p.status === 'DELIVERED' || p.status === 'READY'),
  );
}

// ─── Helper skip ──────────────────────────────────────────────────────────────

function makeSkip(reason: SkipReason, detail: string, processingId: string): ProcessorResult {
  return {
    accepted: false,
    skip_reason: reason,
    skip_detail: detail,
    processing_id: processingId,
    processed_at: new Date().toISOString(),
  };
}

// ─── Procesador principal ─────────────────────────────────────────────────────

export async function processEvent(rawEvent: unknown): Promise<ProcessorResult> {
  const processingId = `PROC-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const channelId = process.env.TELEGRAM_CHANNEL_TEST ?? '';
  const testOnly  = process.env.TEST_ONLY === 'true';

  // 1. Validación de contrato
  const contract = validateContract(rawEvent);
  if (!contract.ok) {
    await log({ processingId, rawEvent, reason: 'SKIPPED_INVALID_INPUT', detail: contract.reason! });
    return makeSkip('SKIPPED_INVALID_INPUT', contract.reason!, processingId);
  }

  const event = rawEvent as CPEvent;

  // 2. Filtro de seguridad
  const security = securityFilter(event);
  if (!security.passed) {
    await log({ processingId, event, reason: 'SKIPPED_SECURITY', detail: security.reason! });
    return makeSkip('SKIPPED_SECURITY', security.reason!, processingId);
  }

  // 3. Determinar tipo de publicación
  const pubType: PublicationType | null = determinePublicationType(event);

  if (pubType === null) {
    // NO_TRADE: no genera publicación (no es error)
    await log({ processingId, event, reason: 'SKIPPED_NO_TRADE', detail: 'Decisión NO_TRADE no genera publicación' });
    return makeSkip('SKIPPED_NO_TRADE', 'Decisión NO_TRADE no genera publicación', processingId);
  }

  // 4. Filtro de elegibilidad
  const eligibility = eligibilityFilter(event, pubType);
  if (!eligibility.passed) {
    const reason = eligibility.status as SkipReason;
    await log({ processingId, event, reason, detail: eligibility.reason! });
    return makeSkip(reason, eligibility.reason!, processingId);
  }

  // 5. Límites diarios (solo FREE_ALERT)
  if (pubType === 'FREE_ALERT') {
    const limits = await dailyLimitsFilter(channelId);
    if (!limits.passed) {
      await log({ processingId, event, reason: 'SKIPPED_DAILY_LIMIT', detail: limits.reason! });
      return makeSkip('SKIPPED_DAILY_LIMIT', limits.reason!, processingId);
    }
  }

  // 6. Para TRADE_RESULT verificar alerta previa publicada
  if (pubType === 'TRADE_RESULT') {
    const hasPrior = await hasPriorPublishedAlert(event.signal_id, channelId);
    if (!hasPrior) {
      const detail = `No existe FREE_ALERT previa entregada para signal_id: ${event.signal_id}`;
      await log({ processingId, event, reason: 'SKIPPED_NO_PRIOR_ALERT', detail });
      return makeSkip('SKIPPED_NO_PRIOR_ALERT', detail, processingId);
    }
  }

  // 7. Filtro de duplicados
  const idempotencyKey = createIdempotencyKey(event, pubType, channelId);
  const duplicate = await duplicateFilter(idempotencyKey);
  if (!duplicate.passed) {
    await log({ processingId, event, reason: 'SKIPPED_DUPLICATE', detail: duplicate.reason! });
    return makeSkip('SKIPPED_DUPLICATE', duplicate.reason!, processingId);
  }

  // 8. Crear Publication
  const publication = await createPublication(event, pubType, channelId, testOnly);

  // 9. Agregar a cola
  await addToQueue(publication);

  // 10. Incrementar contador diario si es FREE_ALERT
  if (pubType === 'FREE_ALERT') {
    await incrementDailyFreeAlert(channelId);
  }

  // 11. Log
  await log({ processingId, event, accepted: true, publicationId: publication.publication_id, pubType });

  console.log(`[CP EVENT PROCESSOR] Aceptado: ${publication.publication_id} (${pubType})`);

  return {
    accepted: true,
    publication,
    processing_id: processingId,
    processed_at: new Date().toISOString(),
  };
}

// ─── Log interno ─────────────────────────────────────────────────────────────

async function log(opts: {
  processingId: string;
  event?: CPEvent;
  rawEvent?: unknown;
  reason?: string;
  detail?: string;
  accepted?: boolean;
  publicationId?: string;
  pubType?: PublicationType;
}): Promise<void> {
  const e = opts.event as CPEvent | undefined;
  const rawEvent = opts.rawEvent as { event_type?: string } | undefined;
  await appendProcessorLog({
    processing_id: opts.processingId,
    event_type: e?.event_type ?? rawEvent?.event_type ?? 'UNKNOWN',
    signal_id: e?.signal_id,
    analysis_id: e?.analysis_id,
    decision: e?.event_type === 'ANALYSIS_COMPLETED' ? (e as AnalysisCompletedEvent).decision : undefined,
    accepted: opts.accepted ?? false,
    skip_reason: opts.reason,
    skip_detail: opts.detail,
    publication_id: opts.publicationId,
    publication_type: opts.pubType,
    processed_at: new Date().toISOString(),
  });
}
