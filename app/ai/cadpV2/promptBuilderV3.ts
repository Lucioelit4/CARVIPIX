/**
 * Prompt Builder V3 — Expediente Maestro V3
 * Ensambla el expediente completo en texto para enviar a ChatGPT.
 * 16 secciones de datos + Pregunta Maestra.
 */

import { createHash } from "node:crypto";
import type { ExpedienteMaestroV3 } from "./typesMaestroV3";

export interface PromptV3Assembly {
  prompt_text: string;
  prompt_hash: string;
  prompt_cache_key: string;
  section_order: string[];
  estimated_tokens: number;
}

export interface PromptV3BuildOptions {
  smartExpedientEnabled?: boolean;
}

/** Response schema for ChatGPT — strict JSON */
const RESPONSE_SCHEMA_V3 = JSON.stringify({
  decision: "ENTER_BUY | ENTER_SELL | WAIT | NO_TRADE",
  direction: "BUY | SELL | NEUTRAL",
  horizon: "SHORT | MEDIUM",
  quality: "A_PLUS | A | B | NOT_APPLICABLE",
  confidence: "HIGH | MEDIUM | LOW",
  entry_price: "number | null",
  stop_loss: "number | null",
  take_profit: "number | null",
  risk_reward: "number | null",
  decisive_evidence: ["string (objective evidence that supports decision)"],
  opposing_evidence: ["string (objective evidence against decision)"],
  critical_veto: "string | null",
  missing_condition: "string | null",
  technical_explanation: "string (internal explanation for audit)",
  public_explanation: "string (3-5 lines, client-ready, no promises)",
  master_decision: {
    decision: "ENTER_BUY | ENTER_SELL | WAIT | NO_TRADE",
    direction: "BUY | SELL | NEUTRAL | null",
    strategy_selected: "string | null",
    conviction: "LOW | MEDIUM | HIGH",
    probability_estimated: "number 0-100 | null",
    probability_basis: "string | null",
  },
  analysis_private: {
    analysis_summary: "string (2-4 sentences, objective market description)",
    decisive_evidence: ["string (verifiable facts that determined the decision)"],
    opposing_evidence: ["string (verifiable facts against the decision)"],
    primary_risk: "string",
    missing_condition: "string | null (what is missing to enter, null if NO_TRADE or ENTER)",
    market_context_observed: "string",
    what_must_change: "string (what would need to change to modify the decision)",
    probability_detail: {
      estimated: "number 0-100 | null",
      basis: "string | null",
      confidence_in_estimate: "LOW | MEDIUM | HIGH | null",
      disclaimer: "ANALYTICAL_ESTIMATE_NOT_MATHEMATICAL_PROBABILITY",
    },
  },
  analysis_public: {
    market_visual_state: "MUY_FAVORABLE | FAVORABLE | NEUTRAL | COMPLICADO | ALTO_RIESGO | SIN_MERCADO",
    supporting_facts: ["string (objective facts that justify the visual state, no rules revealed)"],
    public_summary: "string (safe for clients, no proprietary strategy revealed)",
    action_taken: "ENTRY_SIGNALED | WATCHING | NO_ACTION | RISK_BLOCK",
    public_warning: "string | null",
  },
  order_plan: {
    _note: "null if decision is WAIT or NO_TRADE",
    entry_type: "MARKET | LIMIT | STOP",
    entry_price: "number | null",
    entry_zone_min: "number | null",
    entry_zone_max: "number | null",
    stop_loss: "number",
    stop_loss_anchor: "string (structural reference for SL)",
    take_profit: "number",
    take_profit_anchor: "string (structural reference for TP)",
    risk_reward_ratio: "number",
    validity_minutes: "number",
    cancellation_condition: "string",
  },
  adaptive_state: {
    proximity_to_entry: "IMMEDIATE | NEAR | DEVELOPING | FAR | INVALID",
    recheck_minutes: "5 | 10 | 15 | 30 | 60",
    watch_conditions: [{ condition: "string", level: "number | null", timeframe: "H1 | M30 | M5 | null" }],
    wake_up_triggers: [{
      trigger: "NEW_H1_CLOSE | NEW_M30_CLOSE | PRICE_REACHES_LEVEL | NEW_HIGH_IMPACT_NEWS_DETECTED | ATR_SPIKE | PAPER_TRADE_CLOSED",
      level: "number | null",
      description: "string",
    }],
    missing_for_entry: "string | null",
    scenario_classification: "NEW | DEVELOPING | NEAR_ENTRY | READY | ACTIVE | INVALIDATED | EXPIRED | NO_SETUP",
  },
  analyst_observations: {
    summary: "string (2-5 sentences, natural professional language, no proprietary strategy revealed)",
    scenario_narrative: "string (one sentence describing the current scenario moment)",
    key_observation: "string | null (single most important observation, null if none)",
  },
}, null, 2);

