/**
 * Filtro 2 — Elegibilidad
 * Verifica que el evento tiene los datos mínimos requeridos para el tipo de publicación.
 */

import type {
  CPEvent,
  AnalysisCompletedEvent,
  TradeClosedEvent,
  PublicationType,
  FilterResult,
  Decision,
} from '../types';

// Decisiones que generan alertas gratuitas
const FREE_ALERT_DECISIONS: Decision[] = ['ENTER_BUY', 'ENTER_SELL'];
// Decisiones internas que no deben convertirse en publicaciones para Telegram
const SILENT_DECISIONS: Decision[] = ['WAIT', 'NO_TRADE', 'CONDITIONAL_ENTRY'];

export function determinePublicationType(event: CPEvent): PublicationType | null {
  if (event.event_type === 'TRADE_CLOSED') {
    return 'TRADE_RESULT';
  }

  const e = event as AnalysisCompletedEvent;
  if (FREE_ALERT_DECISIONS.includes(e.decision)) return 'FREE_ALERT';
  if (SILENT_DECISIONS.includes(e.decision)) return null;

  return null;
}

export function eligibilityFilter(event: CPEvent, pubType: PublicationType): FilterResult {
  if (event.event_type === 'ANALYSIS_COMPLETED') {
    return checkAnalysisEligibility(event as AnalysisCompletedEvent, pubType);
  }
  return checkTradeEligibility(event as TradeClosedEvent);
}

function checkAnalysisEligibility(
  event: AnalysisCompletedEvent,
  pubType: PublicationType,
): FilterResult {
  const pub = event.analysis_public;
  const now = Date.now();

  if (pubType === 'FREE_ALERT') {
    // Necesita señal completa
    if (!pub.entry)      return fail('SKIPPED_ELIGIBILITY', 'Falta entry en analysis_public');
    if (!pub.stop_loss)  return fail('SKIPPED_ELIGIBILITY', 'Falta stop_loss en analysis_public');
    if (!pub.take_profit) return fail('SKIPPED_ELIGIBILITY', 'Falta take_profit en analysis_public');
    if (!pub.risk_reward) return fail('SKIPPED_ELIGIBILITY', 'Falta risk_reward en analysis_public');

    // Verificar vigencia
    if (!pub.expiry_utc_ms && !pub.validity_minutes) {
      return fail('SKIPPED_ELIGIBILITY', 'Falta vigencia (expiry_utc_ms o validity_minutes)');
    }

    const expiry = pub.expiry_utc_ms ?? (event.timestamp_utc_ms + (pub.validity_minutes ?? 0) * 60_000);
    if (expiry <= now) {
      return fail('SKIPPED_EXPIRED', `Señal vencida. Expiró: ${new Date(expiry).toISOString()}`);
    }
  }

  if (pubType === 'MARKET_STATUS') {
    if (!pub.market_context) {
      return fail('SKIPPED_ELIGIBILITY', 'MARKET_STATUS requiere market_context en analysis_public');
    }
  }

  if (pubType === 'OPPORTUNITY_DEVELOPING') {
    return fail('SKIPPED_INACTIVE_DECISION', 'OPPORTUNITY_DEVELOPING no se publica en Telegram');
  }

  return { passed: true };
}

function checkTradeEligibility(event: TradeClosedEvent): FilterResult {
  const r = event.trade_result_public;
  if (!r?.result) {
    return fail('SKIPPED_ELIGIBILITY', 'TRADE_CLOSED requiere trade_result_public.result');
  }
  if (!event.paper_trade_id) {
    return fail('SKIPPED_ELIGIBILITY', 'TRADE_CLOSED requiere paper_trade_id');
  }
  return { passed: true };
}

function fail(status: FilterResult['status'], reason: string): FilterResult {
  return { passed: false, status, reason };
}
