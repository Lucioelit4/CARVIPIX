/**
 * Verifier V3 — Valida la Respuesta Maestra de ChatGPT
 * Verifica que el JSON recibido cumple el esquema de la Respuesta Maestra V3.
 */

import type {
  RespuestaMaestraV3,
  CadpDecisionContractV3,
  CadpConfidenceV3,
  CadpHorizonV3,
  CadpQualityV3,
  ProximityToEntry,
} from "./typesMaestroV3";

export interface VerifierV3Result {
  valid: boolean;
  errors: string[];
  repaired: RespuestaMaestraV3 | null;
}

const VALID_DECISIONS = new Set<CadpDecisionContractV3>([
  "ENTER_BUY",
  "ENTER_SELL",
  "WAIT",
  "NO_TRADE",
]);

const VALID_HORIZON = new Set<CadpHorizonV3>(["SHORT", "MEDIUM"]);
const VALID_QUALITY = new Set<CadpQualityV3>(["A_PLUS", "A", "B", "NOT_APPLICABLE"]);
const VALID_CONFIDENCE = new Set<CadpConfidenceV3>(["HIGH", "MEDIUM", "LOW"]);

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

    // ── Contract fields (top-level)
    const topDecision = raw["decision"];
    if (!VALID_DECISIONS.has(topDecision as CadpDecisionContractV3)) {
      errors.push(`INVALID_TOP_DECISION:${String(topDecision)}`);
    }

    const topDirection = raw["direction"];
    if (topDirection !== "BUY" && topDirection !== "SELL" && topDirection !== "NEUTRAL") {
      errors.push(`INVALID_TOP_DIRECTION:${String(topDirection)}`);
    }

    if (!VALID_HORIZON.has(raw["horizon"] as CadpHorizonV3)) {
      errors.push(`INVALID_HORIZON:${String(raw["horizon"])}`);
    }

    if (!VALID_QUALITY.has(raw["quality"] as CadpQualityV3)) {
      errors.push(`INVALID_QUALITY:${String(raw["quality"])}`);
    }

    if (!VALID_CONFIDENCE.has(raw["confidence"] as CadpConfidenceV3)) {
      errors.push(`INVALID_CONFIDENCE:${String(raw["confidence"])}`);
    }

    if (!Array.isArray(raw["decisive_evidence"])) {
      errors.push("MISSING_FIELD:decisive_evidence");
    }

    if (!Array.isArray(raw["opposing_evidence"])) {
      errors.push("MISSING_FIELD:opposing_evidence");
    }

    if (!isStringOrNull(raw["critical_veto"])) {
      errors.push("INVALID_FIELD:critical_veto");
    }

    if (!isStringOrNull(raw["missing_condition"])) {
      errors.push("INVALID_FIELD:missing_condition");
    }

    if (typeof raw["technical_explanation"] !== "string" || String(raw["technical_explanation"]).trim().length < 10) {
      errors.push("INVALID_FIELD:technical_explanation");
    }

    if (typeof raw["public_explanation"] !== "string" || String(raw["public_explanation"]).trim().length < 10) {
      errors.push("INVALID_FIELD:public_explanation");
    }

    // ── Bloque 1: master_decision
    if (!isObject(raw["master_decision"])) {
      errors.push("MISSING_BLOCK:master_decision");
    } else {
      const md = raw["master_decision"] as Record<string, unknown>;
      if (!VALID_DECISIONS.has(md["decision"] as CadpDecisionContractV3)) {
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

    const requiresOrderPlan = decision === "ENTER_BUY" || decision === "ENTER_SELL";

    if (requiresOrderPlan) {
      if (!isObject(raw["order_plan"])) {
        errors.push("MISSING_BLOCK:order_plan (required for ENTER/CONDITIONAL)");
      } else {
        const op = raw["order_plan"] as Record<string, unknown>;
        if (!isNumberOrNull(op["stop_loss"])) errors.push("MISSING_FIELD:order_plan.stop_loss");
        if (!isNumberOrNull(op["take_profit"])) errors.push("MISSING_FIELD:order_plan.take_profit");
        const hasEntryPrice = typeof op["entry_price"] === "number";
        const hasEntryZone = typeof op["entry_zone_min"] === "number" && typeof op["entry_zone_max"] === "number";
        if (!hasEntryPrice && !hasEntryZone) errors.push("ENTRY_PRICE_OR_ZONE_REQUIRED");
        if (isObject(raw["master_decision"])) {
          const dir = (raw["master_decision"] as Record<string, unknown>)["direction"];
          if (dir === "BUY" || dir === "SELL") {
            if (op["stop_loss"] === null && op["take_profit"] === null) {
              errors.push("SL_AND_TP_REQUIRED_FOR_DIRECTIONAL_ENTRY");
            }
          }
        }
      }
    } else if (raw["order_plan"] !== null) {
      errors.push("ORDER_PLAN_MUST_BE_NULL_FOR_NON_ENTRY");
    }

    if (decision === "ENTER_BUY" || decision === "ENTER_SELL") {
      if (typeof raw["entry_price"] !== "number") errors.push("ENTRY_PRICE_REQUIRED_FOR_ENTRY");
      if (typeof raw["stop_loss"] !== "number") errors.push("STOP_LOSS_REQUIRED_FOR_ENTRY");
      if (typeof raw["take_profit"] !== "number") errors.push("TAKE_PROFIT_REQUIRED_FOR_ENTRY");
      if (typeof raw["risk_reward"] !== "number") errors.push("RISK_REWARD_REQUIRED_FOR_ENTRY");
      if (raw["quality"] === "NOT_APPLICABLE") errors.push("QUALITY_NOT_APPLICABLE_NOT_ALLOWED_FOR_ENTRY");
      if (raw["critical_veto"] !== null) errors.push("CRITICAL_VETO_MUST_BE_NULL_FOR_ENTRY");
      if (raw["missing_condition"] !== null) errors.push("MISSING_CONDITION_MUST_BE_NULL_FOR_ENTRY");
      if (raw["direction"] !== "BUY" && raw["direction"] !== "SELL") errors.push("ENTRY_REQUIRES_DIRECTIONAL_SIDE");
    }

    if (decision === "WAIT") {
      if (typeof raw["missing_condition"] !== "string" || String(raw["missing_condition"]).trim().length < 10) {
        errors.push("WAIT_REQUIRES_CONCRETE_MISSING_CONDITION");
      }
      if (raw["critical_veto"] !== null) errors.push("WAIT_CRITICAL_VETO_MUST_BE_NULL");
      if (raw["quality"] === "NOT_APPLICABLE") errors.push("WAIT_QUALITY_NOT_APPLICABLE_FORBIDDEN");
    }

    if (decision === "NO_TRADE") {
      if (typeof raw["critical_veto"] !== "string" || String(raw["critical_veto"]).trim().length < 5) {
        errors.push("NO_TRADE_REQUIRES_CRITICAL_VETO");
      }
      if (raw["quality"] !== "NOT_APPLICABLE") errors.push("NO_TRADE_REQUIRES_NOT_APPLICABLE_QUALITY");
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

    // ── Contract/Nested consistency
    if (isObject(raw["master_decision"])) {
      const md = raw["master_decision"] as Record<string, unknown>;
      if (raw["decision"] !== md["decision"]) {
        errors.push("DECISION_MISMATCH_TOP_VS_MASTER");
      }
      if (raw["direction"] !== md["direction"]) {
        errors.push("DIRECTION_MISMATCH_TOP_VS_MASTER");
      }
    }

    if (isObject(raw["analysis_private"])) {
      const ap = raw["analysis_private"] as Record<string, unknown>;
      if (Array.isArray(raw["decisive_evidence"]) && Array.isArray(ap["decisive_evidence"])) {
        if ((raw["decisive_evidence"] as unknown[]).length === 0 && (ap["decisive_evidence"] as unknown[]).length > 0) {
          errors.push("DECISIVE_EVIDENCE_TOP_EMPTY");
        }
      }
      if (Array.isArray(raw["opposing_evidence"]) && Array.isArray(ap["opposing_evidence"])) {
        if ((raw["opposing_evidence"] as unknown[]).length === 0 && (ap["opposing_evidence"] as unknown[]).length > 0) {
          errors.push("OPPOSING_EVIDENCE_TOP_EMPTY");
        }
      }
    }

    if (errors.length > 0) {
      return { valid: false, errors, repaired: null };
    }

    return { valid: true, errors: [], repaired: raw as unknown as RespuestaMaestraV3 };
  }
}
