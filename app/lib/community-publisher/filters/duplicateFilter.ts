/**
 * Filtro 4 — Duplicados
 * Previene publicar el mismo evento dos veces.
 * Idempotency key: signal_id:channel_id:publication_type
 */

import type { FilterResult, PublicationStatus } from '../types';
import { readQueue, readPublications } from '../persistence';

// Estados que indican que el evento ya fue procesado
const ACTIVE_STATUSES: PublicationStatus[] = ['PENDING', 'READY', 'DELIVERED'];

export async function duplicateFilter(idempotencyKey: string): Promise<FilterResult> {
  // Buscar en cola activa
  const queue = await readQueue();
  const inQueue = queue.find(
    p => p.idempotency_key === idempotencyKey && ACTIVE_STATUSES.includes(p.status),
  );
  if (inQueue) {
    return {
      passed: false,
      status: 'SKIPPED_DUPLICATE',
      reason: `Ya existe publicación con la misma key: ${idempotencyKey} (status: ${inQueue.status}, id: ${inQueue.publication_id})`,
    };
  }

  // Buscar en historial de entregadas
  const history = await readPublications();
  const delivered = history.find(
    p => p.idempotency_key === idempotencyKey && p.status === 'DELIVERED',
  );
  if (delivered) {
    return {
      passed: false,
      status: 'SKIPPED_DUPLICATE',
      reason: `Ya fue entregada anteriormente: ${idempotencyKey} (message_id: ${delivered.telegram_message_id})`,
    };
  }

  return { passed: true };
}
