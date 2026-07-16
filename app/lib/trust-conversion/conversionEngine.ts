/**
 * Trust & Conversion Engine — Conversion Engine
 * Genera sugerencias comerciales contextuales y éticas
 */

import type { CommercialMoment, CommercialSuggestion, TrustConversionConfig } from './types';
import {
  loadMoments,
  loadSuggestions,
  updateMoment,
  addSuggestion,
  loadConfig,
  appendEvent,
} from './persistence';
import { listQueue } from '@/app/lib/community-publisher/queueService';

// ─── Plantillas de Mensajes (Embudo de Confianza) ───────────────────────────

const MESSAGE_TEMPLATES: Record<string, string> = {
  WINNING_STREAK: `📈 <b>Esta semana, el análisis ha capturado {{pips}} pips</b>

No es suerte.

Es el sistema CARVIPIX funcionando.

Los miembros Premium acceden a:
✓ Cobertura completa (no solo alertas selectas)
✓ Análisis de cada sesión
✓ Comunidad verificada

Cuando el sistema funciona bien, es momento de ver la versión completa.`,

  NOTABLE_RESULT: `🎯 <b>{{pips}} pips capturados en {{instrument}}</b>

Un resultado real. Documentado. Verificable.

Si el análisis gratuito te muestra esto, pregúntate:

"¿Qué vería en Premium?"

Es el momento de descubrirlo.`,

  HIGH_MARKET_ACTIVITY: `⚡ <b>{{count}} oportunidades en la última hora</b>

Hoy el mercado está ruidoso.

CARVIPIX generó múltiples escenarios reales.

Los miembros Premium no pierden ninguno.

Reciben cobertura completa, no solo alertas selectas.

¿Listo para verlo?`,

  NO_OPPORTUNITIES: `📚 <b>Hoy el mercado no ofrece entradas claras</b>

Y eso está bien.

Los traders profesionales saben cuándo NO operar.

CARVIPIX monitorea constantemente.

Los miembros Premium reciben seguimiento 24/7, incluso cuando no hay entrada.

Porque estar atento es parte del trading.`,

  ENGAGEMENT_PEAK: `🚀 <b>El sistema está activo</b>

Múltiples análisis en tiempo real.

CARVIPIX no descansa.

¿Quieres conocer el bot que lo controla todo?

Automatización, alertas personalizadas, seguridad verificada.`,
};

const PREVIEW_TEMPLATES: Record<string, string> = {
  WINNING_STREAK: '📈 Racha positiva — Descubre Premium',
  NOTABLE_RESULT: '🎯 Resultado destacado — Conoce más',
  HIGH_MARKET_ACTIVITY: '⚡ Alta actividad — Cobertura completa',
  NO_OPPORTUNITIES: '📚 Educación — Premium está siempre atento',
  ENGAGEMENT_PEAK: '🚀 Sistema activo — Automatización lista',
};

// ─── Verificar Límites ──────────────────────────────────────────────────────

async function checkLimits(config: TrustConversionConfig): Promise<{
  can_publish: boolean;
  reason?: string;
  respects_frequency: boolean;
  respects_cooldown: boolean;
  respects_ratio: boolean;
}> {
  const suggestions = await loadSuggestions();
  const now = Date.now();
  const week = 7 * 24 * 60 * 60 * 1000;
  const twodays = 2 * 24 * 60 * 60 * 1000;

  // Publicaciones recientes
  const recentPublished = suggestions.filter(
    s =>
      s.status === 'PUBLISHED' &&
      new Date(s.published_at || s.created_at).getTime() > now - week,
  );

  // Verificar frecuencia (max_promotions_per_week)
  const respects_frequency = recentPublished.length < config.max_promotions_per_week;

  // Verificar cooldown (48 horas)
  const lastPublished = recentPublished.sort(
    (a, b) =>
      new Date(b.published_at || b.created_at).getTime() -
      new Date(a.published_at || a.created_at).getTime(),
  )[0];

  const respects_cooldown =
    !lastPublished || new Date(lastPublished.published_at || lastPublished.created_at).getTime() < now - twodays;

  // Verificar ratio (max 20% promocional)
  const allPublished = await loadSuggestions();
  const totalPublished = allPublished.filter(s => s.status === 'PUBLISHED').length;
  const promoCount = recentPublished.length;
  const promoRatio = totalPublished > 0 ? promoCount / totalPublished : 0;
  const respects_ratio = promoRatio <= config.max_promotional_ratio;

  const can_publish = respects_frequency && respects_cooldown && respects_ratio;
  const reason = !respects_frequency
    ? `Límite semanal (${recentPublished.length}/${config.max_promotions_per_week})`
    : !respects_cooldown
      ? 'Cooldown de 48h no cumplido'
      : !respects_ratio
        ? `Ratio promocional (${(promoRatio * 100).toFixed(1)}% / ${config.max_promotional_ratio * 100}%)`
        : undefined;

  return { can_publish, reason, respects_frequency, respects_cooldown, respects_ratio };
}

