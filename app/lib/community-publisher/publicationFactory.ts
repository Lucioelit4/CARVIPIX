/**
 * Community Publisher V1 — Publication Factory
 * Convierte eventos en registros Publication válidos.
 */

import type {
  CPEvent,
  AnalysisCompletedEvent,
  TradeClosedEvent,
  Publication,
  PublicationType,
} from './types';
import { PRIORITY_MAP } from './types';

const MAX_ATTEMPTS = 3;

export function createIdempotencyKey(
  event: CPEvent,
  pubType: PublicationType,
  channelId: string,
): string {
  const base =
    event.event_type === 'ANALYSIS_COMPLETED'
      ? event.signal_id
      : event.paper_trade_id;
  return `${base}:${channelId}:${pubType}`;
}

export function createPublicationId(
  pubType: PublicationType,
  signal_id: string,
): string {
  const prefix = pubType.slice(0, 3).toUpperCase();
  const ts = Date.now();
  const short = signal_id.slice(-6).replace(/[^a-z0-9]/gi, '');
  return `CP-${prefix}-${short}-${ts}`;
}

function buildExpiresAt(event: CPEvent): string | undefined {
  if (event.event_type !== 'ANALYSIS_COMPLETED') return undefined;
  const e = event as AnalysisCompletedEvent;
  if (e.analysis_public.expiry_utc_ms) {
    return new Date(e.analysis_public.expiry_utc_ms).toISOString();
  }
  if (e.analysis_public.validity_minutes) {
    return new Date(
      e.timestamp_utc_ms + e.analysis_public.validity_minutes * 60_000,
    ).toISOString();
  }
  return undefined;
}

function buildContentPreview(event: CPEvent, pubType: PublicationType): string {
  if (event.event_type === 'TRADE_CLOSED') {
    const e = event as TradeClosedEvent;
    const r = e.trade_result_public;
    return `${e.instrument} | ${r.result} | ${r.pnl_pips != null ? `${r.pnl_pips > 0 ? '+' : ''}${r.pnl_pips} pips` : ''}`;
  }

  const e = event as AnalysisCompletedEvent;
  const pub = e.analysis_public;

  if (pubType === 'FREE_ALERT') {
    const dir = e.decision === 'ENTER_BUY' ? '🟢 COMPRA' : '🔴 VENTA';
    return `${dir} ${e.instrument} | Entrada: ${pub.entry} | SL: ${pub.stop_loss} | TP: ${pub.take_profit} | RR: ${pub.risk_reward}`;
  }

  if (pubType === 'MARKET_STATUS') {
    return `${e.instrument} | ${pub.market_context ?? 'Estado de mercado'}`;
  }

  if (pubType === 'OPPORTUNITY_DEVELOPING') {
    return `${e.instrument} | ${e.decision} | Oportunidad en desarrollo`;
  }

  return `${e.instrument} | ${e.decision}`;
}

function buildSafeMetadata(event: CPEvent, pubType: PublicationType): Record<string, unknown> {
  if (event.event_type === 'TRADE_CLOSED') {
    const e = event as TradeClosedEvent;
    return {
      instrument: e.instrument,
      trade_result: e.trade_result_public,
      origin: e.origin,
    };
  }

  const e = event as AnalysisCompletedEvent;
  const meta: Record<string, unknown> = {
    instrument: e.instrument,
    decision: e.decision,
    public_status: e.public_status,
    origin: e.origin,
  };

  if (pubType === 'FREE_ALERT' || pubType === 'OPPORTUNITY_DEVELOPING') {
    meta.analysis_public = e.analysis_public;
  } else if (pubType === 'MARKET_STATUS') {
    meta.market_context = e.analysis_public.market_context;
    meta.confidence_level = e.analysis_public.confidence_level;
  }

  return meta;
}

export async function createPublication(
  event: CPEvent,
  pubType: PublicationType,
  channelId: string,
  testOnly: boolean,
): Promise<Publication> {
  const signalId =
    event.event_type === 'ANALYSIS_COMPLETED' ? event.signal_id : event.signal_id;
  const idempotencyKey = createIdempotencyKey(event, pubType, channelId);
  const publicationId = createPublicationId(pubType, signalId);

  let linkedPublicationId: string | undefined;
  if (pubType === 'TRADE_RESULT') {
    // Buscar la alerta previa publicada
    const { listQueue } = await import('./queueService');
    const queue = await listQueue();
    const priorAlert = queue.find(
      p =>
        p.signal_id === signalId &&
        p.channel_id === channelId &&
        p.publication_type === 'FREE_ALERT' &&
        (p.status === 'DELIVERED' || p.status === 'READY'),
    );
    if (priorAlert) {
      linkedPublicationId = priorAlert.publication_id;
    }
  }

  return {
    publication_id: publicationId,
    publication_type: pubType,
    analysis_id: event.analysis_id,
    signal_id: signalId,
    paper_trade_id:
      event.event_type === 'TRADE_CLOSED' ? event.paper_trade_id : undefined,
    channel_id: channelId,
    priority: PRIORITY_MAP[pubType],
    status: 'PENDING',
    created_at: new Date().toISOString(),
    expires_at: buildExpiresAt(event),
    content_preview: buildContentPreview(event, pubType),
    attempts: 0,
    max_attempts: MAX_ATTEMPTS,
    instrument: event.instrument,
    origin: event.origin,
    test_only: testOnly,
    idempotency_key: idempotencyKey,
    linked_publication_id: linkedPublicationId,
    metadata: buildSafeMetadata(event, pubType),
  };
}
