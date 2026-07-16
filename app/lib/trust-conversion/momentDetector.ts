/**
 * Trust & Conversion Engine — Moment Detector
 * Detecta automáticamente momentos comerciales contextuales (NO por horario)
 */

import type {
  CommercialMoment,
  CommercialMomentType,
  TrustConversionConfig,
} from './types';
import { loadMoments, addMoment, loadConfig } from './persistence';
import { listQueue } from '@/app/lib/community-publisher/queueService';
import { readPublications } from '@/app/lib/community-publisher/persistence';

// ─── Detectar Racha Positiva ─────────────────────────────────────────────────

export async function detectWinningStreak(config: TrustConversionConfig): Promise<CommercialMoment | null> {
  if (!config.detect_winning_streaks) return null;

  try {
    const publications = await readPublications();

    // Filtrar TRADE_RESULT entregados en últimas 24h
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    const recent = publications.filter(
      p =>
        p.publication_type === 'TRADE_RESULT' &&
        p.status === 'DELIVERED' &&
        new Date(p.delivered_at || p.created_at).getTime() > now - day,
    );

    if (recent.length < 3) return null; // Mínimo 3 resultados

    // Calcular pips totales
    let totalPips = 0;
    let winCount = 0;
    for (const pub of recent) {
      const meta = pub.metadata as Record<string, unknown>;
      const tr = meta.trade_result as Record<string, unknown>;
      if (tr?.pnl_pips) {
        const pips = Number(tr.pnl_pips);
        if (pips > 0) {
          totalPips += pips;
          winCount++;
        }
      }
    }

    if (totalPips < config.winning_streak_threshold) return null;

    const momentId = `STREAK-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    const moment: CommercialMoment = {
      moment_id: momentId,
      type: 'WINNING_STREAK',
      status: 'DETECTED',
      confidence: Math.min(100, 50 + (totalPips / config.winning_streak_threshold) * 50),
      priority: 2,

      trigger_data: {
        total_pips: totalPips,
        win_count: winCount,
        total_results: recent.length,
        period_hours: 24,
      },
      detected_at: new Date().toISOString(),

      suggested_product: 'PREMIUM_ALERTS',
      reason: `Racha positiva documentada: ${winCount} ganancias, ${totalPips} pips en 24h`,
    };

    return moment;
  } catch (error) {
    console.error('[MOMENT DETECTOR] Error detecting winning streak:', error);
    return null;
  }
}

// ─── Detectar Resultado Destacado ────────────────────────────────────────────

export async function detectNotableResult(config: TrustConversionConfig): Promise<CommercialMoment | null> {
  if (!config.detect_notable_results) return null;

  try {
    const publications = await readPublications();

    // Último TRADE_RESULT entregado
    const lastResult = publications
      .filter(p => p.publication_type === 'TRADE_RESULT' && p.status === 'DELIVERED')
      .sort((a, b) => new Date(b.delivered_at || b.created_at).getTime() - new Date(a.delivered_at || a.created_at).getTime())
      [0];

    if (!lastResult) return null;

    const meta = lastResult.metadata as Record<string, unknown>;
    const tr = meta.trade_result as Record<string, unknown>;
    const pips = Number(tr?.pnl_pips) || 0;

    if (Math.abs(pips) < config.notable_result_threshold) return null;

    // No sugerir después de pérdida
    if (pips < 0) {
      return null;
    }

    const momentId = `RESULT-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    const moment: CommercialMoment = {
      moment_id: momentId,
      type: 'NOTABLE_RESULT',
      status: 'DETECTED',
      confidence: Math.min(100, 60 + (pips / config.notable_result_threshold) * 40),
      priority: 2,

      trigger_data: {
        pips: pips,
        result: tr?.result,
        instrument: lastResult.instrument,
      },
      detected_at: new Date().toISOString(),

      suggested_product: 'PREMIUM_ALERTS',
      reason: `Resultado destacado: ${pips} pips capturados en ${lastResult.instrument}`,
    };

    return moment;
  } catch (error) {
    console.error('[MOMENT DETECTOR] Error detecting notable result:', error);
    return null;
  }
}

// ─── Detectar Alta Actividad de Mercado ──────────────────────────────────────

