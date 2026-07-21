import { createHash } from "crypto";
import type { ExpedienteMaestroV3, RespuestaMaestraV3 } from "@/app/ai/cadpV2/typesMaestroV3";
import type { CommunityContent, CommunityMarketDossier, CommunityPublicationType } from "./types";

const PROHIBITED_KEYS = new Set([
  "decision",
  "direction",
  "entry",
  "entry_price",
  "entry_zone_min",
  "entry_zone_max",
  "stop_loss",
  "take_profit",
  "order_plan",
  "signal_id",
  "analysis_private",
]);

function inferRisk(response: RespuestaMaestraV3, expediente: ExpedienteMaestroV3): CommunityMarketDossier["risk_level"] {
  if (
    response.analysis_public.action_taken === "RISK_BLOCK" ||
    expediente.news_and_risk.events_within_operation_window.some((event) => event.impact === "HIGH")
  ) {
    return "HIGH";
  }
  return response.master_decision.conviction === "LOW" ? "MEDIUM" : "LOW";
}

function inferVolatility(expediente: ExpedienteMaestroV3): CommunityMarketDossier["volatility"] {
  const percentile = expediente.volatility_and_session.atr_h1_percentile;
  if (percentile >= 75) return "HIGH";
  if (percentile <= 25) return "LOW";
  return "NORMAL";
}

export function buildCommunityMarketDossier(
  response: RespuestaMaestraV3,
  expediente: ExpedienteMaestroV3,
): CommunityMarketDossier {
  const analysisId = expediente.identity.analysis_id;
  const dossierHash = createHash("sha256")
    .update(`${analysisId}:${expediente.identity.snapshot_hash}`)
    .digest("hex")
    .slice(0, 20);

  const dossier: CommunityMarketDossier = {
    dossier_id: `CMD-${dossierHash}`,
    analysis_id: analysisId,
    asset: expediente.identity.canonical_symbol,
    market_state: response.analysis_public.market_visual_state,
    context: response.analysis_public.public_summary,
    reasons: [...response.analysis_public.supporting_facts],
    scenarios: [
      response.analyst_observations.scenario_narrative,
      ...response.adaptive_state.watch_conditions.map((item) => item.condition),
    ].filter(Boolean),
    risk_level: inferRisk(response, expediente),
    volatility: inferVolatility(expediente),
    relevant_news: expediente.news_and_risk.events_within_operation_window.map((event) => ({
      event_name: event.event_name,
      scheduled_iso:
        expediente.news_and_risk.events.find((item) => item.event_id === event.event_id)?.scheduled_iso ??
        expediente.identity.timestamp_iso,
      impact: event.impact,
    })),
    scenario_classification: response.adaptive_state.scenario_classification,
    timestamp: expediente.identity.timestamp_iso,
    editorial: {
      category_hint:
        response.master_decision.decision === "NO_TRADE" || response.master_decision.decision === "WAIT"
          ? "NO_TRADE_WAIT"
          : undefined,
      source: "ANALYSIS_PUBLIC",
      material_change:
        response.analysis_public.action_taken === "RISK_BLOCK" ||
        expediente.news_and_risk.events_within_operation_window.some((event) => event.impact === "HIGH"),
      reason: response.analysis_public.public_summary,
    },
  };

  assertCommunitySafePayload(dossier);
  return dossier;
}

export function assertCommunitySafePayload(value: unknown): void {
  const visit = (current: unknown, path: string): void => {
    if (Array.isArray(current)) {
      current.forEach((item, index) => visit(item, `${path}[${index}]`));
      return;
    }
    if (!current || typeof current !== "object") return;

    for (const [key, child] of Object.entries(current)) {
      if (PROHIBITED_KEYS.has(key.toLowerCase())) {
        throw new Error(`COMMUNITY_FORBIDDEN_FIELD:${path}.${key}`);
      }
      visit(child, `${path}.${key}`);
    }
  };

  visit(value, "payload");
}

const OPERATIONAL_LANGUAGE = [
  /\bBUY\b/i,
  /\bSELL\b/i,
  /\bCOMPR(?:A|AR|EN)\b/i,
  /\bVEND(?:E|ER|AN)\b/i,
  /\bENTRY\b/i,
  /\bENTRADA\b/i,
  /\bCERR(?:AR|ARLA|ARLO|AMOS)\b/i,
  /\bSALIR\b/i,
  /\bMOVER\s+(?:EL\s+)?SL\b/i,
  /\bREDUCIR\s+(?:LA\s+)?POSICI[OÓ]N\b/i,
  /\bAGREGAR\s+LOTAJE\b/i,
  /\bVOLVER\s+A\s+ENTRAR\b/i,
  /\bASEGURAR\s+GANANCIAS\b/i,
  /\bSTOP\s*LOSS\b/i,
  /\bTAKE\s*PROFIT\b/i,
  /\bSL\b/i,
  /\bTP\b/i,
];

const REQUIRED_DISCLAIMER = "Contenido informativo. No representa una alerta oficial ni una recomendación operativa.";
const ACTIVE_OPERATION_TEXT = "La operación continúa activa conforme a los niveles oficiales publicados.";

export function assertCommunityContentSafe(
  content: CommunityContent,
  category: CommunityPublicationType = content.type,
  officialStatus?: CommunityMarketDossier["editorial"]["official_status"],
): void {
  assertCommunitySafePayload(content);
  const text = `${content.title}\n${content.body}`;
  const activeOperationAllowed = category === "ACTIVE_OPERATION" && content.body.trim() === ACTIVE_OPERATION_TEXT;
  const officialResultAllowed =
    category === "OFFICIAL_RESULT" &&
    (officialStatus === "TP_HIT" || officialStatus === "SL_HIT" || officialStatus === "CLOSED");
  const forbidden = OPERATIONAL_LANGUAGE.some((pattern) => {
    if (activeOperationAllowed) return false;
    if (officialResultAllowed && (/\\bTP\\b/i.test(pattern.source) || /\\bSL\\b/i.test(pattern.source) || /TAKE|STOP/i.test(pattern.source))) {
      return false;
    }
    return pattern.test(text);
  });
  if (forbidden) {
    throw new Error("COMMUNITY_FORBIDDEN_TRADING_CLAIM");
  }
  if (category !== "OFFICIAL_RESULT" && content.disclaimer.trim() !== REQUIRED_DISCLAIMER) {
    throw new Error("COMMUNITY_REQUIRED_DISCLAIMER_MISSING");
  }
}

export { ACTIVE_OPERATION_TEXT, REQUIRED_DISCLAIMER };