// ─── Generar Sugerencia ─────────────────────────────────────────────────────

export async function generateSuggestion(moment: CommercialMoment): Promise<CommercialSuggestion> {
  const suggestionId = `SUGG-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  const messageBody = (MESSAGE_TEMPLATES[moment.type] || MESSAGE_TEMPLATES.ENGAGEMENT_PEAK)
    .replace('{{pips}}', (moment.trigger_data?.total_pips as number)?.toString() || '0')
    .replace('{{instrument}}', (moment.trigger_data?.instrument as string) || 'mercado')
    .replace('{{count}}', (moment.trigger_data?.alerts_last_hour as number)?.toString() || '0');

  const preview = PREVIEW_TEMPLATES[moment.type] || '💼 Propuesta comercial';

  const config = await loadConfig();
  const limitsCheck = await checkLimits(config);

  const suggestion: CommercialSuggestion = {
    suggestion_id: suggestionId,
    moment_id: moment.moment_id,
    product: moment.suggested_product,

    status: 'PENDING_APPROVAL',

    message_body: messageBody,
    message_preview: preview,

    created_at: new Date().toISOString(),

    clicks: 0,
    registrations: 0,
    payments: 0,

    confidence: moment.confidence,
    reasoning: `${moment.reason} | Límites OK: ${limitsCheck.can_publish}`,
    metadata: {
      moment_type: moment.type,
      limits: limitsCheck,
      trigger_data: moment.trigger_data,
    },
  };

  return suggestion;
}

// ─── Procesar Momentos Detectados ───────────────────────────────────────────

export async function processDetectedMoments(): Promise<void> {
  try {
    const config = await loadConfig();

    if (config.paused) {
      console.log('[CONVERSION ENGINE] Sistema pausado');
      return;
    }

    // Obtener momentos DETECTED
    const moments = await loadMoments();
    const detected = moments.filter(m => m.status === 'DETECTED').slice(0, 5); // Procesar máximo 5

    if (detected.length === 0) {
      return;
    }

    for (const moment of detected) {
      try {
        // Generar sugerencia
        const suggestion = await generateSuggestion(moment);

        // Guardar sugerencia
        await addSuggestion(suggestion);

        // Actualizar momento
        await updateMoment(moment.moment_id, {
          status: 'PENDING_APPROVAL',
          suggested_at: new Date().toISOString(),
          suggestion_id: suggestion.suggestion_id,
        });

        // Registrar evento
        await appendEvent({
          event_id: `EVT-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          event_type: 'MOMENT_DETECTED',
          timestamp_utc_ms: Date.now(),
          moment_id: moment.moment_id,
          suggestion_id: suggestion.suggestion_id,
          data: {
            type: moment.type,
            confidence: moment.confidence,
          },
        });

        console.log(
          `[CONVERSION ENGINE] ✓ Sugerencia generada: ${moment.type} → ${suggestion.product}`,
        );
      } catch (error) {
        console.error(`[CONVERSION ENGINE] Error procesando ${moment.moment_id}:`, error);
      }
    }
  } catch (error) {
    console.error('[CONVERSION ENGINE] Error en procesamiento:', error);
  }
}

/**
 * Aprobar una sugerencia (admin manual)
 */