export async function detectHighMarketActivity(config: TrustConversionConfig): Promise<CommercialMoment | null> {
  if (!config.detect_high_activity) return null;

  try {
    const queue = await listQueue();

    // Contar alertas de entrada en los últimos 60 minutos
    const now = Date.now();
    const hour = 60 * 60 * 1000;
    const recent = queue.filter(
      p =>
        p.publication_type === 'FREE_ALERT' &&
        (p.status === 'READY' || p.status === 'DELIVERED') &&
        new Date(p.created_at).getTime() > now - hour,
    );

    if (recent.length < config.high_activity_threshold) return null;

    const momentId = `ACTIVITY-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    const moment: CommercialMoment = {
      moment_id: momentId,
      type: 'HIGH_MARKET_ACTIVITY',
      status: 'DETECTED',
      confidence: Math.min(100, 50 + (recent.length / config.high_activity_threshold) * 50),
      priority: 3,

      trigger_data: {
        alerts_last_hour: recent.length,
        instruments: [...new Set(recent.map(p => p.instrument))],
      },
      detected_at: new Date().toISOString(),

      suggested_product: 'PREMIUM_ALERTS',
      reason: `Alto movimiento: ${recent.length} oportunidades detectadas en la última hora`,
    };

    return moment;
  } catch (error) {
    console.error('[MOMENT DETECTOR] Error detecting high activity:', error);
    return null;
  }
}

// ─── Detectar Sin Oportunidades (para educación) ──────────────────────────────

export async function detectNoOpportunities(config: TrustConversionConfig): Promise<CommercialMoment | null> {
  if (!config.detect_engagement_peaks) return null;

  try {
    const queue = await listQueue();

    // Últimas 3 horas sin alertas FREE_ALERT
    const now = Date.now();
    const threeHours = 3 * 60 * 60 * 1000;
    const recent = queue.filter(
      p =>
        p.publication_type === 'FREE_ALERT' &&
        new Date(p.created_at).getTime() > now - threeHours,
    );

    if (recent.length > 0) return null; // Hay alertas

    const momentId = `NO_OPP-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    const moment: CommercialMoment = {
      moment_id: momentId,
      type: 'NO_OPPORTUNITIES',
      status: 'DETECTED',
      confidence: 70,
      priority: 4,

      trigger_data: {
        hours_without_alerts: 3,
      },
      detected_at: new Date().toISOString(),

      suggested_product: 'PREMIUM_ALERTS',
      reason: 'Sin oportunidades claras: momento ideal para educación sobre seguimiento Premium',
    };

    return moment;
  } catch (error) {
    console.error('[MOMENT DETECTOR] Error detecting no opportunities:', error);
    return null;
  }
}

// ─── Detectar Pico de Engagement ─────────────────────────────────────────────

export async function detectEngagementPeak(config: TrustConversionConfig): Promise<CommercialMoment | null> {
  if (!config.detect_engagement_peaks) return null;

  try {
    const queue = await listQueue();

    // Muchas publicaciones DELIVERED en último hora
    const now = Date.now();
    const hour = 60 * 60 * 1000;
    const recent = queue.filter(
      p =>
        (p.status === 'DELIVERED' || p.status === 'READY') &&
        new Date(p.created_at).getTime() > now - hour,
    );

    if (recent.length < 5) return null;

    const momentId = `ENGAGEMENT-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    const moment: CommercialMoment = {
      moment_id: momentId,
      type: 'ENGAGEMENT_PEAK',
      status: 'DETECTED',
      confidence: Math.min(100, 50 + (recent.length / 10) * 50),
      priority: 3,

      trigger_data: {
        publications_last_hour: recent.length,
        distribution: {
          free_alerts: recent.filter(p => p.publication_type === 'FREE_ALERT').length,
          results: recent.filter(p => p.publication_type === 'TRADE_RESULT').length,
          status: recent.filter(p => p.publication_type === 'MARKET_STATUS').length,
        },
      },
      detected_at: new Date().toISOString(),

      suggested_product: 'BOT',
      reason: `Alto engagement: ${recent.length} publicaciones en la última hora`,
    };

    return moment;
  } catch (error) {
    console.error('[MOMENT DETECTOR] Error detecting engagement peak:', error);
    return null;
  }
}

// ─── Orquestador: Detectar todos los momentos ────────────────────────────────

export async function detectAllMoments(): Promise<CommercialMoment[]> {
  const config = await loadConfig();

  if (config.paused) {
    return [];
  }

  const moments: CommercialMoment[] = [];

  // Ejecutar detecciones en paralelo
  const results = await Promise.allSettled([
    detectWinningStreak(config),
    detectNotableResult(config),
    detectHighMarketActivity(config),
    detectNoOpportunities(config),
    detectEngagementPeak(config),
  ]);

  for (const result of results) {
    if (result.status === 'fulfilled' && result.value) {
      moments.push(result.value);
    }
  }

  return moments;
}

/**
 * Ejecutar ciclo completo de detección
 * Llamar periódicamente (ej: cada 5 minutos)
 */
export async function runDetectionCycle(): Promise<void> {
  try {
    const newMoments = await detectAllMoments();

    for (const moment of newMoments) {
      // Verificar si ya existe similar
      const existing = await loadMoments();
      const duplicate = existing.find(
        m =>
          m.type === moment.type &&
          new Date(m.detected_at).getTime() > Date.now() - 60 * 60 * 1000, // última hora
      );

      if (!duplicate) {
        await addMoment(moment);
        console.log(`[MOMENT DETECTOR] ✓ Detectado: ${moment.type} — Confianza: ${moment.confidence.toFixed(0)}%`);
      }
    }
  } catch (error) {
    console.error('[MOMENT DETECTOR] Error en ciclo de detección:', error);
  }
}