const MASTER_QUESTION = `Eres el Analista Principal de CARVIPIX. Analiza exclusivamente el instrumento incluido en este expediente.

Tu función es analizar el expediente real de mercado y encontrar oportunidades técnicamente defendibles que un trader profesional podría ejecutar con una gestión de riesgo responsable.

No debes buscar una operación perfecta.

Tu prioridad es preservar el capital, pero sin caer en una prudencia excesiva que impida aprovechar oportunidades reales.

No operes con miedo ni por impulso. Opera cuando exista evidencia suficiente y no exista un veto técnico crítico.

CARVIPIX trabaja únicamente con operaciones de horizonte corto y medio.
No evalúes operaciones largas ni Swing Trading.
Toda señal debe clasificarse como SHORT o MEDIUM.

Toda decisión debe basarse exclusivamente en los datos reales del expediente generado por CARVIPIX desde la API oficial.
Debes utilizar: OHLC reales, velas cerradas y vigentes, timestamps normalizados, contexto H1, estructura M30 (y M45 solo si existe explícitamente en el expediente), ejecución M5, EMAs e indicadores, volatilidad, zonas técnicas y relación riesgo-beneficio.
No debes inventar precios, velas ni movimientos no presentes.
No utilices imágenes ilustrativas como fuente principal.

Marco de razonamiento:
• H1 define contexto y dirección principal.
• M30 valida estructura y zona.
• M5 valida ejecución.
• EMAs/ADX/ATR son evidencia de apoyo y calidad, no vetos automáticos.
• Soporte/resistencia/ruptura/rechazo/retroceso/impulso son contexto.
• Riesgo-beneficio y Stop Loss técnico son requisitos operativos.

Definición de evidencia suficiente para ENTER_BUY/ENTER_SELL:
1) Existe dirección o hipótesis clara.
2) La estructura intermedia no contradice de manera crítica.
3) M5 ofrece al menos una confirmación principal defendible.
4) Existe Stop Loss técnico que invalida la hipótesis sin quedar dentro de ruido normal.
5) Existe relación riesgo-beneficio adecuada.
6) No existe veto crítico.

No exijas simultáneamente todas las confirmaciones posibles.
Las condiciones ideales aumentan confianza, pero no son obligatorias.
Una condición ideal nunca bloquea por sí sola.
Los conflictos menores reducen calidad/confianza.
Solo un conflicto crítico invalida operación.

Gestión de riesgo:
• Se asume riesgo de 1%-2% del capital por operación.
• No muevas SL arbitrariamente para mejorar R:R.
• Si el SL técnicamente válido es demasiado amplio para SHORT/MEDIUM, responde NO_TRADE.

Decisiones permitidas:
• ENTER_BUY
• ENTER_SELL
• WAIT
• NO_TRADE

Reglas de decisión:
• ENTER_BUY/ENTER_SELL: usar cuando la operación sea defendible ahora, aunque no perfecta.
• WAIT: solo si existe oportunidad potencial y falta condición concreta/cercana; debes indicar exactamente qué confirmación, en qué temporalidad, en qué nivel/zona y qué cambiaría decisión.
• NO_TRADE: solo con veto crítico (datos incompletos/obsoletos, mercado cerrado, noticia crítica inmediata, costo anormal, estructura caótica, R:R insuficiente, SL inválido o demasiado amplio, entrada demasiado extendida, conflicto crítico).

Contrato obligatorio:
• decision, direction, horizon, quality, confidence
• entry_price, stop_loss, take_profit, risk_reward
• decisive_evidence, opposing_evidence
• critical_veto, missing_condition
• technical_explanation, public_explanation

Reglas de contrato:
• BUY/SELL requieren entrada, SL, TP y R:R válidos.
• WAIT requiere missing_condition concreta.
• NO_TRADE requiere critical_veto.
• public_explanation siempre obligatoria (3-5 líneas, profesional, sin promesas).
• horizon solo SHORT o MEDIUM.

Política obligatoria de comunicación pública (public_explanation y analysis_public):
• Habla siempre como CARVIPIX.
• Usa formulaciones como: "CARVIPIX detecta...", "El análisis de CARVIPIX muestra...", "CARVIPIX mantiene este escenario en observación...".
• Explica brevemente por qué existe o no existe entrada, sin razonamiento interno completo.
• No menciones ChatGPT, OpenAI, inteligencia artificial, API, proveedores de datos, prompts, modelos, indicadores internos, módulos, validadores, arquitectura o fuentes técnicas.
• Mantén lenguaje profesional, claro y útil para cliente final.

Responde ÚNICAMENTE en el formato JSON solicitado por CARVIPIX. No incluyas texto fuera del esquema.`;

