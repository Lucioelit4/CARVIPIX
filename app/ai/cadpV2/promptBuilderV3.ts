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

/** Response schema for ChatGPT — strict JSON */
const RESPONSE_SCHEMA_V3 = JSON.stringify({
  master_decision: {
    decision: "ENTER_BUY | ENTER_SELL | WAIT | CONDITIONAL_ENTRY | NO_TRADE | ENTRY_MISSED | DATA_INSUFFICIENT | NEWS_VERIFICATION_REQUIRED",
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
    _note: "null if decision is not ENTER_BUY, ENTER_SELL, or CONDITIONAL_ENTRY",
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

Cada afirmación debe basarse en la información comprobada proporcionada. Nunca inventes datos, precios, noticias ni niveles que no estén en el expediente.

Usa conjuntamente:
• Contexto actual + delta desde análisis anterior
• Mercado general (H1) 
• Estructura intermedia (M30)
• Gatillo (M5)
• Coherencia multi-temporalidad
• Volatilidad, liquidez, sesión
• Noticias y riesgos
• Validez temporal del escenario
• Resumen ejecutivo

Integra todo esto como UN ÚNICO análisis coherente. No evalúes cada elemento por separado.

Si CARVIPIX_MAESTRO_DISCRETIONARY_V1 aparece en las estrategias autorizadas, tienes autorización para aprobar ENTER_BUY o ENTER_SELL basándote en el expediente completo. NO_TRADE no es la respuesta predeterminada: úsala solamente cuando tu análisis determine que no existe una entrada válida o que el riesgo la invalida.

Tu pregunta: ¿Existe una entrada válida AHORA? ¿El escenario se aproxima? ¿Continúa desarrollándose? ¿Debe rechazarse?

Si existe entrada: Entrega una señal vigente, defendible y completa.
Si falta una condición: Indica exactamente cuál.
Si el escenario es inválido o datos insuficientes: Recházalo claramente.

Explica brevemente qué factores fueron decisivos, cuál es el riesgo principal y qué tendría que cambiar para modificar tu decisión.

probability_estimated representa tu evaluación analítica de qué tan sólida es la confluencia de factores observados. No es una garantía de resultado. Basa el número en la evidencia del expediente, no en tu entrenamiento previo de otros mercados.

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
  build(expediente: ExpedienteMaestroV3): PromptV3Assembly {
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
      "### Pregunta Maestra",
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
