/**
 * Verifier V3 — Valida la Respuesta Maestra de ChatGPT
 * Verifica que el JSON recibido cumple el esquema de la Respuesta Maestra V3.
 */

import type { RespuestaMaestraV3, CadpDecisionV3, ProximityToEntry } from "./typesMaestroV3";

export interface VerifierV3Result {
  valid: boolean;
  errors: string[];
  repaired: RespuestaMaestraV3 | null;
}

const VALID_DECISIONS = new Set<CadpDecisionV3>([
  "ENTER_BUY", "ENTER_SELL", "WAIT", "CONDITIONAL_ENTRY",
  "NO_TRADE", "ENTRY_MISSED", "DATA_INSUFFICIENT", "NEWS_VERIFICATION_REQUIRED",
]);

const VALID_PROXIMITY = new Set<ProximityToEntry>(["IMMEDIATE", "NEAR", "DEVELOPING", "FAR", "INVALID"]);
const VALID_RECHECK = new Set([5, 10, 15, 30, 60]);
const VALID_VISUAL_STATE = new Set(["MUY_FAVORABLE", "FAVORABLE", "NEUTRAL", "COMPLICADO", "ALTO_RIESGO", "SIN_MERCADO"]);
const VALID_SCENARIO = new Set(["NEW", "DEVELOPING", "NEAR_ENTRY", "READY", "ACTIVE", "INVALIDATED", "EXPIRED", "NO_SETUP"]);
const VALID_CONVICTION = new Set(["LOW", "MEDIUM", "HIGH"]);

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isStringOrNull(v: unknown): boolean {
  return typeof v === "string" || v === null;
}

function isNumberOrNull(v: unknown): boolean {
  return typeof v === "number" || v === null;
}

export class MaestroV3Verifier {
  verify(raw: unknown, authorizedStrategyIds?: ReadonlySet<string>): VerifierV3Result {
    const errors: string[] = [];

    if (!isObject(raw)) {
      return { valid: false, errors: ["RESPONSE_NOT_OBJECT"], repaired: null };
    }

    // ── Bloque 1: master_decision
    if (!isObject(raw["master_decision"])) {
      errors.push("MISSING_BLOCK:master_decision");
    } else {
      const md = raw["master_decision"] as Record<string, unknown>;
      if (!VALID_DECISIONS.has(md["decision"] as CadpDecisionV3)) {
        errors.push(`INVALID_DECISION:${String(md["decision"])}`);
      }
      if (!VALID_CONVICTION.has(md["conviction"] as string)) {
        errors.push(`INVALID_CONVICTION:${String(md["conviction"])}`);
      }
      const prob = md["probability_estimated"];
      if (prob !== null && (typeof prob !== "number" || prob < 0 || prob > 100)) {
        errors.push("INVALID_PROBABILITY_RANGE");
      }
      const strategySelected = md["strategy_selected"];
      if (
        authorizedStrategyIds
        && typeof strategySelected === "string"
        && !authorizedStrategyIds.has(strategySelected)
      ) {
        errors.push(`UNAUTHORIZED_STRATEGY:${strategySelected}`);
      }
    }

    // ── Bloque 2: analysis_private
    if (!isObject(raw["analysis_private"])) {
      errors.push("MISSING_BLOCK:analysis_private");
    } else {
      const ap = raw["analysis_private"] as Record<string, unknown>;
      if (typeof ap["analysis_summary"] !== "string") errors.push("MISSING_FIELD:analysis_private.analysis_summary");
      if (!Array.isArray(ap["decisive_evidence"])) errors.push("MISSING_FIELD:analysis_private.decisive_evidence");
      if (!Array.isArray(ap["opposing_evidence"])) errors.push("MISSING_FIELD:analysis_private.opposing_evidence");
      if (typeof ap["primary_risk"] !== "string") errors.push("MISSING_FIELD:analysis_private.primary_risk");
      if (!isStringOrNull(ap["missing_condition"])) errors.push("INVALID_FIELD:analysis_private.missing_condition");
    }

    // ── Bloque 3: analysis_public
    if (!isObject(raw["analysis_public"])) {
      errors.push("MISSING_BLOCK:analysis_public");
    } else {
      const pub = raw["analysis_public"] as Record<string, unknown>;
      if (!VALID_VISUAL_STATE.has(pub["market_visual_state"] as string)) {
        errors.push(`INVALID_VISUAL_STATE:${String(pub["market_visual_state"])}`);
      }
      if (typeof pub["public_summary"] !== "string") errors.push("MISSING_FIELD:analysis_public.public_summary");
    }

    // ── Bloque 4: order_plan — can be null for non-entry decisions
    const decision = isObject(raw["master_decision"])
      ? (raw["master_decision"] as Record<string, unknown>)["decision"] as string
      : "";

    const requiresOrderPlan = decision === "ENTER_BUY" || decision === "ENTER_SELL" || decision === "CONDITIONAL_ENTRY";

    if (requiresOrderPlan) {
      if (!isObject(raw["order_plan"])) {
        errors.push("MISSING_BLOCK:order_plan (required for ENTER/CONDITIONAL)");
      } else {
        const op = raw["order_plan"] as Record<string, unknown>;
        if (!isNumberOrNull(op["stop_loss"])) errors.push("MISSING_FIELD:order_plan.stop_loss");
        if (!isNumberOrNull(op["take_profit"])) errors.push("MISSING_FIELD:order_plan.take_profit");
        if (isObject(raw["master_decision"])) {
          const dir = (raw["master_decision"] as Record<string, unknown>)["direction"];
          if (dir === "BUY" || dir === "SELL") {
            if (op["stop_loss"] === null && op["take_profit"] === null) {
              errors.push("SL_AND_TP_REQUIRED_FOR_DIRECTIONAL_ENTRY");
            }
          }
        }
      }
    }

    // ── Bloque 5: adaptive_state
    if (!isObject(raw["adaptive_state"])) {
      errors.push("MISSING_BLOCK:adaptive_state");
    } else {
      const as_ = raw["adaptive_state"] as Record<string, unknown>;
      if (!VALID_PROXIMITY.has(as_["proximity_to_entry"] as ProximityToEntry)) {
        errors.push(`INVALID_PROXIMITY:${String(as_["proximity_to_entry"])}`);
      }
      if (!VALID_RECHECK.has(as_["recheck_minutes"] as number)) {
        errors.push(`INVALID_RECHECK:${String(as_["recheck_minutes"])}`);
      }
      if (!VALID_SCENARIO.has(as_["scenario_classification"] as string)) {
        errors.push(`INVALID_SCENARIO_CLASSIFICATION:${String(as_["scenario_classification"])}`);
      }
    }

    // ── Bloque 6: analyst_observations
    if (!isObject(raw["analyst_observations"])) {
      errors.push("MISSING_BLOCK:analyst_observations");
    } else {
      const ao = raw["analyst_observations"] as Record<string, unknown>;
      if (typeof ao["summary"] !== "string") errors.push("MISSING_FIELD:analyst_observations.summary");
      if (typeof ao["scenario_narrative"] !== "string") errors.push("MISSING_FIELD:analyst_observations.scenario_narrative");
    }

    if (errors.length > 0) {
      return { valid: false, errors, repaired: null };
    }

    return { valid: true, errors: [], repaired: raw as unknown as RespuestaMaestraV3 };
  }
}