function serializeSection(title: string, content: unknown): string {
  const body = typeof content === "string" ? content : JSON.stringify(content, null, 2);
  return `\n### ${title}\n${body}`;
}

function estimateTokens(text: string): number {
  // Rough approximation: ~4 chars per token
  return Math.ceil(text.length / 4);
}

export class MaestroV3PromptBuilder {
  build(expediente: ExpedienteMaestroV3, options?: PromptV3BuildOptions): PromptV3Assembly {
    if (options?.smartExpedientEnabled) {
      return this.buildSmart(expediente);
    }

    const sections: Array<{ title: string; content: unknown }> = [
      { title: "1. Identidad y trazabilidad", content: expediente.identity },
      { title: "2. Calidad del expediente", content: expediente.quality },
      { title: "3. Pre-análisis (hechos de cambio)", content: expediente.pre_analysis_trigger },
      { title: "4. Contexto anterior (memoria del escenario)", content: expediente.previous_context },
      { title: "5. Cambios desde análisis anterior (delta objetivo)", content: expediente.delta },
      { title: "6. Mercado H1 — datos objetivos", content: expediente.market_h1 },
      { title: "7. Mercado M30 — datos objetivos", content: expediente.market_m30 },
      { title: "8. Mercado M5 — datos objetivos (gatillo)", content: expediente.market_m5 },
      { title: "9. Coherencia multi-temporalidad", content: expediente.multi_timeframe },
      { title: "10. Volatilidad y sesión", content: expediente.volatility_and_session },
      { title: "11. Noticias y riesgo fundamental", content: expediente.news_and_risk },
      { title: "12. Contexto histórico (referencia estadística)", content: expediente.historical_context },
      { title: "13. Contexto visual", content: expediente.visual_context },
      { title: "14. Estrategias autorizadas", content: expediente.authorized_strategies },
      { title: "15. Contexto narrativo objetivo", content: this.buildNarrativeText(expediente.narrative_context) },
      { title: "16. Resumen ejecutivo del expediente", content: this.buildSummaryText(expediente.executive_summary) },
    ];

    const dataSections = sections.map(s => serializeSection(s.title, s.content)).join("\n");

    const prompt_text = [
      "# EXPEDIENTE MAESTRO CARVIPIX V3",
      `# Instrumento: ${expediente.identity.canonical_symbol} | Análisis: ${expediente.identity.analysis_id}`,
      `# Versión: ${expediente.identity.version_expediente} | Modelo: ${expediente.identity.model_openai}`,
      "",
      dataSections,
      "",
      "---",
      "",
      "### Esquema JSON oficial de respuesta",
      RESPONSE_SCHEMA_V3,
      "",
      "---",
      "",
      "### PREGUNTA MAESTRA",
      MASTER_QUESTION,
    ].join("\n");

    const prompt_hash = createHash("sha256").update(prompt_text).digest("hex");

    // Cache key: only static parts (strategies, schema, question — not candle data)
    const staticPart = [
      expediente.identity.version_expediente,
      expediente.identity.version_prompt,
      JSON.stringify(expediente.authorized_strategies),
      RESPONSE_SCHEMA_V3,
      MASTER_QUESTION,
    ].join("|");
    const prompt_cache_key = createHash("sha256").update(staticPart).digest("hex");

    return {
      prompt_text,
      prompt_hash,
      prompt_cache_key,
      section_order: sections.map(s => s.title),
      estimated_tokens: estimateTokens(prompt_text),
    };
  }

