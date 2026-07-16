/**
 * Trust & Conversion Engine — Tracking Service
 * Relaciona momentos comerciales con resultados reales (clics, registros, pagos)
 */

import type { CommercialSuggestion, ConversionEvent, ConversionMetrics } from './types';
import {
  loadSuggestions,
  loadEvents,
  loadMetrics,
  saveMetrics,
  updateSuggestion,
  appendEvent,
} from './persistence';

// ─── Registrar evento de tracking ────────────────────────────────────────────

export async function trackConversionEvent(
  eventType: 'LINK_CLICKED' | 'REGISTRATION_STARTED' | 'REGISTRATION_COMPLETED' | 'PAYMENT_APPROVED',
  suggestionId: string,
  userId?: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  try {
    const event: ConversionEvent = {
      event_id: `EVT-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      event_type: eventType,
      timestamp_utc_ms: Date.now(),
      suggestion_id: suggestionId,
      user_id: userId,
      data: metadata || {},
    };

    await appendEvent(event);

    // Actualizar sugerencia con conteos
    const suggestions = await loadSuggestions();
    const suggestion = suggestions.find(s => s.suggestion_id === suggestionId);

    if (suggestion) {
      const updates: Partial<CommercialSuggestion> = {};

      if (eventType === 'LINK_CLICKED') {
        updates.clicks = (suggestion.clicks || 0) + 1;
      } else if (eventType === 'REGISTRATION_COMPLETED') {
        updates.registrations = (suggestion.registrations || 0) + 1;
      } else if (eventType === 'PAYMENT_APPROVED') {
        updates.payments = (suggestion.payments || 0) + 1;
      }

      if (Object.keys(updates).length > 0) {
        await updateSuggestion(suggestionId, updates);
      }
    }

    console.log(`[TRACKING] ${eventType} → ${suggestionId}`);
  } catch (error) {
    console.error('[TRACKING] Error registrando evento:', error);
  }
}

// ─── Generar link de tracking ────────────────────────────────────────────────

/**
 * Genera un link con parámetros de tracking que relaciona
 * sugerencia → producto → usuario
 */
export function generateTrackingLink(
  suggestionId: string,
  product: string,
  baseUrl: string = 'https://carvipix.com',
): string {
  const params = new URLSearchParams({
    ref: suggestionId,
    product,
    source: 'telegram',
    ts: Date.now().toString(),
  });

  return `${baseUrl}?${params.toString()}`;
}

// ─── Calcular métricas ───────────────────────────────────────────────────────

export async function calculateMetrics(): Promise<ConversionMetrics> {
  try {
    const suggestions = await loadSuggestions();
    const events = await loadEvents();

    const published = suggestions.filter(s => s.status === 'PUBLISHED');

    let totalClicks = 0;
    let totalRegistrations = 0;
    let totalConversions = 0;
    let totalRevenue = 0;

    const byProduct: Record<string, { clicks: number; registrations: number; conversions: number }> = {};
    const byMomentType: Record<string, { suggestions: number; conversions: number }> = {};
    const byDayOfWeek: Record<number, { suggestions: number; conversions: number }> = {};
    const byMarketCondition: Record<string, { suggestions: number; conversions: number }> = {};

    // Agregar datos por sugerencia
    for (const sugg of published) {
      totalClicks += sugg.clicks || 0;
      totalRegistrations += sugg.registrations || 0;
      totalConversions += sugg.payments || 0;

      const product = sugg.product;
      if (!byProduct[product]) {
        byProduct[product] = { clicks: 0, registrations: 0, conversions: 0 };
      }
      byProduct[product].clicks += sugg.clicks || 0;
      byProduct[product].registrations += sugg.registrations || 0;
      byProduct[product].conversions += sugg.payments || 0;

      // Por tipo de momento (desde metadata)
      const momentType = (sugg.metadata?.moment_type as string) || 'UNKNOWN';
      if (!byMomentType[momentType]) {
        byMomentType[momentType] = { suggestions: 0, conversions: 0 };
      }
      byMomentType[momentType].suggestions += 1;
      byMomentType[momentType].conversions += sugg.payments || 0;

      // Por día de la semana
      const dayOfWeek = new Date(sugg.published_at || sugg.created_at).getDay();
      if (!byDayOfWeek[dayOfWeek]) {
        byDayOfWeek[dayOfWeek] = { suggestions: 0, conversions: 0 };
      }
      byDayOfWeek[dayOfWeek].suggestions += 1;
      byDayOfWeek[dayOfWeek].conversions += sugg.payments || 0;
    }

    // Calcular ratios
    const ctr = totalClicks > 0 ? (totalClicks / published.length) * 100 : 0;
    const registrationRate = totalClicks > 0 ? (totalRegistrations / totalClicks) * 100 : 0;
    const conversionRate = totalRegistrations > 0 ? (totalConversions / totalRegistrations) * 100 : 0;
    const revenuePerPublication = published.length > 0 ? totalRevenue / published.length : 0;

    const metrics: ConversionMetrics = {
      total_moments_detected: 0, // Calcular desde momentos si necesario
      moments_approved: suggestions.filter(s => s.status === 'APPROVED').length,
      moments_published: published.length,

      total_clicks: totalClicks,
      total_registrations: totalRegistrations,
      total_conversions: totalConversions,
      total_revenue: totalRevenue,

      ctr,
      registration_rate: registrationRate,
      conversion_rate: conversionRate,
      revenue_per_publication: revenuePerPublication,

      by_product: byProduct,
      by_moment_type: byMomentType,
      by_day_of_week: byDayOfWeek,
      by_market_condition: byMarketCondition,
    };

    return metrics;
  } catch (error) {
    console.error('[METRICS] Error calculando métricas:', error);
    const currentMetrics = await loadMetrics();
    return currentMetrics;
  }
}

// ─── Actualizar y guardar métricas ──────────────────────────────────────────

export async function updateAndSaveMetrics(): Promise<void> {
  try {
    const metrics = await calculateMetrics();
    await saveMetrics(metrics);
    console.log('[METRICS] ✓ Métricas actualizadas');
  } catch (error) {
    console.error('[METRICS] Error guardando métricas:', error);
  }
}

// ─── Generar reporte de conversión ──────────────────────────────────────────

export async function generateConversionReport(): Promise<{
  summary: string;
  top_converting_products: Array<{ product: string; conversions: number; ctr: number }>;
  top_converting_moments: Array<{ type: string; conversions: number; suggestions: number }>;
  daily_performance: Record<number, { suggestions: number; conversions: number }>;
}> {
  try {
    const metrics = await calculateMetrics();
    const suggestions = await loadSuggestions();

    // Top productos
    const topProducts = Object.entries(metrics.by_product)
      .map(([product, data]) => ({
        product,
        conversions: data.conversions,
        ctr: data.clicks > 0 ? (data.clicks / suggestions.filter(s => s.product === product).length) * 100 : 0,
      }))
      .sort((a, b) => b.conversions - a.conversions)
      .slice(0, 5);

    // Top momentos
    const topMoments = Object.entries(metrics.by_moment_type)
      .map(([type, data]) => ({
        type,
        conversions: data.conversions,
        suggestions: data.suggestions,
      }))
      .sort((a, b) => b.conversions - a.conversions)
      .slice(0, 5);

    const summary = `
📊 REPORTE DE CONVERSIÓN

Total sugerencias publicadas: ${metrics.moments_published}
Clics totales: ${metrics.total_clicks}
Registros: ${metrics.total_registrations}
Conversiones (pagos): ${metrics.total_conversions}

CTR promedio: ${metrics.ctr.toFixed(2)}%
Tasa de registro: ${metrics.registration_rate.toFixed(2)}%
Tasa de conversión: ${metrics.conversion_rate.toFixed(2)}%

Top productos: ${topProducts.map(p => `${p.product} (${p.conversions} conv)`).join(', ')}
Top momentos: ${topMoments.map(m => `${m.type} (${m.conversions} conv)`).join(', ')}
    `.trim();

    return {
      summary,
      top_converting_products: topProducts,
      top_converting_moments: topMoments,
      daily_performance: metrics.by_day_of_week,
    };
  } catch (error) {
    console.error('[REPORT] Error generando reporte:', error);
    return {
      summary: 'Error generando reporte',
      top_converting_products: [],
      top_converting_moments: [],
      daily_performance: {},
    };
  }
}
