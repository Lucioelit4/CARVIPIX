/**
 * Executive Summary Builder — Sección 16 del Expediente Maestro V3
 * Resumen ejecutivo antes de la Pregunta Maestra.
 * Solo hechos medibles. Sin calificaciones. Sin "lo que esto significa".
 */

import type { ExpedienteMaestroV3, ExecutiveSummary } from "./typesMaestroV3";

export class ExecutiveSummaryBuilder {
  build(expediente: Omit<ExpedienteMaestroV3, "executive_summary">): ExecutiveSummary {
    const {
      identity,
      market_h1,
      market_m30,
      market_m5,
      news_and_risk,
      previous_context,
      visual_context,
      historical_context,
      delta,
    } = expediente;

    const h1Closed = market_h1.closed_candles.filter(c => c.complete).length;
    const m30Closed = market_m30.closed_candles.filter(c => c.complete).length;
    const m5Closed = market_m5.closed_candles.filter(c => c.complete).length;

    const indicatorsOk =
      market_h1.ema20 > 0 && market_h1.ema200 > 0 && market_h1.atr > 0;

    // ── One-line summary
    const lifetimeLabel = previous_context.scenario_lifetime.lifetime_label;
    const conditionMet = delta.previous_condition_met.met ? "Condición anterior cumplida" : "";
    const newsCount = news_and_risk.events.filter(e => e.impact === "HIGH" || e.impact === "MEDIUM").length;

    const parts = [
      `${identity.canonical_symbol}`,
      identity.timestamp_iso,
      identity.session_primary,
      lifetimeLabel,
      conditionMet,
      newsCount > 0 ? `${newsCount} noticia(s) HIGH/MEDIUM próxima(s)` : "",
    ].filter(Boolean);

    const one_line = parts.join(" | ");

    // ── Data inventory
    const data_inventory: ExecutiveSummary["data_inventory"] = {
      h1_candles_closed: h1Closed,
      m30_candles_closed: m30Closed,
      m5_candles_closed: m5Closed,
      indicators_available: indicatorsOk,
      news_events_count: news_and_risk.events.length,
      previous_analysis_exists: previous_context.exists,
      visual_context_included: visual_context.enabled && visual_context.images.some(i => i.included_in_payload),
      historical_sample_size: historical_context.data ? historical_context.eligibility_conditions.sample_size : 0,
    };

    // ── Attention items (solo hechos medibles que destaquen por su naturaleza)
    const attention_items: string[] = [];

    // News within operation window
    if (news_and_risk.events_within_operation_window.length > 0) {
      const highImpact = news_and_risk.events_within_operation_window.filter(e => e.impact === "HIGH");
      if (highImpact.length > 0) {
        attention_items.push(
          `Evento HIGH impact (${highImpact[0].event_name}) en ${highImpact[0].minutes_to} minutos — dentro de la vida estimada de una operación intraday.`
        );
      }
    }

    // Previous condition met
    if (delta.previous_condition_met.met) {
      attention_items.push(`Condición de vigilancia del análisis anterior: CUMPLIDA. ${delta.previous_condition_met.evidence ?? ""}`);
    }

    // Price near resistance H1
    if (market_m5.price_vs_h1_resistance_pips < market_h1.atr * 0.5) {
      const nearest = market_h1.resistance_zones.at(-1);
      if (nearest !== undefined) {
        attention_items.push(
          `Precio a ${market_m5.price_vs_h1_resistance_pips.toFixed(1)} pips de resistencia H1 más cercana (${nearest.toFixed(2)}).`
        );
      }
    }

    // Price near support H1
    if (market_m5.price_vs_h1_support_pips < market_h1.atr * 0.5) {
      const nearest = market_h1.support_zones.at(-1);
      if (nearest !== undefined) {
        attention_items.push(
          `Precio a ${market_m5.price_vs_h1_support_pips.toFixed(1)} pips de soporte H1 más cercano (${nearest.toFixed(2)}).`
        );
      }
    }

    // Break detected
    if (delta.break_detected.detected) {
      attention_items.push(
        `Ruptura detectada en ${delta.break_detected.timeframe} — ${delta.break_detected.direction} nivel ${(delta.break_detected.broken_level ?? 0).toFixed(2)}.`
      );
    }

    // Consecutive bullish M5 candles
    const m5Closed48 = market_m5.closed_candles.filter(c => c.complete);
    let consecutiveBullish = 0;
    for (let i = m5Closed48.length - 1; i >= 0; i--) {
      if (m5Closed48[i].close > m5Closed48[i].open) consecutiveBullish++;
      else break;
    }
    let consecutiveBearish = 0;
    for (let i = m5Closed48.length - 1; i >= 0; i--) {
      if (m5Closed48[i].close < m5Closed48[i].open) consecutiveBearish++;
      else break;
    }
    if (consecutiveBullish >= 5) {
      attention_items.push(`${consecutiveBullish} velas M5 consecutivas alcistas.`);
    } else if (consecutiveBearish >= 5) {
      attention_items.push(`${consecutiveBearish} velas M5 consecutivas bajistas.`);
    }

    // Extended scenario
    if (previous_context.scenario_lifetime.is_extended) {
      attention_items.push(`Escenario activo hace más de 3 horas sin resolución.`);
    }

    // High ATR percentile
    if (market_h1.volatility_percentile >= 85) {
      attention_items.push(`ATR H1 en percentil ${market_h1.volatility_percentile} — volatilidad inusualmente alta.`);
    }

    // ── Missing items
    const missing_items: string[] = [];

    if (!indicatorsOk) missing_items.push("Indicadores incompletos (EMA/ATR no disponibles).");
    if (market_m5.spread_pips === null) missing_items.push("Spread real del broker no disponible (NOT_BROKER_VERIFIED).");
    if (!visual_context.enabled) missing_items.push("Contexto visual desactivado (AI_VISUAL_CONTEXT_ENABLED=false).");
    if (!historical_context.eligible) {
      if (historical_context.eligibility_conditions.sample_size < 10) {
        missing_items.push(`Historial estadístico insuficiente (muestra: ${historical_context.eligibility_conditions.sample_size}, mínimo: 10).`);
      } else {
        missing_items.push("Historial estadístico no elegible (instrumento/estrategia/prompt distintos).");
      }
    }
    if (news_and_risk.events.length === 0) {
      missing_items.push("Sin eventos de noticias disponibles de Finnhub.");
    }

    return { one_line, data_inventory, attention_items, missing_items };
  }
}