  private buildSmart(expediente: ExpedienteMaestroV3): PromptV3Assembly {
    const stableContext = {
      symbol: expediente.identity.canonical_symbol,
      trend_h1: expediente.multi_timeframe.structure_direction.h1,
      trend_m30: expediente.multi_timeframe.structure_direction.m30,
      zones_h1: {
        support: expediente.market_h1.support_zones.slice(-2),
        resistance: expediente.market_h1.resistance_zones.slice(-2),
      },
      zones_m30: {
        support: expediente.market_m30.support_zones.slice(-2),
        resistance: expediente.market_m30.resistance_zones.slice(-2),
      },
      previous_decision: expediente.previous_context.previous_decision,
      previous_state: expediente.previous_context.previous_scenario_state,
    };

    const changes = {
      trigger_reason: expediente.pre_analysis_trigger.trigger_reason,
      description: expediente.pre_analysis_trigger.change_description,
      delta: expediente.delta,
    };

    const indispensableState = {
      quality: expediente.quality,
      market_h1: {
        ema20: expediente.market_h1.ema20,
        ema50: expediente.market_h1.ema50,
        ema200: expediente.market_h1.ema200,
        atr: expediente.market_h1.atr,
        adx: expediente.market_h1.adx,
        last_closed: expediente.market_h1.closed_candles.slice(-8),
      },
      market_m30: {
        ema20: expediente.market_m30.ema20,
        ema50: expediente.market_m30.ema50,
        ema200: expediente.market_m30.ema200,
        atr: expediente.market_m30.atr,
        adx: expediente.market_m30.adx,
        last_closed: expediente.market_m30.closed_candles.slice(-8),
      },
      market_m5: {
        ema20: expediente.market_m5.ema20,
        ema50: expediente.market_m5.ema50,
        ema200: expediente.market_m5.ema200,
        atr: expediente.market_m5.atr,
        adx: expediente.market_m5.adx,
        mid_price: expediente.market_m5.mid_price,
        last_closed: expediente.market_m5.closed_candles.slice(-12),
      },
      volatility_and_session: expediente.volatility_and_session,
      news_and_risk: expediente.news_and_risk,
      authorized_strategies: expediente.authorized_strategies,
    };

    const sections: Array<{ title: string; content: unknown }> = [
      { title: "1. Identidad y trazabilidad", content: expediente.identity },
      { title: "2. Contexto estable", content: stableContext },
      { title: "3. Cambios nuevos", content: changes },
      { title: "4. Estado actual indispensable", content: indispensableState },
      { title: "5. Resumen ejecutivo", content: this.buildSummaryText(expediente.executive_summary) },
    ];

    const dataSections = sections.map((s) => serializeSection(s.title, s.content)).join("\n");

    const prompt_text = [
      "# EXPEDIENTE MAESTRO CARVIPIX V3 (SMART)",
      `# Instrumento: ${expediente.identity.canonical_symbol} | Análisis: ${expediente.identity.analysis_id}`,
      `# Versión: ${expediente.identity.version_expediente} | Modelo: ${expediente.identity.model_openai}`,
      "",
      dataSections,
      "",
      "---",
      "",
      "### Esquema JSON oficial de respuesta",
      RESPONSE_SCHEMA_V3,
      "",
      "---",
      "",
      "### PREGUNTA MAESTRA",
      MASTER_QUESTION,
      "",
      "NOTA: Reevaluar por cambio material detectado. No asumas datos externos ni memoria fuera del expediente.",
    ].join("\n");

    const prompt_hash = createHash("sha256").update(prompt_text).digest("hex");
    const staticPart = [
      "SMART",
      expediente.identity.version_expediente,
      expediente.identity.version_prompt,
      JSON.stringify(expediente.authorized_strategies),
      RESPONSE_SCHEMA_V3,
      MASTER_QUESTION,
    ].join("|");
    const prompt_cache_key = createHash("sha256").update(staticPart).digest("hex");

    return {
      prompt_text,
      prompt_hash,
      prompt_cache_key,
      section_order: sections.map((s) => s.title),
      estimated_tokens: estimateTokens(prompt_text),
    };
  }

  private buildNarrativeText(n: ExpedienteMaestroV3["narrative_context"]): string {
    return [
      n.price_situation,
      n.h1_facts,
      n.m30_facts,
      n.m5_facts,
      n.session_and_volatility_facts,
      n.news_facts,
      n.delta_facts,
      n.previous_expectation ?? "",
    ].filter(Boolean).join("\n\n");
  }

  private buildSummaryText(s: ExpedienteMaestroV3["executive_summary"]): string {
    const lines: string[] = [
      s.one_line,
      "",
      `Datos disponibles: H1 (${s.data_inventory.h1_candles_closed} velas), M30 (${s.data_inventory.m30_candles_closed} velas), M5 (${s.data_inventory.m5_candles_closed} velas), indicadores ${s.data_inventory.indicators_available ? "completos" : "incompletos"}, ${s.data_inventory.news_events_count} eventos de noticias, análisis anterior ${s.data_inventory.previous_analysis_exists ? "disponible" : "no disponible"}. Contexto visual ${s.data_inventory.visual_context_included ? "incluido" : "desactivado"}. Muestra histórica: ${s.data_inventory.historical_sample_size} análisis.`,
      "",
    ];

    if (s.attention_items.length > 0) {
      lines.push("Atención:");
      s.attention_items.forEach((item, i) => lines.push(`(${i + 1}) ${item}`));
    }

    if (s.missing_items.length > 0) {
      lines.push("");
      lines.push(`No disponible: ${s.missing_items.join(" / ")}`);
    }

    return lines.join("\n");
  }
}
