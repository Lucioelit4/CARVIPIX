import type { AIAnalysisRequest, AIAnalysisResponse, AIClientMessageCode, AIDecision } from "./types";

const ALLOWED_DECISIONS: AIDecision[] = [
  "ENTER_BUY",
  "ENTER_SELL",
  "WAIT",
  "MISSED",
  "REJECT_HIGH_RISK",
  "INVALIDATED",
  "DATA_NOT_READY",
];

const ALLOWED_MESSAGE_CODES: AIClientMessageCode[] = [
  "BUY_NOW",
  "SELL_NOW",
  "WAIT_CONFIRMATION",
  "DO_NOT_ENTER",
  "ENTRY_MISSED",
  "HIGH_RISK",
  "SETUP_INVALIDATED",
  "DATA_UNAVAILABLE",
];

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === "string");
}

export function validateAIResponseSchema(input: unknown, request: AIAnalysisRequest): {
  ok: boolean;
  errors: string[];
  response: AIAnalysisResponse | null;
} {
  const errors: string[] = [];

  if (!input || typeof input !== "object") {
    return { ok: false, errors: ["RESPONSE_NOT_OBJECT"], response: null };
  }

  const obj = input as Record<string, unknown>;

  const required: Array<keyof AIAnalysisResponse> = [
    "analysis_id",
    "strategy_id",
    "strategy_version",
    "decision",
    "direction",
    "setup_valid",
    "entry_ready",
    "entry_missed",
    "data_sufficient",
    "levels_match_input",
    "risk_conflict",
    "critical_conflicts",
    "reasons",
    "warnings",
    "confidence",
    "client_message_code",
    "human_review_required",
  ];

  for (const field of required) {
    if (!(field in obj)) {
      errors.push(`MISSING_FIELD:${field}`);
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors, response: null };
  }

  const decision = obj.decision as AIDecision;
  if (!ALLOWED_DECISIONS.includes(decision)) {
    errors.push("DECISION_OUT_OF_CATALOG");
  }

  const messageCode = obj.client_message_code as AIClientMessageCode;
  if (!ALLOWED_MESSAGE_CODES.includes(messageCode)) {
    errors.push("CLIENT_MESSAGE_CODE_OUT_OF_CATALOG");
  }

  if (obj.analysis_id !== request.identity.analysis_id) {
    errors.push("ANALYSIS_ID_MISMATCH");
  }

  if (obj.strategy_id !== request.identity.strategy_id) {
    errors.push("STRATEGY_ID_MISMATCH");
  }

  if (obj.strategy_version !== request.identity.strategy_version) {
    errors.push("STRATEGY_VERSION_MISMATCH");
  }

  if (!isStringArray(obj.critical_conflicts)) {
    errors.push("INVALID_CRITICAL_CONFLICTS");
  }
  if (!isStringArray(obj.reasons)) {
    errors.push("INVALID_REASONS");
  }
  if (!isStringArray(obj.warnings)) {
    errors.push("INVALID_WARNINGS");
  }

  if (typeof obj.confidence !== "number" || obj.confidence < 0 || obj.confidence > 100) {
    errors.push("INVALID_CONFIDENCE_RANGE");
  }

  const boolFields = [
    "setup_valid",
    "entry_ready",
    "entry_missed",
    "data_sufficient",
    "levels_match_input",
    "risk_conflict",
    "human_review_required",
  ] as const;

  for (const field of boolFields) {
    if (typeof obj[field] !== "boolean") {
      errors.push(`INVALID_BOOLEAN_FIELD:${field}`);
    }
  }

  if (request.risk_safety.risk_engine.approved === false && decision !== "REJECT_HIGH_RISK" && decision !== "DATA_NOT_READY") {
    errors.push("RISK_ENGINE_CONTRADICTION");
  }

  if (request.risk_safety.safety_gates.some((gate) => !gate.passed) && decision === "ENTER_BUY") {
    errors.push("SAFETY_GATES_CONTRADICTION");
  }

  if (request.levels.state === "MISSED" && decision !== "MISSED") {
    errors.push("ENTRY_MISSED_CONTRADICTION");
  }

  if (request.data_quality.data_ready === false && decision !== "DATA_NOT_READY") {
    errors.push("DATA_READY_CONTRADICTION");
  }

  if (errors.length > 0) {
    return { ok: false, errors, response: null };
  }

  return {
    ok: true,
    errors: [],
    response: obj as unknown as AIAnalysisResponse,
  };
}
