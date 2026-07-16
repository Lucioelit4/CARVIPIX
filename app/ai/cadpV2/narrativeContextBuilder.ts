/**
 * Narrative Context Builder — Sección 15 del Expediente Maestro V3
 * Construye el contexto narrativo objetivo a partir de los datos de las Secciones 1-14.
 * REGLA: Solo hechos verificables. Sin conclusiones. Sin recomendaciones.
 */

import type {
  ExpedienteMaestroV3,
  NarrativeContext,
} from "./typesMaestroV3";

function fmt(n: number, dec = 2): string {
  return n.toFixed(dec);
}

function fmtPips(pips: number, dec = 1): string {
  return `${pips.toFixed(dec)} pips`;
}

function emaOrderFacts(
  ema20: number,
  ema50: number,
  ema200: number,
  price: number,
): string {
  const parts: string[] = [];
  if (ema20 > ema50) parts.push(`EMA20 > EMA50`);
  else parts.push(`EMA20 < EMA50`);
  if (ema50 > ema200) parts.push(`EMA50 > EMA200`);
  else parts.push(`EMA50 < EMA200`);
  if (price > ema200) parts.push(`precio por encima de EMA200`);
  else parts.push(`precio por debajo de EMA200`);
  return parts.join(", ");
}

function structureFacts(highs: number[], lows: number[], hhCount: number, llCount: number): string {
  const facts: string[] = [];
  if (highs.length >= 3) {
    facts.push(`Últimos 5 máximos: ${highs.slice(-5).map(h => fmt(h)).join(" / ")}`);
  }
  if (lows.length >= 3) {
    facts.push(`Últimos 5 mínimos: ${lows.slice(-5).map(l => fmt(l)).join(" / ")}`);
  }
  if (hhCount > 0) facts.push(`${hhCount} máximos consecutivos ascendentes`);
  if (llCount > 0) facts.push(`${llCount} mínimos consecutivos descendentes`);
  return facts.join(". ");
}