export async function approveSuggestion(suggestionId: string): Promise<CommercialSuggestion | null> {
  const suggestions = await loadSuggestions();
  const idx = suggestions.findIndex(s => s.suggestion_id === suggestionId);
  if (idx === -1) return null;

  suggestions[idx].status = 'APPROVED';
  suggestions[idx].approved_at = new Date().toISOString();

  const { saveSuggestions } = await import('./persistence');
  await saveSuggestions(suggestions);

  // Registrar evento
  await appendEvent({
    event_id: `EVT-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    event_type: 'SUGGESTION_APPROVED',
    timestamp_utc_ms: Date.now(),
    suggestion_id: suggestionId,
    data: { product: suggestions[idx].product },
  });

  return suggestions[idx];
}

/**
 * Cancelar una sugerencia
 */
export async function cancelSuggestion(suggestionId: string): Promise<CommercialSuggestion | null> {
  const suggestions = await loadSuggestions();
  const idx = suggestions.findIndex(s => s.suggestion_id === suggestionId);
  if (idx === -1) return null;

  suggestions[idx].status = 'REJECTED';

  const { saveSuggestions } = await import('./persistence');
  await saveSuggestions(suggestions);

  return suggestions[idx];
}

/**
 * Publicar una sugerencia aprobada a la cola del Community Publisher
 */
export async function publishApprovedSuggestion(
  suggestionId: string,
): Promise<{ ok: boolean; publication_id?: string; reason?: string }> {
  try {
    const suggestions = await loadSuggestions();
    const suggestion = suggestions.find(s => s.suggestion_id === suggestionId);

    if (!suggestion) {
      return { ok: false, reason: 'Sugerencia no encontrada' };
    }

    if (suggestion.status !== 'APPROVED') {
      return { ok: false, reason: `Estado inválido: ${suggestion.status}` };
    }

    // Crear publicación EDUCATIONAL_OR_PROMOTIONAL
    const { createPublication } = await import('@/app/lib/community-publisher/publicationFactory');
    const { addToQueue } = await import('@/app/lib/community-publisher/queueService');

    const channelId = process.env.TELEGRAM_CHANNEL_TEST ?? '';
    const testOnly = process.env.TEST_ONLY !== 'false';

    // Simular evento para el publisher (sin usar el procesador de eventos)
    const fakeEvent = {
      event_type: 'TRUST_CONVERSION_MOMENT',
      analysis_id: `TC-${suggestion.moment_id}`,
      signal_id: `TC-${suggestion.suggestion_id}`,
      instrument: 'COMMUNITY',
      timestamp_utc_ms: Date.now(),
      decision: 'PUBLISH',
      origin: 'PAPER',
      analysis_public: {
        market_context: suggestion.reasoning,
      },
    };

    // Crear publicación
    const publication = await createPublication(fakeEvent as any, 'EDUCATIONAL_OR_PROMOTIONAL', channelId, testOnly);

    // Actualizar con contenido de sugerencia
    publication.content_preview = suggestion.message_preview;
    publication.metadata = {
      message_body: suggestion.message_body,
      product: suggestion.product,
      moment_id: suggestion.moment_id,
      suggestion_id: suggestionId,
    };

    // Agregar a cola
    await addToQueue(publication);

    // Actualizar sugerencia
    const updated = suggestions.map(s =>
      s.suggestion_id === suggestionId
        ? ({
            ...s,
            status: 'PUBLISHED' as const,
            published_at: new Date().toISOString(),
          } as CommercialSuggestion)
        : s,
    );

    const { saveSuggestions } = await import('./persistence');
    await saveSuggestions(updated);

    // Registrar evento
    await appendEvent({
      event_id: `EVT-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      event_type: 'SUGGESTION_PUBLISHED',
      timestamp_utc_ms: Date.now(),
      suggestion_id: suggestionId,
      publication_id: publication.publication_id,
      data: { product: suggestion.product },
    });

    console.log(`[CONVERSION ENGINE] ✓ Publicada: ${suggestionId} → ${publication.publication_id}`);

    return { ok: true, publication_id: publication.publication_id };
  } catch (error) {
    console.error('[CONVERSION ENGINE] Error publicando sugerencia:', error);
    return {
      ok: false,
      reason: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
