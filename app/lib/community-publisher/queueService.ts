/**
 * Community Publisher V1 — Queue Service
 * Gestión completa de la cola de publicaciones.
 * AUTO_SEND = false siempre en Fase 2.
 */

import type { Publication, PublicationStatus, QueueStats } from './types';
import {
  readQueue,
  writeQueue,
  appendPublication,
  readPublications,
  readConfig,
  getDailyCount,
  getTodayInTimezone,
} from './persistence';

// ─── Agregar ──────────────────────────────────────────────────────────────────

export async function addToQueue(publication: Publication): Promise<void> {
  const queue = await readQueue();
  // Deduplicar por publication_id (seguridad extra ante reinicios)
  const exists = queue.find(p => p.publication_id === publication.publication_id);
  if (!exists) {
    queue.push(publication);
    await writeQueue(queue);
  }
}

// ─── Listar ───────────────────────────────────────────────────────────────────

export async function listQueue(filter?: {
  status?: PublicationStatus;
  type?: string;
}): Promise<Publication[]> {
  const queue = await readQueue();
  let result = [...queue];

  if (filter?.status) result = result.filter(p => p.status === filter.status);
  if (filter?.type)   result = result.filter(p => p.publication_type === filter.type);

  // Ordenar por prioridad ASC, luego por created_at ASC (FIFO en empate)
  result.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });

  return result;
}

// ─── Obtener siguiente READY ──────────────────────────────────────────────────

export async function getNext(): Promise<Publication | null> {
  const config = await readConfig();
  if (config.paused || config.auto_send === false) return null;

  const queue = await listQueue({ status: 'READY' });
  return queue[0] ?? null;
}

// ─── Operaciones de estado ────────────────────────────────────────────────────

async function updateInQueue(
  publicationId: string,
  updater: (p: Publication) => Publication,
): Promise<Publication | null> {
  const queue = await readQueue();
  const idx = queue.findIndex(p => p.publication_id === publicationId);
  if (idx === -1) return null;

  queue[idx] = updater(queue[idx]);
  await writeQueue(queue);
  return queue[idx];
}

/**
 * Actualizar publicación con cambios arbitrarios (genérico)
 */
export async function updatePublicationStatus(
  publicationId: string,
  updates: Partial<Publication>,
): Promise<Publication | null> {
  return updateInQueue(publicationId, p => ({
    ...p,
    ...updates,
  }));
}

export async function markReady(publicationId: string): Promise<Publication | null> {
  return updateInQueue(publicationId, p => ({
    ...p,
    status: 'READY' as PublicationStatus,
  }));
}

export async function markDelivered(
  publicationId: string,
  telegramMessageId: number,
): Promise<Publication | null> {
  const updated = await updateInQueue(publicationId, p => ({
    ...p,
    status: 'DELIVERED' as PublicationStatus,
    delivered_at: new Date().toISOString(),
    telegram_message_id: telegramMessageId,
    attempts: p.attempts + 1,
    last_attempt_at: new Date().toISOString(),
  }));

  if (updated) {
    // Mover a historial inmutable
    await appendPublication(updated);
  }
  return updated;
}

export async function markFailed(
  publicationId: string,
  error: string,
): Promise<Publication | null> {
  const updated = await updateInQueue(publicationId, p => {
    const newAttempts = p.attempts + 1;
    const isDead = newAttempts >= p.max_attempts;
    return {
      ...p,
      status: isDead ? ('DEAD_LETTER' as PublicationStatus) : ('FAILED' as PublicationStatus),
      attempts: newAttempts,
      last_error: error,
      last_attempt_at: new Date().toISOString(),
    };
  });
  return updated;
}

export async function retryPublication(publicationId: string): Promise<Publication | null> {
  return updateInQueue(publicationId, p => {
    if (p.status !== 'FAILED' && p.status !== 'DEAD_LETTER') return p;
    return {
      ...p,
      status: 'PENDING' as PublicationStatus,
      last_error: undefined,
    };
  });
}

export async function cancelPublication(publicationId: string): Promise<Publication | null> {
  return updateInQueue(publicationId, p => {
    if (p.status === 'DELIVERED') return p; // no cancelar entregadas
    return { ...p, status: 'CANCELLED' as PublicationStatus };
  });
}

export async function moveToDeadLetter(publicationId: string): Promise<Publication | null> {
  return updateInQueue(publicationId, p => ({
    ...p,
    status: 'DEAD_LETTER' as PublicationStatus,
  }));
}

// ─── Eliminar (solo no-entregadas, con auditoría) ─────────────────────────────

export interface DeleteResult {
  deleted: boolean;
  reason?: string;
  publication_id: string;
  audit_at: string;
}

export async function deletePublication(publicationId: string): Promise<DeleteResult> {
  const queue = await readQueue();
  const pub = queue.find(p => p.publication_id === publicationId);

  if (!pub) {
    return { deleted: false, reason: 'No encontrada', publication_id: publicationId, audit_at: new Date().toISOString() };
  }

  if (pub.status === 'DELIVERED') {
    return { deleted: false, reason: 'No se pueden eliminar publicaciones entregadas', publication_id: publicationId, audit_at: new Date().toISOString() };
  }

  const newQueue = queue.filter(p => p.publication_id !== publicationId);
  await writeQueue(newQueue);
  return { deleted: true, publication_id: publicationId, audit_at: new Date().toISOString() };
}

// ─── Limpiar registros de prueba (solo CANCELLED/SKIPPED) ─────────────────────

export async function cleanTestRecords(): Promise<number> {
  const queue = await readQueue();
  const toKeep = queue.filter(
    p => !(p.test_only && (p.status === 'CANCELLED' || p.status === 'SKIPPED')),
  );
  const removed = queue.length - toKeep.length;
  await writeQueue(toKeep);
  return removed;
}

// ─── Estadísticas ─────────────────────────────────────────────────────────────

export async function getQueueStats(): Promise<QueueStats> {
  const [queue, config] = await Promise.all([readQueue(), readConfig()]);
  const today = getTodayInTimezone(config.timezone);
  const channelId = process.env.TELEGRAM_CHANNEL_TEST ?? '';
  const freeAlertsToday = await getDailyCount(today, channelId);

  const counts = {
    pending: 0,
    ready: 0,
    delivered: 0,
    failed: 0,
    skipped: 0,
    dead_letter: 0,
    cancelled: 0,
  };

  let lastError: string | undefined;
  let lastProcessed: string | undefined;

  for (const p of queue) {
    switch (p.status) {
      case 'PENDING':     counts.pending++;    break;
      case 'READY':       counts.ready++;      break;
      case 'DELIVERED':   counts.delivered++;  break;
      case 'FAILED':
        counts.failed++;
        if (!lastError) lastError = p.last_error;
        break;
      case 'SKIPPED':     counts.skipped++;    break;
      case 'DEAD_LETTER': counts.dead_letter++; break;
      case 'CANCELLED':   counts.cancelled++;  break;
    }

    if (!lastProcessed || new Date(p.created_at) > new Date(lastProcessed)) {
      lastProcessed = p.created_at;
    }
  }

  return {
    total: queue.length,
    ...counts,
    free_alerts_today: freeAlertsToday,
    daily_limit: config.max_free_alerts_per_day,
    last_processed_at: lastProcessed,
    last_error: lastError,
    auto_send: config.auto_send,
    paused: config.paused,
    test_only: config.test_only || (process.env.TEST_ONLY === 'true'),
  };
}