export class NarrativeContextBuilder {
  build(expediente: Omit<ExpedienteMaestroV3, "narrative_context" | "executive_summary">): NarrativeContext {
    const { identity, market_h1, market_m30, market_m5, volatility_and_session, news_and_risk, delta, previous_context } = expediente;

    const midPrice = market_m5.mid_price;
    const symbol = identity.canonical_symbol;
    const snapIso = identity.timestamp_iso;

    // ── Price situation
    const lastM5 = market_m5.last_closed_candle;
    const lastH1 = market_h1.closed_candles.at(-1);
    const lastM30 = market_m30.closed_candles.at(-1);

    const price_situation = [
      `El precio de ${symbol} en el snapshot ${snapIso} es ${fmt(midPrice)}.`,
      lastM5
        ? `Última vela M5 cerrada: open ${fmt(lastM5.open)} | close ${fmt(lastM5.close)} | cuerpo ${fmt(lastM5.body_pips)} pips | dirección ${lastM5.direction}.`
        : "Sin vela M5 cerrada disponible.",
      lastH1
        ? `Última vela H1 cerrada: close ${fmt(lastH1.close)} (timestamp ${new Date(lastH1.timestamp).toISOString()}).`
        : "Sin vela H1 cerrada disponible.",
      lastM30
        ? `Última vela M30 cerrada: close ${fmt(lastM30.close)} (timestamp ${new Date(lastM30.timestamp).toISOString()}).`
        : "Sin vela M30 cerrada disponible.",
    ].filter(Boolean).join(" ");

    // ── H1 facts
    const h1_facts = [
      `En H1: EMA20=${fmt(market_h1.ema20)} | EMA50=${fmt(market_h1.ema50)} | EMA200=${fmt(market_h1.ema200)}.`,
      emaOrderFacts(market_h1.ema20, market_h1.ema50, market_h1.ema200, midPrice) + ".",
      `ADX H1=${fmt(market_h1.adx, 1)}. ATR H1=${fmt(market_h1.atr)} (percentil ${market_h1.volatility_percentile}).`,
      structureFacts(market_h1.structural_highs, market_h1.structural_lows, market_h1.consecutive_higher_highs, market_h1.consecutive_lower_lows),
      market_h1.anomalies.length > 0 ? `Anomalías H1: ${market_h1.anomalies.join("; ")}.` : "",
    ].filter(Boolean).join(" ");

    // ── M30 facts
    const nearestSupportM30 = market_m30.support_zones.at(-1);
    const nearestResistanceM30 = market_m30.resistance_zones.at(-1);

    const m30_facts = [
      `En M30: EMA20=${fmt(market_m30.ema20)} | EMA50=${fmt(market_m30.ema50)} | EMA200=${fmt(market_m30.ema200)}.`,
      `Precio ${midPrice > market_m30.ema20 ? "por encima de EMA20 M30" : "por debajo de EMA20 M30"}.`,
      `ADX M30=${fmt(market_m30.adx, 1)}. ATR M30=${fmt(market_m30.atr)}.`,
      market_m30.consecutive_compressed_candles > 0
        ? `${market_m30.consecutive_compressed_candles} velas en compresión consecutiva.`
        : "",
      market_m30.retrace_from_impulse.current_retrace_pct !== null
        ? `Retroceso desde último impulso: ${fmt(market_m30.retrace_from_impulse.current_retrace_pct, 1)}%.`
        : "",
      nearestSupportM30 !== undefined
        ? `Distancia a soporte M30 más cercano (${fmt(nearestSupportM30)}): ${fmtPips(market_m30.distance_to_nearest_support_pips)}.`
        : "",
      nearestResistanceM30 !== undefined
        ? `Distancia a resistencia M30 más cercana (${fmt(nearestResistanceM30)}): ${fmtPips(market_m30.distance_to_nearest_resistance_pips)}.`
        : "",
    ].filter(Boolean).join(" ");

    // ── M5 facts
    const nearestResistanceH1 = market_h1.resistance_zones.at(-1);

    const m5_facts = [
      `En M5: EMA20=${fmt(market_m5.ema20)} | EMA50=${fmt(market_m5.ema50)} | EMA200=${fmt(market_m5.ema200)}.`,
      `ADX M5=${fmt(market_m5.adx, 1)}. ATR M5=${fmt(market_m5.atr)}.`,
      market_m5.spread_pips !== null
        ? `Spread: ${fmtPips(market_m5.spread_pips)}.`
        : "Spread no disponible (NOT_BROKER_VERIFIED).",
      `Precio vs soporte M30: ${fmtPips(market_m5.price_vs_m30_support_pips)}.`,
      nearestResistanceH1 !== undefined
        ? `Precio vs resistencia H1 más cercana (${fmt(nearestResistanceH1)}): ${fmtPips(market_m5.price_vs_h1_resistance_pips)}.`
        : "",
    ].filter(Boolean).join(" ");

    // ── Session and volatility facts
    const session_and_volatility_facts = [
      `Sesión actual: ${volatility_and_session.session_current}.`,
      volatility_and_session.session_overlap ? "Overlap de sesiones activo." : "",
      volatility_and_session.is_transition_period ? "Período de transición de sesión." : "",
      `Tiempo restante en sesión: ${volatility_and_session.minutes_to_session_end} minutos.`,
      `ATR M5 percentil ${fmt(volatility_and_session.atr_h1_percentile, 0)} vs. histórico H1.`,
      volatility_and_session.paper_spread_note === "NOT_BROKER_VERIFIED"
        ? "Spread del broker no disponible (NOT_BROKER_VERIFIED)."
        : `Spread disponible del broker.`,
      `Mantenimiento diario en ${volatility_and_session.minutes_to_daily_maintenance} minutos.`,
    ].filter(Boolean).join(" ");

    // ── News facts
    let news_facts: string;
    if (news_and_risk.events.length === 0) {
      news_facts = news_and_risk.no_events_note
        ?? `Sin eventos HIGH/MEDIUM detectados en las próximas 4 horas vía Finnhub (última consulta: ${news_and_risk.last_refresh_iso}).`;
    } else {
      const highMedium = news_and_risk.events.filter(e => e.impact === "HIGH" || e.impact === "MEDIUM");
      const eventLines = highMedium.slice(0, 3).map(
        e => `${e.event_name} — ${e.minutes_to_event} minutos (${e.scheduled_iso}, impacto ${e.impact}, relevancia ${e.relevance_to_canonical_symbol} para ${symbol})`
      );
      news_facts = `${highMedium.length} eventos HIGH/MEDIUM detectados vía Finnhub REST. ${eventLines.join(". ")}.`;
      if (news_and_risk.events_within_operation_window.length > 0) {
        news_facts += ` ${news_and_risk.events_within_operation_window.length} evento(s) dentro de la vida estimada de una operación intraday.`;
      }
    }

    // ── Delta facts
    const changedParts: string[] = [];
    if (delta.new_closed_candle.H1) changedParts.push("Nueva vela H1 cerrada.");
    if (delta.new_closed_candle.M30) changedParts.push("Nueva vela M30 cerrada.");
    if (delta.new_closed_candle.M5) changedParts.push("Nueva vela M5 cerrada.");
    if (delta.new_high_detected.detected)
      changedParts.push(`Nuevo máximo ${delta.new_high_detected.timeframe} en ${fmt(delta.new_high_detected.level ?? 0)}.`);
    if (delta.new_low_detected.detected)
      changedParts.push(`Nuevo mínimo ${delta.new_low_detected.timeframe} en ${fmt(delta.new_low_detected.level ?? 0)}.`);
    if (delta.break_detected.detected)
      changedParts.push(`Ruptura detectada en ${delta.break_detected.timeframe} — ${delta.break_detected.direction} nivel ${fmt(delta.break_detected.broken_level ?? 0)}.`);
    if (delta.zone_reached.detected)
      changedParts.push(`Precio llegó a zona ${delta.zone_reached.zone_type} en ${delta.zone_reached.timeframe} (nivel ${fmt(delta.zone_reached.zone_level ?? 0)}).`);
    if (delta.new_news_event.detected)
      changedParts.push(`Nueva noticia detectada: ${delta.new_news_event.event_name} (impacto ${delta.new_news_event.impact}, en ${delta.new_news_event.minutes_to} min).`);
    if (delta.atr_change.change_pct !== null && Math.abs(delta.atr_change.change_pct) >= 15)
      changedParts.push(`ATR cambió ${fmt(delta.atr_change.change_pct, 1)}% (anterior: ${fmt(delta.atr_change.previous ?? 0)}, actual: ${fmt(delta.atr_change.current ?? 0)}).`);
    if (delta.session_changed)
      changedParts.push(`Cambio de sesión: ${delta.session_previous} → ${delta.session_current}.`);

    const minutesSince = previous_context.minutes_since_previous;
    const header = previous_context.exists && minutesSince !== null
      ? `Cambios desde el análisis anterior (hace ${minutesSince} minutos):`
      : "Sin análisis anterior previo:";

    const conditionLine = delta.previous_condition_met.met
      ? `Condición de vigilancia anterior ("${delta.previous_condition_met.original_condition}"): CUMPLIDA. Evidencia: ${delta.previous_condition_met.evidence}.`
      : (previous_context.previous_vigilance?.condition_described
        ? `Condición de vigilancia anterior ("${previous_context.previous_vigilance.condition_described}"): AÚN NO CUMPLIDA.`
        : "");

    const delta_facts = [
      header,
      changedParts.length > 0 ? changedParts.join(" ") : "Sin cambios relevantes detectados.",
      conditionLine,
    ].filter(Boolean).join(" ");

    // ── Previous expectation
    let previous_expectation: string | null = null;
    if (previous_context.exists && previous_context.previous_vigilance?.condition_described) {
      const prevTs = previous_context.previous_timestamp_iso ?? "análisis anterior";
      const prevDec = previous_context.previous_decision ?? "UNKNOWN";
      const condition = previous_context.previous_vigilance.condition_described;
      const watchAbove = previous_context.previous_vigilance.level_watch_break_above;
      const watchBelow = previous_context.previous_vigilance.level_watch_break_below;
      const recheck = previous_context.previous_vigilance.expected_recheck_minutes;

      previous_expectation = [
        `El análisis anterior (${prevTs}, decisión ${prevDec}) indicó:`,
        `Condición pendiente: "${condition}".`,
        watchAbove !== null ? `Nivel a romper al alza: ${fmt(watchAbove)}.` : "",
        watchBelow !== null ? `Nivel a no perder: ${fmt(watchBelow)}.` : "",
        recheck !== null ? `Revisión programada: ${recheck} minutos.` : "",
      ].filter(Boolean).join(" ");
    }

    return {
      price_situation,
      h1_facts,
      m30_facts,
      m5_facts,
      session_and_volatility_facts,
      news_facts,
      delta_facts,
      previous_expectation,
    };
  }
}
